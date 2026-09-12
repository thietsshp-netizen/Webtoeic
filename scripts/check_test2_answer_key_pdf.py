import pypdf

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_02.pdf')
print(f"=== idp_test_02.pdf Total Pages: {len(reader.pages)} ===")
print("=== Last Page (Page {}) ===".format(len(reader.pages)))
print(reader.pages[-1].extract_text())

# Also check second to last page if multi-page answer key
if len(reader.pages) > 1:
    print("=== Second to Last Page (Page {}) ===".format(len(reader.pages)-1))
    print(reader.pages[-2].extract_text())
