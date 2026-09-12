import os, sys, re, pypdf

PDF_PATH = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
os.makedirs(OUT_DIR, exist_ok=True)

reader = pypdf.PdfReader(PDF_PATH)

# Map top-header page boundaries
test_page_starts = {}
for p_idx in range(10, 458): # Page 11 to 458
    txt = reader.pages[p_idx].extract_text()
    lines = [l.strip() for l in txt.split('\n') if l.strip()]
    if lines:
        top_txt = " ".join(lines[:3])
        m = re.search(r'Reading\s+Test\s+(\d+)', top_txt, re.IGNORECASE)
        if m:
            t_num = int(m.group(1))
            if t_num not in test_page_starts:
                test_page_starts[t_num] = p_idx

test_starts = sorted([(t, p) for t, p in test_page_starts.items()], key=lambda x: x[0])

# Re-save 34 test PDFs containing ONLY Reading Test pages
for idx, (t_num, start_p) in enumerate(test_starts):
    end_p = test_starts[idx+1][1] if idx + 1 < len(test_starts) else 458
    
    writer = pypdf.PdfWriter()
    for p in range(start_p, end_p):
        writer.add_page(reader.pages[p])
        
    out_filename = f"idp_test_{t_num:02d}.pdf"
    out_path = os.path.join(OUT_DIR, out_filename)
    
    with open(out_path, 'wb') as fp:
        writer.write(fp)
        
    print(f"Updated {out_filename}: {end_p - start_p} reading test pages (PDF pages {start_p+1}-{end_p})")

print(f"\nUpdated all 34 individual test PDFs cleanly!")
