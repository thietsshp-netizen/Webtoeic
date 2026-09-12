import pypdf

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_06.pdf')

print("=== Full Text of Test 6 Passage 2 (Pages 4, 5, 6, 7) ===")
p2_text = reader.pages[3].extract_text() + "\n" + reader.pages[4].extract_text() + "\n" + reader.pages[5].extract_text()
print(p2_text)
