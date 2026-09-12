import pypdf, re

def parse_clean_answers(ak_text):
    sec_blocks = re.split(r'Section\s*([123])', ak_text, flags=re.IGNORECASE)
    ans_by_section = {1: {}, 2: {}, 3: {}}
    
    if len(sec_blocks) >= 3:
        for i in range(1, len(sec_blocks), 2):
            sec_num = int(sec_blocks[i])
            sec_txt = sec_blocks[i+1]
            
            # Match number followed by answer string
            matches = re.findall(r'(?:^|\s)(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', sec_txt)
            for q_str, a_str in matches:
                q_n = int(q_str)
                a_clean = re.sub(r'\s+', ' ', a_str).strip()
                # Remove any leftover section titles or page noise
                a_clean = re.sub(r'Reading\s+Test.*|Section.*', '', a_clean).strip()
                up = a_clean.upper()
                if up in ['TURE', 'TRU']: a_clean = 'TRUE'
                elif up in ['Y ES', 'YES']: a_clean = 'YES'
                elif up in ['NOT GIVEN', 'NOTGIVEN']: a_clean = 'NOT GIVEN'
                
                if len(a_clean) < 60:
                    ans_by_section[sec_num][q_n] = a_clean
    else:
        # Fallback single block
        matches = re.findall(r'(?:^|\s)(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', ak_text)
        for q_str, a_str in matches:
            q_n = int(q_str)
            a_clean = re.sub(r'\s+', ' ', a_str).strip()
            up = a_clean.upper()
            if up in ['TURE', 'TRU']: a_clean = 'TRUE'
            elif up in ['Y ES', 'YES']: a_clean = 'YES'
            elif up in ['NOT GIVEN', 'NOTGIVEN']: a_clean = 'NOT GIVEN'
            
            sec = 1 if q_n <= 13 else (2 if q_n <= 26 else 3)
            ans_by_section[sec][q_n] = a_clean
            
    return ans_by_section

# Test on idp_test_02.pdf
reader = pypdf.PdfReader('/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT/idp_test_02.pdf')
ak_txt = reader.pages[-1].extract_text()
ans_sec = parse_clean_answers(ak_txt)

print("=== Clean Answer Extraction for Test 2 ===")
for sec in [1, 2, 3]:
    print(f"Section {sec}: {len(ans_sec[sec])} answers parsed ->", ans_sec[sec])
