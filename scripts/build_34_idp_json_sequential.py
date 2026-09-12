import os, sys, re, json, pypdf, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

PDF_PATH = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
os.makedirs(OUT_DIR, exist_ok=True)

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

def clean_str(s):
    if not s:
        return ""
    s = s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def translate_single(text):
    text = clean_str(text)
    if not text:
        return ""
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return clean_str(''.join([item[0] for item in data[0] if item[0]]))
    except Exception:
        return text

def split_sentences_clean(text):
    if not text:
        return []
    protected = text.replace('!', ' ').replace('$', ' ')
    abbrevs = ["Dr.", "Mr.", "Mrs.", "Ms.", "Prof.", "St.", "Sr.", "Jr.", "U.S.", "U.K.", "e.g.", "i.e.", "etc.", "a.m.", "p.m.", "vs.", "vol.", "no.", "pp.", "p.", "cf.", "al.", "Ph.D.", "B.A.", "M.A."]
    for abbr in abbrevs:
        protected = protected.replace(abbr, abbr.replace(".", "___DOT___"))
    protected = re.sub(r"(\d+)\.(\d+)", r"\1___DOT___\2", protected)
    protected = re.sub(r"\b([A-Z])\.", r"\1___DOT___", protected)
    
    raw_sents = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"\(])", protected)
    clean_sents = []
    for s in raw_sents:
        s_restored = s.replace("___DOT___", ".").strip()
        s_restored = re.sub(r"\s+", " ", s_restored)
        if len(s_restored) > 8 and not s_restored.startswith("©") and "All rights reserved" not in s_restored and "Candidate Number" not in s_restored:
            clean_sents.append(s_restored)
    return clean_sents

print("Reading 34 De Thi Reading BC_IDP.pdf...")
reader = pypdf.PdfReader(PDF_PATH)

# Extract Answer Keys from page 460 onwards
answer_keys = {}
for p_idx in range(459, len(reader.pages)):
    txt = reader.pages[p_idx].extract_text()
    test_matches = re.finditer(r'(?:Reading\s+Test|TEST)\s+(\d+)', txt, re.IGNORECASE)
    test_positions = [(m.group(1), m.start()) for m in test_matches]
    
    for idx, (t_num_str, start_pos) in enumerate(test_positions):
        t_num = int(t_num_str)
        end_pos = test_positions[idx+1][1] if idx + 1 < len(test_positions) else len(txt)
        block = txt[start_pos:end_pos]
        
        if t_num not in answer_keys:
            answer_keys[t_num] = {}
            
        matches_dot = re.findall(r'(\d{1,2})\.\s*([A-Za-z0-9\/\(\)\s\-,\'\.\"\?]+?)(?=\s+\d{1,2}\.|\s*$)', block)
        for q_str, a_str in matches_dot:
            q_n = int(q_str)
            a_c = clean_str(a_str)
            if 1 <= q_n <= 40 and len(a_c) < 80:
                answer_keys[t_num][q_n] = a_c

        if len(answer_keys[t_num]) < 20:
            matches_inline = re.findall(r'(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|\s*$)', block)
            for q_str, a_str in matches_inline:
                q_n = int(q_str)
                a_c = clean_str(a_str)
                if 1 <= q_n <= 40 and len(a_c) < 60:
                    answer_keys[t_num][q_n] = a_c

print(f"Extracted Answer Keys for {len(answer_keys)} tests.")

# Identify test page ranges
test_starts = []
for p_idx in range(3, 458):
    txt = reader.pages[p_idx].extract_text()
    m = re.search(r'\bReading\s+Test\s+(\d+)\b', txt, re.IGNORECASE)
    if m:
        t_num = int(m.group(1))
        if not any(t == t_num for t, _ in test_starts):
            test_starts.append((t_num, p_idx))

test_starts.sort(key=lambda x: x[1])

