import pypdf

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_04.pdf')
print(f"=== idp_test_04.pdf Total Pages: {len(reader.pages)} ===")

for idx, page in enumerate(reader.pages[:-1]):
    print(f"\n================ PAGE {idx+1} ================")
    print(page.extract_text())

print("\n================ ANSWER KEY PAGE ================")
print(reader.pages[-1].extract_text())
