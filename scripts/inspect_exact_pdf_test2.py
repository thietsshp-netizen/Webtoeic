import pypdf, re

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_02.pdf')
print(f"=== idp_test_02.pdf has {len(reader.pages)} pages ===")

# Last page is Answer Key
print("\n=== Answer Key Page ===")
print(reader.pages[-1].extract_text())

# Print all pages text to verify exact section boundaries
for idx, page in enumerate(reader.pages[:-1]):
    print(f"\n--- PAGE {idx+1} ---")
    txt = page.extract_text()
    print(txt[:700])
