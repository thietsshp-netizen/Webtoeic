import os, sys, re, json, pypdf

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

def clean_answer_text(cln_a):
    cln_a = re.sub(r'^\d{1,2}\s+', '', cln_a).strip()
    up = cln_a.upper()
    if up in ['NOT GIVEN', 'NOTGIVEN']: return 'NOT GIVEN'
    if up in ['TRUE', 'TURE']: return 'TRUE'
    if up in ['FALSE', 'FALS']: return 'FALSE'
    if up in ['YES', 'Y ES']: return 'YES'
    if up in ['NO', 'N O']: return 'NO'
    if '/' in cln_a: cln_a = cln_a.split('/')[0].strip()
    cln_a = re.sub(r'\([^\)]*\)', '', cln_a).strip()
    return cln_a

def extract_answers_from_pdf(pdf_path):
    if not os.path.exists(pdf_path): return {}
    reader = pypdf.PdfReader(pdf_path)
    ans_txt = reader.pages[-1].extract_text()
    if len(reader.pages) > 1 and ('Reading Test' in reader.pages[-2].extract_text() or 'Section' in reader.pages[-2].extract_text()):
        ans_txt = reader.pages[-2].extract_text() + "\n" + ans_txt

    matches = re.findall(r'(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', ans_txt)
    ans_map = {}
    for q_str, a_str in matches:
        qn = int(q_str)
        ca = clean_answer_text(a_str)
        if 1 <= qn <= 40 and ca:
            ans_map[qn] = ca
    return ans_map

print("=== Fixing missing answers for IDP Tests 6 to 34 ===")

for t in range(6, 35):
    pdf_path = os.path.join(SPLIT_DIR, f"idp_test_{t:02d}.pdf")
    ans_map = extract_answers_from_pdf(pdf_path)
    if not ans_map: continue

    for p_num in range(1, 4):
        fn = f"test_{t:02d}_passage_{p_num}.json"
        path = os.path.join(OUT_DIR, fn)
        if not os.path.exists(path): continue

        # Don't touch benchmark handcrafted files
        if t in [1, 2, 3, 4, 5] or (t == 6 and p_num == 2) or (t == 10 and p_num == 1) or (t == 21 and p_num == 3):
            continue

        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        updated = False
        for g in data.get('question_groups', []):
            for q in g.get('questions', []):
                ca = q.get('correctAnswer')
                qn = q.get('questionNo')
                if (ca is None or ca == "" or ca == []) and qn in ans_map:
                    q['correctAnswer'] = ans_map[qn]
                    # Also update explanation
                    q['explanation']['why_correct'] = f"Đáp án đúng theo PDF là \"{ans_map[qn]}\"."
                    updated = True

        if updated:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Fixed missing answers in {fn}")

print("Finished fixing missing answers!")
