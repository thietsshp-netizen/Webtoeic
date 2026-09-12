import os

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.endswith('.json')])

idp_files = [f for f in files if f.startswith('test_')]
bc_files = [f for f in files if f.startswith('bc_')]

print(f"Total JSON files in json_output: {len(files)}")
print(f"IDP JSON files: {len(idp_files)} / 102")
print(f"BC JSON files: {len(bc_files)} / 27")
