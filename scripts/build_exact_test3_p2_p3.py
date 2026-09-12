import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

# ---------------------------------------------------------
# TEST 3 PASSAGE 2
# ---------------------------------------------------------
test3_p2 = {
  "test_id": 3,
  "test_title": "IELTS Reading Test 3",
  "passage_number": 2,
  "passage_title": "The Need to Play",
  "passages": [
    {
      "passage_id": 2,
      "html_content": "<p><b>A.</b> <span data-sid=\"p2-s1\">Play is a vital aspect of childhood development across humans and many animal species.</span> <span data-sid=\"p2-s2\">Researchers studying animal behavior have long observed that young mammals spend significant amounts of energy engaging in play fighting, chasing, and object manipulation.</span></p><p><b>B.</b> <span data-sid=\"p2-s3\">Neuroscientists have found that play stimulates the production of brain-derived neurotrophic factor (BDNF), a protein essential for brain cell growth and neural plasticity.</span> <span data-sid=\"p2-s4\">Playful interactions literally shape the physical structure of the developing brain.</span></p><p><b>C.</b> <span data-sid=\"p2-s5\">Social play allows young individuals to learn social boundaries, practice emotional regulation, and develop empathy.</span> <span data-sid=\"p2-s6\">Depriving young animals of play opportunities results in social deficits and heightened stress responses in adulthood.</span></p><p><b>D.</b> <span data-sid=\"p2-s7\">In human children, free unstructured play fosters creativity, problem-solving skills, and executive function.</span> <span data-sid=\"p2-s8\">Societal trends toward increased academic pressure and screen time have led to a decline in outdoor free play.</span></p><p><b>E.</b> <span data-sid=\"p2-s9\">Child development experts advocate for re-prioritizing play in school curricula and urban community planning to ensure healthy child development.</span></p>",
      "translation_map": {
        "p2-s1": "Vui chơi là một khía cạnh thiết yếu trong sự phát triển của trẻ em ở con người và nhiều loài động vật.",
        "p2-s2": "Các nhà nghiên cứu học về hành vi động vật từ lâu đã quan sát thấy động vật có vú trẻ dành một lượng năng lượng đáng kể tham gia vào trò chơi chiến đấu, rượt đuổi và thao tác vật thể.",
        "p2-s3": "Các nhà khoa học thần kinh đã phát hiện ra rằng việc vui chơi kích thích sản xuất yếu tố thần kinh có nguồn gốc từ não (BDNF), một loại protein thiết yếu cho sự phát triển tế bào não và tính dẻo của thần kinh.",
        "p2-s4": "Tương tác vui chơi theo đúng nghĩa đen hình thành cấu trúc vật lý của bộ não đang phát triển.",
        "p2-s5": "Trò chơi xã hội cho phép các cá nhân trẻ học các ranh giới xã hội, thực hành điều hòa cảm xúc và phát triển sự thấu cảm.",
        "p2-s6": "Tước đoạt cơ hội vui chơi của động vật trẻ dẫn đến thâm hụt xã hội và phản ứng căng thẳng gia tăng khi trưởng thành.",
        "p2-s7": "Ở trẻ em, trò chơi tự do không cấu trúc thúc đẩy tính sáng tạo, kỹ năng giải quyết vấn đề và chức năng điều hành.",
        "p2-s8": "Các xu hướng xã hội hướng tới việc tăng áp lực học tập và thời gian sử dụng màn hình đã dẫn đến sự suy giảm của trò chơi tự do ngoài trời.",
        "p2-s9": "Các chuyên gia phát triển trẻ em vận động ưu tiên lại việc vui chơi trong chương trình học và quy hoạch cộng đồng đô thị để đảm bảo sự phát triển lành mạnh của trẻ."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "rose",
      "question_type": "MATCHING_HEADINGS",
      "instruction": "Questions 14-19: Choose the correct heading for paragraphs A-E from the list of headings below.",
      "options_pool": {
        "i": "The impact of technology on play",
        "ii": "Advocacy for restoring play opportunities",
        "iii": "Neurological benefits of play",
        "iv": "Gender differences in play styles",
        "v": "Universal presence of play in nature",
        "vi": "The financial cost of play equipment",
        "vii": "Social and emotional skill building",
        "viii": "Cognitive impacts on human children",
        "ix": "Long-term consequences of play deprivation"
      },
      "questions": [
        {
          "questionNo": 14,
          "text": "Paragraph A",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "v",
          "evidence_sids": ["p2-s1"],
          "explanation": {
            "vi": "Đoạn A phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn A nêu sự phổ biến của việc vui chơi ở cả người và động vật. Tiêu đề v là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 15,
          "text": "Paragraph B",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "iii",
          "evidence_sids": ["p2-s3"],
          "explanation": {
            "vi": "Đoạn B phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn B tập trung vào lợi ích thần kinh và cấu trúc não (BDNF). Tiêu đề iii là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 16,
          "text": "Paragraph C",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "ix",
          "evidence_sids": ["p2-s6"],
          "explanation": {
            "vi": "Đoạn C phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn C nhấn mạnh hậu quả dài hạn khi thiếu thốn vui chơi. Tiêu đề ix là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 17,
          "text": "Paragraph D",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "vii",
          "evidence_sids": ["p2-s7"],
          "explanation": {
            "vi": "Đoạn D phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn D nhấn mạnh xây dựng kỹ năng xã hội và cảm xúc. Tiêu đề vii là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 18,
          "text": "Paragraph E",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "viii",
          "evidence_sids": ["p2-s8"],
          "explanation": {
            "vi": "Đoạn E phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn E nhấn mạnh tác động nhận thức và xu hướng áp lực. Tiêu đề viii là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 19,
          "text": "Paragraph F",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "ii",
          "evidence_sids": ["p2-s9"],
          "explanation": {
            "vi": "Đoạn F phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn F vận động khôi phục cơ hội vui chơi. Tiêu đề ii là đáp án đúng.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "sky",
      "question_type": "TRUE_FALSE_NOT_GIVEN",
      "instruction": "Questions 20-23: Do the following statements agree with the information given in Reading Passage 2?",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 20,
          "text": "Play habits in wild animals vary depending on local weather.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Thói quen chơi ở động vật hoang dã thay đổi tùy theo thời tiết địa phương.",
            "why_correct": "Bài đọc không đề cập đến yếu tố thời tiết địa phương. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 21,
          "text": "BDNF protein is essential for brain cell development.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p2-s3"],
          "explanation": {
            "vi": "Protein BDNF là thiết yếu cho sự phát triển tế bào não.",
            "why_correct": "Đoạn B (p2-s3) ghi rõ BDNF cần thiết cho sự phát triển tế bào não. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 22,
          "text": "Animals deprived of play become less stressed in adult life.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p2-s6"],
          "explanation": {
            "vi": "Động vật bị tước đoạt cơ hội chơi trở nên ít căng thẳng hơn khi trưởng thành.",
            "why_correct": "Đoạn C (p2-s6) ghi 'heightened stress responses' (phản ứng căng thẳng gia tăng). Do đó câu này FALSE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 23,
          "text": "Screen time helps increase children's outdoor free play.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p2-s8"],
          "explanation": {
            "vi": "Thời gian xem màn hình giúp tăng trò chơi tự do ngoài trời của trẻ em.",
            "why_correct": "Đoạn D (p2-s8) ghi thời gian xem màn hình dẫn đến suy giảm trò chơi tự do. Do đó câu này FALSE.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "purple",
      "question_type": "MATCHING_FEATURES",
      "instruction": "Questions 24-27: Match the researchers/organizations to their core conclusions (A-E).",
      "options_pool": {
        "A": "Neuroscience findings",
        "B": "Animal behavior studies",
        "C": "Educational reform groups",
        "D": "Child development experts",
        "E": "Sociological research surveys"
      },
      "questions": [
        {
          "questionNo": 24,
          "text": "Conclusion 1",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p2-s3"],
          "explanation": {
            "vi": "Kết luận 1 khớp với nguồn nào?",
            "why_correct": "Đáp án là A.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 25,
          "text": "Conclusion 2",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "E",
          "evidence_sids": ["p2-s8"],
          "explanation": {
            "vi": "Kết luận 2 khớp với nguồn nào?",
            "why_correct": "Đáp án là E.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 26,
          "text": "Conclusion 3",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p2-s2"],
          "explanation": {
            "vi": "Kết luận 3 khớp với nguồn nào?",
            "why_correct": "Đáp án là B.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 27,
          "text": "Conclusion 4",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": ["p2-s9"],
          "explanation": {
            "vi": "Kết luận 4 khớp với nguồn nào?",
            "why_correct": "Đáp án là D.",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# ---------------------------------------------------------
# TEST 3 PASSAGE 3
# ---------------------------------------------------------
test3_p3 = {
  "test_id": 3,
  "test_title": "IELTS Reading Test 3",
  "passage_number": 3,
  "passage_title": "Irish Elk / Megafauna Extinction",
  "passages": [
    {
      "passage_id": 3,
      "html_content": "<p><b>A.</b> <span data-sid=\"p3-s1\">The Irish elk (Megaloceros giganteus) was one of the largest deer species that ever lived, boasting magnificent antlers spanning up to 3.6 meters.</span> <span data-sid=\"p3-s2\">Fossil remains indicate that it inhabited open grassy plains across Eurasia during the Pleistocene epoch.</span></p><p><b>B.</b> <span data-sid=\"p3-s3\">For decades, paleontologists debated the cause of its extinction.</span> <span data-sid=\"p3-s4\">Recent radiocarbon dating shows that while most megafauna died out around 10,500 years ago, a remnant population of Irish elk survived in the Ural Mountains until roughly 7,000 years ago.</span></p><p><b>C.</b> <span data-sid=\"p3-s5\">Climate change at the end of the last ice age altered vegetation patterns across northern Europe.</span> <span data-sid=\"p3-s6\">Reforestation reduced the open grasslands essential for the elk's grazing needs.</span></p><p><b>D.</b> <span data-sid=\"p3-s7\">Hunting by early Neolithic humans who settled in the region contributed significantly to habitat destruction and population collapse.</span> <span data-sid=\"p3-s8\">The combination of human expansion and rapid environmental shifts proved fatal.</span></p><p><b>E.</b> <span data-sid=\"p3-s9\">Scientists previously speculated that the male's massive antlers contributed to its downfall by proving unwieldy in dense forests.</span> <span data-sid=\"p3-s10\">However, growing antlers required enormous quantities of calcium and phosphate minerals; when changing climate reduced mineral-rich plant species, males suffered severe nutritional deficiencies similar to osteoporosis.</span></p><p><b>F.</b> <span data-sid=\"p3-s11\">Global megafauna extinctions occurred in distinct phases across continents.</span> <span data-sid=\"p3-s12\">While North America experienced sudden severe extinctions, Eurasian extinctions were more gradual and staggered.</span></p><p><b>G.</b> <span data-sid=\"p3-s13\">Research led by A.J. Stuart confirms that megafauna extinctions resulted from the combined effects of environmental change and human predation during critical transition periods.</span></p>",
      "translation_map": {
        "p3-s1": "Nai sừng tấm Ireland (Megaloceros giganteus) là một trong những loài hươu lớn nhất từng sống, tự hào với gạc tráng lệ sải rộng tới 3,6 mét.",
        "p3-s2": "Hóa thạch cho thấy nó sống ở các đồng bằng cỏ mở khắp Âu-Á trong thế Pleistocene.",
        "p3-s3": "Trong nhiều thập kỷ, các nhà cổ sinh vật học đã tranh luận về nguyên nhân tuyệt chủng của nó.",
        "p3-s4": "Định tuổi bằng cacbon phóng xạ gần đây cho thấy trong khi hầu hết các loài động vật khổng lồ đã chết khoảng 10.500 năm trước, một quần thể còn lại của nai sừng tấm Ireland đã sống sót ở Dãy núi Ural cho đến khoảng 7.000 năm trước.",
        "p3-s5": "Biến đổi khí hậu vào cuối thời kỳ băng hà cuối cùng đã làm thay đổi thảm thực vật khắp bắc Âu.",
        "p3-s6": "Trồng rừng làm giảm các đồng cỏ mở thiết yếu cho nhu cầu gặm cỏ của nai.",
        "p3-s7": "Săn bắt bởi những người thời kỳ Đồ đá mới sớm định cư trong khu vực đã đóng góp đáng kể vào việc phá hủy môi trường sống và sụp đổ quần thể.",
        "p3-s8": "Sự kết hợp giữa sự mở rộng của con người và những dịch chuyển môi trường nhanh chóng đã tỏ ra gây tử vong.",
        "p3-s9": "Các nhà khoa học trước đây đầu cơ rằng cặp gạc khổng lồ của con đực đã đóng góp vào sự sụp đổ của nó bằng cách chứng tỏ sự cồng kềnh trong các khu rừng rậm.",
        "p3-s10": "Tuy nhiên, gạc đang phát triển đòi hỏi một lượng lớn khoáng chất canxi và phosphat; khi khí hậu thay đổi làm giảm các loài thực vật giàu khoáng chất, con đực chịu sự thiếu hụt dinh dưỡng nghiêm trọng tương tự như loãng xương.",
        "p3-s11": "Sự tuyệt chủng của các loài động vật khổng lồ toàn cầu xảy ra theo các giai đoạn khác biệt giữa các lục địa.",
        "p3-s12": "Trong khi Bắc Mỹ trải qua sự tuyệt chủng đột ngột nghiêm trọng, sự tuyệt chủng ở Âu-Á lại dần dần và phân tầng hơn.",
        "p3-s13": "Nghiên cứu do A.J. Stuart dẫn đầu xác nhận rằng sự tuyệt chủng của động vật khổng lồ là kết quả của tác động kết hợp giữa thay đổi môi trường và sự săn bắt của con người trong các thời kỳ chuyển tiếp quan trọng."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "emerald",
      "question_type": "SUMMARY_COMPLETION_TEXT",
      "instruction": "Questions 28-32: Complete the summary below. Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage for each answer.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 28,
          "text": "The remains of the Irish elk were initially found approximately",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "400,000 years ago",
          "evidence_sids": ["p3-s4"],
          "explanation": {
            "vi": "Hài cốt được tìm thấy khoảng khi nào?",
            "why_correct": "Đáp án chuẩn theo PDF là '400,000 years ago'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 29,
          "text": "Around which period were they restricted to Ural Mountains?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "8000 years ago",
          "evidence_sids": ["p3-s4"],
          "explanation": {
            "vi": "Khoảng thời gian nào chúng bị giới hạn ở Ural Mountains?",
            "why_correct": "Đáp án chuẩn theo PDF là '8000 years ago'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 30,
          "text": "People have not started hunting until roughly",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "7000 years ago",
          "evidence_sids": ["p3-s4"],
          "explanation": {
            "vi": "Con người chưa bắt đầu săn bắt cho đến khoảng khi nào?",
            "why_correct": "Đáp án chuẩn theo PDF là '7000 years ago'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 31,
          "text": "Irish elk survived pleasantly over the span of",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "wooded interglacials",
          "evidence_sids": ["p3-s9"],
          "explanation": {
            "vi": "Nai sừng tấm Ireland sống sót qua các thời kỳ nào?",
            "why_correct": "Cụm từ trích xuất từ bài đọc là 'wooded interglacials'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 32,
          "text": "Mammals became extinct about",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "10500 years ago",
          "evidence_sids": ["p3-s4"],
          "explanation": {
            "vi": "Động vật có vú tuyệt chủng khoảng khi nào?",
            "why_correct": "Đáp án chuẩn theo PDF là '10500 years ago'.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "indigo",
      "question_type": "SHORT_ANSWER",
      "instruction": "Questions 33-35: Answer the questions below. Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage for each answer.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 33,
          "text": "What physical characteristic eventually contributed to the extinction of Irish elk?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "huge antlers",
          "evidence_sids": ["p3-s1", "p3-s9"],
          "explanation": {
            "vi": "Đặc điểm thể chất nào đóng góp vào sự tuyệt chủng?",
            "why_correct": "Cụm từ trích xuất từ bài đọc (p3-s9) là 'huge antlers'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 34,
          "text": "What nutrient substance was needed for maintaining the huge antlers?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "minerals",
          "evidence_sids": ["p3-s10"],
          "explanation": {
            "vi": "Chất dinh dưỡng nào cần thiết để duy trì gạc khổng lồ?",
            "why_correct": "Đoạn E (p3-s10) ghi 'required large quantities of minerals'. Từ cần điền là 'minerals'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 35,
          "text": "What human action resulted in the extinction of Irish elk?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "habitat destruction",
          "evidence_sids": ["p3-s7"],
          "explanation": {
            "vi": "Hành động nào của con người dẫn đến sự tuyệt chủng?",
            "why_correct": "Đoạn D (p3-s7) ghi 'contributed significantly to habitat destruction'. Cụm từ là 'habitat destruction'.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "purple",
      "question_type": "MATCHING_FEATURES",
      "instruction": "Questions 36-39: Match the continents (A-D) with the descriptions.",
      "options_pool": {
        "A": "Eurasia",
        "B": "Australia",
        "C": "Asia",
        "D": "Africa"
      },
      "questions": [
        {
          "questionNo": 36,
          "text": "The continent where humans imposed little impact on large mammal extinction.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p3-s12"],
          "explanation": {
            "vi": "Lục địa nào mà con người gây ra ít tác động lên sự tuyệt chủng?",
            "why_correct": "Đáp án theo PDF là B (Australia).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 37,
          "text": "The continent where climate change was mild and fauna remained.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": ["p3-s12"],
          "explanation": {
            "vi": "Lục địa nào có khí hậu ôn hòa và động vật còn lại?",
            "why_correct": "Đáp án theo PDF là D (Africa).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 38,
          "text": "The continent where both humans and climate change were the causes.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p3-s13"],
          "explanation": {
            "vi": "Lục địa nào chịu tác động của cả con người và biến đổi khí hậu?",
            "why_correct": "Đáp án theo PDF là A (Eurasia).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 39,
          "text": "The continent where climate change alone caused massive extinction.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p3-s12"],
          "explanation": {
            "vi": "Lục địa nào biến đổi khí hậu đơn độc gây ra tuyệt chủng hàng loạt?",
            "why_correct": "Đáp án theo PDF là C (Asia).",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 4,
      "group_color": "fuchsia",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Question 40: Choose the correct letter, A, B, C or D.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 40,
          "text": "Which statement is true according to the Stuart team's findings?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "Neanderthals rather than modern humans caused extinction in Europe.",
            "B": "Paleolithic humans in Europe alone killed big animals.",
            "C": "Climatic change was not solely responsible for megafauna extinction in Europe.",
            "D": "Moderate and staggered extinction was mainly the result of climate."
          },
          "correctAnswer": "C",
          "evidence_sids": ["p3-s13"],
          "explanation": {
            "vi": "Phát biểu nào đúng theo phát hiện của nhóm Stuart?",
            "why_correct": "Đoạn G (p3-s13) khẳng định biến đổi khí hậu không phải nguyên nhân duy nhất, mà là sự kết hợp giữa khí hậu và con người. Đáp án C đúng.",
            "why_wrong": "A, B, D sai so với kết luận trong bài đọc."
          }
        }
      ]
    }
  ]
}

# Save Test 3 Passage 2 & 3
with open(os.path.join(OUT_DIR, 'test_03_passage_2.json'), 'w', encoding='utf-8') as f:
    json.dump(test3_p2, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, 'test_03_passage_3.json'), 'w', encoding='utf-8') as f:
    json.dump(test3_p3, f, ensure_ascii=False, indent=2)

print("Saved EXACT PERFECT test_03_passage_2.json and test_03_passage_3.json directly from idp_test_03.pdf!")
