import os, sys, re, json, pypdf

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

def detect_question_type(instr, answers_in_group, options_pool):
    instr_up = instr.upper()
    
    if "LIST OF HEADINGS" in instr_up or "CORRECT HEADING FOR EACH" in instr_up or options_pool.get("i"):
        return "MATCHING_HEADINGS"
    if "TRUE" in instr_up and "FALSE" in instr_up:
        return "TRUE_FALSE_NOT_GIVEN"
    if "YES" in instr_up and "NO" in instr_up:
        return "YES_NO_NOT_GIVEN"
    if "CHOOSE TWO" in instr_up or "CHOOSE THREE" in instr_up:
        return "MULTIPLE_CHOICE_MULTI"
    if "CHOOSE THE CORRECT LETTER" in instr_up or "A, B, C OR D" in instr_up:
        return "MULTIPLE_CHOICE_SINGLE"
    if "SUMMARY" in instr_up:
        return "SUMMARY_COMPLETION_TEXT"
    if "MATCH EACH" in instr_up or "COMPLETE EACH SENTENCE WITH THE CORRECT ENDING" in instr_up:
        return "MATCHING_FEATURES"
    if "NO MORE THAN" in instr_up:
        return "FILL_IN_BLANKS"
        
    # Fallback based on answers
    first_ans = str(answers_in_group[0]) if answers_in_group else ""
    if first_ans in ["TRUE", "FALSE", "NOT GIVEN"]:
        return "TRUE_FALSE_NOT_GIVEN"
    if first_ans in ["YES", "NO"]:
        return "YES_NO_NOT_GIVEN"
    if re.match(r'^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$', first_ans, re.I):
        return "MATCHING_HEADINGS"
    if re.match(r'^[A-H]$', first_ans):
        return "MULTIPLE_CHOICE_SINGLE"
        
    return "SHORT_ANSWER"

def reprocess_file_with_proper_groups(test_idx):
    pdf_path = os.path.join(SPLIT_DIR, f"idp_test_{test_idx:02d}.pdf")
    if not os.path.exists(pdf_path): return

    reader = pypdf.PdfReader(pdf_path)
    full_pdf_text = "\n".join([p.extract_text() for p in reader.pages[:-1]])

    for p_num in range(1, 4):
        json_filename = f"test_{test_idx:02d}_passage_{p_num}.json"
        json_path = os.path.join(OUT_DIR, json_filename)
        
        # Don't touch hand-built benchmark files
        if test_idx in [1, 2, 3, 4, 5] or (test_idx == 6 and p_num == 2) or (test_idx == 10 and p_num == 1) or (test_idx == 21 and p_num == 3):
            continue

        if not os.path.exists(json_path): continue

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        existing_groups = data.get('question_groups', [])
        if not existing_groups: continue
        
        all_q_objects = existing_groups[0].get('questions', [])
        if not all_q_objects: continue

        q_min = all_q_objects[0]['questionNo']
        q_max = all_q_objects[-1]['questionNo']

        # Search for Question Instructions in full PDF text for this range
        instr_blocks = list(re.finditer(r'(Questions?\s+(\d+)\s*[\–\-\—\sto]+\s*(\d+))', full_pdf_text, re.IGNORECASE))
        
        relevant_blocks = []
        for ib in instr_blocks:
            q_start = int(ib.group(2))
            q_end = int(ib.group(3))
            if q_min <= q_start and q_end <= q_max:
                block_start = ib.start()
                block_txt = full_pdf_text[block_start:block_start+400]
                relevant_blocks.append({
                    "start": q_start,
                    "end": q_end,
                    "raw_text": block_txt
                })

        if not relevant_blocks:
            continue

        # Build distinct question groups
        new_groups = []
        color_idx = 0

        for b_info in relevant_blocks:
            b_qstart = b_info['start']
            b_qend = b_info['end']
            b_txt = b_info['raw_text']

            # Extract options pool if List of Headings or Options A-F exist
            options_pool = {}
            headings_match = re.search(r'List of Headings\s*([^\n\r]+(?:\n[^\n\r]+){1,12})', b_txt, re.IGNORECASE)
            if headings_match:
                h_lines = headings_match.group(1).split('\n')
                for hl in h_lines:
                    hm = re.match(r'^\s*(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)[\.\s]+([^\n]+)', hl, re.I)
                    if hm:
                        options_pool[hm.group(1).lower()] = hm.group(2).strip()

            # Filter questions for this group
            group_qs = [q for q in all_q_objects if b_qstart <= q['questionNo'] <= b_qend]
            if not group_qs: continue

            ans_in_group = [q['correctAnswer'] for q in group_qs]
            q_type = detect_question_type(b_txt, ans_in_group, options_pool)
            first_line_instr = b_txt.split('\n')[0] if b_txt else f"Questions {b_qstart}-{b_qend}"

            new_groups.append({
                "group_id": len(new_groups) + 1,
                "group_color": GROUP_COLORS[color_idx % len(GROUP_COLORS)],
                "question_type": q_type,
                "instruction": first_line_instr.strip(),
                "options_pool": options_pool,
                "questions": group_qs
            })
            color_idx += 1

        if new_groups:
            data['question_groups'] = new_groups
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated proper question groups for {json_filename}: {len(new_groups)} groups")

print("=== Reprocessing Question Grouping for all IDP Tests ===")
for t in range(6, 35):
    reprocess_file_with_proper_groups(t)
print("Finished regrouping all question groups!")
