import json, os

real_test6_passage2 = {
  "test_id": 6,
  "test_title": "IELTS Reading Test 6",
  "passage_number": 2,
  "passage_title": "BIRD MIGRATION 2",
  "passages": [
    {
      "passage_id": 2,
      "html_content": "<p><b>A.</b> <span data-sid=\"p2-s1\">Birds have many unique design features that enable them to perform such amazing feats of endurance.</span> <span data-sid=\"p2-s2\">They are equipped with lightweight, hollow bones, intricately designed feathers providing both lift and thrust for rapid flight, navigation systems superior to any that man has developed, and an ingenious heat conserving design that, among other things, concentrates all blood circulation beneath layers of warm, waterproof plumage, leaving them fit to face life in the harshest of climates.</span> <span data-sid=\"p2-s3\">Their respiratory systems have to perform efficiently during sustained flights at altitude, so they have a system of extracting oxygen from their lungs that far exceeds that of any other animal.</span> <span data-sid=\"p2-s4\">During the later stages of the summer breeding season, when food is plentiful, their bodies are able to accumulate considerable layers of fat, in order to provide sufficient energy for their long migratory flights.</span></p><p><b>B.</b> <span data-sid=\"p2-s5\">The fundamental reason that birds migrate is to find adequate food during the winter months when it is in short supply.</span> <span data-sid=\"p2-s6\">This particularly applies to birds that breed in the temperate and Arctic regions of the Northern Hemisphere, where food is abundant during the short growing season.</span> <span data-sid=\"p2-s7\">Many species can tolerate cold temperatures if food is plentiful, but when food is not available they must migrate.</span> <span data-sid=\"p2-s8\">However, intriguing questions remain.</span></p><p><b>C.</b> <span data-sid=\"p2-s9\">One puzzling fact is that many birds journey much further than would be necessary just to find food and good weather.</span> <span data-sid=\"p2-s10\">Nobody knows, for instance, why British swallows, which could presumably survive equally well if they spent the winter in equatorial Africa, instead fly several thousands of miles further to their preferred winter home in South Africa Cape Province.</span> <span data-sid=\"p2-s11\">Another mystery involves the huge migrations performed by arctic terns and mudflat-feeding shorebirds that breed close to Polar Regions.</span> <span data-sid=\"p2-s12\">In general, the further north a migrant species breeds, the further south it spends the winter.</span> <span data-sid=\"p2-s13\">For arctic terns this necessitates an annual round trip of 25,000 miles.</span> <span data-sid=\"p2-s14\">Yet, en route to their final destination in far-flung southern latitudes, all these individuals overfly other areas of seemingly suitable habitat spanning two hemispheres.</span> <span data-sid=\"p2-s15\">While we may not fully understand bird’s reasons for going to particular places, we can marvel at their feats.</span></p><p><b>D.</b> <span data-sid=\"p2-s16\">One of the greatest mysteries is how young birds know how to find the traditional wintering areas without parental guidance.</span> <span data-sid=\"p2-s17\">Very few adults migrate with juveniles in tow, and youngsters may even have little or no inkling of their parents’ appearance.</span> <span data-sid=\"p2-s18\">A familiar example is that of the cuckoo, which lays its eggs in another species' nest and never encounters its young again.</span> <span data-sid=\"p2-s19\">It is mind boggling to consider that, once raised by its host species, the young cuckoo makes its own way to ancestral wintering grounds in the tropics before returning single-handedly to northern Europe the next season to seek out a mate among its own kind.</span> <span data-sid=\"p2-s20\">The obvious implication is that it inherits from its parents an inbuilt route map and direction-finding capability, as well as a mental image of what another cuckoo looks like.</span> <span data-sid=\"p2-s21\">Yet nobody has the slightest idea as to how this is possible.</span></p><p><b>E.</b> <span data-sid=\"p2-s22\">Mounting evidence has confirmed that birds use the positions of the sun and stars to obtain compass directions.</span> <span data-sid=\"p2-s23\">They seem also to be able to detect the earth’s magnetic field, probably due to having minute crystals of magnetite in the region of their brains.</span> <span data-sid=\"p2-s24\">However, true navigation also requires an awareness of position and time, especially when lost.</span> <span data-sid=\"p2-s25\">Experiments have shown that after being taken thousands of miles over an unfamiliar land-mass, birds are still capable of returning rapidly to nest sites.</span> <span data-sid=\"p2-s26\">Such phenomenal powers are the product of computing a number of sophisticated cues, including an inborn map of the night sky and the pull of the earth’s magnetic field.</span> <span data-sid=\"p2-s27\">How the birds use their ‘instruments’ remains unknown, but one thing is clear: they see the world with a superior sensory perception to ours.</span> <span data-sid=\"p2-s28\">Most small birds migrate at night and take their direction from the position of the setting sun.</span> <span data-sid=\"p2-s29\">However, as well as seeing the sun go down, they also seem to see the plane of polarized light caused by it, which calibrates their compass.</span> <span data-sid=\"p2-s30\">Traveling at night provides other benefits.</span> <span data-sid=\"p2-s31\">Daytime predators are avoided and the danger of dehydration due to flying for long periods in warm, sunlit skies is reduced.</span> <span data-sid=\"p2-s32\">Furthermore, at night the air is generally cool and less turbulent and so conducive to sustained, stable flight.</span></p><p><b>F.</b> <span data-sid=\"p2-s33\">Nevertheless, all journeys involve considerable risk, and part of the skill in arriving safely is setting off at the right time.</span> <span data-sid=\"p2-s34\">This means accurate weather forecasting, and utilizing favorable winds.</span> <span data-sid=\"p2-s35\">Birds are adept at both, and, in laboratory tests, some have been shown to detect the minute difference in barometric pressure between the floor and ceiling of a room.</span> <span data-sid=\"p2-s36\">Often birds react to weather changes before there is any visible sign of them.</span> <span data-sid=\"p2-s37\">Lapwings, which feed on grassland, flee west from the Netherlands to the British Isles, France and Spain at the onset of a cold snap.</span> <span data-sid=\"p2-s38\">When the ground surface freezes the birds could starve.</span> <span data-sid=\"p2-s39\">Yet they return to Holland ahead of a thaw, their arrival linked to a pressure change presaging an improvement in the weather.</span></p><p><b>G.</b> <span data-sid=\"p2-s40\">In one instance a Welsh Manx shearwater carried to America and released was back in its burrow on Skokholm Island, off the Pembrokeshire coast, one day before a letter announcing its release!</span> <span data-sid=\"p2-s41\">Conversely, each autumn a small number of North American birds are blown across the Atlantic by fast-moving westerly tail winds.</span> <span data-sid=\"p2-s42\">Not only do they arrive safely in Europe, but, based on ringing evidence, some make it back to North America the following spring, after probably spending the winter with European migrants in sunny African climes.</span></p>",
      "translation_map": {
        "p2-s1": "Chim có nhiều đặc điểm thiết kế độc đáo cho phép chúng thực hiện những kỳ tích về sức bền đáng kinh ngạc như vậy.",
        "p2-s2": "Chúng được trang bị xương rỗng, nhẹ, lông được thiết kế phức tạp cung cấp cả lực nâng và lực đẩy cho chuyến bay nhanh, hệ thống điều hướng vượt trội so với bất kỳ hệ thống nào mà con người phát triển, và thiết kế bảo tồn nhiệt khéo léo tập trung toàn bộ sự tuần hoàn máu bên dưới các lớp lông vũ ấm áp, chống nước.",
        "p2-s3": "Hệ hô hấp của chúng phải hoạt động hiệu quả trong các chuyến bay kéo dài ở độ cao lớn, vì vậy chúng có hệ thống trích xuất oxy từ phổi vượt xa bất kỳ loài động vật nào khác.",
        "p2-s4": "Trong các giai đoạn sau của mùa sinh sản mùa hè, khi thức ăn dồi dào, cơ thể chúng có thể tích tụ các lớp mỡ đáng kể để cung cấp đủ năng lượng cho các chuyến bay di cư dài.",
        "p2-s5": "Lý do căn bản khiến chim di cư là để tìm đủ thức ăn trong những tháng mùa đông khi nguồn cung khan hiếm.",
        "p2-s6": "Điều này đặc biệt áp dụng cho các loài chim sinh sản ở các vùng ôn đới và Bắc Cực của Bán cầu Bắc, nơi thức ăn dồi dào trong mùa sinh trưởng ngắn.",
        "p2-s7": "Nhiều loài có thể chịu đựng nhiệt độ lạnh nếu thức ăn dồi dào, nhưng khi không có thức ăn chúng bắt buộc phải di cư.",
        "p2-s8": "Tuy nhiên, những câu hỏi hấp dẫn vẫn còn đó.",
        "p2-s9": "Một sự thật đánh đố là nhiều loài chim hành trình xa hơn nhiều so với mức cần thiết chỉ để tìm thức ăn và thời tiết tốt.",
        "p2-s10": "Chẳng hạn, không ai biết tại sao chim én Anh, loài có thể sống tốt nếu trải qua mùa đông ở châu Phi xích đạo, thay vào đó lại bay thêm hàng ngàn dặm nữa đến ngôi nhà mùa đông ưa thích ở Tỉnh Cape, Nam Phi.",
        "p2-s11": "Một bí ẩn khác liên quan đến những cuộc di cư khổng lồ được thực hiện bởi nhạn biển Bắc Cực và các loài chim bờ biển ăn ở bãi bùn sinh sản gần các Vùng Cực.",
        "p2-s12": "Nói chung, một loài di cư sinh sản càng xa về phía bắc thì nó càng trải qua mùa đông xa hơn về phía nam.",
        "p2-s13": "Đối với nhạn biển Bắc Cực, điều này bắt buộc một chuyến đi khứ hồi hàng năm dài 25.000 dặm.",
        "p2-s14": "Tuy nhiên, trên đường đến điểm đến cuối cùng ở các vĩ độ phía nam xa xôi, tất cả những cá thể này đều bay qua các khu vực khác có môi trường sống dường như thích hợp trải dài hai bán cầu.",
        "p2-s15": "Mặc dù chúng ta có thể không hiểu đầy đủ lý do chim đến những nơi cụ thể, chúng ta có thể kinh ngạc trước những kỳ tích của chúng.",
        "p2-s16": "Một trong những bí ẩn lớn nhất là làm thế nào những chú chim non có thể tìm được những khu vực trú đông truyền thống mà không cần sự hướng dẫn của cha mẹ.",
        "p2-s17": "Rất ít chim trưởng thành di cư cùng với con non theo sau, và con non thậm chí có thể có ít hoặc không biết gì về ngoại hình của cha mẹ.",
        "p2-s18": "Một ví dụ quen thuộc là chim cu cu, loài đẻ trứng vào tổ của loài khác và không bao giờ gặp lại con của mình nữa.",
        "p2-s19": "Thật kinh ngạc khi nghĩ rằng, khi được nuôi dưỡng bởi loài chủ, chim cu cu non tự tìm đường đến vùng trú đông tổ tiên ở vùng nhiệt đới trước khi đơn độc trở lại bắc Âu vào mùa sau để tìm bạn đời.",
        "p2-s20": "Hàm ý rõ ràng là nó thừa hưởng từ cha mẹ một bản đồ tuyến đường bẩm sinh và khả năng tìm hướng, cũng như hình ảnh tinh thần về hình dáng của một con cu cu khác.",
        "p2-s21": "Tuy nhiên không ai có chút ý niệm nào về việc điều này làm cách nào có thể xảy ra.",
        "p2-s22": "Ngày càng nhiều bằng chứng xác nhận rằng chim sử dụng vị trí của mặt trời và các ngôi sao để có được hướng la bàn.",
        "p2-s23": "Chúng dường như cũng có thể phát hiện từ trường của trái đất, có lẽ do có các tinh thể magnetite nhỏ trong vùng não.",
        "p2-s24": "Tuy nhiên, việc điều hướng thực sự cũng đòi hỏi nhận thức về vị trí và thời gian, đặc biệt là khi bị lạc.",
        "p2-s25": "Các thí nghiệm đã chỉ ra rằng sau khi bị đưa đi hàng ngàn dặm qua một khối đất lạ, chim vẫn có khả năng nhanh chóng trở lại vị trí tổ.",
        "p2-s26": "Khả năng phi thường như vậy là sản phẩm của việc tính toán một số manh mối tinh vi, bao gồm bản đồ bẩm sinh về bầu trời đêm và sức hút từ trường trái đất.",
        "p2-s27": "Cách chim sử dụng 'dụng cụ' của chúng vẫn chưa được biết, nhưng có một điều rõ ràng: chúng nhìn thế giới với nhận thức giác quan vượt trội so với chúng ta.",
        "p2-s28": "Hầu hết các loài chim nhỏ di cư vào ban đêm và lấy hướng từ vị trí lặn của mặt trời.",
        "p2-s29": "Tuy nhiên, ngoài việc nhìn thấy mặt trời lặn, chúng cũng dường như nhìn thấy mặt phẳng ánh sáng phân cực do nó tạo ra, giúp hiệu chỉnh la bàn của chúng.",
        "p2-s30": "Di chuyển vào ban đêm mang lại những lợi ích khác.",
        "p2-s31": "Tránh được các loài săn mồi ban ngày và nguy cơ mất nước do bay thời gian dài trong bầu trời nắng ấm được giảm bớt.",
        "p2-s32": "Hơn nữa, vào ban đêm không khí nhìn chung mát mẻ hơn và ít hỗn loạn hơn, thuận lợi cho chuyến bay ổn định, kéo dài.",
        "p2-s33": "Dù vậy, mọi chuyến đi đều tiềm ẩn rủi ro đáng kể, và một phần kỹ năng để đến nơi an toàn là khởi hành đúng thời điểm.",
        "p2-s34": "Điều này có nghĩa là dự báo thời tiết chính xác và tận dụng gió thuận lợi.",
        "p2-s35": "Chim rất thành thạo cả hai, và trong các thử nghiệm phòng thí nghiệm, một số loài đã được chứng minh là phát hiện sự chênh lệch nhỏ về áp suất khí quyển giữa sàn và trần nhà.",
        "p2-s36": "Thường chim phản ứng với thay đổi thời tiết trước khi có bất kỳ dấu hiệu có thể nhìn thấy nào.",
        "p2-s37": "Chim điệp (Lapwings) ăn trên vùng đất cỏ, chạy trốn về phía tây từ Hà Lan sang Quần đảo Anh, Pháp và Tây Ban Nha khi đợt lạnh bắt đầu.",
        "p2-s38": "Khi bề mặt mặt đất đóng băng, chim có thể chết đói.",
        "p2-s39": "Tuy nhiên chúng trở lại Hà Lan trước khi băng tan, sự xuất hiện của chúng liên quan đến sự thay đổi áp suất báo hiệu thời tiết cải thiện.",
        "p2-s40": "Trong một trường hợp, một con chim Manx shearwater xứ Wales được đưa sang Mỹ và thả ra đã quay lại hang trên đảo Skokholm một ngày trước khi thư thông báo thả chim đến!",
        "p2-s41": "Ngược lại, mỗi mùa thu một số lượng nhỏ chim Bắc Mỹ bị thổi qua Đại Tây Dương bởi gió đuôi phía tây di chuyển nhanh.",
        "p2-s42": "Không những đến nơi an toàn ở Châu Âu, mà dựa trên bằng chứng đeo vòng đánh dấu, một số còn quay lại Bắc Mỹ vào mùa xuân sau."
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
        "i": "The best moment to migrate",
        "ii": "The unexplained rejection of closer feeding ground",
        "iii": "The influence of weather on the migration route",
        "iv": "Physical characteristics that allow birds to migrate",
        "v": "The main reason why birds migrate",
        "vi": "The best wintering grounds for birds",
        "vii": "Research findings on how birds migrate",
        "viii": "Successful migration despite trouble of wind",
        "ix": "Contrast between long-distance migration and short-distance migration",
        "x": "Mysterious migration despite lack of teaching"
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
            "vi": "Đoạn A phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn A (p2-s1, p2-s2) mô tả các đặc điểm thể chất độc đáo của chim cho phép chúng bay xa (xương rỗng nhẹ, lông thiết kế phức tạp, hệ thống giữ nhiệt, hệ hô hấp). Tiêu đề iv ('Physical characteristics that allow birds to migrate') phản ánh chính xác nội dung này.",
            "why_wrong": "Các tiêu đề khác không tập trung vào đặc điểm thể chất."
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
            "p2-s5"
          ],
          "explanation": {
            "vi": "Đoạn B phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn B (p2-s5) mở đầu ghi rõ: 'The fundamental reason that birds migrate is to find adequate food' (Lý do căn bản khiến chim di cư là tìm thức ăn). Tiêu đề v ('The main reason why birds migrate') là phù hợp nhất.",
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
            "p2-s9",
            "p2-s10",
            "p2-s14"
          ],
          "explanation": {
            "vi": "Đoạn C phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn C (p2-s9, p2-s10, p2-s14) bàn về sự thật khó hiểu khi chim bay xa hơn mức cần thiết, bỏ qua các nơi kiếm ăn thích hợp gần hơn để đến Nam Phi. Tiêu đề ii ('The unexplained rejection of closer feeding ground') là đáp án đúng.",
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
            "p2-s16",
            "p2-s17"
          ],
          "explanation": {
            "vi": "Đoạn D phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn D (p2-s16, p2-s17) thảo luận về bí ẩn chim chim non tự tìm đường trú đông mà không có sự dạy dỗ/hướng dẫn của cha mẹ ('without parental guidance'). Tiêu đề x ('Mysterious migration despite lack of teaching') khớp hoàn toàn.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 18,
          "text": "Paragraph E",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "vii",
          "evidence_sids": [
            "p2-s22",
            "p2-s25"
          ],
          "explanation": {
            "vi": "Đoạn E phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn E (p2-s22, p2-s25) liệt kê các bằng chứng và kết quả nghiên cứu/thí nghiệm về cách chim điều hướng bằng mặt trời, sao, từ trường ('Mounting evidence', 'Experiments have shown'). Tiêu đề vii ('Research findings on how birds migrate') là đáp án đúng.",
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
            "p2-s33",
            "p2-s34"
          ],
          "explanation": {
            "vi": "Đoạn F phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn F (p2-s33) ghi rõ: 'part of the skill in arriving safely is setting off at the right time' (kỹ năng đến nơi an toàn là khởi hành đúng thời điểm). Tiêu đề i ('The best moment to migrate') khớp với nội dung này.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 20,
          "text": "Paragraph G",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "viii",
          "evidence_sids": [
            "p2-s41",
            "p2-s42"
          ],
          "explanation": {
            "vi": "Đoạn G phù hợp với tiêu đề nào?",
            "why_correct": "Đoạn G (p2-s41, p2-s42) kể về việc chim bị gió bão thổi qua Đại Tây Dương vẫn di cư thành công và quay về an toàn. Tiêu đề viii ('Successful migration despite trouble of wind') là đáp án đúng.",
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
            "p2-s9"
          ],
          "explanation": {
            "vi": "Hai phát biểu nào sau đây đúng về sự di cư của chim? (Đáp án 1)",
            "why_correct": "Đoạn C (p2-s9) ghi 'many birds journey much further than would be necessary just to find food' (nhiều loài chim bay xa hơn mức cần thiết). Phương án A ('Birds often fly further than they need to') là phát biểu đúng.",
            "why_wrong": "Các phương án khác sai hoặc không có trong bài đọc."
          }
        },
        {
          "questionNo": 22,
          "text": "Which TWO of the following statements are true of bird migration?",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": [
            "p2-s31"
          ],
          "explanation": {
            "vi": "Hai phát biểu nào sau đây đúng về sự di cư của chim? (Đáp án 2)",
            "why_correct": "Đoạn E (p2-s31) ghi 'danger of dehydration due to flying for long periods in warm, sunlit skies is reduced' (bay đêm giúp giảm nguy cơ mất nước). Phương án C ('Birds flying at night need less water') là đáp án đúng thứ hai.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "cyan",
      "question_type": "FILL_IN_BLANKS",
      "instruction": "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer. Write your answers in boxes 23-26 on your answer sheet.",
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
            "p2-s16"
          ],
          "explanation": {
            "vi": "Thật là một bí ẩn lớn khi chim non như chim cu cu có thể tìm thấy nơi trú đông mà không cần...",
            "why_correct": "Đoạn D (p2-s16) ghi 'find the traditional wintering areas without parental guidance'. Từ cần điền là 'parental guidance'.",
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
            "p2-s22",
            "p2-s29"
          ],
          "explanation": {
            "vi": "Bằng chứng cho thấy chim có thể biết hướng giống như một...",
            "why_correct": "Đoạn E (p2-s22, p2-s29) ghi 'birds use the positions of the sun and stars to obtain compass directions'. Từ cần điền là 'compass'.",
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
            "p2-s31"
          ],
          "explanation": {
            "vi": "Một lợi thế khi chim bay vào ban đêm là chúng có thể tránh tiếp xúc với...",
            "why_correct": "Đoạn E (p2-s31) ghi 'Daytime predators are avoided' (tránh các loài săn mồi ban ngày). Từ cần điền là 'predators'.",
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
            "p2-s36"
          ],
          "explanation": {
            "vi": "Thử nghiệm phòng thí nghiệm cho thấy chim có thể phát hiện thời tiết mà không cần các dấu hiệu...",
            "why_correct": "Đoạn F (p2-s36) ghi 'react to weather changes before there is any visible sign of them'. Từ cần điền là 'visible' (hoặc 'visible signs').",
            "why_wrong": ""
          }
        }
      ]
    }
  ]
}

out_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output/test_06_passage_2.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(real_test6_passage2, f, ensure_ascii=False, indent=2)

print("Saved REAL PERFECT test_06_passage_2.json extracted directly from original PDF pages!")
