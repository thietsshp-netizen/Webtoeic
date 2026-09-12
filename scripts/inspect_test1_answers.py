import pypdf, re

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_01.pdf')
ak_txt = reader.pages[-1].extract_text()

print("=== Raw Answer Key Text for Test 1 ===")
print(ak_txt)