def parse_q_block_dynamic(header, raw_block, test_answers, sid_map, translation_map, p_num, group_idx, valid_q_min, valid_q_max):
    m_num = re.search(r'Questions?\s+(\d+)\s*[\–\-\—\s]*(\d*)', header, re.IGNORECASE)
    if not m_num:
        return None
    q_start = int(m_num.group(1))
    q_end = int(m_num.group(2)) if m_num.group(2) else q_start

    # Ignore question blocks outside this passage's dynamic range!
    if q_start > valid_q_max or q_end < valid_q_min:
        return None

    q_start = max(valid_q_min, q_start)
    q_end = min(valid_q_max, q_end)

    q_type = "SHORT_ANSWER"
    options_pool = {}

    if 'TRUE' in raw_block and 'FALSE' in raw_block:
        q_type = "TRUE_FALSE_NOT_GIVEN"
    elif 'YES' in raw_block and 'NO' in raw_block:
        q_type = "YES_NO_NOT_GIVEN"
    elif 'Which paragraph contains' in raw_block:
        q_type = "MATCHING_INFORMATION"
    elif 'List of Headings' in raw_block:
        q_type = "MATCHING_HEADINGS"
        headings = re.findall(r'\b(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\s+([^\n]+)', raw_block)
        for h_code, h_val in headings:
            options_pool[h_code] = clean_str(h_val)
    elif 'Classify the following' in raw_block:
        q_type = "CLASSIFICATION"
        class_items = re.findall(r'([A-E])\s+([^\n]+)', raw_block[:raw_block.find(str(q_start)) if str(q_start) in raw_block else 300])
        for c_code, c_val in class_items:
            options_pool[c_code] = clean_str(c_val)
    elif re.search(r'\b[A-D]\s+', raw_block) and ('Choose the correct letter' in raw_block or 'MULTIPLE' in raw_block):
        q_type = "MULTIPLE_CHOICE_SINGLE"
    elif 'Complete' in raw_block or 'NO MORE THAN' in raw_block:
        q_type = "FILL_IN_BLANKS"

    first_q_pos = re.search(rf'\b{q_start}\b', raw_block)
    instruction = clean_str(raw_block[:first_q_pos.start()]) if first_q_pos else clean_str(header)
    q_body = raw_block[first_q_pos.start():] if first_q_pos else raw_block
    
    item_dict = {}
    for q_n in range(q_start, q_end + 1):
        pattern = rf'(?:^|\n|\.\s+|\s{{2,}})\b{q_n}\b[\.\s]+([\s\S]+?)(?=(?:^|\n|\.\s+|\s{{2,}})\b{q_n+1}\b[\.\s]+|\bQuestions?\b|$)'
        m = re.search(pattern, q_body, re.IGNORECASE)
        if m:
            txt = clean_str(m.group(1))
            txt = re.sub(r'©.*|\.\s*All rights reserved.*', '', txt)
            if len(txt) > 5:
                item_dict[q_n] = txt

    questions = []
    for q_num in range(q_start, q_end + 1):
        ans = test_answers.get(q_num, "")
        
        if q_type in ["MATCHING_HEADINGS", "MATCHING_INFORMATION"]:
            p_letter = chr(ord('A') + (q_num - q_start))
            seg_text = f"Paragraph {p_letter}"
        else:
            seg_text = item_dict.get(q_num, f"Question {q_num}")

        opts = {}
        q_text = seg_text

        if q_type == "MULTIPLE_CHOICE_SINGLE":
            opt_matches = re.findall(r'\b([A-D])\s+([^A-D\n]+)', seg_text)
            if opt_matches:
                a_pos = re.search(r'\bA\s+', seg_text)
                if a_pos:
                    q_text = clean_str(seg_text[:a_pos.start()])
                for o_code, o_val in opt_matches:
                    opts[o_code] = clean_str(o_val)

        words = set(re.findall(r'\w{4,}', (q_text + ' ' + ans).lower()))
        best_sid = None
        best_score = 0
        for sid, sentence in sid_map.items():
            s_words = set(re.findall(r'\w{4,}', sentence.lower()))
            score = len(words.intersection(s_words))
            if score > best_score:
                best_score = score
                best_sid = sid
        
        ev_sid = best_sid if (best_sid and best_score >= 1) else f"p{p_num}-s1"
        ev_text_vi = translation_map.get(ev_sid, "")
        q_vi = translate_single(q_text)

        why_correct_msg = f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Nội dung bài đọc xác nhận thông tin này, nên đáp án đúng là \"{ans}\"."
        if q_type == "TRUE_FALSE_NOT_GIVEN" and ans == "NOT GIVEN":
            why_correct_msg = f"Bài đọc không đề cập thông tin này. Do đó đáp án là NOT GIVEN."

        questions.append({
            "questionNo": q_num,
            "text": q_text,
            "prefix": "",
            "suffix": "",
            "options": opts,
            "correctAnswer": ans,
            "evidence_sids": [ev_sid],
            "explanation": {
                "vi": f"Dịch câu hỏi {q_num}: {q_vi}",
                "why_correct": why_correct_msg,
                "why_wrong": "Các phương án khác không đúng với thông tin trong bài đọc."
            }
        })

    group_color = GROUP_COLORS[(p_num + group_idx) % len(GROUP_COLORS)]

    return {
        "group_id": group_idx,
        "group_color": group_color,
        "question_type": q_type,
        "instruction": instruction,
        "options_pool": options_pool,
        "questions": questions
    }

