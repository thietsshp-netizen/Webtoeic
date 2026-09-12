#!/usr/bin/env python3
import os
import subprocess
from pathlib import Path

S01_DIR = "/Volumes/MacOS Sandisk - Data/Users/thietphamvan/hoctoeic/Friends.Complete.Series.720p.BluRay.2CH.x265.HEVC-PSA/S01"

episodes = [
    "Friends.S01E01.The.One.where.Monica.Gets.a.New.Roomate.720p.BluRay.2CH.x265.HEVC-PSA",
    "Friends.S01E02.The.One.With.the.Sonogram.at.the.End.720p.BluRay.2CH.x265.HEVC-PSA",
    "Friends.S01E03.The.One.With.the.Thumb.720p.BluRay.2CH.x265.HEVC-PSA"
]

def main():
    if not os.path.exists(S01_DIR):
        print(f"Error: S01 directory not found: {S01_DIR}")
        return

    for ep in episodes:
        mkv_path = os.path.join(S01_DIR, ep + ".mkv")
        mp4_path = os.path.join(S01_DIR, ep + ".mp4")
        
        print(f"Restoring high quality for: {ep}...")
        cmd = [
            "ffmpeg", "-y", "-i", mkv_path,
            "-c:v", "h264_videotoolbox", "-b:v", "1500k",
            "-c:a", "aac", "-b:a", "32k",
            mp4_path
        ]
        try:
            subprocess.run(cmd, check=True)
            print(f"SUCCESS: Restored {ep}.mp4")
        except Exception as e:
            print(f"FAILED: Could not restore {ep}.mp4: {e}")

if __name__ == "__main__":
    main()
