import os, sys, re, json, pypdf, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
os.makedirs(OUT_DIR, exist_ok=True)

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

# Global translation cache
translation_cache = {}

def clean_str(s):
    if not s:
        return ""
    s = s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

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

def is_question_start(tokens, idx):
    if idx >= len(tokens):
        return False
    token = tokens[idx]
    if not token.isdigit():
        return False
    val = int(token)
    if not (1 <= val <= 40):
        return False
    if idx + 1 >= len(tokens):
        return False
    if tokens[idx+1].isdigit():
        val_next = int(tokens[idx+1])
        if 1 <= val_next <= 40:
            if idx + 2 < len(tokens) and not tokens[idx+2].isdigit():
                return False
    return True

def parse_answers_from_ak(ak_text):
    # Remove Section X, Reading Test X, TEST X headers to avoid number collision
    ak_text = re.sub(r'\b(?:Section|Reading\s+Test|TEST)\s+\d+', ' ', ak_text, flags=re.IGNORECASE)
    tokens = ak_text.split()
    ans_dict = {}
    i = 0
    while i < len(tokens):
        if is_question_start(tokens, i):
            q_num = int(tokens[i])
            ans_tokens = []
            j = i + 1
            while j < len(tokens):
                if is_question_start(tokens, j):
                    break
                ans_tokens.append(tokens[j])
                j += 1
            ans_str = ' '.join(ans_tokens)
            ans_clean = clean_str(ans_str)
            up = ans_clean.upper()
            if up in ['TURE', 'TRU']: ans_clean = 'TRUE'
            elif up in ['Y ES', 'YES']: ans_clean = 'YES'
            elif up in ['NOT GIVEN', 'NOTGIVEN']: ans_clean = 'NOT GIVEN'
            
            ans_dict[q_num] = ans_clean
            i = j
            continue
        i += 1
    return ans_dict

def extract_mc_options_manually(q_text):
    options = {}
    cleaned_q_text = q_text
    
    markers = []
    for l in ["A", "B", "C", "D"]:
        for sep in [". ", "\t", " . "]:
            markers.append((f"{l}{sep}", l))
            markers.append((f" {l}{sep}", l))
            
    found_markers = []
    for marker, letter in markers:
        pos = q_text.find(marker)
        if pos != -1:
            found_markers.append((pos, len(marker), letter))
            
    found_markers.sort(key=lambda x: x[0])
    
    if len(found_markers) >= 2:
        cleaned_q_text = q_text[:found_markers[0][0]].strip()
        for idx, (pos, marker_len, letter) in enumerate(found_markers):
            start = pos + marker_len
            end = found_markers[idx+1][0] if idx+1 < len(found_markers) else len(q_text)
            options[letter] = q_text[start:end].strip()
            
    return cleaned_q_text, options

def load_translation_cache():
    global translation_cache
    if not os.path.exists(OUT_DIR):
        return
    print("Loading existing translations into cache...")
    for f in os.listdir(OUT_DIR):
        if f.endswith('.json'):
            path = os.path.join(OUT_DIR, f)
            try:
                with open(path, 'r', encoding='utf-8') as fp:
                    data = json.load(fp)
                
                # Cache passage translations
                passages = data.get('passages', [])
                for p in passages:
                    html = p.get('html_content', '')
                    t_map = p.get('translation_map', {})
                    spans = re.findall(r'<span data-sid=[\'"]([^\'"]+)[\'"]>([\s\S]+?)</span>', html)
                    for sid, en_text in spans:
                        vi_text = t_map.get(sid)
                        if vi_text:
                            en_clean = re.sub(r'\s+', ' ', en_text).strip().lower()
                            translation_cache[en_clean] = vi_text
                            
                # Cache question translations
                groups = data.get('question_groups', [])
                for g in groups:
                    for q in g.get('questions', []):
                        q_text = q.get('text', '')
                        expl = q.get('explanation', {})
                        if isinstance(expl, dict):
                            vi_q = expl.get('vi', '')
                            if vi_q and q_text and not q_text.startswith("Question"):
                                m = re.match(r'^Dịch câu hỏi \d+:\s*(.*)', vi_q)
                                if m:
                                    vi_q = m.group(1)
                                q_clean = re.sub(r'\s+', ' ', q_text).strip().lower()
                                translation_cache[q_clean] = vi_q
            except Exception as e:
                pass
    print(f"Loaded {len(translation_cache)} translations into cache.")

