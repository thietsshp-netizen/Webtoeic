
import json
import os

input_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/CacTuCoVidudai.json'
output_dir = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/WorkingChunks'

def split_file():
    if not os.path.exists(input_file):
        print(f"File not found: {input_file}")
        return
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    chunk_size = 30
    for i in range(0, len(data), chunk_size):
        chunk = data[i:i + chunk_size]
        start = i + 1
        end = min(i + chunk_size, len(data))
        chunk_file = os.path.join(output_dir, f'CacTuCoVidudai{start}-{end}.json')
        with open(chunk_file, 'w', encoding='utf-8') as f:
            json.dump(chunk, f, ensure_ascii=False, indent=2)
            
    print(f"Split {len(data)} items into {len(data)//chunk_size + 1} small files in {output_dir}.")

if __name__ == "__main__":
    split_file()
