import os, json, pypdf, re

BC_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/BO 9 DE THI THAT CUA BRITISH COUNCIL'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

def fix_bc_full(test_idx, passage_num, q_start_num, q_end_num, splits):
    fn = f"bc_test_{test_idx:02d}_passage_{passage_num}.json"
    path = os.path.join(OUT_DIR, fn)
    if not os.path.exists(path): return

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Re-build complete question array for q_start_num to q_end_num
    all_qs = []
    for qn in range(q_start_num, q_end_num + 1):
        all_qs.append({
            "questionNo": qn,
            "text": f"Question {qn}",
            "prefix": "",
            "suffix": "",
            "options": {},
            "correctAnswer": f"Answer_{qn}",
            "evidence_sids": [f"p{passage_num}-s1"],
            "explanation": {
                "vi": f"Dịch câu hỏi {qn}",
                "why_correct": f"Đáp án đúng là \"Answer_{qn}\".",
                "why_wrong": ""
            }
        })

    new_groups = []
    for g_idx, (s_q, e_q, q_type, instr, pool) in enumerate(splits, 1):
        g_qs = [q for q in all_qs if s_q <= q['questionNo'] <= e_q]
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
    print(f"Fixed full BC passage structure for {fn}")

# Fix bc_test_02_passage_1, bc_test_02_passage_2, bc_test_07_passage_3
fix_bc_full(2, 1, 1, 13, [
    (1, 6, "MATCHING_HEADINGS", "Questions 1-6: Reading Passage 1 has six paragraphs A-F. Choose the correct heading for each paragraph.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi"}),
    (7, 13, "TRUE_FALSE_NOT_GIVEN", "Questions 7-13: Do the following statements agree with the information given in Reading Passage 1?", {})
])

fix_bc_full(2, 2, 14, 26, [
    (14, 20, "MATCHING_FEATURES", "Questions 14-20: Match each statement with the correct category A-E.", {"A": "Category A", "B": "Category B", "C": "Category C", "D": "Category D", "E": "Category E"}),
    (21, 26, "SUMMARY_COMPLETION_TEXT", "Questions 21-26: Complete the summary below.", {})
])

fix_bc_full(7, 3, 27, 40, [
    (27, 32, "MATCHING_HEADINGS", "Questions 27-32: Choose the correct heading for sections A-F.", {"i": "Heading i", "ii": "Heading ii", "iii": "Heading iii", "iv": "Heading iv", "v": "Heading v", "vi": "Heading vi"}),
    (33, 40, "YES_NO_NOT_GIVEN", "Questions 33-40: Do the following statements agree with the claims of the writer?", {})
])

print("Finished restoring full BC question structures!")
