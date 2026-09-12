import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

def fix_file(fn, splits):
    path = os.path.join(out_dir, fn)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    all_qs = []
    for g in data.get('question_groups', []):
        all_qs.extend(g.get('questions', []))

    new_groups = []
    for g_idx, (q_start, q_end, q_type, instr, pool) in enumerate(splits, 1):
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

    data['question_groups'] = new_groups
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Successfully fixed {fn}")

fix_file("bc_test_02_passage_1.json", [
    (1, 6, "MATCHING_HEADINGS", "Questions 1-6: Reading Passage 1 has six paragraphs A-F. Choose the correct heading for each paragraph.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi"}),
    (7, 13, "TRUE_FALSE_NOT_GIVEN", "Questions 7-13: Do the following statements agree with the information given in Reading Passage 1?", {})
])

fix_file("bc_test_02_passage_2.json", [
    (14, 20, "MATCHING_FEATURES", "Questions 14-20: Match each statement with the correct category A-E.", {"A": "Category A", "B": "Category B", "C": "Category C", "D": "Category D", "E": "Category E"}),
    (21, 26, "SUMMARY_COMPLETION_TEXT", "Questions 21-26: Complete the summary below.", {})
])

fix_file("bc_test_07_passage_3.json", [
    (27, 32, "MATCHING_HEADINGS", "Questions 27-32: Choose the correct heading for sections A-F.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi"}),
    (33, 40, "YES_NO_NOT_GIVEN", "Questions 33-40: Do the following statements agree with the claims of the writer?", {})
])

print("Finished fixing last 3 BC files!")
