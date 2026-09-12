import fitz # PyMuPDF

doc = fitz.open("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/outwitting-the-devil-napoleon-hill.pdf")
print("Total Pages:", len(doc))

# Let's inspect the text of pages 10 to 20 to see the book layout
for page_num in range(10, 20):
    page = doc.load_page(page_num)
    text = page.get_text("text")
    print(f"\n--- PAGE {page_num + 1} ---")
    print(text[:1000]) # First 1000 characters
