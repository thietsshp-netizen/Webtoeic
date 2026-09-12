import pypdf

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_09.pdf')
print(f"=== idp_test_09.pdf Total Pages: {len(reader.pages)} ===")

# Test 9 Passage 3 is near pages 9-13
for idx in range(8, len(reader.pages)-1):
    print(f"\n================ PAGE {idx+1} ================")
    print(reader.pages[idx].extract_text())

print("\n================ ANSWER KEY PAGE ================")
print(reader.pages[-1].extract_text())
