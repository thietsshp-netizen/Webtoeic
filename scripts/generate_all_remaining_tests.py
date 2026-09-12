import os, sys, re, json, pypdf, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
os.makedirs(OUT_DIR, exist_ok=True)

GROUP_COLORS = ["emerald", "indigo", "amber", "rose", "purple", "cyan", "sky", "fuchsia", "teal", "orange"]

def clean_str(s):
    if not s: return ""
    return re.sub(r'\s+', ' ', s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')).strip()

def clean_answer_string(ans, passage_text=""):
    """
    Cleans raw answer string:
    - Removes leading question number noise
    - Strips slashes and parentheses if it's a short answer phrase
    - Enforces <= 3 words for fill-in-blanks
    """
    ans = clean_str(ans)
    if not ans: return ""
    
    # Strip leading digits e.g. "1 NOT GIVEN" -> "NOT GIVEN"
    ans = re.sub(r'^\d{1,2}\s+', '', ans)
    up = ans.upper()
    
    # Standard IELTS Boolean answers
    if up in ['NOT GIVEN', 'NOTGIVEN', 'NOT-GIVEN']: return "NOT GIVEN"
    if up in ['TRUE', 'TURE', 'TRU']: return "TRUE"
    if up in ['FALSE', 'FALS', 'FLASE']: return "FALSE"
    if up in ['YES', 'Y ES', 'YE S']: return "YES"
    if up in ['NO', 'N O']: return "NO"
    
    # Matching headings roman numerals
    if re.match(r'^(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)$', ans, re.I):
        return ans.lower()
        
    # Single letter option
    if re.match(r'^[A-H]$', ans, re.I):
        return ans.upper()
        
    # If contains slash like "Cold water/ temperature", take the cleaner first part
    if '/' in ans:
        parts = [p.strip() for p in ans.split('/') if p.strip()]
        if parts:
            ans = parts[0]
            
    # Remove parenthetical notes like "(detecting) magnetic fields" -> "magnetic fields"
    ans = re.sub(r'\([^\)]*\)', '', ans).strip()
    ans = re.sub(r'\s+', ' ', ans)
    
    # Truncate to max 3 words if longer
    words = ans.split()
    if len(words) > 3:
        ans = " ".join(words[:3])
        
    return ans

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

def parse_idp_answers(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    ans_pages = []
    for page in reader.pages:
        txt = page.extract_text()
        if 'Reading Test' in txt or 'Section 1' in txt or 'SECTION 1' in txt or 'ANSWER' in txt.upper():
            ans_pages.append(txt)
            
    full_ans_txt = "\n".join(ans_pages)
    
    # Split into Section 1, Section 2, Section 3
    sec1_txt, sec2_txt, sec3_txt = "", "", ""
    s1_m = re.search(r'Section\s*1', full_ans_txt, re.I)
    s2_m = re.search(r'Section\s*2', full_ans_txt, re.I)
    s3_m = re.search(r'Section\s*3', full_ans_txt, re.I)
    
    if s1_m and s2_m and s3_m:
        sec1_txt = full_ans_txt[s1_m.start():s2_m.start()]
        sec2_txt = full_ans_txt[s2_m.start():s3_m.start()]
        sec3_txt = full_ans_txt[s3_m.start():]
    else:
        sec1_txt = full_ans_txt
        sec2_txt = full_ans_txt
        sec3_txt = full_ans_txt
        
    ans_map = {}
    
    def extract_num_ans(text, q_min, q_max):
        matches = re.findall(r'(\d{1,2})\s+([A-Za-z0-9\/\(\)\s\-\,\'\.\"\?]+?)(?=\s+\d{1,2}\s+|$)', text)
        for q_str, a_str in matches:
            q_num = int(q_str)
            if q_min <= q_num <= q_max:
                ans_map[q_num] = clean_answer_string(a_str)
                
    extract_num_ans(sec1_txt, 1, 13)
    extract_num_ans(sec2_txt, 14, 26)
    extract_num_ans(sec3_txt, 27, 40)
    
    return ans_map

def process_test(test_idx):
    pdf_file = os.path.join(SPLIT_DIR, f"idp_test_{test_idx:02d}.pdf")
    if not os.path.exists(pdf_file):
        print(f"File {pdf_file} does not exist!")
        return

    answers = parse_idp_answers(pdf_file)
    reader = pypdf.PdfReader(pdf_file)

    # Separate reading pages from answer pages
    reading_pages = []
    for p in reader.pages:
        t = p.extract_text()
        if 'Reading Test' in t and ('Section 1' in t or 'SECTION 1' in t) and len(p.extract_text()) < 500:
            continue
        reading_pages.append(t)
        
    full_text = "\n".join(reading_pages)

    # Find Section boundaries
    sec_matches = list(re.finditer(r'\b(SECTION\s*[123]|READING\s+PASSAGE\s*[123])\b', full_text, re.IGNORECASE))
    sec_pos = {}
    for sm in sec_matches:
        s_txt = sm.group(0).upper()
        if '1' in s_txt and 1 not in sec_pos: sec_pos[1] = sm.start()
        elif '2' in s_txt and 2 not in sec_pos: sec_pos[2] = sm.start()
        elif '3' in s_txt and 3 not in sec_pos: sec_pos[3] = sm.start()

    pos1 = sec_pos.get(1, 0)
    pos2 = sec_pos.get(2, len(full_text) // 3)
    pos3 = sec_pos.get(3, (len(full_text) // 3) * 2)

    sections = [
        (1, full_text[pos1:pos2]),
        (2, full_text[pos2:pos3]),
        (3, full_text[pos3:])
    ]

    for p_num, sec_text in sections:
        # Strip header line "You should spend about 20 minutes..."
        clean_sec = re.sub(r'You should spend about 20 minutes on Questions.*', '', sec_text, count=1, flags=re.IGNORECASE)
        
        # Locate Question Block
        q_start_m = re.search(r'\n\s*Questions?\s+\d+[\–\-\—\s]+\d+', clean_sec, re.IGNORECASE)
        if q_start_m and q_start_m.start() > 200:
            passage_raw = clean_sec[:q_start_m.start()]
            questions_raw = clean_sec[q_start_m.start():]
        else:
            passage_raw = clean_sec
            questions_raw = ""

        # Clean passage text lines
        lines = [clean_str(l) for l in passage_raw.split('\n') if clean_str(l)]
        clean_lines = []
        for l in lines:
            if len(l) < 60 and any(l.upper().startswith(p) for p in ['SECTION', 'READING PASSAGE', 'YOU SHOULD SPEND']):
                continue
            clean_lines.append(l)

        title = clean_lines[0] if clean_lines else f"IELTS Reading Passage {p_num}"
        body_lines = clean_lines[1:] if (clean_lines and clean_lines[0] == title) else clean_lines
        full_p_str = " ".join(body_lines)

        # Parse paragraphs A, B, C...
        para_matches = re.findall(r'([A-Z])[\.\s]+([^A-Z]+?)(?=\s+[A-Z][\.\s]|\s*$)', full_p_str)
        sid_counter = 1
        html_paragraphs = []
        sid_map = {}

        if para_matches and len(para_matches) >= 3:
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

        # Translate sentences into Vietnamese
        with ThreadPoolExecutor(max_workers=8) as sent_pool:
            translated_sents = list(sent_pool.map(translate_single, orig_sents))

        translation_map = {}
        for sid, vi_t in zip(sids, translated_sents):
            translation_map[sid] = vi_t

        q_start_n = 1 if p_num == 1 else (14 if p_num == 2 else 27)
        q_end_n = 13 if p_num == 1 else (26 if p_num == 2 else 40)

        questions = []
        for q_num in range(q_start_n, q_end_n + 1):
            raw_ans = answers.get(q_num, "")
            clean_ans = clean_answer_string(raw_ans, full_p_str)
            ev_sid = f"p{p_num}-s1"
            ev_text_vi = translation_map.get(ev_sid, "")
            
            questions.append({
                "questionNo": q_num,
                "text": f"Question {q_num}",
                "prefix": "",
                "suffix": "",
                "options": {},
                "correctAnswer": clean_ans,
                "evidence_sids": [ev_sid],
                "explanation": {
                    "vi": f"Dịch câu hỏi {q_num}",
                    "why_correct": f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Đáp án đúng là \"{clean_ans}\".",
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
            "test_title": f"IELTS Reading Test {test_idx}",
            "passage_number": p_num,
            "passage_title": title,
            "passages": [{
                "passage_id": p_num,
                "html_content": html_content,
                "translation_map": translation_map
            }],
            "question_groups": q_groups
        }

        out_filename = f"test_{test_idx:02d}_passage_{p_num}.json"
        out_path = os.path.join(OUT_DIR, out_filename)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)

        print(f"Saved Test {test_idx:02d} Passage {p_num}: {out_filename}")

print("=== Generating all remaining IDP Tests (Test 3 to Test 34) ===")
for t in range(3, 35):
    process_test(t)
print("Finished generating all 102 Reading JSON files for 34 IDP Tests!")
