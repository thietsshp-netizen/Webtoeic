
import json
import os

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
output_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master_fixed.json'
fixes_dir = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/'

def apply_fixes():
    # Load all fix files for batch 2
    fix_map = {}
    for part in ['a', 'b', 'c', 'd']:
        file_path = os.path.join(fixes_dir, f'fixes_batch_2_{part}.json')
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                fixes = json.load(f)
                for fix in fixes:
                    fix_map[(fix['word'], fix['old_example'])] = (fix['new_example'], fix['new_translation'])
    
    print(f"Loaded {len(fix_map)} fixes from Batch 2.")
    
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
    
    print(f"Applied {applied_count} fixes to master data.")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    apply_fixes()
