
import json
import os

batch_dir = "/Users/thietphamvan/hoctoeic/Webtoeic/scripts"
parts = ["fixes_batch_10_a.json", "fixes_batch_10_b.json", "fixes_batch_10_c.json"]
merged_fixes = []

for part in parts:
    path = os.path.join(batch_dir, part)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            merged_fixes.extend(data)
            print(f"Loaded {len(data)} items from {part}")

output_path = os.path.join(batch_dir, "fixes_batch_10.json")
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(merged_fixes, f, ensure_ascii=False, indent=2)

print(f"Merged {len(merged_fixes)} items to {output_path}")
