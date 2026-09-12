import json
import re

# Read the full untruncated transcript to get the exact user message
transcript_path = "/Users/thietpv/.gemini/antigravity-ide/brain/1f258fa5-c201-4bf3-a459-e54473c01075/.system_generated/logs/transcript_full.jsonl"

user_text = ""
with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT" and "sửa lại json này" in data.get("content", ""):
            user_text = data["content"]
            break

if not user_text:
    print("Could not find the user request in the transcript.")
    exit(1)

# Extract the JSON part
start_idx = user_text.find("[")
end_idx = user_text.rfind("]")
if start_idx == -1 or end_idx == -1:
    print("Could not find JSON boundaries in the text.")
    exit(1)

json_str = user_text[start_idx:end_idx+1]

# 1. Fix missing quotes on key names (e.g. note": -> "note":)
json_str = re.sub(r'(?<!")note":', '"note":', json_str)

# 2. Fix the specific missing closing quote on line 1455
json_str = json_str.replace('"vietnamese": "[PHOEBE THỞ DÀI]', '"vietnamese": "[PHOEBE THỞ DÀI]",')

# Let's try parsing it to make sure it's valid JSON
try:
    parsed_json = json.loads(json_str)
    print("Successfully parsed repaired JSON! Items count:", len(parsed_json))
    
    # Save the repaired JSON to the clean file
    output_path = "/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/fixed_json.json"
    with open(output_path, "w", encoding="utf-8") as out_f:
        json.dump(parsed_json, out_f, ensure_ascii=False, indent=2)
    print(f"Saved fixed JSON to: {output_path}")
except json.JSONDecodeError as e:
    print("Failed to parse fixed JSON:", str(e))
    # Write the intermediate raw string so we can inspect it if needed
    with open("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/failed_json_raw.txt", "w", encoding="utf-8") as err_f:
        err_f.write(json_str)
