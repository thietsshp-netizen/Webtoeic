with open("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/failed_json_raw.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
print("Last 15 lines:")
for idx in range(max(0, len(lines)-15), len(lines)):
    print(f"Line {idx+1}: {repr(lines[idx])}")
