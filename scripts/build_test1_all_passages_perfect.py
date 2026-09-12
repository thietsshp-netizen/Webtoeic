import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------
# TEST 1 PASSAGE 1
# ---------------------------------------------------------
test1_p1 = {
  "test_id": 1,
  "test_title": "IELTS Reading Test 1",
  "passage_number": 1,
  "passage_title": "Andrea Palladio: Italian architect",
  "passages": [
    {
      "passage_id": 1,
      "html_content": "<p><b>Andrea Palladio: Italian architect</b><br><i>A new exhibition celebrates Palladio’s architecture 500years on</i></p><p><b>A.</b> <span data-sid='p1-s1'>Vicenza is a pleasant, prosperous city in the Veneto, 60km west of Venice.</span> <span data-sid='p1-s2'>Its grand families settled and farmed the area from the 16th century.</span> <span data-sid='p1-s3'>But its principal claim to fame is Andrea Palladio, who is such an influential architect that a neoclassical style is known as Palladian.</span> <span data-sid='p1-s4'>The city is a permanent exhibition of some of his finest buildings, and as he was born—in Padua, to be precise—500 years ago, the International Centre for the Study of Palladio's Architecture has an excellent excuse for mounting la grande mostra, the big show.</span></p><p><b>B.</b> <span data-sid='p1-s5'>The exhibition has the special advantage of being held in one of Palladio's buildings, Palazzo Barbaran da Porto.</span> <span data-sid='p1-s6'>Its bold facade is a mixture of rustication and decoration set between two rows of elegant columns.</span> <span data-sid='p1-s7'>On the second floor the pediments are alternately curved or pointed, a Palladian trademark.</span> <span data-sid='p1-s8'>The harmonious proportions of the atrium at the entrance lead through to a dramatic interior of fine fireplaces and painted ceilings.</span> <span data-sid='p1-s9'>Palladio's design is simple, clear and not over-crowded.</span> <span data-sid='p1-s10'>The show has been organised on the same principles, according to Howard Burns, the architectural historian who co-curated it.</span></p><p><b>C.</b> <span data-sid='p1-s11'>Palladio's father was a miller who settled in Vicenza, where the young Andrea was apprenticed to a skilled stonemason.</span> <span data-sid='p1-s12'>How did a humble miller's son become a world renowned architect?</span> <span data-sid='p1-s13'>The answer in the exhibition is that, as a young man, Palladio excelled at carving decorative stonework on columns, doorways and fireplaces.</span> <span data-sid='p1-s14'>He was plainly intelligent, and lucky enough to come across a rich patron, Gian Giorgio Trissino, a landowner and scholar, who organised his education, taking him to Rome in the 1540s, where he studied the masterpieces of classical Roman and Greek architecture and the work of other influential architects of the time, such as Donato Bramante and Raphael.</span></p><p><b>D.</b> <span data-sid='p1-s15'>Burns argues that social mobility was also important.</span> <span data-sid='p1-s16'>Entrepreneurs, prosperous from agriculture in the Veneto, commissioned the promising local architect to design their country villas and their urban mansions.</span> <span data-sid='p1-s17'>In Venice the aristocracy were anxious to co-opt talented artists, and Palladio was given the chance to design the buildings that have made him famous—the churches of San Giorgio Maggiore and the Redentore, both easy to admire because they can be seen from the city's historical centre across a stretch of water.</span></p><p><b>E.</b> <span data-sid='p1-s18'>He tried his hand at bridges—his unbuilt version of the Rialto Bridge was decorated with the large pediment and columns of a temple—and, after a fire at the Ducal Palace, he offered an alternative design which bears an uncanny resemblance to the Banqueting House in Whitehall in London.</span> <span data-sid='p1-s19'>Since it was designed by Inigo Jones, Palladio's first foreign disciple, this is not as surprising as it sounds.</span></p><p><b>F.</b> <span data-sid='p1-s20'>Jones, who visited Italy in 1614, bought a trunk full of the master's architectural drawings; they passed through the hands of the Dukes of Burlington and Devonshire before settling at the Royal Institute of British Architects in 1894.</span> <span data-sid='p1-s21'>Many are now on display at Palazzo Barbaran.</span> <span data-sid='p1-s22'>What they show is how Palladio drew on the buildings of ancient Rome as models.</span> <span data-sid='p1-s23'>The major theme of both his rural and urban building was temple architecture, with a strong pointed pediment supported by columns and approached by wide steps.</span></p><p><b>G.</b> <span data-sid='p1-s24'>Palladio's work for rich landowners alienates unreconstructed critics on the Italian left, but among the papers in the show are designs for cheap housing in Venice.</span> <span data-sid='p1-s25'>In the wider world, Palladio's reputation has been nurtured by a text he wrote and illustrated, \"Quattro Libri dell' Architettura\".</span> <span data-sid='p1-s26'>His influence spread to St Petersburg and to Charlottesville in Virginia, where Thomas Jefferson commissioned a Palladian villa he called Monticello.</span></p><p><b>H.</b> <span data-sid='p1-s27'>Vicenza's show contains detailed models of the major buildings and is leavened by portraits of Palladio's teachers and clients by Titian, Veronese and Tintoretto; the paintings of his Venetian buildings are all by Canaletto, no less.</span> <span data-sid='p1-s28'>This is an uncompromising exhibition; many of the drawings are small and faint, and there are no sideshows for children, but the impact of harmonious lines and satisfying proportions is to impart in a viewer a feeling of benevolent calm.</span> <span data-sid='p1-s29'>Palladio is history's most therapeutic architect.</span></p><p><b>I.</b> <span data-sid='p1-s30'>\"Palladio, 500 Anni: La Grande Mostra\" is at Palazzo Barbaran da Porto, Vicenza, until January 6th 2009.</span> <span data-sid='p1-s31'>The exhibition continues at the Royal Academy of Arts, London, from January 31st to April 13th, and travels afterwards to Barcelona and Madrid.</span></p>",
      "translation_map": {
        "p1-s1": "Vicenza là một thành phố dễ chịu, thịnh vượng thuộc vùng Veneto, nằm cách Venice 60km về phía tây.",
        "p1-s2": "Các dòng họ lớn của thành phố đã định cư và làm nông nghiệp tại khu vực này từ thế kỷ 16.",
        "p1-s3": "Nhưng lý do chính giúp thành phố này nổi tiếng là Andrea Palladio, một kiến trúc trúc sư có tầm ảnh hưởng lớn đến mức một phong cách tân cổ điển được gọi theo tên ông là Palladian.",
        "p1-s4": "Thành phố này giống như một triển lãm vĩnh cửu trưng bày một số công trình đẹp nhất của ông, và vì ông sinh ra — chính xác là ở Padua — cách đây 500 năm, Trung tâm Quốc tế Nghiên cứu Kiến trúc của Palladio có một lý do tuyệt vời để tổ chức la grande mostra, triển lãm lớn.",
        "p1-s5": "Triển lãm có lợi thế đặc biệt là được tổ chức tại một trong những tòa nhà do chính Palladio thiết kế, Palazzo Barbaran da Porto.",
        "p1-s6": "Mặt tiền táo bạo của nó là sự kết hợp giữa nét thô mộc và trang trí được đặt giữa hai hàng cột thanh lịch.",
        "p1-s7": "Ở tầng hai, các trán tường (pediments) được làm cong hoặc nhọn xen kẽ nhau, một thương hiệu đặc trưng của Palladio.",
        "p1-s8": "Tỷ lệ hài hòa của sân trong ở lối vào dẫn đến không gian nội thất ấn tượng với các lò sưởi tinh xảo và trần nhà được vẽ tranh.",
        "p1-s9": "Thiết kế của Palladio đơn giản, rõ ràng và không bị rườm rà.",
        "p1-s10": "Triển lãm đã được tổ chức theo cùng các nguyên tắc đó, theo nhận định của Howard Burns, nhà lịch sử kiến trúc kiêm đồng giám sát triển lãm.",
        "p1-s11": "Cha của Palladio là một thợ xay lúa mì đã đến định cư ở Vicenza, nơi Andrea thời trẻ làm thợ học việc cho một thợ đẽo đá lành nghề.",
        "p1-s12": "Làm thế nào mà con trai của một thợ xay lúa khiêm tốn lại trở thành một kiến trúc sư danh tiếng thế giới?",
        "p1-s13": "Câu trả lời trong triển lãm là, khi còn là một thanh niên, Palladio rất xuất sắc trong việc chạm khắc đá trang trí trên các cột, khung cửa và lò sưởi.",
        "p1-s14": "Ông rõ ràng là người thông minh và đủ may mắn khi gặp được một nhà bảo trợ giàu có, Gian Giorgio Trissino, một chủ đất kiêm học giả, người đã đứng ra tổ chức việc học hành cho ông, đưa ông đến Rome vào những năm 1540, nơi ông nghiên cứu các kiệt tác kiến trúc La Mã và Hy Lạp cổ đại cùng tác phẩm của các kiến trúc sư ảnh hưởng khác thời bấy giờ như Donato Bramante và Raphael.",
        "p1-s15": "Burns tranh luận rằng sự dịch chuyển tầng lớp xã hội (social mobility) cũng rất quan trọng.",
        "p1-s16": "Các doanh nhân giàu lên từ nông nghiệp ở Veneto đã thuê vị kiến trúc sư địa phương đầy triển vọng này thiết kế các biệt thự nông thôn và dinh thự thành thị cho họ.",
        "p1-s17": "Tại Venice, giới quý tộc rất mong muốn thu phục các nghệ sĩ tài năng, và Palladio đã được trao cơ hội thiết kế những công trình làm nên tên tuổi ông — các nhà thờ San Giorgio Maggiore và Redentore, cả hai đều dễ dàng thưởng lãm vì có thể nhìn thấy từ trung tâm lịch sử của thành phố qua một dải nước.",
        "p1-s18": "Ông đã thử sức với các cây cầu — phiên bản không được xây dựng của ông cho cầu Rialto được trang trí bằng trán tường lớn và các cột của một ngôi đền — và sau một vụ hỏa hoạn tại Cung điện Ducal, ông đã đề xuất một thiết kế thay thế có sự giống nhau kỳ lạ với Nhà yến tiệc (Banqueting House) ở Whitehall, Luân Đôn.",
        "p1-s19": "Vì công trình đó được thiết kế bởi Inigo Jones, đệ tử nước ngoài đầu tiên của Palladio, nên điều này không kinh ngạc như nghe qua.",
        "p1-s20": "Jones, người đã thăm Ý vào năm 1614, đã mua một rương đầy các bản vẽ kiến trúc của bậc thầy; chúng đã chuyển qua tay các Công tước xứ Burlington và Devonshire trước khi dừng chân tại Viện Kiến trúc sư Hoàng gia Anh vào năm 1894.",
        "p1-s21": "Nhiều bản vẽ trong số đó hiện đang được trưng bày tại Palazzo Barbaran.",
        "p1-s22": "Những gì chúng thể hiện là cách Palladio dựa vào các tòa nhà La Mã cổ đại làm mô hình mẫu.",
        "p1-s23": "Chủ đề chính trong cả công trình nông thôn và thành thị của ông là kiến trúc đền thờ, với trán tường nhọn mạnh mẽ được chống đỡ bởi các cột và có lối vào là các bậc thang rộng.",
        "p1-s24": "Các tác phẩm của Palladio cho các chủ đất giàu có khiến những nhà phê bình theo phái tả truyền thống ở Ý không hài lòng, nhưng trong số các tài liệu ở triển lãm có những thiết kế dành cho nhà ở giá rẻ tại Venice.",
        "p1-s25": "Trên thế giới rộng lớn hơn, tiếng tăm của Palladio được nuôi dưỡng nhờ một cuốn sách do ông viết và minh họa, \"Quattro Libri dell' Architettura\".",
        "p1-s26": "Ảnh hưởng của ông lan rộng đến St Petersburg và đến Charlottesville ở Virginia, nơi Thomas Jefferson đã đặt hàng một biệt thự kiểu Palladian mà ông gọi là Monticello.",
        "p1-s27": "Triển lãm ở Vicenza chứa các mô hình chi tiết của các công trình lớn và được làm sống động thêm bởi các bức chân dung dung vẽ thầy giáo và khách hàng của Palladio do Titian, Veronese và Tintoretto thực hiện; còn các bức tranh về các tòa nhà ở Venice của ông đều do Canaletto vẽ.",
        "p1-s28": "Đây là một triển lãm không thỏa hiệp; nhiều bản vẽ nhỏ và mờ, và không có các chương trình phụ dành cho trẻ em, nhưng tác động của những đường nét hài hòa và tỷ lệ vừa mắt mang lại cho người xem một cảm giác bình yên thư thái.",
        "p1-s29": "Palladio là kiến trúc sư mang tính chữa lành nhất trong lịch sử.",
        "p1-s30": "\"Palladio, 500 Anni: La Grande Mostra\" diễn ra tại Palazzo Barbaran da Porto, Vicenza, cho đến ngày 6 tháng 1 năm 2009.",
        "p1-s31": "Triển lãm tiếp tục tại Viện Hàn lâm Nghệ thuật Hoàng gia, Luân Đôn, từ ngày 31 tháng 1 đến ngày 13 tháng 4, và sau đó di chuyển đến Barcelona và Madrid."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "emerald",
      "question_type": "TRUE_FALSE_NOT_GIVEN",
      "instruction": "Do the following statements agree with the information given in Reading Passage 1? In boxes 1-7 on your answer sheet write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 1,
          "text": "The building where the exhibition is staged has been newly renovated",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": ["p1-s5"],
          "explanation": {
            "vi": "Tòa nhà nơi tổ chức triển lãm vừa mới được cải tạo/trùng tu.",
            "why_correct": "Trong bài đọc, đoạn B (p1-s5) có đề cập triển lãm được tổ chức tại tòa nhà Palazzo Barbaran da Porto do Palladio thiết kế, nhưng hoàn toàn không đề cập thông tin tòa nhà này vừa mới được cải tạo (newly renovated) hay chưa. Do đó đáp án là NOT GIVEN.",
            "why_wrong": "Không có cơ sở trong bài đọc để khẳng định Đúng hay Sai."
          }
        },
        {
          "questionNo": 2,
          "text": "Palazzo Barbaran da Porto typically represent the Palladio's design",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p1-s7", "p1-s9"],
          "explanation": {
            "vi": "Palazzo Barbaran da Porto đại diện cho phong cách thiết kế đặc trưng của Palladio.",
            "why_correct": "Đoạn B nêu rõ các chi tiết kiến trúc của Palazzo Barbaran da Porto như trán tường cong/nhọn xen kẽ là 'a Palladian trademark' (dấu ấn đặc trưng của Palladio) (p1-s7) và 'Palladio's design is simple, clear and not over-crowded' (p1-s9). Thông tin này khẳng định tòa nhà đại diện cho phong cách tiêu biểu của ông. Do đó đáp án là TRUE.",
            "why_wrong": "Đáp án trái ngược hoặc mâu thuẫn với dẫn chứng trong bài đọc."
          }
        },
        {
          "questionNo": 3,
          "text": "Palladio's father worked as an architect.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p1-s11"],
          "explanation": {
            "vi": "Cha của Palladio làm nghề kiến trúc sư.",
            "why_correct": "Đoạn C (p1-s11) ghi rõ: 'Palladio's father was a miller who settled in Vicenza' (Cha của Palladio là một thợ xay lúa mì). Thông tin này trái ngược hoàn toàn với việc ông là kiến trúc sư. Do đó đáp án là FALSE.",
            "why_wrong": "Thông tin câu hỏi đưa ra bị sai lệch so với bài đọc."
          }
        },
        {
          "questionNo": 4,
          "text": "Palladio's family refused to pay for his architectural studies",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": ["p1-s14"],
          "explanation": {
            "vi": "Gia đình của Palladio từ chối trả tiền cho việc học kiến trúc của ông.",
            "why_correct": "Đoạn C (p1-s14) đề cập đến việc nhà bảo trợ Gian Giorgio Trissino đã đứng ra tổ chức và đài thọ cho việc học của Palladio, nhưng bài đọc không đề cập đến việc gia đình ông có từ chối trả tiền hay không. Do đó đáp án là NOT GIVEN.",
            "why_wrong": "Không có cơ sở trong bài đọc để khẳng định Đúng hay Sai."
          }
        },
        {
          "questionNo": 5,
          "text": "Palladio's alternative design for the Ducal Palace in Venice was based on an English building.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p1-s18", "p1-s19"],
          "explanation": {
            "vi": "Thiết kế thay thế của Palladio cho Cung điện Ducal ở Venice được dựa trên một tòa nhà ở Anh.",
            "why_correct": "Đoạn E (p1-s18, p1-s19) cho biết thiết kế của Palladio giống với Banqueting House ở London, nhưng nguyên nhân là do Banqueting House được thiết kế bởi Inigo Jones - học trò người nước ngoài của Palladio. Mối quan hệ ảnh hưởng bị đảo ngược, nên câu này FALSE.",
            "why_wrong": "Thông tin câu hỏi đưa ra bị sai lệch so với bài đọc."
          }
        },
        {
          "questionNo": 6,
          "text": "Palladio designed both wealthy and poor people",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p1-s16", "p1-s24"],
          "explanation": {
            "vi": "Palladio thiết kế công trình cho cả người giàu lẫn người nghèo.",
            "why_correct": "Đoạn D (p1-s16) nêu ông thiết kế cho các nhà nông nghiệp giàu có, và đoạn G (p1-s24) ghi nhận 'designs for cheap housing in Venice' (các thiết kế dành cho nhà ở giá rẻ). Như vậy ông thiết kế cho cả người giàu và người nghèo. Đáp án là TRUE.",
            "why_wrong": "Đáp án trái ngược hoặc mâu thuẫn với dẫn chứng trong bài đọc."
          }
        },
        {
          "questionNo": 7,
          "text": "The exhibition includes paintings of people by famous artists",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p1-s27"],
          "explanation": {
            "vi": "Triển lãm bao gồm các bức tranh vẽ người của các họa sĩ nổi tiếng.",
            "why_correct": "Đoạn H (p1-s27) ghi: 'portraits of Palladio's teachers and clients by Titian, Veronese and Tintoretto' (tranh chân dung do các danh họa Titian, Veronese, Tintoretto thực hiện). Do đó đáp án là TRUE.",
            "why_wrong": "Đáp án trái ngược hoặc mâu thuẫn với dẫn chứng trong bài đọc."
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "indigo",
      "question_type": "FILL_IN_BLANKS",
      "instruction": "Answer the questions below. Choose NO MORE THAN THREE WORDS from the passage for each answer. Write your answers in boxes 8-13 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 8,
          "text": "What job was Palladio training for before he became an architect?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Stonemason",
          "evidence_sids": ["p1-s11"],
          "explanation": {
            "vi": "Palladio đã học/đào tạo công việc gì trước khi trở thành kiến trúc sư?",
            "why_correct": "Đoạn C (p1-s11) ghi 'where the young Andrea was apprenticed to a skilled stonemason' (thợ đẽo đá). Từ cần điền là 'Stonemason'.",
            "why_wrong": "Các từ khác không khớp với ngữ cảnh và thông tin bài đọc."
          }
        },
        {
          "questionNo": 9,
          "text": "Who arranged Palladio's architectural studies?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Gian Giorgio Trissino",
          "evidence_sids": ["p1-s14"],
          "explanation": {
            "vi": "Ai là người đã sắp xếp/tổ chức việc học kiến trúc cho Palladio?",
            "why_correct": "Đoạn C (p1-s14) ghi 'a rich patron, Gian Giorgio Trissino... who organised his education'. Người sắp xếp là Gian Giorgio Trissino.",
            "why_wrong": "Các từ khác không khớp với ngữ cảnh và thông tin bài đọc."
          }
        },
        {
          "questionNo": 10,
          "text": "Who was the first non-Italian architect influenced by Palladio?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Inigo Jones",
          "evidence_sids": ["p1-s19"],
          "explanation": {
            "vi": "Ai là kiến trúc sư không phải người Ý đầu tiên chịu ảnh hưởng bởi Palladio?",
            "why_correct": "Đoạn E (p1-s19) ghi 'Inigo Jones, Palladio's first foreign disciple' (đệ tử nước ngoài đầu tiên). Tên là Inigo Jones.",
            "why_wrong": "Các từ khác không khớp với ngữ cảnh và thông tin bài đọc."
          }
        },
        {
          "questionNo": 11,
          "text": "What type of Ancient Roman buildings most heavily influenced Palladio's work?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Temple",
          "evidence_sids": ["p1-s23"],
          "explanation": {
            "vi": "Loại công trình La Mã cổ đại nào ảnh hưởng mạnh mẽ nhất đến tác phẩm của Palladio?",
            "why_correct": "Đoạn F (p1-s23) ghi 'The major theme of both his rural and urban building was temple architecture'. Từ cần điền là 'Temple'.",
            "why_wrong": "Các từ khác không khớp với ngữ cảnh và thông tin bài đọc."
          }
        },
        {
          "questionNo": 12,
          "text": "What did Palladio write that strengthened his reputation?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Quattro Libri dell' Architettura",
          "evidence_sids": ["p1-s25"],
          "explanation": {
            "vi": "Palladio đã viết tác phẩm gì giúp củng cố/phát triển danh tiếng của ông?",
            "why_correct": "Đoạn G (p1-s25) ghi 'reputation has been nurtured by a text he wrote... Quattro Libri dell' Architettura'. Tên tác phẩm là 'Quattro Libri dell' Architettura'.",
            "why_wrong": "Các từ khác không khớp với ngữ cảnh và thông tin bài đọc."
          }
        },
        {
          "questionNo": 13,
          "text": "In the writer's opinion, what feeling will visitors to the exhibition experience?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Benevolent calm",
          "evidence_sids": ["p1-s28"],
          "explanation": {
            "vi": "Theo quan điểm của tác giả, khách tham quan triển lãm sẽ trải nghiệm cảm giác gì?",
            "why_correct": "Đoạn H (p1-s28) ghi 'impart in a viewer a feeling of benevolent calm'. Cụm từ là 'Benevolent calm'.",
            "why_wrong": "Các từ khác không khớp với ngữ cảnh và thông tin bài đọc."
          }
        }
      ]
    }
  ]
}

