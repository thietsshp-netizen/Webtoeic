import os, json, pypdf, re

bc_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/BO 9 DE THI THAT CUA BRITISH COUNCIL'
out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

print("=== Regenerating 27 British Council Reading JSON files ===")

# Check if there are saved BC json backups in trash or appDataDir
import glob
print("Checking for existing BC JSON files in workspace...")
found_bc = glob.glob('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/**/bc_test_*.json', recursive=True)
print(f"Found {len(found_bc)} backup BC JSON files!")

if found_bc:
    for src in found_bc:
        fname = os.path.basename(src)
        dst = os.path.join(out_dir, fname)
        with open(src, 'r', encoding='utf-8') as f:
            d = json.load(f)
        with open(dst, 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
    print(f"Restored {len(found_bc)} British Council JSON files cleanly!")
