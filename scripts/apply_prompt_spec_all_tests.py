import os, sys, re, json, pypdf

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

VALID_TYPES = [
    "TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN", "MULTIPLE_CHOICE_SINGLE", "MULTIPLE_CHOICE_MULTI",
    "MATCHING_HEADINGS", "MATCHING_INFORMATION", "MATCHING_FEATURES", "MATCHING_SENTENCE_ENDINGS",
    "SUMMARY_COMPLETION_TEXT", "SUMMARY_COMPLETION_BOX", "SENTENCE_COMPLETION", "TABLE_COMPLETION",
    "FLOWCHART_COMPLETION", "DIAGRAM_LABEL", "SHORT_ANSWER"
]

def clean_str(s):
    if not s: return ""
    return re.sub(r'\s+', ' ', s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')).strip()

def detect_type_and_pool(b_txt, answers):
    b_up = b_txt.upper()
    pool = {}

    # 1. MATCHING HEADINGS
    if "LIST OF HEADINGS" in b_up or "CORRECT HEADING FOR EACH" in b_up or "HEADINGS BELOW" in b_up:
        matches = re.findall(r'\b(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)[\.\s]+([^\n\r]+)', b_txt, re.I)
        for num, txt in matches:
            pool[num.lower()] = clean_str(txt)
        return "MATCHING_HEADINGS", pool

    # 2. TRUE FALSE NOT GIVEN
    if "TRUE" in b_up and "FALSE" in b_up:
        return "TRUE_FALSE_NOT_GIVEN", pool

    # 3. YES NO NOT GIVEN
    if "YES" in b_up and "NO" in b_up:
        return "YES_NO_NOT_GIVEN", pool

    # 4. MULTIPLE CHOICE MULTI
    if "CHOOSE TWO" in b_up or "CHOOSE THREE" in b_up or "CHOOSE TWO LETTERS" in b_up:
        return "MULTIPLE_CHOICE_MULTI", pool

    # 5. MULTIPLE CHOICE SINGLE
    if "CHOOSE THE CORRECT LETTER" in b_up or "A, B, C OR D" in b_up:
        return "MULTIPLE_CHOICE_SINGLE", pool

    # 6. MATCHING FEATURES / SENTENCE ENDINGS / BOX
    if "LOOK AT THE FOLLOWING" in b_up or "MATCH EACH" in b_up or "LIST OF STATEMENTS" in b_up:
        matches = re.findall(r'\b([A-H])\b\s+([^\n\r]+)', b_txt)
        for letter, txt in matches:
            if len(txt) > 5 and not txt.startswith("Questions"):
                pool[letter] = clean_str(txt)
        return "MATCHING_FEATURES", pool

    # 7. SUMMARY COMPLETION TEXT
    if "SUMMARY" in b_up or "COMPLETE THE SUMMARY" in b_up:
        return "SUMMARY_COMPLETION_TEXT", pool

    # 8. FLOWCHART / TABLE / DIAGRAM
    if "FLOW-CHART" in b_up or "FLOWCHART" in b_up:
        return "FLOWCHART_COMPLETION", pool
    if "TABLE" in b_up:
        return "TABLE_COMPLETION", pool
    if "DIAGRAM" in b_up:
        return "DIAGRAM_LABEL", pool

    # Fallback checking answers
    first_ans = str(answers[0]) if answers else ""
    if first_ans in ["TRUE", "FALSE", "NOT GIVEN"]:
        return "TRUE_FALSE_NOT_GIVEN", pool
    if first_ans in ["YES", "NO"]:
        return "YES_NO_NOT_GIVEN", pool
    if re.match(r'^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$', first_ans, re.I):
        return "MATCHING_HEADINGS", pool
    if re.match(r'^[A-H]$', first_ans):
        return "MULTIPLE_CHOICE_SINGLE", pool

    return "SHORT_ANSWER", pool

def process_file_groups(test_idx):
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
        
        # Gather all question objects
        all_qs = []
        for eg in existing_groups:
            all_qs.extend(eg.get('questions', []))

        if not all_qs: continue

        q_min = min(q['questionNo'] for q in all_qs)
        q_max = max(q['questionNo'] for q in all_qs)

        instr_matches = list(re.finditer(r'(Questions?\s+(\d+)\s*[\–\-\—\sto]+\s*(\d+))', full_pdf_text, re.IGNORECASE))
        
        relevant_blocks = []
        for ib in instr_matches:
            qs = int(ib.group(2))
            qe = int(ib.group(3))
            if q_min <= qs and qe <= q_max:
                pos = ib.start()
                snippet = full_pdf_text[pos:pos+600]
                relevant_blocks.append({
                    "start": qs,
                    "end": qe,
                    "snippet": snippet
                })

        if not relevant_blocks:
            continue

        # Sort blocks by starting question number
        relevant_blocks.sort(key=lambda x: x['start'])
        
        # Remove duplicate ranges if any
        unique_blocks = []
        seen_starts = set()
        for b in relevant_blocks:
            if b['start'] not in seen_starts:
                unique_blocks.append(b)
                seen_starts.add(b['start'])

        new_groups = []
        color_idx = 0

        for b in unique_blocks:
            qs = b['start']
            qe = b['end']
            snippet = b['snippet']

            group_qs = [q for q in all_qs if qs <= q['questionNo'] <= qe]
            if not group_qs: continue

            ans_list = [q['correctAnswer'] for q in group_qs]
            q_type, pool = detect_type_and_pool(snippet, ans_list)
            first_line = snippet.split('\n')[0] if snippet else f"Questions {qs}-{qe}"

            grp_obj = {
                "group_id": len(new_groups) + 1,
                "group_color": GROUP_COLORS[color_idx % len(GROUP_COLORS)],
                "question_type": q_type,
                "instruction": clean_str(first_line),
                "options_pool": pool,
                "questions": group_qs
            }

            if "NO MORE THAN" in snippet.upper():
                wm = re.search(r'(NO MORE THAN [^\.\n]+)', snippet, re.I)
                if wm:
                    grp_obj["max_words_instruction"] = clean_str(wm.group(1))

            new_groups.append(grp_obj)
            color_idx += 1

        if new_groups:
            data['question_groups'] = new_groups
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Refactored question_groups for {json_filename} into {len(new_groups)} groups.")

print("=== Refactoring Question Groups across all 34 Tests according to PROMPT SPEC ===")
for t in range(6, 35):
    process_file_groups(t)
print("Finished refactoring all question groups!")
