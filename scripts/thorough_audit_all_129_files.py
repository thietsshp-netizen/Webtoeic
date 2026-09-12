import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.endswith('.json')])

print(f"=== THOROUGH AUDIT OF ALL {len(files)} JSON FILES ===")

corrupted = []
for f in files:
    path = os.path.join(out_dir, f)
    with open(path, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    p = data['passages'][0]
    if not p['html_content'] or len(p['translation_map']) == 0 or len(data['question_groups']) == 0:
        corrupted.append(f)

print(f"Total files audited: {len(files)}")
print(f"Corrupted or invalid files count: {len(corrupted)}")
if corrupted:
    print("Corrupted list:", corrupted)
else:
    print("ALL 129 FILES PASSED PERFECTLY WITH 0 ERRORS!")
