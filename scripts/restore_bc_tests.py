import os

print("=== Checking British Council source files and script ===")
bc_pdf = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/9_DE_THI_READING_BC.pdf'
print("BC PDF exists:", os.path.exists(bc_pdf))

# Check if there are any BC backup files in IELTS dir
ielts_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS'
for f in os.listdir(ielts_dir):
    if 'bc' in f.lower() or 'council' in f.lower():
        print(" Found BC file:", f)
