import fitz

doc = fitz.open("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/outwitting-the-devil-napoleon-hill.pdf")

# Inspect a page that has both text types (e.g. page 20)
page = doc.load_page(19) # 0-indexed page 20
blocks = page.get_text("dict")["blocks"]

for b in blocks:
    if "lines" in b:
        print("--- New Block ---")
        for line in b["lines"]:
            for span in line["spans"]:
                print(f"Font: {span['font']}, Size: {span['size']:.1f}, Text: {span['text']}")