def process_idp_passage_dynamic(test_idx, p_num, sec_text, valid_q_min, valid_q_max):
    test_answers = answer_keys.get(test_idx, {})

    sec_clean = re.sub(r'©\s*The British Council.*?\d+', '', sec_text)
    sec_clean = re.sub(r'©\s*British Council.*?\d+', '', sec_clean)
    sec_clean = re.sub(r'Candidate Name.*', '', sec_clean)
    sec_clean = re.sub(r'Candidate Number.*', '', sec_clean)
    sec_clean = re.sub(r'^.*?You should spend about 20 minutes on Questions \d+–?\d+.*?below\.', '', sec_clean, flags=re.DOTALL).strip()

    lines = sec_clean.split('\n')
    passage_lines = []
    
    for l in lines:
        l_c = clean_str(l)
        if not l_c:
            continue
        l_upper = l_c.upper()

        if len(l_c) < 60 and any(l_upper.startswith(p) for p in ['SECTION 1', 'SECTION 2', 'SECTION 3', 'READING PASSAGE 1', 'READING PASSAGE 2', 'READING PASSAGE 3', 'READING TEST', 'CANDIDATE NAME', 'CANDIDATE NUMBER', 'COPYRIGHT', '©']):
            continue

        if re.match(r'^\d{1,2}\s+(?:Paragraph|TRUE|FALSE|NOT GIVEN|YES|NO|[A-D]\b)', l_c) and len(l_c) < 80:
            continue

        passage_lines.append(l_c)

    title = passage_lines[0] if passage_lines else f"Passage {p_num}"
    body_lines = passage_lines[1:] if (passage_lines and passage_lines[0] == title) else passage_lines

    full_p_str = " ".join(body_lines)
    sents = split_sentences_clean(full_p_str)
    
    sid_counter = 1
    html_paragraphs = []
    sid_map = {}
    current_spans = []

    for idx, s in enumerate(sents, 1):
        sid = f"p{p_num}-s{sid_counter}"
        sid_map[sid] = s
        current_spans.append(f"<span data-sid=\"{sid}\">{s}</span>")
        sid_counter += 1

        if len(current_spans) >= 4 or idx == len(sents):
            html_paragraphs.append(f"<p>{' '.join(current_spans)}</p>")
            current_spans = []

    html_content = "".join(html_paragraphs)

    orig_sents = list(sid_map.values())
    sids = list(sid_map.keys())

    with ThreadPoolExecutor(max_workers=8) as sent_pool:
        translated_sents = list(sent_pool.map(translate_single, orig_sents))

    translation_map = {}
    for sid, vi_t in zip(sids, translated_sents):
        translation_map[sid] = vi_t

    # Extract Question Groups DYNAMICALLY for this Passage's Question Range
    q_blocks = re.split(r'(?:^|\n|\.\s+|\s{2,})(Questions?\s+\d+\s*[\–\-\—\s]?\s*\d*)', sec_clean, flags=re.IGNORECASE)
    question_groups = []
    group_idx = 1

    for i in range(1, len(q_blocks), 2):
        header = q_blocks[i]
        block_text = q_blocks[i+1] if i+1 < len(q_blocks) else ""
        next_sec = re.search(r'\n\s*(READING PASSAGE|SECTION)', block_text)
        if next_sec:
            block_text = block_text[:next_sec.start()]
            
        g_obj = parse_q_block_dynamic(header, block_text, test_answers, sid_map, translation_map, p_num, group_idx, valid_q_min, valid_q_max)
        if g_obj:
            question_groups.append(g_obj)
            group_idx += 1

    # Fallback question group if questions were missing
    if not question_groups:
        fallback_questions = []
        for q_idx in range(valid_q_min, valid_q_max + 1):
            ans = test_answers.get(q_idx, "")
            fallback_questions.append({
                "questionNo": q_idx,
                "text": f"Question {q_idx}",
                "prefix": "",
                "suffix": "",
                "options": {},
                "correctAnswer": ans,
                "evidence_sids": [f"p{p_num}-s1"],
                "explanation": {
                    "vi": f"Dịch câu hỏi {q_idx}: Câu hỏi {q_idx}",
                    "why_correct": f"Đáp án đúng là \"{ans}\".",
                    "why_wrong": ""
                }
            })
        question_groups.append({
            "group_id": 1,
            "group_color": GROUP_COLORS[p_num % len(GROUP_COLORS)],
            "question_type": "SHORT_ANSWER",
            "instruction": f"Questions {valid_q_min}-{valid_q_max}",
            "options_pool": {},
            "questions": fallback_questions
        })

    obj = {
        "test_id": test_idx,
        "test_title": f"IELTS Reading Test {test_idx}",
        "passage_number": p_num,
        "passage_title": title,
        "passages": [
            {
                "passage_id": p_num,
                "html_content": html_content,
                "translation_map": translation_map
            }
        ],
        "question_groups": question_groups
    }

    out_filename = f"test_{test_idx:02d}_passage_{p_num}.json"
    out_path = os.path.join(OUT_DIR, out_filename)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

    total_qs = sum(len(g['questions']) for g in question_groups)
    print(f"Generated {out_filename}: {title[:35]} ({len(translation_map)} sents, {total_qs} questions Q{valid_q_min}-Q{valid_q_max})")

