import pypdf, re, json

def parse_split_pdf(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    n_pages = len(reader.pages)
    
    # Last page is Answer Key
    ak_text = reader.pages[-1].extract_text()
    
    # Pages 0 to n_pages-2 are reading pages
    reading_pages = [reader.pages[i].extract_text() for i in range(n_pages - 1)]
    full_reading_text = "\n".join(reading_pages)
    
    # Find Section boundaries
    sec_matches = list(re.finditer(r'\b(SECTION\s*[123]|READING PASSAGE\s*[123])\b', full_reading_text, re.IGNORECASE))
    
    sec_pos = {}
    for sm in sec_matches:
        s_txt = sm.group(0).upper()
        if '1' in s_txt and 1 not in sec_pos: sec_pos[1] = sm.start()
        elif '2' in s_txt and 2 not in sec_pos: sec_pos[2] = sm.start()
        elif '3' in s_txt and 3 not in sec_pos: sec_pos[3] = sm.start()

    pos1 = sec_pos.get(1, 0)
    pos2 = sec_pos.get(2, len(full_reading_text) // 3)
    pos3 = sec_pos.get(3, (len(full_reading_text) // 3) * 2)

    sec1_text = full_reading_text[pos1:pos2]
    sec2_text = full_reading_text[pos2:pos3]
    sec3_text = full_reading_text[pos3:]

    print(f"File {pdf_path}:")
    print(f"  Sec 1 text length: {len(sec1_text)} chars")
    print(f"  Sec 2 text length: {len(sec2_text)} chars")
    print(f"  Sec 3 text length: {len(sec3_text)} chars")
    print(f"  Answer key text length: {len(ak_text)} chars")

parse_split_pdf('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_01.pdf')
parse_split_pdf('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_07.pdf')
