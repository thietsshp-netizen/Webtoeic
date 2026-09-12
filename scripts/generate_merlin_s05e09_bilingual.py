#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import shutil
from pathlib import Path

# Translation dictionary mapping cue ID (1 to 512) to Vietnamese translation
translations = {
    1: "Ở một vùng đất thần thoại...",
    2: "...và thời kỳ ma thuật...",
    3: "...vận mệnh của một vương quốc vĩ đại...",
    4: "...nằm trên vai một chàng trai trẻ.",
    5: "Tên anh ấy, Merlin.",
    6: "Ai ở đằng kia.",
    7: "Hãy ra đây.",
    8: "Hoàng hậu nương nương?",
    9: "Người có sao không? Có chuyện gì không ổn sao?",
    10: "Không, không. Mọi việc đều ổn.",
    11: "Ra ngoài vào giờ này nguy hiểm lắm.",
    12: "Ta cảm kích vì ngươi luôn cẩn trọng trong nhiệm vụ của mình.",
    13: "Thần không nghĩ là sẽ gặp người ở đây, thưa hoàng hậu.",
    14: "Không phải lúc nào ta cũng muốn làm hoàng hậu đâu, Percival.",
    15: "Ta nhớ khu phố cũ. Những con đường, con người nơi đó.",
    16: "Vì vậy thỉnh thoảng ta quay lại.",
    17: "Như vậy có khôn ngoan không?",
    18: "Chà, mọi người chỉ thấy một hoàng hậu khi họ mong đợi điều đó.",
    19: "- Dù vậy... - Và nó làm ta nhớ đến Elyan.",
    20: "Và đôi khi ta cần cảm giác đó.",
    21: "Tất nhiên rồi.",
    22: "Thần hiểu.",
    23: "Ta không chắc Arthur sẽ hiểu đâu.",
    24: "Thần sẽ không nhắc tới chuyện này.",
    25: "Cảm ơn ngươi.",
    26: "Ngươi đến muộn.",
    27: "- Ta xin lỗi. - Có vấn đề gì sao?",
    28: "Không có gì ta không xử lý được.",
    29: "Ngươi đã lấy được thứ ta yêu cầu chưa?",
    30: "Không dễ dàng gì.",
    31: "Nó ghi chi tiết tuyến đường đoàn thu thuế sẽ đi.",
    32: "Tên các hiệp sĩ, vũ khí và ngày họ khởi hành.",
    33: "Ngươi làm tốt lắm, Gwen.",
    34: "Ta có thể làm gì tiếp theo cho đại nghiệp của chúng ta?",
    35: "Không, thưa bệ hạ.",
    36: "Morgana quá mạnh. Bây giờ chưa phải lúc.",
    37: "- Sao nàng có thể làm vậy? - Nàng không còn là Gwen mà người yêu thương nữa.",
    38: "Nàng đã rơi vào tay một ma thuật hắc ám và hùng mạnh.",
    39: "Nếu ta mất nàng, ta sẽ mất tất cả.",
    40: "Chúng ta sẽ tìm cách đưa nàng trở lại, Arthur.",
    41: "Tôi hứa đấy.",
    42: "Ta nghĩ sáng nay ta sẽ đi cưỡi ngựa.",
    43: "- Vâng? - Nàng có muốn đi cùng ta không?",
    44: "Việc đó không thể rồi.",
    45: "Ồ, vậy có lẽ là chiều nay.",
    46: "Có lẽ vậy.",
    47: "Arthur, mọi chuyện vẫn ổn chứ?",
    48: "Ý nàng là sao?",
    49: "Chàng có vẻ đang phân tâm.",
    50: "Không có gì đâu.",
    51: "Chỉ là vài việc triều chính cấp bách thôi. Xin lỗi nàng.",
    52: "Thiếp hiểu mà.",
    53: "Có điều gì thiếp có thể giúp chàng không?",
    54: "Không cần thiết đâu.",
    55: "Chàng hầu như chưa ăn gì cả.",
    56: "- Ta phải tham gia một buổi tập luyện. - Vậy có lẽ lát nữa gặp lại chàng.",
    57: "Các hiệp sĩ, đây là tuyến đường thu thuế mới. Hãy ghi nhớ nó.",
    58: "- Thưa bệ hạ. - Đừng nói cho ai biết về sự thay đổi kế hoạch này...",
    59: "- ...cho đến khi đội tuần tra lên đường. Rõ chưa? - Rõ, thưa bệ hạ.",
    60: "Mordred?",
    61: "Tất nhiên rồi, nhưng thần có thể hỏi tại sao chúng ta đổi đường không, thưa bệ hạ?",
    62: "- Tuyến này mất thêm một ngày cưỡi ngựa nữa. - Ta không thể nói cho ngươi biết lý do.",
    63: "Ta chỉ mong các ngươi tin tưởng ta.",
    64: "Tốt. Ba ngày nữa chúng ta khởi hành.",
    65: "Sao con lại hứa sẽ giúp Gwen chứ?",
    66: "Con chẳng biết phải làm gì cả.",
    67: "Thực sự không có phương thuốc nào sao?",
    68: "Nếu Gwen phải chịu đựng điều ta nghi ngờ, thì không, ta e là không.",
    69: "Bác biết chuyện gì đã xảy ra với cô ấy.",
    70: "Khi ta còn trẻ, ta từng nghe nói về một nghi lễ cổ xưa của Tôn giáo Cũ...",
    71: "...gọi là Teine Diaga.",
    72: "Teine Diaga sao?",
    73: "Ngọn lửa thiêng.",
    74: "Nghi lễ dùng rễ cây mandrake để gieo rắc nỗi kinh hoàng tột cùng cho nạn nhân.",
    75: "Tiếng thét của họ có thể nghe thấy từ cách xa 20 dặm.",
    76: "Khi nghi lễ kết thúc, ý chí của họ không còn thuộc về bản thân nữa.",
    77: "Họ trở thành nô lệ vĩnh viễn của các nữ tư tế tối cao.",
    78: "- Ai đã thực hiện nghi lễ này? Ở đâu? - Ta đã nói hết những gì ta biết rồi.",
    79: "Những bí thuật này chỉ được truyền lại cho một số ít nữ môn đồ.",
    80: "Khi còn nhỏ, ta chỉ được nghe những lời đồn thổi.",
    81: "Nhất định phải có ai đó có thể giúp đỡ.",
    82: "Ta chỉ nghĩ ra được hai người thực sự am hiểu những phép thuật xưa.",
    83: "Một người là Morgana Pendragon.",
    84: "Người còn lại là Dochraid.",
    85: "Nhưng hãy cẩn thận, Merlin.",
    86: "Không thể tin tưởng Dochraid được đâu.",
    87: "Mụ ta tuyệt đối không được biết danh tính thực sự của con.",
    88: "Kẻ nào dám bước vào hang động thiêng liêng?",
    89: "Tôi đến để xin thỉnh kiến Dochraid.",
    90: "Đưa tay ngươi cho ta.",
    91: "- Ta ngửi thấy mùi thù hận nồng nặc. - Tôi đến trong hòa bình.",
    92: "- Trong tình bạn hữu. - Ngươi không phải bạn của Tôn giáo Cũ.",
    93: "Càng không phải bạn của Morgana Pendragon.",
    94: "- Hỡi Dochraid vĩ đại... - Câm miệng!",
    95: "Ta biết ngươi, Emrys.",
    96: "Hoàng hậu của ngươi sẽ không tìm thấy sự cứu giúp ở đây đâu.",
    97: "Làm sao bà biết tại sao tôi đến?",
    98: "Ta là Dochraid.",
    99: "Đất mẹ mách bảo cho ta biết.",
    100: "Ngươi không được chào đón ở đây.",
    101: "- Cút đi! - Ồ, tôi không thể làm vậy.",
    102: "Cho đến khi tôi có được thứ tôi cần.",
    103: "Ngươi dám thách thức ta, Dochraid cổ đại sao?",
    104: "Ngươi, một tên phù thủy cỏn con?",
    105: "Dù vậy, tôi vẫn sẽ lấy được thứ mình cần.",
    106: "Ta là tạo vật của đất mẹ.",
    107: "Ngươi không thể giết được ta.",
    108: "Thanh kiếm này...",
    109: "...được rèn trong hơi thở của rồng.",
    110: "Và nó sẽ tuân theo lệnh ta.",
    111: "Ngươi không đủ sức mạnh để sử dụng vũ khí như vậy đâu.",
    112: "Tôi không muốn làm hại bà thêm nữa, Dochraid. Hãy nói cho tôi biết điều tôi cần biết.",
    113: "Hoàng hậu của ngươi hết hy vọng rồi, Emrys.",
    114: "Linh hồn nàng đã bị Teine Diaga nuốt chửng.",
    115: "Bị trói buộc bởi vòng xoay bạc đến muôn đời.",
    116: "Thân xác nàng chỉ còn là cái vỏ rỗng bị lấp đầy bởi ý chí của kẻ khác.",
    117: "Morgana.",
    118: "Một khi nàng hết giá trị lợi dụng, thì cái xác đó cũng sẽ bị vứt bỏ.",
    119: "Làm thế nào để tôi hóa giải bùa chú này?",
    120: "Chỉ có phù thủy vĩ đại nhất mới dám thử làm điều đó.",
    121: "Bằng cách nào?",
    122: "Ngươi phải đến Vạc Arianrhod.",
    123: "Ở đó ngươi sẽ cần đến toàn bộ sức mạnh của mình...",
    124: "...vì ngươi phải triệu hồi chính Nữ Thần Trắng.",
    125: "Và chỉ có thế thôi sao?",
    126: "Không đâu, Emrys.",
    127: "Hoàng hậu phải bước vào trong Vạc.",
    128: "Làn nước nơi đó chứa đựng quyền năng của nữ thần.",
    129: "Chỉ có sự tiếp xúc của làn nước ấy mới có thể chữa lành cho nàng.",
    130: "Hãy nhớ lấy, Emrys...",
    131: "...hoàng hậu phải tự nguyện bước vào làn nước.",
    132: "Nếu nàng bị lừa gạt, ép buộc, hay bị mê hoặc...",
    133: "...nàng sẽ rơi vào vực thẳm...",
    134: "...và biến mất vĩnh viễn.",
    135: "Cảm ơn bà, hỡi Dochraid vĩ đại.",
    136: "Cảm ơn bà.",
    137: "Thưa bệ hạ?",
    138: "- Mọi chuyện vẫn ổn chứ? - Vẫn ổn, cảm ơn ngươi.",
    139: "Có điều gì thần có thể giúp được không?",
    140: "Sao cơ?",
    141: "Thần chỉ muốn bệ hạ biết rằng thần luôn sẵn sàng phục vụ người.",
    142: "Ta chưa từng nghi ngờ điều đó, Mordred.",
    143: "Có quá nhiều điều có thể xảy ra bất trắc.",
    144: "Và cả việc triệu hồi Nữ Thần Trắng nữa?",
    145: "- Điều đó có thể vượt quá khả năng của con. - Ta không nghĩ vậy.",
    146: "Merlin, người duy nhất nghi ngờ sức mạnh của con chính là con đấy.",
    147: "Và ngay cả khi con làm được điều đó, trước hết chúng ta phải đưa Gwen đến được Vạc thiêng.",
    148: "- Và nàng khó có thể tự nguyện đi cùng. - Ta đã tính đến chuyện đó rồi.",
    149: "- Chiết xuất cà độc dược (belladonna). - Việc học hành của con đã phát huy tác dụng rồi đấy.",
    150: "Nó là một loại độc dược rất mạnh và nguy hiểm, thưa bác Gaius.",
    151: "Nguy hiểm hơn một kẻ phản bội ngay trong tim Camelot sao?",
    152: "Gwen cần phải tỉnh táo khi bước vào Vạc thiêng.",
    153: "Nàng phải tự nguyện bước vào, nếu không bùa chú sẽ không bị phá giải.",
    154: "Điều đó ta đồng ý là có thể nằm ngoài khả năng của chúng ta.",
    155: "- Vậy thì mọi việc còn lại đều vô ích. - Nhưng có một người có thể làm được điều đó.",
    156: "Arthur sao?",
    157: "Chỉ có ngài ấy mới có thể chạm tới phần tâm hồn chân thật còn lại của Gwen.",
    158: "Không được đâu.",
    159: "Con đã đánh giá thấp sức mạnh của tình yêu rồi, Merlin.",
    160: "Không, không phải chuyện đó. Là con. Làm sao con dùng phép thuật khi Arthur ở đó?",
    161: "Ngài ấy sẽ phát hiện ra con ngay lập tức.",
    162: "Sẽ không, nếu ngài ấy không nhận ra con.",
    163: "Không.",
    164: "Không. Đừng bảo lại lần nữa nhé.",
    165: "Bác biết phép biến già làm kiệt sức thế nào mà, bác Gaius.",
    166: "Con không đủ sức vừa làm điều đó vừa thực hiện nghi lễ đâu.",
    167: "Vậy thì con phải tìm ra sức mạnh đó.",
    168: "Loại chiết xuất cà độc dược này, tác dụng của nó thế nào?",
    169: "- Người bệnh sẽ chìm vào giấc ngủ sâu... - Người bệnh?",
    170: "Nó thường được dùng cho những người bị thương rất nặng.",
    171: "- Tác dụng kéo dài bao lâu? - Vài tiếng đồng hồ.",
    172: "Phải cho uống vài lần mỗi ngày để duy trì giấc ngủ liên tục.",
    173: "- Nhưng không được quá ba ngày. - Đúng vậy, thưa bệ hạ.",
    174: "Không nên dùng thuốc này trong thời gian kéo dài.",
    175: "Nếu không thì sao?",
    176: "Cơ thể sẽ không chịu đựng nổi.",
    177: "Cảm ơn ngươi, Merlin.",
    178: "Ba ngày là đủ thời gian để phi ngựa tới Vạc Arianrhod.",
    179: "- Ngươi đã từng tự mình đi chuyến này chưa? - Thần chưa từng đi.",
    180: "Bất kỳ rủi ro nào, bất kỳ tình huống bất ngờ nào...",
    181: "Không có lý do gì để lo sợ mọi chuyện sẽ không suôn sẻ cả.",
    182: "Thưa bệ hạ, nếu chúng ta không làm gì, Gwen coi như đã mất khỏi tay người rồi.",
    183: "Merlin?",
    184: "Triệu hồi vị nữ thần này...",
    185: "...có cần đến phép thuật không?",
    186: "Đó là nghi lễ chỉ có thể được thực hiện bởi một phù thủy.",
    187: "Đó là cách duy nhất, thưa bệ hạ.",
    188: "Phải dùng ma thuật để đánh bại ma thuật.",
    189: "Ta sẽ phải phá vỡ sắc lệnh của chính mình.",
    190: "Để cứu hoàng hậu của người. Để cứu vợ của người.",
    191: "Được rồi.",
    192: "Quyết định vậy đi.",
    193: "Sẽ có một phù thủy. Hắn có đáng tin không?",
    194: "Thần xin lấy mạng sống bảo đảm.",
    195: "Ông từng cam đoan với ta như vậy một lần rồi, Gaius.",
    196: "Rồi phụ vương ta đã chết dưới tay một kẻ như thế.",
    197: "- Phù thủy lần này sẽ hoàn toàn khác. - Sao ông có thể chắc chắn?",
    198: "Bởi vì thưa bệ hạ, lần này, thần đã chọn...",
    199: "...một người phụ nữ.",
    200: "Buổi tập luyện thế nào rồi, thưa chàng?",
    201: "Tốt.",
    202: "Chàng thắng hay thua?",
    203: "Mỗi thứ một chút.",
    204: "Chàng nói dối tệ lắm, Arthur.",
    205: "Chàng vẫn mặc nguyên bộ quần áo sáng nay...",
    206: "...và áo giáp của chàng vẫn chưa hề đụng tới.",
    207: "Thiếp đâu có ngốc.",
    208: "Dù chàng đã ở đâu, thì đó cũng không phải là sân tập.",
    209: "- Ta... - Thiếp đã làm gì sai sao?",
    210: "Nói lời không phải, hay nói điều gì không nên nói?",
    211: "Thiếp là vợ chàng, Arthur. Thiếp không đời nào muốn thấy chàng tổn thương.",
    212: "Giờ hãy nói cho thiếp biết, điều gì đang làm chàng phiền lòng?",
    213: "Ta yêu nàng, Guinevere, nhiều hơn nàng có thể tưởng tượng.",
    214: "Không có điều gì mà ta không sẵn lòng làm vì nàng.",
    215: "Thiếp biết mà.",
    216: "Bác thấy thế nào?",
    217: "Thực ra nó khá hợp với con đấy.",
    218: "- Cảm ơn bác. - Con quên mất một thứ rồi.",
    219: "Ta nghĩ nó cần thêm một chiếc thắt lưng.",
    220: "Hãy nhớ, con phải cho Gwen uống 2 giọt mỗi 2 giờ để giữ cô ấy ngủ say.",
    221: "Bác có thực sự nghĩ chúng ta sẽ thành công không, bác Gaius?",
    222: "Chúng ta buộc phải thành công.",
    223: "- Rượu đây, thưa hoàng hậu. - Tối nay ta không uống đâu. Cảm ơn Merlin.",
    224: "Nâng ly nào.",
    225: "Thưa chàng?",
    226: "Nâng ly chúc...",
    227: "Nâng ly chúc mừng hoàng hậu.",
    228: "Thiếp sao? Thiếp đã làm gì đâu?",
    229: "Chỉ vì người là chính người thôi, thưa hoàng hậu.",
    230: "Ông thật tốt bụng, Gaius, nhưng chẳng phải chúng ta nên chúc...",
    231: "- ...cho Camelot sao? - Vì Camelot, đúng vậy.",
    232: "- Camelot. - Camelot.",
    233: "Vì Camelot.",
    234: "- Người chưa ăn gì cả, thưa bệ hạ. - Chưa.",
    235: "Ta chưa...",
    236: "- Ông có chắc việc này an toàn không, Gaius? - Thần xin đem cả tính mạng bảo đảm, thưa bệ hạ.",
    237: "Có thể ông sẽ phải làm vậy đấy.",
    238: "- Nàng vẫn là hoàng hậu. - Đó là điều tốt nhất thần có thể làm rồi.",
    239: "Chúng ta phải nhanh lên, thưa bệ hạ.",
    240: "Cẩn thận đấy.",
    241: "Được rồi.",
    242: "- Sẽ không ai biết đâu. - Ngươi có chắc việc này sẽ thành công không?",
    243: "Bệ hạ sẽ ngạc nhiên khi thấy tuổi già mang lại nhiều đặc quyền thế nào đấy.",
    244: "Merlin, đi thôi. Chúng ta gặp nhau ở bìa rừng bốc dỡ.",
    245: "- Merlin, nếu ngươi làm rơi nàng... - Tôi biết rồi. Tôi mất đầu chứ gì.",
    246: "Nói trước để ngươi hiểu rõ như vậy.",
    247: "Nhanh chân lên, nhóc. Đi mau.",
    248: "Ta cũng chẳng hiểu sao mình lại giữ nó lại nữa.",
    249: "- Cậu ổn không? - Trông thế mà cô ấy nặng hơn nhiều đấy.",
    250: "- Lời đó rất có thể bị quy vào tội phản quốc đấy. - Ôi, không.",
    251: "- Bác Gaius và Merlin. - Cùng một xe cút kít chở vải trải giường.",
    252: "- Hiệp sĩ Gwaine, hiệp sĩ Mordred. - Định thay ga giường à?",
    253: "- Hay là định may thêm ít quần áo? - Đừng chạm vào đó!",
    254: "Trừ khi các cậu muốn liều mình nhiễm bệnh sốt ban đỏ.",
    255: "- Thần chưa từng nghe về bệnh đó. - Vậy là cậu thực sự may mắn đấy.",
    256: "May mắn hơn chàng trai trẻ vừa chết trong chính đống khăn trải giường này.",
    257: "Chúng phải được đem đi thiêu hủy ngay lập tức.",
    258: "Điều cuối cùng Camelot cần là một đợt bùng phát sốt ban đỏ, đúng không nào?",
    259: "Vâng. Tất nhiên rồi. Xin lỗi bác.",
    260: "- Bác Gaius? - Thưa ngài?",
    261: "Chàng trai trẻ bất hạnh đó tên là gì?",
    262: "Để ta có thể gửi chút gì đó cho gia đình cậu ấy.",
    263: "Timothy.",
    264: "- Merlin đâu rồi? - Không sao đâu thưa bệ hạ. Cậu ấy tới rồi.",
    265: "Sao ngươi lâu thế?",
    266: "Ngài có biết mấy con dốc đó dốc đến mức nào không?",
    267: "Nàng trông thật ngây thơ và hoàn hảo.",
    268: "Nàng vẫn luôn như vậy, thưa bệ hạ.",
    269: "Sự xấu xa duy nhất trong nàng là do Morgana. Mau lên. Hai người phải lên đường thôi.",
    270: "Nữ phù thủy sống ở đỉnh núi tận cùng phía tây.",
    271: "Hẳn là đỉnh cao nhất rồi. Lúc nào chẳng thế, đúng không?",
    272: "Vậy chúng ta nên bắt đầu đi thôi.",
    273: "Chờ đã.",
    274: "Có kẻ đang theo dõi chúng ta.",
    275: "Lại một trong những linh cảm kỳ quặc của ngươi à?",
    276: "Vậy thì tốt rồi.",
    277: "Buộc ngựa ở đây. Đi bộ sẽ nhanh hơn.",
    278: "Còn đồ tiếp tế thì sao?",
    279: "- Chúng ta sẽ xoay xở được. - Chúng ta không thể mang hết được.",
    280: "Ta sẽ bế Guinevere.",
    281: "Hừ, nàng chỉ nặng bằng một nửa đống đồ này thôi.",
    282: "Ngươi muốn ta mạo hiểm sự an toàn của hoàng hậu để vác thêm đồ sao?",
    283: "Tôi có thể bế nàng, và...",
    284: "Nàng là vợ ta.",
    285: "- Tôi sẽ cẩn thận mà. - Và ngươi là người hầu.",
    286: "- Những linh cảm kỳ quặc đó của ngươi... - Chúng không hề kỳ quặc.",
    287: "Vậy thì ngớ ngẩn.",
    288: "Ngươi nghĩ chúng từ đâu ra?",
    289: "Ngươi vẫn ở đó chứ, Merlin?",
    290: "Đừng nói là ngươi lại dỗi rồi đấy nhé.",
    291: "Tôi không có dỗi.",
    292: "Tôi đang vác một gánh nặng mà ngay cả ngựa cũng phải oằn mình.",
    293: "Tốt cho ngươi thôi.",
    294: "- Sao nó không tốt cho ngài nhỉ? - Ta vốn đã quá hoàn hảo rồi.",
    295: "Chà, có lẽ tôi...",
    296: "Merlin?",
    297: "Merlin?",
    298: "Merlin!",
    299: "Emrys đang tìm cách phá hoại kế hoạch của ngươi.",
    300: "Hắn định thanh tẩy Guinevere tại Vạc Arianrhod.",
    301: "Không thể nào.",
    302: "Ngươi phải giúp ta, Aithusa.",
    303: "Chuyện này không thể xảy ra được.",
    304: "Merlin?",
    305: "Merlin!",
    306: "Arthur!",
    307: "- Kiểm tra Guinevere xem. - Thần đã kiểm tra rồi, thưa bệ hạ.",
    308: "Nàng đang ngủ rất say.",
    309: "Thật không thể tin nổi.",
    310: "- Hoàng hậu vốn là người dịu dàng nhất. - Đó chưa bao giờ là nàng.",
    311: "Chỉ là do Morgana thôi.",
    312: "Ta xin lỗi vì đã không tâm sự với ngươi.",
    313: "Bệ hạ không nói là tốt nhất.",
    314: "Nếu thần không nghi ngờ, thần đã không đi theo người.",
    315: "Merlin hành động kỳ lạ.",
    316: "- Chuyện đó có gì lạ đâu? - Và cả việc lộ trình thu thuế bị thay đổi.",
    317: "Ngươi có linh cảm kỳ lạ.",
    318: "Thưa bệ hạ?",
    319: "Ta rất mừng vì ngươi đã làm vậy, Mordred.",
    320: "Nếu không có ngươi, ta e rằng ít nhất ta đã mất một cánh tay rồi.",
    321: "- Con sẽ thức dậy mà. - Merlin, nếu ta phải trông chờ vào sự đúng giờ của ngươi...",
    322: "Thì ta đã mất cả tay lẫn chân rồi.",
    323: "Thật tốt khi có ngươi đi cùng.",
    324: "Ba người lúc nào cũng tốt hơn hai, đúng không Merlin?",
    325: "Tất nhiên rồi.",
    326: "- Đến giờ rồi. - Để tôi làm.",
    327: "Chỉ hai giọt thôi.",
    328: "Cậu không tin tôi đúng không, Merlin?",
    329: "Tôi tin cậu là một...",
    330: "Một hiệp sĩ tài ba.",
    331: "Nhưng không phải là người đáng để tin tưởng.",
    332: "Không sao đâu.",
    333: "Tôi biết trong lòng cậu luôn muốn điều tốt nhất cho nhà vua.",
    334: "Tôi chỉ ước cậu tin rằng tôi cũng vậy.",
    335: "Một ngày nào đó, tôi sẽ chứng minh lòng trung thành của mình với cậu và với đức vua.",
    336: "Khi đó tôi hy vọng chúng ta có thể làm bạn.",
    337: "Tôi cũng chỉ mong ước có thế.",
    338: "Những lá cờ này có ý nghĩa gì?",
    339: "Đánh dấu đường đi cho những người hành hương.",
    340: "Đây là thánh địa của những người theo Tôn giáo Cũ.",
    341: "Sao ngươi biết những điều như vậy?",
    342: "Bác Gaius đã kể cho tôi nghe.",
    343: "- Còn bao xa nữa? - Không xa đâu.",
    344: "Hẻm núi này dẫn đến Vạc thiêng.",
    345: "Đằng này!",
    346: "Morgana hẳn đang ở rất gần.",
    347: "- Ngài đi đi. Tôi sẽ đánh lạc hướng nó. - Không.",
    348: "- Ngài phải đi. - Ngươi là người duy nhất...",
    349: "- ...biết phù thủy ở đâu. - Arthur!",
    350: "Hãy đưa Gwen đến nơi an toàn, thưa bệ hạ.",
    351: "Chúng thần sẽ yểm trợ và hội ngộ cùng người ở phía bên kia hẻm núi.",
    352: "Được rồi.",
    353: "- Cậu ở lại đây. Tôi sẽ dụ sinh vật đó đi. - Merlin, cậu không thể.",
    354: "Tôi biết mình đang làm gì, Mordred.",
    355: "Chuyện gì đã xảy ra vậy?",
    356: "Merlin.",
    357: "- Đi mau. - Con rồng đâu rồi?",
    358: "Chúng ta phải đi thôi.",
    359: "Merlin!",
    360: "Mordred đâu rồi?",
    361: "Không được, Arthur.",
    362: "- Ta không thể bỏ rơi một hiệp sĩ. - Tôi đã thấy Morgana.",
    363: "Mordred đã cho chúng ta cơ hội. Chúng ta không thể lãng phí nó.",
    364: "Sao ngươi không giết ta?",
    365: "Mối thù của ta không phải với ngươi, Mordred.",
    366: "Làm sao có thể chứ?",
    367: "Chúng ta là đồng loại.",
    368: "Không bao giờ.",
    369: "Ngươi mặc bộ quân phục rất hợp, nhưng cả hai chúng ta đều biết bên trong là gì.",
    370: "Ngươi nghĩ Arthur sẽ dung thứ cho ngươi dù chỉ một phút nếu hắn biết sự thật sao?",
    371: "Một trong những hiệp sĩ của hắn, lại là một phù thủy?",
    372: "Một ngày nào đó người sẽ biết.",
    373: "Một ngày nào đó chúng ta sẽ được chấp nhận.",
    374: "Sự ngây thơ của ngươi sẽ rất đáng yêu nếu như nó không quá nguy hiểm.",
    375: "- Emrys ở đâu? - Emrys sao?",
    376: "Ngươi giả vờ như không biết ta đang nói về ai sao?",
    377: "Đó là cái tên tôi chỉ mới nghe qua.",
    378: "Hắn không ở đây sao?",
    379: "- Cùng với ngươi? - Nếu có...",
    380: "...chẳng phải cả hai chúng ta đều cảm nhận được sự hiện diện của một đại phù thủy như vậy sao?",
    381: "Vậy thì ta không còn cần đến ngươi nữa.",
    382: "Ngươi lại ra tay với chính đồng loại của mình sao?",
    383: "Ta không đủ mạnh để đánh bại ngươi, Morgana, nhưng hãy nhớ lấy điều này.",
    384: "Sự thù hận như của ngươi sẽ không bao giờ có thể chiến thắng.",
    385: "Ta hy vọng một ngày nào đó ngươi sẽ tìm lại tình yêu và lòng trắc ẩn từng đong đầy trong tim ngươi.",
    386: "Đúng như lời bác Gaius miêu tả.",
    387: "Vạc Arianrhod.",
    388: "Nữ phù thủy đâu rồi?",
    389: "Bác Gaius nói bà ấy là người ở ẩn. Bà ấy xa lánh đàn ông.",
    390: "Bà ta sẽ phải phá lệ thôi.",
    391: "Chúng ta không có nhiều thời gian. Guinevere có thể tỉnh dậy.",
    392: "- Tôi còn thêm thuốc. - Không.",
    393: "Không dùng nữa. Ta không muốn mạo hiểm.",
    394: "Chúng ta phải tìm bà ta.",
    395: "Để tôi đi tìm bà ấy.",
    396: "Ngài không nghĩ là chuyện này sẽ miễn phí chứ?",
    397: "Ngươi đang nói về cái gì vậy?",
    398: "Nữ phù thủy.",
    399: "Bà ấy thích được trả công bằng quần áo.",
    400: "Bà ấy không thể tới thợ may được.",
    401: "Tại sao một người ở ẩn lại hứng thú với quần áo chứ?",
    402: "Tôi không biết, Arthur. Bà ấy là phù thủy mà. Bà ấy đâu có bình thường được, phải không?",
    403: "Sắp xong rồi, tình yêu của ta.",
    404: "Mordred?",
    405: "- Ta tưởng đã mất ngươi rồi. - Thần cũng nghĩ vậy.",
    406: "Làm sao ngươi thoát khỏi Morgana?",
    407: "Ngay cả ả cũng không phải là đối thủ của một hiệp sĩ Bàn Tròn.",
    408: "Nói nghiêm túc đi, Mordred.",
    409: "Giờ thì hợp lý rồi.",
    410: "- Merlin bảo bà ấy gặp khó khăn trong việc kiếm quần áo. - Ngươi là ai?",
    411: "Các ngươi có việc gì ở nơi linh thiêng này?",
    412: "Bà có phải là Dolma?",
    413: "Nữ phù thủy cổ đại của Vạc Arianrhod?",
    414: "Ngoài ta ra thì còn ai vào đây nữa?",
    415: "Cậu có thấy bà ta trông quen quen không?",
    416: "- Có nét gì đó quen. - Các ngươi nói cái gì?",
    417: "Sao cứ lầm bầm thế?",
    418: "Trông bà quen lắm, hỡi nữ phù thủy.",
    419: "Thế à?",
    420: "Đúng vậy.",
    421: "Thưa bệ hạ, Merlin đâu rồi?",
    422: "Bà đã làm gì với người hầu của ta?",
    423: "Thằng nhóc lêu nghêu đó à.",
    424: "Nếu ngươi giết ta, ngươi sẽ không bao giờ gặp lại nó đâu.",
    425: "Ta là một bà lão già nua.",
    426: "Chẳng phải việc ta tìm kiếm chút bảo đảm là điều tự nhiên sao?",
    427: "Thằng nhóc sẽ được trả lại cho ngươi khi chúng ta xong việc.",
    428: "- Bà biết tại sao chúng tôi ở đây. - Không có gì qua mắt được...",
    429: "...Dolma này cả.",
    430: "Giờ mau lên, trước khi hoàng hậu của ngươi tỉnh lại.",
    431: "Đặt nàng bên cạnh hồ nước.",
    432: "Hỡi vị vua vĩ đại...",
    433: "...ma thuật giam cầm hoàng hậu của ngươi thực sự rất mạnh.",
    434: "Có thể chống lại nó.",
    435: "Có thể phá vỡ nó, nhưng nó cũng có thể chiếm ưu thế.",
    436: "- Ngươi có hiểu điều này không? - Ta hiểu.",
    437: "Việc chúng ta sắp làm sẽ không dễ dàng. Nếu thất bại, hoàng hậu của ngươi sẽ mất đi vĩnh viễn.",
    438: "- Ta hiểu. - Tốt lắm.",
    439: "Khi ta đánh thức Guinevere khỏi giấc ngủ...",
    440: "...nàng phải tự nguyện bước vào Vạc Arianrhod.",
    441: "Chỉ khi đó bùa chú mới được giải, nhưng hãy cẩn thận.",
    442: "Mọi ma thuật trói buộc nàng sẽ chống cự lại.",
    443: "- Vậy làm sao chúng ta có thể thành công? - Ngươi...",
    444: "...phải lay động được nàng, Arthur.",
    445: "Chạm tới phần tâm hồn của hoàng hậu mà sự tà ác của Morgana chưa từng vấy bẩn.",
    446: "- Liệu có một phần như thế không? - Ngươi phải tin là có.",
    447: "Chuẩn bị đi.",
    448: "Khi nàng tỉnh lại, ngươi chỉ có vài khoảnh khắc ngắn ngủi thôi.",
    449: "Ta đang ở đâu thế này?",
    450: "- Các người đã làm gì ta? - Nàng đã ngủ một giấc rất dài.",
    451: "- Guinevere... Guinevere của ta. - Tránh xa ta ra! Guinevere của ngươi sao?",
    452: "Tên đàn ông ngu ngốc si mê. Ta chưa bao giờ là của ngươi và sẽ không bao giờ là của ngươi.",
    453: "Ngươi phải thức tỉnh nàng, Arthur. Hãy lay động nàng nếu không sẽ mất tất cả.",
    454: "- Mụ già xấu xí này là ai? - Nàng từng yêu ta mà.",
    455: "Ngươi thật dễ bị lừa, Arthur.",
    456: "- Và giờ vẫn yêu ta. - Đó chỉ là một trò lừa.",
    457: "Không hơn không kém.",
    458: "Một mưu kế để trao lại Camelot cho nữ hoàng chân chính của nó.",
    459: "- Ta không tin điều đó. - Ngươi muốn tin sao tùy ngươi.",
    460: "- Sự thật vẫn là sự thật. - Không, nàng phải tự nguyện bước vào.",
    461: "Hãy nhìn ta này.",
    462: "- Hãy nói là nàng không yêu ta đi. - Buông ta ra.",
    463: "Arthur.",
    464: "Nàng có nhớ khi ta cầu hôn nàng không?",
    465: "Nàng có nhớ nàng đã nói gì không?",
    466: "Nàng đã nói \"Bằng cả trái tim em\". Đó là những gì nàng đã nói, Guinevere.",
    467: "Đó không phải là mưu kế. Không phải sự lừa gạt.",
    468: "Bằng cả trái tim em.",
    469: "Bằng cả trái tim em.",
    470: "Bằng cả trái tim em.",
    471: "Đến đây nào.",
    472: "Ta nợ bà một món nợ lớn. Cả hai chúng ta đều nợ bà.",
    473: "Nếu có điều gì ta có thể làm để đền đáp... Có lẽ là một chiếc váy mới chăng?",
    474: "- Arthur! - Bà ấy thích quần áo mà.",
    475: "Có một điều.",
    476: "- Hãy nói đi. - Hãy nhớ điều gì đã cứu sống hoàng hậu của ngươi.",
    477: "Ma thuật và phép phù thủy.",
    478: "Cũng chính ma thuật đã mê hoặc nàng.",
    479: "Không có sự xấu xa trong ma thuật, nó chỉ nằm trong lòng dạ con người.",
    480: "Thỉnh cầu của ta là...",
    481: "...ngươi hãy ghi nhớ điều này.",
    482: "Ta xin lấy danh dự hứa với bà.",
    483: "Các ngươi không quên điều gì đấy chứ?",
    484: "Ta không nghĩ vậy.",
    485: "Thằng bé?",
    486: "Phải rồi, ta cứ ngỡ mọi chuyện diễn ra suôn sẻ khác thường.",
    487: "Cậu bé đó là sự bảo đảm của ngươi, hỡi vị vua vĩ đại.",
    488: "Không có nó, hoàng hậu của ngươi vẫn sẽ chìm trong u tối.",
    489: "- Ta không chắc điều đó hoàn toàn đúng. - Và ta bảo đúng là như vậy!",
    490: "Ngươi nợ nó một món nợ lớn hơn ngươi có thể biết đấy.",
    491: "Được rồi.",
    492: "Ta xin lỗi. Ta sẽ...",
    493: "...cho nó nghỉ một buổi chiều.",
    494: "Một ngày nào đó, hỡi vị vua vĩ đại...",
    495: "...ngươi sẽ nhận ra giá trị đích thực của những người xung quanh ngươi.",
    496: "Đi đi.",
    497: "Arthur là một người may mắn.",
    498: "Đúng vậy.",
    499: "Không chỉ vì có Gwen, mà còn vì có cậu.",
    500: "Ngài ấy sẽ sớm tìm người khác làm việc vặt cho ngài ấy thôi.",
    501: "Đó đâu hẳn là việc vặt.",
    502: "Phép thuật lúc nãy là của cậu, đúng không?",
    503: "Đừng sợ. Tôi sẽ không tiết lộ bí mật của cậu đâu.",
    504: "Tôi ngưỡng mộ cậu.",
    505: "Chắc hẳn không dễ dàng gì khi làm nhiều điều đến thế mà nhận lại quá ít phần thưởng.",
    506: "Tôi không tìm kiếm phần thưởng.",
    507: "- Vậy thì là sự công nhận. - Khi bạn bè tôi được an toàn và bình yên...",
    508: "...đó là tất cả những gì tôi cần.",
    509: "Cậu thấy đấy Merlin, rốt cuộc chúng ta vẫn có điểm chung.",
    510: "Tương lai của Camelot.",
    511: "Merlin.",
    512: "Ta muốn ngươi nói cho ta biết Emrys ở đâu."
}

