#!/usr/bin/env python3
import os
import sys
import time
import requests
from pathlib import Path
import urllib.parse

# Configuration
SUPABASE_URL = "https://lvbdcqoagtrzvnaeeznm.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YmRjcW9hZ3RyenZuYWVlem5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM4NTAzOCwiZXhwIjoyMDkwOTYxMDM4fQ.k2hshbZxEgAanCWKNsxEpw9pHQ2bsMlEvbUqmu9L38M"
BUCKET = "The Friends"
BASE_DIR = "/Volumes/MacOS Sandisk - Data/Users/thietphamvan/hoctoeic/Friends.Complete.Series.720p.BluRay.2CH.x265.HEVC-PSA"

HEADERS = {
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "apikey": SUPABASE_SERVICE_KEY,
}

def upload_file(local_path: Path, max_retries: int = 3) -> str:
    """
    Upload file to Supabase.
    Returns:
      "success" - Uploaded successfully.
      "duplicate" - File already exists.
      "failed" - Failed after retries.
    """
    filename = local_path.name
    # Escape bucket name and filename in URL
    bucket_escaped = urllib.parse.quote(BUCKET)
    filename_escaped = urllib.parse.quote(filename)
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket_escaped}/{filename_escaped}"
    
    # Check file size
    size_mb = local_path.stat().st_size / (1024 * 1024)
    print(f"Uploading {filename} ({size_mb:.2f} MB)... ", end="", flush=True)

    headers = {
        **HEADERS,
        "Content-Type": "video/mp4",
        "x-upsert": "true"  # Overwrite existing files
    }

    for attempt in range(1, max_retries + 1):
        try:
            with open(local_path, "rb") as f:
                # requests.post with file object will stream it from disk
                resp = requests.post(url, headers=headers, data=f, timeout=600)
            
            if resp.status_code in (200, 201):
                print("SUCCESS")
                return "success"
            elif resp.status_code == 409:
                print("ALREADY EXISTS (409)")
                return "duplicate"
            elif resp.status_code == 400:
                try:
                    err_data = resp.json()
                    msg = err_data.get("message", "").lower()
                    err = err_data.get("error", "")
                    if err == "Duplicate" or "already exists" in msg or err_data.get("statusCode") == "409":
                        print("ALREADY EXISTS (Duplicate)")
                        return "duplicate"
                except Exception:
                    pass
            
            print(f"\n  [Warning] Attempt {attempt} failed (Status: {resp.status_code})")
            if attempt < max_retries:
                time.sleep(5 * attempt)
        except Exception as e:
            print(f"\n  [Warning] Attempt {attempt} failed with exception: {e}")
            if attempt < max_retries:
                time.sleep(5 * attempt)
                
    print("FAILED")
    return "failed"

def main():
    if not os.path.exists(BASE_DIR):
        print(f"Error: BASE_DIR does not exist: {BASE_DIR}")
        sys.exit(1)

    files_to_upload = []

    # Seasons 5 to 10: all mp4
    for season_num in range(5, 11):
        season_dir = os.path.join(BASE_DIR, f"S{season_num:02d}")
        if os.path.exists(season_dir):
            for f in sorted(os.listdir(season_dir)):
                if f.endswith(".mp4"):
                    files_to_upload.append(Path(os.path.join(season_dir, f)))

    total_files = len(files_to_upload)
    print("=" * 60)
    print(f"SUPABASE FRIENDS VIDEOS UPLOAD")
    print(f"Total mp4 files found: {total_files}")
    print("=" * 60)
    
    success_count = 0
    duplicate_count = 0
    failed_count = 0
    start_time = time.time()

    for idx, fpath in enumerate(files_to_upload, 1):
        print(f"[{idx}/{total_files}] ", end="")
        res = upload_file(fpath)
        if res == "success":
            success_count += 1
        elif res == "duplicate":
            duplicate_count += 1
        else:
            failed_count += 1

    elapsed = time.time() - start_time
    print("=" * 60)
    print("UPLOAD SUMMARY")
    print("=" * 60)
    print(f"Completed in {elapsed:.2f} seconds ({elapsed/60:.2f} minutes).")
    print(f"Success: {success_count}")
    print(f"Skipped (Already exists): {duplicate_count}")
    print(f"Failed: {failed_count}")
    print("=" * 60)

if __name__ == "__main__":
    main()