def translate_single(text):
    text = clean_str(text)
    if not text:
        return ""
    
    text_lower = text.lower()
    if text_lower in translation_cache:
        return translation_cache[text_lower]
        
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            translation = clean_str(''.join([item[0] for item in data[0] if item[0]]))
            # Add to cache to prevent redundant translations
            translation_cache[text_lower] = translation
            return translation
    except Exception:
        return text

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

def parse_group_lines(header, glines):
    nums = [int(x) for x in re.findall(r'\d+', header)]
    if not nums:
        return None
    q_start = nums[0]
    q_end = nums[1] if len(nums) > 1 else q_start
    
    first_q_idx = -1
    for idx, l in enumerate(glines):
        stripped = l.strip()
        first_word = stripped.split(None, 1)[0] if stripped else ""
        clean_word = "".join([c for c in first_word if c.isdigit()])
        if clean_word:
            q_num = int(clean_word)
            if q_start <= q_num <= q_end:
                first_q_idx = idx
                break
                
    if first_q_idx != -1:
        instruction_lines = glines[:first_q_idx]
        questions_lines = glines[first_q_idx:]
    else:
        instruction_lines = glines
        questions_lines = []
        
    instruction = " ".join([clean_str(x) for x in instruction_lines])
    
    options_pool = {}
    for l in instruction_lines:
        stripped = l.strip()
        parts = stripped.split(None, 1)
        if parts:
            first_word = parts[0].rstrip('.').upper()
            if len(first_word) == 1 and first_word in "ABCDEF":
                options_pool[first_word] = clean_str(parts[1]) if len(parts) > 1 else ""
                
    roman_numerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"]
    for l in instruction_lines:
        stripped = l.strip()
        parts = stripped.split(None, 1)
        if parts:
            first_word = parts[0].rstrip('.').lower()
            if first_word in roman_numerals:
                options_pool[first_word] = clean_str(parts[1]) if len(parts) > 1 else ""
                
    q_map = {}
    current_q = None
    
    for l in questions_lines:
        stripped = l.strip()
        if not stripped:
            continue
            
        parts = stripped.split(None, 1)
        first_word = parts[0] if parts else ""
        clean_word = "".join([c for c in first_word if c.isdigit()])
        
        is_q_start = False
        if clean_word:
            q_num = int(clean_word)
            if q_start <= q_num <= q_end:
                is_q_start = True
                current_q = q_num
                rest = parts[1] if len(parts) > 1 else ""
                q_map[current_q] = [rest]
                
        if not is_q_start and current_q is not None:
            q_map[current_q].append(stripped)
            
    questions_data = []
    for q_n in range(q_start, q_end + 1):
        raw_txt = " ".join(q_map.get(q_n, []))
        q_text = clean_str(raw_txt)
        if not q_text:
            q_text = f"Question {q_n}"
        questions_data.append((q_n, q_text))
        
    return {
        "q_start": q_start,
        "q_end": q_end,
        "instruction": instruction,
        "options_pool": options_pool,
        "questions": questions_data
    }

