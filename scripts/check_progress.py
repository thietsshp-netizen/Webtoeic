import os

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.startswith('test_') and f.endswith('.json')])

print(f"Total JSON files generated so far: {len(files)} / 102")
if files:
    print(f"Latest generated file: {files[-1]}")
