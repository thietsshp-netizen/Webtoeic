import os, sys, re, json, pypdf

BC_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/BO 9 DE THI THAT CUA BRITISH COUNCIL'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

def clean_str(s):
    if not s: return ""
    return re.sub(r'\s+', ' ', s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')).strip()

def detect_type_and_pool(b_txt, answers):
    b_up = b_txt.upper()
    pool = {}

    if "LIST OF HEADINGS" in b_up or "CORRECT HEADING FOR EACH" in b_up or "HEADINGS BELOW" in b_up:
        matches = re.findall(r'\b(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)[\.\s]+([^\n\r]+)', b_txt, re.I)
        for num, txt in matches:
            pool[num.lower()] = clean_str(txt)
        return "MATCHING_HEADINGS", pool

    if "TRUE" in b_up and "FALSE" in b_up:
        return "TRUE_FALSE_NOT_GIVEN", pool

    if "YES" in b_up and "NO" in b_up:
        return "YES_NO_NOT_GIVEN", pool

    if "CHOOSE TWO" in b_up or "CHOOSE THREE" in b_up or "CHOOSE TWO LETTERS" in b_up:
        return "MULTIPLE_CHOICE_MULTI", pool

    if "CHOOSE THE CORRECT LETTER" in b_up or "A, B, C OR D" in b_up:
        return "MULTIPLE_CHOICE_SINGLE", pool

    if "LOOK AT THE FOLLOWING" in b_up or "MATCH EACH" in b_up or "LIST OF STATEMENTS" in b_up:
        matches = re.findall(r'\b([A-H])\b\s+([^\n\r]+)', b_txt)
        for letter, txt in matches:
            if len(txt) > 5 and not txt.startswith("Questions"):
                pool[letter] = clean_str(txt)
        return "MATCHING_FEATURES", pool

    if "SUMMARY" in b_up or "COMPLETE THE SUMMARY" in b_up:
        return "SUMMARY_COMPLETION_TEXT", pool

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

def refactor_bc_test(test_idx):
    practice_files = [f for f in os.listdir(BC_DIR) if f.startswith(f"reading_ac_practice{test_idx}")]
    if not practice_files: return
    
    pdf_path = os.path.join(BC_DIR, practice_files[0])
    reader = pypdf.PdfReader(pdf_path)
    full_pdf_text = "\n".join([p.extract_text() for p in reader.pages])

    for p_num in range(1, 4):
        fn = f"bc_test_{test_idx:02d}_passage_{p_num}.json"
        path = os.path.join(OUT_DIR, fn)
        if not os.path.exists(path): continue

        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        existing_groups = data.get('question_groups', [])
        if not existing_groups: continue

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

        if not relevant_blocks: continue

        relevant_blocks.sort(key=lambda x: x['start'])
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
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Refactored British Council file {fn} into {len(new_groups)} groups.")

print("=== Refactoring Question Groups for all 9 British Council Tests ===")
for t in range(1, 10):
    refactor_bc_test(t)
print("Finished refactoring all 9 British Council Tests!")
