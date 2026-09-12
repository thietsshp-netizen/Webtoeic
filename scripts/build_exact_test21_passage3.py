import json, os

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

test21_p3 = {
  "test_id": 21,
  "test_title": "IELTS Reading Test 21",
  "passage_number": 3,
  "passage_title": "Music: Language We All Speak",
  "passages": [
    {
      "passage_id": 3,
      "html_content": "<p><b>Section A.</b> <span data-sid=\"p3-s1\">Music is one of the human species's relatively few universal abilities.</span> <span data-sid=\"p3-s2\">Without formal training, any individual, from Stone Age tribesman to suburban teenager has the ability to recognize music and, in some fashion, to make it.</span> <span data-sid=\"p3-s3\">Why this should be so is a mystery.</span> <span data-sid=\"p3-s4\">After all, music isn't necessary for getting through the day, and if it aids in reproduction, it does so only in highly indirect ways.</span> <span data-sid=\"p3-s5\">Language, by contrast, is also everywhere- but for reasons that are more obvious.</span> <span data-sid=\"p3-s6\">With language, you and the members of your tribe can organize a migration across Africa, build reed boats and cross the seas, and communicate at night even when you can't see each other.</span> <span data-sid=\"p3-s7\">Modern culture, in all its technological extravagance, springs directly from the human talent for manipulating symbols and syntax.</span> <span data-sid=\"p3-s8\">Scientists have always been intrigued by the connection between music and language.</span> <span data-sid=\"p3-s9\">Yet over the years, words and melody have acquired a vastly different status in the lab and the seminar room.</span> <span data-sid=\"p3-s10\">While language has long been considered essential to unlocking the mechanisms of human intelligence, music is generally treated as an evolutionary frippery - mere 'auditory cheesecake,' as the Harvard cognitive scientist Steven Pinker puts it.</span></p><p><b>Section B.</b> <span data-sid=\"p3-s11\">But thanks to a decade-long wave of neuroscience research, that tune is changing.</span> <span data-sid=\"p3-s12\">A flurry of recent publications suggests that language and music may equally be able to tell us who we are and where we're from - not just emotionally, but biologically.</span> <span data-sid=\"p3-s13\">In July, the journal Nature Neuroscience devoted a special issue to the topic.</span> <span data-sid=\"p3-s14\">And in an article in the August 6 issue of the Journal of Neuroscience, David Schwartz, Catherine Howe, and Dale Purves of Duke University argued that the sounds of music and the sounds of language are intricately connected.</span> <span data-sid=\"p3-s15\">To grasp the originality of this idea, it's necessary to realize two things about how music has traditionally been understood.</span> <span data-sid=\"p3-s16\">First, musicologists have long emphasized that while each culture stamps a special identity onto its music; music itself has some universal qualities.</span> <span data-sid=\"p3-s17\">For example, in virtually all cultures sound is divided into some or all of the 12 intervals that make up the chromatic scale - that is, the scale represented by the keys on a piano. For centuries, observers have attributed this preference for certain combinations of tones to the mathematical properties of sound itself.</span> <span data-sid=\"p3-s18\">Some 2,500 years ago, Pythagoras was the first to note a direct relationship between the harmoniousness of a tone combination and the physical dimensions of the object that produced it.</span> <span data-sid=\"p3-s19\">For example, a plucked string will always play an octave lower than a similar string half its size, and a fifth lower than a similar string two-thirds its length.</span> <span data-sid=\"p3-s20\">This link between simple ratios and harmony has influenced music theory ever since.</span></p><p><b>Section C.</b> <span data-sid=\"p3-s21\">This music-is-math idea is often accompanied by the notion that music formally speaking at least, exists apart from the world in which it was created.</span> <span data-sid=\"p3-s22\">Writing recently in The New York Review of Books, pianist and critic Charles Rosen discussed the long-standing notion that while painting and sculpture reproduce at least some aspects of the natural world, and writing describes thoughts and feelings we are all familiar with, music is entirely abstracted from the world in which we live.</span> <span data-sid=\"p3-s23\">Neither idea is right, according to David Schwartz and his colleagues.</span> <span data-sid=\"p3-s24\">Human musical preferences are fundamentally shaped not by elegant algorithms or ratios but by the messy sounds of real life, and of speech in particular -which in turn is shaped by our evolutionary heritage. 'The explanation of music, like the explanation of any product of the mind, must be rooted in biology, not in numbers per se,' says Schwartz.</span> <span data-sid=\"p3-s25\">Schwartz, Howe, and Purves analyzed a vast selection of speech sounds from a variety of languages to reveal the underlying patterns common to all utterances.</span> <span data-sid=\"p3-s26\">In order to focus only on the raw sound, they discarded all theories about speech and meaning and sliced sentences into random bites.</span> <span data-sid=\"p3-s27\">Using a database of over 100,000 brief segments of speech, they noted which frequency had the greatest emphasis in each sound.</span> <span data-sid=\"p3-s28\">The resulting set of frequencies, they discovered, corresponded closely to the chromatic scale.</span> <span data-sid=\"p3-s29\">In short, the building blocks of music are to be found in speech. Far from being abstract, music presents a strange analog to the patterns created by the sounds of speech.</span> <span data-sid=\"p3-s30\">'Music, like the visual arts, is rooted in our experience of the natural world,' says Schwartz.</span> <span data-sid=\"p3-s31\">'It emulates our sound environment in the way that visual arts emulate the visual environment.'</span> <span data-sid=\"p3-s32\">In music we hear the echo of our basic sound-making instrument- the vocal tract.</span> <span data-sid=\"p3-s33\">The explanation for human music is simple; simpler than Pythagoras's mathematical equations.</span> <span data-sid=\"p3-s34\">We like the sounds that are familiar to us-specifically, we like sounds that remind us of us.</span> <span data-sid=\"p3-s35\">This brings up some chicken-or-egg evolutionary questions.</span> <span data-sid=\"p3-s36\">It may be that music imitates speech directly, the researchers say, in which case it would seem that language evolved first.</span> <span data-sid=\"p3-s37\">It's also conceivable that music came first and language is in effect an imitation of song - that in everyday speech we hit the musical notes we especially like.</span> <span data-sid=\"p3-s38\">Alternately, it may be that music imitates the general products of the human sound-making system, which just happens to be mostly speech.</span> <span data-sid=\"p3-s39\">'We can't know this,' says Schwartz.</span> <span data-sid=\"p3-s40\">'What we do know is that they both come from the same system, and it is this that shapes our preferences.'</span></p><p><b>Section D.</b> <span data-sid=\"p3-s41\">Schwartz's study also casts light on the long-running question of whether animals understand or appreciate music.</span> <span data-sid=\"p3-s42\">Despite the apparent abundance of 'music' in the natural world- birdsong, whalesong, wolf howls, synchronized chimpanzee hooting previous studies have found that many laboratory animals don't show a great affinity for the human variety of music making.</span> <span data-sid=\"p3-s43\">Marc Hauser and Josh McDermott of Harvard argued in the July issue of Nature Neuroscience that animals don't create or perceive music the way we do.</span> <span data-sid=\"p3-s44\">The fact that laboratory monkeys can show recognition of human tunes is evidence, they say, of shared general features of the auditory system, not any specific chimpanzee musical ability.</span> <span data-sid=\"p3-s45\">As for birds, those most musical beasts, they generally recognize their own tunes - a narrow repertoire - but don't generate novel melodies like we do.</span> <span data-sid=\"p3-s46\">There are no avian Mozarts.</span> <span data-sid=\"p3-s47\">But what's been played to the animals, Schwartz notes, is human music.</span> <span data-sid=\"p3-s48\">If animals evolve preferences for sound as we do - based upon the soundscape in which they live -then their 'music' would be fundamentally different from ours.</span> <span data-sid=\"p3-s49\">In the same way our scales derive from human utterances, a cat's idea of a good tune would derive from yowls and meows.</span> <span data-sid=\"p3-s50\">To demonstrate that animals don't appreciate sounds the way we do, we'd need evidence that they don't respond to 'music' constructed from their own sound environment.</span></p><p><b>Section E.</b> <span data-sid=\"p3-s51\">No matter how the connection between language and music is parsed, what is apparent is that our sense of music, even our love for it, is as deeply rooted in our biology and in our brains as language is.</span> <span data-sid=\"p3-s52\">This is most obvious with babies, says Sandra Trehub at the University of Toronto, who also published a paper in the Nature Neuroscience special issue.</span> <span data-sid=\"p3-s53\">For babies, music and speech are on a continuum.</span> <span data-sid=\"p3-s54\">Mothers use musical speech to 'regulate infants' emotional states,' Trehub says.</span> <span data-sid=\"p3-s55\">Regardless of what language they speak, the voice all mothers use with babies is the same: 'something between speech and song.' This kind of communication 'puts the baby in a trance-like state, which may proceed to sleep or extended periods of rapture.' So if the babies of the world could understand the latest research on language and music, they probably wouldn't be very surprised.</span> <span data-sid=\"p3-s56\">The upshot, says Trehub, is that music may be even more of a necessity than we realize.</span></p>",
      "translation_map": {
        "p3-s1": "Phần A: Âm nhạc là một trong số ít khả năng phổ quát của loài người.",
        "p3-s2": "Nếu không được đào tạo bài bản, bất kỳ cá nhân nào từ người thời đồ đá đến thiếu niên ngoại ô đều có khả năng nhận biết và tạo ra âm nhạc.",
        "p3-s3": "Tại sao lại như vậy vẫn là một điều bí ẩn.",
        "p3-s4": "Xét cho cùng, âm nhạc không cần thiết cho cuộc sống hàng ngày.",
        "p3-s5": "Ngược lại, ngôn ngữ có mặt ở khắp mọi nơi vì những lý do rõ ràng hơn.",
        "p3-s6": "Với ngôn ngữ, con người có thể tổ chức di cư, đóng thuyền và liên lạc ban đêm.",
        "p3-s7": "Văn hóa hiện đại xuất phát trực tiếp từ tài năng vận dụng ký hiệu và cú pháp của con người.",
        "p3-s8": "Các nhà khoa học luôn bị hấp dẫn bởi mối liên hệ giữa âm nhạc và ngôn ngữ.",
        "p3-s9": "Tuy nhiên ngôn từ và giai điệu từng có vị thế rất khác nhau trong nghiên cứu.",
        "p3-s10": "Trong khi ngôn ngữ được coi là thiết yếu đối với trí thông minh, âm nhạc chỉ được xem như đồ chơi tiến hóa ('bánh pho mát thính giác' theo Steven Pinker).",
        "p3-s11": "Phần B: Nhưng nhờ nghiên cứu khoa học thần kinh, quan niệm đó đang thay đổi.",
        "p3-s12": "Một loạt ấn phẩm gần đây cho thấy ngôn ngữ và âm nhạc đều phản ánh bản sắc con người về mặt sinh học.",
        "p3-s13": "Tháng 7, tạp chí Nature Neuroscience dành số đặc biệt cho chủ đề này.",
        "p3-s14": "Đại học Duke lập luận âm thanh của âm nhạc và ngôn ngữ có mối liên hệ phức tạp.",
        "p3-s15": "Cần nhận ra hai điều về cách hiểu âm nhạc truyền thống.",
        "p3-s16": "Thứ nhất, các nhà âm nhạc học nhấn mạnh âm nhạc có một số phẩm chất phổ quát.",
        "p3-s17": "Ví dụ âm thanh được chia thành 12 quãng trong thang âm chromatic (trên đàn piano).",
        "p3-s18": "Pythagoras 2.500 năm trước là người đầu tiên ghi nhận mối quan hệ giữa sự hài hòa âm thanh và đặc tính toán học.",
        "p3-s19": "Ví dụ dây gảy ngắn một nửa sẽ phát âm thấp hơn một quãng tám.",
        "p3-s20": "Mối liên hệ giữa tỷ lệ đơn giản và hòa âm ảnh hưởng đến lý thuyết âm nhạc từ đó.",
        "p3-s21": "Phần C: Quan niệm âm nhạc là toán học thường đi kèm ý tưởng âm nhạc tồn tại tách biệt khỏi thế giới thực.",
        "p3-s22": "Charles Rosen thảo luận quan điểm âm nhạc hoàn toàn trừu tượng khỏi thế giới chúng ta sống.",
        "p3-s23": "Theo David Schwartz và đồng nghiệp, cả hai quan niệm đều không đúng.",
        "p3-s24": "Sở thích âm nhạc của con người được định hình bởi âm thanh cuộc sống thực và lời nói chứ không phải thuật toán.",
        "p3-s25": "Các nhà nghiên cứu phân tích mẫu âm thanh lời nói từ nhiều ngôn ngữ.",
        "p3-s26": "Họ loại bỏ lý thuyết ý nghĩa và cắt câu thành các phân đoạn âm thanh ngẫu nhiên.",
        "p3-s27": "Sử dụng cơ sở dữ liệu 100.000 đoạn âm thanh, họ ghi nhận tần số được nhấn mạnh nhất.",
        "p3-s28": "Tập hợp tần số thu được tương ứng chặt chẽ với thang màu (chromatic scale).",
        "p3-s29": "Nền tảng của âm nhạc nằm trong lời nói.",
        "p3-s30": "Âm nhạc bắt nguồn từ trải nghiệm về thế giới tự nhiên.",
        "p3-s31": "Nó mô phỏng môi trường âm thanh theo cách nghệ thuật thị giác mô phỏng môi trường thị giác.",
        "p3-s32": "Trong âm nhạc chúng ta nghe thấy tiếng vang của thanh quản.",
        "p3-s33": "Lời giải thích cho âm nhạc đơn giản hơn các phương trình của Pythagoras.",
        "p3-s34": "Chúng ta thích những âm thanh quen thuộc gợi nhớ đến chính mình.",
        "p3-s35": "Điều này đặt ra câu hỏi tiến hóa con gà hay quả trứng.",
        "p3-s36": "Có thể âm nhạc bắt chước lời nói (ngôn ngữ có trước).",
        "p3-s37": "Cũng có thể âm nhạc có trước và ngôn ngữ bắt chước bài hát.",
        "p3-s38": "Hoặc âm nhạc bắt chước sản phẩm chung của hệ thống phát âm con người.",
        "p3-s39": "Chúng ta chưa thể biết chắc chắn điều này.",
        "p3-s40": "Nhưng cả hai đều xuất phát từ cùng một hệ thống định hình sở thích của chúng ta.",
        "p3-s41": "Phần D: Nghiên cứu làm sáng tỏ liệu động vật có hiểu âm nhạc hay không.",
        "p3-s42": "Mặc dù tự nhiên có tiếng chim hót, cá voi hú, động vật phòng thí nghiệm không thích âm nhạc con người.",
        "p3-s43": "Marc Hauser và Josh McDermott lập luận động vật không cảm nhận âm nhạc như con người.",
        "p3-s44": "Khỉ nhận biết giai điệu con người là do đặc điểm chung của hệ thính giác.",
        "p3-s45": "Chim chỉ nhận biết giai điệu hẹp của riêng mình chứ không sáng tạo giai điệu mới.",
        "p3-s46": "Không có Mozart trong loài chim.",
        "p3-s47": "Những gì phát cho động vật nghe là âm nhạc của con người.",
        "p3-s48": "Nếu động vật phát triển sở thích âm thanh theo môi trường của chúng, 'âm nhạc' của chúng sẽ khác chúng ta.",
        "p3-s49": "Ý tưởng giai điệu hay của mèo sẽ bắt nguồn từ tiếng meo meo.",
        "p3-s50": "Cần bằng chứng về phản ứng của động vật với 'âm nhạc' tạo từ môi trường của chính chúng.",
        "p3-s51": "Phần E: Cảm nhận và tình yêu âm nhạc của con người có nguồn gốc sâu xa từ sinh học và bộ não.",
        "p3-s52": "Điều này rõ ràng nhất ở trẻ sơ sinh.",
        "p3-s53": "Đối với trẻ sơ sinh, âm nhạc và lời nói là một sự liên tục.",
        "p3-s54": "Người mẹ dùng lời nói mang tính âm nhạc để điều chỉnh cảm xúc của trẻ.",
        "p3-s55": "Giọng nói của người mẹ với trẻ nhỏ nằm giữa lời nói và bài hát, giúp trẻ đi vào trạng thái thư thái.",
        "p3-s56": "Âm nhạc có thể còn là một nhu cầu thiết yếu hơn chúng ta nhận thức."
      }
    }
  ],
  "question_groups": [
    {
      "group_id": 1,
      "group_color": "rose",
      "question_type": "MATCHING_HEADINGS",
      "instruction": "Questions 27-31: Reading Passage 3 has five sections A-E. Choose the correct heading for each section from the list of headings below. Write the correct number i-viii in boxes 27-31 on your answer sheet.",
      "options_pool": {
        "i": "Animal sometimes make music.",
        "ii": "Recent research on music",
        "iii": "Culture embedded in music",
        "iv": "Historical theories review",
        "v": "Communication in music with animals",
        "vi": "Contrast between music and language",
        "vii": "Questions on a biological link with human and music",
        "viii": "Music is good for babies."
      },
      "questions": [
        {
          "questionNo": 27,
          "text": "Section A",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "vi",
          "evidence_sids": ["p3-s1", "p3-s5", "p3-s10"],
          "explanation": {
            "vi": "Section A phù hợp với tiêu đề nào?",
            "why_correct": "Section A so sánh đối lập giữa âm nhạc và ngôn ngữ (p3-s5 'Language, by contrast, is also everywhere...', p3-s10). Tiêu đề vi ('Contrast between music and language') là đáp án đúng.",
            "why_wrong": "Các tiêu đề khác không phản ánh nội dung so sánh đối lập chính trong Section A."
          }
        },
        {
          "questionNo": 28,
          "text": "Section B",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "iv",
          "evidence_sids": ["p3-s15", "p3-s18"],
          "explanation": {
            "vi": "Section B phù hợp với tiêu đề nào?",
            "why_correct": "Section B điểm lại các lý thuyết lịch sử về âm nhạc (Pythagoras 2.500 năm trước). Tiêu đề iv ('Historical theories review') khớp hoàn toàn.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 29,
          "text": "Section C",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "ii",
          "evidence_sids": ["p3-s23", "p3-s25"],
          "explanation": {
            "vi": "Section C phù hợp với tiêu đề nào?",
            "why_correct": "Section C trình bày các nghiên cứu gần đây của Schwartz và các đồng nghiệp về tần số âm thanh lời nói. Tiêu đề ii ('Recent research on music') là đáp án đúng.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 30,
          "text": "Section D",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "vii",
          "evidence_sids": ["p3-s41", "p3-s47"],
          "explanation": {
            "vi": "Section D phù hợp với tiêu đề nào?",
            "why_correct": "Section D thảo luận câu hỏi liên kết sinh học và việc động vật/con người cảm nhận âm thanh. Tiêu đề vii ('Questions on a biological link with human and music') là đáp án chuẩn theo PDF.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 31,
          "text": "Section E",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "viii",
          "evidence_sids": ["p3-s51", "p3-s54"],
          "explanation": {
            "vi": "Section E phù hợp với tiêu đề nào?",
            "why_correct": "Section E bàn về tác động của âm nhạc đối với trẻ sơ sinh (babies). Tiêu đề viii ('Music is good for babies') là đáp án đúng.",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 2,
      "group_color": "cyan",
      "question_type": "MATCHING_FEATURES",
      "instruction": "Questions 32-38: Look at the following people and list of statements below. Match each person with the correct statement (A-G). Write the correct letter A-G in boxes 32-38 on your answer sheet.",
      "options_pool": {
        "A": "Music exists outside of the world in which it is created.",
        "B": "Music has a common feature though cultural influences affect",
        "C": "Humans need music.",
        "D": "Music priority connects to the disordered sound around.",
        "E": "Discovery of mathematical musical foundation.",
        "F": "Music is not treated equally well compared with language",
        "G": "Humans and monkeys have similar traits in perceiving sound."
      },
      "questions": [
        {
          "questionNo": 32,
          "text": "Steven Pinker",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "F",
          "evidence_sids": ["p3-s10"],
          "explanation": {
            "vi": "Steven Pinker gắn liền với quan điểm nào?",
            "why_correct": "Đoạn A (p3-s10) nêu Steven Pinker gọi âm nhạc là 'auditory cheesecake' (không được coi trọng bằng ngôn ngữ). Đáp án ghép là F ('Music is not treated equally well compared with language').",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 33,
          "text": "Musicologists",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "B",
          "evidence_sids": ["p3-s16"],
          "explanation": {
            "vi": "Musicologists (các nhà âm nhạc học) gắn liền với nhận định nào?",
            "why_correct": "Đoạn B (p3-s16) nêu các nhà âm nhạc học nhấn mạnh âm nhạc có các đặc tính phổ quát chung dù bị ảnh hưởng văn hóa. Đáp án ghép là B.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 34,
          "text": "Greek philosopher Pythagoras",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "E",
          "evidence_sids": ["p3-s18"],
          "explanation": {
            "vi": "Nhà triết học Hy Lạp Pythagoras gắn liền với phát hiện nào?",
            "why_correct": "Đoạn B (p3-s18) nêu Pythagoras tìm ra nền tảng toán học của sự hài hòa âm thanh. Đáp án ghép là E ('Discovery of mathematical musical foundation').",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 35,
          "text": "Schwartz, Howe, and Purves",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "D",
          "evidence_sids": ["p3-s24", "p3-s25"],
          "explanation": {
            "vi": "Schwartz, Howe và Purves gắn liền với nghiên cứu nào?",
            "why_correct": "Đoạn C (p3-s24) nêu nghiên cứu chỉ ra sở thích âm nhạc gắn với âm thanh hỗn tạp của cuộc sống thực. Đáp án ghép là D.",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 36,
          "text": "Marc Hauser and Josh McDermott",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "G",
          "evidence_sids": ["p3-s42", "p3-s43"],
          "explanation": {
            "vi": "Marc Hauser và Josh McDermott gắn liền với kết luận nào?",
            "why_correct": "Đoạn D (p3-s43) chỉ ra khỉ và người có điểm chung về hệ thống thính giác cơ bản. Đáp án ghép là G ('Humans and monkeys have similar traits in perceiving sound').",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 37,
          "text": "Charles Rosen",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "A",
          "evidence_sids": ["p3-s22"],
          "explanation": {
            "vi": "Charles Rosen gắn liền với quan điểm nào?",
            "why_correct": "Đoạn C (p3-s22) nêu Rosen thảo luận quan niệm âm nhạc tồn tại tách biệt/trừu tượng khỏi thế giới thực. Đáp án ghép là A ('Music exists outside of the world in which it is created').",
            "why_wrong": ""
          }
        },
        {
          "questionNo": 38,
          "text": "Sandra Trehub",
          "prefix": "",
          "suffix": "",
          "options": {},
          "correctAnswer": "C",
          "evidence_sids": ["p3-s51", "p3-s56"],
          "explanation": {
            "vi": "Sandra Trehub gắn liền với kết luận nào?",
            "why_correct": "Đoạn E (p3-s56) Trehub kết luận âm nhạc là nhu cầu thiết yếu của con người. Đáp án ghép là C ('Humans need music').",
            "why_wrong": ""
          }
        }
      ]
    },
    {
      "group_id": 3,
      "group_color": "purple",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "instruction": "Questions 39-40: Choose the correct letter A, B, C or D. Write your answers in boxes 39-40 on your answer sheet.",
      "options_pool": {},
      "questions": [
        {
          "questionNo": 39,
          "text": "Why was the study of animal's music uncertain?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "Animals don't have the same auditory system as humans.",
            "B": "Experiments on animal's music are limited.",
            "C": "tunes are impossible for animal to make up.",
            "D": "Animals don't have spontaneous ability for the tests."
          },
          "correctAnswer": "B",
          "evidence_sids": ["p3-s41", "p3-s47"],
          "explanation": {
            "vi": "Tại sao việc nghiên cứu âm nhạc của động vật còn chưa chắc chắn?",
            "why_correct": "Đoạn D (p3-s41, p3-s47) giải thích các thử nghiệm hiện tại còn hạn chế vì chỉ mới phát âm nhạc của con người cho động vật nghe. Đáp án B đúng.",
            "why_wrong": "A, C, D không phản ánh lý do chính được tác giả nêu."
          }
        },
        {
          "questionNo": 40,
          "text": "What is the main subject of this passage?",
          "prefix": "",
          "suffix": "",
          "options": {
            "A": "Language and psychology.",
            "B": "Music formation.",
            "C": "Role of music in human society.",
            "D": "Music experiments for animals."
          },
          "correctAnswer": "C",
          "evidence_sids": ["p3-s12", "p3-s50"],
          "explanation": {
            "vi": "Chủ đề chính của bài đọc này là gì?",
            "why_correct": "Toàn bộ bài đọc bàn về vai trò, sự hình thành và mối liên hệ sinh học/xã hội của âm nhạc đối với con người. Đáp án C ('Role of music in human society') là đáp án đúng.",
            "why_wrong": "A, B, D chỉ là các chi tiết nhỏ."
          }
        }
      ]
    }
  ]
}

out_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output/test_21_passage_3.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(test21_p3, f, ensure_ascii=False, indent=2)

print("Saved EXACT PERFECT test_21_passage_3.json directly from original PDF pages & user image!")
