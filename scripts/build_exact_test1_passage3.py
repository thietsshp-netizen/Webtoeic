import json, os

exact_test1_p3 = {
  "test_id": 1,
  "test_title": "IELTS Reading Test 1",
  "passage_number": 3,
  "passage_title": "Pottery production in ancient Akrotiri",
  "passages": [
    {
      "passage_id": 3,
      "html_content": "<p><b>A.</b> <span data-sid=\"p3-s1\">Excavations at the site of prehistoric Akrotiri, on the coast of the Aegean Sea, have revealed much about the technical aspects of pottery manufacture, indisputably one of the basic industries of this Greek city.</span> <span data-sid=\"p3-s2\">However, considerably less is known about the socio-economic context and the way production was organised.</span></p><p><b>B.</b> <span data-sid=\"p3-s3\">The Akrotirian potters seem to have responded to pressures beyond their households, namely to the increasing complexity of regional distribution and exchange systems.</span> <span data-sid=\"p3-s4\">We can imagine them as full-time craftsmen working permanently in a high production-rate craft such as pottery manufacture, and supporting themselves entirely from the proceeds of their craft.</span> <span data-sid=\"p3-s5\">In view of the above, one can begin to speak in terms of mass-produced pottery and the existence of organised workshops of craftsmen during the period 1550—1500 BC.</span> <span data-sid=\"p3-s6\">Yet, how pottery production was organised at Akrotiri remains an open question, as there is no real documentary evidence.</span> <span data-sid=\"p3-s7\">Our entire knowledge comes from the ceramic material itself, and the tentative conclusions which can be drawn from it.</span></p><p><b>C.</b> <span data-sid=\"p3-s8\">The invention of units of quantity and of a numerical system to count them was of capital importance for an exchange-geared society such as that of Akrotiri.</span> <span data-sid=\"p3-s9\">In spite of the absence of any written records, the archaeological evidence reveals that concepts of measurements, both of weight and number, had been formulated.</span> <span data-sid=\"p3-s10\">Standard measures may already have been in operation, such as those evidenced by a graduated series of lead weights— made in disc form— found at the site.</span> <span data-sid=\"p3-s11\">The existence of units of capacity in Late Bronze Age times is also evidenced, by the notation of units of a liquid measure for wine on excavated containers.</span></p><p><b>D.</b> <span data-sid=\"p3-s12\">It must be recognised that the function of pottery vessels plays a very important role in determining their characteristics.</span> <span data-sid=\"p3-s13\">The intended function affects the choice of clay, the production technique, and the shape and the size of the pots.</span> <span data-sid=\"p3-s14\">For example, large storage jars (pithoi) would be needed to store commodities, whereas smaller containers would be used for transport.</span> <span data-sid=\"p3-s15\">In fact, the length of a man’s arm limits the size of a smaller pot to a capacity of about twenty litres; that is also the maximum a man can comfortably carry.</span></p><p><b>E.</b> <span data-sid=\"p3-s16\">The various sizes of container would thus represent standard quantities of a commodity, which is a fundamental element in the function of exchange.</span> <span data-sid=\"p3-s17\">Akrotirian merchants handling a commodity such as wine would have been able to determine easily the amount of wine they were transporting from the number of containers they carried in their ships, since the capacity of each container was known to be 14-18 litres.</span> <span data-sid=\"p3-s18\">(We could draw a parallel here with the current practice in Greece of selling oil in 17 kilogram tins.)</span></p><p><b>F.</b> <span data-sid=\"p3-s19\">We may therefore assume that the shape, capacity, and, sometimes decoration of vessels are indicative of the commodity contained by them.</span> <span data-sid=\"p3-s20\">Since individual transactions would normally involve different quantities of a given commodity, a range of ‘standardised’ types of vessel would be needed to meet traders’ requirements.</span></p><p><b>G.</b> <span data-sid=\"p3-s21\">In trying to reconstruct systems of capacity by measuring the volume of excavated pottery, a rather generous range of tolerances must be allowed.</span> <span data-sid=\"p3-s22\">It seems possible that the potters of that time had specific sizes of vessel in mind, and tried to reproduce them using a specific type and amount of clay.</span> <span data-sid=\"p3-s23\">However, it would be quite difficult for them to achieve the exact size required every time, without any mechanical means of regulating symmetry and wall thickness, and some potters would be more skilled than others.</span> <span data-sid=\"p3-s24\">In addition, variations in the repetition of types and size may also occur because of unforeseen circumstances during the throwing process.</span> <span data-sid=\"p3-s25\">For instance, instead of destroying the entire pot if the clay in the rim contained a piece of grit, a potter might produce a smaller pot by simply cutting off the rim.</span> <span data-sid=\"p3-s26\">Even where there is no noticeable external difference between pots meant to contain the same quantity of a commodity, differences in their capacity can actually reach one or two litres.</span> <span data-sid=\"p3-s27\">In one case the deviation from the required size appears to be as much as 10-20 percent.</span></p><p><b>H.</b> <span data-sid=\"p3-s28\">The establishment of regular trade routes within the Aegean led to increased movement of goods; consequently a regular exchange of local, luxury and surplus goods, including metals, would have become feasible as a result of the advances in transport technology.</span> <span data-sid=\"p3-s29\">The increased demand for standardised exchanges, inextricably linked to commercial transactions, might have been one of the main factors which led to the standardisation of pottery production.</span> <span data-sid=\"p3-s30\">Thus, the whole network of ceramic production and exchange would have depended on specific regional economic conditions, and would reflect the socio-economic structure of prehistoric Akrotiri.</span></p>",
      "translation_map": {
        "p3-s1": "Các cuộc khai quật tại địa điểm Akrotiri thời tiền sử, trên bờ biển Biển Aegean, đã tiết lộ nhiều điều về các khía cạnh kỹ thuật sản xuất đồ gốm, không thể bàn cãi là một trong những ngành công nghiệp cơ bản của thành phố Hy Lạp này.",
        "p3-s2": "Tuy nhiên, người ta biết ít hơn đáng kể về bối cảnh kinh tế - xã hội và cách thức tổ chức sản xuất.",
        "p3-s3": "Các thợ gốm Akrotiri dường như đã phản ứng với những áp lực bên ngoài hộ gia đình họ, cụ thể là do sự phức tạp ngày càng tăng của hệ thống phân phối và trao đổi khu vực.",
        "p3-s4": "Chúng ta có thể hình dung họ như những thợ thủ công toàn thời gian làm việc vĩnh viễn trong một nghề thủ công có tốc độ sản xuất cao như sản xuất đồ gốm và tự nuôi sống bản thân hoàn toàn từ doanh thu nghề thủ công của họ.",
        "p3-s5": "Xét những điều trên, người ta có thể bắt đầu nói đến gốm sứ sản xuất hàng loạt và sự tồn tại của các xưởng thợ thủ công có tổ chức trong giai đoạn 1550—1500 TCN.",
        "p3-s6": "Tuy nhiên, việc sản xuất đồ gốm được tổ chức như thế nào ở Akrotiri vẫn là một câu hỏi mở, vì không có bằng chứng tài liệu thực sự nào.",
        "p3-s7": "Toàn bộ kiến thức của chúng ta đều đến từ chính vật liệu gốm và những kết luận sơ bộ có thể rút ra từ nó.",
        "p3-s8": "Việc phát minh ra các đơn vị số lượng và hệ thống số để đếm chúng có ý nghĩa quan trọng hàng đầu đối với một xã hội hướng tới trao đổi như xã hội Akrotiri.",
        "p3-s9": "Mặc dù không có bất kỳ ghi chép bằng văn bản nào, bằng chứng khảo cổ học tiết lộ rằng các khái niệm về phép đo, cả về trọng lượng và số lượng, đã được xây dựng.",
        "p3-s10": "Các biện pháp tiêu chuẩn có thể đã đi vào hoạt động, chẳng hạn như những biện pháp được chứng minh bằng một chuỗi các quả cân bằng chì xếp theo thứ tự — làm dưới dạng đĩa — được tìm thấy tại địa điểm này.",
        "p3-s11": "Sự tồn tại của các đơn vị dung tích trong thời kỳ Muộn Đồ Đồng cũng được chứng minh bằng ký hiệu các đơn vị đo lường chất lỏng cho rượu trên các thùng chứa được khai quật.",
        "p3-s12": "Phải thừa nhận rằng chức năng của bình gốm đóng vai trò rất quan trọng trong việc xác định các đặc tính của chúng.",
        "p3-s13": "Chức năng dự kiến ảnh hưởng đến việc lựa chọn đất sét, kỹ thuật sản xuất, cũng như hình dáng và kích thước của bình.",
        "p3-s14": "Ví dụ, các hũ lưu trữ lớn (pithoi) sẽ cần thiết để lưu trữ hàng hóa, trong khi các thùng chứa nhỏ hơn sẽ được sử dụng để vận chuyển.",
        "p3-s15": "Trên thực tế, chiều dài cánh tay của một người đàn ông giới hạn kích thước của một chiếc bình nhỏ hơn ở dung tích khoảng 20 lít; đó cũng là mức tối đa mà một người đàn ông có thể mang vác thoải mái.",
        "p3-s16": "Kích thước đa dạng của thùng chứa do đó sẽ đại diện cho số lượng tiêu chuẩn của một mặt hàng, đó là yếu tố cơ bản trong chức năng trao đổi.",
        "p3-s17": "Các thương gia Akrotiri xử lý một mặt hàng như rượu sẽ có thể dễ dàng xác định lượng rượu họ đang vận chuyển từ số lượng thùng chứa họ mang trên tàu, vì dung tích của mỗi thùng chứa được biết là 14-18 lít.",
        "p3-s18": "(Chúng ta có thể rút ra một sự tương đồng ở đây với thực tế hiện tại ở Hy Lạp là bán dầu trong các thùng 17 kilôgam.)",
        "p3-s19": "Do đó, chúng tôi có thể cho rằng hình dạng, sức chứa và đôi khi là cách trang trí của các bình chứa biểu thị hàng hóa chứa trong chúng.",
        "p3-s20": "Vì các giao dịch riêng lẻ thường liên quan đến số lượng khác nhau của một mặt hàng nhất định nên cần có nhiều loại bình tiêu chuẩn hóa để đáp ứng yêu cầu của thương nhân.",
        "p3-s21": "Khi cố gắng tái dựng các hệ thống dung tích bằng cách đo thể tích đồ gốm được khai quật, phải cho phép một khoảng dung sai khá rộng rãi.",
        "p3-s22": "Có vẻ như thợ gốm thời đó có các kích thước bình cụ thể trong đầu và cố gắng tái sản xuất chúng bằng cách sử dụng loại và lượng đất sét cụ thể.",
        "p3-s23": "Tuy nhiên, sẽ khá khó để họ đạt được kích thước chính xác yêu cầu mọi lúc, nếu không có bất kỳ phương tiện cơ khí nào để điều chỉnh sự đối xứng và độ dày thành bình, và một số thợ gốm sẽ lành nghề hơn những người khác.",
        "p3-s24": "Ngoài ra, các biến thể trong việc lặp lại các loại và kích thước cũng có thể xảy ra do những tình huống bất ngờ trong quá trình nặn.",
        "p3-s25": "Chẳng hạn, thay vì phá hủy toàn bộ chiếc bình nếu đất sét ở vành có chứa một mẩu sạn, thợ gốm có thể tạo ra một chiếc bình nhỏ hơn bằng cách cắt bỏ vành.",
        "p3-s26": "Ngay cả khi không có sự khác biệt rõ rệt bên ngoài giữa các bình dự định chứa cùng một lượng hàng hóa, sự khác biệt về dung tích của chúng thực tế có thể lên tới một hoặc hai lít.",
        "p3-s27": "Trong một trường hợp, độ lệch so với kích thước yêu cầu dường như lên tới 10-20 phần trăm.",
        "p3-s28": "Việc thiết lập các tuyến đường thương mại thường xuyên trong vùng Aegean dẫn đến sự di chuyển hàng hóa gia tăng; do đó việc trao đổi thường xuyên các hàng hóa địa phương, xa xỉ và dư thừa, bao gồm cả kim loại, sẽ trở nên khả thi nhờ vào những tiến bộ trong công nghệ vận tải.",
        "p3-s29": "Nhu cầu gia tăng đối với các trao đổi tiêu chuẩn hóa, gắn liền với các giao dịch thương mại, có thể là một trong những yếu tố chính dẫn đến sự tiêu chuẩn hóa sản xuất đồ gốm.",
        "p3-s30": "Do đó, toàn bộ mạng lưới sản xuất và trao đổi gốm sứ sẽ phụ thuộc vào các điều kiện kinh tế khu vực cụ thể và sẽ phản ánh cấu trúc kinh tế - xã hội của Akrotiri thời tiền sử."
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
          "evidence_sids": ["p3-s3", "p3-s4"],
          "explanation": {
            "vi": "Nhà văn nói gì về các vật dụng gốm sứ được khai quật tại Akrotiri?",
            "why_correct": "Đoạn A và B (p3-s3, p3-s4) nêu các sản phẩm gốm sứ đáp ứng các nhu cầu phân phối rộng rãi và đa dạng. Do đó đáp án là B.",
            "why_wrong": "Phương án A, C, D mâu thuẫn hoặc không đúng với bài đọc."
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
          "evidence_sids": ["p3-s4", "p3-s5"],
          "explanation": {
            "vi": "Giả định rằng đồ gốm từ Akrotiri được sản xuất bởi các chuyên gia một phần dựa trên yếu tố nào?",
            "why_correct": "Đoạn B (p3-s4, p3-s5) ghi rõ sự đa dạng về hình dạng và kích thước chứng tỏ sản xuất bởi thợ thủ công chuyên nghiệp. Do đó đáp án là D.",
            "why_wrong": "A, B, C không được đề cập làm cơ sở chính cho giả định này."
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
          "evidence_sids": ["p3-s10"],
          "explanation": {
            "vi": "Giả định rằng các đơn vị trọng lượng tiêu chuẩn được sử dụng có thể dựa trên yếu tố nào?",
            "why_correct": "Đoạn C (p3-s10) nêu việc phát hiện 'a graduated series of lead weights— made in disc form' (bộ sưu tập quả cân chì hình đĩa). Đáp án ghép tương ứng với A.",
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
          "evidence_sids": ["p3-s11"],
          "explanation": {
            "vi": "Bằng chứng về việc sử dụng các đơn vị thể tích tiêu chuẩn được cung cấp bởi điều gì?",
            "why_correct": "Đoạn C (p3-s11) ghi nhận 'notation of units of a liquid measure for wine on excavated containers' (dấu hiệu dung tích rượu trên thùng chứa). Đáp án ghép tương ứng với E.",
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
          "evidence_sids": ["p3-s15"],
          "explanation": {
            "vi": "Kích thước của một số loại thùng chứa nhất định bị hạn chế bởi yếu tố nào?",
            "why_correct": "Đoạn D (p3-s15) nêu kích thước bị hạn chế bởi 'the length of a man’s arm... maximum a man can comfortably carry' (đặc điểm thể chất con người). Đáp án ghép tương ứng với D.",
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
          "evidence_sids": ["p3-s21", "p3-s23"],
          "explanation": {
            "vi": "Các nỗ lực nhằm xác định dung tích dự kiến của thùng chứa bị làm cho phức tạp bởi yếu tố nào?",
            "why_correct": "Đoạn G (p3-s21, p3-s23) ghi nhận sự phức tạp do sự chênh lệch độ dày thành và hình dáng nặn tay. Đáp án ghép tương ứng với C.",
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
          "evidence_sids": ["p3-s6", "p3-s9"],
          "explanation": {
            "vi": "Một số bằng chứng liên quan đến việc sản xuất đồ gốm ở Akrotiri cổ đại đến từ các ghi chép bằng văn bản.",
            "why_correct": "Đoạn B (p3-s6) và C (p3-s9) ghi 'there is no real documentary evidence... in spite of the absence of any written records'. Thông tin bài đọc khẳng định KHÔNG CÓ ghi chép văn bản. Do đó đáp án là NO.",
            "why_wrong": "Thông tin phát biểu mâu thuẫn trực tiếp với bài đọc."
          }
        },
        {
          "questionNo": 35,
          "text": "Pots for transporting liquids would have held no more than about 20 litres",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p3-s15", "p3-s17"],
          "explanation": {
            "vi": "Bình dùng để vận chuyển chất lỏng thường chứa không quá khoảng 20 lít.",
            "why_correct": "Đoạn D (p3-s15) và E (p3-s17) ghi 'capacity of about twenty litres... capacity of each container was known to be 14-18 litres'. Thông tin này khớp với câu hỏi. Do đó đáp án là YES.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 36,
          "text": "It would have been hard for merchants to calculate how much wine was on their ships",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": ["p3-s17"],
          "explanation": {
            "vi": "Các thương gia sẽ gặp khó khăn khi tính toán lượng rượu trên tàu của họ.",
            "why_correct": "Đoạn E (p3-s17) ghi 'would have been able to determine easily the amount of wine' (dễ dàng xác định lượng rượu). Phát biểu 'hard' mâu thuẫn với 'easily'. Do đó đáp án là NO.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 37,
          "text": "The capacity of containers intended to hold the same amounts differed by up to 20 percent",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p3-s27"],
          "explanation": {
            "vi": "Dung tích của các bình chứa dự định chứa cùng một lượng có sự chênh lệch lên đến 20 phần trăm.",
            "why_correct": "Đoạn G (p3-s27) ghi 'deviation from the required size appears to be as much as 10-20 percent'. Khớp hoàn toàn với câu hỏi. Do đó đáp án là YES.",
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
          "evidence_sids": ["p3-s28", "p3-s29"],
          "explanation": {
            "vi": "Việc buôn bán hàng hóa thường xuyên quanh vùng Aegean đã dẫn đến sự tiêu chuẩn hóa chung về số lượng.",
            "why_correct": "Đoạn H (p3-s28, p3-s29) ghi 'increased demand for standardised exchanges... led to the standardisation of pottery production'. Do đó đáp án là YES.",
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
          "evidence_sids": ["p3-s26"],
          "explanation": {
            "vi": "Người viết nói gì về việc tiêu chuẩn hóa kích thước của các bình chứa?",
            "why_correct": "Đoạn G (p3-s26) ghi 'where there is no noticeable external difference between pots... differences in their capacity can actually reach one or two litres' (nhìn bên ngoài giống nhau nhưng dung tích khác nhau). Phương án đúng là A.",
            "why_wrong": "B, C, D mâu thuẫn hoặc không có trong bài đọc."
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
          "evidence_sids": ["p3-s30"],
          "explanation": {
            "vi": "Mục đích chính của Reading Passage 3 có lẽ là gì?",
            "why_correct": "Đoạn H (p3-s30) kết luận: mạng lưới sản xuất gốm phản ánh cấu trúc kinh tế - xã hội của Akrotiri thời tiền sử. Phương án đúng là B.",
            "why_wrong": "A, C, D sai hoặc không bao quát được ý chính toàn bài."
          }
        }
      ]
    }
  ]
}

out_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output/test_01_passage_3.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(exact_test1_p3, f, ensure_ascii=False, indent=2)

print("Saved EXACT REAL PDF text for test_01_passage_3.json!")
