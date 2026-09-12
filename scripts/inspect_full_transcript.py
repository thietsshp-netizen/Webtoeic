import json

transcript_path = "/Users/thietpv/.gemini/antigravity-ide/brain/1f258fa5-c201-4bf3-a459-e54473c01075/.system_generated/logs/transcript_full.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines in transcript: {len(lines)}")

# Let's find the last USER_INPUT step
user_input_steps = []
for idx, line in enumerate(lines):
    try:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            user_input_steps.append((idx, data))
    except Exception as e:
        print(f"Error parsing line {idx}: {e}")

if user_input_steps:
    last_idx, last_step = user_input_steps[-1]
    content = last_step.get("content", "")
    print(f"Last USER_INPUT step index: {last_idx}")
    print(f"Content length: {len(content)}")
    print("Is the word '<truncated' in the content?", "<truncated" in content)
    print("\nLast 500 chars of content:")
    print(content[-500:])
else:
    print("No USER_INPUT step found.")
