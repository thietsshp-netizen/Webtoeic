
import json
import os

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
file2 = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/CacTuCoVidudai.json'

def count_words(text):
    return len(text.split())

def reintegrate():
    if not os.path.exists(file2):
        print(f"File 2 not found: {file2}")
        return

    with open(file2, 'r', encoding='utf-8') as f:
        problematic_data = json.load(f)
    
    if not os.path.exists(master_file):
        master_data = []
    else:
        with open(master_file, 'r', encoding='utf-8') as f:
            master_data = json.load(f)
    
    fixed = []
    still_problematic = []
    
    for item in problematic_data:
        has_problem = False
        for m in item.get('meanings', []):
            if count_words(m.get('example', '')) > 13:
                has_problem = True
                break
        
        if not has_problem:
            fixed.append(item)
        else:
            still_problematic.append(item)
    
    if not fixed:
        print("No fixed entries found in File 2.")
        return

    # Add fixed items to master
    master_data.extend(fixed)
    
    # Save master
    with open(master_file, 'w', encoding='utf-8') as f:
        json.dump(master_data, f, ensure_ascii=False, indent=2)
    
    # Save remaining problematic items to file 2
    with open(file2, 'w', encoding='utf-8') as f:
        json.dump(still_problematic, f, ensure_ascii=False, indent=2)

    print(f"Reintegration complete.")
    print(f"Moved {len(fixed)} entries back to master file.")
    print(f"File 2 (CacTuCoVidudai.json) now has {len(still_problematic)} entries remaining.")

if __name__ == "__main__":
    reintegrate()
