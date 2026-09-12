#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to update font size of Vietnamese subtitles in all ASS files
from \fs12 to \fs14 (just slightly smaller than English font size 16).
"""

import os
import re
from pathlib import Path

BASE_DIR = Path("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Phim /The Wheel of Time 2021 Seasons 1 to 3 Complete 1080p WEB x264 [i_c]")

def update_ass_files(target_fontsize="14"):
    ass_files = []
    for root, _, files in os.walk(BASE_DIR):
        if ".sub_cache" in root:
            continue
        for f in files:
            if f.endswith(".ass") and not f.endswith(".en.ass"):
                ass_files.append(Path(root) / f)
    
    ass_files.sort()
    print(f"Found {len(ass_files)} bilingual ASS files to update font size to \\fs{target_fontsize}...")

    count = 0
    for file_path in ass_files:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
            content = fp.read()

        # Replace \fs12 with \fs14 or add \fs14 if not present in \c&H00FFFF&
        new_content = re.sub(r"\\fs1[0-3]", f"\\\\fs{target_fontsize}", content)
        
        # If there are lines with {\c&H00FFFF&} without \fs, make sure \fs is added
        new_content = re.sub(r"\\N\{\\c&H00FFFF&\}", f"\\\\N{{\\\\fs{target_fontsize}\\\\c&H00FFFF&}}", new_content)

        with open(file_path, "w", encoding="utf-8") as fp:
            fp.write(new_content)
        
        count += 1
        print(f" ✅ Updated: {file_path.name}")

    print(f"\n🎉 DONE! Updated {count} ASS subtitle files with Vietnamese font size \\fs{target_fontsize} (just slightly smaller than English font size 16).")

if __name__ == "__main__":
    update_ass_files("14")
