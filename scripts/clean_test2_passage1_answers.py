import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
t2p1_path = os.path.join(OUT_DIR, 'test_02_passage_1.json')

with open(t2p1_path, 'r', encoding='utf-8') as f:
    t2p1 = json.load(f)

# Group 2 is SHORT_ANSWER (Q7-Q13)
questions = t2p1['question_groups'][1]['questions']

for q in questions:
    no = q['questionNo']
    if no == 8:
        q['correctAnswer'] = "bony carapace"
        q['explanation']['why_correct'] = "Dẫn chứng từ câu [p1-s6]: \"The distinctive lack of a rigid bony carapace sets the Leatherback apart...\". Từ lấy trực tiếp trong bài là \"bony carapace\" (hoặc \"rigid bony carapace\")."
    elif no == 9:
        q['correctAnswer'] = "insulating fat"
        q['explanation']['why_correct'] = "Dẫn chứng từ câu [p1-s9]: \"...counter-current heat exchange systems and thick layers of insulating fat.\" Từ lấy trực tiếp trong bài là \"insulating fat\"."
    elif no == 10:
        q['correctAnswer'] = "Florida"
        q['explanation']['why_correct'] = "Dẫn chứng từ câu [p1-s10]: \"...nesting grounds in Florida and South America.\" Từ lấy trực tiếp trong bài phù hợp giới hạn 3 từ là \"Florida\"."
    elif no == 11:
        q['correctAnswer'] = "geomagnetic field"
        q['explanation']['why_correct'] = "Dẫn chứng từ câu [p1-s11]: \"...detecting the Earth's geomagnetic field.\" Từ lấy trực tiếp trong bài là \"geomagnetic field\" (hoặc \"Earth's geomagnetic field\")."
    elif no == 12:
        q['correctAnswer'] = "their meat"
        q['explanation']['why_correct'] = "Dẫn chứng từ câu [p1-s12]: \"Green Sea turtles were heavily hunted for their meat...\" Từ trích xuất chuẩn xác từ bài đọc là \"their meat\"."

with open(t2p1_path, 'w', encoding='utf-8') as f:
    json.dump(t2p1, f, ensure_ascii=False, indent=2)

print("Updated test_02_passage_1.json with clean, exact passage phrases compliant with 3-word limit!")
