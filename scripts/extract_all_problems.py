
import json
import os

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
todo_file = 'todo_fixes.json'

def count_words(text):
    return len(text.split())

def extract_all():
    with open(master_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    todo_list = []
    for item in data:
        word = item.get('word', '')
        meanings = item.get('meanings', [])
        for idx, m in enumerate(meanings):
            example = m.get('example', '')
            if count_words(example) > 13:
                todo_list.append({
                    "word": word,
                    "meaning_index": idx,
                    "definition": m.get('definition', ''),
                    "example": example,
                    "translation": m.get('translation', '')
                })
    
    with open(todo_file, 'w', encoding='utf-8') as f:
        json.dump(todo_list, f, ensure_ascii=False, indent=2)
    
    print(f"Extracted {len(todo_list)} problematic entries to {todo_file}")

if __name__ == "__main__":
    extract_all()
