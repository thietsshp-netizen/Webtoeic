import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.endswith('.json')])

missing_list = []

for f in files:
    path = os.path.join(out_dir, f)
    with open(path, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    
    groups = data.get('question_groups', [])
    for g_idx, g in enumerate(groups, 1):
        for q in g.get('questions', []):
            ca = q.get('correctAnswer')
            qn = q.get('questionNo')
            if ca is None or ca == "" or ca == []:
                missing_list.append({
                    "file": f,
                    "group_id": g_idx,
                    "group_type": g.get('question_type'),
                    "questionNo": qn
                })

print(f"=== AUDIT FOR MISSING CORRECT ANSWERS IN {len(files)} FILES ===")
print(f"Total questions missing correctAnswer: {len(missing_list)}")
if missing_list:
    print("\nDetailed list of questions missing correctAnswer:")
    for item in missing_list:
        print(f"  File: {item['file']} | Q{item['questionNo']} (Group {item['group_id']}: {item['group_type']})")
else:
    print("ALL QUESTIONS IN ALL 129 FILES HAVE VALID NON-EMPTY CORRECT ANSWERS!")
