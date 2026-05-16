
import json
import os
import re

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
chunk_dir = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/WorkingChunks'

def count_words(text):
    return len(text.split())

def reintegrate_chunks():
    if not os.path.exists(chunk_dir):
        print(f"Chunk directory not found: {chunk_dir}")
        return

    if not os.path.exists(master_file):
        print(f"Master file not found: {master_file}")
        return

    with open(master_file, 'r', encoding='utf-8') as f:
        master_data = json.load(f)
    
    total_fixed = 0
    
    # Get all chunk files
    chunk_files = [f for f in os.listdir(chunk_dir) if f.startswith('CacTuCoVidudai') and f.endswith('.json')]
    
    for filename in chunk_files:
        filepath = os.path.join(chunk_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            chunk_data = json.load(f)
        
        fixed_in_chunk = []
        still_problematic_in_chunk = []
        
        for item in chunk_data:
            has_problem = False
            for m in item.get('meanings', []):
                if count_words(m.get('example', '')) > 13:
                    has_problem = True
                    break
            
            if not has_problem:
                fixed_in_chunk.append(item)
            else:
                still_problematic_in_chunk.append(item)
        
        if fixed_in_chunk:
            master_data.extend(fixed_in_chunk)
            total_fixed += len(fixed_in_chunk)
            
            if not still_problematic_in_chunk:
                # All fixed, delete chunk file
                os.remove(filepath)
                print(f"Chunk {filename} fully fixed and removed.")
            else:
                # Partially fixed, update chunk file
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(still_problematic_in_chunk, f, ensure_ascii=False, indent=2)
                print(f"Chunk {filename} updated. {len(fixed_in_chunk)} items moved.")

    if total_fixed > 0:
        # Save updated master
        with open(master_file, 'w', encoding='utf-8') as f:
            json.dump(master_data, f, ensure_ascii=False, indent=2)
        print(f"Reintegration complete. Total items moved to master: {total_fixed}")
    else:
        print("No items were ready for reintegration.")

if __name__ == "__main__":
    reintegrate_chunks()
