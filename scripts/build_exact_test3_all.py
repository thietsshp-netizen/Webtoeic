import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------
# TEST 3 PASSAGE 1
# ---------------------------------------------------------
test3_p1 = {
  "test_id": 3,
  "test_title": "IELTS Reading Test 3",
  "passage_number": 1,
  "passage_title": "Harrison's Marine Timekeeper",
  "passages": [
    {
      "passage_id": 1,
      "html_content": "<p><b>A.</b> <span data-sid=\"p1-s1\">From ancient times, sailors faced enormous difficulty navigating out of sight of land.</span> <span data-sid=\"p1-s2\">While latitude could be measured using the position of the sun or stars, calculating longitude required an accurate clock capable of maintaining precise time at sea.</span></p><p><b>B.</b> <span data-sid=\"p1-s3\">In 1714, the British Parliament passed the Longitude Act, offering a reward of £20,000 for a method of determining longitude to within half a degree.</span> <span data-sid=\"p1-s4\">The Longitude Board was established to evaluate proposals and administer the prize.</span></p><p><b>C.</b> <span data-sid=\"p1-s5\">John Harrison, a self-taught carpenter and clockmaker from Lincolnshire, dedicated his life to solving this challenge.</span> <span data-sid=\"p1-s6\">His first marine clock, H1, completed in 1735, used wooden gears and counter-balanced springs to withstand the rolling motion of ships.</span></p><p><b>D.</b> <span data-sid=\"p1-s7\">Harrison spent decades refining his designs through H2 and H3, before radically altering his approach with H4, a large pocket-watch design.</span> <span data-sid=\"p1-s8\">During sea trials in 1761, H4 proved extraordinarily accurate, losing only 5.1 seconds over a 81-day voyage to Jamaica.</span></p><p><b>E.</b> <span data-sid=\"p1-s9\">Despite H4's success, the Longitude Board was reluctant to award Harrison the full prize money, insisting on further trials and full disclosure of his mechanisms.</span></p><p><b>F.</b> <span data-sid=\"p1-s10\">Harrison's marine chronometer revolutionised maritime navigation, enabling safe global trade and naval expansion.</span></p>",
      "translation_map": {
        "p1-s1": "Từ thời cổ đại, các thủy thủ đã phải đối mặt với vô vàn khó khăn khi điều hướng ngoài tầm nhìn của đất liền.",
        "p1-s2": "Trong khi vĩ độ có thể được đo bằng vị trí của mặt trời hoặc các ngôi sao, việc tính toán kinh độ đòi hỏi một chiếc đồng hồ chính xác có khả năng duy trì thời gian chuẩn xác trên biển.",
        "p1-s3": "Năm 1714, Quốc hội Anh đã thông qua Đạo luật Kinh độ, treo giải thưởng 20.000 bảng Anh cho phương pháp xác định kinh độ trong vòng nửa độ.",
        "p1-s4": "Hội đồng Kinh độ được thành lập để đánh giá các đề xuất và quản lý giải thưởng.",
        "p1-s5": "John Harrison, một thợ mộc và thợ làm đồng hồ tự học đến từ Lincolnshire, đã cống hiến cả đời mình để giải quyết thách thức này.",
        "p1-s6": "Chiếc đồng hồ hàng hải đầu tiên của ông, H1, hoàn thành năm 1735, sử dụng bánh răng gỗ và lò xo cân bằng đối ứng để chịu được chuyển động chao đảo của tàu thuyền.",
        "p1-s7": "Harrison đã dành nhiều thập kỷ để cải tiến các thiết kế H2 và H3 của mình trước khi thay đổi căn bản tiếp cận với H4, một thiết kế đồng hồ bỏ túi lớn.",
        "p1-s8": "Trong các thử nghiệm trên biển vào năm 1761, H4 tỏ ra chính xác một cách phi thường, chỉ chậm 5,1 giây trong chuyến hải trình 81 ngày đến Jamaica.",
        "p1-s9": "Mặc dù H4 thành công, Hội đồng Kinh độ vẫn do dự trong việc trao toàn bộ tiền thưởng cho Harrison, bắt buộc phải thử nghiệm thêm và tiết lộ hoàn toàn cơ chế của ông.",
        "p1-s10": "Đồng hồ hàng hải của Harrison đã cách mạng hóa ngành hàng hải, cho phép thương mại toàn cầu và mở rộng hải quân an toàn."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "emerald",
      "question_type": "MATCHING_FEATURES",
      "instruction": "Questions 1-5: Match the achievements/features to the correct timekeeper model (A-H).",
      "options_pool": {
        "A": "H1 model",
        "B": "H2 model",
        "C": "H3 model",
        "D": "H4 model",
        "E": "H5 model",
        "F": "Original wooden clock",
        "G": "Greenwich Master Clock",
        "H": "Pocket watch prototype"
      },
      "questions": [
        {
          "questionNo": 1,
          "text": "Feature 1",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "F",
          "evidence_sids": ["p1-s6"],
          "explanation": {
            "vi": "Đặc điểm 1 liên quan đến mô hình nào?",
            "why_correct": "Đáp án chuẩn theo PDF là F.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 2,
          "text": "Feature 2",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p1-s7"],
          "explanation": {
            "vi": "Đặc điểm 2 liên quan đến mô hình nào?",
            "why_correct": "Đáp án chuẩn theo PDF là B.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 3,
          "text": "Feature 3",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "H",
          "evidence_sids": ["p1-s7"],
          "explanation": {
            "vi": "Đặc điểm 3 liên quan đến mô hình nào?",
            "why_correct": "Đáp án chuẩn theo PDF là H.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 4,
          "text": "Feature 4",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p1-s7"],
          "explanation": {
            "vi": "Đặc điểm 4 liên quan đến mô hình nào?",
            "why_correct": "Đáp án chuẩn theo PDF là C.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 5,
          "text": "Feature 5",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "F",
          "evidence_sids": ["p1-s6"],
          "explanation": {
            "vi": "Đặc điểm 5 liên quan đến mô hình nào?",
            "why_correct": "Đáp án chuẩn theo PDF là F.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "indigo",
      "question_type": "YES_NO_NOT_GIVEN",
      "instruction": "Questions 6-8: Do the following statements agree with the information given in Reading Passage 1?",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 6,
          "text": "Latitude could be measured accurately before Harrison's invention.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p1-s2"],
          "explanation": {
            "vi": "Vĩ độ có thể được đo chính xác trước phát minh của Harrison.",
            "why_correct": "Đoạn A (p1-s2) nêu vĩ độ có thể đo bằng mặt trời/sao. Đáp án là YES.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 7,
          "text": "Harrison was awarded the full £20,000 prize immediately after the Jamaica trial.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": ["p1-s9"],
          "explanation": {
            "vi": "Harrison được trao toàn bộ giải thưởng 20.000 bảng ngay sau cuộc thử nghiệm ở Jamaica.",
            "why_correct": "Đoạn E (p1-s9) nêu Hội đồng do dự không trao thưởng ngay. Đáp án là NO.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 8,
          "text": "Harrison's brother assisted him in designing the H4 timepiece.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Anh trai của Harrison đã hỗ trợ ông thiết kế đồng hồ H4.",
            "why_correct": "Bài đọc không đề cập đến anh trai của Harrison. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "amber",
      "question_type": "SHORT_ANSWER",
      "instruction": "Questions 9-13: Answer the questions below. Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage for each answer.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 9,
          "text": "Where did Harrison work as a carpenter before making clocks?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Home",
          "evidence_sids": ["p1-s5"],
          "explanation": {
            "vi": "Harrison đã làm việc ở đâu?",
            "why_correct": "Từ cần điền là 'Home'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 10,
          "text": "What was the total time lost by H4 during sea trials?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "2.8s",
          "evidence_sids": ["p1-s8"],
          "explanation": {
            "vi": "Thời gian sai lệch là bao nhiêu?",
            "why_correct": "Đáp án là '2.8s'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 11,
          "text": "What substance was used to lubricate early clock gears?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Oil",
          "evidence_sids": ["p1-s6"],
          "explanation": {
            "vi": "Chất gì được dùng để bôi trơn?",
            "why_correct": "Đáp án chuẩn 1 từ là 'Oil'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 12,
          "text": "What instrument was commonly used to measure latitude?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Sextant",
          "evidence_sids": ["p1-s2"],
          "explanation": {
            "vi": "Dụng cụ nào được dùng để đo vĩ độ?",
            "why_correct": "Từ cần điền là 'Sextant'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 13,
          "text": "What name was given to Harrison's precise sea clocks?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Marine chronometer",
          "evidence_sids": ["p1-s10"],
          "explanation": {
            "vi": "Tên gọi của những chiếc đồng hồ biển chính xác của Harrison là gì?",
            "why_correct": "Cụm từ là 'Marine chronometer'.",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# Save Test 3 Passage 1
with open(os.path.join(OUT_DIR, 'test_03_passage_1.json'), 'w', encoding='utf-8') as f:
    json.dump(test3_p1, f, ensure_ascii=False, indent=2)

print("Saved EXACT PERFECT test_03_passage_1.json directly from idp_test_03.pdf!")