def convert_single_pdf_to_jsons(test_id):
    pdf_filename = f"idp_test_{test_id:02d}.pdf"
    pdf_path = os.path.join(SPLIT_DIR, pdf_filename)
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return

    reader = pypdf.PdfReader(pdf_path)
    n_pages = len(reader.pages)
    
    ak_start = n_pages - 1
    # Check the last 4 pages backwards for answer key
    for p in range(n_pages - 1, max(0, n_pages - 5), -1):
        txt = reader.pages[p].extract_text()
        txt_clean = txt.lower().replace('\t', ' ').replace('\n', ' ')
        if 'section 1' in txt_clean or 'answer' in txt_clean or '1 c' in txt_clean or ('1 ' in txt_clean and len(txt_clean) < 1200):
            ak_start = p
            break

    reading_txt = "\n".join([reader.pages[i].extract_text() for i in range(ak_start)])
    ak_txt = "\n".join([reader.pages[i].extract_text() for i in range(ak_start, n_pages)])
    
    test_answers = parse_answers_from_ak(ak_txt)

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
        # 1. Split Passage and Questions without regex
        lines = sec_text.split('\n')
        questions_start_idx = -1
        for idx, line in enumerate(lines):
            cl = line.strip().lower()
            if cl.startswith("question") and len(cl) < 35:
                rem = cl.replace("questions", "").replace("question", "").strip()
                if rem and rem[0].isdigit():
                    questions_start_idx = idx
                    break
                    
        if questions_start_idx != -1:
            passage_lines = lines[:questions_start_idx]
            questions_lines = lines[questions_start_idx:]
            passage_raw = "\n".join(passage_lines)
            questions_raw = "\n".join(questions_lines)
        else:
            passage_lines = lines
            questions_lines = []
            passage_raw = sec_text
            questions_raw = ""

        # Clean Passage Text
        sec_clean = re.sub(r'©\s*The British Council.*?\d+', '', passage_raw)
        sec_clean = re.sub(r'©\s*British Council.*?\d+', '', sec_clean)
        sec_clean = re.sub(r'Candidate Name.*', '', sec_clean)
        sec_clean = re.sub(r'Candidate Number.*', '', sec_clean)
        sec_clean = re.sub(r'^.*?You should spend about 20 minutes on Questions \d+–?\d+.*?below\.', '', sec_clean, flags=re.DOTALL).strip()

        p_lines_split = sec_clean.split('\n')
        clean_lines = []
        for l in p_lines_split:
            l_c = clean_str(l)
            if not l_c:
                continue
            l_upper = l_c.upper()
            if len(l_c) < 60 and any(l_upper.startswith(p) for p in ['SECTION 1', 'SECTION 2', 'SECTION 3', 'READING PASSAGE 1', 'READING PASSAGE 2', 'READING PASSAGE 3', 'READING TEST', 'CANDIDATE NAME', 'CANDIDATE NUMBER', 'COPYRIGHT', '©']):
                continue
            clean_lines.append(l_c)

        title = clean_lines[0] if clean_lines else f"Passage {p_num}"
        body_lines = clean_lines[1:] if (clean_lines and clean_lines[0] == title) else clean_lines

        # Parse Paragraphs
        paragraphs_data = []
        current_label = None
        current_text_lines = []
        
        # Check if labeled
        starts_with_letter = []
        for l in body_lines:
            stripped = l.strip()
            if len(stripped) >= 2 and stripped[0].isupper() and stripped[0] in "ABCDEFGHIJK" and stripped[1] in ['.', '\t', ' ']:
                starts_with_letter.append(stripped[0])
        is_labeled = len(set(starts_with_letter)) >= 3
        
        if is_labeled:
            for l in body_lines:
                stripped = l.strip()
                is_label_start = False
                label_letter = ""
                rest = ""
                if len(stripped) >= 2 and stripped[0].isupper() and stripped[0] in "ABCDEFGHIJK" and stripped[1] in ['.', '\t', ' ']:
                    is_label_start = True
                    label_letter = stripped[0]
                    rest = stripped[2:].strip()
                    
                if is_label_start:
                    if current_text_lines or current_label:
                        paragraphs_data.append({"label": current_label, "text": " ".join(current_text_lines)})
                    current_label = label_letter
                    current_text_lines = [rest]
                else:
                    if current_label is None:
                        paragraphs_data.append({"label": None, "text": stripped})
                    else:
                        current_text_lines.append(stripped)
            if current_text_lines or current_label:
                paragraphs_data.append({"label": current_label, "text": " ".join(current_text_lines)})
        else:
            # Split by empty lines
            raw_paras = passage_raw.split('\n\n')
            for rp in raw_paras:
                rp_lines = [clean_str(x) for x in rp.split('\n') if clean_str(x)]
                clean_rp_lines = []
                for l in rp_lines:
                    l_upper = l.upper()
                    if len(l) < 60 and any(l_upper.startswith(p) for p in ['SECTION 1', 'SECTION 2', 'SECTION 3', 'READING PASSAGE 1', 'READING PASSAGE 2', 'READING PASSAGE 3', 'READING TEST', 'CANDIDATE NAME', 'CANDIDATE NUMBER', 'COPYRIGHT', '©']):
                        continue
                    clean_rp_lines.append(l)
                para_str = " ".join(clean_rp_lines)
                if para_str:
                    paragraphs_data.append({"label": None, "text": para_str})
            
            # Fallback to sentence grouping if too few paragraphs
            if len(paragraphs_data) < 3:
                paragraphs_data = []
                all_sents = split_sentences_clean(" ".join(body_lines))
                current_group = []
                for idx, s in enumerate(all_sents, 1):
                    current_group.append(s)
                    if len(current_group) >= 4 or idx == len(all_sents):
                        paragraphs_data.append({"label": None, "text": " ".join(current_group)})
                        current_group = []

        # Sentence tagging and translation mapping
        sid_counter = 1
        html_paragraphs = []
        sid_map = {}
        
        for p in paragraphs_data:
            sents = split_sentences_clean(p["text"])
            spans = []
            for s in sents:
                sid = f"p{p_num}-s{sid_counter}"
                sid_map[sid] = s
                spans.append(f"<span data-sid=\"{sid}\">{s}</span>")
                sid_counter += 1
            if spans:
                if p["label"]:
                    html_paragraphs.append(f"<p><b>{p['label']}.</b> {' '.join(spans)}</p>")
                else:
                    html_paragraphs.append(f"<p>{' '.join(spans)}</p>")
                    
        html_content = "".join(html_paragraphs)

        orig_sents = list(sid_map.values())
        sids = list(sid_map.keys())

        with ThreadPoolExecutor(max_workers=8) as sent_pool:
            translated_sents = list(sent_pool.map(translate_single, orig_sents))

        translation_map = {}
        for sid, vi_t in zip(sids, translated_sents):
            translation_map[sid] = vi_t

        # 2. Split questions_lines into groups
        groups_raw = []
        current_group_header = None
        current_group_lines = []

        for line in questions_lines:
            cl = line.strip()
            if not cl: continue
            
            cl_lower = cl.lower()
            is_group_header = False
            if cl_lower.startswith("question") and len(cl_lower) < 40:
                rem = cl_lower.replace("questions", "").replace("question", "").strip()
                if rem and rem[0].isdigit():
                    is_group_header = True
                    
            if is_group_header:
                if current_group_lines or current_group_header:
                    groups_raw.append((current_group_header, current_group_lines))
                current_group_header = cl
                current_group_lines = []
            else:
                current_group_lines.append(cl)
                
        if current_group_lines or current_group_header:
            groups_raw.append((current_group_header, current_group_lines))

        question_groups = []
        group_idx = 1
        
        for header, glines in groups_raw:
            res = parse_group_lines(header, glines)
            if not res: continue
            
            q_start, q_end = res["q_start"], res["q_end"]
            instruction = res["instruction"]
            options_pool = res["options_pool"]
            questions_data = res["questions"]
            
            # Determine question type
            q_type = "SHORT_ANSWER"
            glines_str = " ".join(glines)
            glines_lower = glines_str.lower()
            
            if 'true' in glines_lower and 'false' in glines_lower:
                q_type = "TRUE_FALSE_NOT_GIVEN"
                options_pool = {} # Clear options pool for T/F/NG
            elif 'yes' in glines_lower and 'no' in glines_lower:
                q_type = "YES_NO_NOT_GIVEN"
                options_pool = {} # Clear options pool for Y/N/NG
            elif 'which paragraph contains' in glines_lower:
                q_type = "MATCHING_INFORMATION"
            elif 'list of headings' in glines_lower or 'matching headings' in glines_lower:
                q_type = "MATCHING_HEADINGS"
            elif any(x in glines_lower for x in ['choose', 'multiple choice', 'correct letter']):
                # Double check if there are option markers like A. , B.
                has_opts = False
                for gl in glines:
                    gl_strip = gl.strip()
                    if gl_strip.startswith("A ") or gl_strip.startswith("A.") or gl_strip.startswith("A\t"):
                        has_opts = True
                        break
                if has_opts:
                    q_type = "MULTIPLE_CHOICE_SINGLE"
            elif 'complete' in glines_lower or 'no more than' in glines_lower or 'fill' in glines_lower:
                q_type = "FILL_IN_BLANKS"
                
            questions = []
            for q_num, q_text in questions_data:
                ans = test_answers.get(q_num, "")
                
                # Check inline MCQ options
                opts = {}
                if q_type == "MULTIPLE_CHOICE_SINGLE":
                    q_text, opts = extract_mc_options_manually(q_text)
                    
                # Match evidence
                # Clean text to alphanumeric words >= 4 chars
                words = set(w for w in "".join([c if c.isalnum() else " " for c in (q_text + ' ' + ans).lower()]).split() if len(w) >= 4)
                best_sid = None
                best_score = 0
                for sid, sentence in sid_map.items():
                    s_words = set(w for w in "".join([c if c.isalnum() else " " for c in sentence.lower()]).split() if len(w) >= 4)
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
        print(f"Generated {out_filename}: {title[:30]} ({len(translation_map)} sents, {total_qs} questions)")

if __name__ == '__main__':
    print("=== Processing all 34 split PDF files to JSON (Robust Mode) ===")
    load_translation_cache()
    for t_id in range(1, 35):
        convert_single_pdf_to_jsons(t_id)
    print("\nCompleted generating JSON files for all 34 split PDF tests!")
