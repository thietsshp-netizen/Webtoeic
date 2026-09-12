import json

def format_explanation(q_num, q_type, q_text, ans, ev_sid, ev_text_vi, q_vi):
    if q_type in ["TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN"]:
        if ans in ["NOT GIVEN", "Not given", "Not Given"]:
            why_correct = f"Bài đọc không đề cập đến thông tin này. Do đó đáp án là NOT GIVEN."
            why_wrong = "Không có cơ sở trong bài đọc để khẳng định Đúng hay Sai."
        elif ans in ["TRUE", "YES"]:
            why_correct = f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Thông tin bài đọc xác nhận nội dung câu hỏi, nên đáp án đúng là {ans}."
            why_wrong = f"Đáp án trái ngược hoặc mâu thuẫn với dẫn chứng trong bài đọc."
        else: # FALSE / NO
            why_correct = f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Thông tin trong bài đọc mâu thuẫn trực tiếp với câu hỏi, nên đáp án đúng là {ans}."
            why_wrong = f"Thông tin câu hỏi đưa ra bị sai lệch so với bài đọc."
    elif q_type == "MULTIPLE_CHOICE_SINGLE":
        why_correct = f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Thông tin bài đọc khẳng định đáp án đúng là {ans}."
        why_wrong = f"Các phương án còn lại không đúng hoặc mâu thuẫn với nội dung bài đọc."
    else: # FILL_IN_BLANKS / SHORT_ANSWER / MATCHING
        why_correct = f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_text_vi}\". Từ/cụm từ phù hợp nhất cần điền/trả lời là \"{ans}\"."
        why_wrong = f"Các từ khác không khớp với ngữ cảnh và thông tin bài đọc."

    return {
        "vi": f"Dịch câu hỏi {q_num}: {q_vi}",
        "why_correct": why_correct,
        "why_wrong": why_wrong
    }

print("Sample test explanation output:")
sample = format_explanation(3, "TRUE_FALSE_NOT_GIVEN", "Palladio's father worked as an architect", "FALSE", "p1-s11", "Cha của Palladio là một thợ xay bột định cư ở Vicenza...", "Cha của Palladio làm kiến trúc sư")
print(json.dumps(sample, ensure_ascii=False, indent=2))
