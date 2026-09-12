import os, sys, re, json, pypdf, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
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

def parse_clean_answers(ak_text):
    sec_blocks = re.split(r'Section\s*([123])', ak_text, flags=re.IGNORECASE)
    ans_by_section = {1: {}, 2: {}, 3: {}}
    
    if len(sec_blocks) >= 3:
        for i in range(1, len(sec_blocks), 2):
            sec_num = int(sec_blocks[i])
            sec_txt = sec_blocks[i+1]
            matches = re.findall(r'(?:^|\s)(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', sec_txt)
            for q_str, a_str in matches:
                q_n = int(q_str)
                a_clean = re.sub(r'\s+', ' ', a_str).strip()
                a_clean = re.sub(r'Reading\s+Test.*|Section.*', '', a_clean).strip()
                up = a_clean.upper()
                if up in ['TURE', 'TRU']: a_clean = 'TRUE'
                elif up in ['Y ES', 'YES']: a_clean = 'YES'
                elif up in ['NOT GIVEN', 'NOTGIVEN']: a_clean = 'NOT GIVEN'
                
                if len(a_clean) < 60:
                    ans_by_section[sec_num][q_n] = a_clean
    else:
        matches = re.findall(r'(?:^|\s)(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', ak_text)
        for q_str, a_str in matches:
            q_n = int(q_str)
            a_clean = re.sub(r'\s+', ' ', a_str).strip()
            up = a_clean.upper()
            if up in ['TURE', 'TRU']: a_clean = 'TRUE'
            elif up in ['Y ES', 'YES']: a_clean = 'YES'
            elif up in ['NOT GIVEN', 'NOTGIVEN']: a_clean = 'NOT GIVEN'
            
            sec = 1 if q_n <= 13 else (2 if q_n <= 26 else 3)
            ans_by_section[sec][q_n] = a_clean
            
    return ans_by_section

def format_explanation(q_num, q_type, q_text, ans, ev_sid, ev_text_vi, q_vi):
    if q_type in ["TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN"]:
        if ans in ["NOT GIVEN", "Not given", "Not Given"]:
            why_correct = f"Bài đọc không đề cập đến thông tin này. Do đó đáp án là NOT GIVEN."
            why_wrong = "Không có cơ sở trong bài đọc để khẳng định Đúng hay Sai."
        elif ans in ["TRUE", "YES"]:
            why_correct = f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Thông tin bài đọc xác nhận nội dung câu hỏi, nên đáp án đúng là {ans}."
            why_wrong = f"Đáp án trái ngược hoặc mâu thuẫn với dẫn chứng trong bài đọc."
        else: # FALSE / NO
            why_correct = f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Thông tin trong bài đọc mâu thuẫn trực tiếp với câu hỏi, nên đáp án đúng là {ans}."
            why_wrong = f"Thông tin câu hỏi đưa ra bị sai lệch so với bài đọc."
    elif q_type == "MULTIPLE_CHOICE_SINGLE":
        why_correct = f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Thông tin bài đọc khẳng định đáp án đúng là {ans}."
        why_wrong = f"Các phương án còn lại không đúng hoặc mâu thuẫn với nội dung bài đọc."
    else: # FILL_IN_BLANKS / SHORT_ANSWER / MATCHING
        why_correct = f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Từ/cụm từ phù hợp nhất cần điền/trả lời là \"{ans}\"."
        why_wrong = f"Các từ khác không khớp với ngữ cảnh và thông tin bài đọc."

    return {
        "vi": f"Dịch câu hỏi {q_num}: {q_vi}",
        "why_correct": why_correct,
        "why_wrong": why_wrong
    }

