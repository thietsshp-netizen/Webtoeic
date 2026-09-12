#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import shutil
from pathlib import Path

# Translation mapping for [1]Merlin.S05E09.With.All.My.Heart.1080p.BluRay.x264-OFT.srt
translations = {
    1: "Ở một vùng đất thần thoại...",
    2: "...và thời kỳ ma thuật...",
    3: "...vận mệnh của một vương quốc vĩ đại...",
    4: "...nằm trên vai một chàng trai trẻ.",
    5: "Tên anh ấy, Merlin.",
    6: "", # [FOOTSTEPS APPROACHING]
    7: "Ai ở đằng kia.",
    8: "Hãy ra đây.",
    9: "Hoàng hậu nương nương?",
    10: "Người có sao không? Có chuyện gì không ổn sao?",
    11: "Không, không. Mọi việc đều ổn.",
    12: "Ra ngoài vào giờ này nguy hiểm lắm.",
    13: "Ta cảm kích vì ngươi luôn cẩn trọng trong nhiệm vụ của mình.",
    14: "Thần không nghĩ là sẽ gặp người ở đây, thưa hoàng hậu.",
    15: "Không phải lúc nào ta cũng muốn làm hoàng hậu đâu, Percival.",
    16: "Ta nhớ khu phố cũ. Những con đường, con người nơi đó.",
    17: "Vì vậy thỉnh thoảng ta quay lại.",
    18: "Như vậy có khôn ngoan không?",
    19: "Chà, mọi người chỉ thấy một hoàng hậu khi họ mong đợi điều đó.",
    20: "- Dù vậy... - Và nó làm ta nhớ đến Elyan.",
    21: "Và đôi khi ta cần cảm giác đó.",
    22: "Tất nhiên rồi.",
    23: "Thần hiểu.",
    24: "Ta không chắc Arthur sẽ hiểu đâu.",
    25: "Thần sẽ không nhắc tới chuyện này.",
    26: "Cảm ơn ngươi.",
    27: "Ngươi đến muộn.",
    28: "- Ta xin lỗi. - Có vấn đề gì sao?",
    29: "Không có gì ta không xử lý được.",
    30: "Ngươi đã lấy được thứ ta yêu cầu chưa?",
    31: "Không dễ dàng gì.",
    32: "Nó ghi chi tiết tuyến đường đoàn thu thuế sẽ đi.",
    33: "Tên các hiệp sĩ, vũ khí và ngày họ khởi hành.",
    34: "Ngươi làm tốt lắm, Gwen.",
    35: "Ta có thể làm gì tiếp theo cho đại nghiệp của chúng ta?",
    36: "", # [WHISPERING INDISTINCTLY]
    37: "Không, thưa bệ hạ.",
    38: "Morgana quá mạnh. Bây giờ chưa phải lúc.",
    39: "- Sao nàng có thể làm vậy? - Nàng không còn là Gwen mà người yêu thương nữa.",
    40: "Nàng đã rơi vào tay một ma thuật hắc ám và hùng mạnh.",
    41: "Nếu ta mất nàng, ta sẽ mất tất cả.",
    42: "Chúng ta sẽ tìm cách đưa nàng trở lại, Arthur.",
    43: "Tôi hứa đấy.",
    44: "Ta nghĩ sáng nay ta sẽ đi cưỡi ngựa.",
    45: "- Vâng? - Nàng có muốn đi cùng ta không?",
    46: "Việc đó không thể rồi.",
    47: "Ồ, vậy có lẽ là chiều nay.",
    48: "Có lẽ vậy.",
    49: "Arthur, mọi chuyện vẫn ổn chứ?",
    50: "Ý nàng là sao?",
    51: "Chàng có vẻ đang phân tâm.",
    52: "Không có gì đâu.",
    53: "Chỉ là vài việc triều chính cấp bách thôi. Xin lỗi nàng.",
    54: "Thiếp hiểu mà.",
    55: "Có điều gì thiếp có thể giúp chàng không?",
    56: "Không cần thiết đâu.",
    57: "Chàng hầu như chưa ăn gì cả.",
    58: "- Ta phải tham gia một buổi tập luyện. - Vậy có lẽ lát nữa gặp lại chàng.",
    59: "Các hiệp sĩ, đây là tuyến đường thu thuế mới. Hãy ghi nhớ nó.",
    60: "- Thưa bệ hạ. - Đừng nói cho ai biết về sự thay đổi kế hoạch này...",
    61: "- ...cho đến khi đội tuần tra lên đường. Rõ chưa? - Rõ, thưa bệ hạ.",
    62: "Mordred?",
    63: "Tất nhiên rồi, nhưng thần có thể hỏi tại sao chúng ta đổi đường không, thưa bệ hạ?",
    64: "- Tuyến này mất thêm một ngày cưỡi ngựa nữa. - Ta không thể nói cho ngươi biết lý do.",
    65: "Ta chỉ mong các ngươi tin tưởng ta.",
    66: "Tốt. Ba ngày nữa chúng ta khởi hành.",
    67: "Sao con lại hứa sẽ giúp Gwen chứ?",
    68: "Con chẳng biết phải làm gì cả.",
    69: "Thực sự không có phương thuốc nào sao?",
    70: "Nếu Gwen phải chịu đựng điều ta nghi ngờ, thì không, ta e là không.",
    71: "Bác biết chuyện gì đã xảy ra với cô ấy.",
    72: "Khi ta còn trẻ, ta từng nghe nói về một nghi lễ cổ xưa của Tôn giáo Cũ...",
    73: "...gọi là Teine Diaga.",
    74: "Teine Diaga sao?",
    75: "Ngọn lửa thiêng.",
    76: "Nghi lễ dùng rễ cây mandrake để gieo rắc nỗi kinh hoàng tột cùng cho nạn nhân.",
    77: "Tiếng thét của họ có thể nghe thấy từ cách xa 20 dặm.",
    78: "Khi nghi lễ kết thúc, ý chí của họ không còn thuộc về bản thân nữa.",
    79: "Họ trở thành nô lệ vĩnh viễn của các nữ tư tế tối cao.",
    80: "- Ai đã thực hiện nghi lễ này? Ở đâu? - Ta đã nói hết những gì ta biết rồi.",
    81: "Những bí thuật này chỉ được truyền lại cho một số ít nữ môn đồ.",
    82: "Khi còn nhỏ, ta chỉ được nghe những lời đồn thổi.",
    83: "Nhất định phải có ai đó có thể giúp đỡ.",
    84: "Ta chỉ nghĩ ra được hai người thực sự am hiểu những phép thuật xưa.",
    85: "Một người là Morgana Pendragon.",
    86: "Người còn lại là Dochraid.",
    87: "Nhưng hãy cẩn thận, Merlin.",
    88: "Không thể tin tưởng Dochraid được đâu.",
    89: "Mụ ta tuyệt đối không được biết danh tính thực sự của con.",
    90: "Kẻ nào dám bước vào hang động thiêng liêng?",
    91: "Tôi đến để xin thỉnh kiến Dochraid.",
    92: "Đưa tay ngươi cho ta.",
    93: "", # [EXHALES]
    94: "", # [SNIFFS]
    95: "", # [GROWLS]
    96: "- Ta ngửi thấy mùi thù hận nồng nặc. - Tôi đến trong hòa bình.",
    97: "- Trong tình bạn hữu. - Ngươi không phải bạn của Tôn giáo Cũ.",
    98: "Càng không phải bạn của Morgana Pendragon.",
    99: "- Hỡi Dochraid vĩ đại... - Câm miệng!",
    100: "Ta biết ngươi, Emrys.",
    101: "Hoàng hậu của ngươi sẽ không tìm thấy sự cứu giúp ở đây đâu.",
    102: "- Làm sao bà biết tại sao tôi đến? - A.",
    103: "Ta là Dochraid.",
    104: "Đất mẹ mách bảo cho ta biết.",
    105: "Ngươi không được chào đón ở đây.",
    106: "- Cút đi! - Ồ, tôi không thể làm vậy.",
    107: "", # Ahh.
    108: "Cho đến khi tôi có được thứ tôi cần.",
    109: "Ngươi dám thách thức ta, Dochraid cổ đại sao?",
    110: "Ngươi, một tên phù thủy cỏn con?",
    111: "Dù vậy, tôi vẫn sẽ lấy được thứ mình cần.",
    112: "", # Hmm.
    113: "Ta là tạo vật của đất mẹ.",
    114: "Ngươi không thể giết được ta.",
    115: "", # [GASPS]
    116: "Thanh kiếm này...",
    117: "...được rèn trong hơi thở của rồng.",
    118: "Và nó sẽ tuân theo lệnh ta.",
    119: "Ngươi không đủ sức mạnh để sử dụng vũ khí như vậy đâu.",
    120: "", # [SCREAMS]
    121: "Tôi không muốn làm hại bà thêm nữa, Dochraid. Hãy nói cho tôi biết điều tôi cần biết.",
    122: "Hoàng hậu của ngươi hết hy vọng rồi, Emrys.",
    123: "Linh hồn nàng đã bị Teine Diaga nuốt chửng.",
    124: "Bị trói buộc bởi vòng xoay bạc đến muôn đời.",
    125: "Thân xác nàng chỉ còn là cái vỏ rỗng bị lấp đầy bởi ý chí của kẻ khác.",
    126: "Morgana.",
    127: "Một khi nàng hết giá trị lợi dụng, thì cái xác đó cũng sẽ bị vứt bỏ.",
    128: "Làm thế nào để tôi hóa giải bùa chú này?",
    129: "Chỉ có phù thủy vĩ đại nhất mới dám thử làm điều đó.",
    130: "", # [GASPS]
    131: "- Bằng cách nào? - Ứ.",
    132: "Ngươi phải đến Vạc Arianrhod.",
    133: "Ở đó ngươi sẽ cần đến toàn bộ sức mạnh của mình...",
    134: "...vì ngươi phải triệu hồi chính Nữ Thần Trắng.",
    135: "", # [GASPS]
    136: "Và chỉ có thế thôi sao?",
    137: "Không đâu, Emrys.",
    138: "Hoàng hậu phải bước vào trong Vạc.",
    139: "Làn nước nơi đó chứa đựng quyền năng của nữ thần.",
    140: "Chỉ có sự tiếp xúc của làn nước ấy mới có thể chữa lành cho nàng.",
    141: "Hãy nhớ lấy, Emrys...",
    142: "...hoàng hậu phải tự nguyện bước vào làn nước.",
    143: "Nếu nàng bị lừa gạt, ép buộc, hay bị mê hoặc...",
    144: "...nàng sẽ rơi vào vực thẳm...",
    145: "...và biến mất vĩnh viễn.",
    146: "Cảm ơn bà, hỡi Dochraid vĩ đại.",
    147: "Cảm ơn bà.",
    148: "", # [CHANTING]
    149: "", # [SCREAMS]
    150: "Thưa bệ hạ?",
    151: "- Mọi chuyện vẫn ổn chứ? - Vẫn ổn, cảm ơn ngươi.",
    152: "Có điều gì thần có thể giúp được không?",
    153: "Sao cơ?",
    154: "Thần chỉ muốn bệ hạ biết rằng thần luôn sẵn sàng phục vụ người.",
    155: "Ta chưa từng nghi ngờ điều đó, Mordred.",
    156: "Có quá nhiều điều có thể xảy ra bất trắc.",
    157: "Và cả việc triệu hồi Nữ Thần Trắng nữa?",
    158: "- Điều đó có thể vượt quá khả năng của con. - Ta không nghĩ vậy.",
    159: "Merlin, người duy nhất nghi ngờ sức mạnh của con chính là con đấy.",
    160: "Và ngay cả khi con làm được điều đó, trước hết chúng ta phải đưa Gwen đến được Vạc thiêng.",
    161: "- Và nàng khó có thể tự nguyện đi cùng. - Ta đã tính đến chuyện đó rồi.",
    162: "- Chiết xuất cà độc dược (belladonna). - Việc học hành của con đã phát huy tác dụng rồi đấy.",
    163: "Nó là một loại độc dược rất mạnh và nguy hiểm, thưa bác Gaius.",
    164: "Nguy hiểm hơn một kẻ phản bội ngay trong tim Camelot sao?",
    165: "Gwen cần phải tỉnh táo khi bước vào Vạc thiêng.",
    166: "Nàng phải tự nguyện bước vào, nếu không bùa chú sẽ không bị phá giải.",
    167: "Điều đó ta đồng ý là có thể nằm ngoài khả năng của chúng ta.",
    168: "- Vậy thì mọi việc còn lại đều vô ích. - Nhưng có một người có thể làm được điều đó.",
    169: "Arthur sao?",
    170: "Chỉ có ngài ấy mới có thể chạm tới phần tâm hồn chân thật còn lại của Gwen.",
    171: "Không được đâu.",
    172: "Con đã đánh giá thấp sức mạnh của tình yêu rồi, Merlin.",
    173: "Không, không phải chuyện đó. Là con. Làm sao con dùng phép thuật khi Arthur ở đó?",
    174: "Ngài ấy sẽ phát hiện ra con ngay lập tức.",
    175: "Sẽ không, nếu ngài ấy không nhận ra con.",
    176: "Không.",
    177: "Không. Đừng bảo lại lần nữa nhé.",
    178: "Bác biết phép biến già làm kiệt sức thế nào mà, bác Gaius.",
    179: "Con không đủ sức vừa làm điều đó vừa thực hiện nghi lễ đâu.",
    180: "Vậy thì con phải tìm ra sức mạnh đó.",
    181: "Loại chiết xuất cà độc dược này, tác dụng của nó thế nào?",
    182: "- Người bệnh sẽ chìm vào giấc ngủ sâu... - Người bệnh?",
    183: "Nó thường được dùng cho những người bị thương rất nặng.",
    184: "- Tác dụng kéo dài bao lâu? - Vài tiếng đồng hồ.",
    185: "Phải cho uống vài lần mỗi ngày để duy trì giấc ngủ liên tục.",
    186: "- Nhưng không được quá ba ngày. - Đúng vậy, thưa bệ hạ.",
    187: "Không nên dùng thuốc này trong thời gian kéo dài.",
    188: "Nếu không thì sao?",
    189: "Cơ thể sẽ không chịu đựng nổi.",
    190: "Cảm ơn ngươi, Merlin.",
    191: "Ba ngày là đủ thời gian để phi ngựa tới Vạc Arianrhod.",
    192: "- Ngươi đã từng tự mình đi chuyến này chưa? - Thần chưa từng đi.",
    193: "Bất kỳ rủi ro nào, bất kỳ tình huống bất ngờ nào...",
    194: "Không có lý do gì để lo sợ mọi chuyện sẽ không suôn sẻ cả.",
    195: "Thưa bệ hạ, nếu chúng ta không làm gì, Gwen coi như đã mất khỏi tay người rồi.",
    196: "Merlin?",
    197: "Triệu hồi vị nữ thần này...",
    198: "...có cần đến phép thuật không?",
    199: "Đó là nghi lễ chỉ có thể được thực hiện bởi một phù thủy.",
    200: "Đó là cách duy nhất, thưa bệ hạ.",
    201: "Phải dùng ma thuật để đánh bại ma thuật.",
    202: "Ta sẽ phải phá vỡ sắc lệnh của chính mình.",
    203: "Để cứu hoàng hậu của người. Để cứu vợ của người.",
    204: "Được rồi.",
    205: "Quyết định vậy đi.",
    206: "Sẽ có một phù thủy. Hắn có đáng tin không?",
    207: "Thần xin lấy mạng sống bảo đảm.",
    208: "Ông từng cam đoan với ta như vậy một lần rồi, Gaius.",
    209: "Rồi phụ vương ta đã chết dưới tay một kẻ như thế.",
    210: "- Phù thủy lần này sẽ hoàn toàn khác. - Sao ông có thể chắc chắn?",
    211: "Bởi vì thưa bệ hạ, lần này, thần đã chọn...",
    212: "...một người phụ nữ.",
    213: "Buổi tập luyện thế nào rồi, thưa chàng?",
    214: "Tốt.",
    215: "Chàng thắng hay thua?",
    216: "Mỗi thứ một chút.",
    217: "Chàng nói dối tệ lắm, Arthur.",
    218: "Chàng vẫn mặc nguyên bộ quần áo sáng nay...",
    219: "...và áo giáp của chàng vẫn chưa hề đụng tới.",
    220: "Thiếp đâu có ngốc.",
    221: "Dù chàng đã ở đâu, thì đó cũng không phải là sân tập.",
    222: "- Ta, ừm... - Thiếp đã làm gì sai sao?",
    223: "Nói lời không phải, hay nói điều gì không nên nói?",
    224: "Thiếp là vợ chàng, Arthur. Thiếp không đời nào muốn thấy chàng tổn thương.",
    225: "Giờ hãy nói cho thiếp biết, điều gì đang làm chàng phiền lòng?",
    226: "Ta yêu nàng, Guinevere, nhiều hơn nàng có thể tưởng tượng.",
    227: "Không có điều gì mà ta không sẵn lòng làm vì nàng.",
    228: "Thiếp biết mà.",
    229: "Bác thấy thế nào?",
    230: "", # Ah.
    231: "- Thực ra nó khá hợp với con đấy. - Hì.",
    232: "- Cảm ơn bác. - Con quên mất một thứ rồi.",
    233: "Ta nghĩ nó cần thêm một chiếc thắt lưng.",
    234: "Hãy nhớ, con phải cho Gwen uống 2 giọt mỗi 2 giờ để giữ cô ấy ngủ say.",
    235: "Bác có thực sự nghĩ chúng ta sẽ thành công không, bác Gaius?",
    236: "Chúng ta buộc phải thành công.",
    237: "", # [GAIUS SPEAKING INDISTINCTLY]
    238: "- Rượu đây, thưa hoàng hậu. - Tối nay ta không uống đâu. Cảm ơn Merlin.",
    239: "Nâng ly nào.",
    240: "Thưa chàng?",
    241: "Nâng ly chúc...",
    242: "Nâng ly chúc mừng hoàng hậu.",
    243: "Thiếp sao? Thiếp đã làm gì đâu?",
    244: "", # [CHUCKLING]
    245: "Chỉ vì người là chính người thôi, thưa hoàng hậu.",
    246: "Ông thật tốt bụng, Gaius, nhưng chẳng phải chúng ta nên chúc...",
    247: "- ...cho Camelot sao? - Vì Camelot, đúng vậy.",
    248: "- Camelot. - Camelot.",
    249: "Vì Camelot.",
    250: "- Người chưa ăn gì cả, thưa bệ hạ. - Chưa.",
    251: "Ta chưa...",
    252: "- Ông có chắc việc này an toàn không, Gaius? - Thần xin đem cả tính mạng bảo đảm, thưa bệ hạ.",
    253: "Có thể ông sẽ phải làm vậy đấy.",
    254: "- Nàng vẫn là hoàng hậu. - Đó là điều tốt nhất thần có thể làm rồi.",
    255: "Chúng ta phải nhanh lên, thưa bệ hạ.",
    256: "Cẩn thận đấy.",
    257: "Được rồi.",
    258: "- Sẽ không ai biết đâu. - Ngươi có chắc việc này sẽ thành công không?",
    259: "Bệ hạ sẽ ngạc nhiên khi thấy tuổi già mang lại nhiều đặc quyền thế nào đấy.",
    260: "Merlin, đi thôi. Chúng ta gặp nhau ở bìa rừng bốc dỡ.",
    261: "- Merlin, nếu ngươi làm rơi nàng... - Tôi biết rồi. Tôi mất đầu chứ gì.",
    262: "Nói trước để ngươi hiểu rõ như vậy.",
    263: "Nhanh chân lên, nhóc. Đi mau.",
    264: "Ta cũng chẳng hiểu sao mình lại giữ nó lại nữa.",
    265: "- Cậu ổn không? - Trông thế mà cô ấy nặng hơn nhiều đấy.",
    266: "- Lời đó rất có thể bị quy vào tội phản quốc đấy. - Ôi, không.",
    267: "", # [CHUCKLES]
    268: "- Bác Gaius và Merlin. - Cùng một xe cút kít chở vải trải giường.",
    269: "- Hiệp sĩ Gwaine, hiệp sĩ Mordred. - Định thay ga giường à?",
    270: "- Hay là định may thêm ít quần áo? - Đừng chạm vào đó!",
    271: "Trừ khi các cậu muốn liều mình nhiễm bệnh sốt ban đỏ.",
    272: "- Thần chưa từng nghe về bệnh đó. - Vậy là cậu thực sự may mắn đấy.",
    273: "May mắn hơn chàng trai trẻ vừa chết trong chính đống khăn trải giường này.",
    274: "Chúng phải được đem đi thiêu hủy ngay lập tức.",
    275: "Điều cuối cùng Camelot cần là một đợt bùng phát sốt ban đỏ, đúng không nào?",
    276: "Vâng. Tất nhiên rồi. Xin lỗi bác.",
    277: "- Bác Gaius? - Thưa ngài?",
    278: "Chàng trai trẻ bất hạnh đó tên là gì?",
    279: "Để ta có thể gửi chút gì đó cho gia đình cậu ấy.",
    280: "Timothy.",
    281: "- Merlin đâu rồi? - Không sao đâu thưa bệ hạ. Cậu ấy tới rồi.",
    282: "Sao ngươi lâu thế?",
    283: "Ngài có biết mấy con dốc đó dốc đến mức nào không?",
    284: "", # [GRUNTS]
    285: "Nàng trông thật ngây thơ và hoàn hảo.",
    286: "Nàng vẫn luôn như vậy, thưa bệ hạ.",
    287: "Sự xấu xa duy nhất trong nàng là do Morgana. Mau lên. Hai người phải lên đường thôi.",
    288: "", # [CHANTING]
    289: "Nữ phù thủy sống ở đỉnh núi tận cùng phía tây.",
    290: "Hẳn là đỉnh cao nhất rồi. Lúc nào chẳng thế, đúng không?",
    291: "Vậy chúng ta nên bắt đầu đi thôi.",
    292: "Chờ đã.",
    293: "Có kẻ đang theo dõi chúng ta.",
    294: "Lại một trong những linh cảm kỳ quặc của ngươi à?",
    295: "Vậy thì tốt rồi.",
    296: "Buộc ngựa ở đây. Đi bộ sẽ nhanh hơn.",
    297: "Còn đồ tiếp tế thì sao?",
    298: "- Chúng ta sẽ xoay xở được. - Chúng ta không thể mang hết được.",
    299: "Ta sẽ bế Guinevere.",
    300: "Hừ, nàng chỉ nặng bằng một nửa đống đồ này thôi.",
    301: "Ngươi muốn ta mạo hiểm sự an toàn của hoàng hậu để vác thêm đồ sao?",
    302: "Tôi có thể bế nàng, và...",
    303: "Nàng là vợ ta.",
    304: "- Tôi sẽ cẩn thận mà. - Và ngươi là người hầu.",
    305: "", # [CHANTING]
    306: "", # [SQUAWKING]
    307: "- Những linh cảm kỳ quặc đó của ngươi... - Chúng không hề kỳ quặc.",
    308: "Vậy thì ngớ ngẩn.",
    309: "Ngươi nghĩ chúng từ đâu ra?",
    310: "Ngươi vẫn ở đó chứ, Merlin?",
    311: "- Đừng nói là ngươi lại dỗi rồi đấy nhé. - Ứ.",
    312: "Tôi không có dỗi.",
    313: "Tôi đang vác một gánh nặng mà ngay cả ngựa cũng phải oằn mình.",
    314: "Tốt cho ngươi thôi.",
    315: "- Sao nó không tốt cho ngài nhỉ? - Ta vốn đã quá hoàn hảo rồi.",
    316: "Chà, có lẽ tôi...",
    317: "Merlin?",
    318: "Merlin?",
    319: "Merlin!",
    320: "", # [SQUAWKING]
    321: "Emrys đang tìm cách phá hoại kế hoạch của ngươi.",
    322: "Hắn định thanh tẩy Guinevere tại Vạc Arianrhod.",
    323: "Không thể nào.",
    324: "", # [GRUMBLING]
    325: "Ngươi phải giúp ta, Aithusa.",
    326: "Chuyện này không thể xảy ra được.",
    327: "", # [ARTHUR GROANING]
    328: "Merlin?",
    329: "Merlin!",
    330: "", # [YELLS]
    331: "", # [GRUNTING]
    332: "Arthur!",
    333: "", # [SIGHS]
    334: "- Kiểm tra Guinevere xem. - Thần đã kiểm tra rồi, thưa bệ hạ.",
    335: "Nàng đang ngủ rất say.",
    336: "", # [SIGHS]
    337: "Thật không thể tin nổi.",
    338: "- Hoàng hậu vốn là người dịu dàng nhất. - Đó chưa bao giờ là nàng.",
    339: "Chỉ là do Morgana thôi.",
    340: "Ta xin lỗi vì đã không tâm sự với ngươi.",
    341: "Bệ hạ không nói là tốt nhất.",
    342: "Nếu thần không nghi ngờ, thần đã không đi theo người.",
    343: "Merlin hành động kỳ lạ.",
    344: "- Chuyện đó có gì lạ đâu? - Và cả việc lộ trình thu thuế bị thay đổi.",
    345: "Ngươi có linh cảm kỳ lạ.",
    346: "Thưa bệ hạ?",
    347: "Ta rất mừng vì ngươi đã làm vậy, Mordred.",
    348: "Nếu không có ngươi, ta e rằng ít nhất ta đã mất một cánh tay rồi.",
    349: "- Con sẽ thức dậy mà. - Merlin, nếu ta phải trông chờ vào sự đúng giờ của ngươi...",
    350: "- ...thì ta đã mất cả tay lẫn chân rồi. - Hì hì.",
    351: "Thật tốt khi có ngươi đi cùng.",
    352: "Ba người lúc nào cũng tốt hơn hai, đúng không Merlin?",
    353: "Tất nhiên rồi.",
    354: "- Đến giờ rồi. - Để tôi làm.",
    355: "Chỉ hai giọt thôi.",
    356: "Cậu không tin tôi đúng không, Merlin?",
    357: "Tôi tin cậu là một...",
    358: "Một hiệp sĩ tài ba.",
    359: "Nhưng không phải là người đáng để tin tưởng.",
    360: "Không sao đâu.",
    361: "Tôi biết trong lòng cậu luôn muốn điều tốt nhất cho nhà vua.",
    362: "Tôi chỉ ước cậu tin rằng tôi cũng vậy.",
    363: "Một ngày nào đó, tôi sẽ chứng minh lòng trung thành của mình với cậu và với đức vua.",
    364: "Khi đó tôi hy vọng chúng ta có thể làm bạn.",
    365: "Tôi cũng chỉ mong ước có thế.",
    366: "Những lá cờ này có ý nghĩa gì?",
    367: "Đánh dấu đường đi cho những người hành hương.",
    368: "Đây là thánh địa của những người theo Tôn giáo Cũ.",
    369: "Sao ngươi biết những điều như vậy?",
    370: "Bác Gaius đã kể cho tôi nghe.",
    371: "- Còn bao xa nữa? - Không xa đâu.",
    372: "Hẻm núi này dẫn đến Vạc thiêng.",
    373: "", # [SCREECHING]
    374: "", # [ROARS]
    375: "Đằng này!",
    376: "Morgana hẳn đang ở rất gần.",
    377: "- Ngài đi đi. Tôi sẽ đánh lạc hướng nó. - Không.",
    378: "- Ngài phải đi. - Ngươi là người duy nhất...",
    379: "- ...biết phù thủy ở đâu. - Arthur!",
    380: "Hãy đưa Gwen đến nơi an toàn, thưa bệ hạ.",
    381: "Chúng thần sẽ yểm trợ và hội ngộ cùng người ở phía bên kia hẻm núi.",
    382: "Được rồi.",
    383: "- Cậu ở lại đây. Tôi sẽ dụ sinh vật đó đi. - Merlin, cậu không thể.",
    384: "Tôi biết mình đang làm gì, Mordred.",
    385: "", # [SCREECHING]
    386: "", # [ROARS]
    387: "", # [CHANTING]
    388: "", # [SCREECHING]
    389: "Chuyện gì đã xảy ra vậy?",
    390: "Merlin.",
    391: "- Đi mau. - Con rồng đâu rồi?",
    392: "Chúng ta phải đi thôi.",
    393: "", # [BOTH GRUNTING]
    394: "Merlin!",
    395: "Mordred đâu rồi?",
    396: "Không được, Arthur.",
    397: "- Ta không thể bỏ rơi một hiệp sĩ. - Tôi đã thấy Morgana.",
    398: "Mordred đã cho chúng ta cơ hội. Chúng ta không thể lãng phí nó.",
    399: "Sao ngươi không giết ta?",
    400: "Mối thù của ta không phải với ngươi, Mordred.",
    401: "Làm sao có thể chứ?",
    402: "Chúng ta là đồng loại.",
    403: "", # [SCOFFS]
    404: "Không bao giờ.",
    405: "Ngươi mặc bộ quân phục rất hợp, nhưng cả hai chúng ta đều biết bên trong là gì.",
    406: "Ngươi nghĩ Arthur sẽ dung thứ cho ngươi dù chỉ một phút nếu hắn biết sự thật sao?",
    407: "Một trong những hiệp sĩ của hắn, lại là một phù thủy?",
    408: "Một ngày nào đó người sẽ biết.",
    409: "Một ngày nào đó chúng ta sẽ được chấp nhận.",
    410: "Sự ngây thơ của ngươi sẽ rất đáng yêu nếu như nó không quá nguy hiểm.",
    411: "- Emrys ở đâu? - Emrys sao?",
    412: "Ngươi giả vờ như không biết ta đang nói về ai sao?",
    413: "Đó là cái tên tôi chỉ mới nghe qua.",
    414: "Hắn không ở đây sao?",
    415: "- Cùng với ngươi? - Nếu có...",
    416: "...chẳng phải cả hai chúng ta đều cảm nhận được sự hiện diện của một đại phù thủy như vậy sao?",
    417: "Vậy thì ta không còn cần đến ngươi nữa.",
    418: "Ngươi lại ra tay với chính đồng loại của mình sao?",
    419: "Ta không đủ mạnh để đánh bại ngươi, Morgana, nhưng hãy nhớ lấy điều này.",
    420: "Sự thù hận như của ngươi sẽ không bao giờ có thể chiến thắng.",
    421: "Ta hy vọng một ngày nào đó ngươi sẽ tìm lại tình yêu và lòng trắc ẩn từng đong đầy trong tim ngươi.",
    422: "Đúng như lời bác Gaius miêu tả.",
    423: "Vạc Arianrhod.",
    424: "", # [GROANS]
    425: "Nữ phù thủy đâu rồi?",
    426: "Bác Gaius nói bà ấy là người ở ẩn. Bà ấy xa lánh đàn ông.",
    427: "Bà ta sẽ phải phá lệ thôi.",
    428: "Chúng ta không có nhiều thời gian. Guinevere có thể tỉnh dậy.",
    429: "- Tôi còn thêm thuốc. - Không.",
    430: "Không dùng nữa. Ta không muốn mạo hiểm.",
    431: "Chúng ta phải tìm bà ta.",
    432: "Để tôi đi tìm bà ấy.",
    433: "Ngài không nghĩ là chuyện này sẽ miễn phí chứ?",
    434: "Ngươi đang nói về cái gì vậy?",
    435: "Nữ phù thủy.",
    436: "Bà ấy thích được trả công bằng quần áo.",
    437: "Bà ấy không thể tới thợ may được.",
    438: "Tại sao một người ở ẩn lại hứng thú với quần áo chứ?",
    439: "Tôi không biết, Arthur. Bà ấy là phù thủy mà. Bà ấy đâu có bình thường được, phải không?",
    440: "Sắp xong rồi, tình yêu của ta.",
    441: "Mordred?",
    442: "- Ta tưởng đã mất ngươi rồi. - Thần cũng nghĩ vậy.",
    443: "Làm sao ngươi thoát khỏi Morgana?",
    444: "Ngay cả ả cũng không phải là đối thủ của một hiệp sĩ Bàn Tròn.",
    445: "Nói nghiêm túc đi, Mordred.",
    446: "Giờ thì hợp lý rồi.",
    447: "- Merlin bảo bà ấy gặp khó khăn trong việc kiếm quần áo. - Ngươi là ai?",
    448: "Các ngươi có việc gì ở nơi linh thiêng này?",
    449: "Bà có phải là Dolma?",
    450: "Nữ phù thủy cổ đại của Vạc Arianrhod?",
    451: "Ngoài ta ra thì còn ai vào đây nữa?",
    452: "Cậu có thấy bà ta trông quen quen không?",
    453: "- Có nét gì đó quen. - Các ngươi nói cái gì?",
    454: "Sao cứ lầm bầm thế?",
    455: "Trông bà quen lắm, hỡi nữ phù thủy.",
    456: "", # Oh, heh.
    457: "Thế à?",
    458: "Đúng vậy.",
    459: "Thưa bệ hạ, Merlin đâu rồi?",
    460: "Bà đã làm gì với người hầu của ta?",
    461: "", # Oh.
    462: "Thằng nhóc lêu nghêu đó à.",
    463: "", # Mm.
    464: "Nếu ngươi giết ta, ngươi sẽ không bao giờ gặp lại nó đâu.",
    465: "Ta là một bà lão già nua.",
    466: "Chẳng phải việc ta tìm kiếm chút bảo đảm là điều tự nhiên sao?",
    467: "Thằng nhóc sẽ được trả lại cho ngươi khi chúng ta xong việc.",
    468: "- Bà biết tại sao chúng tôi ở đây. - Không có gì qua mắt được...",
    469: "...Dolma này cả.",
    470: "Giờ mau lên, trước khi hoàng hậu của ngươi tỉnh lại.",
    471: "Đặt nàng bên cạnh hồ nước.",
    472: "Hỡi vị vua vĩ đại...",
    473: "...ma thuật giam cầm hoàng hậu của ngươi thực sự rất mạnh.",
    474: "Có thể chống lại nó.",
    475: "Có thể phá vỡ nó, nhưng nó cũng có thể chiếm ưu thế.",
    476: "- Ngươi có hiểu điều này không? - Ta hiểu.",
    477: "Việc chúng ta sắp làm sẽ không dễ dàng. Nếu thất bại, hoàng hậu của ngươi sẽ mất đi vĩnh viễn.",
    478: "- Ta hiểu. - Tốt lắm.",
    479: "Khi ta đánh thức Guinevere khỏi giấc ngủ...",
    480: "...nàng phải tự nguyện bước vào Vạc Arianrhod.",
    481: "Chỉ khi đó bùa chú mới được giải, nhưng hãy cẩn thận.",
    482: "Mọi ma thuật trói buộc nàng sẽ chống cự lại.",
    483: "- Vậy làm sao chúng ta có thể thành công? - Ngươi...",
    484: "...phải lay động được nàng, Arthur.",
    485: "Chạm tới phần tâm hồn của hoàng hậu mà sự tà ác của Morgana chưa từng vấy bẩn.",
    486: "- Liệu có một phần như thế không? - Ngươi phải tin là có.",
    487: "Chuẩn bị đi.",
    488: "Khi nàng tỉnh lại, ngươi chỉ có vài khoảnh khắc ngắn ngủi thôi.",
    489: "", # [GROANS]
    490: "", # [CHANTING]
    491: "Ta đang ở đâu thế này?",
    492: "- Các người đã làm gì ta? - Nàng đã ngủ một giấc rất dài.",
    493: "- Guinevere... Guinevere của ta. - Tránh xa ta ra! Guinevere của ngươi sao?",
    494: "Tên đàn ông ngu ngốc si mê. Ta chưa bao giờ là của ngươi và sẽ không bao giờ là của ngươi.",
    495: "Ngươi phải thức tỉnh nàng, Arthur. Hãy lay động nàng nếu không sẽ mất tất cả.",
    496: "- Mụ già xấu xí này là ai? - Nàng từng yêu ta mà.",
    497: "Ngươi thật dễ bị lừa, Arthur.",
    498: "- Và giờ vẫn yêu ta. - Đó chỉ là một trò lừa.",
    499: "Không hơn không kém.",
    500: "Một mưu kế để trao lại Camelot cho nữ hoàng chân chính của nó.",
    501: "- Ta không tin điều đó. - Ngươi muốn tin sao tùy ngươi.",
    502: "- Sự thật vẫn là sự thật. - Không, nàng phải tự nguyện bước vào.",
    503: "Hãy nhìn ta này.",
    504: "- Hãy nói là nàng không yêu ta đi. - Buông ta ra.",
    505: "Arthur.",
    506: "Nàng có nhớ khi ta cầu hôn nàng không?",
    507: "Nàng có nhớ nàng đã nói gì không?",
    508: "Nàng đã nói \"Bằng cả trái tim em\". Đó là những gì nàng đã nói, Guinevere.",
    509: "Đó không phải là mưu kế. Không phải sự lừa gạt.",
    510: "Bằng cả trái tim em.",
    511: "Bằng cả trái tim em.",
    512: "", # [WHIMPERS]
    513: "Bằng cả trái tim em.",
    514: "Đến đây nào.",
    515: "", # [CHANTING]
    516: "Ta nợ bà một món nợ lớn. Cả hai chúng ta đều nợ bà.",
    517: "Nếu có điều gì ta có thể làm để đền đáp... Có lẽ là một chiếc váy mới chăng?",
    518: "- Arthur! - Bà ấy thích quần áo mà.",
    519: "Có một điều.",
    520: "- Hãy nói đi. - Hãy nhớ điều gì đã cứu sống hoàng hậu của ngươi.",
    521: "Ma thuật và phép phù thủy.",
    522: "Cũng chính ma thuật đã mê hoặc nàng.",
    523: "Không có sự xấu xa trong ma thuật, nó chỉ nằm trong lòng dạ con người.",
    524: "Thỉnh cầu của ta là...",
    525: "...ngươi hãy ghi nhớ điều này.",
    526: "Ta xin lấy danh dự hứa với bà.",
    527: "Các ngươi không quên điều gì đấy chứ?",
    528: "", # [SIGHS]
    529: "Ta không nghĩ vậy.",
    530: "Thằng bé?",
    531: "", # Ah. Ah.
    532: "Phải rồi, ta cứ ngỡ mọi chuyện diễn ra suôn sẻ khác thường.",
    533: "Cậu bé đó là sự bảo đảm của ngươi, hỡi vị vua vĩ đại.",
    534: "Không có nó, hoàng hậu của ngươi vẫn sẽ chìm trong u tối.",
    535: "- Ta không chắc điều đó hoàn toàn đúng. - Và ta bảo đúng là như vậy!",
    536: "Ngươi nợ nó một món nợ lớn hơn ngươi có thể biết đấy.",
    537: "Được rồi.",
    538: "Ta xin lỗi. Ta sẽ...",
    539: "...cho nó nghỉ một buổi chiều.",
    540: "", # [SIGHS]
    541: "Một ngày nào đó, hỡi vị vua vĩ đại...",
    542: "...ngươi sẽ nhận ra giá trị đích thực của những người xung quanh ngươi.",
    543: "Đi đi.",
    544: "Arthur là một người may mắn.",
    545: "Đúng vậy.",
    546: "Không chỉ vì có Gwen, mà còn vì có cậu.",
    547: "Ngài ấy sẽ sớm tìm người khác làm việc vặt cho ngài ấy thôi.",
    548: "Đó đâu hẳn là việc vặt.",
    549: "Phép thuật lúc nãy là của cậu, đúng không?",
    550: "Đừng sợ. Tôi sẽ không tiết lộ bí mật của cậu đâu.",
    551: "Tôi ngưỡng mộ cậu.",
    552: "Chắc hẳn không dễ dàng gì khi làm nhiều điều đến thế mà nhận lại quá ít phần thưởng.",
    553: "Tôi không tìm kiếm phần thưởng.",
    554: "- Vậy thì là sự công nhận. - Khi bạn bè tôi được an toàn và bình yên...",
    555: "...đó là tất cả những gì tôi cần.",
    556: "Cậu thấy đấy Merlin, rốt cuộc chúng ta vẫn có điểm chung.",
    557: "Tương lai của Camelot.",
    558: "Merlin.",
    559: "Ta muốn ngươi nói cho ta biết Emrys ở đâu.",
    560: "", # [YELLING]
    561: ""  # [English - US - SDH]
}

