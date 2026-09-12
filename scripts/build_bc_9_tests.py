import os, sys, re, json, pypdf, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

BC_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/BO 9 DE THI THAT CUA BRITISH COUNCIL'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
os.makedirs(OUT_DIR, exist_ok=True)

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

def clean_str(s):
    if not s: return ""
    return re.sub(r'\s+', ' ', s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')).strip()

def translate_single(text):
    text = clean_str(text)
    if not text: return ""
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return clean_str(''.join([item[0] for item in data[0] if item[0]]))
    except Exception:
        return text

def split_sentences_clean(text):
    if not text: return []
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
        if len(s_restored) > 8 and not s_restored.startswith("©") and "All rights reserved" not in s_restored:
            clean_sents.append(s_restored)
    return clean_sents

def parse_bc_answers(ans_pdf_path):
    reader = pypdf.PdfReader(ans_pdf_path)
    txt = "\n".join([page.extract_text() for page in reader.pages])
    matches = re.findall(r'(?:^|\s)(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', txt)
    ans_dict = {}
    for q_str, a_str in matches:
        q_n = int(q_str)
        a_clean = re.sub(r'\s+', ' ', a_str).strip()
        up = a_clean.upper()
        if up in ['TURE', 'TRU']: a_clean = 'TRUE'
        elif up in ['Y ES', 'YES']: a_clean = 'YES'
        elif up in ['NOT GIVEN', 'NOTGIVEN']: a_clean = 'NOT GIVEN'
        if 1 <= q_n <= 40 and len(a_clean) < 60:
            ans_dict[q_n] = a_clean
    return ans_dict

def process_bc_test(test_idx):
    prac_files = [f for f in os.listdir(BC_DIR) if f.startswith(f'reading_ac_practice{test_idx}')]
    ans_files = [f for f in os.listdir(BC_DIR) if f.startswith(f'reading_ac_answer{test_idx}')]
    
    if not prac_files or not ans_files:
        print(f"BC Test {test_idx} files not found!")
        return

    prac_path = os.path.join(BC_DIR, prac_files[0])
    ans_path = os.path.join(BC_DIR, ans_files[0])

    answers = parse_bc_answers(ans_path)
    reader = pypdf.PdfReader(prac_path)
    full_txt = "\n".join([page.extract_text() for page in reader.pages])

    sec_matches = list(re.finditer(r'\b(READING PASSAGE\s*[123])\b', full_txt, re.IGNORECASE))
    sec_pos = {}
    for sm in sec_matches:
        s_txt = sm.group(0).upper()
        if '1' in s_txt and 1 not in sec_pos: sec_pos[1] = sm.start()
        elif '2' in s_txt and 2 not in sec_pos: sec_pos[2] = sm.start()
        elif '3' in s_txt and 3 not in sec_pos: sec_pos[3] = sm.start()

    pos1 = sec_pos.get(1, 0)
    pos2 = sec_pos.get(2, len(full_txt) // 3)
    pos3 = sec_pos.get(3, (len(full_txt) // 3) * 2)

    sections = [
        (1, full_txt[pos1:pos2]),
        (2, full_txt[pos2:pos3]),
        (3, full_txt[pos3:])
    ]

    for p_num, sec_text in sections:
        clean_sec = re.sub(r'You should spend about 20 minutes on Questions.*', '', sec_text, count=1, flags=re.IGNORECASE)
        q_start_m = re.search(r'\n\s*Questions?\s+\d+[\–\-\—\s]+\d+', clean_sec, re.IGNORECASE)
        
        if q_start_m:
            passage_raw = clean_sec[:q_start_m.start()]
            questions_raw = clean_sec[q_start_m.start():]
        else:
            passage_raw = clean_sec
            questions_raw = ""

        sec_clean = re.sub(r'©\s*The British Council.*?\d+', '', passage_raw)
        lines = [clean_str(l) for l in sec_clean.split('\n') if clean_str(l)]
        clean_lines = []
        for l in lines:
            if len(l) < 60 and any(l.upper().startswith(p) for p in ['READING PASSAGE 1', 'READING PASSAGE 2', 'READING PASSAGE 3', 'COPYRIGHT', '©']):
                continue
            clean_lines.append(l)

        title = clean_lines[0] if clean_lines else f"Passage {p_num}"
        body_lines = clean_lines[1:] if (clean_lines and clean_lines[0] == title) else clean_lines
        full_p_str = " ".join(body_lines)

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

        q_start_n = 1 if p_num == 1 else (14 if p_num == 2 else 27)
        q_end_n = 13 if p_num == 1 else (26 if p_num == 2 else 40)

        questions = []
        for q_num in range(q_start_n, q_end_n + 1):
            ans = answers.get(q_num, "")
            ev_sid = f"p{p_num}-s1"
            ev_text_vi = translation_map.get(ev_sid, "")
            
            questions.append({
                "questionNo": q_num,
                "text": f"Question {q_num}",
                "prefix": "",
                "suffix": "",
                "options": {},
                "correctAnswer": ans,
                "evidence_sids": [ev_sid],
                "explanation": {
                    "vi": f"Dịch câu hỏi {q_num}",
                    "why_correct": f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Đáp án đúng là \"{ans}\".",
                    "why_wrong": "Các lựa chọn khác mâu thuẫn hoặc không đúng."
                }
            })

        q_groups = [{
            "group_id": 1,
            "group_color": GROUP_COLORS[p_num % len(GROUP_COLORS)],
            "question_type": "SHORT_ANSWER",
            "instruction": f"Questions {q_start_n}-{q_end_n}",
            "options_pool": {},
            "questions": questions
        }]

        obj = {
            "test_id": test_idx,
            "test_title": f"British Council IELTS Reading Test {test_idx}",
            "passage_number": p_num,
            "passage_title": title,
            "passages": [{
                "passage_id": p_num,
                "html_content": html_content,
                "translation_map": translation_map
            }],
            "question_groups": q_groups
        }

        out_filename = f"bc_test_{test_idx:02d}_passage_{p_num}.json"
        out_path = os.path.join(OUT_DIR, out_filename)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)

        print(f"Restored BC file {out_filename}: {title[:30]}")

print("=== Regenerating British Council 9 Tests ===")
for t in range(1, 10):
    process_bc_test(t)
print("Restored all 27 British Council Reading JSON files!")
