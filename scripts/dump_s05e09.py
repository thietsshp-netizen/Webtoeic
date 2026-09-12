import re
import json

def parse_srt(srt_path):
    with open(srt_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    blocks = content.strip().split("\n\n")
    subtitles = []
    for block in blocks:
        lines = block.strip().split("\n")
        if len(lines) >= 3:
            idx = int(lines[0])
            time_line = lines[1]
            text = "\n".join(lines[2:])
            m = re.match(r"(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})", time_line)
            if m:
                subtitles.append({
                    "id": idx,
                    "start": m.group(1),
                    "end": m.group(2),
                    "text": text
                })
    return subtitles

subs = parse_srt("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Merlin S01- S05/Merlin.S05.1080p.x265-ZMNT/Merlin.S05E09.1080p.x265-ZMNT.srt")
print(f"Loaded {len(subs)} subtitles.")
with open("/tmp/merlin_s05e09_subs.json", "w", encoding="utf-8") as f:
    json.dump(subs, f, ensure_ascii=False, indent=2)
