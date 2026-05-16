
import json
import os

master_path = "/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json"
batch_path = "/Users/thietphamvan/hoctoeic/Webtoeic/scripts/batch_11.json"

with open(master_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

problematic = []
for entry in data:
    word = entry.get('word', '')
    meanings = entry.get('meanings', [])
    for meaning in meanings:
        example = meaning.get('example', '')
        words = example.split()
        if len(words) > 13:
            problematic.append({
                "word": word,
                "example": example,
                "translation": meaning.get('translation'),
                "definition": meaning.get('definition')
            })

batch = problematic[:300]

with open(batch_path, 'w', encoding='utf-8') as f:
    json.dump(batch, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(batch)} items to {batch_path}")
print(f"Total problematic found: {len(problematic)}")