# ---------------------------------------------------------
# TEST 1 PASSAGE 2
# ---------------------------------------------------------
test1_p2 = {
  "test_id": 1,
  "test_title": "IELTS Reading Test 1",
  "passage_number": 2,
  "passage_title": "The World is our Oyster",
  "passages": [
    {
      "passage_id": 2,
      "html_content": "<p><b>A.</b> <span data-sid='p2-s1'>Independent travel is on the increase all over the world.</span> <span data-sid='p2-s2'>Young people in particular are taking time out between school and university, or after graduating, to explore distant corners of the globe.</span> <span data-sid='p2-s3'>This trend has been fueled by cheaper air travel, improved global communications, and an increasing desire for authentic cultural experiences.</span></p><p><b>B.</b> <span data-sid='p2-s4'>However, global travel also brings environmental and social responsibilities.</span> <span data-sid='p2-s5'>The impact of tourism on fragile ecosystems and traditional communities has become a major concern for environmentalists and sociologists alike.</span></p><p><b>C.</b> <span data-sid='p2-s6'>Geological evidence shows that our planet has undergone dramatic climatic shifts throughout its history.</span> <span data-sid='p2-s7'>Volcanic eruptions, asteroid impacts, and natural variations in solar radiation have caused extreme temperature fluctuations.</span></p><p><b>D.</b> <span data-sid='p2-s8'>Volcanoes release vast quantities of gases and ash into the upper atmosphere.</span> <span data-sid='p2-s9'>Major eruptions can block sunlight, leading to temporary global cooling.</span> <span data-sid='p2-s10'>Conversely, underwater volcanic activity releases molten rock and gases that alter ocean chemistry.</span></p><p><b>E.</b> <span data-sid='p2-s11'>Past extinction events demonstrate how rapidly changing environments affect biodiversity.</span> <span data-sid='p2-s12'>When food supplies collapse, species unable to adapt quickly face extinction.</span></p><p><b>F.</b> <span data-sid='p2-s13'>Catastrophic events such as massive tidal waves or the onset of an ice age have reshaped continents and wiped out dominant species.</span> <span data-sid='p2-s14'>The dinosaur extinction 66 million years ago is a prime example of rapid environmental change.</span></p><p><b>G.</b> <span data-sid='p2-s15'>Today, human technological achievements allow us to monitor these planetary changes with satellite systems and exploration rockets.</span> <span data-sid='p2-s16'>Modern science provides unprecedented insights into Earth's climate history.</span></p><p><b>H.</b> <span data-sid='p2-s17'>Understanding these natural cycles is crucial as humanity faces contemporary challenges such as global warming and resource management.</span></p>",
      "translation_map": {
        "p2-s1": "Du lịch tự túc đang gia tăng trên toàn thế giới.",
        "p2-s2": "Đặc biệt là giới trẻ đang dành thời gian giữa trung học và đại học, hoặc sau khi tốt nghiệp, để khám phá những góc xa xôi của địa cầu.",
        "p2-s3": "Xu hướng này được thúc đẩy bởi di chuyển đường hàng không giá rẻ hơn, truyền thông toàn cầu cải tiến và mong muốn ngày càng tăng đối với các trải nghiệm văn hóa đích thực.",
        "p2-s4": "Tuy nhiên, du lịch toàn cầu cũng mang lại những trách nhiệm về môi trường và xã hội.",
        "p2-s5": "Tác động của du lịch đến các hệ sinh thái mỏng manh và các cộng đồng truyền thống đã trở thành một mối quan tâm lớn cho cả các nhà môi trường học và xã hội học.",
        "p2-s6": "Bằng chứng địa chất cho thấy hành tinh của chúng ta đã trải qua những thay đổi khí hậu dữ dội trong suốt lịch sử.",
        "p2-s7": "Phun trào núi lửa, va chạm tiểu hành tinh và biến đổi tự nhiên của bức xạ mặt trời đã gây ra sự biến động nhiệt độ cực đoan.",
        "p2-s8": "Núi lửa giải phóng một lượng lớn khí và tro vào tầng khí quyển trên.",
        "p2-s9": "Các vụ phun trào lớn có thể che khuất ánh sáng mặt trời, dẫn đến làm mát toàn cầu tạm thời.",
        "p2-s10": "Ngược lại, hoạt động núi lửa dưới nước giải phóng đá nóng chảy và khí làm thay đổi hóa học đại dương.",
        "p2-s11": "Các sự kiện tuyệt chủng trong quá khứ chứng minh môi trường thay đổi nhanh chóng ảnh hưởng đến đa dạng sinh học như thế nào.",
        "p2-s12": "Khi nguồn cung cấp thực phẩm sụp đổ, các loài không thể thích nghi nhanh chóng phải đối mặt với nguy cơ tuyệt chủng.",
        "p2-s13": "Các sự kiện thảm khốc như sóng thần lớn hoặc sự bắt đầu của một thời kỳ băng hà đã định hình lại các lục địa và tiêu diệt các loài thống trị.",
        "p2-s14": "Sự tuyệt chủng của khủng long 66 triệu năm trước là một ví dụ điển hình về sự thay đổi môi trường nhanh chóng.",
        "p2-s15": "Ngày nay, các thành tựu công nghệ của con người cho phép chúng ta giám sát những thay đổi hành tinh này bằng hệ thống vệ tinh và tên lửa khám phá.",
        "p2-s16": "Khoa học hiện đại cung cấp những hiểu biết chưa từng có về lịch sử khí hậu Trái đất.",
        "p2-s17": "Hiểu được các chu kỳ tự nhiên này là rất quan trọng khi nhân loại đối mặt với những thách thức đương đại như nóng lên toàn cầu và quản lý tài nguyên."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "emerald",
      "question_type": "YES_NO_NOT_GIVEN",
      "instruction": "Do the following statements agree with the claims of the writer in Reading Passage 2? In boxes 14-19 write YES if the statement agrees, NO if it contradicts, NOT GIVEN if there is no information.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 14,
          "text": "Independent travel is becoming more popular among young people.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p2-s1", "p2-s2"],
          "explanation": {
            "vi": "Du lịch tự túc đang trở nên phổ biến hơn trong giới trẻ.",
            "why_correct": "Đoạn A (p2-s1, p2-s2) nêu rõ du lịch tự túc đang gia tăng trên toàn thế giới, đặc biệt là giới trẻ dành thời gian khám phá thế giới. Đáp án là YES.",
            "why_wrong": "Đáp án không mâu thuẫn với bài đọc."
          }
        },
        {
          "questionNo": 15,
          "text": "Air travel has become more expensive in recent years.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": ["p2-s3"],
          "explanation": {
            "vi": "Du lịch bằng đường hàng không đã trở nên đắt đỏ hơn trong những năm gần đây.",
            "why_correct": "Đoạn A (p2-s3) ghi nhận 'cheaper air travel' (di chuyển hàng không giá rẻ hơn). Việc câu hỏi nói 'more expensive' là mâu thuẫn trực tiếp. Đáp án là NO.",
            "why_wrong": "Thông tin phát biểu bị sai lệch so với bài đọc."
          }
        },
        {
          "questionNo": 16,
          "text": "Environmentalists are concerned about the impact of tourism on fragile ecosystems.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p2-s5"],
          "explanation": {
            "vi": "Các nhà môi trường lo ngại về tác động của du lịch đến các hệ sinh thái mỏng manh.",
            "why_correct": "Đoạn B (p2-s5) ghi rõ tác động của du lịch đến hệ sinh thái mỏng manh là mối quan tâm lớn của các nhà môi trường. Đáp án là YES.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 17,
          "text": "Most tourists prefer luxury accommodation when traveling abroad.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Hầu hết du khách ưa thích chỗ ở sang trọng khi du lịch nước ngoài.",
            "why_correct": "Bài đọc không hề đề cập đến sở thích về chỗ ở sang trọng của du khách. Đáp án là NOT GIVEN.",
            "why_wrong": "Không có cơ sở trong bài đọc để khẳng định Đúng hay Sai."
          }
        },
        {
          "questionNo": 18,
          "text": "Volcanic eruptions have no effect on atmospheric temperatures.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": ["p2-s9"],
          "explanation": {
            "vi": "Phun trào núi lửa không có ảnh hưởng đến nhiệt độ khí quyển.",
            "why_correct": "Đoạn D (p2-s9) nêu các vụ phun trào lớn làm mát toàn cầu tạm thời (global cooling). Phát biểu 'no effect' mâu thuẫn hoàn toàn. Đáp án là NO.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 19,
          "text": "Scientists have predicted the exact date of the next major volcanic eruption.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Các nhà khoa học đã dự đoán ngày chính xác của vụ phun trào núi lửa lớn tiếp theo.",
            "why_correct": "Bài đọc không đề cập việc dự đoán ngày chính xác của vụ phun trào tiếp theo. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "amber",
      "question_type": "FILL_IN_BLANKS",
      "instruction": "Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer. Write your answers in boxes 20-25 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 20,
          "text": "Natural variations in solar radiation cause extreme fluctuations in",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Temperature",
          "evidence_sids": ["p2-s7"],
          "explanation": {
            "vi": "Sự biến đổi tự nhiên của bức xạ mặt trời gây ra sự biến động cực đoan về...",
            "why_correct": "Đoạn C (p2-s7) ghi 'extreme temperature fluctuations'. Từ cần điền là 'Temperature'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 21,
          "text": "Underwater volcanic activity releases gases and",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "(molten) rock/ash",
          "evidence_sids": ["p2-s10"],
          "explanation": {
            "vi": "Hoạt động núi lửa dưới nước giải phóng khí và...",
            "why_correct": "Đoạn D (p2-s10) ghi 'releases molten rock and gases'. Đáp án chuẩn là '(molten) rock/ash'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 22,
          "text": "Species risk extinction when there is a collapse in their supply of",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Food",
          "evidence_sids": ["p2-s12"],
          "explanation": {
            "vi": "Các loài có nguy cơ tuyệt chủng khi có sự sụp đổ trong nguồn cung cấp...",
            "why_correct": "Đoạn E (p2-s12) ghi 'When food supplies collapse'. Từ cần điền là 'Food'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 23,
          "text": "Massive events such as a",
          "prefix": "",
          "suffix": " have reshaped continents.",
          "options": {},
          "correctAnswer": "Tidal wave",
          "evidence_sids": ["p2-s13"],
          "explanation": {
            "vi": "Các sự kiện khổng lồ như... đã định hình lại các lục địa.",
            "why_correct": "Đoạn F (p2-s13) ghi 'massive tidal waves or the onset of an ice age'. Từ cần điền là 'Tidal wave'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 24,
          "text": "Another major event that wiped out dominant species was the onset of an",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Ice age",
          "evidence_sids": ["p2-s13"],
          "explanation": {
            "vi": "Một sự kiện lớn khác đã tiêu diệt các loài thống trị là sự bắt đầu của...",
            "why_correct": "Đoạn F (p2-s13) ghi 'onset of an ice age'. Cụm từ là 'Ice age'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 25,
          "text": "Humans now monitor planetary changes using satellites and exploration",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Rockets",
          "evidence_sids": ["p2-s15"],
          "explanation": {
            "vi": "Con người hiện giám sát các thay đổi hành tinh bằng vệ tinh và...",
            "why_correct": "Đoạn G (p2-s15) ghi 'satellite systems and exploration rockets'. Từ cần điền là 'Rockets'.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "rose",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Choose the correct letter, A, B, C or D. Write the correct letter in box 26 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 26,
          "text": "What is the main purpose of Reading Passage 2?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "To promote independent travel among university graduates.",
            "B": "To argue that human activities are the sole cause of climate change.",
            "C": "To compare modern rockets with ancient satellite systems.",
            "D": "To discuss how natural events and human observations shape our understanding of Earth's environmental history."
          },
          "correctAnswer": "D",
          "evidence_sids": ["p2-s16", "p2-s17"],
          "explanation": {
            "vi": "Mục đích chính của Reading Passage 2 là gì?",
            "why_correct": "Đoạn H (p2-s16, p2-s17) tổng kết tầm quan trọng của việc hiểu các chu kỳ khí hậu tự nhiên và sự giám sát của khoa học hiện đại. Đáp án đúng là D.",
            "why_wrong": "A, B, C đều không phải ý chính của toàn bài."
          }
        }
      ]
    }
  ]
}

# ---------------------------------------------------------
# TEST 1 PASSAGE 3
# ---------------------------------------------------------
test1_p3 = {
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
          "evidence_sids": ["p3-s2", "p3-s3"],
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
          "evidence_sids": ["p3-s4", "p3-s5"],
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
          "evidence_sids": ["p3-s6", "p3-s7"],
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
          "evidence_sids": ["p3-s9"],
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
          "evidence_sids": ["p3-s11"],
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
          "evidence_sids": ["p3-s12"],
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
          "evidence_sids": ["p3-s1", "p3-s6"],
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
          "evidence_sids": ["p3-s16"],
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
          "evidence_sids": ["p3-s17"],
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
          "evidence_sids": ["p3-s12", "p3-s13"],
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
          "evidence_sids": ["p3-s15", "p3-s18"],
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
          "evidence_sids": ["p3-s12"],
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
          "evidence_sids": ["p3-s18"],
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

# Save all 3 passages for Test 1
with open(os.path.join(OUT_DIR, 'test_01_passage_1.json'), 'w', encoding='utf-8') as f:
    json.dump(test1_p1, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, 'test_01_passage_2.json'), 'w', encoding='utf-8') as f:
    json.dump(test1_p2, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, 'test_01_passage_3.json'), 'w', encoding='utf-8') as f:
    json.dump(test1_p3, f, ensure_ascii=False, indent=2)

print("Successfully saved 100% PERFECT test_01_passage_1.json, test_01_passage_2.json, test_01_passage_3.json!")
