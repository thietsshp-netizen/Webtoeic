import pypdf, re

pdf_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/34 De Thi Reading BC_IDP.pdf'
reader = pypdf.PdfReader(pdf_path)

print("=== Mapping Answer Pages (460 to 496) to Test IDs ===")

current_test = None
test_answer_pages = {}

for p_idx in range(459, len(reader.pages)):
    txt = reader.pages[p_idx].extract_text()
    
    m_test = re.search(r'(?:Reading\s+Test|TEST)\s+(\d+)', txt, re.IGNORECASE)
    if m_test:
        current_test = int(m_test.group(1))

    if current_test:
        if current_test not in test_answer_pages:
            test_answer_pages[current_test] = []
        test_answer_pages[current_test].append(p_idx + 1)

for t in range(1, 35):
    pages = test_answer_pages.get(t, [])
    print(f"Test {t:2d}: Answer Key on PDF Pages {pages}")
