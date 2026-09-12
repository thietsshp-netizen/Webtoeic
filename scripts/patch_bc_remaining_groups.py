import os, sys, re, json, pypdf

BC_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/BO 9 DE THI THAT CUA BRITISH COUNCIL'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

def patch_bc_file(fn, group_splits):
    path = os.path.join(OUT_DIR, fn)
    if not os.path.exists(path): return

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    all_qs = []
    for g in data.get('question_groups', []):
        all_qs.extend(g.get('questions', []))

    if not all_qs: return

    new_groups = []
    for g_idx, (q_start, q_end, q_type, instr, pool) in enumerate(group_splits, 1):
        g_qs = [q for q in all_qs if q_start <= q['questionNo'] <= q_end]
        if not g_qs: continue

        new_groups.append({
            "group_id": g_idx,
            "group_color": GROUP_COLORS[(g_idx-1) % len(GROUP_COLORS)],
            "question_type": q_type,
            "instruction": instr,
            "options_pool": pool if pool else {},
            "questions": g_qs
        })

    if new_groups:
        data['question_groups'] = new_groups
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Patched BC file {fn}")

# Specific fixes for the 5 files needing explicit splitting and options_pool
patch_bc_file("bc_test_02_passage_1.json", [
    (1, 6, "MATCHING_HEADINGS", "Questions 1-6: Reading Passage 1 has six paragraphs A-F. Choose the correct heading for each paragraph.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi", "vii": "Heading vii"}),
    (7, 13, "TRUE_FALSE_NOT_GIVEN", "Questions 7-13: Do the following statements agree with the information given in Reading Passage 1?", {})
])

patch_bc_file("bc_test_02_passage_2.json", [
    (14, 20, "MATCHING_FEATURES", "Questions 14-20: Match each statement with the correct category A-E.", {"A": "Category A", "B": "Category B", "C": "Category C", "D": "Category D", "E": "Category E"}),
    (21, 26, "SUMMARY_COMPLETION_TEXT", "Questions 21-26: Complete the summary below.", {})
])

patch_bc_file("bc_test_03_passage_2.json", [
    (14, 19, "MATCHING_HEADINGS", "Questions 14-19: Choose the correct heading for paragraphs A-F.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi", "vii": "Heading vii", "viii": "Heading viii"}),
    (20, 26, "TRUE_FALSE_NOT_GIVEN", "Questions 20-26: Do the following statements agree with the information given in Reading Passage 2?", {})
])

patch_bc_file("bc_test_05_passage_3.json", [
    (27, 31, "MATCHING_HEADINGS", "Questions 27-31: Choose the correct heading for sections A-E.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi"}),
    (32, 36, "MATCHING_FEATURES", "Questions 32-36: Match each statement with the correct person A-E.", {"A": "Person A", "B": "Person B", "C": "Person C", "D": "Person D", "E": "Person E"}),
    (37, 40, "MULTIPLE_CHOICE_SINGLE", "Questions 37-40: Choose the correct letter A, B, C or D.", {})
])

patch_bc_file("bc_test_07_passage_1.json", [
    (1, 7, "MATCHING_HEADINGS", "Questions 1-7: Choose the correct heading for paragraphs A-G.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi", "vii": "Heading vii", "viii": "Heading viii"}),
    (8, 13, "TRUE_FALSE_NOT_GIVEN", "Questions 8-13: Do the following statements agree with the information given in Reading Passage 1?", {})
])

patch_bc_file("bc_test_07_passage_3.json", [
    (27, 32, "MATCHING_HEADINGS", "Questions 27-32: Choose the correct heading for sections A-F.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi", "vii": "Heading vii"}),
    (33, 40, "YES_NO_NOT_GIVEN", "Questions 33-40: Do the following statements agree with the claims of the writer?", {})
])

patch_bc_file("bc_test_08_passage_2.json", [
    (14, 20, "MATCHING_HEADINGS", "Questions 14-20: Choose the correct heading for paragraphs A-G.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi", "vii": "Heading vii", "viii": "Heading viii"}),
    (21, 26, "TRUE_FALSE_NOT_GIVEN", "Questions 21-26: Do the following statements agree with the information given in Reading Passage 2?", {})
])

patch_bc_file("bc_test_08_passage_3.json", [
    (27, 31, "MATCHING_HEADINGS", "Questions 27-31: Choose the correct heading for sections A-E.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi"}),
    (32, 36, "MATCHING_FEATURES", "Questions 32-36: Match each statement with the correct person A-E.", {"A": "Person A", "B": "Person B", "C": "Person C", "D": "Person D", "E": "Person E"}),
    (37, 40, "MULTIPLE_CHOICE_SINGLE", "Questions 37-40: Choose the correct letter A, B, C or D.", {})
])

print("Finished patching BC remaining groups!")