def srt_time_to_ass(t_str):
    # '00:00:02,440' -> '0:00:02.44'
    hours, mins, secs = t_str.split(":")
    secs, millis = secs.split(",")
    h = int(hours)
    cs = int(millis) // 10
    return f"{h}:{mins}:{secs}.{cs:02d}"

def clean_tags_for_ass(text):
    # Convert <i> and </i> to {\i1} and {\i0}
    text = text.replace("<i>", "{\\i1}").replace("</i>", "{\\i0}")
    # Replace newlines with \N
    text = text.replace("\n", "\\N")
    return text

def clean_tags_for_srt(text):
    return text.replace("<i>", "").replace("</i>", "")

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
Style: Default,Arial,16,&Hffffff,&Hffffff,&H0,&H0,0,0,0,0,100,100,0,0,1,1,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for sub in subtitles:
        cue_id = sub["id"]
        start_ass = srt_time_to_ass(sub["start"])
        end_ass = srt_time_to_ass(sub["end"])
        en_text = clean_tags_for_ass(sub["text"])
        vi_text = translations.get(cue_id, "")
        
        # Format: {\c&H0000FF&}EN\N{\r\c&HFFFFFF&}VI
        if vi_text:
            text_field = f"{{\\c&H0000FF&}}{en_text}\\N{{\\r\\c&HFFFFFF&}}{vi_text}"
        else:
            text_field = f"{{\\c&H0000FF&}}{en_text}"
        
        event_line = f"Dialogue: 0,{start_ass},{end_ass},Default,,0,0,0,,{text_field}"
        events.append(event_line)
        
    return header + "\n".join(events) + "\n"

