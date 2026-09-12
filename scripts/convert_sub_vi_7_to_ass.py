import re
import os

input_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/CreatSub-Friend/sub_vi_7.json'
output_path = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/CreatSub-Friend/sub_vi_7.ass'

# Bản dịch chuẩn ngữ cảnh phim Friends (Chandler & Joey, Danielle)
translations = {
    1: 'Ồ, Danielle, anh không ngờ là lại gặp hộp thư thoại. Gọi lại cho anh khi nào em rảnh nhé.',
    2: 'Tạm biệt. Ôi trời ơi.',
    3: 'Đó là thứ cậu làm suốt 2 tiếng qua đấy à? Này, tớ đã trau chuốt nó đấy chứ.',
    4: 'Thế vụ tiếng bát đĩa là sao? Ồ. Ừm, tớ muốn cô ấy nghĩ có khi tớ đang ở trong nhà hàng.',
    5: 'Cậu biết đấy, [cười] tớ cũng có cuộc sống riêng chứ. Như kiểu tớ không phải đang ngồi đây trau chuốt suốt hai tiếng vừa rồi.',
    6: 'Tớ dùng điện thoại của cậu được không?',
    7: 'Được chứ. Ừm, nhưng để cậu nhớ cho sau này, cái thứ trong tay cậu cũng dùng làm điện thoại được đấy. [cười]',
    8: 'Ừ, nó hoạt động rồi. [cười] Sao cô ấy không gọi lại cho tớ nhỉ? Có lẽ cô ấy chưa nhận được tin nhắn của cậu.',
    9: 'Cậu biết đấy, nếu muốn thì cậu có thể gọi vào máy bàn của cô ấy. Và nếu có nhiều tiếng bíp, nghĩa là có thể cô ấy chưa nghe tin nhắn. Chà, cậu không nghĩ làm vậy trông tớ hơi...',
    10: '...tuyệt vọng, bám người, thảm hại sao? [cười] À, rõ ràng là cậu đã đọc mục tìm bạn của tớ rồi.',
    11: 'Có bao nhiêu tiếng bíp?',
    12: 'Cô ấy nhấc máy rồi. [hắng giọng] Thấy chưa, đây là lúc cậu nên dùng từ "xin chào" mà bọn mình đã nói đấy.',
    13: 'Tớ sẽ không nói chuyện với cô ấy đâu. Rõ ràng là cô ấy nhận được tin nhắn rồi và chọn không gọi lại cho tớ. Giờ tớ vừa bám người lại vừa bị ngó lơ.',
    14: 'Trời ơi, tớ nhớ cảm giác chỉ là kẻ bám người thôi quá. Được rồi, tớ đi vệ sinh đây. Cậu trông điện thoại giúp tớ nhé? Sao cậu không mang theo luôn? Này, bọn tớ còn chưa có buổi hẹn thứ hai.',
    15: 'Cô ấy cần nghe thấy tiếng tớ đi tiểu sao?',
    16: '[hắng giọng và tiếng cười]',
    17: 'Sao cậu không gọi thẳng cho cô ấy đi?',
    18: 'Tớ không thể gọi được. Tớ đã để lại tin nhắn rồi. Tớ cũng có chút tự trọng chứ. Cậu có à? Không.',
    19: '[tiếng cười]',
    20: '[tiếng cười]',
    21: 'Danielle. Chào em. Chào em. Anh là... Chandler đây.',
    22: 'Anh vẫn ổn. [hắng giọng] Ừm nghe này, anh không biết em có thử gọi cho anh không vì thằng ngốc như anh vô tình tắt nguồn điện thoại mất rồi.',
    23: '[tiếng cười]',
    24: '[hắng giọng]',
    25: 'Ồ, được rồi. Thế thì tốt quá. Tuyệt vời. Được rồi.',
    26: 'Cô ấy đang bận cuộc gọi khác. Cô ấy sẽ gọi lại cho tớ.',
    27: 'Cô ấy đang bận cuộc gọi khác. Cô ấy sẽ gọi lại cho tớ. Cô ấy đang bận cuộc gọi khác. Sẽ gọi lại cho tớ. Cậu không phải đi vệ sinh à? Sao tớ lại nhảy múa thế này?',
    28: 'Bốn chữ cái. Hình tròn hay cái vòng? Nhẫn (Ring). Chết tiệt. Đổ chuông (Ring). Cảm ơn nhé.',
    29: 'Này, cậu có biết điện thoại của bọn mình bị hỏng rồi không? Cái gì?',
    30: 'Tớ đã thử gọi cho cậu từ quán cà phê. Chẳng có ai bắt máy cả. Tớ đã tắt máy rồi. Mẹ kiếp, tớ đã tắt nó đi mất rồi.',
    31: 'Đúng như cậu vừa bảo với cô ấy là cậu đã làm.',
    32: '[tiếng cười]',
    33: 'Chỉ là chỉ ra sự mỉa mai thôi mà.',
    34: '[âm nhạc]',
    35: 'Được rồi, tớ công nhận với cậu điều này. Quý ngài...',
    36: '...Peanut ăn mặc đẹp hơn. Ý tớ là, ông ấy có kính một tròng. Ông ấy có mũ chóp cao. Cậu biết đấy, ông ấy là người đồng tính.',
    37: '[tiếng cười]',
    38: 'Tớ chỉ muốn làm rõ điều này. Cậu đang công khai giới tính của ngài... Chandler. Danielle. Chào em.',
    39: 'Ừm, mọi người ơi, đây là Danielle. Danielle, đây là mọi người. Chào em. Em làm gì ở đây thế?',
    40: 'À, em đã gọi cho anh, nhưng hóa ra em bấm nhầm số. Và khi cuối cùng em xin được số đúng từ tổng đài thì không ai nhấc máy, nên em...',
    41: '...nghĩ là em cứ đến đây xem anh có ổn không. Ồ. Ừm, anh... anh ổn mà.',
    42: 'Nghe này, ừm, có lẽ lát nữa bọn mình gặp nhau nhé.',
    43: 'Nghe hay đấy. Em... em sẽ gọi cho anh hoặc anh gọi cho em. Sao cũng được. Anh biết rồi đấy. Được rồi. Tạm biệt mọi người.',
    44: 'Tạm biệt. Hú hú. Được đấy. Buổi hẹn thứ hai nhé. Tớ không biết nữa.',
    45: 'Cậu không biết á?',
    46: 'Ồ, chà, cô ấy có vẻ rất tốt và mọi thứ, nhưng cái chuyện cô ấy lặn lội đến tận đây chỉ để xem tớ có ổn không. Ý tớ là, như thế không phải là quá bám người sao?'
}

