import json
import re

filePath = "/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/CreatSub-Friend/sub_vi_7.json"

with open(filePath, "r", encoding="utf-8") as f:
    data = json.load(f)

changes = []

for idx, item in enumerate(data):
    slang = item.get("slang_and_idiom", "")
    if not slang:
        continue
    
    # Split by semicolon
    parts = [p.strip() for p in slang.split(";")]
    updated_parts = []
    has_change = False
    
    for part in parts:
        # Check if the part contains a definition pattern: starts with something, then a colon
        # but shouldn't add '*' to general explanations like 'Ở Anh, ...' unless it contains a colon.
        # Actually, let's see if the part has a colon ':'
        if ":" in part:
            if not part.startswith("*"):
                updated_part = "*" + part
                has_change = True
            else:
                updated_part = part
        else:
            # If there's no colon, check if it's a phrase (usually short)
            # Let's keep it as is unless the user wants all segments to have *
            updated_part = part
            
        updated_parts.append(updated_part)
        
    if has_change:
        new_slang = "; ".join(updated_parts)
        changes.append((idx, slang, new_slang))
        item["slang_and_idiom"] = new_slang

print(f"Total changes planned: {len(changes)}")
for idx, old, new in changes[:30]:
    print(f"Index {idx}:\n  Old: {old}\n  New: {new}\n")
