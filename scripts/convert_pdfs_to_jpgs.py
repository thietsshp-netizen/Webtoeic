import os, fitz, re

SPLIT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34_DE_THI_IDP_SPLIT'
OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/images_output'

os.makedirs(OUT_DIR, exist_ok=True)

def find_split_y(page, next_sec_num):
    blocks = page.get_text("blocks")
    # Sort blocks vertically by y0
    blocks.sort(key=lambda x: x[1])
    
    target_patterns = []
    if next_sec_num == 2:
        target_patterns = [r'\bsection\s*2\b', r'\breading\s+passage\s*2\b']
    elif next_sec_num == 3:
        target_patterns = [r'\bsection\s*3\b', r'\breading\s+passage\s*3\b']
    elif next_sec_num == 'AK':
        target_patterns = [r'\banswer\s*keys?\b', r'\breading\s*test\b', r'\bsection\s*1\b']
        
    for b in blocks:
        txt = b[4].lower().strip()
        for pat in target_patterns:
            if re.search(pat, txt):
                # Found the block! Use y0 (vertical start) minus a 15px safety margin
                return max(page.cropbox.y0, b[1] - 15)
    return None

print("=== STARTING CLIPPED PDF TO JPG CONVERSION FOR 34 TESTS ===")

for t in range(1, 35):
    pdf_filename = f"idp_test_{t:02d}.pdf"
    pdf_path = os.path.join(SPLIT_DIR, pdf_filename)
    if not os.path.exists(pdf_path):
        print(f"Skipping Test {t:02d} (File not found)")
        continue
        
    print(f"Processing {pdf_filename}...")
    doc = fitz.open(pdf_path)
    n_pages = len(doc)
    
    # 1. Detect Boundaries
    p1_start = 0
    p2_start = None
    p3_start = None
    ak_start = n_pages - 1
    
    # Detect ak_start backwards
    for p in range(n_pages - 1, max(0, n_pages - 5), -1):
        txt = doc[p].get_text().lower()
        if 'section 1' in txt or 'answer' in txt or '1 c' in txt or ('1 ' in txt and len(txt) < 1200):
            ak_start = p
            break
            
    # Detect p2 and p3 starts
    for p in range(ak_start):
        txt = doc[p].get_text()
        if re.search(r'\b(READING PASSAGE\s*2|SECTION\s*2)\b', txt, re.IGNORECASE):
            if p2_start is None:
                p2_start = p
        if re.search(r'\b(READING PASSAGE\s*3|SECTION\s*3)\b', txt, re.IGNORECASE):
            if p3_start is None:
                p3_start = p
                
    if p2_start is None: p2_start = n_pages // 3
    if p3_start is None: p3_start = (n_pages // 3) * 2
    
    # Get split y-coordinates
    y_p2 = find_split_y(doc[p2_start], 2) or (doc[p2_start].cropbox.y0 + doc[p2_start].cropbox.height * 0.5)
    y_p3 = find_split_y(doc[p3_start], 3) or (doc[p3_start].cropbox.y0 + doc[p3_start].cropbox.height * 0.5)
    y_ak = find_split_y(doc[ak_start], 'AK') or (doc[ak_start].cropbox.y0 + doc[ak_start].cropbox.height * 0.5)
    
    test_dir = os.path.join(OUT_DIR, f"test_{t:02d}")
    os.makedirs(test_dir, exist_ok=True)
    
    passages_config = {
        "passage_1": {
            "whole_before": range(0, p2_start),
            "split_end": (p2_start, y_p2),
            "split_ak": (ak_start, y_ak),
            "whole_ak": range(ak_start + 1, n_pages)
        },
        "passage_2": {
            "split_start": (p2_start, y_p2),
            "whole_before": range(p2_start + 1, p3_start),
            "split_end": (p3_start, y_p3),
            "split_ak": (ak_start, y_ak),
            "whole_ak": range(ak_start + 1, n_pages)
        },
        "passage_3": {
            "split_start": (p3_start, y_p3),
            "whole_before": range(p3_start + 1, ak_start),
            "split_end": (ak_start, y_ak), # For P3 questions
            "split_ak": (ak_start, y_ak), # For AK answers (bottom part of same page)
            "whole_ak": range(ak_start + 1, n_pages)
        }
    }
    
    for category, cfg in passages_config.items():
        cat_dir = os.path.join(test_dir, category)
        os.makedirs(cat_dir, exist_ok=True)
        
        # 1. Render start split (bottom part of transition page)
        if "split_start" in cfg:
            p_idx, y_split = cfg["split_start"]
            page = doc[p_idx]
            # Clip vertically from y_split to cropbox.y1
            clip_rect = fitz.Rect(page.cropbox.x0, y_split, page.cropbox.x1, page.cropbox.y1)
            pix = page.get_pixmap(clip=clip_rect, dpi=150)
            pix.save(os.path.join(cat_dir, f"page_{p_idx+1:02d}_start.jpg"))
            
        # 2. Render whole content pages
        for p_idx in cfg["whole_before"]:
            page = doc[p_idx]
            pix = page.get_pixmap(dpi=150)
            pix.save(os.path.join(cat_dir, f"page_{p_idx+1:02d}.jpg"))
            
        # 3. Render end split (top part of transition page)
        if "split_end" in cfg:
            p_idx, y_split = cfg["split_end"]
            page = doc[p_idx]
            # Clip vertically from cropbox.y0 to y_split
            clip_rect = fitz.Rect(page.cropbox.x0, page.cropbox.y0, page.cropbox.x1, y_split)
            pix = page.get_pixmap(clip=clip_rect, dpi=150)
            suffix = "_questions" if category == "passage_3" else "_end"
            pix.save(os.path.join(cat_dir, f"page_{p_idx+1:02d}{suffix}.jpg"))
            
        # 4. Render answer key split (bottom part of ak_start)
        p_idx, y_split = cfg["split_ak"]
        page = doc[p_idx]
        clip_rect = fitz.Rect(page.cropbox.x0, y_split, page.cropbox.x1, page.cropbox.y1)
        pix = page.get_pixmap(clip=clip_rect, dpi=150)
        pix.save(os.path.join(cat_dir, f"page_{p_idx+1:02d}_answers.jpg"))
        
        # 5. Render whole answer key pages
        for p_idx in cfg["whole_ak"]:
            page = doc[p_idx]
            pix = page.get_pixmap(dpi=150)
            pix.save(os.path.join(cat_dir, f"page_{p_idx+1:02d}.jpg"))
            
    doc.close()
    print(f"  Completed Test {t:02d} (Passage 1, 2, 3 clipped successfully)")

print("\n=== CLIPPED IMAGE CONVERSION COMPLETED SUCCESSFULLY! ===")
