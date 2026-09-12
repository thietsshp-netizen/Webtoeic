import pypdf, re

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

# Test Test 7 page range (pages 89 to 114)
print("=== Inspecting Test 7 Section Slicing ===")

test_starts = []
for p_idx in range(3, 458):
    txt = reader.pages[p_idx].extract_text()
    m = re.search(r'\bReading\s+Test\s+(\d+)\b', txt, re.IGNORECASE)
    if m:
        t_num = int(m.group(1))
        if not any(t == t_num for t, _ in test_starts):
            test_starts.append((t_num, p_idx))

test_starts.sort(key=lambda x: x[1])

# Find page range for Test 7
t7_start = [sp for t, sp in test_starts if t == 7][0]
t7_end = [sp for t, sp in test_starts if t == 8][0]

print(f"Test 7 is on PDF pages {t7_start+1} to {t7_end}")

pages_txt = []
for p in range(t7_start, t7_end):
    txt = reader.pages[p].extract_text()
    print(f"Page {p+1:3d} first 60 chars: {repr(txt.strip()[:60])}")
