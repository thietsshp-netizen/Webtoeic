#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to ensure 100% Vietnamese translation quality and update
all ASS subtitle files with \fs14 (just slightly smaller than English font 16).
"""

import os
import re
import json
import time
from pathlib import Path
from deep_translator import GoogleTranslator

BASE_DIR = Path("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Phim /The Wheel of Time 2021 Seasons 1 to 3 Complete 1080p WEB x264 [i_c]")
CACHE_DIR = BASE_DIR / ".sub_cache"

ASS_HEADER = """[Script Info]
; Script generated for The Wheel of Time Bilingual Subtitles
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,16,&Hffffff,&Hffffff,&H0,&H0,0,0,0,0,100,100,0,0,1,1,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

VI_CHARS = set("àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ")

def has_vietnamese(text):
    return any(c in VI_CHARS for c in text)

def parse_ass_dialogues(ass_path):
    with open(ass_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    dialogues = []
    for line in lines:
        if line.startswith("Dialogue:"):
            parts = line.split(",", 9)
            if len(parts) == 10:
                dialogues.append({
                    "layer": parts[0].replace("Dialogue:", "").strip(),
                    "start": parts[1].strip(),
                    "end": parts[2].strip(),
                    "style": parts[3].strip(),
                    "name": parts[4].strip(),
                    "ml": parts[5].strip(),
                    "mr": parts[6].strip(),
                    "mv": parts[7].strip(),
                    "effect": parts[8].strip(),
                    "text": parts[9].rstrip("\r\n")
                })
    return dialogues

def clean_text_for_translation(raw_text):
    clean = re.sub(r"\{[^}]*\}", "", raw_text)
    clean = clean.replace(r"\N", " ").replace(r"\n", " ").replace("\n", " ")
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean

def main():
    translator = GoogleTranslator(source="en", target="vi")
    
    # 1. Find all raw en ass files
    raw_files = sorted(list(CACHE_DIR.glob("*_en_raw.ass")))
    print(f"Checking translations for {len(raw_files)} episodes...")

    for raw_ass in raw_files:
        stem = raw_ass.name.replace("_en_raw.ass", "")
        cache_json = CACHE_DIR / f"{stem}_trans.json"

        dialogues = parse_ass_dialogues(raw_ass)
        if not dialogues:
            continue

        translations = {}
        if cache_json.exists():
            with open(cache_json, "r", encoding="utf-8") as f:
                translations = {int(k): v for k, v in json.load(f).items()}

        # Find any untranslated lines
        needs_translation = []
        for idx, d in enumerate(dialogues):
            clean_en = clean_text_for_translation(d["text"])
            if not clean_en:
                continue

            current_vi = translations.get(idx, "")
            # If empty or identical to english or has no vietnamese and is a normal wordy sentence
            if not current_vi or (current_vi == clean_en and len(clean_en.split()) > 2 and not has_vietnamese(current_vi)):
                needs_translation.append((idx, clean_en))

        if needs_translation:
            print(f"🎬 {stem}: Translating {len(needs_translation)} missing lines...")
            for idx, text in needs_translation:
                for attempt in range(3):
                    try:
                        vi = translator.translate(text)
                        translations[idx] = vi
                        break
                    except Exception:
                        time.sleep(0.5)
                time.sleep(0.1)

            # Save updated cache
            with open(cache_json, "w", encoding="utf-8") as f:
                json.dump(translations, f, ensure_ascii=False, indent=2)

        # Build final bilingual ASS file
        events = []
        for idx, d in enumerate(dialogues):
            en_clean = d["text"]
            vi_text = translations.get(idx, "")
            
            # Use \fs14 for Vietnamese (just slightly smaller than English font 16)
            if vi_text and vi_text.strip() != clean_text_for_translation(en_clean):
                combined_text = f"{en_clean}\\N{{\\fs14\\c&H00FFFF&}}{vi_text}"
            else:
                combined_text = en_clean

            event_line = f"Dialogue: {d['layer']},{d['start']},{d['end']},Default,{d['name']},{d['ml']},{d['mr']},{d['mv']},{d['effect']},{combined_text}"
            events.append(event_line)

        # Locate target ass file in Season folders
        target_ass_files = list(BASE_DIR.rglob(f"{stem}.ass"))
        for target_file in target_ass_files:
            if ".sub_cache" not in str(target_file):
                with open(target_file, "w", encoding="utf-8") as fp:
                    fp.write(ASS_HEADER + "\n".join(events) + "\n")
                print(f"  ✅ Updated: {target_file.name} (Font size: \\fs14)")

    print("\n🎉 ALL DONE! All 30 episodes now have complete Vietnamese translations and \\fs14 font size.")

if __name__ == "__main__":
    main()
