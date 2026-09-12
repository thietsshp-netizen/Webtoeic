import pypdf, re

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

print("=== Sequential Inspection of Test 1 (Pages 11 to 22) ===")

for p_idx in range(10, 23):
    txt = reader.pages[p_idx].extract_text()
    lines = [l.strip() for l in txt.split('\n') if l.strip()]
    first_line = lines[0] if lines else ""
    q_matches = re.findall(r'Questions?\s+(\d+[\–\-\—\s]*\d*)', txt, re.IGNORECASE)
    print(f"Page {p_idx+1:2d}: {first_line[:50]:<50} | Qs: {q_matches}")
