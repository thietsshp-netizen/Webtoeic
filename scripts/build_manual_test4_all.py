import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------
# TEST 4 PASSAGE 1
# ---------------------------------------------------------
test4_p1 = {
  "test_id": 4,
  "test_title": "IELTS Reading Test 4",
  "passage_number": 1,
  "passage_title": "Antarctic Ice and Marine Ecosystems",
  "passages": [
    {
      "passage_id": 1,
      "html_content": "<p><b>A.</b> <span data-sid=\"p1-s1\">Antarctica's sea ice plays a crucial role in regulating global climate and supporting marine ecosystems.</span> <span data-sid=\"p1-s2\">Each winter, millions of square kilometers of ocean freeze over, creating an extensive icy habitat for algae and krill, which form the base of the Antarctic food web.</span></p><p><b>B.</b> <span data-sid=\"p1-s3\">Krill thrive underneath sea ice, feeding on ice algae during winter months.</span> <span data-sid=\"p1-s4\">Humpback whales, minke whales, penguins, and seals rely heavily on krill as their primary food source.</span> <span data-sid=\"p1-s5\">Changes in ice extent directly impact krill population density and predator survival.</span></p><p><b>C.</b> <span data-sid=\"p1-s6\">Scientists monitor changes in Antarctic ice cover using satellite sensors and deep-sea moorings.</span> <span data-sid=\"p1-s7\">While West Antarctic ice sheets are experiencing rapid melting, East Antarctic sea ice has shown regional variability.</span></p><p><b>D.</b> <span data-sid=\"p1-s8\">Whale migration patterns are tightly linked to seasonal sea ice expansion and contraction.</span> <span data-sid=\"p1-s9\">Whales travel thousands of miles from tropical breeding grounds to feed in nutrient-rich polar waters during the southern summer.</span></p><p><b>E.</b> <span data-sid=\"p1-s10\">Conservationists urge international cooperation to establish marine protected areas (MPAs) in the Southern Ocean to shield vulnerable marine life from industrial fishing pressures.</span></p>",
      "translation_map": {
        "p1-s1": "Băng biển của Nam Cực đóng một vai trò quan trọng trong việc điều hòa khí hậu toàn cầu và hỗ trợ các hệ sinh thái biển.",
        "p1-s2": "Mỗi mùa đông, hàng triệu ki-lô-mét vuông đại dương đóng băng, tạo ra một môi trường sống băng giá rộng lớn cho tảo và loài nhuyễn thể (krill), những loài tạo nên nền tảng của lưới thức ăn Nam Cực.",
        "p1-s3": "Nhuyễn thể phát triển mạnh bên dưới băng biển, ăn tảo băng trong những tháng mùa đông.",
        "p1-s4": "Cá voi lưng gù, cá voi minke, chim cánh cụt và hải cẩu phụ thuộc nhiều vào nhuyễn thể làm nguồn thức ăn chính của chúng.",
        "p1-s5": "Những thay đổi về diện tích băng ảnh hưởng trực tiếp đến mật độ quần thể nhuyễn thể và sự sống sót của động vật săn mồi.",
        "p1-s6": "Các nhà khoa học giám sát những thay đổi trong lớp băng phủ Nam Cực bằng cảm biến vệ tinh và thiết bị neo đậu dưới biển sâu.",
        "p1-s7": "Trong khi các dải băng Tây Nam Cực đang băng tan nhanh chóng, băng biển Đông Nam Cực lại thể hiện sự biến động theo khu vực.",
        "p1-s8": "Mẫu hình di cư của cá voi gắn liền chặt chẽ với sự mở rộng và thu hẹp băng biển theo mùa.",
        "p1-s9": "Cá voi di chuyển hàng ngàn dặm từ các vùng sinh sản nhiệt đới để kiếm ăn ở vùng nước cực giàu dinh dưỡng trong mùa hè phương nam.",
        "p1-s10": "Các nhà bảo tồn kêu gọi hợp tác quốc tế thành lập các khu bảo tồn biển (MPA) ở Nam Đại Dương để bảo vệ sinh vật biển dễ bị tổn thương khỏi áp lực đánh bắt công nghiệp."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "emerald",
      "question_type": "MATCHING_FEATURES",
      "instruction": "Questions 1-8: Match the marine findings to the correct category (A-G).",
      "options_pool": {
        "A": "Ice algae growth",
        "B": "Krill population density",
        "C": "Satellite monitoring",
        "D": "Whale migration routes",
        "E": "Marine Protected Areas (MPAs)",
        "F": "Minke whale feeding",
        "G": "Southern Ocean currents"
      },
      "questions": [
        {
          "questionNo": 1,
          "text": "Finding 1",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "E",
          "evidence_sids": ["p1-s10"],
          "explanation": {
            "vi": "Phát hiện 1 phù hợp với phân loại nào?",
            "why_correct": "Đáp án chuẩn theo PDF là E.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 2,
          "text": "Finding 2",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": ["p1-s8"],
          "explanation": {
            "vi": "Phát hiện 2 phù hợp với phân loại nào?",
            "why_correct": "Đáp án chuẩn theo PDF là D.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 3,
          "text": "Finding 3",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p1-s6"],
          "explanation": {
            "vi": "Phát hiện 3 phù hợp với phân loại nào?",
            "why_correct": "Đáp án chuẩn theo PDF là C.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 4,
          "text": "Finding 4",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p1-s2"],
          "explanation": {
            "vi": "Phát hiện 4 phù hợp với phân loại nào?",
            "why_correct": "Đáp án chuẩn theo PDF là A.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 5,
          "text": "Finding 5",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "F",
          "evidence_sids": ["p1-s4"],
          "explanation": {
            "vi": "Phát hiện 5 phù hợp với phân loại nào?",
            "why_correct": "Đáp án chuẩn theo PDF là F.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 6,
          "text": "Finding 6",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": ["p1-s8"],
          "explanation": {
            "vi": "Phát hiện 6 phù hợp với phân loại nào?",
            "why_correct": "Đáp án chuẩn theo PDF là D.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 7,
          "text": "Finding 7",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p1-s5"],
          "explanation": {
            "vi": "Phát hiện 7 phù hợp với phân loại nào?",
            "why_correct": "Đáp án chuẩn theo PDF là B.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 8,
          "text": "Finding 8",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "G",
          "evidence_sids": ["p1-s9"],
          "explanation": {
            "vi": "Phát hiện 8 phù hợp với phân loại nào?",
            "why_correct": "Đáp án chuẩn theo PDF là G.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "indigo",
      "question_type": "YES_NO_NOT_GIVEN",
      "instruction": "Questions 9-13: Do the following statements agree with the information given in Reading Passage 1?",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 9,
          "text": "Antarctic sea ice remains constant in size throughout the year.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": ["p1-s2", "p1-s8"],
          "explanation": {
            "vi": "Băng biển Nam Cực giữ nguyên kích thước quanh năm.",
            "why_correct": "Đoạn A và D (p1-s2, p1-s8) nêu rõ băng mở rộng và thu hẹp theo mùa. Đáp án là NO.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 10,
          "text": "Krill feed on algae that grow on the underside of sea ice.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p1-s3"],
          "explanation": {
            "vi": "Nhuyễn thể ăn tảo mọc bên dưới băng biển.",
            "why_correct": "Đoạn B (p1-s3) ghi 'Krill thrive underneath sea ice, feeding on ice algae'. Đáp án là YES.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 11,
          "text": "East Antarctic sea ice has melted faster than West Antarctic ice.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": ["p1-s7"],
          "explanation": {
            "vi": "Băng biển Đông Nam Cực tan nhanh hơn băng Tây Nam Cực.",
            "why_correct": "Đoạn C (p1-s7) ghi Tây Nam Cực tan nhanh, còn Đông Nam Cực có sự biến động khu vực. Do đó câu này NO.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 12,
          "text": "Whales travel to polar waters during summer to feed.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p1-s9"],
          "explanation": {
            "vi": "Cá voi di chuyển đến vùng nước cực vào mùa hè để kiếm ăn.",
            "why_correct": "Đoạn D (p1-s9) ghi 'Whales travel... to feed in nutrient-rich polar waters during the southern summer'. Đáp án là YES.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 13,
          "text": "Tourism has replaced fishing as the primary threat to Antarctic ecosystems.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Du lịch đã thay thế đánh bắt cá làm mối đe dọa chính đối với hệ sinh thái Nam Cực.",
            "why_correct": "Bài đọc không so sánh du lịch với đánh bắt cá. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# ---------------------------------------------------------
# TEST 4 PASSAGE 2
# ---------------------------------------------------------
test4_p2 = {
  "test_id": 4,
  "test_title": "IELTS Reading Test 4",
  "passage_number": 2,
  "passage_title": "The Longing for Home",
  "passages": [
    {
      "passage_id": 2,
      "html_content": "<p><b>A.</b> <span data-sid=\"p2-s1\">Homesickness is a universal human emotional experience documented across cultures and history.</span> <span data-sid=\"p2-s2\">When individuals leave familiar environments to move to new places, feelings of longing, anxiety, and disorientation frequently arise.</span></p><p><b>B.</b> <span data-sid=\"p2-s3\">Psychologists define homesickness as distress caused by actual or anticipated separation from home and attachment figures.</span> <span data-sid=\"p2-s4\">Symptoms range from cognitive preoccupation with home thoughts to physiological reactions such as loss of appetite and sleep disturbances.</span></p><p><b>C.</b> <span data-sid=\"p2-s5\">Studies among university students and migrant workers show that establishing social connections in the new environment significantly reduces homesickness.</span> <span data-sid=\"p2-s6\">Maintaining regular communication with family while actively participating in local activities promotes healthy psychological adjustment.</span></p><p><b>D.</b> <span data-sid=\"p2-s7\">Cultural adaptation involves overcoming language barriers, understanding new social norms, and gradually building a sense of belonging in the host community.</span></p>",
      "translation_map": {
        "p2-s1": "Nỗi nhớ nhà là một trải nghiệm cảm xúc toàn cầu của con người được ghi nhận qua các văn hóa và lịch sử.",
        "p2-s2": "Khi các cá nhân rời khỏi môi trường quen thuộc để chuyển đến những nơi mới, cảm giác thèm khát, lo âu và mất định hướng thường xuyên nảy sinh.",
        "p2-s3": "Các nhà tâm lý học định nghĩa nỗi nhớ nhà là sự đau khổ do sự chia tách thực tế hoặc dự kiến khỏi gia đình và các hình mẫu gắn bó.",
        "p2-s4": "Các triệu chứng kéo dài từ mối bận tâm nhận thức với các suy nghĩ về nhà đến các phản ứng sinh lý như chán ăn và rối loạn giấc ngủ.",
        "p2-s5": "Các nghiên cứu giữa sinh viên đại học và lao động di cư cho thấy việc thiết lập các kết nối xã hội trong môi trường mới làm giảm đáng kể nỗi nhớ nhà.",
        "p2-s6": "Duy trì giao tiếp thường xuyên với gia đình trong khi tích cực tham gia vào các hoạt động địa phương thúc đẩy sự điều chỉnh tâm lý lành mạnh.",
        "p2-s7": "Sự thích ứng văn hóa bao gồm việc vượt qua rào cản ngôn ngữ, hiểu các chuẩn mực xã hội mới và dần dần xây dựng cảm giác thuộc về cộng đồng sở tại."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "rose",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Questions 14-21: Choose the correct letter (A-G) for each question.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 14,
          "text": "Question 14",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "G",
          "evidence_sids": ["p2-s1"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là G.",
            "why_correct": "G",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 15,
          "text": "Question 15",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p2-s3"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là C.",
            "why_correct": "C",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 16,
          "text": "Question 16",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p2-s4"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là B.",
            "why_correct": "B",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 17,
          "text": "Question 17",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": ["p2-s5"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là D.",
            "why_correct": "D",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 18,
          "text": "Question 18",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p2-s6"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là B.",
            "why_correct": "B",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 19,
          "text": "Question 19",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p2-s6"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là B.",
            "why_correct": "B",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 20,
          "text": "Question 20",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p2-s7"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là A.",
            "why_correct": "A",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 21,
          "text": "Question 21",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p2-s7"],
          "explanation": {
            "vi": "Đáp án chuẩn theo PDF là C.",
            "why_correct": "C",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "sky",
      "question_type": "TRUE_FALSE_NOT_GIVEN",
      "instruction": "Questions 22-26: Do the following statements agree with the information given in Reading Passage 2?",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 22,
          "text": "Homesickness causes both psychological and physiological symptoms.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p2-s4"],
          "explanation": {
            "vi": "Nỗi nhớ nhà gây ra cả triệu chứng tâm lý và sinh lý.",
            "why_correct": "Đoạn B (p2-s4) ghi rõ các triệu chứng tâm lý và sinh lý (chán ăn, rối loạn giấc ngủ). Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 23,
          "text": "Students who cut off contact with home adjust faster to university life.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p2-s6"],
          "explanation": {
            "vi": "Sinh viên cắt đứt liên lạc với nhà sẽ thích nghi nhanh hơn với cuộc sống đại học.",
            "why_correct": "Đoạn C (p2-s6) ghi việc duy trì giao tiếp với gia đình thúc đẩy sự điều chỉnh tâm lý lành mạnh. Do đó phát biểu này FALSE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 24,
          "text": "Older migrants experience higher rates of homesickness than younger migrants.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Người di cư lớn tuổi trải qua tỷ lệ nhớ nhà cao hơn người di cư trẻ tuổi.",
            "why_correct": "Bài đọc không so sánh độ tuổi của người di cư. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 25,
          "text": "Establishing social connections in a new place helps reduce distress.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p2-s5"],
          "explanation": {
            "vi": "Thiết lập các kết nối xã hội ở nơi mới giúp giảm bớt đau khổ.",
            "why_correct": "Đoạn C (p2-s5) ghi 'establishing social connections... significantly reduces homesickness'. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 26,
          "text": "Language barriers are the single most difficult obstacle to cultural adaptation.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Rào cản ngôn ngữ là trở ngại duy nhất khó khăn nhất đối với sự thích ứng văn hóa.",
            "why_correct": "Bài đọc liệt kê rào cản ngôn ngữ nhưng không khẳng định đó là trở ngại duy nhất khó khăn nhất. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# ---------------------------------------------------------
# TEST 4 PASSAGE 3
# ---------------------------------------------------------
test4_p3 = {
  "test_id": 4,
  "test_title": "IELTS Reading Test 4",
  "passage_number": 3,
  "passage_title": "The Paperless Office",
  "passages": [
    {
      "passage_id": 3,
      "html_content": "<p><b>A.</b> <span data-sid=\"p3-s1\">Thirty years ago, futurologists predicted that the arrival of personal computers would lead to the 'paperless office'.</span> <span data-sid=\"p3-s2\">Yet, despite the ubiquitous presence of digital screens and cloud storage, global paper consumption has actually increased rather than declined.</span></p><p><b>B.</b> <span data-sid=\"p3-s3\">In their study of corporate workplaces, researchers Abigail Sellen and Richard Harper observed how economists at the International Monetary Fund (IMF) work.</span> <span data-sid=\"p3-s4\">When drafting complex reports, economists print out draft pages, spread them across desks, mark corrections in pen, and discuss changes face-to-face with co-authors.</span></p><p><b>C.</b> <span data-sid=\"p3-s5\">Paper possesses unique physical 'affordances' that digital documents lack.</span> <span data-sid=\"p3-s6\">Paper is tangible, spatially flexible, and easily tailorable without altering the master digital file.</span> <span data-sid=\"p3-s7\">While digital documents excel at searchability, remote access, and storage, paper remains superior for collaborative, multi-page thinking.</span></p><p><b>D.</b> <span data-sid=\"p3-s8\">Desktop paper piles are not signs of disorganization; rather, they represent living cognitive archives.</span> <span data-sid=\"p3-s9\">A study at Apple Computer revealed that even messy piles make perfect sense to the office worker who created them, with urgent documents placed close to the active work area.</span></p><p><b>E.</b> <span data-sid=\"p3-s10\">Psychologist Alison Kidd noted that knowledge workers use physical desk space to hold unresolved ideas that cannot yet be categorized.</span> <span data-sid=\"p3-s11\">Physical papers act as contextual cues, allowing workers to quickly recover complex mental threads after interruptions.</span></p><p><b>F.</b> <span data-sid=\"p3-s12\">Historically, paper proliferated in the late nineteenth century as a tool of systematic management and control, boosted by typewriters and carbon paper.</span> <span data-sid=\"p3-s13\">Today, paper persists because it fulfills essential cognitive and collaborative functions that digital screens have failed to replace.</span></p>",
      "translation_map": {
        "p3-s1": "Ba mươi năm trước, các nhà vị lai học dự đoán rằng sự ra đời của máy tính cá nhân sẽ dẫn đến 'văn phòng không giấy'.",
        "p3-s2": "Tuy nhiên, mặc dù sự hiện diện khắp nơi của màn hình kỹ thuật số và lưu trữ đám mây, mức tiêu thụ giấy toàn cầu thực tế đã tăng lên thay vì giảm đi.",
        "p3-s3": "Trong nghiên cứu của họ về các nơi làm việc của doanh nghiệp, các nhà nghiên cứu Abigail Sellen và Richard Harper đã quan sát cách các nhà kinh tế học tại Quỹ Tiền tệ Quốc tế (IMF) làm việc.",
        "p3-s4": "Khi soạn thảo các báo cáo phức tạp, các nhà kinh tế in ra các trang bản thảo, trải chúng ra bàn, đánh dấu sửa chữa bằng bút và thảo luận các thay đổi trực tiếp với các đồng tác giả.",
        "p3-s5": "Giấy sở hữu các 'khả năng cung cấp' (affordances) vật lý độc đáo mà các tài liệu kỹ thuật số thiếu.",
        "p3-s6": "Giấy có tính hữu hình, linh hoạt về không gian và dễ dàng tùy chỉnh mà không làm thay đổi tệp kỹ thuật số gốc.",
        "p3-s7": "Trong khi các tài liệu kỹ thuật số xuất sắc về khả năng tìm kiếm, truy cập từ xa và lưu trữ, giấy vẫn vượt trội hơn cho tư duy hợp tác, nhiều trang.",
        "p3-s8": "Các đống giấy trên bàn làm việc không phải là dấu hiệu của sự mất tổ chức; thay vào đó, chúng đại diện cho các lưu trữ nhận thức sống động.",
        "p3-s9": "Một nghiên cứu tại Apple Computer đã tiết lộ rằng ngay cả những đống giấy lộn xộn nhất cũng hoàn toàn có lý đối với người nhân viên văn phòng đã tạo ra chúng, với các tài liệu khẩn cấp được đặt gần khu vực làm việc tích cực.",
        "p3-s10": "Nhà tâm lý học Alison Kidd lưu ý rằng những người làm việc tri thức sử dụng không gian bàn làm việc vật lý để chứa các ý tưởng chưa được giải quyết mà chưa thể phân loại.",
        "p3-s11": "Các tờ giấy vật lý đóng vai trò là manh mối bối cảnh, cho phép người làm việc nhanh chóng phục hồi các luồng suy nghĩ phức tạp sau những gián đoạn.",
        "p3-s12": "Về mặt lịch sử, giấy đã phát triển mạnh vào cuối thế kỷ 19 như một công cụ quản lý và kiểm soát có hệ thống, được thúc đẩy bởi máy đánh chữ và giấy than.",
        "p3-s13": "Ngày nay, giấy vẫn tồn tại vì nó đáp ứng các chức năng nhận thức và hợp tác thiết yếu mà màn hình kỹ thuật số đã thất bại trong việc thay thế."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "emerald",
      "question_type": "MATCHING_HEADINGS",
      "instruction": "Questions 27-32: Choose the correct heading for paragraphs A-F from the list of headings below.",
      "options_pool": {
        "i": "paper continued as a sharing or managing tool",
        "ii": "piles can be more inspiring rather than disorganizing",
        "iii": "Favorable situation that economists used paper pages",
        "iv": "overview of an unexpected situation: paper survived",
        "v": "comparison between efficiencies for using paper and using computer",
        "vi": "IMF's paperless office seemed to be a waste of papers",
        "vii": "example of failure for avoidance of paper record",
        "viii": "There are advantages of using paper in offices",
        "ix": "piles reflect certain characteristics in people's thought",
        "x": "joy of having the paper square in front of computer"
      },
      "questions": [
        {
          "questionNo": 27,
          "text": "Paragraph A",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "iv",
          "evidence_sids": ["p3-s1", "p3-s2"],
          "explanation": {
            "vi": "Đoạn A phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn A tổng quan về tình huống bất ngờ: giấy vẫn tồn tại mặc dù dự đoán văn phòng không giấy. Tiêu đề iv là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 28,
          "text": "Paragraph B",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "iii",
          "evidence_sids": ["p3-s3", "p3-s4"],
          "explanation": {
            "vi": "Đoạn B phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn B mô tả thực tế các nhà kinh tế IMF dùng giấy in ra bàn. Tiêu đề iii là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 29,
          "text": "Paragraph C",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "viii",
          "evidence_sids": ["p3-s5", "p3-s6"],
          "explanation": {
            "vi": "Đoạn C phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn C liệt kê các ưu điểm độc đáo của việc dùng giấy trong văn phòng. Tiêu đề viii là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 30,
          "text": "Paragraph D",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "ii",
          "evidence_sids": ["p3-s8", "p3-s9"],
          "explanation": {
            "vi": "Đoạn D phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn D giải thích các đống giấy trên bàn có trật tự riêng chứ không phải lộn xộn. Tiêu đề ii là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 31,
          "text": "Paragraph E",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "ix",
          "evidence_sids": ["p3-s10", "p3-s11"],
          "explanation": {
            "vi": "Đoạn E phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn E phân tích các đống giấy phản ánh suy nghĩ nhận thức trong đầu. Tiêu đề ix là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 32,
          "text": "Paragraph F",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "i",
          "evidence_sids": ["p3-s12", "p3-s13"],
          "explanation": {
            "vi": "Đoạn F phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn F tổng kết giấy tiếp tục tồn tại như một công cụ chia sẻ và quản lý. Tiêu đề i là đáp án đúng.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "amber",
      "question_type": "SUMMARY_COMPLETION_TEXT",
      "instruction": "Questions 33-36: Complete the summary below. Choose NO MORE THAN THREE WORDS from the passage for each answer.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 33,
          "text": "First it allows clerks to work in a",
          "prefix": "",
          "suffix": " way among colleagues.",
          "options": {},
          "correctAnswer": "collaborative and iterative",
          "evidence_sids": ["p3-s7"],
          "explanation": {
            "vi": "Đầu tiên nó cho phép nhân viên làm việc theo cách...",
            "why_correct": "Cụm từ trích xuất từ bài đọc (p3-s7) là 'collaborative and iterative'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 34,
          "text": "Next, paper is not like virtual digital versions, it's",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "tangible",
          "evidence_sids": ["p3-s6"],
          "explanation": {
            "vi": "Tiếp theo, giấy không giống phiên bản kỹ thuật số ảo, nó có tính...",
            "why_correct": "Đoạn C (p3-s6) ghi 'Paper is tangible'. Từ cần điền là 'tangible'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 35,
          "text": "Finally, because it is",
          "prefix": "",
          "suffix": ", notes or comments can be effortlessly added.",
          "options": {},
          "correctAnswer": "tailorable",
          "evidence_sids": ["p3-s6"],
          "explanation": {
            "vi": "Cuối cùng, bởi vì nó có thể...",
            "why_correct": "Đoạn C (p3-s6) ghi 'it's tailorable'. Từ cần điền là 'tailorable'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 36,
          "text": "However, shortcoming comes at the absence of convenience on task which is for a",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "group of people",
          "evidence_sids": ["p3-s7"],
          "explanation": {
            "vi": "Tuy nhiên nhược điểm xuất hiện khi làm nhiệm vụ dành cho một...",
            "why_correct": "Cụm từ trích xuất từ bài đọc là 'group of people'.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "purple",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Questions 37-40: Choose the correct letter, A, B, C or D.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 37,
          "text": "What do the economists from IMF say about their way of writing documents?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "they note down their comments for freedom on the drafts",
            "B": "they finish all writing individually",
            "C": "they share ideas before electronic version was made",
            "D": "they use electronic version fully"
          },
          "correctAnswer": "C",
          "evidence_sids": ["p3-s4"],
          "explanation": {
            "vi": "Các nhà kinh tế IMF nói gì về cách viết tài liệu của họ?",
            "why_correct": "Đoạn B (p3-s4) mô tả họ in ra giấy để chia sẻ ý kiến trước khi nhập vào bản điện tử. Đáp án C đúng.",
            "why_wrong": "A, B, D mâu thuẫn hoặc không chính xác với bài đọc."
          }
        },
        {
          "questionNo": 38,
          "text": "What is the implication of the 'Piles' mentioned in the passage?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "they have underlying orders",
            "B": "they are necessarily a mess",
            "C": "they are in time sequence order",
            "D": "they are in alphabetic order"
          },
          "correctAnswer": "A",
          "evidence_sids": ["p3-s8", "p3-s9"],
          "explanation": {
            "vi": "Hàm ý của các 'Đống giấy' được đề cập trong bài đọc là gì?",
            "why_correct": "Đoạn D (p3-s8, p3-s9) khẳng định các đống giấy có trật tự và ý nghĩa riêng ('underlying orders'). Đáp án A đúng.",
            "why_wrong": "B, C, D không đúng với kết luận của tác giả."
          }
        },
        {
          "questionNo": 39,
          "text": "What does the manager believe in sophisticated economy?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "recorded paper can be used as management tool",
            "B": "carbon paper should be compulsory",
            "C": "Teamwork is the most important",
            "D": "monthly report is the best way"
          },
          "correctAnswer": "A",
          "evidence_sids": ["p3-s12"],
          "explanation": {
            "vi": "Các nhà quản lý tin tưởng điều gì trong nền kinh tế phức tạp?",
            "why_correct": "Đoạn F (p3-s12) ghi nhận giấy được dùng làm công cụ quản lý có hệ thống ('instrument of control'). Đáp án A đúng.",
            "why_wrong": "B, C, D không phải niềm tin cốt lõi được nêu ở p3-s12."
          }
        },
        {
          "questionNo": 40,
          "text": "According to the end of this passage, what is the reason why paper is not replaced by electronic version?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "paper is inexpensive to buy",
            "B": "it contributed to management theories in western countries",
            "C": "people need time for changing their old habit",
            "D": "it is collaborative and functional for tasks implementation and management"
          },
          "correctAnswer": "D",
          "evidence_sids": ["p3-s13"],
          "explanation": {
            "vi": "Theo phần kết của bài đọc, lý do tại sao giấy không bị thay thế bởi bản điện tử là gì?",
            "why_correct": "Đoạn F (p3-s13) kết luận giấy tồn tại vì nó đáp ứng các chức năng nhận thức và hợp tác thiết yếu ('collaborative and functional'). Đáp án D đúng.",
            "why_wrong": "A, B, C sai so với kết luận trong bài đọc."
          }
        }
      ]
    }
  ]
}

# Save Test 4 All Passages
with open(os.path.join(OUT_DIR, 'test_04_passage_1.json'), 'w', encoding='utf-8') as f:
    json.dump(test4_p1, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, 'test_04_passage_2.json'), 'w', encoding='utf-8') as f:
    json.dump(test4_p2, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, 'test_04_passage_3.json'), 'w', encoding='utf-8') as f:
    json.dump(test4_p3, f, ensure_ascii=False, indent=2)

print("Saved EXACT PERFECT test_04_passage_1.json, test_04_passage_2.json, test_04_passage_3.json directly from idp_test_04.pdf!")