def srt_time_to_ass(t_str):
    hours, mins, secs = t_str.split(":")
    secs, millis = secs.split(",")
    h = int(hours)
    cs = round(int(millis) / 10)
    if cs == 100:
        s = int(secs) + 1
        cs = 0
        secs = f"{s:02d}"
    return f"{h}:{mins}:{secs}.{cs:02d}"

def clean_tags_for_ass(text):
    text = text.replace("<i>", "{\\i1}").replace("</i>", "{\\i0}")
    text = text.replace("\n", "\\N")
    return text

def build_ass(subtitles, translations):
    header = """[Script Info]
; Script generated by FFmpeg/Lavc62.28.102
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,16,&Hffffff,&Hffffff,&H0,&H0,0,0,0,0,100,100,0,0,1,1,0,2,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for sub in subtitles:
        cue_id = sub["id"]
        if cue_id == 561 and "[English" in sub["text"]:
            continue
            
        start_ass = srt_time_to_ass(sub["start"])
        end_ass = srt_time_to_ass(sub["end"])
        en_text = clean_tags_for_ass(sub["text"])
        vi_text = translations.get(cue_id, "").strip()
        
        # Color convention requested: English White (&HFFFFFF&), Vietnamese Red (&H0000FF& in BGR)
        if vi_text:
            text_field = f"{{\\c&HFFFFFF&}}{en_text}\\N{{\\r\\c&H0000FF&}}{vi_text}"
        else:
            text_field = f"{{\\c&HFFFFFF&}}{en_text}"
        
        event_line = f"Dialogue: 0,{start_ass},{end_ass},Default,,0,0,0,,{text_field}"
        events.append(event_line)
        
    return header + "\n".join(events) + "\n"

def build_bilingual_srt(subtitles, translations):
    blocks = []
    out_idx = 1
    for sub in subtitles:
        cue_id = sub["id"]
        if cue_id == 561 and "[English" in sub["text"]:
            continue
        time_line = f"{sub['start']} --> {sub['end']}"
        en_text = sub["text"]
        vi_text = translations.get(cue_id, "").strip()
        if vi_text:
            block = f"{out_idx}\n{time_line}\n<font color=\"#FFFFFF\">{en_text}</font>\n<font color=\"#FF0000\">{vi_text}</font>"
        else:
            block = f"{out_idx}\n{time_line}\n<font color=\"#FFFFFF\">{en_text}</font>"
        blocks.append(block)
        out_idx += 1
    return "\n\n".join(blocks) + "\n"

def main():
    target_dir = Path("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Merlin S01- S05/Merlin.S05.1080p.x265-ZMNT")
    source_srt_path = target_dir / "[1]Merlin.S05E09.With.All.My.Heart.1080p.BluRay.x264-OFT.srt"
    
    with open(source_srt_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    raw_blocks = content.strip().split("\n\n")
    subtitles = []
    for block in raw_blocks:
        lines = block.strip().split("\n")
        if len(lines) >= 3:
            idx = int(lines[0])
            time_line = lines[1]
            text = "\n".join(lines[2:])
            m = re.match(r"(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})", time_line)
            if m:
                subtitles.append({
                    "id": idx,
                    "start": m.group(1),
                    "end": m.group(2),
                    "text": text
                })
                
    print(f"Total parsed subtitles from OFT source: {len(subtitles)}")
    
    ass_content = build_ass(subtitles, translations)
    
    # Write main ASS file: Merlin.S05E09.1080p.x265-ZMNT.ass
    ass_path = target_dir / "Merlin.S05E09.1080p.x265-ZMNT.ass"
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_content)
    print(f"Wrote {ass_path} ({len(ass_content)} bytes)")
    
    # Write copy ASS file (matching other episodes in S05)
    ass_copy_path = target_dir / "Merlin.S05E09.1080p.x265-ZMNT copy.ass"
    shutil.copyfile(ass_path, ass_copy_path)
    print(f"Wrote {ass_copy_path}")
    
    # Write bilingual SRT file: Merlin.S05E09.1080p.x265-ZMNT.srt
    target_srt_path = target_dir / "Merlin.S05E09.1080p.x265-ZMNT.srt"
    bilingual_srt_content = build_bilingual_srt(subtitles, translations)
    with open(target_srt_path, "w", encoding="utf-8") as f:
        f.write(bilingual_srt_content)
    print(f"Wrote bilingual {target_srt_path} ({len(bilingual_srt_content)} bytes)")
    
    print("\nSUCCESS! Updated subtitle colors: English in White, Vietnamese in Red.")

if __name__ == "__main__":
    main()
