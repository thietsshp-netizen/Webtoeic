import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.endswith('.json') and f.startswith('test_')])

single_group_files = []
multi_group_files = []

for f in files:
    path = os.path.join(out_dir, f)
    with open(path, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    groups = data.get('question_groups', [])
    if len(groups) <= 1:
        single_group_files.append(f)
    else:
        multi_group_files.append(f)

print(f"Total IDP files: {len(files)}")
print(f"Multi-group files (Properly grouped): {len(multi_group_files)}")
print(f"Single-group files (Need proper grouping): {len(single_group_files)}")
print("\nFiles needing proper question grouping:", single_group_files[:15])