# Process all 34 Reading Tests DYNAMICALLY & SEQUENTIALLY
print("\nStarting DYNAMIC & SEQUENTIAL generation of all 102 IDP JSON files...")
for idx, (t_idx, start_page) in enumerate(test_starts):
    end_page = test_starts[idx+1][1] if idx + 1 < len(test_starts) else 458
    print(f"\n--- Test {t_idx:02d} (PDF Pages {start_page+1}-{end_page}) ---")
    
    test_pages_txt = [reader.pages[p].extract_text() for p in range(start_page, end_page)]
    full_test_txt = "\n".join(test_pages_txt)
    
    sec_matches = list(re.finditer(r'\b(SECTION\s*[123]|READING PASSAGE\s*[123])\b', full_test_txt, re.IGNORECASE))
    sec_pos = {}
    for sm in sec_matches:
        s_txt = sm.group(0).upper()
        if '1' in s_txt and 1 not in sec_pos: sec_pos[1] = sm.start()
        elif '2' in s_txt and 2 not in sec_pos: sec_pos[2] = sm.start()
        elif '3' in s_txt and 3 not in sec_pos: sec_pos[3] = sm.start()

    pos1 = sec_pos.get(1, 0)
    pos2 = sec_pos.get(2, len(full_test_txt) // 3)
    pos3 = sec_pos.get(3, (len(full_test_txt) // 3) * 2)

    sec1_txt = full_test_txt[pos1:pos2]
    sec2_txt = full_test_txt[pos2:pos3]
    sec3_txt = full_test_txt[pos3:]

    # DYNAMICALLY DETECT QUESTION RANGE FOR EACH PASSAGE:
    def get_dynamic_range(sec_txt, fallback_min, fallback_max):
        q_hdrs = re.findall(r'Questions?\s+(\d+)\s*[\–\-\—\s]*(\d*)', sec_txt, re.IGNORECASE)
        q_nums = []
        for q1, q2 in q_hdrs:
            if q1: q_nums.append(int(q1))
            if q2: q_nums.append(int(q2))
        q_min = min(q_nums) if q_nums else fallback_min
        q_max = max(q_nums) if q_nums else fallback_max
        return q_min, q_max

    q1_min, q1_max = get_dynamic_range(sec1_txt, 1, 13)
    q2_min, q2_max = get_dynamic_range(sec2_txt, q1_max + 1, q1_max + 13)
    q3_min, q3_max = get_dynamic_range(sec3_txt, q2_max + 1, 40)

    process_idp_passage_dynamic(t_idx, 1, sec1_txt, q1_min, q1_max)
    process_idp_passage_dynamic(t_idx, 2, sec2_txt, q2_min, q2_max)
    process_idp_passage_dynamic(t_idx, 3, sec3_txt, q3_min, q3_max)

print("\nFinished generating all 102 IDP JSON files DYNAMICALLY & SEQUENTIALLY!")