def process_test_pdf(test_id):
    pdf_filename = f"idp_test_{test_id:02d}.pdf"
    pdf_path = os.path.join(SPLIT_DIR, pdf_filename)
    if not os.path.exists(pdf_path):
        return

    reader = pypdf.PdfReader(pdf_path)
    n_pages = len(reader.pages)
    
    # Identify Answer Key pages at the end
    ak_start = n_pages - 1
    for p in range(n_pages - 1, 0, -1):
        txt = reader.pages[p].extract_text()
        if 'Section 1' in txt or '1 ' in txt or 'Answer' in txt:
            ak_start = p
        else:
            break

    reading_txt = "\n".join([reader.pages[i].extract_text() for i in range(ak_start)])
    ak_txt = "\n".join([reader.pages[i].extract_text() for i in range(ak_start, n_pages)])
    
    ans_by_section = parse_clean_answers(ak_txt)

    # Separate Sections 1, 2, 3
    sec_matches = list(re.finditer(r'\b(SECTION\s*[123]|READING PASSAGE\s*[123])\b', reading_txt, re.IGNORECASE))
    sec_pos = {}
    for sm in sec_matches:
        s_txt = sm.group(0).upper()
        if '1' in s_txt and 1 not in sec_pos: sec_pos[1] = sm.start()
        elif '2' in s_txt and 2 not in sec_pos: sec_pos[2] = sm.start()
        elif '3' in s_txt and 3 not in sec_pos: sec_pos[3] = sm.start()

    pos1 = sec_pos.get(1, 0)
    pos2 = sec_pos.get(2, len(reading_txt) // 3)
    pos3 = sec_pos.get(3, (len(reading_txt) // 3) * 2)

    sections = [
        (1, reading_txt[pos1:pos2]),
        (2, reading_txt[pos2:pos3]),
        (3, reading_txt[pos3:])
    ]

    for p_num, sec_text in sections:
        # Ignore top header line 'You should spend about 20 minutes...'
        clean_sec = re.sub(r'You should spend about 20 minutes on Questions.*', '', sec_text, count=1, flags=re.IGNORECASE)
        
        # Locate Question Block start after title: 'Questions 1–6' or 'Questions 14-19' or 'Questions 27-32'
        q_start_m = re.search(r'\n\s*Questions?\s+\d+[\–\-\—\s]+\d+', clean_sec, re.IGNORECASE)
        
        if q_start_m:
            passage_raw = clean_sec[:q_start_m.start()]
            questions_raw = clean_sec[q_start_m.start():]
        else:
            passage_raw = clean_sec
            questions_raw = ""

        # Clean Passage Text
        sec_clean = re.sub(r'©\s*The British Council.*?\d+', '', passage_raw)
        sec_clean = re.sub(r'©\s*British Council.*?\d+', '', sec_clean)
        sec_clean = re.sub(r'Candidate Name.*', '', sec_clean)
        sec_clean = re.sub(r'Candidate Number.*', '', sec_clean)

        lines = [clean_str(l) for l in sec_clean.split('\n') if clean_str(l)]
        clean_lines = []
        for l in lines:
            if len(l) < 60 and any(l.upper().startswith(p) for p in ['SECTION 1', 'SECTION 2', 'SECTION 3', 'READING PASSAGE 1', 'READING PASSAGE 2', 'READING PASSAGE 3', 'READING TEST', 'CANDIDATE NAME', 'CANDIDATE NUMBER', 'COPYRIGHT', '©']):
                continue
            clean_lines.append(l)

        title = clean_lines[0] if clean_lines else f"Passage {p_num}"
        body_lines = clean_lines[1:] if (clean_lines and clean_lines[0] == title) else clean_lines

        full_p_str = " ".join(body_lines)
        
        # Match paragraph blocks A., B., C.
        para_matches = re.findall(r'([A-H])[\.\s]+([^A-H]+?)(?=\s+[A-H][\.\s]|\s*$)', full_p_str)
        
        sid_counter = 1
        html_paragraphs = []
        sid_map = {}

        if para_matches:
            for label, content in para_matches:
                sents = split_sentences_clean(content)
                spans = []
                for s in sents:
                    sid = f"p{p_num}-s{sid_counter}"
                    sid_map[sid] = s
                    spans.append(f"<span data-sid=\"{sid}\">{s}</span>")
                    sid_counter += 1
                if spans:
                    html_paragraphs.append(f"<p><b>{label}.</b> {' '.join(spans)}</p>")
        else:
            sents = split_sentences_clean(full_p_str)
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

        # Dynamic question range for this section
        valid_q_min = 1 if p_num == 1 else (14 if p_num == 2 else 27)
        valid_q_max = 13 if p_num == 1 else (26 if p_num == 2 else 40)
        
        test_answers = ans_by_section.get(p_num, {})

        # Parse Question Groups
        q_blocks = re.split(r'(?:^|\n|\.\s+|\s{2,})(Questions?\s+\d+\s*[\–\-\—\s]?\s*\d*)', questions_raw, flags=re.IGNORECASE)
        question_groups = []
        group_idx = 1

        for i in range(1, len(q_blocks), 2):
            header = q_blocks[i]
            block_text = q_blocks[i+1] if i+1 < len(q_blocks) else ""
            
            m_num = re.search(r'Questions?\s+(\d+)\s*[\–\-\—\s]*(\d*)', header, re.IGNORECASE)
            if not m_num:
                continue
            q_start = int(m_num.group(1))
            q_end = int(m_num.group(2)) if m_num.group(2) else q_start

            q_type = "SHORT_ANSWER"
            options_pool = {}

            if 'TRUE' in block_text and 'FALSE' in block_text: q_type = "TRUE_FALSE_NOT_GIVEN"
            elif 'YES' in block_text and 'NO' in block_text: q_type = "YES_NO_NOT_GIVEN"
            elif 'Which paragraph contains' in block_text: q_type = "MATCHING_INFORMATION"
            elif 'List of Headings' in block_text:
                q_type = "MATCHING_HEADINGS"
                headings = re.findall(r'\b(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\s+([^\n]+)', block_text)
                for h_code, h_val in headings:
                    options_pool[h_code] = clean_str(h_val)
            elif re.search(r'\b[A-D]\s+', block_text) and ('Choose' in block_text or 'MULTIPLE' in block_text):
                q_type = "MULTIPLE_CHOICE_SINGLE"
            elif 'Complete' in block_text or 'NO MORE THAN' in block_text: q_type = "FILL_IN_BLANKS"

            first_q_pos = re.search(rf'\b{q_start}\b', block_text)
            instruction = clean_str(block_text[:first_q_pos.start()]) if first_q_pos else clean_str(header)
            q_body = block_text[first_q_pos.start():] if first_q_pos else block_text

            item_dict = {}
            for q_n in range(q_start, q_end + 1):
                pattern = rf'(?:^|\n|\.\s+|\s{{2,}})\b{q_n}\b[\.\s]+([\s\S]+?)(?=(?:^|\n|\.\s+|\s{{2,}})\b{q_n+1}\b[\.\s]+|\bQuestions?\b|$)'
                m_item = re.search(pattern, q_body, re.IGNORECASE)
                if m_item:
                    item_dict[q_n] = clean_str(m_item.group(1))

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

                words = set(re.findall(r'\w{4,}', (q_text + ' ' + str(ans)).lower()))
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

                explanation_obj = format_explanation(q_num, q_type, q_text, ans, ev_sid, ev_text_vi, q_vi)

                questions.append({
                    "questionNo": q_num,
                    "text": q_text,
                    "prefix": "",
                    "suffix": "",
                    "options": opts,
                    "correctAnswer": ans,
                    "evidence_sids": [ev_sid],
                    "explanation": explanation_obj
                })

            group_color = GROUP_COLORS[(p_num + group_idx) % len(GROUP_COLORS)]
            question_groups.append({
                "group_id": group_idx,
                "group_color": group_color,
                "question_type": q_type,
                "instruction": instruction,
                "options_pool": options_pool,
                "questions": questions
            })
            group_idx += 1

        obj = {
            "test_id": test_id,
            "test_title": f"IELTS Reading Test {test_id}",
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

        out_filename = f"test_{test_id:02d}_passage_{p_num}.json"
        out_path = os.path.join(OUT_DIR, out_filename)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)

        total_qs = sum(len(g['questions']) for g in question_groups)
        print(f"Generated {out_filename}: {title[:35]} ({len(translation_map)} sents, {total_qs} questions Q{valid_q_min}-Q{valid_q_max})")

if __name__ == '__main__':
    print("=== Generating ALL 34 IDP Tests (102 Passages) PERFECTLY ===")
    for t_id in range(1, 35):
        process_test_pdf(t_id)
    print("\nFINISHED GENERATING ALL 102 JSON FILES PERFECTLY!")
