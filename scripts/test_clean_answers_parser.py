import pypdf, re, json

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

def parse_all_pdf_answers():
    all_answers = {}
    
    # Extract text from page 460 (index 459) to end of PDF
    full_ak_txt = ""
    for p_idx in range(459, len(reader.pages)):
        full_ak_txt += "\n" + reader.pages[p_idx].extract_text()
        
    test_blocks = re.split(r'\b(?:Reading\s+Test|TEST)\s+(\d+)\b', full_ak_txt, flags=re.IGNORECASE)
    
    for i in range(1, len(test_blocks), 2):
        t_num = int(test_blocks[i])
        block_text = test_blocks[i+1]
        
        # Clean noisy headers inside answer block
        block_text = re.sub(r'Section\s+[123]', ' ', block_text, flags=re.IGNORECASE)
        
        # Match pattern: number followed by answer string until next number or end
        matches = re.findall(r'(?:^|\s)(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', block_text)
        
        ans_dict = {}
        for q_str, a_str in matches:
            q_n = int(q_str)
            a_clean = re.sub(r'\s+', ' ', a_str).strip()
            if 1 <= q_n <= 40 and len(a_clean) < 60:
                ans_dict[q_n] = a_clean
                
        all_answers[t_num] = ans_dict
        
    return all_answers

answers = parse_all_pdf_answers()
print(f"Parsed Answers for Test 1 (Total {len(answers.get(1, {}))} Qs):")
for qn in range(1, 41):
    print(f"  Q{qn:2d}: {repr(answers.get(1, {}).get(qn, 'MISSING'))}")
