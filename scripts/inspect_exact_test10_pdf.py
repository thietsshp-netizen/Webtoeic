import pypdf

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_10.pdf')
print(f"=== idp_test_10.pdf Total Pages: {len(reader.pages)} ===")

for idx in range(0, 5):
    print(f"\n--- PAGE {idx+1} ---")
    print(reader.pages[idx].extract_text())

print("\n=== LAST PAGE (ANSWER KEY) ===")
print(reader.pages[-1].extract_text())
