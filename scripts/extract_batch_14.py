
import json
import os

input_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'

def count_words(text):
    return len(text.split())

def extract_batch():
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    batch = []
    count = 0
    for item in data:
        word = item.get('word', '')
        for meaning in item.get('meanings', []):
            example = meaning.get('example', '')
            translation = meaning.get('translation', '')
            definition = meaning.get('definition', '')
            if count_words(example) > 13:
                batch.append({
                    'word': word,
                    'example': example,
                    'translation': translation,
                    'definition': definition
                })
                count += 1
                if count >= 300:
                    break
        if count >= 300:
            break
            
    with open('batch_14.json', 'w', encoding='utf-8') as f:
        json.dump(batch, f, ensure_ascii=False, indent=2)
    
    print(f"Extracted {len(batch)} items to batch_14.json")

if __name__ == "__main__":
    extract_batch()
