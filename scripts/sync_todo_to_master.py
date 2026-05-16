
import json
import os

master_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json'
todo_file = 'todo_fixes.json'

def count_words(text):
    return len(text.split())

def sync():
    if not os.path.exists(todo_file):
        print(f"Todo file not found: {todo_file}")
        return

    with open(todo_file, 'r', encoding='utf-8') as f:
        todo_list = json.load(f)
    
    with open(master_file, 'r', encoding='utf-8') as f:
        master_data = json.load(f)
    
    # Create a lookup for master data
    master_lookup = {item['word']: item for item in master_data}
    
    updated_count = 0
    remaining_todo = []

    for todo_item in todo_list:
        word = todo_item['word']
        new_example = todo_item['example']
        new_translation = todo_item['translation']
        idx = todo_item['meaning_index']
        
        # If the sentence is now short enough, apply it
        if count_words(new_example) <= 13:
            if word in master_lookup:
                master_item = master_lookup[word]
                if idx < len(master_item.get('meanings', [])):
                    master_item['meanings'][idx]['example'] = new_example
                    master_item['meanings'][idx]['translation'] = new_translation
                    updated_count += 1
                else:
                    print(f"Warning: Index {idx} out of range for word {word}")
            else:
                print(f"Warning: Word {word} not found in master")
        else:
            # Keep in todo list if still too long
            remaining_todo.append(todo_item)

    # Save master
    with open(master_file, 'w', encoding='utf-8') as f:
        json.dump(master_data, f, ensure_ascii=False, indent=2)
    
    # Update todo file to only contain remaining work
    with open(todo_file, 'w', encoding='utf-8') as f:
        json.dump(remaining_todo, f, ensure_ascii=False, indent=2)

    print(f"Successfully synced {updated_count} fixes to master.")
    print(f"Remaining items in todo_fixes.json: {len(remaining_todo)}")

if __name__ == "__main__":
    sync()
