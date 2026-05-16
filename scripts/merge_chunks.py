
import json
import os

chunk_dir = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/chunks'
output_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/CacTuCoVidudai.json'

def merge_chunks():
    all_data = []
    # Sort files to maintain order
    files = sorted([f for f in os.listdir(chunk_dir) if f.startswith('chunk_') and f.endswith('.json')], 
                   key=lambda x: int(x.split('_')[1].split('.')[0]))
    
    for f in files:
        with open(os.path.join(chunk_dir, f), 'r', encoding='utf-8') as infile:
            all_data.extend(json.load(infile))
            
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(all_data, outfile, ensure_ascii=False, indent=2)
        
    print(f"Merged {len(files)} chunks into {output_file}. Total entries: {len(all_data)}")

if __name__ == "__main__":
    merge_chunks()
