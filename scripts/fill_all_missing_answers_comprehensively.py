import os, sys, re, json, pypdf

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

def clean_ans(s):
    if not s: return ""
    s = re.sub(r'^\d{1,2}\s+', '', s).strip()
    up = s.upper()
    if up in ['NOT GIVEN', 'NOTGIVEN']: return 'NOT GIVEN'
    if up in ['TRUE', 'TURE']: return 'TRUE'
    if up in ['FALSE', 'FALS']: return 'FALSE'
    if up in ['YES', 'Y ES']: return 'YES'
    if up in ['NO', 'N O']: return 'NO'
    if '/' in s: s = s.split('/')[0].strip()
    s = re.sub(r'\([^\)]*\)', '', s).strip()
    return s

def extract_full_ans_map(pdf_path):
    if not os.path.exists(pdf_path): return {}
    reader = pypdf.PdfReader(pdf_path)
    ans_txt = ""
    # Extract last 2 pages
    for p in reader.pages[-2:]:
        ans_txt += p.extract_text() + "\n"

    ans_map = {}
    # Scan for number + answer pattern
    for line in ans_txt.split('\n'):
        tokens = re.findall(r'(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', line)
        for qn_str, a_str in tokens:
            qn = int(qn_str)
            ca = clean_ans(a_str)
            if 1 <= qn <= 40 and ca and qn not in ans_map:
                ans_map[qn] = ca

    # Secondary scan if missing
    for qn in range(1, 41):
        if qn not in ans_map:
            m = re.search(rf'\b{qn}\s+([A-Z0-9\/\(\)\-\,\'\.]+)\b', ans_txt, re.I)
            if m:
                ans_map[qn] = clean_ans(m.group(1))

    return ans_map

print("=== Combing all 34 IDP PDFs to fill remaining missing answers ===")
for t in range(1, 35):
    pdf_path = os.path.join(SPLIT_DIR, f"idp_test_{t:02d}.pdf")
    ans_map = extract_full_ans_map(pdf_path)

    for p_num in range(1, 4):
        fn = f"test_{t:02d}_passage_{p_num}.json"
        path = os.path.join(OUT_DIR, fn)
        if not os.path.exists(path): continue

        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        updated = False
        for g in data.get('question_groups', []):
            for q in g.get('questions', []):
                ca = q.get('correctAnswer')
                qn = q.get('questionNo')
                if (ca is None or ca == "" or ca == []) and qn in ans_map:
                    q['correctAnswer'] = ans_map[qn]
                    q['explanation']['why_correct'] = f"Đáp án đúng theo PDF là \"{ans_map[qn]}\"."
                    updated = True

        if updated:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Successfully filled missing answers for {fn}")

print("Completed comprehensive answer filling!")
