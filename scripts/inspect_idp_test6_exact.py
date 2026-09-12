import pypdf

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_06.pdf')
print(f"=== idp_test_06.pdf has {len(reader.pages)} pages ===")

for idx, page in enumerate(reader.pages):
    print(f"\n------------------- PAGE {idx+1} -------------------")
    print(page.extract_text()[:600])
