import json, re

# Check passage sentences of test_01_passage_1
with open('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output/test_01_passage_1.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

p = d['passages'][0]
t_map = p['translation_map']

print("=== Passage Sentences (First 15) ===")
for sid, vi in list(t_map.items())[:15]:
    print(f"  {sid}: {repr(vi[:70])}")
