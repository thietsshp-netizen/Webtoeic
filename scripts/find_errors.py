with open("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/failed_json_raw.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    # Strip whitespace
    stripped = line.strip()
    if not stripped:
        continue
    
    # We expect keys to be double quoted. Let's find keys missing quotes:
    # e.g. note":
    if 'note":' in stripped and not stripped.startswith('"note"'):
        print(f"Line {i+1}: Missing start quote on note key: {stripped}")
    
    # Count double quotes in the line (ignoring escaped ones, though there might not be any)
    # Actually, let's count simple double quotes
    quotes_count = stripped.count('"')
    
    # If the line is a key-value string property (like text, ipa, vietnamese, note)
    # it should usually have 4 quotes (2 for key, 2 for value) unless the value itself has quotes.
    # But if it has an odd number of quotes, it's very likely a syntax error:
    is_property = any(k in stripped for k in ['"text"', '"ipa"', '"vietnamese"', '"note"', 'note":'])
    if is_property:
        # Check if the quotes are unbalanced (odd number of quotes)
        # Note: if there are escaped quotes like \", we need to handle that, but let's check simple count first
        actual_quotes = stripped.replace('\\"', '')
        q_count = actual_quotes.count('"')
        if q_count % 2 != 0:
            print(f"Line {i+1}: Unbalanced quotes ({q_count}): {stripped}")
