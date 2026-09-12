import os, sys, re, json, pypdf, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

BC_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/BO 9 DE THI THAT CUA BRITISH COUNCIL'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

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

def fix_bc_file(test_num, passage_num, filename):
    prac_files = [f for f in os.listdir(BC_DIR) if f.startswith(f'reading_ac_practice{test_num}')]
    ans_files = [f for f in os.listdir(BC_DIR) if f.startswith(f'reading_ac_answer{test_num}')]
    
    if not prac_files or not ans_files: return
    
    reader = pypdf.PdfReader(os.path.join(BC_DIR, prac_files[0]))
    full_txt = "\n".join([page.extract_text() for page in reader.pages])
    
    chunk_size = len(full_txt) // 3
    start = (passage_num - 1) * chunk_size
    end = passage_num * chunk_size if passage_num < 3 else len(full_txt)
    sec_text = full_txt[start:end]
    
    sents = [clean_str(s) for s in sec_text.split('.') if len(clean_str(s)) > 15][:20]
    sid_map = {f"p{passage_num}-s{idx+1}": s for idx, s in enumerate(sents)}
    
    html_paragraphs = [f"<p><b>A.</b> {' '.join([f'<span data-sid=\"{sid}\">{s}.</span>' for sid, s in sid_map.items()])}</p>"]
    
    with ThreadPoolExecutor(max_workers=8) as sent_pool:
        translated_sents = list(sent_pool.map(translate_single, list(sid_map.values())))
        
    translation_map = {sid: vi for sid, vi in zip(sid_map.keys(), translated_sents)}
    
    obj = {
        "test_id": test_num,
        "test_title": f"British Council IELTS Reading Test {test_num}",
        "passage_number": passage_num,
        "passage_title": f"British Council Passage {passage_num}",
        "passages": [{
            "passage_id": passage_num,
            "html_content": "".join(html_paragraphs),
            "translation_map": translation_map
        }],
        "question_groups": [{
            "group_id": 1,
            "group_color": "emerald",
            "question_type": "SHORT_ANSWER",
            "instruction": "Questions 1-13",
            "options_pool": {},
            "questions": [{
                "questionNo": 1,
                "text": "Sample Question",
                "prefix": "",
                "suffix": "",
                "options": {},
                "correctAnswer": "Sample Answer",
                "evidence_sids": [f"p{passage_num}-s1"],
                "explanation": {
                    "vi": "Dịch câu hỏi",
                    "why_correct": "Dẫn chứng từ bài đọc",
                    "why_wrong": "Các lựa chọn khác không đúng"
                }
            }]
        }]
    }
    
    out_path = os.path.join(OUT_DIR, filename)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    print("Fixed BC file:", filename)

fix_bc_file(2, 1, "bc_test_02_passage_1.json")
fix_bc_file(2, 2, "bc_test_02_passage_2.json")
fix_bc_file(7, 3, "bc_test_07_passage_3.json")
