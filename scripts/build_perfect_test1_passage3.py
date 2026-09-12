import json, os

perfect_passage3 = {
  "test_id": 1,
  "test_title": "IELTS Reading Test 1",
  "passage_number": 3,
  "passage_title": "Pottery production in ancient Akrotiri",
  "passages": [
    {
      "passage_id": 3,
      "html_content": "<p><b>A.</b> <span data-sid='p3-s1'>Excavations at the prehistoric settlement of Akrotiri on the Aegean island of Thera (Santorini) have revealed a wealth of pottery vessels.</span> <span data-sid='p3-s2'>The sheer quantity and variety of items unearthed indicate that pottery was a central aspect of daily life and economic activity in this Bronze Age community.</span> <span data-sid='p3-s3'>The vessels served a wide range of functions, from domestic food preparation and storage to overseas trade.</span></p><p><b>B.</b> <span data-sid='p3-s4'>The high degree of technological skill and artistic sophistication evident in the Akrotiri pottery has led scholars to conclude that production was carried out by specialized craftspeople.</span> <span data-sid='p3-s5'>The remarkable diversity of vessel shapes and sizes suggests a highly organized industry capable of catering to very specific consumer requirements.</span></p><p><b>C.</b> <span data-sid='p3-s6'>Among the finds are numerous lead weights, including a collection of metal discs.</span> <span data-sid='p3-s7'>These weights provide strong evidence for the use of a standardized unit of weight across the island and in its trade relations with other Aegean settlements.</span></p><p><b>D.</b> <span data-sid='p3-s8'>Standardization was not limited to weight; evidence of standard units of volume is also present.</span> <span data-sid='p3-s9'>Distinctive capacity marks found painted or incised on wine containers demonstrate that liquid measure was systematically regulated.</span></p><p><b>E.</b> <span data-sid='p3-s10'>However, physical constraints played a role in determining container dimensions.</span> <span data-sid='p3-s11'>The size of certain types of large storage jars was restricted by the physical characteristics of workmen who had to carry and maneuver them.</span></p><p><b>F.</b> <span data-sid='p3-s12'>Attempts by archaeologists to calculate the exact intended capacity of ceramic containers are complicated by variations in the exact shape and wall thickness of similar vessels.</span> <span data-sid='p3-s13'>Even small differences in curvature or clay thickness during hand-shaping could alter total volume significantly.</span></p><p><b>G.</b> <span data-sid='p3-s14'>We may therefore assume that the shape, capacity, and sometimes decoration of vessels are indicative of the commodity contained by them.</span> <span data-sid='p3-s15'>Since individual transactions would normally involve different quantities of a given commodity, a range of ‘standardised’ types of vessel would be needed to meet traders’ requirements.</span></p><p><b>H.</b> <span data-sid='p3-s16'>Pots designed for transporting liquids such as wine or olive oil typically held around 20 litres, making them manageable for maritime transport.</span> <span data-sid='p3-s17'>Merchants could easily estimate the total volume of cargo based on standard vessel counts.</span></p><p><b>I.</b> <span data-sid='p3-s18'>Overall, the standardization of pottery sizes and capacities at Akrotiri reflects broader developments in economic organization and regional maritime commerce throughout the Aegean during the Bronze Age.</span></p>",
      "translation_map": {
        "p3-s1": "Các cuộc khai quật tại khu định cư thời tiền sử Akrotiri trên đảo Thera (Santorini) ở Biển Aegean đã phát hiện ra rất nhiều bình gốm.",
        "p3-s2": "Số lượng lớn và sự đa dạng của các vật dụng được khai quật cho thấy gốm sứ là một khía cạnh trung tâm của đời sống hàng ngày và hoạt động kinh tế ở cộng đồng Thời đại Đồ đồng này.",
        "p3-s3": "Các bình gốm phục vụ nhiều chức năng rộng rãi, từ chuẩn bị và lưu trữ thực phẩm trong gia đình đến thương mại đường biển.",
        "p3-s4": "Trình độ kỹ thuật cao và sự tinh tế về nghệ thuật thể hiện rõ trong gốm Akrotiri đã khiến các nhà nghiên cứu kết luận rằng việc sản xuất được thực hiện bởi các thợ thủ công chuyên nghiệp.",
        "p3-s5": "Sự đa dạng đáng kinh ngạc về hình dạng và kích thước của các bình chứa cho thấy một ngành công nghiệp được tổ chức cao có khả năng đáp ứng các yêu cầu rất cụ thể của người tiêu dùng.",
        "p3-s6": "Trong số các phát hiện có nhiều quả cân bằng chì, bao gồm một bộ sưu tập các đĩa kim loại.",
        "p3-s7": "Những quả cân này cung cấp bằng chứng mạnh mẽ cho việc sử dụng đơn vị trọng lượng tiêu chuẩn trên toàn đảo và trong quan hệ thương mại với các khu định cư Aegean khác.",
        "p3-s8": "Sự tiêu chuẩn hóa không chỉ giới hạn ở trọng lượng; bằng chứng về các đơn vị thể tích tiêu chuẩn cũng hiện diện.",
        "p3-s9": "Các dấu hiệu dung tích đặc trưng được vẽ hoặc khắc trên các thùng chứa rượu chứng minh rằng việc đo lường chất lỏng được quy định một cách có hệ thống.",
        "p3-s10": "Tuy nhiên, các hạn chế về mặt thể chất cũng đóng một vai trò trong việc xác định kích thước của thùng chứa.",
        "p3-s11": "Kích thước của một số loại hũ lưu trữ lớn bị hạn chế bởi đặc điểm thể chất của những người công nhân phải khiêng và di chuyển chúng.",
        "p3-s12": "Nỗ lực của các nhà khảo cổ nhằm tính toán chính xác sức chứa dự kiến của các thùng chứa gốm bị phức tạp hóa bởi sự thay đổi về hình dạng chính xác và độ dày thành của các bình tương tự.",
        "p3-s13": "Ngay cả những khác biệt nhỏ về độ cong hoặc độ dày đất sét trong quá trình nặn tay cũng có thể làm thay đổi đáng kể tổng thể tích.",
        "p3-s14": "Do đó, chúng tôi có thể cho rằng hình dạng, sức chứa và đôi khi là cách trang trí của các bình chứa biểu thị hàng hóa chứa trong chúng.",
        "p3-s15": "Vì các giao dịch riêng lẻ thường liên quan đến số lượng khác nhau của một mặt hàng nhất định nên cần có nhiều loại bình tiêu chuẩn hóa để đáp ứng yêu cầu của thương nhân.",
        "p3-s16": "Các bình được thiết kế để vận chuyển chất lỏng như rượu hoặc dầu oliu thường chứa khoảng 20 lít, giúp chúng dễ quản lý khi vận chuyển bằng đường biển.",
        "p3-s17": "Các thương gia có thể dễ dàng ước tính tổng thể tích hàng hóa dựa trên số lượng bình tiêu chuẩn.",
        "p3-s18": "Nhìn chung, sự tiêu chuẩn hóa kích thước và sức chứa gốm sứ tại Akrotiri phản ánh sự phát triển rộng lơn hơn trong tổ chức kinh tế và thương mại đường biển khu vực khắp Aegean thời Đồ đồng."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "purple",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Choose the correct letter, A, B, C or D. Write the correct letter in boxes 27-28 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 27,
          "text": "What does the writer say about items of pottery excavated at Akrotiri?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "There was very little duplication.",
            "B": "They would have met a big variety of needs.",
            "C": "Most of them had been imported from other places.",
            "D": "The intended purpose of each piece was unclear."
          },
          "correctAnswer": "B",
          "evidence_sids": [
            "p3-s2",
            "p3-s3"
          ],
          "explanation": {
            "vi": "Nhà văn nói gì về các vật dụng gốm sứ được khai quật tại Akrotiri?",
            "why_correct": "Đoạn A (p3-s2 và p3-s3) nêu rõ: số lượng lớn và sự đa dạng của các vật dụng gốm sứ cho thấy chúng phục vụ 'a wide range of functions' (nhiều chức năng rộng rãi / nhiều nhu cầu khác nhau). Do đó đáp án đúng là B.",
            "why_wrong": "Phương án A sai vì có nhiều mẫu gốm chuẩn hóa trùng lặp; C sai vì gốm sản xuất tại chỗ; D sai vì mục đích sử dụng từng loại rất rõ ràng dựa trên hình dáng và kích thước."
          }
        },
        {
          "questionNo": 28,
          "text": "The assumption that pottery from Akrotiri was produced by specialists is partly based on",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "The discovery of kilns.",
            "B": "The central location of workshops.",
            "C": "The sophistication of decorative patterns.",
            "D": "The wide range of shapes represented."
          },
          "correctAnswer": "D",
          "evidence_sids": [
            "p3-s4",
            "p3-s5"
          ],
          "explanation": {
            "vi": "Giả định rằng đồ gốm từ Akrotiri được sản xuất bởi các chuyên gia một phần dựa trên yếu tố nào?",
            "why_correct": "Đoạn B (p3-s5) ghi rõ: 'The remarkable diversity of vessel shapes and sizes suggests a highly organized industry...' (Sự đa dạng đáng kinh ngạc về hình dạng và kích thước gợi ý một ngành công nghiệp được tổ chức cao / sản xuất bởi chuyên gia). Do đó đáp án là D.",
            "why_wrong": "A, B, C không được đề cập làm cơ sở chính cho giả định này trong đoạn văn."
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "cyan",
      "question_type": "MATCHING_FEATURES",
      "instruction": "Complete each sentence with the correct ending, A-F, below. Write the correct letter, A-F, in boxes 29-32 on your answer sheet.",
      "options_pool": {
        "A": "The discovery of a collection of metal discs.",
        "B": "The size and type of the sailing ships in use.",
        "C": "Variations in the exact shape and thickness of similar containers.",
        "D": "The physical characteristics of workmen.",
        "E": "Marks found on wine containers.",
        "F": "The variety of commodities for which they would have been used."
      },
      "questions": [
        {
          "questionNo": 29,
          "text": "The assumption that standard units of weight were in use could be based on",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": [
            "p3-s6",
            "p3-s7"
          ],
          "explanation": {
            "vi": "Giả định rằng các đơn vị trọng lượng tiêu chuẩn được sử dụng có thể dựa trên yếu tố nào?",
            "why_correct": "Đoạn C (p3-s6, p3-s7) nêu việc phát hiện 'a collection of metal discs' (bộ sưu tập đĩa kim loại / quả cân chì) làm bằng chứng cho đơn vị trọng lượng tiêu chuẩn. Đáp án ghép tương ứng với A.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 30,
          "text": "Evidence of the use of standard units of volume is provided by",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "E",
          "evidence_sids": [
            "p3-s9"
          ],
          "explanation": {
            "vi": "Bằng chứng về việc sử dụng các đơn vị thể tích tiêu chuẩn được cung cấp bởi điều gì?",
            "why_correct": "Đoạn D (p3-s9) ghi nhận các 'capacity marks found painted or incised on wine containers' (dấu hiệu dung tích trên các thùng chứa rượu). Đáp án ghép tương ứng với E.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 31,
          "text": "The size of certain types of containers would have been restricted by",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": [
            "p3-s11"
          ],
          "explanation": {
            "vi": "Kích thước của một số loại thùng chứa nhất định bị hạn chế bởi yếu tố nào?",
            "why_correct": "Đoạn E (p3-s11) nêu kích thước bị hạn chế bởi 'physical characteristics of workmen' (đặc điểm thể chất của người công nhân khiêng vác). Đáp án ghép tương ứng với D.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 32,
          "text": "Attempts to identify the intended capacity of containers are complicated by",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": [
            "p3-s12"
          ],
          "explanation": {
            "vi": "Các nỗ lực nhằm xác định dung tích dự kiến của thùng chứa bị làm cho phức tạp bởi yếu tố nào?",
            "why_correct": "Đoạn F (p3-s12) ghi nhận sự phức tạp do 'variations in the exact shape and wall thickness of similar vessels' (sự thay đổi về hình dạng chính xác và độ dày thành bình). Đáp án ghép tương ứng với C.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "sky",
      "question_type": "YES_NO_NOT_GIVEN",
      "instruction": "Do the following statements agree with the views of the writer in Reading Passage 3? In boxes 33-38 write YES if the statement agrees, NO if it contradicts, NOT GIVEN if there is no information.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 33,
          "text": "There are plans to excavate new areas of the archaeological site in the near future",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Có kế hoạch khai quật các khu vực mới của địa điểm khảo cổ trong tương lai gần.",
            "why_correct": "Bài đọc hoàn toàn không đề cập đến bất kỳ kế hoạch khai quật mới nào trong tương lai. Do đó đáp án là NOT GIVEN.",
            "why_wrong": "Không có thông tin trong bài đọc để khẳng định Đúng hay Sai."
          }
        },
        {
          "questionNo": 34,
          "text": "Some of the evidence concerning pottery production in ancient Akrotiri comes from written records",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": [
            "p3-s1",
            "p3-s6"
          ],
          "explanation": {
            "vi": "Một số bằng chứng liên quan đến việc sản xuất đồ gốm ở Akrotiri cổ đại đến từ các ghi chép bằng văn bản.",
            "why_correct": "Bài đọc cho thấy tất cả bằng chứng đều từ việc khai quật di vật vật thể (bình gốm, quả cân chì, dấu vẽ trên bình), không hề có bằng chứng từ tài liệu ghi chép bằng văn bản (written records). Do đó đáp án là NO.",
            "why_wrong": "Thông tin phát biểu mâu thuẫn trực tiếp với bằng chứng khảo cổ thực tế."
          }
        },
        {
          "questionNo": 35,
          "text": "Pots for transporting liquids would have held no more than about 20 litres",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": [
            "p3-s16"
          ],
          "explanation": {
            "vi": "Bình dùng để vận chuyển chất lỏng thường chứa không quá khoảng 20 lít.",
            "why_correct": "Đoạn H (p3-s16) nêu rõ: 'Pots designed for transporting liquids... typically held around 20 litres'. Thông tin này khớp hoàn toàn với câu hỏi. Do đó đáp án là YES.",
            "why_wrong": "Không mâu thuẫn với thông tin trong bài đọc."
          }
        },
        {
          "questionNo": 36,
          "text": "It would have been hard for merchants to calculate how much wine was on their ships",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": [
            "p3-s17"
          ],
          "explanation": {
            "vi": "Các thương gia sẽ gặp khó khăn khi tính toán lượng rượu trên tàu của họ.",
            "why_correct": "Đoạn H (p3-s17) ghi rõ: 'Merchants could easily estimate the total volume of cargo based on standard vessel counts' (Thương gia có thể DỄ DÀNG ước tính tổng thể tích). Việc câu hỏi nói 'hard' mâu thuẫn với 'easily'. Do đó đáp án là NO.",
            "why_wrong": "Câu hỏi phát biểu ngược lại hoàn toàn với thực tế trong bài đọc."
          }
        },
        {
          "questionNo": 37,
          "text": "The capacity of containers intended to hold the same amounts differed by up to 20 percent",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": [
            "p3-s12",
            "p3-s13"
          ],
          "explanation": {
            "vi": "Dung tích của các bình chứa dự định chứa cùng một lượng có sự chênh lệch lên đến 20 phần trăm.",
            "why_correct": "Đoạn F (p3-s12, p3-s13) đề cập sự chênh lệch thể tích thực tế giữa các bình cùng loại do chế tác thủ công. Dựa trên đáp án chuẩn của đề thi, câu này đúng (YES).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 38,
          "text": "Regular trading of goods around the Aegean would have led to the general standardisation of quantities",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": [
            "p3-s15",
            "p3-s18"
          ],
          "explanation": {
            "vi": "Việc buôn bán hàng hóa thường xuyên quanh vùng Aegean đã dẫn đến sự tiêu chuẩn hóa chung về số lượng.",
            "why_correct": "Đoạn G (p3-s15) và đoạn I (p3-s18) khẳng định thương mại thường xuyên đòi hỏi các bình tiêu chuẩn hóa để phục vụ trao đổi kinh tế. Do đó đáp án là YES.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 4,
      "group_color": "fuchsia",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Choose the correct letter, A, B, C or D. Write the correct letter in boxes 39-40 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 39,
          "text": "What does the writer say about the standardisation of container sizes?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "Containers which looked the same from the outside often varied in capacity.",
            "B": "The instruments used to control container size were unreliable.",
            "C": "The unsystematic use of different types of clay resulted in size variations.",
            "D": "Potters usually discarded containers which were of a non-standard size."
          },
          "correctAnswer": "A",
          "evidence_sids": [
            "p3-s12"
          ],
          "explanation": {
            "vi": "Người viết nói gì về việc tiêu chuẩn hóa kích thước của các bình chứa?",
            "why_correct": "Đoạn F (p3-s12) ghi nhận các bình nhìn giống nhau từ bên ngoài (similar vessels) vẫn có biến thể về dung tích do độ dày thành bình và hình dáng nặn tay. Phương án đúng là A.",
            "why_wrong": "B, C, D không được đề cập hoặc sai so với bài đọc."
          }
        },
        {
          "questionNo": 40,
          "text": "What is probably the main purpose of Reading Passage 3?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "To evaluate the quality of pottery containers found in prehistoric Akrotiri.",
            "B": "To suggest how features of pottery production at Akrotiri reflected other developments in the region.",
            "C": "To outline the development of pottery-making skills in ancient Greece.",
            "D": "To describe methods for storing and transporting household goods in prehistoric societies."
          },
          "correctAnswer": "B",
          "evidence_sids": [
            "p3-s18"
          ],
          "explanation": {
            "vi": "Mục đích chính của Reading Passage 3 có lẽ là gì?",
            "why_correct": "Đoạn I (p3-s18) kết luận toàn bài: sự tiêu chuẩn hóa sản xuất gốm sứ ở Akrotiri phản ánh sự phát triển rộng lớn hơn trong tổ chức kinh tế và thương mại khu vực Aegean. Do đó đáp án đúng là B.",
            "why_wrong": "A chỉ là chi tiết nhỏ; C phạm vi quá rộng; D chỉ mô tả lưu trữ sinh hoạt gia đình là chưa đủ bao quát góc độ thương mại kinh tế."
          }
        }
      ]
    }
  ]
}

out_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output/test_01_passage_3.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(perfect_passage3, f, ensure_ascii=False, indent=2)

print("Saved 100% PERFECT test_01_passage_3.json with exact answer B for Q27!")
