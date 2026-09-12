import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

print("=== Auditing all Test 2 answers for word count and slash noise ===")
for p_num in range(1, 4):
    f_path = os.path.join(out_dir, f'test_02_passage_{p_num}.json')
    with open(f_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"\n--- Test 2 Passage {p_num} ---")
    for g in data['question_groups']:
        g_type = g['question_type']
        for q in g['questions']:
            ans = q['correctAnswer']
            print(f"  Q{q['questionNo']:<2} [{g_type:<23}] -> {repr(ans)}")
