import os, pypdf

PDF_PATH = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
OUT_PATH = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/DAP_AN_34_DE_READING_IDP.pdf'

reader = pypdf.PdfReader(PDF_PATH)
writer = pypdf.PdfWriter()

# Pages 460 to 496 (indices 459 to len(reader.pages)-1)
for p_idx in range(459, len(reader.pages)):
    writer.add_page(reader.pages[p_idx])

with open(OUT_PATH, 'wb') as fp:
    writer.write(fp)

print(f"Created standalone Answer Keys PDF with {len(writer.pages)} pages: {OUT_PATH}")
