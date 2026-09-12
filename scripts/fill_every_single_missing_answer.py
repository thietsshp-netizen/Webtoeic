import os, sys, re, json, pypdf

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

files = sorted([f for f in os.listdir(OUT_DIR) if f.endswith('.json')])

for f in files:
    path = os.path.join(OUT_DIR, f)
    with open(path, 'r', encoding='utf-8') as fp:
        data = json.load(fp)

    test_idx = data.get('test_id')
    if not test_idx: continue

    pdf_path = os.path.join(SPLIT_DIR, f"idp_test_{test_idx:02d}.pdf")
    if not os.path.exists(pdf_path): continue

    reader = pypdf.PdfReader(pdf_path)
    full_pdf_text = "\n".join([p.extract_text() for p in reader.pages[-2:]])

    updated = False
    for g in data.get('question_groups', []):
        for q in g.get('questions', []):
            ca = q.get('correctAnswer')
            qn = q.get('questionNo')
            if ca is None or ca == "" or ca == []:
                # Try finding exact question number answer in PDF text
                m = re.search(rf'\b{qn}\s*[\.\:\-\s]+([A-Za-z0-9\/\(\)\s\-\,\'\.]+)', full_pdf_text)
                if m:
                    raw_a = m.group(1).split('\n')[0].strip()
                    # Clean answer
                    if '/' in raw_a: raw_a = raw_a.split('/')[0].strip()
                    raw_a = re.sub(r'\([^\)]*\)', '', raw_a).strip()
                    up = raw_a.upper()
                    if 'NOT GIVEN' in up: raw_a = 'NOT GIVEN'
                    elif 'TRUE' in up: raw_a = 'TRUE'
                    elif 'FALSE' in up: raw_a = 'FALSE'
                    elif 'YES' in up: raw_a = 'YES'
                    elif 'NO' in up: raw_a = 'NO'

                    q['correctAnswer'] = raw_a
                    q['explanation']['why_correct'] = f"Đáp án đúng theo PDF là \"{raw_a}\"."
                    updated = True

    if updated:
        with open(path, 'w', encoding='utf-8') as fp:
            json.dump(data, fp, ensure_ascii=False, indent=2)
        print(f"Fixed remaining missing answers for {f}")

print("Done filling all remaining missing answers!")
