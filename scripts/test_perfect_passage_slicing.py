import pypdf, re

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

# Test 7 is on PDF pages 89 to 101 (indices 88 to 101)
t7_pages = [reader.pages[p].extract_text() for p in range(88, 101)]
t7_txt = "\n".join(t7_pages)

sec_matches = list(re.finditer(r'\b(SECTION\s*[123]|READING PASSAGE\s*[123])\b', t7_txt, re.IGNORECASE))
sec_pos = {}
for sm in sec_matches:
    s_txt = sm.group(0).upper()
    if '1' in s_txt and 1 not in sec_pos: sec_pos[1] = sm.start()
    elif '2' in s_txt and 2 not in sec_pos: sec_pos[2] = sm.start()
    elif '3' in s_txt and 3 not in sec_pos: sec_pos[3] = sm.start()

pos1 = sec_pos.get(1, 0)
pos2 = sec_pos.get(2, len(t7_txt) // 3)
pos3 = sec_pos.get(3, (len(t7_txt) // 3) * 2)

sec1_txt = t7_txt[pos1:pos2]
sec2_txt = t7_txt[pos2:pos3]
sec3_txt = t7_txt[pos3:]

def get_passage_title(sec_text):
    lines = [l.strip() for l in sec_text.split('\n') if l.strip()]
    for l in lines:
        if len(l) > 10 and not any(k in l.upper() for k in ['SECTION', 'READING PASSAGE', 'CANDIDATE', 'QUESTIONS']):
            return l
    return "Unknown Title"

print(f"Test 7 Passage 1 Title: {get_passage_title(sec1_txt)}")
print(f"Test 7 Passage 2 Title: {get_passage_title(sec2_txt)}")
print(f"Test 7 Passage 3 Title: {get_passage_title(sec3_txt)}")
