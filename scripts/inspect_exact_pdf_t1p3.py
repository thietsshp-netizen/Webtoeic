import pypdf

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_01.pdf')

print("=== Pages in idp_test_01.pdf for Passage 3 ===")

# Test 1 Passage 3 is around pages 8 to 11
for idx in range(7, len(reader.pages)-1):
    print(f"\n--- Page {idx+1} ---")
    print(reader.pages[idx].extract_text())
