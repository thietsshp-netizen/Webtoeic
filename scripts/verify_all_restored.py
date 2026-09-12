import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.endswith('.json')])

bc_files = [f for f in files if f.startswith('bc_')]
idp_files = [f for f in files if f.startswith('test_')]

print(f"=== Verification Summary ===")
print(f"Total restored British Council JSON files: {len(bc_files)} / 27")
print(f"Total Test 1 IDP JSON files: {len(idp_files)} / 3")
for f in idp_files:
    print("  IDP File:", f)
