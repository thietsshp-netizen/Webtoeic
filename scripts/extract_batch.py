
import json

input_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
output_file = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/problematic_batch_1.json'

def count_words(text):
    return len(text.split())

def extract_batch():
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
                    'translation': meaning.get('translation', ''),
                    'part_of_speech': meaning.get('part_of_speech', ''),
                    'definition': meaning.get('definition', '')
                })
                if len(problematic) >= 100: # Smaller batch for stability
                    break
        if len(problematic) >= 100:
            break
            
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(problematic, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    extract_batch()
