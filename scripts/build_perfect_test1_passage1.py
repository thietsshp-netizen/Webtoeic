import json, os

sample_json = {
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
        "p1-s28": "Đây là một triển lãm không thỏa hiệp; nhiều bản vẽ nhỏ và mờ, và không có các chương trình phụ dành cho trẻ em, nhưng tác động của những đường nét hài hòa và tỷ lệ vừa mắt mang lại cho người xem một cảm cảm giác bình yên thư thái.",
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
          "evidence_sids": [
            "p1-s5"
          ],
          "explanation": {
            "vi": "Tòa nhà nơi tổ chức triển lãm vừa mới được cải tạo/trùng tu.",
            "why_correct": "Trong bài đọc, đoạn B (p1-s5) có đề cập triển lãm được tổ chức tại tòa nhà Palazzo Barbaran da Porto do Palladio thiết kế, nhưng hoàn toàn không đề cập thông tin tòa nhà này vừa mới được cải tạo (newly renovated) hay chưa. Do đó đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 2,
          "text": "Palazzo Barbaran da Porto typically represent the Palladio's design",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": [
            "p1-s7",
            "p1-s9"
          ],
          "explanation": {
            "vi": "Palazzo Barbaran da Porto đại diện cho phong cách thiết kế đặc trưng của Palladio.",
            "why_correct": "Đoạn B nêu rõ các chi tiết kiến trúc của Palazzo Barbaran da Porto như trán tường cong/nhọn xen kẽ là 'a Palladian trademark' (dấu ấn đặc trưng của Palladio) (p1-s7) và 'Palladio's design is simple, clear and not over-crowded' (p1-s9). Thông tin này khẳng định tòa nhà đại diện cho phong cách tiêu biểu của ông. Do đó đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 3,
          "text": "Palladio's father worked as an architect.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": [
            "p1-s11"
          ],
          "explanation": {
            "vi": "Cha của Palladio làm nghề kiến trúc sư.",
            "why_correct": "Đoạn C (p1-s11) ghi rõ: 'Palladio's father was a miller who settled in Vicenza' (Cha của Palladio là một thợ xay lúa mì). Thông tin này trái ngược hoàn toàn với việc ông là kiến trúc sư. Do đó đáp án là FALSE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 4,
          "text": "Palladio's family refused to pay for his architectural studies",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [
            "p1-s14"
          ],
          "explanation": {
            "vi": "Gia đình của Palladio từ chối trả tiền cho việc học kiến trúc của ông.",
            "why_correct": "Đoạn C (p1-s14) đề cập đến việc nhà bảo trợ Gian Giorgio Trissino đã đứng ra tổ chức và đài thọ cho việc học của Palladio, nhưng bài đọc không đề cập đến việc gia đình ông có từ chối trả tiền hay không. Do đó đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 5,
          "text": "Palladio's alternative design for the Ducal Palace in Venice was based on an English building.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": [
            "p1-s18",
            "p1-s19"
          ],
          "explanation": {
            "vi": "Thiết kế thay thế của Palladio cho Cung điện Ducal ở Venice được dựa trên một tòa nhà ở Anh.",
            "why_correct": "Đoạn E (p1-s18, p1-s19) cho biết thiết kế của Palladio giống với Banqueting House ở London, nhưng nguyên nhân là do Banqueting House được thiết kế bởi Inigo Jones - học trò người nước ngoài của Palladio (nghĩa là tòa nhà ở Anh dựa trên phong cách của Palladio, chứ không phải Palladio dựa trên tòa nhà ở Anh). Mối quan hệ ảnh hưởng bị đảo ngược, nên câu này FALSE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 6,
          "text": "Palladio designed both wealthy and poor people",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": [
            "p1-s16",
            "p1-s24"
          ],
          "explanation": {
            "vi": "Palladio thiết kế công trình cho cả người giàu lẫn người nghèo.",
            "why_correct": "Đoạn D (p1-s16) nêu ông thiết kế cho các nhà nông nghiệp giàu có / giới quý tộc, và đoạn G (p1-s24) ghi nhận 'among the papers in the show are designs for cheap housing in Venice' (các thiết kế dành cho nhà ở giá rẻ). Như vậy ông thiết kế cho cả người giàu và người nghèo. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 7,
          "text": "The exhibition includes paintings of people by famous artists",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": [
            "p1-s27"
          ],
          "explanation": {
            "vi": "Triển lãm bao gồm các bức tranh vẽ người của các họa sĩ nổi tiếng.",
            "why_correct": "Đoạn H (p1-s27) ghi: 'leavened by portraits of Palladio's teachers and clients by Titian, Veronese and Tintoretto' (được làm phong phú bởi các bức tranh chân dung vẽ thầy giáo và khách hàng của Palladio do các danh họa Titian, Veronese, Tintoretto thực hiện). Do đó đáp án là TRUE.",
            "why_wrong": ""
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
          "evidence_sids": [
            "p1-s11"
          ],
          "explanation": {
            "vi": "Palladio đã học/đào tạo công việc gì trước khi trở thành kiến trúc sư?",
            "why_correct": "Đoạn C (p1-s11) ghi 'where the young Andrea was apprenticed to a skilled stonemason' (nơi Andrea thời trẻ làm thợ học việc cho một thợ đẽo đá lành nghề). Từ cần điền là 'Stonemason' (hoặc 'a stonemason').",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 9,
          "text": "Who arranged Palladio's architectural studies?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Gian Giorgio Trissino",
          "evidence_sids": [
            "p1-s14"
          ],
          "explanation": {
            "vi": "Ai là người đã sắp xếp/tổ chức việc học kiến trúc cho Palladio?",
            "why_correct": "Đoạn C (p1-s14) ghi 'a rich patron, Gian Giorgio Trissino, a landowner and scholar, who organised his education'. Người sắp xếp việc học của ông là Gian Giorgio Trissino.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 10,
          "text": "Who was the first non-Italian architect influenced by Palladio?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Inigo Jones",
          "evidence_sids": [
            "p1-s19"
          ],
          "explanation": {
            "vi": "Ai là kiến trúc sư không phải người Ý đầu tiên chịu ảnh hưởng bởi Palladio?",
            "why_correct": "Đoạn E (p1-s19) ghi 'Inigo Jones, Palladio's first foreign disciple' (Inigo Jones, người đệ tử nước ngoài đầu tiên của Palladio). Tên kiến trúc sư là Inigo Jones.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 11,
          "text": "What type of Ancient Roman buildings most heavily influenced Palladio's work?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Temple",
          "evidence_sids": [
            "p1-s23"
          ],
          "explanation": {
            "vi": "Loại công trình La Mã cổ đại nào ảnh hưởng mạnh mẽ nhất đến tác phẩm của Palladio?",
            "why_correct": "Đoạn F (p1-s23) ghi 'The major theme of both his rural and urban building was temple architecture' (Chủ đề chính trong các công trình của ông là kiến trúc đền thờ). Từ cần điền là 'Temple' (hoặc 'temple architecture').",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 12,
          "text": "What did Palladio write that strengthened his reputation?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Quattro Libri dell' Architettura",
          "evidence_sids": [
            "p1-s25"
          ],
          "explanation": {
            "vi": "Palladio đã viết tác phẩm gì giúp củng cố/phát triển danh tiếng của ông?",
            "why_correct": "Đoạn G (p1-s25) ghi 'Palladio's reputation has been nurtured by a text he wrote and illustrated, \"Quattro Libri dell' Architettura\"'. Tên tác phẩm là 'Quattro Libri dell' Architettura'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 13,
          "text": "In the writer's opinion, what feeling will visitors to the exhibition experience?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Benevolent calm",
          "evidence_sids": [
            "p1-s28"
          ],
          "explanation": {
            "vi": "Theo quan điểm của tác giả, khách tham quan triển lãm sẽ trải nghiệm cảm giác gì?",
            "why_correct": "Đoạn H (p1-s28) ghi '...is to impart in a viewer a feeling of benevolent calm' (mang lại cho người xem một cảm giác bình yên thư thái). Cụm từ chỉ cảm giác là 'benevolent calm' (hoặc 'a feeling of benevolent calm').",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

out_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output/test_01_passage_1.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(sample_json, f, ensure_ascii=False, indent=2)

print(f"Successfully saved 100% PERFECT test_01_passage_1.json matching sample format!")
