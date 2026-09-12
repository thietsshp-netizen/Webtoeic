import pypdf, re

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_01.pdf')
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

sec1_text = reading_txt[pos1:pos2]

q_start_pos = re.search(r'\n\s*Questions?\s+\d+', sec1_text, re.IGNORECASE)
passage_raw = sec1_text[:q_start_pos.start()] if q_start_pos else sec1_text

print("=== Passage 1 Raw Text ===")
print(passage_raw[:1500])

print("\n=== Para matches ===")
para_matches = re.findall(r'([A-H])[\.\s]+([^A-H]+?)(?=\s+[A-H][\.\s]|\s*$)', passage_raw)
print(f"Found {len(para_matches)} para matches:")
for label, content in para_matches:
    print(f"  Para {label}: length {len(content)}")
