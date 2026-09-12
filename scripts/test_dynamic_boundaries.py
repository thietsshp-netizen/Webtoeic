import pypdf, re

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

test_starts = []
for p_idx in range(3, 458):
    txt = reader.pages[p_idx].extract_text()
    m = re.search(r'\bReading\s+Test\s+(\d+)\b', txt, re.IGNORECASE)
    if m:
        t_num = int(m.group(1))
        if not any(t == t_num for t, _ in test_starts):
            test_starts.append((t_num, p_idx))

test_starts.sort(key=lambda x: x[1])

print("=== Dynamic Passage Question Range Detection Across 34 IDP Tests ===")
for idx, (t_idx, start_page) in enumerate(test_starts[:10]):
    end_page = test_starts[idx+1][1] if idx + 1 < len(test_starts) else 458
    test_pages_txt = [reader.pages[p].extract_text() for p in range(start_page, end_page)]
    full_test_txt = "\n".join(test_pages_txt)
    
    sec_matches = list(re.finditer(r'\b(SECTION\s*[123]|READING PASSAGE\s*[123])\b', full_test_txt, re.IGNORECASE))
    sec_pos = {}
    for sm in sec_matches:
        s_txt = sm.group(0).upper()
        if '1' in s_txt and 1 not in sec_pos: sec_pos[1] = sm.start()
        elif '2' in s_txt and 2 not in sec_pos: sec_pos[2] = sm.start()
        elif '3' in s_txt and 3 not in sec_pos: sec_pos[3] = sm.start()

    pos1 = sec_pos.get(1, 0)
    pos2 = sec_pos.get(2, len(full_test_txt) // 3)
    pos3 = sec_pos.get(3, (len(full_test_txt) // 3) * 2)

    sec1_txt = full_test_txt[pos1:pos2]
    sec2_txt = full_test_txt[pos2:pos3]
    sec3_txt = full_test_txt[pos3:]

    for p_num, sec_txt in enumerate([sec1_txt, sec2_txt, sec3_txt], 1):
        q_hdrs = re.findall(r'Questions?\s+(\d+)\s*[\–\-\—\s]*(\d*)', sec_txt, re.IGNORECASE)
        q_nums = []
        for q1, q2 in q_hdrs:
            if q1: q_nums.append(int(q1))
            if q2: q_nums.append(int(q2))
        
        q_min = min(q_nums) if q_nums else ("Fallback 1" if p_num==1 else ("Fallback 14" if p_num==2 else "Fallback 27"))
        q_max = max(q_nums) if q_nums else ("Fallback 13" if p_num==1 else ("Fallback 26" if p_num==2 else "Fallback 40"))
        print(f"Test {t_idx:02d} Passage {p_num}: Questions {q_min} to {q_max}")
