import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted([f for f in os.listdir(out_dir) if f.endswith('.json')])

valid_types = {
    "TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN", "MULTIPLE_CHOICE_SINGLE", "MULTIPLE_CHOICE_MULTI",
    "MATCHING_HEADINGS", "MATCHING_INFORMATION", "MATCHING_FEATURES", "MATCHING_SENTENCE_ENDINGS",
    "SUMMARY_COMPLETION_TEXT", "SUMMARY_COMPLETION_BOX", "SENTENCE_COMPLETION", "TABLE_COMPLETION",
    "FLOWCHART_COMPLETION", "DIAGRAM_LABEL", "SHORT_ANSWER", "FILL_IN_BLANKS"
}

total_groups = 0
invalid_types = []

for f in files:
    path = os.path.join(out_dir, f)
    with open(path, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    groups = data.get('question_groups', [])
    total_groups += len(groups)
    for g in groups:
        gt = g.get('question_type')
        if gt not in valid_types:
            invalid_types.append((f, gt))

print(f"Total audited JSON files: {len(files)}")
print(f"Total question groups across all files: {total_groups}")
print(f"Average question groups per passage: {total_groups / len(files):.2f}")
print(f"Invalid question types count: {len(invalid_types)}")
if invalid_types:
    print("Invalid types:", invalid_types[:10])
else:
    print("100% OF QUESTION GROUPS HAVE COMPLIANT IELTS READING TYPES!")
