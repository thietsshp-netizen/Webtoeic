import pypdf, re

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

# Test start pages must be > 3 (after TOC)
test_starts = []
for p_idx in range(3, 458):
    txt = reader.pages[p_idx].extract_text()
    m = re.search(r'\bReading\s+Test\s+(\d+)\b', txt, re.IGNORECASE)
    if m:
        t_num = int(m.group(1))
        test_starts.append((t_num, p_idx + 1))

# Group by test number, take lowest page > 3
clean_starts = {}
for t, p in test_starts:
    if t not in clean_starts or p < clean_starts[t]:
        clean_starts[t] = p

print("=== Clean Test Start Pages (Sorted by Test ID) ===")
for t in sorted(clean_starts.keys()):
    print(f"  Test {t:2d}: starts on Page {clean_starts[t]:3d}")
