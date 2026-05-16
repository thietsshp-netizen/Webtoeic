
import json
import os

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
fixes_dir = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/'

def debug_mismatch():
    fix_map = {}
    for part in ['a', 'b', 'c', 'd']:
        file_path = os.path.join(fixes_dir, f'fixes_batch_2_{part}.json')
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                fixes = json.load(f)
                for fix in fixes:
                    fix_map[(fix['word'], fix['old_example'])] = fix['new_example']
    
    with open(master_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    found_map = {}
    for item in data:
        word = item.get('word', '')
        for meaning in item.get('meanings', []):
            example = meaning.get('example', '')
            if (word, example) in fix_map:
                found_map[(word, example)] = True
    
    for (word, example) in fix_map:
        if (word, example) not in found_map:
            print(f"Mismatch: {word} | {example[:30]}...")

if __name__ == "__main__":
    debug_mismatch()
