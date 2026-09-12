import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
bc_files = sorted([f for f in os.listdir(out_dir) if f.startswith('bc_test_') and f.endswith('.json')])

print(f"=== AUDITING ALL {len(bc_files)} BRITISH COUNCIL JSON FILES ===")

valid_types = {
    "TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN", "MULTIPLE_CHOICE_SINGLE", "MULTIPLE_CHOICE_MULTI",
    "MATCHING_HEADINGS", "MATCHING_INFORMATION", "MATCHING_FEATURES", "MATCHING_SENTENCE_ENDINGS",
    "SUMMARY_COMPLETION_TEXT", "SUMMARY_COMPLETION_BOX", "SENTENCE_COMPLETION", "TABLE_COMPLETION",
    "FLOWCHART_COMPLETION", "DIAGRAM_LABEL", "SHORT_ANSWER", "FILL_IN_BLANKS"
}

issues = []

for f in bc_files:
    path = os.path.join(out_dir, f)
    with open(path, 'r', encoding='utf-8') as fp:
        data = json.load(fp)

    p = data.get('passages', [{}])[0]
    if not p.get('html_content'):
        issues.append(f"{f}: empty html_content")
    if not p.get('translation_map'):
        issues.append(f"{f}: empty translation_map")

    groups = data.get('question_groups', [])
    if len(groups) <= 1:
        issues.append(f"{f}: only 1 question group (should be split by instruction block)")

    for g_idx, g in enumerate(groups, 1):
        gt = g.get('question_type')
        if gt not in valid_types:
            issues.append(f"{f} Group {g_idx}: invalid type '{gt}'")
        
        # Check matching types have options_pool
        if gt in ["MATCHING_HEADINGS", "MATCHING_FEATURES", "MATCHING_SENTENCE_ENDINGS", "MATCHING_INFORMATION"]:
            if not g.get('options_pool'):
                issues.append(f"{f} Group {g_idx} ({gt}): missing options_pool")

        for q in g.get('questions', []):
            ca = q.get('correctAnswer')
            if ca is None or ca == "" or ca == []:
                issues.append(f"{f} Q{q.get('questionNo')}: missing correctAnswer")

print(f"Audited {len(bc_files)} files. Total issues found: {len(issues)}")
if issues:
    print("Issues list:")
    for is_str in issues[:20]:
        print("  -", is_str)
else:
    print("ALL 27 BRITISH COUNCIL JSON FILES PASSED 100% PERFECTLY!")
