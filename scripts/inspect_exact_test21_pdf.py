import pypdf

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_21.pdf')
print(f"=== idp_test_21.pdf Total Pages: {len(reader.pages)} ===")

# Test 21 Passage 3 is near pages 8-12
for idx in range(7, len(reader.pages)-1):
    print(f"\n================ PAGE {idx+1} ================")
    print(reader.pages[idx].extract_text())

print("\n================ ANSWER KEY PAGE ================")
print(reader.pages[-1].extract_text())
