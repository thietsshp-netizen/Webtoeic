
import json
import os

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
file2 = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/CacTuCoVidudai.json'

def count_words(text):
    return len(text.split())

def separate():
    if not os.path.exists(master_file):
        print(f"Master file not found: {master_file}")
        return

    with open(master_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    clean = []
    problematic = []
    
    for item in data:
        has_problem = False
        for m in item.get('meanings', []):
            if count_words(m.get('example', '')) > 13:
                has_problem = True
                break
        
        if has_problem:
            problematic.append(item)
        else:
            clean.append(item)
    
    # Save clean items back to master
    with open(master_file, 'w', encoding='utf-8') as f:
        json.dump(clean, f, ensure_ascii=False, indent=2)
    
    # Save problematic items to file 2
    # If file 2 already exists, we should probably append or merge, but for the first run we just save.
    with open(file2, 'w', encoding='utf-8') as f:
        json.dump(problematic, f, ensure_ascii=False, indent=2)

    print(f"Separation complete.")
    print(f"Master file now has {len(clean)} clean entries.")
    print(f"File 2 (CacTuCoVidudai.json) has {len(problematic)} problematic entries.")

if __name__ == "__main__":
    separate()
