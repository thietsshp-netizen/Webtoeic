#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to extract English subtitles from MKV files in The Wheel of Time,
translate to Vietnamese, and generate high-quality bilingual ASS subtitles.
"""

import os
import re
import sys
import json
import time
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
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

def get_video_files():
    video_files = []
    for root, _, filenames in os.walk(BASE_DIR):
        for f in filenames:
            if f.endswith((".mkv", ".mp4")) and not f.startswith("."):
                video_files.append(Path(root) / f)
    video_files.sort()
    return video_files

def get_best_subtitle_stream(video_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "stream=index,codec_name,codec_type:stream_tags=language,title",
        "-of", "json", str(video_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        data = json.loads(res.stdout)
    except Exception:
        return None

    streams = [s for s in data.get("streams", []) if s.get("codec_type") == "subtitle"]
    if not streams:
        return None

    # 1. Look for English (SDH) or English non-forced
    for s in streams:
        tags = s.get("tags", {})
        title = tags.get("title", "").lower()
        lang = tags.get("language", "").lower()
        if (lang == "eng" or "english" in title or "eng" in title) and "forced" not in title:
            return s["index"]

    # 2. Look for any English
    for s in streams:
        tags = s.get("tags", {})
        title = tags.get("title", "").lower()
        lang = tags.get("language", "").lower()
        if lang == "eng" or "english" in title or "eng" in title:
            return s["index"]

    # 3. Fallback to first subtitle stream
    return streams[0]["index"]

def extract_raw_subtitle(video_path, stream_idx, output_ass_path):
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", str(video_path),
        "-map", f"0:{stream_idx}",
        "-c:s", "copy",
        str(output_ass_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        # If copy fails (e.g. format conversion needed), convert to ass
        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", str(video_path),
            "-map", f"0:{stream_idx}",
            "-c:s", "ass",
            str(output_ass_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode == 0

def parse_ass_dialogues(ass_path):
    with open(ass_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    dialogues = []
    for line in lines:
        if line.startswith("Dialogue:"):
            # Format: Dialogue: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
            parts = line.split(",", 9)
            if len(parts) == 10:
                layer = parts[0].replace("Dialogue:", "").strip()
                start = parts[1].strip()
                end = parts[2].strip()
                style = parts[3].strip()
                name = parts[4].strip()
                ml = parts[5].strip()
                mr = parts[6].strip()
                mv = parts[7].strip()
                effect = parts[8].strip()
                text = parts[9].rstrip("\r\n")

                dialogues.append({
                    "layer": layer,
                    "start": start,
                    "end": end,
                    "style": style,
                    "name": name,
                    "ml": ml,
                    "mr": mr,
                    "mv": mv,
                    "effect": effect,
                    "text": text
                })
    return dialogues

def clean_text_for_translation(raw_text):
    # Remove ASS override tags like {\...}
    clean = re.sub(r"\{[^}]*\}", "", raw_text)
    # Replace \N or \n with space
    clean = clean.replace(r"\N", " ").replace(r"\n", " ").replace("\n", " ")
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean

def translate_batch(texts_to_translate):
    """
    Translates a list of texts using deep-translator with chunking & retry
    """
    translator = GoogleTranslator(source="en", target="vi")
    results = {}
    
    # Filter out empty or purely sound-effect texts that don't need translation
    to_query = []
    for idx, t in texts_to_translate:
        if not t or (t.startswith("(") and t.endswith(")")) or (t.startswith("[") and t.endswith("]")):
            # Still can translate sound effects or leave as is, but let's translate dialogue
            to_query.append((idx, t))
        else:
            to_query.append((idx, t))

    # Group into batches of ~40 items using separator
    batch_size = 35
    for i in range(0, len(to_query), batch_size):
        chunk = to_query[i:i+batch_size]
        combined_text = "\n >>> \n".join([item[1] for item in chunk])
        
        success = False
        for attempt in range(5):
            try:
                translated_combined = translator.translate(combined_text)
                trans_parts = translated_combined.split(">>>")
                if len(trans_parts) == len(chunk):
                    for (item_idx, _), trans in zip(chunk, trans_parts):
                        results[item_idx] = trans.strip()
                    success = True
                    break
                else:
                    # Length mismatch, fallback to individual translation for this chunk
                    for item_idx, original in chunk:
                        try:
                            results[item_idx] = translator.translate(original).strip()
                        except Exception:
                            results[item_idx] = original
                    success = True
                    break
            except Exception as e:
                time.sleep(1.0 * (attempt + 1))

        if not success:
            for item_idx, original in chunk:
                results[item_idx] = original

        time.sleep(0.3)

    return results

def build_bilingual_ass(dialogues, translations):
    events = []
    for idx, d in enumerate(dialogues):
        start = d["start"]
        end = d["end"]
        en_raw = d["text"]
        
        # Clean tags from original English text but keep formatting if wanted
        # Remove old subtitle color styling if any
        en_clean = en_raw
        
        vi_text = translations.get(idx, "")
        
        # Format bilingual:
        # Top line: English (Original)
        # Bottom line: Vietnamese in Yellow (\fs14\c&H00FFFF&) - just slightly smaller than English font 16
        if vi_text and vi_text.strip() != en_clean.strip():
            combined_text = f"{en_clean}\\N{{\\fs14\\c&H00FFFF&}}{vi_text}"
        else:
            combined_text = en_clean

        event_line = f"Dialogue: {d['layer']},{start},{end},Default,{d['name']},{d['ml']},{d['mr']},{d['mv']},{d['effect']},{combined_text}"
        events.append(event_line)

    return ASS_HEADER + "\n".join(events) + "\n"

def process_single_video(video_path):
    print(f"\n========================================================")
    print(f"🎬 Processing: {video_path.name}")
    
    stream_idx = get_best_subtitle_stream(video_path)
    if stream_idx is None:
        print(f"❌ No subtitle stream found in {video_path.name}")
        return False

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_json = CACHE_DIR / f"{video_path.stem}_trans.json"
    temp_en_ass = CACHE_DIR / f"{video_path.stem}_en_raw.ass"

    # 1. Extract raw English subtitle
    print(f"  📥 Extracting English subtitle stream #{stream_idx}...")
    if not extract_raw_subtitle(video_path, stream_idx, temp_en_ass):
        print(f"  ❌ Failed to extract subtitle from {video_path.name}")
        return False

    # Also save the pure English ASS next to the video
    en_ass_target = video_path.parent / f"{video_path.stem}.en.ass"
    if not en_ass_target.exists():
        subprocess.run(["cp", str(temp_en_ass), str(en_ass_target)], capture_output=True)

    # 2. Parse dialogues
    dialogues = parse_ass_dialogues(temp_en_ass)
    print(f"  📝 Extracted {len(dialogues)} dialogue cues.")

    if not dialogues:
        print(f"  ⚠️ No dialogues found in extracted subtitle.")
        return False

    # 3. Load or generate translations
    translations = {}
    if cache_json.exists():
        try:
            with open(cache_json, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
                translations = {int(k): v for k, v in cached_data.items()}
            print(f"  ⚡ Loaded {len(translations)} cached translations.")
        except Exception:
            translations = {}

    to_translate = []
    for idx, d in enumerate(dialogues):
        if idx not in translations or not translations[idx]:
            clean_t = clean_text_for_translation(d["text"])
            if clean_t:
                to_translate.append((idx, clean_t))

    if to_translate:
        print(f"  🌐 Translating {len(to_translate)} cues to Vietnamese...")
        new_trans = translate_batch(to_translate)
        translations.update(new_trans)
        
        # Save cache
        with open(cache_json, "w", encoding="utf-8") as f:
            json.dump(translations, f, ensure_ascii=False, indent=2)

    # 4. Build bilingual ASS file
    bilingual_ass_content = build_bilingual_ass(dialogues, translations)
    target_ass_path = video_path.parent / f"{video_path.stem}.ass"

    with open(target_ass_path, "w", encoding="utf-8") as f:
        f.write(bilingual_ass_content)

    print(f"  ✅ Saved bilingual subtitle: {target_ass_path.name} ({len(dialogues)} cues)")
    return True

def main():
    videos = get_video_files()
    print(f"Found {len(videos)} video files in The Wheel of Time collection.")
    
    success_count = 0
    for idx, video in enumerate(videos, 1):
        print(f"\n[{idx}/{len(videos)}]")
        if process_single_video(video):
            success_count += 1

    print(f"\n🎉 ALL DONE! Successfully processed {success_count}/{len(videos)} episodes.")

if __name__ == "__main__":
    main()
