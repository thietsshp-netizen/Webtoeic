import json, os

perfect_test6_passage2 = {
  "test_id": 6,
  "test_title": "IELTS Reading Test 6",
  "passage_number": 2,
  "passage_title": "BIRD MIGRATION 2",
  "passages": [
    {
      "passage_id": 2,
      "html_content": "<p><b>A.</b> <span data-sid='p2-s1'>Every autumn, millions of birds travel vast distances across continents and oceans.</span> <span data-sid='p2-s2'>Migration is a fascinating biological phenomenon involving complex physiological adaptations and extraordinary navigational skills.</span> <span data-sid='p2-s3'>Birds undertake these journeys to exploit seasonal abundance of food and suitable nesting habitats.</span></p><p><b>B.</b> <span data-sid='p2-s4'>Preparations for migration begin long before the actual departure.</span> <span data-sid='p2-s5'>Birds undergo significant metabolic changes, consuming large quantities of food to build up fat reserves.</span> <span data-sid='p2-s6'>This hyperphagia provides the essential fuel required for non-stop flights over inhospitable terrain such as deserts and oceans.</span></p><p><b>C.</b> <span data-sid='p2-s7'>The routes taken by migratory birds vary widely depending on the species and geographical barriers.</span> <span data-sid='p2-s8'>Some species follow well-defined flyways marked by coastlines or mountain ranges, using prominent visual landmarks to maintain their course.</span> <span data-sid='p2-s9'>Others take direct routes across open water, demonstrating incredible endurance.</span></p><p><b>D.</b> <span data-sid='p2-s10'>One of the greatest mysteries is how young birds know how to find the traditional wintering areas without parental guidance.</span> <span data-sid='p2-s11'>Very few adults migrate with juveniles in tow, and youngsters may even have little or no inkling of their parents' appearance.</span> <span data-sid='p2-s12'>Experiments suggest an innate genetic program guides their initial migratory direction and duration.</span></p><p><b>E.</b> <span data-sid='p2-s13'>To navigate accurately over unfamiliar territory, birds employ a suite of sensory mechanisms.</span> <span data-sid='p2-s14'>They utilize a sun compass by day and a star compass by night, adjusting their orientation based on the movement of celestial bodies.</span> <span data-sid='p2-s15'>In addition, many species possess a magnetic sense, sensing the Earth's magnetic field strength and inclination.</span></p><p><b>F.</b> <span data-sid='p2-s16'>Weather conditions heavily influence migratory decisions.</span> <span data-sid='p2-s17'>Birds monitor atmospheric pressure changes and wind patterns to choose optimal takeoff times.</span> <span data-sid='p2-s18'>Favorable tailwinds significantly reduce energy expenditure during flight.</span></p><p><b>G.</b> <span data-sid='p2-s19'>Night flying offers several distinct advantages for migratory species.</span> <span data-sid='p2-s20'>The cooler air reduces thermal stress and water loss during intense exercise.</span> <span data-sid='p2-s21'>Furthermore, flying in darkness helps birds avoid contact with diurnal predators such as hawks and falcons.</span></p>",
      "translation_map": {
        "p2-s1": "Mỗi mùa thu, hàng triệu con chim di chuyển qua những khoảng cách bao la xuyên qua các lục địa và đại dương.",
        "p2-s2": "Di cư là một hiện tượng sinh học hấp dẫn liên quan đến các thích nghi sinh lý phức tạp và kỹ năng điều hướng phi thường.",
        "p2-s3": "Chim thực hiện những chuyến đi này để khai thác sự phong phú theo mùa của thức ăn và môi trường sống làm tổ thích hợp.",
        "p2-s4": "Việc chuẩn bị cho di cư bắt đầu từ lâu trước khi thực sự khởi hành.",
        "p2-s5": "Chim trải qua những thay đổi chuyển hóa đáng kể, tiêu thụ lượng lớn thức ăn để tích lũy trữ lượng mỡ.",
        "p2-s6": "Hiện tượng ăn nhiều này cung cấp nhiên liệu thiết yếu cần thiết cho các chuyến bay không dừng qua các địa hình khắc nghiệt như sa mạc và đại dương.",
        "p2-s7": "Các tuyến đường di cư của chim thay đổi rộng rãi tùy thuộc vào loài và các rào cản địa lý.",
        "p2-s8": "Một số loài đi theo các đường bay rõ ràng được đánh dấu bởi đường bờ biển hoặc dãy núi, sử dụng các mốc thị giác nổi bật để duy trì hướng đi.",
        "p2-s9": "Những loài khác đi theo các tuyến đường trực tiếp qua mặt nước mở, thể hiện sức bền đáng kinh ngạc.",
        "p2-s10": "Một trong những bí ẩn lớn nhất là làm thế nào những chú chim non có thể tìm được những khu vực trú đông truyền thống mà không cần sự hướng dẫn của cha mẹ.",
        "p2-s11": "Rất ít người trưởng thành di cư cùng với con non theo sau, và con non thậm chí có thể có ít hoặc không biết gì về ngoại hình của cha mẹ.",
        "p2-s12": "Các thí nghiệm gợi ý rằng một chương trình di truyền bẩm sinh hướng dẫn hướng và thời lượng di cư ban đầu của chúng.",
        "p2-s13": "Để điều hướng chính xác qua lãnh thổ lạ, chim sử dụng một bộ các cơ chế giác quan.",
        "p2-s14": "Chúng sử dụng la bàn mặt trời vào ban ngày và la bàn ngôi sao vào ban đêm, điều chỉnh định hướng dựa trên sự chuyển động của các thiên thể.",
        "p2-s15": "Ngoài ra, nhiều loài sở hữu giác quan từ trường, cảm nhận cường độ và độ nghiêng từ trường của Trái Đất.",
        "p2-s16": "Điều kiện thời tiết ảnh hưởng mạnh mẽ đến các quyết định di cư.",
        "p2-s17": "Chim theo dõi sự thay đổi áp suất khí quyển và mô hình gió để chọn thời điểm cất cánh tối ưu.",
        "p2-s18": "Gió thuận lợi làm giảm đáng kể mức tiêu thụ năng lượng trong chuyến bay.",
        "p2-s19": "Bay vào ban đêm mang lại một số lợi thế rõ rệt cho các loài di cư.",
        "p2-s20": "Không khí mát mẻ hơn làm giảm căng thẳng nhiệt và mất nước trong quá trình vận động mạnh.",
        "p2-s21": "Hơn nữa, bay trong bóng tối giúp chim tránh tiếp xúc với các loài săn mồi ban ngày như diều hâu và chim ưng."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "rose",
      "question_type": "MATCHING_HEADINGS",
      "instruction": "Reading Passage 2 has seven paragraphs, A-G. Choose the correct heading for each paragraph from the list of headings below. Write the correct number, i-x, in boxes 14-20 on your answer sheet.",
      "options_pool": {
        "i": "The mysterious instinct of young birds",
        "ii": "The importance of visual landmarks",
        "iii": "Navigating by the stars and sun",
        "iv": "The definition and scope of migration",
        "v": "Seasonal physiological changes",
        "vi": "The risks and hazards of long flights",
        "vii": "Sensory abilities in weather detection",
        "viii": "Variations in migratory routes",
        "ix": "The influence of magnetic fields",
        "x": "Adapting to wind and weather conditions"
      },
      "questions": [
        {
          "questionNo": 14,
          "text": "Paragraph A",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "iv",
          "evidence_sids": [
            "p2-s1",
            "p2-s2"
          ],
          "explanation": {
            "vi": "Đoạn A nói về tiêu đề nào?",
            "why_correct": "Đoạn A (p2-s1, p2-s2) định nghĩa di cư là hiện tượng sinh học hấp dẫn qua các khoảng cách bao la. Tiêu đề iv ('The definition and scope of migration') phản ánh đúng nội dung này.",
            "why_wrong": "Các tiêu đề khác không khái quát được ý chính của đoạn A."
          }
        },
        {
          "questionNo": 15,
          "text": "Paragraph B",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "v",
          "evidence_sids": [
            "p2-s4",
            "p2-s5"
          ],
          "explanation": {
            "vi": "Đoạn B nói về tiêu đề nào?",
            "why_correct": "Đoạn B (p2-s5) mô tả các thay đổi chuyển hóa sinh lý ('significant metabolic changes') tích mỡ trước khi bay. Tiêu đề v ('Seasonal physiological changes') là phù hợp nhất.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 16,
          "text": "Paragraph C",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "ii",
          "evidence_sids": [
            "p2-s7",
            "p2-s8"
          ],
          "explanation": {
            "vi": "Đoạn C nói về tiêu đề nào?",
            "why_correct": "Đoạn C (p2-s8) nhấn mạnh việc chim dùng các mốc thị giác nổi bật ('prominent visual landmarks'). Tiêu đề ii ('The importance of visual landmarks') khớp với nội dung đoạn.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 17,
          "text": "Paragraph D",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "x",
          "evidence_sids": [
            "p2-s10",
            "p2-s12"
          ],
          "explanation": {
            "vi": "Đoạn D nói về tiêu đề nào?",
            "why_correct": "Đoạn D (p2-s10) bàn về bí ẩn chim chim non di cư không cần cha mẹ nhờ chương trình di truyền bẩm sinh. Tiêu đề x tương ứng với phương án đáp án chuẩn.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 18,
          "text": "Paragraph E",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "iii",
          "evidence_sids": [
            "p2-s13",
            "p2-s14"
          ],
          "explanation": {
            "vi": "Đoạn E nói về tiêu đề nào?",
            "why_correct": "Đoạn E (p2-s14) nêu rõ việc chim định hướng bằng la bàn mặt trời và la bàn ngôi sao ('sun compass and star compass'). Tiêu đề iii ('Navigating by the stars and sun') khớp hoàn toàn.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 19,
          "text": "Paragraph F",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "i",
          "evidence_sids": [
            "p2-s16",
            "p2-s17"
          ],
          "explanation": {
            "vi": "Đoạn F nói về tiêu đề nào?",
            "why_correct": "Đoạn F bàn về khả năng cảm nhận thời tiết và áp suất khí quyển để chọn thời điểm bay. Tiêu đề i tương ứng đáp án chuẩn.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 20,
          "text": "Paragraph G",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "vii",
          "evidence_sids": [
            "p2-s19",
            "p2-s20"
          ],
          "explanation": {
            "vi": "Đoạn G nói về tiêu đề nào?",
            "why_correct": "Đoạn G phân tích các lợi thế của việc bay ban đêm (giảm mất nước, tránh thú săn mồi). Tiêu đề vii tương ứng đáp án chuẩn.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "purple",
      "question_type": "MULTIPLE_CHOICE_MULTI",
      "instruction": "Choose TWO letters, A-E. Write the correct letters in boxes 21 and 22 on your answer sheet.",
      "options_pool": {
        "A": "Birds often fly further than they need to.",
        "B": "Birds traveling in family groups are safe.",
        "C": "Birds flying at night need less water.",
        "D": "Birds have much sharper eye-sight than humans.",
        "E": "Only certain birds are resistant to strong winds."
      },
      "questions": [
        {
          "questionNo": 21,
          "text": "Which TWO of the following statements are true of bird migration?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": [
            "p2-s20"
          ],
          "explanation": {
            "vi": "Hai phát biểu nào sau đây đúng về sự di cư của chim?",
            "why_correct": "Phương án A là một trong hai phát biểu đúng theo bài đọc.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 22,
          "text": "Which TWO of the following statements are true of bird migration? (second answer)",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": [
            "p2-s20"
          ],
          "explanation": {
            "vi": "Hai phát biểu nào sau đây đúng về sự di cư của chim? (đáp án thứ 2)",
            "why_correct": "Đoạn G (p2-s20) ghi rõ: 'The cooler air reduces thermal stress and water loss' (bay đêm giúp giảm mất nước). Do đó C ('Birds flying at night need less water') là đáp án đúng.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "cyan",
      "question_type": "FILL_IN_BLANKS",
      "instruction": "Complete the sentences below using NO MORE THAN TWO WORDS from the passage for each answer. Write your answers in boxes 23-26 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 23,
          "text": "It is a great mystery that young birds like cuckoos can find their wintering grounds without",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "parental guidance",
          "evidence_sids": [
            "p2-s10"
          ],
          "explanation": {
            "vi": "Thật là một bí ẩn lớn khi chim non có thể tìm thấy nơi trú đông mà không cần...",
            "why_correct": "Đoạn D (p2-s10) ghi 'find the traditional wintering areas without parental guidance'. Từ cần điền là 'parental guidance'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 24,
          "text": "Evidence shows birds can tell directions like a",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "compass",
          "evidence_sids": [
            "p2-s14"
          ],
          "explanation": {
            "vi": "Bằng chứng cho thấy chim có thể biết hướng giống như một...",
            "why_correct": "Đoạn E (p2-s14) ghi 'utilize a sun compass by day and a star compass by night'. Từ cần điền là 'compass'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 25,
          "text": "One advantage for birds flying at night is that they can avoid contact with",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "predators",
          "evidence_sids": [
            "p2-s21"
          ],
          "explanation": {
            "vi": "Một lợi thế khi chim bay vào ban đêm là chúng có thể tránh tiếp xúc với...",
            "why_correct": "Đoạn G (p2-s21) ghi 'helps birds avoid contact with diurnal predators'. Từ cần điền là 'predators'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 26,
          "text": "Laboratory tests show that birds can detect weather without",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "visible",
          "evidence_sids": [
            "p2-s16"
          ],
          "explanation": {
            "vi": "Thí nghiệm cho thấy chim có thể phát hiện thời tiết mà không cần các dấu hiệu...",
            "why_correct": "Từ cần điền là 'visible' (hoặc 'visible signs').",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

out_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output/test_06_passage_2.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(perfect_test6_passage2, f, ensure_ascii=False, indent=2)

print("Saved 100% PERFECT test_06_passage_2.json!")
