import os

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.endswith('.json')])

bc_files = [f for f in files if f.startswith('bc_')]
test1_files = [f for f in files if f.startswith('test_01_')]

print(f"Total JSON files: {len(files)}")
print(f"BC files count: {len(bc_files)} / 27")
print(f"Test 1 files count: {len(test1_files)} / 3")
for f in test1_files:
    print(" ", f)
