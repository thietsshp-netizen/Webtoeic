import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def main():
    if len(sys.argv) < 2:
        print("ERROR: Missing video ID")
        sys.exit(1)
        
    video_id = sys.argv[1]
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        
        try:
            transcript = transcript_list.find_transcript(['en', 'en-US'])
        except Exception:
            transcripts = list(transcript_list)
            if transcripts:
                transcript = transcripts[0]
            else:
                raise Exception("No transcripts found")

        raw_data = transcript.fetch()
        
        serializable_data = []
        for entry in raw_data:
            if isinstance(entry, dict):
                text = entry.get("text", "")
                start = entry.get("start", 0.0)
                duration = entry.get("duration", 0.0)
            else:
                text = getattr(entry, "text", "")
                start = getattr(entry, "start", 0.0)
                duration = getattr(entry, "duration", 0.0)
                
            text = text.replace(">>", "").strip()
            # Basic sentence cleaning
            if text.isupper() and len(text) > 4:
                text = text.capitalize()
                
            start_val = round(start, 2)
            end_val = round(start + duration, 2)
            
            serializable_data.append({
                "start": start_val,
                "end": end_val,
                "text": text
            })
            
        print(json.dumps(serializable_data, ensure_ascii=False))
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
