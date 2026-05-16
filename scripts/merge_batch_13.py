
import json

files = [
    'fixes_batch_13_a.json',
    'fixes_batch_13_b.json',
    'fixes_batch_13_c.json'
]

all_fixes = []
for f in files:
    with open(f, 'r', encoding='utf-8') as infile:
        data = json.load(infile)
        all_fixes.extend(data)

with open('fixes_batch_13.json', 'w', encoding='utf-8') as outfile:
    json.dump(all_fixes, outfile, ensure_ascii=False, indent=2)

print(f"Merged {len(all_fixes)} fixes into fixes_batch_13.json")
