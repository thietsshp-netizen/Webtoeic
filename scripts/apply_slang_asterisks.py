import json

filePath = "/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/CreatSub-Friend/sub_vi_7.json"

with open(filePath, "r", encoding="utf-8") as f:
    data = json.load(f)

changes_count = 0

for item in data:
    slang = item.get("slang_and_idiom", "")
    if not slang:
        continue
    
    parts = [p.strip() for p in slang.split(";")]
    updated_parts = []
    has_change = False
    
    for part in parts:
        if ":" in part:
            if not part.startswith("*"):
                updated_part = "*" + part
                has_change = True
            else:
                updated_part = part
        else:
            updated_part = part
            
        updated_parts.append(updated_part)
        
    if has_change:
        new_slang = "; ".join(updated_parts)
        item["slang_and_idiom"] = new_slang
        changes_count += 1

with open(filePath, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Successfully updated {changes_count} slang entries with asterisks.")
