import json

filePath = "/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/CreatSub-Friend/sub_vi_7.json"
try:
    with open(filePath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    count = 0
    for idx, item in enumerate(data):
        slang = item.get("slang_and_idiom", "")
        if slang:
            print(f"Index {idx}: {slang}")
            count += 1
            if count > 20:
                break
except Exception as e:
    print("Error:", e)
