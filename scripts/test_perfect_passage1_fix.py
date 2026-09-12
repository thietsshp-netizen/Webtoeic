import pypdf, re, json

reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_01.pdf')
reading_txt = "\n".join([reader.pages[i].extract_text() for i in range(len(reader.pages)-1)])
ak_txt = reader.pages[-1].extract_text()

# Extract Section 1 text (from start to 'SECTION 2' or 'READING PASSAGE 2')
sec2_m = re.search(r'\b(SECTION\s*2|READING PASSAGE\s*2)\b', reading_txt, re.IGNORECASE)
sec1_txt = reading_txt[:sec2_m.start()] if sec2_m else reading_txt[:len(reading_txt)//3]

print("=== Section 1 Raw Length ===", len(sec1_txt))

# Locate Passage Title: 'Andrea Palladio: Italian architect'
title_m = re.search(r'Andrea\s+Palladio[^\n]*', sec1_txt, re.IGNORECASE)
if title_m:
    title_start = title_m.start()
    title_str = title_m.group(0).strip()
else:
    title_start = 0
    title_str = "Andrea Palladio: Italian architect"

# Find Question block start AFTER title_start: 'Questions 1–7' or 'Questions 1-7'
q_block_m = re.search(r'\n\s*Questions?\s+1\s*[\–\-\—\s]\s*7', sec1_txt[title_start:], re.IGNORECASE)
if q_block_m:
    q_start = title_start + q_block_m.start()
    passage_body = sec1_txt[title_start:q_start]
    questions_body = sec1_txt[q_start:]
else:
    passage_body = sec1_txt[title_start:]
    questions_body = ""

print(f"Title: {title_str}")
print(f"Passage Body Length: {len(passage_body)} chars")
print(f"Questions Body Length: {len(questions_body)} chars")

print("\n=== Passage Body First 500 chars ===")
print(passage_body[:500])
