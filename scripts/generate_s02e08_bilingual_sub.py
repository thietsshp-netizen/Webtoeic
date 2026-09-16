#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to create bilingual English - Vietnamese ASS subtitle from:
Season 2/[1]The.Wheel.of.Time.S02E08.1080p.WEB.H264-NHTFS.srt
"""

import os
import re
import sys
import json
import time
import random
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from deep_translator import MyMemoryTranslator, GoogleTranslator

BASE_DIR = Path("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Phim /The Wheel of Time 2021 Seasons 1 to 3 Complete 1080p WEB x264 [i_c]")
SEASON_2_DIR = BASE_DIR / "Season 2"
CACHE_DIR = BASE_DIR / ".sub_cache"

SRT_SOURCE = SEASON_2_DIR / "[1]The.Wheel.of.Time.S02E08.1080p.WEB.H264-NHTFS.srt"
ASS_OUTPUT_NAME_MKV = SEASON_2_DIR / "The Wheel of Time - S02E08 - What Was Meant to Be.ass"
EN_ASS_OUTPUT_MKV = SEASON_2_DIR / "The Wheel of Time - S02E08 - What Was Meant to Be.en.ass"
ASS_OUTPUT_SRT_NAME = SEASON_2_DIR / "[1]The.Wheel.of.Time.S02E08.1080p.WEB.H264-NHTFS.ass"

CACHE_JSON = CACHE_DIR / "The Wheel of Time - S02E08 - What Was Meant to Be_trans.json"

ASS_HEADER = """[Script Info]
; Script generated for The Wheel of Time Bilingual Subtitles
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,16,&Hffffff,&Hffffff,&H0,&H0,0,0,0,0,100,100,0,0,1,1,0,2,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

VI_CHARS = "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚŨỤƯỪỨỬỮỰỲÝỶỸỴĐ"

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

def translate_fallback(text):
    if not text.strip():
        return ""
    
    # 1. Google dict-chrome-ex
    try:
        url = 'https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=en&tl=vi&dt=t&q=' + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={'User-Agent': f'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_{random.randint(1,9)}) AppleWebKit/537.36'})
        with urllib.request.urlopen(req, timeout=6) as res:
            data = json.loads(res.read().decode('utf-8'))
            trans = ''.join([part[0] for part in data[0] if part[0]]).strip()
            if trans and any(c in VI_CHARS for c in trans):
                return trans
    except Exception:
        pass

    # 2. MyMemory
    try:
        t = MyMemoryTranslator(source='en-US', target='vi-VN').translate(text)
        if t and any(c in VI_CHARS for c in t):
            return t.strip()
    except Exception:
        pass

    # 3. Google deep-translator
    try:
        t = GoogleTranslator(source='en', target='vi').translate(text)
        if t:
            return t.strip()
    except Exception:
        pass

    return text

def translate_cues(dialogues, existing_translations):
    translations = dict(existing_translations)
    to_query = []

    for idx, d in enumerate(dialogues):
        clean_text = clean_for_translation(d["text"])
        if not clean_text:
            continue

        if clean_text in ["♪", "♪ ♪", "♪ ♪ ♪", "[music]", "[music playing]"]:
            translations[idx] = clean_text
            continue

        cur = translations.get(idx, "")
        if cur and any(c in VI_CHARS for c in cur):
            continue

        to_query.append((idx, clean_text))

    print(f"Total cues needing translation: {len(to_query)}")
    if not to_query:
        return translations

    # Use thread pool with 4 workers to translate smoothly
    completed = 0
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_idx = {executor.submit(translate_fallback, text): idx for (idx, text) in to_query}
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                res = future.result()
                translations[idx] = res
            except Exception as e:
                translations[idx] = dialogues[idx]["text"]
            completed += 1
            if completed % 50 == 0 or completed == len(to_query):
                print(f"  Translated {completed}/{len(to_query)} cues...")
            time.sleep(0.1)

    return translations

def clean_en_sub(text):
    text = re.sub(r"</?i>", "", text)
    text = re.sub(r"</?b>", "", text)
    text = re.sub(r"^\{\\an\d+\}", "", text)
    return text

def main():
    print(f"🎬 Processing S02E08 Subtitles...")
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
        except Exception:
            translations = {}

    translations = translate_cues(dialogues, translations)
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

    print(f"\n🎉 HOÀN TẤT TẠO FILE ASS SONG NGỮ CHO TẬP S02E08!")

if __name__ == "__main__":
    main()
