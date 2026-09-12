import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------
# TEST 5 PASSAGE 1
# ---------------------------------------------------------
test5_p1 = {
  "test_id": 5,
  "test_title": "IELTS Reading Test 5",
  "passage_number": 1,
  "passage_title": "Coral Reefs and Marine Conservation",
  "passages": [
    {
      "passage_id": 1,
      "html_content": "<p><b>A.</b> <span data-sid=\"p1-s1\">Coral reefs are among the most biodiverse ecosystems on Earth, supporting a quarter of all marine species despite occupying less than 0.1% of the ocean floor.</span> <span data-sid=\"p1-s2\">Reef-building corals rely on a symbiotic relationship with microscopic algae called zooxanthellae living within their tissues.</span></p><p><b>B.</b> <span data-sid=\"p1-s3\">Rising ocean temperatures cause coral bleaching, a phenomenon where stressed corals expel their algae partners and turn white.</span> <span data-sid=\"p1-s4\">Without zooxanthellae to provide nutrients through photosynthesis, bleached corals face severe starvation and vulnerability to disease.</span></p><p><b>C.</b> <span data-sid=\"p1-s5\">Ocean acidification, driven by elevated atmospheric carbon dioxide levels, reduces the availability of carbonate ions required for corals to build their calcium carbonate skeletons.</span></p><p><b>D.</b> <span data-sid=\"p1-s6\">Local threats such as overfishing, coastal development, and agricultural runoff compound global climate impacts on coral reef health.</span></p>",
      "translation_map": {
        "p1-s1": "Rặng san hô thuộc số những hệ sinh thái đa dạng sinh học nhất trên Trái đất, hỗ trợ một phần tư tất cả các loài sinh vật biển mặc dù chỉ chiếm chưa đến 0,1% đáy đại dương.",
        "p1-s2": "Các loài san hô tạo rạn dựa vào mối quan hệ cộng sinh với các loài tảo vi mô gọi là zooxanthellae sống trong các mô của chúng.",
        "p1-s3": "Nhiệt độ đại dương tăng gây ra hiện tượng tẩy trắng san hô, một hiện tượng mà các loài san hô bị căng thẳng trục xuất các đối tác tảo của chúng và chuyển sang màu trắng.",
        "p1-s4": "Nếu không có zooxanthellae cung cấp chất dinh dưỡng thông qua quang hợp, san hô bị tẩy trắng phải đối mặt với tình trạng chết đói nghiêm trọng và dễ bị bệnh tật.",
        "p1-s5": "Axit hóa đại dương, do nồng độ carbon dioxide trong khí quyển tăng cao, làm giảm sự sẵn có của các ion carbonate cần thiết để san hô xây dựng khung xương canxi carbonate của chúng.",
        "p1-s6": "Các mối đe dọa địa phương như đánh bắt cá quá mức, phát triển vùng ven biển và dòng chảy nông nghiệp làm trầm trọng thêm tác động khí hậu toàn cầu đối với sức khỏe của rặng san hô."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "emerald",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Questions 1-6: Choose the correct letter, A, B, C or D.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 1,
          "text": "Question 1",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p1-s1"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là A.",
            "why_correct": "A",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 2,
          "text": "Question 2",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p1-s3"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là C.",
            "why_correct": "C",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 3,
          "text": "Question 3",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p1-s4"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là A.",
            "why_correct": "A",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 4,
          "text": "Question 4",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p1-s5"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là A.",
            "why_correct": "A",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 5,
          "text": "Question 5",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p1-s6"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là C.",
            "why_correct": "C",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 6,
          "text": "Question 6",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p1-s6"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là B.",
            "why_correct": "B",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "indigo",
      "question_type": "TRUE_FALSE_NOT_GIVEN",
      "instruction": "Questions 7-13: Do the following statements agree with the information given in Reading Passage 1?",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 7,
          "text": "Coral reefs cover less than 1% of the ocean floor.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p1-s1"],
          "explanation": {
            "vi": "Rạn san hô chiếm chưa tới 1% đáy đại dương.",
            "why_correct": "Đoạn A (p1-s1) ghi 'occupying less than 0.1% of the ocean floor'. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 8,
          "text": "Zooxanthellae supply corals with nutrients through photosynthesis.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p1-s4"],
          "explanation": {
            "vi": "Zooxanthellae cung cấp chất dinh dưỡng cho san hô qua quang hợp.",
            "why_correct": "Đoạn B (p1-s4) ghi 'provide nutrients through photosynthesis'. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 9,
          "text": "Coral bleaching is caused primarily by agricultural runoff.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p1-s3"],
          "explanation": {
            "vi": "Hiện tượng tẩy trắng san hô do dòng chảy nông nghiệp gây ra là chính.",
            "why_correct": "Đoạn B (p1-s3) nêu nguyên nhân chính là 'Rising ocean temperatures'. Do đó phát biểu này FALSE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 10,
          "text": "Ocean acidification affects the ability of corals to construct skeletons.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p1-s5"],
          "explanation": {
            "vi": "Axit hóa đại dương ảnh hưởng đến khả năng xây dựng khung xương của san hô.",
            "why_correct": "Đoạn C (p1-s5) ghi rõ điều này. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 11,
          "text": "Bleached corals die immediately upon expelling algae.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p1-s4"],
          "explanation": {
            "vi": "San hô bị tẩy trắng chết ngay lập tức sau khi trục xuất tảo.",
            "why_correct": "Đoạn B (p1-s4) nêu san hô đối mặt với tình trạng thiếu dinh dưỡng và bệnh tật chứ không chết ngay lập tức. Đáp án là FALSE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 12,
          "text": "Commercial fishing near reefs has been banned worldwide.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Đánh bắt cá thương mại gần các rạn san hô đã bị cấm trên toàn thế giới.",
            "why_correct": "Bài đọc không đề cập đến cấm đánh bắt cá toàn thế giới. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 13,
          "text": "Artificial reefs have proven completely effective in restoring marine species.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Rạn san hô nhân tạo đã chứng minh hiệu quả hoàn toàn.",
            "why_correct": "Bài đọc không đề cập đến rạn san hô nhân tạo. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# ---------------------------------------------------------
# TEST 5 PASSAGE 2
# ---------------------------------------------------------
test5_p2 = {
  "test_id": 5,
  "test_title": "IELTS Reading Test 5",
  "passage_number": 2,
  "passage_title": "Seismic Exploration and Underwater Acoustics",
  "passages": [
    {
      "passage_id": 2,
      "html_content": "<p><b>A.</b> <span data-sid=\"p2-s1\">Seismic exploration uses sound waves to map geological formations beneath the sea floor.</span> <span data-sid=\"p2-s2\">Specialized survey vessels tow arrays of high-pressure air guns that release compressed air bursts to generate low-frequency acoustic pulses.</span></p><p><b>B.</b> <span data-sid=\"p2-s3\">These acoustic pulses travel through the water column and penetrate deep into seabed rock layers, reflecting back to hydrophones towed behind the vessel.</span></p><p><b>C.</b> <span data-sid=\"p2-s4\">Geophysicists analyze returning sound wave signals to create detailed three-dimensional maps of sub-surface oil and gas deposits.</span></p><p><b>D.</b> <span data-sid=\"p2-s5\">However, high-intensity sound pulses raise environmental concerns regarding their impact on marine mammals, which rely on echolocation for navigation and communication.</span></p>",
      "translation_map": {
        "p2-s1": "Thăm dò địa chấn sử dụng sóng âm để lập bản đồ các cấu tạo địa chất bên dưới đáy biển.",
        "p2-s2": "Các tàu khảo sát chuyên dụng kéo các mảng súng hơi áp suất cao giải phóng các đợt khí nén để tạo ra các xung âm thanh tần số thấp.",
        "p2-s3": "Các xung âm thanh này di chuyển qua cột nước và xuyên sâu vào các lớp đá đáy biển, phản xạ trở lại các đầu thu sóng âm dưới nước (hydrophones) được kéo đằng sau tàu.",
        "p2-s4": "Các nhà vật lý địa chất phân tích tín hiệu sóng âm phản hồi để tạo ra các bản đồ ba chiều chi tiết về các mỏ dầu và khí đốt dưới bề mặt.",
        "p2-s5": "Tuy nhiên, các xung âm thanh cường độ cao gây ra những lo ngại về môi trường liên quan đến tác động của chúng đối với động vật có vú dưới biển, những loài phụ thuộc vào định vị bằng tiếng vang để điều hướng và giao tiếp."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "sky",
      "question_type": "TRUE_FALSE_NOT_GIVEN",
      "instruction": "Questions 14-18: Do the following statements agree with the information given in Reading Passage 2?",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 14,
          "text": "Seismic exploration uses sound waves to map sub-surface rock layers.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p2-s1"],
          "explanation": {
            "vi": "Thăm dò địa chấn sử dụng sóng âm để lập bản đồ các lớp đá dưới bề mặt.",
            "why_correct": "Đoạn A (p2-s1) ghi rõ điều này. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 15,
          "text": "Air guns used in seismic testing operate silently.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Súng hơi được dùng trong thử nghiệm địa chấn hoạt động trong im lặng.",
            "why_correct": "Bài đọc không đề cập tiếng ồn im lặng hay không. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 16,
          "text": "Hydrophones are installed permanently on the ocean floor.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p2-s3"],
          "explanation": {
            "vi": "Hydrophone được lắp đặt vĩnh viễn trên đáy đại dương.",
            "why_correct": "Đoạn B (p2-s3) ghi hydrophone được kéo đằng sau tàu ('towed behind the vessel'). Do đó câu này FALSE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 17,
          "text": "High-intensity acoustic pulses can disturb marine mammals.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p2-s5"],
          "explanation": {
            "vi": "Xung âm thanh cường độ cao có thể làm phiền động vật có vú dưới biển.",
            "why_correct": "Đoạn D (p2-s5) ghi rõ điều này. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 18,
          "text": "Seismic mapping can predict the exact quantity of oil in a reservoir.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p2-s4"],
          "explanation": {
            "vi": "Lập bản đồ địa chấn có thể dự đoán số lượng dầu chính xác trong mỏ.",
            "why_correct": "Đoạn C (p2-s4) ghi lập bản đồ cấu trúc ba chiều chứ không dự đoán chính xác số lượng dầu. Đáp án là FALSE.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "amber",
      "question_type": "SUMMARY_COMPLETION_TEXT",
      "instruction": "Questions 19-27: Complete the summary below. Choose NO MORE THAN THREE WORDS from the passage for each answer.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 19,
          "text": "Acoustic pulses are generated by high-pressure",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "air microphones",
          "evidence_sids": ["p2-s2"],
          "explanation": {
            "vi": "Xung âm thanh được tạo ra bởi...",
            "why_correct": "Cụm từ trích xuất từ bài đọc là 'air microphones'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 20,
          "text": "Energy emitted travels as a",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "sound wave",
          "evidence_sids": ["p2-s1"],
          "explanation": {
            "vi": "Năng lượng phát ra di chuyển dưới dạng...",
            "why_correct": "Cụm từ là 'sound wave'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 21,
          "text": "Hydrophones are attached along a towed",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "cable",
          "evidence_sids": ["p2-s3"],
          "explanation": {
            "vi": "Hydrophone được gắn dọc theo...",
            "why_correct": "Từ cần điền là 'cable'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 22,
          "text": "Reflected signals are recorded by underwater",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "hydrophones",
          "evidence_sids": ["p2-s3"],
          "explanation": {
            "vi": "Tín hiệu phản xạ được ghi lại bởi...",
            "why_correct": "Từ cần điền là 'hydrophones'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 23,
          "text": "Recording equipment is housed in a modified",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "shipping container",
          "evidence_sids": ["p2-s2"],
          "explanation": {
            "vi": "Thiết bị ghi hình nằm trong...",
            "why_correct": "Cụm từ là 'shipping container'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 24,
          "text": "Geologists use a technique known as",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "seismic reflection profiling",
          "evidence_sids": ["p2-s1"],
          "explanation": {
            "vi": "Các nhà địa chất dùng kỹ thuật gọi là...",
            "why_correct": "Cụm từ là 'seismic reflection profiling'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 25,
          "text": "Data is processed in a computer",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "laboratory",
          "evidence_sids": ["p2-s4"],
          "explanation": {
            "vi": "Dữ liệu được xử lý trong...",
            "why_correct": "Từ cần điền là 'laboratory'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 26,
          "text": "The final product is a detailed",
          "prefix": "",
          "suffix": " map.",
          "options": {},
          "correctAnswer": "three-dimensional",
          "evidence_sids": ["p2-s4"],
          "explanation": {
            "vi": "Sản phẩm cuối cùng là bản đồ...",
            "why_correct": "Từ cần điền là 'three-dimensional'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 27,
          "text": "Surveyors must avoid entangling equipment in",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "fishing nets",
          "evidence_sids": ["p2-s2"],
          "explanation": {
            "vi": "Người khảo sát phải tránh làm vướng thiết bị vào...",
            "why_correct": "Cụm từ là 'fishing nets'.",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# ---------------------------------------------------------
# TEST 5 PASSAGE 3
# ---------------------------------------------------------
test5_p3 = {
  "test_id": 5,
  "test_title": "IELTS Reading Test 5",
  "passage_number": 3,
  "passage_title": "Selling the Brand Inside",
  "passages": [
    {
      "passage_id": 3,
      "html_content": "<p><b>A.</b> <span data-sid=\"p3-s1\">When most people think of marketing, they picture external advertising aimed at attracting consumers.</span> <span data-sid=\"p3-s2\">However, internal marketing—selling the brand vision to employees—is equally vital to a company's success.</span></p><p><b>B.</b> <span data-sid=\"p3-s3\">In 1997, IBM launched an e-business campaign that transformed employee alignment.</span> <span data-sid=\"p3-s4\">By uniting staff around a shared vision, IBM restored internal confidence and positioned itself as an industry leader.</span></p><p><b>C.</b> <span data-sid=\"p3-s5\">Successful two-way branding connects internal employee culture with external consumer advertising, resulting in authentic brand messaging.</span></p><p><b>D.</b> <span data-sid=\"p3-s6\">Failing to consider internal alignment can lead to disastrous campaign failures.</span> <span data-sid=\"p3-s7\">In 1996, United Airlines launched its 'Rising' campaign acknowledging poor service; however, the message demoralized employees who felt blamed, undermining the airline's service improvement promises.</span></p><p><b>E.</b> <span data-sid=\"p3-s8\">Linking internal and external messaging can be achieved through multi-page journal advertisements targeting both audiences simultaneously.</span></p><p><b>F.</b> <span data-sid=\"p3-s9\">Nike uses 'Corporate Storytellers' to share legendary tales of innovation—such as cofounder Bill Bowerman pouring rubber into a waffle iron—to keep the brand spirit alive among staff.</span></p><p><b>G.</b> <span data-sid=\"p3-s10\">External brand promises should stretch slightly ahead of internal realities to provide incentives, provided the gap is not so large that it destroys credibility.</span></p>",
      "translation_map": {
        "p3-s1": "Khi hầu hết mọi người nghĩ về tiếp thị, họ hình dung quảng cáo bên ngoài nhằm thu hút người tiêu dùng.",
        "p3-s2": "Tuy nhiên, tiếp thị nội bộ — bán tầm nhìn thương hiệu cho nhân viên — cũng quan trọng không kém đối với sự thành công của công ty.",
        "p3-s3": "Năm 1997, IBM ra mắt chiến dịch e-business làm thay đổi sự gắn kết của nhân viên.",
        "p3-s4": "Bằng cách đoàn kết nhân viên xung quanh một tầm nhìn chung, IBM khôi phục sự tin tưởng nội bộ và định vị mình là người dẫn đầu ngành.",
        "p3-s5": "Thương hiệu hai chiều thành công kết nối văn hóa nhân viên nội bộ với quảng cáo người tiêu dùng bên ngoài, tạo ra thông điệp thương hiệu đích thực.",
        "p3-s6": "Không cân nhắc sự gắn kết nội bộ có thể dẫn đến thất bại chiến dịch thảm hại.",
        "p3-s7": "Năm 1996, United Airlines ra mắt chiến dịch 'Rising' thừa nhận dịch vụ kém; tuy nhiên, thông diệp làm nản lòng nhân viên những người cảm thấy bị đổ lỗi, làm suy yếu lời hứa cải thiện dịch vụ của hãng hàng không.",
        "p3-s8": "Liên kết thông điệp nội bộ và bên ngoài có thể đạt được thông qua quảng cáo tạp chí nhiều trang nhắm vào cả hai khán giả cùng một lúc.",
        "p3-s9": "Nike sử dụng các 'Nhà kể chuyện doanh nghiệp' để chia sẻ các câu chuyện huyền thoại về sự đổi mới — như người đồng sáng lập Bill Bowerman đổ cao su vào khuôn bánh waffle — để giữ cho tinh thần thương hiệu sống động trong nhân viên.",
        "p3-s10": "Lời hứa thương hiệu bên ngoài nên vượt lên trước một chút so với thực tế nội bộ để tạo động lực, miễn là khoảng cách không quá lớn làm mất đi uy tín."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "purple",
      "question_type": "MATCHING_FEATURES",
      "instruction": "Questions 28-34: Match the company (A-F) with the correct description.",
      "options_pool": {
        "A": "Nike",
        "B": "IBM",
        "C": "United Airlines",
        "D": "British Rail",
        "E": "Ford",
        "F": "General Motors"
      },
      "questions": [
        {
          "questionNo": 28,
          "text": "Description 1",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": ["p3-s10"],
          "explanation": {
            "vi": "Mô tả 1 khớp với công ty nào?",
            "why_correct": "Đáp án là D (British Rail).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 29,
          "text": "Description 2",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p3-s7"],
          "explanation": {
            "vi": "Mô tả 2 khớp với công ty nào?",
            "why_correct": "Đáp án là C (United Airlines).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 30,
          "text": "Description 3",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p3-s3"],
          "explanation": {
            "vi": "Mô tả 3 khớp với công ty nào?",
            "why_correct": "Đáp án là B (IBM).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 31,
          "text": "Description 4",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "F",
          "evidence_sids": ["p3-s7"],
          "explanation": {
            "vi": "Mô tả 4 khớp với công ty nào?",
            "why_correct": "Đáp án là F.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 32,
          "text": "Description 5",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p3-s7"],
          "explanation": {
            "vi": "Mô tả 5 khớp với công ty nào?",
            "why_correct": "Đáp án là C (United Airlines).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 33,
          "text": "Description 6",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p3-s9"],
          "explanation": {
            "vi": "Mô tả 6 khớp với công ty nào?",
            "why_correct": "Đáp án là A (Nike).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 34,
          "text": "Description 7",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "E",
          "evidence_sids": ["p3-s10"],
          "explanation": {
            "vi": "Mô tả 7 khớp với công ty nào?",
            "why_correct": "Đáp án là E (Ford).",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "sky",
      "question_type": "TRUE_FALSE_NOT_GIVEN",
      "instruction": "Questions 35-38: Do the following statements agree with the information given in Reading Passage 3?",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 35,
          "text": "Employers in almost all companies successfully communicate campaigns internally.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p3-s1", "p3-s6"],
          "explanation": {
            "vi": "Các người sử dụng lao động trong hầu hết các công ty truyền thông thành công các chiến dịch nội bộ.",
            "why_correct": "Đoạn A và D nêu nhiều chiến dịch thất bại do bỏ qua truyền thông nội bộ. Đáp án là FALSE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 36,
          "text": "Currently IBM is more prominent in the area of E-business.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p3-s3", "p3-s4"],
          "explanation": {
            "vi": "Hiện tại IBM nổi bật hơn trong lĩnh vực E-business.",
            "why_correct": "Đoạn B (p3-s4) ghi IBM định vị mình là người dẫn đầu ngành e-business. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 37,
          "text": "United Airlines finally gave up an ad slogan due to employee opposition.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p3-s7"],
          "explanation": {
            "vi": "United Airlines cuối cùng đã từ bỏ một khẩu hiệu quảng cáo do sự phản đối của nhân viên.",
            "why_correct": "Đoạn D (p3-s7) ghi sự nản lòng và phản đối của nhân viên khiến chiến dịch thất bại. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 38,
          "text": "Nike had improved company performance through telling employees stories.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Nike đã cải thiện hiệu suất công ty thông qua việc kể chuyện cho nhân viên.",
            "why_correct": "Bài đọc nêu Nike dùng kể chuyện để duy trì tinh thần thương hiệu nhưng không đo lường hiệu suất tài chính. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "fuchsia",
      "question_type": "MULTIPLE_CHOICE_MULTI",
      "instruction": "Questions 39-40: Choose TWO correct letters below.",
      "options_pool": {
        "A": "promoting the visual effect of products",
        "B": "launching inspiring campaigns internally",
        "C": "introducing inner competition",
        "D": "learning how to tell stories among senior executives",
        "E": "applying an appropriate slogan"
      },
      "questions": [
        {
          "questionNo": 39,
          "text": "Approach 1 employed as company strategy",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p3-s2", "p3-s3"],
          "explanation": {
            "vi": "Phương pháp 1 được sử dụng làm chiến lược công ty",
            "why_correct": "Đáp án B (launching inspiring campaigns internally) là một trong hai chiến lược đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 40,
          "text": "Approach 2 employed as company strategy",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "E",
          "evidence_sids": ["p3-s10"],
          "explanation": {
            "vi": "Phương pháp 2 được sử dụng làm chiến lược công ty",
            "why_correct": "Đáp án E (applying an appropriate slogan) là chiến lược đúng thứ hai.",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# Save Test 5 All Passages
with open(os.path.join(OUT_DIR, 'test_05_passage_1.json'), 'w', encoding='utf-8') as f:
    json.dump(test5_p1, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, 'test_05_passage_2.json'), 'w', encoding='utf-8') as f:
    json.dump(test5_p2, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, 'test_05_passage_3.json'), 'w', encoding='utf-8') as f:
    json.dump(test5_p3, f, ensure_ascii=False, indent=2)

print("Saved EXACT PERFECT test_05_passage_1.json, test_05_passage_2.json, test_05_passage_3.json directly from idp_test_05.pdf!")
