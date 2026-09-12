import os, pypdf

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
tests_to_check = [7, 8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

print("=== DUMPING ANSWER KEY PAGES FROM PDFS ===")

for t in tests_to_check:
    pdf_filename = f"idp_test_{t:02d}.pdf"
    pdf_path = os.path.join(SPLIT_DIR, pdf_filename)
    if not os.path.exists(pdf_path):
        print(f"Test {t}: File not found")
        continue
        
    reader = pypdf.PdfReader(pdf_path)
    n_pages = len(reader.pages)
    
    # Check last 4 pages backwards for answer key
    ak_page_idx = -1
    for p in range(n_pages - 1, max(0, n_pages - 5), -1):
        txt = reader.pages[p].extract_text()
        txt_clean = txt.lower()
        if 'section 1' in txt_clean or 'answer' in txt_clean or '1 c' in txt_clean or ('1 ' in txt_clean and len(txt_clean) < 1200):
            ak_page_idx = p
            break
            
    if ak_page_idx != -1:
        # Extract text from ak_page_idx to n_pages
        ak_txts = []
        for i in range(ak_page_idx, n_pages):
            ak_txts.append(f"--- Page {i+1} ---")
            ak_txts.append(reader.pages[i].extract_text().strip())
        print(f"\n==================== TEST {t} (Pages {ak_page_idx+1} to {n_pages}) ====================")
        print("\n".join(ak_txts))
    else:
        print(f"\n==================== TEST {t}: COULD NOT AUTOMATICALLY DETECT ANSWER KEY PAGE ====================")
        # Dump the last 2 pages anyway
        ak_txts = []
        for i in range(max(0, n_pages - 2), n_pages):
            ak_txts.append(f"--- Page {i+1} ---")
            ak_txts.append(reader.pages[i].extract_text().strip())
        print("\n".join(ak_txts))
