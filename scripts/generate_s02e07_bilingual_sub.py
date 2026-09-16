#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to create bilingual English - Vietnamese ASS subtitle from:
Season 2/[1]The.Wheel.of.Time.S02E07.1080p.WEB.H264-NHTFS.srt
"""

import os
import re
import sys
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

BASE_DIR = Path("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Phim /The Wheel of Time 2021 Seasons 1 to 3 Complete 1080p WEB x264 [i_c]")
SEASON_2_DIR = BASE_DIR / "Season 2"
CACHE_DIR = BASE_DIR / ".sub_cache"

SRT_SOURCE = SEASON_2_DIR / "[1]The.Wheel.of.Time.S02E07.1080p.WEB.H264-NHTFS.srt"
ASS_OUTPUT_NAME_MKV = SEASON_2_DIR / "The Wheel of Time - S02E07 - Daes Dae'Mar.ass"
EN_ASS_OUTPUT_MKV = SEASON_2_DIR / "The Wheel of Time - S02E07 - Daes Dae'Mar.en.ass"
ASS_OUTPUT_SRT_NAME = SEASON_2_DIR / "[1]The.Wheel.of.Time.S02E07.1080p.WEB.H264-NHTFS.ass"

CACHE_JSON = CACHE_DIR / "The Wheel of Time - S02E07 - Daes Dae'Mar_trans.json"

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

def srt_time_to_ass(srt_time_str):
    srt_time_str = srt_time_str.strip().replace(",", ".")
    parts = srt_time_str.split(":")
    if len(parts) == 3:
        h = int(parts[0])
        m = parts[1]
        s_part = parts[2]
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

        # Clean tags in text lines
        cleaned_lines = []
        for tl in text_lines:
            c = re.sub(r"</?[a-zA-Z0-9]+[^>]*>", "", tl)
            c = re.sub(r"^\{\\an\d+\}", "", c).strip()
            if c:
                cleaned_lines.append(c)

        if not cleaned_lines:
            continue

        text_ass = r"\N".join(cleaned_lines)

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
            "raw_lines": cleaned_lines
        })

    return dialogues

def clean_for_translation(text_ass):
    clean = re.sub(r"</?[a-zA-Z0-9]+[^>]*>", "", text_ass)
    clean = re.sub(r"\{[^}]*\}", "", clean)
    clean = clean.replace(r"\N", " ").replace(r"\n", " ").replace("\n", " ")
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean

def translate_single(text):
    if not text.strip():
        return ""
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=" + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as res:
        data = json.loads(res.read().decode("utf-8"))
        return "".join([part[0] for part in data[0] if part[0]]).strip()

def translate_batch_gtx(items):
    combined = "\n".join([f"[{i}] " + t.replace("\n", " ") for i, (idx, t) in enumerate(items)])
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=" + urllib.parse.quote(combined)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    
    with urllib.request.urlopen(req, timeout=15) as res:
        data = json.loads(res.read().decode("utf-8"))
        full_text = "".join([part[0] for part in data[0] if part[0]])
    
    results = {}
    lines = full_text.split("\n")
    current_i = None
    buf = []
    
    for l in lines:
        m = re.match(r"^\[(\d+)\]\s*(.*)", l)
        if m:
            if current_i is not None and current_i < len(items):
                results[items[current_i][0]] = " ".join(buf).strip()
            current_i = int(m.group(1))
            buf = [m.group(2)]
        else:
            if buf:
                buf.append(l)
    if current_i is not None and current_i < len(items):
        results[items[current_i][0]] = " ".join(buf).strip()
        
    return results

def translate_cues(dialogues):
    translations = {}
    to_query = []

    for idx, d in enumerate(dialogues):
        clean_text = clean_for_translation(d["text"])
        if not clean_text:
            continue

        if clean_text in ["♪", "♪ ♪", "♪ ♪ ♪", "[music]", "[music playing]"]:
            translations[idx] = clean_text
            continue

        to_query.append((idx, clean_text))

    print(f"Total cues to translate: {len(to_query)}")
    batch_size = 25

    for i in range(0, len(to_query), batch_size):
        chunk = to_query[i : i + batch_size]
        print(f"  Translating cues {i + 1} - {min(i + batch_size, len(to_query))} / {len(to_query)}...")

        success = False
        for attempt in range(3):
            try:
                res = translate_batch_gtx(chunk)
                if len(res) == len(chunk):
                    translations.update(res)
                    success = True
                    break
                else:
                    for item_idx, t in chunk:
                        if item_idx not in res:
                            try:
                                res[item_idx] = translate_single(t)
                            except Exception:
                                res[item_idx] = t
                    translations.update(res)
                    success = True
                    break
            except Exception as e:
                print(f"    Batch retry {attempt + 1}/3 ({e})")
                time.sleep(1.0)

        if not success:
            for item_idx, t in chunk:
                try:
                    translations[item_idx] = translate_single(t)
                except Exception:
                    translations[item_idx] = t
                time.sleep(0.1)

        time.sleep(0.3)

    return translations

def clean_en_sub(text):
    text = re.sub(r"</?i>", "", text)
    text = re.sub(r"</?b>", "", text)
    text = re.sub(r"^\{\\an\d+\}", "", text)
    return text

def main():
    print(f"🎬 Processing S02E07 Subtitles...")
    print(f"  Source SRT: {SRT_SOURCE}")

    if not SRT_SOURCE.exists():
        print(f"❌ Source SRT file not found: {SRT_SOURCE}")
        return

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Parse SRT
    dialogues = parse_srt(SRT_SOURCE)
    print(f"  ✅ Parsed {len(dialogues)} cues from SRT.")

    # 2. Check cache or translate
    translations = {}
    if CACHE_JSON.exists():
        try:
            with open(CACHE_JSON, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
                translations = {int(k): v for k, v in cached_data.items()}
            print(f"  ⚡ Loaded {len(translations)} cached translations.")
        except Exception:
            translations = {}

    if len(translations) < len(dialogues) * 0.9:
        translations = translate_cues(dialogues)
        with open(CACHE_JSON, "w", encoding="utf-8") as f:
            json.dump(translations, f, ensure_ascii=False, indent=2)
        print(f"  💾 Saved translation cache to {CACHE_JSON.name}")

    # 3. Build events
    en_events = []
    bilingual_events = []

    for idx, d in enumerate(dialogues):
        start = d["start"]
        end = d["end"]
        en_text = clean_en_sub(d["text"])
        vi_text = translations.get(idx, "")

        # Pure English event
        en_event = f"Dialogue: {d['layer']},{start},{end},Default,{d['name']},{d['ml']},{d['mr']},{d['mv']},{d['effect']},{en_text}"
        en_events.append(en_event)

        # Bilingual event (English on top, Yellow Vietnamese \fs14 on bottom)
        clean_en = clean_for_translation(en_text)
        if vi_text and vi_text.strip() != clean_en and vi_text.strip() not in ["♪", "♪ ♪", "♪ ♪ ♪"]:
            combined = f"{en_text}\\N{{\\fs14\\c&H00FFFF&}}{vi_text}"
        else:
            combined = en_text

        bi_event = f"Dialogue: {d['layer']},{start},{end},Default,{d['name']},{d['ml']},{d['mr']},{d['mv']},{d['effect']},{combined}"
        bilingual_events.append(bi_event)

    # 4. Write English ASS file
    with open(EN_ASS_OUTPUT_MKV, "w", encoding="utf-8") as f:
        f.write(ASS_HEADER + "\n".join(en_events) + "\n")
    print(f"  ✅ Created pure English ASS: {EN_ASS_OUTPUT_MKV.name}")

    # 5. Write Bilingual ASS files
    with open(ASS_OUTPUT_NAME_MKV, "w", encoding="utf-8") as f:
        f.write(ASS_HEADER + "\n".join(bilingual_events) + "\n")
    print(f"  ✅ Created Bilingual ASS (matching MKV): {ASS_OUTPUT_NAME_MKV.name}")

    with open(ASS_OUTPUT_SRT_NAME, "w", encoding="utf-8") as f:
        f.write(ASS_HEADER + "\n".join(bilingual_events) + "\n")
    print(f"  ✅ Created Bilingual ASS (matching SRT): {ASS_OUTPUT_SRT_NAME.name}")

    print(f"\n🎉 HOÀN TẤT TẠO FILE ASS SONG NGỮ CHO TẬP S02E07!")

if __name__ == "__main__":
    main()
