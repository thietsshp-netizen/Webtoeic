import pypdf

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

print("=== Text on Page 465 ===")
print(reader.pages[464].extract_text())

print("\n=== Text on Page 466 ===")
print(reader.pages[465].extract_text())

print("\n=== Text on Page 467 ===")
print(reader.pages[466].extract_text())
