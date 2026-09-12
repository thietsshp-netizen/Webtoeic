import os

json_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
if os.path.exists(json_dir):
    deleted = 0
    for f in os.listdir(json_dir):
        if f.endswith('.json'):
            os.remove(os.path.join(json_dir, f))
            deleted += 1
    print(f"Deleted all {deleted} JSON files in {json_dir}")
