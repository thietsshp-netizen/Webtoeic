import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

# Fix test_02_passage_1.json Q3 & Q4
t2p1_path = os.path.join(OUT_DIR, 'test_02_passage_1.json')
with open(t2p1_path, 'r', encoding='utf-8') as f:
    t2p1 = json.load(f)

# Q3 should be 'ix' (Thermoregulation / Trans-oceanic), Q4 should be 'viii'
t2p1['question_groups'][0]['questions'][2]['correctAnswer'] = "ix"
t2p1['question_groups'][0]['questions'][3]['correctAnswer'] = "viii"

with open(t2p1_path, 'w', encoding='utf-8') as f:
    json.dump(t2p1, f, ensure_ascii=False, indent=2)

print("Corrected Q3 & Q4 in test_02_passage_1.json to match exact PDF Answer Key!")
