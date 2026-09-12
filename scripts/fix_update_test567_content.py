#!/usr/bin/env python3
"""
Cập nhật content cho IELTS Reading Test 5, 6, 7.
JSON files có question_groups nhưng chưa được import vào DB.
Script này merge passage html từ DB + question_groups từ file JSON.
"""
import json, os, sys
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.local')
load_dotenv('.env')

DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('DIRECT_URL')
if not DATABASE_URL:
    print("❌ Không tìm thấy DATABASE_URL trong .env")
    sys.exit(1)

JSON_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

# Mapping: tên title trong DB → file JSON
TEST_CONFIGS = {
    5: {
        'title_contains': 'Reading Test 5',
        'passage_titles': ['Terminated Dinosaur Era', 'Detection of a Meteorite Lake', 'Making Time'],
    },
    6: {
        'title_contains': 'Reading Test 6',
        'passage_titles': None,  # tìm theo thứ tự
    },
    7: {
        'title_contains': 'Reading Test 7',
        'passage_titles': None,
    },
}

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

for test_num, cfg in TEST_CONFIGS.items():
    print(f"\n{'='*60}")
    print(f"Test {test_num}")
    print(f"{'='*60}")
    
    # Tìm lesson trong DB
    cur.execute("""
        SELECT id, title, content FROM "Lesson"
        WHERE title ILIKE %s
        ORDER BY "order" ASC
        LIMIT 1
    """, (f'%{cfg["title_contains"]}%',))
    
    row = cur.fetchone()
    if not row:
        # Thử "Reading Test N" (không có IELTS prefix)
        cur.execute("""
            SELECT id, title, content FROM "Lesson"
            WHERE title ILIKE %s
            ORDER BY "order" ASC
            LIMIT 1
        """, (f'%Test {test_num}%',))
        row = cur.fetchone()
    
    if not row:
        print(f"  ❌ Không tìm thấy lesson cho Test {test_num}")
        continue
    
    lesson_id, lesson_title, content_str = row
    print(f"  ✅ Tìm thấy: {lesson_title} (id={lesson_id})")
    
    # Parse content hiện tại
    try:
        current_content = json.loads(content_str) if content_str else []
        if not isinstance(current_content, list):
            current_content = [current_content]
    except:
        current_content = []
    
    print(f"  Current passages: {len(current_content)}, each has question_groups: {[len(p.get('question_groups', [])) for p in current_content]}")
    
    # Đọc 3 file JSON cho test này
    new_passages = []
    for p_num in [1, 2, 3]:
        json_path = os.path.join(JSON_DIR, f'test_{test_num:02d}_passage_{p_num}.json')
        if not os.path.exists(json_path):
            print(f"  ❌ Không tìm thấy file: {json_path}")
            # Dùng passage cũ nếu có
            if p_num - 1 < len(current_content):
                new_passages.append(current_content[p_num - 1])
            continue
        
        with open(json_path, 'r', encoding='utf-8') as f:
            file_data = json.load(f)
        
        question_groups = file_data.get('question_groups', [])
        
        # Lấy html_content từ DB (nếu cấu trúc cũ có passage html)
        # Cấu trúc mới trong file JSON:
        passages_in_file = file_data.get('passages', [])
        html_content = passages_in_file[0]['html_content'] if passages_in_file else ''
        translation_map = passages_in_file[0].get('translation_map', {}) if passages_in_file else {}
        
        # Nếu DB có html tốt hơn → dùng DB (đặc biệt khi file mới có html placeholder)
        if p_num - 1 < len(current_content):
            old_p = current_content[p_num - 1]
            # Lấy html từ cấu trúc cũ
            old_html = old_p.get('html_content', '') or ''
            old_passages = old_p.get('passages', [])
            if old_passages:
                old_html = old_passages[0].get('html_content', '') or old_html
            old_trans = old_p.get('translation_map', {}) or {}
            if old_passages:
                old_trans = old_passages[0].get('translation_map', {}) or old_trans
            
            # Dùng html từ DB nếu dài hơn (có nội dung thực)
            if len(old_html) > len(html_content):
                print(f"  📄 Passage {p_num}: dùng html từ DB ({len(old_html)} chars)")
                html_content = old_html
                if not translation_map:
                    translation_map = old_trans
        
        # Build passage mới với đầy đủ question_groups
        new_passage = {
            "passage_number": p_num,
            "passage_title": file_data.get('passage_title', f'Passage {p_num}'),
            "html_content": html_content,
            "translation_map": translation_map,
            "question_groups": question_groups,
        }
        new_passages.append(new_passage)
        
        total_q = sum(len(g.get('questions', [])) for g in question_groups)
        print(f"  ✅ Passage {p_num}: {len(question_groups)} groups, {total_q} questions, html={len(html_content)} chars")
    
    if not new_passages:
        print(f"  ❌ Không có passages nào cho test {test_num}, skip")
        continue
    
    # Update DB
    new_content_str = json.dumps(new_passages, ensure_ascii=False)
    cur.execute("""
        UPDATE "Lesson" SET content = %s WHERE id = %s
    """, (new_content_str, lesson_id))
    
    print(f"  ✅ Đã update lesson {lesson_id} với {len(new_passages)} passages")

conn.commit()
cur.close()
conn.close()
print("\n✅ Hoàn thành! Tất cả test 5, 6, 7 đã được cập nhật.")
