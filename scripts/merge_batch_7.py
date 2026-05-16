
import json

files = [
    '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/fixes_batch_7_a.json',
    '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/fixes_batch_7_b.json',
    '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/fixes_batch_7_c.json'
]
output_file = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/fixes_batch_7.json'

def merge():
    all_fixes = []
    for f_path in files:
        with open(f_path, 'r', encoding='utf-8') as f:
            all_fixes.extend(json.load(f))
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_fixes, f, ensure_ascii=False, indent=2)
    print(f"Merged {len(all_fixes)} fixes into {output_file}")

if __name__ == "__main__":
    merge()
