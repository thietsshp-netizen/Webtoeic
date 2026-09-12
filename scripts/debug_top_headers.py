import pypdf, re

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

print("=== Scanning strictly for top-page headers 'Reading Test X' ===")
test_header_pages = {}
for p_idx in range(10, len(reader.pages) - 40): # page 11 to 458
    txt = reader.pages[p_idx].extract_text()
    lines = [l.strip() for l in txt.split('\n') if l.strip()]
    if lines:
        # Check first 3 lines of the page
        top_txt = " ".join(lines[:3])
        m = re.search(r'Reading\s+Test\s+(\d+)', top_txt, re.IGNORECASE)
        if m:
            t_num = int(m.group(1))
            if t_num not in test_header_pages:
                test_header_pages[t_num] = p_idx + 1

for t in range(1, 35):
    print(f"Test {t:2d}: Page {test_header_pages.get(t, 'NOT FOUND')}")
