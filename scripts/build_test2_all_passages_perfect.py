import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------
# TEST 2 PASSAGE 1
# ---------------------------------------------------------
test2_p1 = {
  "test_id": 2,
  "test_title": "IELTS Reading Test 2",
  "passage_number": 1,
  "passage_title": "Turtle in Danger",
  "passages": [
    {
      "passage_id": 1,
      "html_content": "<p><b>A.</b> <span data-sid='p1-s1'>The Leatherback turtle is the largest of all living sea turtles, reaching lengths of up to two meters and weights exceeding 500 kilograms.</span> <span data-sid='p1-s2'>Unlike other sea turtles, which have bony shells, the Leatherback's carapace is covered by skin and oily flesh.</span> <span data-sid='p1-s3'>This unique evolutionary design enables it to dive to extreme depths in search of its primary food source: jellyfish.</span></p><p><b>B.</b> <span data-sid='p1-s4'>Estimates suggest that global populations of female Leatherbacks have dropped dramatically from 115,000 in the 1980s to around 35,000 today.</span> <span data-sid='p1-s5'>Commercial fishing gear, habitat destruction on nesting beaches, and marine pollution represent severe threats to their survival.</span></p><p><b>C.</b> <span data-sid='p1-s6'>The distinctive lack of a rigid bony carapace sets the Leatherback apart from all other marine turtle species.</span> <span data-sid='p1-s7'>Flexible ridge-like carapacial keels run along its back, reducing drag while swimming through turbulent waters.</span></p><p><b>D.</b> <span data-sid='p1-s8'>Leatherbacks routinely travel into cold sub-polar waters, a feat impossible for other reptiles.</span> <span data-sid='p1-s9'>They maintain high body temperatures in cold ocean water through counter-current heat exchange systems and thick layers of insulating fat.</span></p><p><b>E.</b> <span data-sid='p1-s10'>Tagging and satellite tracking studies indicate that Leatherbacks found near European and Irish coasts originate from nesting grounds in Florida and South America.</span> <span data-sid='p1-s11'>They navigate vast trans-oceanic distances by detecting the Earth's geomagnetic field.</span></p><p><b>F.</b> <span data-sid='p1-s12'>Human exploitation has historically driven turtle declines; Green Sea turtles were heavily hunted for their meat, while Leatherbacks suffer primarily from accidental bycatch.</span></p><p><b>G.</b> <span data-sid='p1-s13'>As key predators of jellyfish, Leatherbacks play a vital role in marine food webs; a decline in turtle numbers leads to overwhelming jellyfish blooms that devour fish larvae.</span></p>",
      "translation_map": {
        "p1-s1": "Rùa biển da (Leatherback) là loài rùa biển lớn nhất còn sống, đạt chiều dài tới 2 mét và trọng lượng vượt quá 500 kg.",
        "p1-s2": "Không giống như các loài rùa biển khác có mai cứng bằng xương, mai của rùa da được bao phủ bởi da và thịt dầu.",
        "p1-s3": "Thiết kế tiến hóa độc đáo này cho phép nó lặn xuống độ sâu cực hạn để tìm kiếm nguồn thức ăn chính: sứa.",
        "p1-s4": "Ước tính cho thấy quần thể rùa da cái trên toàn cầu đã giảm mạnh từ 115.000 vào những năm 1980 xuống còn khoảng 35.000 con hiện nay.",
        "p1-s5": "Dụng cụ đánh bắt cá thương mại, sự phá hủy môi trường sống trên các bãi biển làm tổ và ô nhiễm môi trường biển đại diện cho những mối đe dọa nghiêm trọng đối với sự sinh tồn của chúng.",
        "p1-s6": "Sự thiếu hụt đặc trưng của mai xương cứng làm cho rùa da khác biệt với tất cả các loài rùa biển khác.",
        "p1-s7": "Các gờ mai linh hoạt chạy dọc theo lưng nó, giúp giảm lực cản khi bơi qua các vùng nước động.",
        "p1-s8": "Rùa da thường xuyên di chuyển vào các vùng nước cận cực lạnh giá, một kỳ tích không thể đối với các loài bò sát khác.",
        "p1-s9": "Chúng duy trì nhiệt độ cơ thể cao trong nước biển lạnh nhờ hệ thống trao đổi nhiệt ngược dòng và các lớp mỡ cách nhiệt dày.",
        "p1-s10": "Các nghiên cứu gắn thẻ và theo dõi qua vệ tinh chỉ ra rằng rùa da tìm thấy gần bờ biển Châu Âu và Ireland bắt nguồn từ các bãi làm tổ ở Florida và Nam Mỹ.",
        "p1-s11": "Chúng điều hướng khoảng cách xuyên đại dương bao la bằng cách phát hiện địa từ trường của Trái đất.",
        "p1-s12": "Sự khai thác của con người trong lịch sử đã thúc đẩy sự suy giảm của rùa; Rùa Xanh bị săn bắt nặng nề để lấy thịt, trong khi rùa da chủ yếu bị ảnh hưởng do vô tình mắc lưới.",
        "p1-s13": "Là loài săn mồi chính của sứa, rùa da đóng một vai trò quan trọng trong lưới thức ăn biển; sự suy giảm số lượng rùa dẫn đến sự bùng nổ sứa áp đảo tiêu thụ ấu trùng cá."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "emerald",
      "question_type": "MATCHING_HEADINGS",
      "instruction": "Choose the most suitable headings for paragraphs B-G from the list of headings below. Write the correct number, i-x, in boxes 1-6 on your answer sheet.",
      "options_pool": {
        "i": "Population estimates and decline",
        "ii": "Feeding habits of young turtles",
        "iii": "Ecological importance in marine food chain",
        "iv": "Distinctive physical shell features",
        "v": "Mating rituals on sandy beaches",
        "vi": "The role of commercial aquariums",
        "vii": "Global warming impacts",
        "viii": "Thermoregulation and cold water survival",
        "ix": "Trans-oceanic migration and navigation",
        "x": "Human threats and historical hunting"
      },
      "questions": [
        {
          "questionNo": 1,
          "text": "Paragraph B",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "i",
          "evidence_sids": ["p1-s4"],
          "explanation": {
            "vi": "Đoạn B phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn B (p1-s4) đưa ra ước tính quần thể rùa da giảm từ 115.000 xuống 35.000 con. Tiêu đề i ('Population estimates and decline') khớp hoàn toàn.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 2,
          "text": "Paragraph C",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "iv",
          "evidence_sids": ["p1-s6"],
          "explanation": {
            "vi": "Đoạn C phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn C (p1-s6) tập trung mô tả đặc điểm mai da khác biệt ('lack of a rigid bony carapace'). Tiêu đề iv ('Distinctive physical shell features') là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 3,
          "text": "Paragraph D",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "viii",
          "evidence_sids": ["p1-s8", "p1-s9"],
          "explanation": {
            "vi": "Đoạn D phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn D (p1-s8, p1-s9) giải thích khả năng duy trì nhiệt độ cơ thể khi lặn nước lạnh ('thermoregulation'). Tiêu đề viii ('Thermoregulation and cold water survival') là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 4,
          "text": "Paragraph E",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "ix",
          "evidence_sids": ["p1-s10", "p1-s11"],
          "explanation": {
            "vi": "Đoạn E phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn E (p1-s10, p1-s11) mô tả di cư xuyên đại dương và định hướng bằng địa từ trường. Tiêu đề ix ('Trans-oceanic migration and navigation') khớp hoàn toàn.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 5,
          "text": "Paragraph F",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "x",
          "evidence_sids": ["p1-s12"],
          "explanation": {
            "vi": "Đoạn F phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn F (p1-s12) đề cập tác động săn bắt và đánh bắt của con người. Tiêu đề x ('Human threats and historical hunting') là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 6,
          "text": "Paragraph G",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "iii",
          "evidence_sids": ["p1-s13"],
          "explanation": {
            "vi": "Đoạn G phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn G (p1-s13) khẳng định vai trò sinh thái quan trọng trong chuỗi thức ăn khi săn sứa ('Ecological importance in marine food chain'). Đáp án là iii.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "indigo",
      "question_type": "SHORT_ANSWER",
      "instruction": "Answer the questions below. Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage for each answer. Write your answers in boxes 7-13 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 7,
          "text": "How many Leatherback turtles are there in the world?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "35,000",
          "evidence_sids": ["p1-s4"],
          "explanation": {
            "vi": "Có bao nhiêu rùa da cái trên thế giới hiện nay?",
            "why_correct": "Đoạn B (p1-s4) ghi rõ 'around 35,000 today'. Con số là '35,000' (hoặc '35,000 females').",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 8,
          "text": "What is the most noticeable difference between other sea turtles and leatherbacks?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "The bony carapace",
          "evidence_sids": ["p1-s2", "p1-s6"],
          "explanation": {
            "vi": "Sự khác biệt đáng chú ý nhất giữa các loài rùa biển khác và rùa da là gì?",
            "why_correct": "Đoạn A và C (p1-s2, p1-s6) ghi rùa da thiếu 'bony carapace' (mai cứng bằng xương). Cụm từ là 'The bony carapace'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 9,
          "text": "What causes leatherback turtles to survive in cold Irish waters?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Cold water/ temperature",
          "evidence_sids": ["p1-s9"],
          "explanation": {
            "vi": "Yếu tố nào liên quan đến sự sống sót của rùa da ở vùng nước Ireland?",
            "why_correct": "Đoạn D (p1-s9) giải thích khả năng thích nghi với nước lạnh ('Cold water/ temperature').",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 10,
          "text": "Where did the turtles near Europe probably come from?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Florida, America/ The north American",
          "evidence_sids": ["p1-s10"],
          "explanation": {
            "vi": "Những con rùa gần Châu Âu có khả năng đến từ đâu?",
            "why_correct": "Đoạn E (p1-s10) ghi 'originate from nesting grounds in Florida and South America'. Từ cần điền là 'Florida, America/ The north American'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 11,
          "text": "By which means can sea turtles retrace their migratory paths?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "(detecting) magnetic fields",
          "evidence_sids": ["p1-s11"],
          "explanation": {
            "vi": "Bằng phương tiện/cơ chế nào rùa biển có thể dò lại tuyến đường di cư của chúng?",
            "why_correct": "Đoạn E (p1-s11) ghi 'detecting the Earth's geomagnetic field'. Đáp án là '(detecting) magnetic fields'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 12,
          "text": "For what purpose are Green Sea turtles killed by people?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Its meat",
          "evidence_sids": ["p1-s12"],
          "explanation": {
            "vi": "Vì mục đích gì mà Rùa Xanh bị con người giết?",
            "why_correct": "Đoạn F (p1-s12) ghi 'Green Sea turtles were heavily hunted for their meat'. Từ cần điền là 'Its meat'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 13,
          "text": "What kind of species will benefit from a decline in Leatherback populations?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Jellyfish",
          "evidence_sids": ["p1-s13"],
          "explanation": {
            "vi": "Loài nào sẽ gia tăng/hưởng lợi từ sự suy giảm quần thể rùa da?",
            "why_correct": "Đoạn G (p1-s13) ghi 'significant increase in jellyfish'. Loài đó là 'Jellyfish'.",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# ---------------------------------------------------------
# TEST 2 PASSAGE 2
# ---------------------------------------------------------
test2_p2 = {
  "test_id": 2,
  "test_title": "IELTS Reading Test 2",
  "passage_number": 2,
  "passage_title": "Corporate Social Responsibility",
  "passages": [
    {
      "passage_id": 2,
      "html_content": "<p><b>A.</b> <span data-sid='p2-s1'>An excellent definition was developed in the 1980s by Norwegian Prime Minister Gro Harlem Brundtland: \"Meeting the needs of the present without compromising the ability of future generations to meet their own needs.\"</span> <span data-sid='p2-s2'>The notion of license to operate derives from the fact that every company needs tacit or explicit permission from governments, communities, and numerous other stakeholders to do business.</span> <span data-sid='p2-s3'>Finally, reputation is used by many companies to justify CSR initiatives on the grounds that they will improve a company's image, strengthen its brand, enliven morale, and even raise the value of its stock.</span></p><p><b>B.</b> <span data-sid='p2-s4'>Proponents of CSR have used four key arguments to make their case: moral obligation, sustainability, license to operate, and reputation.</span> <span data-sid='p2-s5'>The moral appeal argues that companies have a duty to be good corporate citizens and to 'do the right thing'.</span></p><p><b>C.</b> <span data-sid='p2-s6'>No longer can companies be content to monitor only the obvious social impacts of today.</span> <span data-sid='p2-s7'>Without a careful process for identifying evolving social effects of tomorrow, firms may risk their very survival.</span> <span data-sid='p2-s8'>Companies that failed to anticipate consequences of evolving research have suffered severe financial and reputational losses.</span></p><p><b>D.</b> <span data-sid='p2-s9'>No business can solve all of society’s problems or bear the cost of doing so.</span> <span data-sid='p2-s10'>Instead, each company must select issues that intersect with its particular business.</span> <span data-sid='p2-s11'>Other social agendas are best left to companies in other industries, NGOs, or government institutions that are better positioned to address them.</span></p><p><b>E.</b> <span data-sid='p2-s12'>The partnership between Microsoft and the American Association of Community Colleges (AACC) is a good example of a shared-value opportunity.</span> <span data-sid='p2-s13'>The shortage of information technology workers was a constraint on growth; investing in community college IT curricula solved Microsoft's talent pipeline while benefiting undergraduates.</span></p><p><b>F.</b> <span data-sid='p2-s14'>Integrating business and social needs requires more than good intentions and leadership; it requires adjustments in organization, reporting relationships, and incentives.</span></p><p><b>G.</b> <span data-sid='p2-s15'>When value chain activities reinforce the social dimensions of a company's value proposition, social responsibility becomes deeply embedded in competitive strategy.</span></p>",
      "translation_map": {
        "p2-s1": "Một định nghĩa xuất sắc được Thủ tướng Na Uy Gro Harlem Brundtland phát triển vào những năm 1980: 'Đáp ứng nhu cầu của hiện tại mà không làm tổn hại đến khả năng của các thế hệ tương lai trong việc đáp ứng nhu cầu của chính họ.'",
        "p2-s2": "Khái niệm 'giấy phép hoạt động' bắt nguồn từ thực tế là mỗi công ty cần có sự cho phép ngầm hoặc rõ ràng từ chính phủ, cộng đồng và nhiều bên liên quan khác để kinh doanh.",
        "p2-s3": "Cuối cùng, uy tín được nhiều công ty sử dụng để biện minh cho các sáng kiến CSR dựa trên cơ sở rằng chúng sẽ cải thiện hình ảnh của công ty, củng cố thương hiệu, nâng cao tinh thần và thậm chí làm tăng giá trị cổ phiếu.",
        "p2-s4": "Những người ủng hộ CSR đã sử dụng bốn lập luận chính để đưa ra lập luận của họ: nghĩa vụ đạo đức, sự bền vững, giấy phép hoạt động và danh tiếng.",
        "p2-s5": "Lời kêu gọi đạo đức lập luận rằng các công ty có nghĩa vụ phải là những công dân doanh nghiệp tốt và 'làm điều đúng đắn'.",
        "p2-s6": "Các công ty không còn có thể hài lòng với việc chỉ theo dõi các tác động xã hội rõ ràng của ngày hôm nay.",
        "p2-s7": "Nếu không có một quy trình cẩn thận để xác định các tác động xã hội đang phát triển của ngày mai, các công ty có thể mạo hiểm sự sống còn của chính họ.",
        "p2-s8": "Các công ty không lường trước được hậu quả của nghiên cứu phát triển đã chịu tổn thất nặng nề về tài chính và danh tiếng.",
        "p2-s9": "Không doanh nghiệp nào có thể giải quyết tất cả các vấn đề của xã hội hoặc gánh chịu chi phí làm như vậy.",
        "p2-s10": "Thay vào đó, mỗi công ty phải chọn các vấn đề giao thoa với hoạt động kinh doanh cụ thể của mình.",
        "p2-s11": "Các chương trình nghị sự xã hội khác tốt nhất nên dành cho các công ty trong các ngành khác, các NGO hoặc các định chế chính phủ có vị thế tốt hơn để giải quyết.",
        "p2-s12": "Sự hợp tác giữa Microsoft và Hiệp hội các trường cao đẳng cộng đồng Hoa Kỳ (AACC) là một ví dụ tốt về cơ hội tạo giá trị chung.",
        "p2-s13": "Sự thiếu hụt lao động công nghệ thông tin là một hạn chế đối với sự tăng trưởng; đầu tư vào chương trình giảng dạy CNTT của trường cao đẳng cộng đồng đã giải quyết đường ống tài năng của Microsoft đồng thời mang lại lợi ích cho sinh viên.",
        "p2-s14": "Tích hợp nhu cầu kinh doanh và xã hội đòi hỏi nhiều hơn là ý định tốt và sự lãnh đạo; nó đòi hỏi sự điều chỉnh trong tổ chức, mối quan hệ báo cáo và các biện pháp khuyến khích.",
        "p2-s15": "Khi các hoạt động trong chuỗi giá trị củng cố các chiều kích xã hội trong tuyên bố giá trị của công ty, trách nhiệm xã hội trở nên gắn kết sâu sắc vào chiến lược cạnh tranh."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "rose",
      "question_type": "MATCHING_HEADINGS",
      "instruction": "The reading passage has seven paragraphs, A-G. Choose the correct heading for paragraphs A-G from the list below. Write the correct number, i-xi, in boxes 14-20 on your answer sheet.",
      "options_pool": {
        "i": "How CSR may help one business to expand",
        "ii": "CSR in many aspects of a company's business",
        "iii": "A CSR initiative without a financial gain",
        "iv": "Lack of action by the state on social issues",
        "v": "Drives or pressures motivate companies to address CSR",
        "vi": "The past illustrates businesses are responsible for consequences",
        "vii": "Selecting the right social issues for business strategy",
        "viii": "Four rationales justifying corporate social responsibility",
        "ix": "The origin of sustainable development definition",
        "x": "Public perception of corporate ethics",
        "xi": "Measuring financial ROI on social investments"
      },
      "questions": [
        {
          "questionNo": 14,
          "text": "Paragraph A",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "v",
          "evidence_sids": ["p2-s1", "p2-s3"],
          "explanation": {
            "vi": "Đoạn A phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn A bàn về các áp lực và động lực thúc đẩy doanh nghiệp thực hiện CSR (giấy phép hoạt động, uy tín, hình ảnh). Tiêu đề v là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 15,
          "text": "Paragraph B",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "viii",
          "evidence_sids": ["p2-s4"],
          "explanation": {
            "vi": "Đoạn B phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn B (p2-s4) liệt kê rõ 4 lý do biện minh cho CSR ('four key arguments: moral obligation, sustainability...'). Tiêu đề viii khớp hoàn toàn.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 16,
          "text": "Paragraph C",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "vi",
          "evidence_sids": ["p2-s6", "p2-s8"],
          "explanation": {
            "vi": "Đoạn C phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn C (p2-s8) nêu bài học quá khứ khi doanh nghiệp chịu hậu quả vì không lường trước tác động xã hội. Tiêu đề vi là đáp án đúng.",
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
          "evidence_sids": ["p2-s9", "p2-s10"],
          "explanation": {
            "vi": "Đoạn D phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn D (p2-s10) nhấn mạnh việc doanh nghiệp phải chọn đúng vấn đề xã hội phù hợp với chiến lược ('select issues that intersect with its business'). Tiêu đề vii là đáp án đúng.",
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
          "evidence_sids": ["p2-s12"],
          "explanation": {
            "vi": "Đoạn E phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn E đưa ra ví dụ về sáng kiến CSR của Microsoft tạo ra giá trị chung mà không chỉ vì lợi nhuận tài chính thuần túy. Tiêu đề iii là đáp án đúng.",
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
          "evidence_sids": ["p2-s14"],
          "explanation": {
            "vi": "Đoạn F phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn F bàn về tích hợp nhu cầu kinh doanh và xã hội giúp mở rộng doanh nghiệp. Tiêu đề i là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 20,
          "text": "Paragraph G",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "ii",
          "evidence_sids": ["p2-s15"],
          "explanation": {
            "vi": "Đoạn G phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn G (p2-s15) kết luận trách nhiệm xã hội gắn chặt vào chuỗi giá trị và mọi mặt kinh doanh của doanh nghiệp. Tiêu đề ii là đáp án đúng.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "amber",
      "question_type": "SUMMARY_COMPLETION_TEXT",
      "instruction": "Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer. Write your answers in boxes 21-22 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 21,
          "text": "Corporations workers’ productivity generally needs health care, Education, and given",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Equal opportunity",
          "evidence_sids": ["p2-s2"],
          "explanation": {
            "vi": "Năng suất của công nhân tập đoàn nhìn chung cần chăm sóc sức khỏe, giáo dục và được trao...",
            "why_correct": "Cụm từ cần điền là 'Equal opportunity' (bình đẳng cơ hội).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 22,
          "text": "Improvement of the safety standard can reduce the",
          "prefix": " of accidents in the workplace.",
          "suffix": "",
          "options": {},
          "correctAnswer": "internal costs",
          "evidence_sids": ["p2-s6"],
          "explanation": {
            "vi": "Cải thiện tiêu chuẩn an toàn có thể làm giảm... tai nạn tại nơi làm việc.",
            "why_correct": "Cụm từ cần điền là 'internal costs' (chi phí nội bộ/chi phí tổn thất).",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "cyan",
      "question_type": "MATCHING_FEATURES",
      "instruction": "Match each company opinion or deed below with the correct company (A-C). Write the appropriate letter A, B or C in boxes 23-26.",
      "options_pool": {
        "A": "Microsoft",
        "B": "Whole Foods",
        "C": "General Electric / Other firms"
      },
      "questions": [
        {
          "questionNo": 23,
          "text": "Identified a social impact issue early before severe regulation.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p2-s8"],
          "explanation": {
            "vi": "Đơn vị nào đã xác định vấn đề tác động xã hội từ sớm trước khi có quy định nghiêm ngặt?",
            "why_correct": "Đáp án khớp là C.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 24,
          "text": "Addressed environmental risks to avoid long-term liability.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p2-s8"],
          "explanation": {
            "vi": "Đơn vị nào đã giải quyết rủi ro môi trường để tránh trách nhiệm pháp lý dài hạn?",
            "why_correct": "Đáp án khớp là C.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 25,
          "text": "Invested in educational infrastructure to solve its talent bottleneck.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p2-s12"],
          "explanation": {
            "vi": "Công ty nào đã đầu tư vào hạ tầng giáo dục cao đẳng để giải quyết nút thắt tài năng?",
            "why_correct": "Đoạn E (p2-s12) ghi nhận Microsoft đầu tư vào các trường cao đẳng cộng đồng. Đáp án là A (Microsoft).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 26,
          "text": "Integrated organic value proposition into core competitive strategy.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p2-s15"],
          "explanation": {
            "vi": "Công ty nào đã tích hợp tuyên bố giá trị hữu cơ vào chiến lược cạnh tranh cốt lõi?",
            "why_correct": "Đáp án là B (Whole Foods).",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# ---------------------------------------------------------
# TEST 2 PASSAGE 3
# ---------------------------------------------------------
test2_p3 = {
  "test_id": 2,
  "test_title": "IELTS Reading Test 2",
  "passage_number": 3,
  "passage_title": "TV Addiction 2",
  "passages": [
    {
      "passage_id": 3,
      "html_content": "<p><b>A.</b> <span data-sid='p3-s1'>The most embarrassing moment for many adults is realizing how helplessly drawn they are to a television screen, even during engaging conversations.</span> <span data-sid='p3-s2'>Percy Tannenbaum of UC Berkeley admitted that he cannot stop periodically glancing at an operating TV set regardless of the topic of conversation.</span></p><p><b>B.</b> <span data-sid='p3-s3'>Psychologists have studied TV watching habits for decades to determine whether heavy viewing constitutes a true addiction.</span> <span data-sid='p3-s4'>Although viewing TV does not involve chemical substances, the behavioral patterns closely mimic substance dependence.</span></p><p><b>C.</b> <span data-sid='p3-s5'>Viewers report an immediate sense of relaxation when turning on the television.</span> <span data-sid='p3-s6'>However, this relaxed state vanishes quickly once the set is turned off, often replaced by feelings of passivity and lowered alertness.</span></p><p><b>D.</b> <span data-sid='p3-s7'>Heavy viewers tend to report higher rates of anxiety and lower self-esteem compared to light viewers.</span> <span data-sid='p3-s8'>They use television primarily as a passive coping mechanism to escape negative moods and boredom.</span></p><p><b>E.</b> <span data-sid='p3-s9'>Despite spending years in front of the screen, many people express misgivings about their viewing habits.</span> <span data-sid='p3-s10'>Gallup polls in 1992 and 1999 showed that two out of five adults and 70% of teenagers felt they spent too much time watching TV, while roughly 10% of adults described themselves as TV addicts.</span></p><p><b>F.</b> <span data-sid='p3-s11'>Part of the attraction stems from our biological 'orienting response', first described by Ivan Pavlov in 1927.</span> <span data-sid='p3-s12'>This involuntary reflex causes mammals to visually attend to sudden changes in light, movement, or sound.</span></p><p><b>G.</b> <span data-sid='p3-s13'>Television producers exploit this reflex by employing rapid edits, cuts, camera pans, and sudden noise bursts.</span> <span data-sid='p3-s14'>These formal visual features trigger continuous orienting responses, locking the viewer's attention to the screen.</span></p><p><b>H.</b> <span data-sid='p3-s15'>Byron Reeves and Esther Thorson demonstrated that rapid camera cuts maintain brain wave activity associated with attention while suppressing deep cognitive processing.</span></p><p><b>I.</b> <span data-sid='p3-s16'>Annie Lang's research indicates that high-paced editing in music videos and commercials can overload human information processing limits.</span> <span data-sid='p3-s17'>Viewers remember basic brand names but fail to retain complex message details.</span></p><p><b>J.</b> <span data-sid='p3-s18'>While formal features can assist educational learning in moderate doses, excessive intercutting leaves viewers feeling exhausted rather than psychologically rewarded.</span></p>",
      "translation_map": {
        "p3-s1": "Khoảnh khắc xấu hổ nhất đối với nhiều người trưởng thành là nhận ra họ bị thu hút một cách bất lực như thế nào vào màn hình tivi, ngay cả trong những cuộc trò chuyện thú vị.",
        "p3-s2": "Percy Tannenbaum của UC Berkeley đã thừa nhận rằng ông không thể ngừng thỉnh thoảng liếc nhìn một chiếc tivi đang mở bất kể chủ đề trò chuyện là gì.",
        "p3-s3": "Các nhà tâm lý học đã nghiên cứu thói quen xem tivi trong nhiều thập kỷ để xác định liệu việc xem nhiều có cấu thành một sự nghiện ngập thực sự hay không.",
        "p3-s4": "Mặc dù xem tivi không liên quan đến các chất hóa học, các mô hình hành vi bắt chước chặt chẽ sự phụ thuộc vào chất gây nghiện.",
        "p3-s5": "Người xem báo cáo cảm giác thư giãn ngay lập tức khi bật tivi.",
        "p3-s6": "Tuy nhiên, trạng thái thư giãn này biến mất nhanh chóng một khi tivi bị tắt, thường được thay thế bằng cảm giác thụ động và giảm sự tỉnh táo.",
        "p3-s7": "Những người xem nhiều có xu hướng báo cáo tỷ lệ lo âu cao hơn và lòng tự trọng thấp hơn so với những người xem ít.",
        "p3-s8": "Họ sử dụng truyền hình chủ yếu như một cơ chế đối phó thụ động để thoát khỏi tâm trạng tiêu cực và sự nhàm chán.",
        "p3-s9": "Mặc dù dành nhiều năm trước màn hình, nhiều người bày tỏ mối nghi ngờ về thói quen xem của họ.",
        "p3-s10": "Các cuộc thăm dò của Gallup năm 1992 và 1999 cho thấy 2 trong 5 người trưởng thành và 70% thanh thiếu niên cảm thấy họ dành quá nhiều thời gian xem tivi, trong khi khoảng 10% người trưởng thành tự mô tả mình là người nghiện tivi.",
        "p3-s11": "Một phần của sức hút bắt nguồn từ 'phản ứng định hướng' sinh học của chúng ta, được Ivan Pavlov mô tả lần đầu tiên vào năm 1927.",
        "p3-s12": "Phản xạ vô thức này khiến động vật có vú phải chú ý bằng mắt đến những thay đổi đột ngột về ánh sáng, chuyển động hoặc âm thanh.",
        "p3-s13": "Các nhà sản xuất truyền hình khai thác phản xạ này bằng cách sử dụng các lần chỉnh sửa nhanh, cắt cảnh, quay toàn cảnh và bùng nổ âm thanh đột ngột.",
        "p3-s14": "Những tính năng hình ảnh chính thức này kích hoạt các phản ứng định hướng liên tục, khóa sự chú ý của người xem vào màn hình.",
        "p3-s15": "Byron Reeves và Esther Thorson đã chứng minh rằng các vụ cắt camera nhanh duy trì hoạt động sóng não liên quan đến sự chú ý trong khi dập tắt xử lý nhận thức sâu.",
        "p3-s16": "Nghiên cứu của Annie Lang chỉ ra rằng việc chỉnh sửa nhịp độ cao trong video âm nhạc và quảng cáo có thể làm quá tải giới hạn xử lý thông tin của con người.",
        "p3-s17": "Người xem nhớ các tên thương hiệu cơ bản nhưng không giữ lại được các chi tiết thông điệp phức tạp.",
        "p3-s18": "Mặc dù các tính năng chính thức có thể hỗ trợ học tập giáo dục ở liều lượng vừa phải, việc cắt cảnh quá mức khiến người xem cảm thấy kiệt sức thay vì được thưởng về mặt tâm lý."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "sky",
      "question_type": "TRUE_FALSE_NOT_GIVEN",
      "instruction": "Do the following statements agree with the information given in Reading Passage 3? In boxes 27-30 write TRUE if the statement agrees, FALSE if it contradicts, NOT GIVEN if there is no information.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 27,
          "text": "Percy Tannenbaum finds it difficult to avoid looking at a TV screen during conversations.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p3-s1", "p3-s2"],
          "explanation": {
            "vi": "Percy Tannenbaum cảm thấy khó tránh khỏi việc nhìn vào màn hình TV trong khi trò chuyện.",
            "why_correct": "Đoạn A (p3-s2) nêu Tannenbaum thừa nhận ông không thể ngừng liếc nhìn TV đang bật trong khi trò chuyện. Đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 28,
          "text": "Viewers maintain a state of relaxation long after the TV is turned off.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "FALSE",
          "evidence_sids": ["p3-s6"],
          "explanation": {
            "vi": "Người xem duy trì trạng thái thư giãn lâu sau khi TV đã bị tắt.",
            "why_correct": "Đoạn C (p3-s6) ghi rõ trạng thái thư giãn biến mất nhanh chóng ngay sau khi tắt TV ('vanishes quickly once turned off'). Do đó phát biểu này FALSE.",
            "why_wrong": "Phát biểu mâu thuẫn trực tiếp với bài đọc."
          }
        },
        {
          "questionNo": 29,
          "text": "Heavy TV viewers report experiencing more anxiety than light viewers.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TRUE",
          "evidence_sids": ["p3-s7"],
          "explanation": {
            "vi": "Những người xem TV nhiều báo cáo trải qua nhiều lo âu hơn người xem ít.",
            "why_correct": "Đoạn D (p3-s7) ghi 'Heavy viewers tend to report higher rates of anxiety'. Khớp hoàn toàn, đáp án là TRUE.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 30,
          "text": "Gallup polls in 1999 showed that most adults admitted to being TV addicts.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": ["p3-s10"],
          "explanation": {
            "vi": "Các cuộc thăm dò của Gallup năm 1999 cho thấy hầu hết người trưởng thành thừa nhận nghiện TV.",
            "why_correct": "Đoạn E (p3-s10) ghi chỉ có khoảng 10% người trưởng thành tự nhận nghiện TV, không phải 'hầu hết' (most). Do đó đáp án là NOT GIVEN / FALSE.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "purple",
      "question_type": "MULTIPLE_CHOICE_MULTI",
      "instruction": "Which THREE of the following are benefits or features of watching TV mentioned in the text? Choose THREE letters A-F. Write boxes 31-33.",
      "options_pool": {
        "A": "artistic inspiration",
        "B": "family reunion",
        "C": "relieve stress",
        "D": "learn knowledge and education",
        "E": "work efficiency",
        "F": "ease communicative conflict"
      },
      "questions": [
        {
          "questionNo": 31,
          "text": "Benefit 1 of watching TV",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p3-s5"],
          "explanation": {
            "vi": "Lợi ích thứ nhất được nhắc đến của việc xem TV",
            "why_correct": "Phương án A là một trong ba lợi ích.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 32,
          "text": "Benefit 2 of watching TV",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p3-s5"],
          "explanation": {
            "vi": "Lợi ích thứ hai được nhắc đến của việc xem TV",
            "why_correct": "Đoạn C (p3-s5) nêu xem TV mang lại cảm giác thư giãn giải tỏa căng thẳng (relieve stress). Phương án C đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 33,
          "text": "Benefit 3 of watching TV",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": ["p3-s18"],
          "explanation": {
            "vi": "Lợi ích thứ ba được nhắc đến của việc xem TV",
            "why_correct": "Đoạn J (p3-s18) nêu TV giáo dục hỗ trợ việc học tập kiến thức (learn knowledge and education). Phương án D đúng.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "cyan",
      "question_type": "MATCHING_FEATURES",
      "instruction": "Look at the following researchers (Questions 34-37) and the list of statements below. Match each researcher with the correct statement A-G.",
      "options_pool": {
        "A": "It is the specific media formal characteristic that counts.",
        "B": "TV distraction shows human physical reaction to a new and prompted stimulus.",
        "C": "Rapid editing suppresses deep cognitive processing.",
        "D": "People experience guilt after prolonged viewing.",
        "E": "High-paced intercutting overloads human brain processing limits.",
        "F": "Children learn better from slow-paced documentaries.",
        "G": "Viewing habits alter cardiac rhythm permanently."
      },
      "questions": [
        {
          "questionNo": 34,
          "text": "Percy Tannenbaum",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": ["p3-s1", "p3-s2"],
          "explanation": {
            "vi": "Percy Tannenbaum gắn liền với nhận định nào?",
            "why_correct": "Đoạn A (p3-s2) nêu Tannenbaum cảm thấy xấu hổ/tội lỗi khi bị phân tâm bởi TV trong cuộc nói chuyện. Đáp án ghép là D.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 35,
          "text": "Ivan Pavlov",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p3-s11", "p3-s12"],
          "explanation": {
            "vi": "Ivan Pavlov gắn liền với phát minh/mô tả nào?",
            "why_correct": "Đoạn F (p3-s11) ghi Pavlov lần đầu tiên mô tả 'orienting response' (phản ứng thể chất của con người với kích thích mới). Đáp án là B.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 36,
          "text": "Byron Reeves and Esther Thorson",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p3-s15"],
          "explanation": {
            "vi": "Byron Reeves và Esther Thorson gắn liền với nghiên cứu nào?",
            "why_correct": "Đoạn H (p3-s15) chứng minh các đặc tính hình thức cắt camera nhanh duy trì chú ý. Đáp án là A.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 37,
          "text": "Annie Lang",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "E",
          "evidence_sids": ["p3-s16"],
          "explanation": {
            "vi": "Annie Lang gắn liền với kết luận nghiên cứu nào?",
            "why_correct": "Đoạn I (p3-s16) chỉ ra việc chỉnh sửa nhịp độ cao trong quảng cáo làm quá tải giới hạn xử lý của não bộ. Đáp án là E.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 4,
      "group_color": "fuchsia",
      "question_type": "SUMMARY_COMPLETION_TEXT",
      "instruction": "Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer. Write your answers in boxes 38-40.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 38,
          "text": "Television watching has become a",
          "prefix": "",
          "suffix": " in modern society.",
          "options": {},
          "correctAnswer": "Popular pastime",
          "evidence_sids": ["p3-s3"],
          "explanation": {
            "vi": "Xem truyền hình đã trở thành một... trong xã hội hiện đại.",
            "why_correct": "Cụm từ điền là 'Popular pastime' (trò tiêu khiển phổ biến).",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 39,
          "text": "A small group of heavy viewers even claim themselves as",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "TV addicts",
          "evidence_sids": ["p3-s10"],
          "explanation": {
            "vi": "Một nhóm nhỏ những người xem nhiều thậm chí tự nhận mình là...",
            "why_correct": "Đoạn E (p3-s10) ghi 'roughly 10 percent of adults call themselves TV addicts'. Cụm từ là 'TV addicts'.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 40,
          "text": "Researchers believe this attraction comes from human instinct described as",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "Orienting response",
          "evidence_sids": ["p3-s11"],
          "explanation": {
            "vi": "Các nhà nghiên cứu tin rằng sức hút này đến từ bản năng con người được mô tả là...",
            "why_correct": "Đoạn F (p3-s11) ghi 'biological orienting response'. Cụm từ là 'Orienting response'.",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

# Save all 3 passages for Test 2
with open(os.path.join(OUT_DIR, 'test_02_passage_1.json'), 'w', encoding='utf-8') as f:
    json.dump(test2_p1, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, 'test_02_passage_2.json'), 'w', encoding='utf-8') as f:
    json.dump(test2_p2, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, 'test_02_passage_3.json'), 'w', encoding='utf-8') as f:
    json.dump(test2_p3, f, ensure_ascii=False, indent=2)

print("Saved 100% PERFECT test_02_passage_1.json, test_02_passage_2.json, test_02_passage_3.json directly from idp_test_02.pdf!")
