
import json
import os

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
output_file = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/batch_8.json'

def extract_batch():
    with open(master_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    batch = []
    count = 0
    # Start from where we left off. 
    # Batch 7 covered up to distraction (roughly)
    # We'll just find the first 300 that are > 13 words.
    
    for item in data:
        word = item.get('word', '')
        for meaning in item.get('meanings', []):
            example = meaning.get('example', '')
            words = example.split()
            if len(words) > 13:
                batch.append({
                    "word": word,
                    "example": example,
                    "translation": meaning.get('translation', ''),
                    "definition": meaning.get('definition', '')
                })
                count += 1
                if count >= 300:
                    break
        if count >= 300:
            break
            
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(batch, f, ensure_ascii=False, indent=2)
    print(f"Extracted {len(batch)} items to {output_file}")

if __name__ == "__main__":
    extract_batch()
