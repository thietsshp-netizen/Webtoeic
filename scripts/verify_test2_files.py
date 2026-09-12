import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
test2_files = sorted([f for f in os.listdir(out_dir) if f.startswith('test_02_')])

print(f"=== Verification of TEST 2 JSON files ===")
for f in test2_files:
    path = os.path.join(out_dir, f)
    with open(path, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    p = data['passages'][0]
    q_count = sum(len(g['questions']) for g in data['question_groups'])
    print(f"  {f:<22} | Title: {repr(data.get('passage_title')):<35} | Sents: {len(p['translation_map']):<2} | Questions: {q_count}")
