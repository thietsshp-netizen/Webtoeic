#!/usr/bin/env python3
import os
import sys
import time
import subprocess
from pathlib import Path

# Configuration
S01_DIR = "/Volumes/MacOS Sandisk - Data/Users/thietphamvan/hoctoeic/Friends.Complete.Series.720p.BluRay.2CH.x265.HEVC-PSA/S01"

def convert_episode(input_mkv: Path, output_mp4: Path) -> bool:
    """Convert HEVC MKV to compressed H.264 MP4 using VideoToolbox hardware acceleration."""
    cmd = [
        "ffmpeg", "-y", "-i", str(input_mkv),
        "-c:v", "h264_videotoolbox", "-b:v", "500k",
        "-c:a", "aac", "-b:a", "96k",
        str(output_mp4)
    ]
    try:
        # Run conversion in subprocess
        result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return result.returncode == 0
    except Exception as e:
        print(f"\n  [Error] Conversion failed for {input_mkv.name}: {e}")
        return False

def main():
    if not os.path.exists(S01_DIR):
        print(f"Error: S01 directory not found: {S01_DIR}")
        sys.exit(1)

    # Collect MKV files
    mkv_files = sorted([Path(os.path.join(S01_DIR, f)) for f in os.listdir(S01_DIR) if f.endswith(".mkv")])
    total_files = len(mkv_files)
    
    print("=" * 60)
    print(f"CONVERTING SEASON 1 EPISODES LOCALLY (500k Bitrate)")
    print(f"Total episodes found: {total_files}")
    print("=" * 60)

    success_count = 0
    failed_count = 0
    start_time = time.time()

    for idx, mkv_path in enumerate(mkv_files, 1):
        # Determine mp4 filename (replace .mkv with .mp4)
        mp4_name = mkv_path.name.replace(".mkv", ".mp4")
        output_mp4_path = Path(os.path.join(S01_DIR, mp4_name))

        print(f"[{idx}/{total_files}] Processing {mkv_path.name}...")
        
        # 1. Convert
        conv_start = time.time()
        print("  Converting to optimized MP4... ", end="", flush=True)
        ok_conv = convert_episode(mkv_path, output_mp4_path)
        conv_time = time.time() - conv_start
        
        if ok_conv:
            size_mb = output_mp4_path.stat().st_size / (1024 * 1024)
            print(f"DONE ({conv_time:.1f}s, {size_mb:.2f} MB)")
            success_count += 1
        else:
            print("FAILED")
            failed_count += 1

    elapsed = time.time() - start_time
    print("=" * 60)
    print("SEASON 1 CONVERSION SUMMARY")
    print("=" * 60)
    print(f"Completed in {elapsed/60:.2f} minutes.")
    print(f"Success: {success_count}")
    print(f"Failed: {failed_count}")
    print("=" * 60)

if __name__ == "__main__":
    main()
