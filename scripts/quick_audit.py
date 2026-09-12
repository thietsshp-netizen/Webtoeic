import os, json, re

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.startswith('test_') and f.endswith('.json')])

clean_count = 0
for filename in files:
    filepath = os.path.join(out_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    passages = data.get('passages', [])
    if not passages: continue
    t_map = passages[0].get('translation_map', {})
    q_groups = data.get('question_groups', [])
    
    # Check if this file has > 5 sents and no noise in answer
    if len(t_map) >= 5:
        has_noise = False
        for g in q_groups:
            for q in g.get('questions', []):
                ans = q.get('correctAnswer')
                if re.match(r'^\d+\s+', str(ans)):
                    has_noise = True
        if not has_noise:
            clean_count += 1

print(f"Clean & Perfect JSON files: {clean_count} / {len(files)}")
