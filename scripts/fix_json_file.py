import sys
import re
import json

def fix_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Repair unquoted keys like note": -> "note":
    fixed = re.sub(r'(?<!")([a-zA-Z0-9_]+)":', r'"\1":', content)
    
    # 2. Repair missing closing quotes on string values
    lines = fixed.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check if line looks like: "key": "value (without a closing quote)
        # e.g., "vietnamese": "[PHOEBE THỞ DÀI]
        match = re.match(r'^(\s*"[a-zA-Z0-9_]+"\s*:\s*)"([^"]*)$', line)
        if match:
            # If the next line starts with a closing brace (meaning it's the last property of the object),
            # we don't need a comma. Otherwise, we add a comma.
            next_is_closing = False
            if i + 1 < len(lines) and '}' in lines[i+1]:
                next_is_closing = True
            
            suffix = '"' if next_is_closing else '",'
            lines[i] = match.group(1) + '"' + match.group(2) + suffix
            print(f"Fixed line {i+1}: {lines[i]}")
            
    fixed = '\n'.join(lines)
    
    # Try parsing to validate
    try:
        data = json.loads(fixed)
        output_path = file_path.replace(".json", "_fixed.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"SUCCESS: JSON parsed successfully! Fixed file saved to: {output_path}")
        return True
    except json.JSONDecodeError as e:
        print(f"FAIL: Still failed to parse JSON. Error: {e}")
        # Save intermediate file for debugging
        debug_path = file_path.replace(".json", "_debug_failed.json")
        with open(debug_path, "w", encoding="utf-8") as f:
            f.write(fixed)
        print(f"Saved debug file to: {debug_path}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 fix_json_file.py <path_to_json_file>")
        sys.exit(1)
    fix_json(sys.argv[1])
