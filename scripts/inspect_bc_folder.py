import os

bc_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/BO 9 DE THI THAT CUA BRITISH COUNCIL'
print(f"=== Files in {bc_dir} ===")
for root, dirs, files in os.walk(bc_dir):
    for f in files:
        print(" ", os.path.join(root, f))
