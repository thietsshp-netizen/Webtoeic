import pypdf, re

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_02.pdf')
reading_txt = "\n".join([reader.pages[i].extract_text() for i in range(len(reader.pages)-1)])

sec_matches = list(re.finditer(r'\b(SECTION\s*[123]|READING PASSAGE\s*[123])\b', reading_txt, re.IGNORECASE))
sec_pos = {}
for sm in sec_matches:
    s_txt = sm.group(0).upper()
    if '1' in s_txt and 1 not in sec_pos: sec_pos[1] = sm.start()
    elif '2' in s_txt and 2 not in sec_pos: sec_pos[2] = sm.start()
    elif '3' in s_txt and 3 not in sec_pos: sec_pos[3] = sm.start()

pos1 = sec_pos.get(1, 0)
pos2 = sec_pos.get(2, len(reading_txt) // 3)
pos3 = sec_pos.get(3, (len(reading_txt) // 3) * 2)

sections = [
    (1, reading_txt[pos1:pos2]),
    (2, reading_txt[pos2:pos3]),
    (3, reading_txt[pos3:])
]

for sec_num, sec_txt in sections:
    # Remove header line 'You should spend about 20 minutes...'
    clean_sec = re.sub(r'You should spend about 20 minutes on Questions.*', '', sec_txt, count=1, flags=re.IGNORECASE)
    
    # Locate Question Block start after the title: 'Questions 1–6' or 'Questions 1-7' or 'Questions 14-19'
    q_start_m = re.search(r'\n\s*Questions?\s+\d+[\–\-\—\s]+\d+', clean_sec, re.IGNORECASE)
    
    if q_start_m:
        passage_body = clean_sec[:q_start_m.start()]
        questions_body = clean_sec[q_start_m.start():]
    else:
        passage_body = clean_sec
        questions_body = ""
        
    print(f"\n--- Section {sec_num} ---")
    print(f"Passage body length: {len(passage_body)} chars")
    print(f"Questions body length: {len(questions_body)} chars")

    # Count paragraphs
    paragraphs = [p.strip() for p in passage_body.split('\n\n') if p.strip()]
    print(f"Paragraph blocks count: {len(paragraphs)}")
