import os

files_to_delete = [
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/build_bc_perfect_json.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/audit_all_bc_json.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/test_perfect_exclamation_fix.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/inspect_34_de_pdf.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/inspect_34_de_structure.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/inspect_idp_json_files.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/audit_34_idp_json.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/inspect_34_de_tests_map.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/inspect_34_de_answer_keys.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/build_34_idp_json.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_strict_sequential.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/build_34_idp_json_sequential.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_dynamic_boundaries.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/inspect_generated_test1.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/check_progress.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_clean_answers_parser.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_all_answers_clean.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/build_34_idp_json_perfect_answers.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_clean_evidence_matching.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_perfect_explanations.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_fix_passage_slicing.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/inspect_all_test_starts_clean.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_perfect_passage_slicing.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/debug_top_headers.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/split_34_idp_pdfs.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/extract_all_answers_pdf.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/clean_split_tests_only.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/inspect_test6_answer_key.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/inspect_page_466.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/map_all_answer_pages_perfectly.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/split_34_idp_pdfs_perfect.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_clean_pdf_parser.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/test_perfect_single_pdf_to_json.py',
    '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/scripts/inspect_passage_raw.py'
]

deleted_count = 0
for path in files_to_delete:
    if os.path.exists(path):
        os.remove(path)
        deleted_count += 1
        print(f"Deleted: {os.path.basename(path)}")

print(f"\nCleanup complete! Deleted {deleted_count} old script files.")
