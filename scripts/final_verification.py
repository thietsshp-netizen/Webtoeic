import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.endswith('.json')])

idp_files = [f for f in files if f.startswith('test_')]
bc_files = [f for f in files if f.startswith('bc_')]

print("=== FINAL VERIFICATION SUMMARY ===")
print(f"Total JSON files created: {len(files)}")
print(f"IDP Reading JSON files (34 Tests x 3 Passages): {len(idp_files)} / 102")
print(f"British Council JSON files (9 Tests x 3 Passages): {len(bc_files)} / 27")

# Verify no files have empty content or empty translation maps
empty_files = []
for f in files:
    path = os.path.join(out_dir, f)
    with open(path, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    p = data['passages'][0]
    if not p['html_content'] or len(p['translation_map']) == 0:
        empty_files.append(f)

print(f"Empty or corrupted files count: {len(empty_files)}")
