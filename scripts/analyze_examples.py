
import json
import os

input_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'

def count_words(text):
    return len(text.split())

def analyze_json():
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    problematic = []
    for item in data:
        word = item.get('word', '')
        for meaning in item.get('meanings', []):
            example = meaning.get('example', '')
            if count_words(example) > 13:
                problematic.append({
                    'word': word,
                    'example': example,
                    'count': count_words(example)
                })
    
    print(f"Total problematic examples: {len(problematic)}")
    # Print first 20 for reference
    for p in problematic[:20]:
        print(f"[{p['count']}] {p['word']}: {p['example']}")

if __name__ == "__main__":
    analyze_json()