def srt_to_ass_time(srt_time_str):
    # Format: 00:00:02,000 -> 0:00:02.00
    parts = srt_time_str.strip().replace(',', '.').split(':')
    h = int(parts[0])
    m = int(parts[1])
    s_parts = parts[2].split('.')
    s = int(s_parts[0])
    ms = int(s_parts[1])
    cs = ms // 10
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

def clean_for_ass(text):
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    text = text.replace('<i>', r'{\i1}').replace('</i>', r'{\i0}')
    text = text.replace('\n', r'\N')
    return text.strip()

def main():
    with open(input_path, 'r', encoding='utf-8') as f:
        raw_content = f.read()

    blocks = [b.strip() for b in raw_content.strip().split('\n\n') if b.strip()]

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
    for b in blocks:
        lines = b.split('\n')
        if len(lines) < 3:
            continue
        cue_idx = int(lines[0].strip())
        time_match = re.match(r'(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})', lines[1])
        if not time_match:
            continue
        start_ass = srt_to_ass_time(time_match.group(1))
        end_ass = srt_to_ass_time(time_match.group(2))
        en_text = clean_for_ass('\n'.join(lines[2:]))
        vi_text = translations.get(cue_idx, '').strip()
        
        # Format chuẩn Friends_iOS_Ready: Tiếng Anh màu trắng, Tiếng Việt cỡ 12 màu Cyan (&H00FFFF&)
        if vi_text:
            text_field = f"{en_text}\\N{{\\fs12\\c&H00FFFF&}}{vi_text}"
        else:
            text_field = en_text
            
        event_line = f"Dialogue: 0,{start_ass},{end_ass},Default,,0,0,0,,{text_field}"
        events.append(event_line)

    ass_content = header + '\n'.join(events) + '\n'

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ass_content)

    print(f"SUCCESS: Created {output_path} with {len(events)} dialogue lines.")

if __name__ == '__main__':
    main()