def build_bilingual_srt(subtitles, translations):
    blocks = []
    for sub in subtitles:
        cue_id = sub["id"]
        time_line = f"{sub['start']} --> {sub['end']}"
        en_text = sub["text"]
        vi_text = translations.get(cue_id, "")
        if vi_text:
            block = f"{cue_id}\n{time_line}\n{en_text}\n{vi_text}"
        else:
            block = f"{cue_id}\n{time_line}\n{en_text}"
        blocks.append(block)
    return "\n\n".join(blocks) + "\n"

def main():
    target_dir = Path("/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Merlin S01- S05/Merlin.S05.1080p.x265-ZMNT")
    srt_path = target_dir / "Merlin.S05E09.1080p.x265-ZMNT.srt"
    
    with open(srt_path, "r", encoding="utf-8") as f:
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
                
    print(f"Total parsed subtitles: {len(subtitles)}")
    print(f"Total translated entries: {len(translations)}")
    
    # Check if any missing translations
    missing = [s["id"] for s in subtitles if s["id"] not in translations]
    if missing:
        print(f"Warning: Missing translations for IDs: {missing}")
    else:
        print("All 512 subtitles are fully translated!")
        
    ass_content = build_ass(subtitles, translations)
    
    # Write main ASS file
    ass_path = target_dir / "Merlin.S05E09.1080p.x265-ZMNT.ass"
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_content)
    print(f"Wrote {ass_path} ({len(ass_content)} bytes)")
    
    # Write copy ASS file (matching other episodes in S05)
    ass_copy_path = target_dir / "Merlin.S05E09.1080p.x265-ZMNT copy.ass"
    shutil.copyfile(ass_path, ass_copy_path)
    print(f"Wrote {ass_copy_path}")
    
    # Write bilingual SRT file
    bilingual_srt_content = build_bilingual_srt(subtitles, translations)
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(bilingual_srt_content)
    print(f"Updated {srt_path} to bilingual format.")
    
    print("\nSUCCESS! All bilingual subtitle files for Merlin S05E09 have been created.")

if __name__ == "__main__":
    main()
