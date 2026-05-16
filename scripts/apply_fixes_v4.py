
import json
import sys
import os

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
output_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master_fixed.json'

def apply_fixes(fixes_path):
    if not os.path.exists(fixes_path):
        print(f"Fixes file not found: {fixes_path}")
        return

    with open(fixes_path, 'r', encoding='utf-8') as f:
        fixes = json.load(f)
    
    fix_map = {}
    for fix in fixes:
        fix_map[(fix['word'], fix['old_example'].strip())] = (fix['new_example'], fix['new_translation'])
    
    with open(master_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    applied_count = 0
    for item in data:
        word = item.get('word', '')
        for meaning in item.get('meanings', []):
            example = meaning.get('example', '').strip()
            if (word, example) in fix_map:
                new_ex, new_trans = fix_map[(word, example)]
                meaning['example'] = new_ex
                meaning['translation'] = new_trans
                applied_count += 1
    
    print(f"Applied {applied_count} fixes from {fixes_path}.")
    
    with open(master_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python apply_fixes.py <fixes_file_path>")
    else:
        apply_fixes(sys.argv[1])
