
import json

input_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
output_file = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/problematic_batch_2.json'

def count_words(text):
    return len(text.split())

def extract_batch():
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # We want to skip the ones that are ALREADY <= 13 words
    # because they are already "correct" in the master file.
    
    problematic = []
    for item in data:
        word = item.get('word', '')
        # Simple check: if we've reached the 'A' words we already did, skip them.
        # Batch 1 ended at 'approved'. 
        # But to be safe, we just check the word count.
        
        for meaning in item.get('meanings', []):
            example = meaning.get('example', '')
            if count_words(example) > 13:
                problematic.append({
                    'word': word,
                    'example': example,
                    'translation': meaning.get('translation', ''),
                    'definition': meaning.get('definition', '')
                })
                if len(problematic) >= 200:
                    break
        if len(problematic) >= 200:
            break
            
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(problematic, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    extract_batch()
