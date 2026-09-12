import pypdf, re

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

def extract_all_clean_answers():
    full_ak_txt = ""
    for p_idx in range(459, len(reader.pages)):
        full_ak_txt += "\n" + reader.pages[p_idx].extract_text()
        
    test_blocks = re.split(r'\b(?:Reading\s+Test|TEST)\s+(\d+)\b', full_ak_txt, flags=re.IGNORECASE)
    
    all_answers = {}
    for i in range(1, len(test_blocks), 2):
        t_num = int(test_blocks[i])
        block_text = test_blocks[i+1]
        
        # Clean noisy headers inside answer block
        block_text = re.sub(r'Section\s+[123]', ' ', block_text, flags=re.IGNORECASE)
        block_text = re.sub(r'Reading\s+Test\s+\d+', ' ', block_text, flags=re.IGNORECASE)
        
        # Match pattern: number followed by answer string until next number or end
        matches = re.findall(r'(?:^|\s)(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', block_text)
        
        ans_dict = {}
        for q_str, a_str in matches:
            q_n = int(q_str)
            a_clean = re.sub(r'\s+', ' ', a_str).strip()
            # Fix typos like 'TURE' -> 'TRUE', 'Y es' -> 'YES'
            if a_clean.upper() in ['TURE', 'TRU']: a_clean = 'TRUE'
            elif a_clean.upper() in ['Y ES', 'YES']: a_clean = 'YES'
            elif a_clean.upper() in ['NOT GIVEN', 'NOTGIVEN']: a_clean = 'NOT GIVEN'
            
            if 1 <= q_n <= 40 and len(a_clean) < 60:
                ans_dict[q_n] = a_clean
                
        all_answers[t_num] = ans_dict
        
    return all_answers

all_ans = extract_all_clean_answers()
print(f"Total Tests parsed with answer keys: {len(all_ans)}")
for t in range(1, 35):
    q_count = len(all_ans.get(t, {}))
    print(f"Test {t:2d}: {q_count:2d} answers parsed")
