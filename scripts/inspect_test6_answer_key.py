import pypdf, re

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

print("=== Inspecting Answer Keys text for Test 6 (Pages 460-475) ===")
full_ak_txt = ""
for p_idx in range(459, 475):
    txt = reader.pages[p_idx].extract_text()
    if 'Test 6' in txt or 'TEST 6' in txt or 'Reading Test 6' in txt:
        print(f"\n--- PDF Page {p_idx+1} ---")
        lines = txt.split('\n')
        for l in lines:
            if any(k in l.upper() for k in ['TEST 6', 'TEST 7', 'TEST 5', 'SECTION 1', 'SECTION 2', 'SECTION 3', 'OTTER']):
                print('  ', l.strip())

# Print full block around 'Reading Test 6'
for p_idx in range(459, 475):
    txt = reader.pages[p_idx].extract_text()
    m = re.search(r'(?:Reading\s+Test|TEST)\s+6\b', txt, re.IGNORECASE)
    if m:
        print(f"\n=== Full text block around Reading Test 6 on Page {p_idx+1} ===")
        print(txt[m.start():m.start()+1500])
