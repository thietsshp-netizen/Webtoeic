import os, sys, re, pypdf

PDF_PATH = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
os.makedirs(OUT_DIR, exist_ok=True)

reader = pypdf.PdfReader(PDF_PATH)
total_pages = len(reader.pages)

# 1. Map top-header test page ranges (excluding Table of Contents <= page 10)
test_header_pages = {}
for p_idx in range(10, 458): # Page 11 to 458
    txt = reader.pages[p_idx].extract_text()
    lines = [l.strip() for l in txt.split('\n') if l.strip()]
    if lines:
        top_txt = " ".join(lines[:3])
        m = re.search(r'Reading\s+Test\s+(\d+)', top_txt, re.IGNORECASE)
        if m:
            t_num = int(m.group(1))
            if t_num not in test_header_pages:
                test_header_pages[t_num] = p_idx

test_starts = sorted([(t, p) for t, p in test_header_pages.items()], key=lambda x: x[0])

# 2. Map answer key pages sequentially (pages 460 to 496)
current_test = None
test_answer_pages = {}

for p_idx in range(459, total_pages):
    txt = reader.pages[p_idx].extract_text()
    m_test = re.search(r'(?:Reading\s+Test|TEST)\s+(\d+)', txt, re.IGNORECASE)
    if m_test:
        current_test = int(m_test.group(1))

    if current_test:
        if current_test not in test_answer_pages:
            test_answer_pages[current_test] = []
        test_answer_pages[current_test].append(p_idx)

# 3. Create standalone PDF for each Test 1 to 34 (Reading Test Pages + Answer Key Pages)
for idx, (t_num, start_p) in enumerate(test_starts):
    end_p = test_starts[idx+1][1] if idx + 1 < len(test_starts) else 458
    
    writer = pypdf.PdfWriter()
    
    # Add Reading Test Pages
    for p in range(start_p, end_p):
        writer.add_page(reader.pages[p])
        
    # Add Answer Key Pages
    ak_pages = test_answer_pages.get(t_num, [])
    for p in ak_pages:
        writer.add_page(reader.pages[p])
        
    out_filename = f"idp_test_{t_num:02d}.pdf"
    out_path = os.path.join(OUT_DIR, out_filename)
    
    with open(out_path, 'wb') as fp:
        writer.write(fp)
        
    print(f"Created {out_filename}: {end_p - start_p} reading pages + {len(ak_pages)} answer pages (PDF pages {ak_pages})")

print("\nDone updating all 34 split test PDFs perfectly!")
