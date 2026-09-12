import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

test10_p1 = {
  "test_id": 10,
  "test_title": "IELTS Reading Test 10",
  "passage_number": 1,
  "passage_title": "Koalas",
  "passages": [
    {
      "passage_id": 1,
      "html_content": "<p><b>A.</b> <span data-sid=\"p1-s1\">Koalas are just too nice for their own good.</span> <span data-sid=\"p1-s2\">And except for the occasional baby taken by birds of prey, koalas have no natural enemies.</span> <span data-sid=\"p1-s3\">In an ideal world, the life of an arboreal couch potato would be perfectly safe and acceptable.</span></p><p><b>B.</b> <span data-sid=\"p1-s4\">Just two hundred years ago, koalas flourished across Australia.</span> <span data-sid=\"p1-s5\">Now they seem to be in decline, but exact numbers are not available as the species would not seem to be 'under threat'.</span> <span data-sid=\"p1-s6\">Their problem, however, has been man, more specifically, the white man.</span> <span data-sid=\"p1-s7\">Koala and aborigine had co-existed peacefully for centuries.</span></p><p><b>C.</b> <span data-sid=\"p1-s8\">Today koalas are found only in scattered pockets of southeast Australia, where they seem to be at risk on several fronts.</span> <span data-sid=\"p1-s9\">The koala's only food source, the eucalyptus tree has declined.</span> <span data-sid=\"p1-s10\">In the past 200 years, a third of Australia's eucalyptus forests have disappeared.</span> <span data-sid=\"p1-s11\">Koalas have been killed by parasites, chlamydia epidemics and a tumour-causing retro-virus.</span> <span data-sid=\"p1-s12\">And every year 11000 are killed by cars, ironically most of them in wildlife sanctuaries, and thousands are killed by poachers.</span> <span data-sid=\"p1-s13\">Some are also taken illegally as pets.</span> <span data-sid=\"p1-s14\">The animals usually soon die, but they are easily replaced.</span></p><p><b>D.</b> <span data-sid=\"p1-s15\">Bush fires pose another threat.</span> <span data-sid=\"p1-s16\">The horrific ones that raged in New South Wales recently killed between 100 and 1000 koalas.</span> <span data-sid=\"p1-s17\">Many that were taken into sanctuaries and shelters were found to have burnt their paws on the glowing embers.</span> <span data-sid=\"p1-s18\">But zoologists say that the species should recover.</span> <span data-sid=\"p1-s19\">The koalas will be aided by the eucalyptus, which grows quickly and is already burgeoning forth after the fires.</span> <span data-sid=\"p1-s20\">So the main problem to their survival is their slow reproductive rate - they produce only one baby a year over a reproductive lifespan of about nine years.</span></p><p><b>E.</b> <span data-sid=\"p1-s21\">The latest problem for the species is perhaps more insidious.</span> <span data-sid=\"p1-s22\">With plush, grey fur, dark amber eyes and button nose, koalas are cuddliness incarnate.</span> <span data-sid=\"p1-s23\">Australian zoos and wildlife parks have taken advantage of their uncomplaining attitudes, and charge visitors to be photographed hugging the furry bundles.</span> <span data-sid=\"p1-s24\">But people may not realise how cruel this is, but because of the koala's delicate disposition, constant handling can push an already precariously balanced physiology over the edge.</span></p><p><b>F.</b> <span data-sid=\"p1-s25\">Koalas only eat the foliage of certain species of eucalyptus trees, between 600 and 1250 grams a day.</span> <span data-sid=\"p1-s26\">The tough leaves are packed with cellulose, tannins, aromatic oils and precursors of toxic cyanides.</span> <span data-sid=\"p1-s27\">To handle this cocktail, koalas have a specialised digestive system.</span> <span data-sid=\"p1-s28\">Cellulose-digesting bacteria in the gut break down fibre, while a specially adapted gut and liver process the toxins.</span> <span data-sid=\"p1-s29\">To digest their food properly, koalas must sit still for 21 hours every day.</span></p><p><b>G.</b> <span data-sid=\"p1-s30\">Koalas are the epitome of innocence and inoffensiveness.</span> <span data-sid=\"p1-s31\">Although they are capable of ripping open a man's arm with their needle-sharp claws, or giving a nasty nip, they simply wouldn't.</span> <span data-sid=\"p1-s32\">If you upset a koala, it may blink or swallow, or hiccup. But attack? No way!</span> <span data-sid=\"p1-s33\">Koalas are just not aggressive.</span> <span data-sid=\"p1-s34\">They use their claws to grip the hard smooth bark of eucalyptus trees.</span></p><p><b>H.</b> <span data-sid=\"p1-s35\">They are also very sensitive, and the slightest upset can prevent them from breeding, cause them to go off their food, and succumb to gut infections.</span> <span data-sid=\"p1-s36\">Koalas are stoic creatures and put on a brave face until they are at death's door.</span> <span data-sid=\"p1-s37\">One day they may appear healthy, the next they could be dead.</span> <span data-sid=\"p1-s38\">Captive koalas have to be weighed daily to check that they are feeding properly.</span> <span data-sid=\"p1-s39\">A sudden loss of weight is usually the only warning keepers have that their charge is ill.</span> <span data-sid=\"p1-s40\">Only two keepers plus a vet were allowed to handle London Zoo's koalas, as these creatures are only comfortable with people they know.</span> <span data-sid=\"p1-s41\">A request for the koala to be taken to meet the Queen was refused because of the distress this would have caused the marsupial.</span> <span data-sid=\"p1-s42\">Sadly, London's Zoo no longer has a koala. Two years ago the female koala died of a cancer caused by a retrovirus.</span> <span data-sid=\"p1-s43\">When they come into heat, female koalas become more active, and start losing weight, but after about sixteen days, heat ends and the weight piles back on.</span> <span data-sid=\"p1-s44\">London's koala did not.</span> <span data-sid=\"p1-s45\">Surgery revealed hundreds of pea-sized tumours.</span> <span data-sid=\"p1-s46\">Almost every zoo in Australia has koalas - the marsupial has become the Animal Ambassador of the nation, but nowhere outside Australia would handling by the public be allowed.</span> <span data-sid=\"p1-s47\">Koala cuddling screams in the face of every rule of good care.</span> <span data-sid=\"p1-s48\">First, some zoos allow koalas to be passed from stranger to stranger, many children who love to squeeze.</span> <span data-sid=\"p1-s49\">Secondly, most people have no idea of how to handle the animals; they like to cling on to their handler, all in their own good time and use his or her arm as a tree.</span> <span data-sid=\"p1-s50\">For such reasons, the Association of Fauna and Marine parks, an Australian conservation society is campaigning to ban koala cuddling.</span> <span data-sid=\"p1-s51\">Policy on koala handling is determined by state government authorities.</span> <span data-sid=\"p1-s52\">And the largest of the numbers in the Australian Nature Conservation Agency, with the aim of instituting national guidelines.</span> <span data-sid=\"p1-s53\">Following a wave of publicity, some zoos and wildlife parks have stopped turning their koalas into photo opportunities.</span></p>",
      "translation_map": {
        "p1-s1": "Gấu túi koala quá hiền lành so với lợi ích của chính mình.",
        "p1-s2": "Ngoại trừ thỉnh thoảng một con koala con bị chim săn mồi bắt đi, koala không có kẻ thù tự nhiên.",
        "p1-s3": "Trong một thế giới lý tưởng, cuộc sống của một sinh vật chỉ ngồi trên cây sẽ hoàn toàn an toàn.",
        "p1-s4": "Chỉ hai trăm năm trước, koala phát triển mạnh mẽ trên khắp nước Úc.",
        "p1-s5": "Bây giờ số lượng dường như đang suy giảm, nhưng con số chính xác không có sẵn vì loài này dường như không nằm trong danh mục bị đe dọa.",
        "p1-s6": "Tuy nhiên, vấn đề của chúng là con người, cụ thể hơn là người da trắng.",
        "p1-s7": "Koala và người thổ dân đã chung sống hòa bình trong nhiều thế kỷ.",
        "p1-s8": "Ngày nay koala chỉ được tìm thấy ở các vùng rải rác phía đông nam nước Úc, nơi chúng gặp nguy hiểm trên nhiều phương diện.",
        "p1-s9": "Nguồn thức ăn duy nhất của koala, cây bạch đàn, đã bị suy giảm.",
        "p1-s10": "Trong 200 năm qua, một phần ba rừng bạch đàn của Úc đã biến mất.",
        "p1-s11": "Koala bị giết bởi ký sinh trùng, dịch bệnh chlamydia và virus gây khối u.",
        "p1-s12": "Và mỗi năm 11.000 con bị xe ô tô tông chết, trớ trêu thay hầu hết ở các khu bảo tồn, và hàng ngàn con bị săn bắt trái phép.",
        "p1-s13": "Một số cũng bị bắt trái phép làm thú cưng.",
        "p1-s14": "Những con vật này thường sớm chết nhưng lại dễ dàng bị thay thế.",
        "p1-s15": "Cháy rừng tạo ra một mối đe dọa khác.",
        "p1-s16": "Những trận cháy rừng khủng khiếp ở New South Wales gần đây đã giết chết từ 100 đến 1.000 con koala.",
        "p1-s17": "Nhiều con được đưa vào khu bảo tồn bị bỏng bàn chân do than hồng.",
        "p1-s18": "Nhưng các nhà động vật học nói rằng loài này sẽ phục hồi.",
        "p1-s19": "Koala sẽ được hỗ trợ bởi cây bạch đàn mọc lại nhanh chóng sau các vụ cháy.",
        "p1-s20": "Vì vậy vấn đề chính cho sự sống sót của chúng là tốc độ sinh sản chậm - chỉ sinh một con một năm trong khoảng 9 năm tuổi thọ sinh sản.",
        "p1-s21": "Vấn đề mới nhất đối với loài này có lẽ còn âm thầm nguy hiểm hơn.",
        "p1-s22": "Với bộ lông xám mềm mại, đôi mắt màu hổ phách sẫm và chiếc mũi đen, koala là hiện thân của sự đáng yêu.",
        "p1-s23": "Các vườn thú Úc đã lợi dụng tính cách hiền lành của chúng, thu tiền du khách để chụp ảnh ôm chúng.",
        "p1-s24": "Nhưng mọi người có thể không nhận ra điều này tàn nhẫn ra sao, vì việc ôm ấp liên tục có thể đẩy thể trạng nhạy cảm của koala đến bờ vực chịu đựng.",
        "p1-s25": "Koala chỉ ăn lá của một số loài bạch đàn nhất định, từ 600 đến 1250 gam một ngày.",
        "p1-s26": "Lá bạch đàn cứng chứa nhiều chất xơ, tannin, tinh dầu và độc tố cyanide.",
        "p1-s27": "Để tiêu hóa hỗn hợp này, koala có hệ tiêu hóa chuyên biệt.",
        "p1-s28": "Vi khuẩn tiêu hóa cellulose trong ruột giúp phân giải chất xơ, trong khi ruột và gan xử lý độc tố.",
        "p1-s29": "Để tiêu hóa thức ăn đúng cách, koala phải ngồi yên 21 giờ mỗi ngày.",
        "p1-s30": "Koala là hình ảnh thu nhỏ của sự vô hại.",
        "p1-s31": "Mặc dù có khả năng xé toạc tay người bằng móng vuốt sắc nhọn, chúng đơn giản là sẽ không làm vậy.",
        "p1-s32": "Nếu làm koala khó chịu, nó chỉ chớp mắt hay nấc cụt. Tấn công ư? Không bao giờ!",
        "p1-s33": "Koala hoàn toàn không hung dữ.",
        "p1-s34": "Chúng dùng móng vuốt để bám vào vỏ cây bạch đàn.",
        "p1-s35": "Chúng cũng rất nhạy cảm, sự xáo trộn nhỏ nhất cũng khiến chúng ngừng sinh sản hoặc nhiễm trùng ruột.",
        "p1-s36": "Koala là sinh vật chịu đựng giỏi và cố tỏ ra bình thường cho đến khi cận kề cái chết.",
        "p1-s37": "Hôm nay chúng trông khỏe mạnh nhưng hôm sau có thể đã chết.",
        "p1-s38": "Koala nuôi nhốt phải được cân hàng ngày để kiểm tra việc ăn uống.",
        "p1-s39": "Sự sụt cân đột ngột là dấu hiệu duy nhất báo hiệu chúng bị bệnh.",
        "p1-s40": "Chỉ hai người chăm sóc và một bác sĩ thú y được phép tiếp xúc với koala ở Vườn thú London.",
        "p1-s41": "Yêu cầu đưa koala đi gặp Nữ hoàng đã bị từ chối vì lo ngại gây căng thẳng cho con vật.",
        "p1-s42": "Đáng buồn là Vườn thú London không còn koala nữa sau khi con cái chết vì ung thư do retrovirus.",
        "p1-s43": "Khi đến kỳ động dục koala cái trở nên năng động hơn và giảm cân nhưng sẽ tăng cân lại sau 16 ngày.",
        "p1-s44": "Con koala ở London đã không tăng cân lại.",
        "p1-s45": "Phẫu thuật phát hiện hàng trăm khối u nhỏ.",
        "p1-s46": "Hầu như mọi vườn thú ở Úc đều có koala - đại sứ động vật của quốc gia.",
        "p1-s47": "Việc cho công chúng ôm ấp koala đi ngược lại mọi quy tắc chăm sóc tốt.",
        "p1-s48": "Thứ nhất một số vườn thú cho phép truyền koala từ người này sang người khác.",
        "p1-s49": "Thứ hai hầu hết mọi người không biết cách bế koala đúng cách.",
        "p1-s50": "Vì những lý do đó các hội bảo tồn đang vận động cấm hoạt động ôm ấp koala.",
        "p1-s51": "Chính sách tiếp xúc koala do cơ quan chính quyền tiểu bang quyết định.",
        "p1-s52": "Cơ quan Bảo tồn Thiên nhiên Úc đang hướng tới việc ban hành bộ hướng dẫn quốc gia.",
        "p1-s53": "Sau làn sóng dư luận nhiều vườn thú đã dừng hoạt động chụp ảnh ôm koala."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "emerald",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Questions 1-5: Choose the correct letter, A, B, C or D. Write the correct letter in boxes 1-5 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 1,
          "text": "The main reason why koala declined is that they are killed EXCEPT FOR",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "by poachers",
            "B": "by diseases they got",
            "C": "giving too many birth yet survived little",
            "D": "accidents on the road"
          },
          "correctAnswer": "C",
          "evidence_sids": ["p1-s11", "p1-s12", "p1-s20"],
          "explanation": {
            "vi": "Lý do chính khiến koala suy giảm là do chúng bị chết BỞI CÁC NGUYÊN NHÂN NGOẠI TRỪ",
            "why_correct": "Đoạn C và D nêu koala bị chết do dịch bệnh (B), tai nạn xe cộ (D), thợ săn trộm (A). Nhưng câu p1-s20 khẳng định koala chỉ đẻ 1 con/năm ('slow reproductive rate'), không phải 'đẻ quá nhiều' (giving too many birth). Phương án ngoại trừ C là đáp án đúng.",
            "why_wrong": "A, B, D đều là các nguyên nhân khiến koala bị chết được đề cập trong bài."
          }
        },
        {
          "questionNo": 2,
          "text": "What can help koalas fully digest their food?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "toxic substance in the leaves",
            "B": "organs that dissolve the fibres",
            "C": "remaining inactive for a period to digest",
            "D": "eating eucalyptus trees"
          },
          "correctAnswer": "C",
          "evidence_sids": ["p1-s29"],
          "explanation": {
            "vi": "Điều gì giúp koala tiêu hóa hoàn toàn thức ăn của chúng?",
            "why_correct": "Đoạn F (p1-s29) ghi rõ: 'To digest their food properly, koalas must sit still for 21 hours every day' (phải ngồi yên/không hoạt động 21 giờ mỗi ngày). Khớp với C ('remaining inactive for a period to digest').",
            "why_wrong": "A, B, D không phải nguyên nhân chính giúp koala tiêu hóa đúng cách được nêu ở p1-s29."
          }
        },
        {
          "questionNo": 3,
          "text": "What would koalas do when facing the dangerous situation?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "show signs of being offended",
            "B": "counter attack furiously",
            "C": "use sharp claws to rip the man",
            "D": "use claws to grip the bark of trees"
          },
          "correctAnswer": "A",
          "evidence_sids": ["p1-s32"],
          "explanation": {
            "vi": "Koala sẽ làm gì khi đối mặt với tình huống nguy hiểm / bị khó chịu?",
            "why_correct": "Đoạn G (p1-s32) ghi: 'If you upset a koala, it may blink or swallow, or hiccup. But attack? No way!' (Nó chỉ chớp mắt, nuốt nước bọt hay nấc cụt - thể hiện dấu hiệu khó chịu). Phương án A đúng.",
            "why_wrong": "B, C sai vì koala không hung dữ tấn công lại."
          }
        },
        {
          "questionNo": 4,
          "text": "In what ways Australian zoos exploit koalas?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "encourage people to breed koalas as pets",
            "B": "allow tourists to hug the koalas",
            "C": "put them on the trees as a symbol",
            "D": "establish a koala campaign"
          },
          "correctAnswer": "B",
          "evidence_sids": ["p1-s23"],
          "explanation": {
            "vi": "Các vườn thú Úc khai thác koala bằng cách nào?",
            "why_correct": "Đoạn E (p1-s23) nêu các vườn thú 'charge visitors to be photographed hugging the furry bundles' (cho phép du khách trả tiền để chụp ảnh ôm koala). Đáp án B đúng.",
            "why_wrong": "A, C, D không phải hình thức khai thác trực tiếp du khách trả tiền ôm koala."
          }
        },
        {
          "questionNo": 5,
          "text": "What would the government do to protect koalas from being endangered?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "introduce koala protection guidelines",
            "B": "close some of the zoos",
            "C": "encourage people to resist visiting the zoos",
            "D": "persuade the public to learn more knowledge"
          },
          "correctAnswer": "A",
          "evidence_sids": ["p1-s52"],
          "explanation": {
            "vi": "Chính phủ sẽ làm gì để bảo vệ koala khỏi nguy cơ tuyệt chủng?",
            "why_correct": "Đoạn H (p1-s52) ghi: 'with the aim of instituting national guidelines' (thiết lập bộ hướng dẫn quốc gia về bảo vệ/tiếp xúc koala). Phương án A đúng.",
            "why_wrong": "B, C, D không được đề cập là hành động chính thức của chính phủ."
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "rose",
      "question_type": "YES_NO_NOT_GIVEN",
      "instruction": "Questions 6-12: Do the following statements agree with the information given in Reading Passage 1? Write YES if the statement is true, NO if the statement is false, NOT GIVEN if the information is not given in the passage.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 6,
          "text": "New coming human settlers caused danger to koalas.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p1-s6"],
          "explanation": {
            "vi": "Những người định cư con người mới đến đã gây ra nguy hiểm cho koala.",
            "why_correct": "Đoạn B (p1-s6) ghi rõ: 'Their problem, however, has been man, more specifically, the white man' (người da trắng mới đến). Đáp án là YES.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 7,
          "text": "Koalas can still be seen in most of the places in Australia.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": ["p1-s8"],
          "explanation": {
            "vi": "Koala vẫn có thể được nhìn thấy ở hầu hết các nơi tại Úc.",
            "why_correct": "Đoạn C (p1-s8) ghi: 'found only in scattered pockets of southeast Australia' (chỉ tìm thấy ở các khu vực rải rác phía đông nam, không phải hầu hết nước Úc). Do đó phát biểu sai, đáp án là NO.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 8,
          "text": "It takes decade for the eucalyptus trees to recover after the fire.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NO",
          "evidence_sids": ["p1-s19"],
          "explanation": {
            "vi": "Mất hàng thập kỷ để cây bạch đàn phục hồi sau hỏa hoạn.",
            "why_correct": "Đoạn D (p1-s19) ghi: 'eucalyptus, which grows quickly and is already burgeoning forth after the fires' (bạch đàn mọc lại RẤT NHANH sau cháy rừng). Do đó câu phát biểu mất hàng thập kỷ là mâu thuẫn, đáp án NO.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 9,
          "text": "Koalas will fight each other when food becomes scarce.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Koala sẽ đánh nhau khi thức ăn trở nên khan hiếm.",
            "why_correct": "Bài đọc hoàn toàn không đề cập việc koala có đánh nhau khi thiếu thức ăn hay không. Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 10,
          "text": "It is not easy to notice that koalas are ill.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p1-s36", "p1-s39"],
          "explanation": {
            "vi": "Rất không dễ để nhận ra koala đang bị bệnh.",
            "why_correct": "Đoạn H (p1-s36, p1-s39) ghi koala cố chịu đựng, hôm trước khỏe hôm sau có thể chết, sụt cân đột ngột là dấu hiệu DUY NHẤT. Phát biểu 'not easy to notice' là đúng, đáp án YES.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 11,
          "text": "Koalas are easily infected with human contagious disease via cuddling.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "NOT GIVEN",
          "evidence_sids": [],
          "explanation": {
            "vi": "Koala dễ bị lây nhiễm bệnh truyền nhiễm của con người qua việc ôm ấp.",
            "why_correct": "Bài đọc nói việc ôm ấp gây áp lực tâm lý/sinh lý cho koala nhưng không đề cập việc lây bệnh truyền nhiễm từ người (human contagious disease). Đáp án là NOT GIVEN.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 12,
          "text": "Koalas like to hold a person's arm when they are embraced.",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "YES",
          "evidence_sids": ["p1-s49"],
          "explanation": {
            "vi": "Koala thích bám vào cánh tay của người khi chúng được bế/ôm.",
            "why_correct": "Đoạn H (p1-s49) ghi: 'they like to cling on to their handler... and use his or her arm as a tree' (thích bám vào người bế và dùng cánh tay họ như cái cây). Đáp án là YES.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "purple",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Question 13: Choose the correct letter, A, B, C or D. Write the correct letter in box 13 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 13,
          "text": "From your opinion this article was written by",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "a journalist who write for magazine",
            "B": "a zoo keeper in London Zoo",
            "C": "a tourist who traveling back from Australia",
            "D": "a government official who studies koalas to establish a law"
          },
          "correctAnswer": "A",
          "evidence_sids": ["p1-s1", "p1-s53"],
          "explanation": {
            "vi": "Theo ý kiến của bạn, bài viết này được viết bởi ai?",
            "why_correct": "Bài viết mang phong cách phóng sự báo chí tổng hợp thông tin sinh thái và truyền thông. Đáp án là A (a journalist who write for magazine).",
            "why_wrong": "B, C, D không phản ánh góc nhìn báo chí đại chúng của toàn bài."
          }
        }
      ]
    }
  ]
}

out_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output/test_10_passage_1.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(test10_p1, f, ensure_ascii=False, indent=2)

print("Saved PERFECT REAL test_10_passage_1.json directly from original PDF pages!")
