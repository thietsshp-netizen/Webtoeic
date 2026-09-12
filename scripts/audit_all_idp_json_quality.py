import os, json, re

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

files = sorted([f for f in os.listdir(out_dir) if f.startswith('test_') and f.endswith('.json')])

print(f"=== Auditing all {len(files)} IDP Reading JSON files in {out_dir} ===\n")

issues_found = []

for filename in files:
    filepath = os.path.join(out_dir, filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        issues_found.append(f"{filename}: Invalid JSON - {e}")
        continue

    test_id = data.get('test_id')
    p_num = data.get('passage_number')
    p_title = data.get('passage_title')

    passages = data.get('passages', [])
    if not passages:
        issues_found.append(f"{filename}: Missing 'passages' field!")
        continue

    p0 = passages[0]
    html = p0.get('html_content', '')
    t_map = p0.get('translation_map', {})

    # Check sentence count
    num_sents = len(t_map)
    if num_sents < 5:
        issues_found.append(f"{filename}: Too few sentences in passage ({num_sents} sents) - Truncated passage!")

    # Check for question text bleeding into html_content
    if 'Questions 1' in html or 'Questions 14' in html or 'Questions 27' in html or 'Choose the correct' in html:
        issues_found.append(f"{filename}: Question text leaked into html_content!")

    # Audit question groups
    q_groups = data.get('question_groups', [])
    if not q_groups:
        issues_found.append(f"{filename}: Missing 'question_groups'!")
        continue

    for g in q_groups:
        q_type = g.get('question_type')
        for q in g.get('questions', []):
            q_num = q.get('questionNo')
            ans = q.get('correctAnswer')
            
            if ans is None or str(ans).strip() == '':
                issues_found.append(f"{filename} Q{q_num}: Empty correctAnswer!")
            elif re.match(r'^\d+\s+', str(ans)):
                issues_found.append(f"{filename} Q{q_num}: Answer contains prefix number noise '{ans}'!")
                
            ev_sids = q.get('evidence_sids', [])
            if not ev_sids or ev_sids == ['p1-s1'] and num_sents > 10 and p_num == 1:
                # Potential fallback sid
                pass

if not issues_found:
    print("SUCCESS: All JSON files passed quality audit with 0 errors!")
else:
    print(f"Found {len(issues_found)} issues across JSON files:")
    for issue in issues_found[:30]:
        print(f"  ❌ {issue}")
    if len(issues_found) > 30:
        print(f"  ... and {len(issues_found) - 30} more issues.")
