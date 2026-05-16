
import json

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
fixes_file = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/fixes_batch_1.json'
output_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master_fixed.json'

def apply_fixes():
    with open(fixes_file, 'r', encoding='utf-8') as f:
        fixes = json.load(f)
    
    # Create a mapping for faster lookup
    # key: (word, old_example), value: (new_example, new_translation)
    fix_map = {}
    for fix in fixes:
        fix_map[(fix['word'], fix['old_example'])] = (fix['new_example'], fix['new_translation'])
    
    with open(master_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    applied_count = 0
    for item in data:
        word = item.get('word', '')
        for meaning in item.get('meanings', []):
            example = meaning.get('example', '')
            if (word, example) in fix_map:
                new_ex, new_trans = fix_map[(word, example)]
                meaning['example'] = new_ex
                meaning['translation'] = new_trans
                applied_count += 1
    
    print(f"Applied {applied_count} fixes.")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    apply_fixes()
