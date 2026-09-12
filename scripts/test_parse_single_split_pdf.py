import pypdf, re

def inspect_split_pdf(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    num_pages = len(reader.pages)
    print(f"\n=== Inspecting {pdf_path} ({num_pages} pages) ===")
    
    # Last page is answer key page
    ak_txt = reader.pages[-1].extract_text()
    print("Answer Key Page (Last Page):")
    print("  ", repr(ak_txt.strip()[:150]))
    
    # Reading pages are 0 to num_pages-2
    reading_txt = ""
    for p in range(num_pages - 1):
        reading_txt += f"\n--- Page {p+1} ---\n" + reader.pages[p].extract_text()
        
    sec_matches = list(re.finditer(r'\b(SECTION\s*[123]|READING PASSAGE\s*[123])\b', reading_txt, re.IGNORECASE))
    print(f"Found {len(sec_matches)} passage headers:")
    for sm in sec_matches:
        print(f"  Pos {sm.start()}: {repr(sm.group(0))}")

inspect_split_pdf('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_01.pdf')
inspect_split_pdf('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_07.pdf')
