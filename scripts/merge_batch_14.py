
import json

files = ['scripts/fixes_batch_14_a.json', 'scripts/fixes_batch_14_b.json', 'scripts/fixes_batch_14_c.json']
merged = []

for f in files:
    with open(f, 'r', encoding='utf-8') as infile:
        merged.extend(json.load(infile))

with open('scripts/fixes_batch_14.json', 'w', encoding='utf-8') as outfile:
    json.dump(merged, outfile, ensure_ascii=False, indent=2)

print(f"Successfully merged {len(merged)} fixes into scripts/fixes_batch_14.json")
