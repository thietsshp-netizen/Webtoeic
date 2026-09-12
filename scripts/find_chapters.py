import fitz

doc = fitz.open("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/outwitting-the-devil-napoleon-hill.pdf")

fonts = set()
chapters = []

for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    blocks = page.get_text("dict")["blocks"]
    for b in blocks:
        if "lines" in b:
            for line in b["lines"]:
                for span in line["spans"]:
                    fonts.add(span["font"])
                    txt = span["text"].strip()
                    # Check if it looks like a chapter heading
                    if "chapter" in txt.lower() or "one" in txt.lower() or "two" in txt.lower() or "three" in txt.lower():
                        if span["size"] > 14: # Usually larger font
                            chapters.append((page_num + 1, txt, span["font"], span["size"]))

print("Fonts found in PDF:")
for f in sorted(fonts):
    print(f" - {f}")

print("\nPossible Chapters / Major Headings:")
for ch in chapters[:30]:
    print(f"Page {ch[0]}: {ch[1]} (Font: {ch[2]}, Size: {ch[3]:.1f})")
