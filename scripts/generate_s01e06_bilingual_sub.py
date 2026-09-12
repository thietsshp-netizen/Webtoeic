#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to create high-quality bilingual (English + Vietnamese) subtitles for The Wheel of Time S01E06
from the original English SRT: [0]The.Wheel.of.Time.S01E06.1080p.WEB.H264-CAKES-HI.srt
"""

import os
import re
import json
import time
from pathlib import Path
from deep_translator import GoogleTranslator

BASE_DIR = Path("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Phim /The Wheel of Time 2021 Seasons 1 to 3 Complete 1080p WEB x264 [i_c]")
SEASON_1_DIR = BASE_DIR / "Season 1"
CACHE_DIR = BASE_DIR / ".sub_cache"

SRT_SOURCE = SEASON_1_DIR / "[0]The.Wheel.of.Time.S01E06.1080p.WEB.H264-CAKES-HI.srt"
VIDEO_TARGET = SEASON_1_DIR / "The Wheel of Time - S01E06 - The Flame of Tar Valon.mkv"
ASS_OUTPUT = SEASON_1_DIR / "The Wheel of Time - S01E06 - The Flame of Tar Valon.ass"
EN_ASS_OUTPUT = SEASON_1_DIR / "The Wheel of Time - S01E06 - The Flame of Tar Valon.en.ass"
CACHE_JSON = CACHE_DIR / "The Wheel of Time - S01E06 - The Flame of Tar Valon_trans.json"
CACHE_EN_ASS = CACHE_DIR / "The Wheel of Time - S01E06 - The Flame of Tar Valon_en_raw.ass"

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

def srt_time_to_ass(srt_time_str):
    # srt: 00:00:06,799 -> ass: 0:00:06.80
    srt_time_str = srt_time_str.strip().replace(",", ".")
    parts = srt_time_str.split(":")
    if len(parts) == 3:
        h = int(parts[0])
        m = parts[1]
        s_part = parts[2]
        # round seconds to 2 decimal places (centiseconds)
        sec_float = float(s_part)
        sec_formatted = f"{sec_float:05.2f}"
        return f"{h}:{m}:{sec_formatted}"
    return srt_time_str

def parse_srt(srt_file_path):
    with open(srt_file_path, "r", encoding="utf-8-sig", errors="ignore") as f:
        content = f.read()

    blocks = re.split(r"\n\s*\n", content.strip())
    dialogues = []

    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if len(lines) < 2:
            continue

        # line 0 is index or time
        time_idx = 1 if "-->" in lines[1] else (0 if "-->" in lines[0] else None)
        if time_idx is None:
            continue

        time_line = lines[time_idx]
        text_lines = lines[time_idx + 1 :]
        if not text_lines:
            continue

        match = re.match(r"(\d+:\d+:\d+[\.,]\d+)\s*-->\s*(\d+:\d+:\d+[\.,]\d+)", time_line)
        if not match:
            continue

        start_srt, end_srt = match.groups()
        start_ass = srt_time_to_ass(start_srt)
        end_ass = srt_time_to_ass(end_srt)

        # Join lines with \N for ASS
        text_ass = r"\N".join(text_lines)

        dialogues.append({
            "layer": "0",
            "start": start_ass,
            "end": end_ass,
            "style": "Default",
            "name": "",
            "ml": "0",
            "mr": "0",
            "mv": "0",
            "effect": "",
            "text": text_ass,
            "raw_lines": text_lines
        })

    return dialogues

def clean_for_translation(text_ass):
    # Replace \N or \n with space
    clean = text_ass.replace(r"\N", " ").replace(r"\n", " ").replace("\n", " ")
    clean = re.sub(r"\{[^}]*\}", "", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean

def translate_cues(dialogues):
    translator = GoogleTranslator(source="en", target="vi")
    translations = {}

    to_query = []
    for idx, d in enumerate(dialogues):
        clean_text = clean_for_translation(d["text"])
        if not clean_text:
            continue

        # If it's music note
        if clean_text in ["♪", "♪ ♪", "♪ ♪ ♪", "[music]", "[music playing]"]:
            translations[idx] = clean_text
            continue

        to_query.append((idx, clean_text))

    print(f"Total dialogues to translate: {len(to_query)}")
    batch_size = 35

    for i in range(0, len(to_query), batch_size):
        chunk = to_query[i : i + batch_size]
        print(f"  Translating batch {i + 1} - {min(i + batch_size, len(to_query))} / {len(to_query)}...")

        combined_text = "\n >>> \n".join([item[1] for item in chunk])
        success = False

        for attempt in range(5):
            try:
                translated_combined = translator.translate(combined_text)
                trans_parts = translated_combined.split(">>>")
                if len(trans_parts) == len(chunk):
                    for (item_idx, _), trans in zip(chunk, trans_parts):
                        translations[item_idx] = trans.strip()
                    success = True
                    break
                else:
                    # Fallback individual
                    for item_idx, orig in chunk:
                        try:
                            translations[item_idx] = translator.translate(orig).strip()
                        except Exception:
                            translations[item_idx] = orig
                    success = True
                    break
            except Exception as e:
                print(f"    Retry {attempt + 1}/5 due to error: {e}")
                time.sleep(1.0 * (attempt + 1))

        if not success:
            for item_idx, orig in chunk:
                translations[item_idx] = orig

        time.sleep(0.2)

    return translations

def main():
    print(f"🎬 Processing S01E06 Subtitles...")
    print(f"  Source SRT: {SRT_SOURCE}")

    if not SRT_SOURCE.exists():
        print(f"❌ Source SRT file not found: {SRT_SOURCE}")
        return

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Parse SRT
    dialogues = parse_srt(SRT_SOURCE)
    print(f"  ✅ Parsed {len(dialogues)} cues from SRT.")

    # 2. Translate
    translations = translate_cues(dialogues)

    # Save translation cache
    with open(CACHE_JSON, "w", encoding="utf-8") as f:
        json.dump(translations, f, ensure_ascii=False, indent=2)
    print(f"  💾 Saved translation cache to {CACHE_JSON.name}")

    # 3. Build English ASS
    en_events = []
    bilingual_events = []

    for idx, d in enumerate(dialogues):
        start = d["start"]
        end = d["end"]
        en_text = d["text"]
        vi_text = translations.get(idx, "")

        # Pure English event
        en_event = f"Dialogue: {d['layer']},{start},{end},Default,{d['name']},{d['ml']},{d['mr']},{d['mv']},{d['effect']},{en_text}"
        en_events.append(en_event)

        # Bilingual event (English on top, Yellow Vietnamese \fs14 on bottom)
        clean_en = clean_for_translation(en_text)
        if vi_text and vi_text.strip() != clean_en and vi_text.strip() not in ["♪", "♪ ♪", "♪ ♪ ♪"]:
            # Format bilingual
            combined = f"{en_text}\\N{{\\fs14\\c&H00FFFF&}}{vi_text}"
        else:
            combined = en_text

        bi_event = f"Dialogue: {d['layer']},{start},{end},Default,{d['name']},{d['ml']},{d['mr']},{d['mv']},{d['effect']},{combined}"
        bilingual_events.append(bi_event)

    # 4. Write English ASS files
    with open(EN_ASS_OUTPUT, "w", encoding="utf-8") as f:
        f.write(ASS_HEADER + "\n".join(en_events) + "\n")
    print(f"  ✅ Created pure English ASS: {EN_ASS_OUTPUT.name}")

    with open(CACHE_EN_ASS, "w", encoding="utf-8") as f:
        f.write(ASS_HEADER + "\n".join(en_events) + "\n")

    # 5. Write Bilingual ASS file
    with open(ASS_OUTPUT, "w", encoding="utf-8") as f:
        f.write(ASS_HEADER + "\n".join(bilingual_events) + "\n")
    print(f"  ✅ Created Bilingual ASS: {ASS_OUTPUT.name}")

    print(f"\n🎉 HOÀN TẤT TẠO PHỤ ĐỀ SONG NGỮ ANH - VIỆT CHO TẬP 6!")
    print(f"  📂 File ASS song ngữ: {ASS_OUTPUT}")
    print(f"  📂 File ASS tiếng Anh: {EN_ASS_OUTPUT}")

if __name__ == "__main__":
    main()
