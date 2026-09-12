import os, json, pypdf, re

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'

# Manual exact answers extracted directly from PDF answer keys
EXACT_FIXES = {
    "test_06_passage_1.json": {
        1: "C", 4: "E", 5: "B", 6: "D", 7: "A", 8: "F", 9: "C", 10: "NO", 11: "YES", 12: "NO", 13: "NOT GIVEN"
    },
    "test_07_passage_3.json": { 31: "NOT GIVEN" },
    "test_08_passage_3.json": { 31: "iii" },
    "test_12_passage_3.json": { 31: "TRUE" },
    "test_13_passage_3.json": { 31: "vii" },
    "test_15_passage_3.json": { 31: "ii" },
    "test_18_passage_3.json": { 31: "YES" },
    "test_19_passage_3.json": { 31: "water supplies" },
    "test_20_passage_3.json": { 31: "iv" },
    "bc_test_07_passage_1.json": { 11: "TRUE" },
    "bc_test_07_passage_2.json": { 15: "B" },
    "bc_test_08_passage_3.json": { 31: "v" }
}

for fn, q_answers in EXACT_FIXES.items():
    path = os.path.join(OUT_DIR, fn)
    if not os.path.exists(path): continue

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for g in data.get('question_groups', []):
        for q in g.get('questions', []):
            qn = q.get('questionNo')
            if qn in q_answers:
                q['correctAnswer'] = q_answers[qn]
                q['explanation']['why_correct'] = f"Đáp án chuẩn trích xuất từ PDF là \"{q_answers[qn]}\"."

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Patched 100% exact answers for {fn}")

print("Done patching final 22 missing answers!")
