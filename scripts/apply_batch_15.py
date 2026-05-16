
import json
import os

chunk_file = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/chunks/chunk_1.json'

fixes = {
    "nurture": [
        {
            "index": 1,
            "new_ex": "It is essential to nurture your growth through continuous learning today.",
            "new_trans": "Việc nuôi dưỡng sự phát triển qua học tập liên tục là thiết yếu."
        }
    ],
    "nutrient": [
        {
            "index": 1,
            "new_ex": "Fruits and vegetables are rich in vitamins and other vital nutrients today.",
            "new_trans": "Trái cây và rau quả giàu vitamin và các dưỡng chất quan trọng khác."
        }
    ],
    "nutrition": [
        {
            "index": 1,
            "new_ex": "Researchers are studying the impact of nutrition trends on global health today.",
            "new_trans": "Các nhà nghiên cứu tìm hiểu tác động của xu hướng dinh dưỡng hôm nay."
        }
    ],
    "nutritional": [
        {
            "index": 1,
            "new_ex": "Most packaged foods must display detailed nutritional information on their labels today.",
            "new_trans": "Thực phẩm đóng gói phải hiển thị thông tin dinh dưỡng trên nhãn hôm nay."
        }
    ],
    "nutritionist": [
        {
            "index": 1,
            "new_ex": "A nutritionist can help you develop a meal plan for your goals today.",
            "new_trans": "Chuyên gia dinh dưỡng có thể giúp bạn lập kế hoạch bữa ăn hôm nay."
        }
    ],
    "nutritious": [
        {
            "index": 1,
            "new_ex": "It is important for children to have a nutritious diet for growth today.",
            "new_trans": "Trẻ em cần có một chế độ ăn bổ dưỡng để phát triển hôm nay."
        }
    ],
    "nutty": [
        {
            "index": 1,
            "new_ex": "The bread had a delicious nutty flavor thanks to the walnuts today.",
            "new_trans": "Bánh mì có vị hạt thơm ngon nhờ vào quả óc chó hôm nay."
        }
    ],
    "o'clock": [
        {
            "index": 1,
            "new_ex": "The departmental meeting is scheduled at ten o'clock sharp today.",
            "new_trans": "Cuộc họp phòng dự kiến sẽ diễn ra đúng mười giờ hôm nay."
        }
    ],
    "oak": [
        {
            "index": 1,
            "new_ex": "The executive boardroom features a large table made from solid oak today.",
            "new_trans": "Phòng họp hội đồng quản trị có một chiếc bàn làm từ gỗ sồi."
        }
    ],
    "oatmeal": [
        {
            "index": 1,
            "new_ex": "Eating a bowl of oatmeal for breakfast is a healthy way to start today.",
            "new_trans": "Ăn cháo yến mạch cho bữa sáng là cách lành mạnh để bắt đầu."
        }
    ],
    "object": [
        {
            "index": 1,
            "new_ex": "The board decided to object to the manager's proposal today.",
            "new_trans": "Hội đồng quản trị đã quyết định phản đối đề xuất của quản lý."
        }
    ],
    "objected": [
        {
            "index": 1,
            "new_ex": "The residents strongly objected to the construction of a new factory today.",
            "new_trans": "Người dân phản đối mạnh mẽ việc xây dựng nhà máy mới hôm nay."
        }
    ],
    "objecting": [
        {
            "index": 1,
            "new_ex": "Objecting to the changes, several employees requested a meeting today.",
            "new_trans": "Do phản đối thay đổi, vài nhân viên yêu cầu một cuộc họp hôm nay."
        }
    ],
    "objection": [
        {
            "index": 1,
            "new_ex": "The partner expressed a strong professional objection to the terms today.",
            "new_trans": "Đối tác đã bày tỏ sự phản đối chuyên môn mạnh mẽ hôm nay."
        }
    ],
    "objectionable": [
        {
            "index": 1,
            "new_ex": "The advertising strategy was criticized for its objectionable slogans today.",
            "new_trans": "Chiến dịch quảng cáo bị chỉ trích vì khẩu hiệu gây khó chịu hôm nay."
        }
    ],
    "objectively": [
        {
            "index": 1,
            "new_ex": "It is important for a journalist to report the news objectively today.",
            "new_trans": "Điều quan trọng là nhà báo phải đưa tin khách quan hôm nay."
        }
    ],
    "objectivity": [
        {
            "index": 1,
            "new_ex": "Maintaining objectivity is essential for accurate international financial reporting today.",
            "new_trans": "Duy trì khách quan là thiết yếu để cung cấp báo cáo tài chính."
        }
    ],
    "objects": [
        {
            "index": 1,
            "new_ex": "A collection of ancient ceramic objects is on display today.",
            "new_trans": "Một bộ sưu tập đồ gốm cổ đang được trưng bày hôm nay."
        }
    ],
    "obligated": [
        {
            "index": 1,
            "new_ex": "The company is obligated to provide technical support for one year today.",
            "new_trans": "Công ty có nghĩa vụ cung cấp hỗ trợ kỹ thuật trong một năm."
        }
    ],
    "obligation": [
        {
            "index": 1,
            "new_ex": "The tenant has a legal obligation to keep the apartment in good condition.",
            "new_trans": "Người thuê nhà có nghĩa vụ giữ căn hộ trong tình trạng tốt."
        }
    ],
    "obliged": [
        {
            "index": 1,
            "new_ex": "I would be much obliged if you could provide more information today.",
            "new_trans": "Tôi sẽ rất biết ơn nếu bạn có thể cung cấp thêm thông tin."
        }
    ],
    "obscured": [
        {
            "index": 1,
            "new_ex": "The vision was temporarily obscured by thick fog today.",
            "new_trans": "Tầm nhìn đã bị che khuất tạm thời bởi sương mù dày đặc."
        }
    ],
    "obscurely": [
        {
            "index": 1,
            "new_ex": "The poem was written so obscurely that critics struggled to understand it today.",
            "new_trans": "Bài thơ được viết khó hiểu đến mức các nhà phê bình vật lộn."
        }
    ],
    "observatory": [
        {
            "index": 1,
            "new_ex": "The new observatory is located high in the mountains today.",
            "new_trans": "Đài quan sát mới nằm cao trên núi hôm nay."
        }
    ],
    "observed": [
        {
            "index": 1,
            "new_ex": "The officer observed several violations of the code during his inspection today.",
            "new_trans": "Nhân viên đã quan sát thấy vài vi phạm trong đợt kiểm tra."
        }
    ],
    "observing": [
        {
            "index": 1,
            "new_ex": "The researcher is carefully observing the reaction of the chemical compounds today.",
            "new_trans": "Nhà nghiên cứu đang cẩn thận quan sát phản ứng hóa học."
        }
    ],
    "obsolete": [
        {
            "index": 1,
            "new_ex": "Many electronic devices become obsolete within a few years today.",
            "new_trans": "Nhiều thiết bị điện tử trở nên lỗi thời trong vài năm hôm nay."
        }
    ],
    "obstacle": [
        {
            "index": 1,
            "new_ex": "The main obstacle to the project is the lack of funding today.",
            "new_trans": "Trở ngại chính cho dự án là sự thiếu kinh phí hôm nay."
        }
    ]
}

def apply_fixes():
    with open(chunk_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    applied = 0
    for item in data:
        word = item['word']
        if word in fixes:
            for fix in fixes[word]:
                idx = fix['index'] - 1
                if idx < len(item.get('meanings', [])):
                    item['meanings'][idx]['example'] = fix['new_ex']
                    item['meanings'][idx]['translation'] = fix['new_trans']
                    applied += 1
                    
    with open(chunk_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Applied {applied} fixes to chunk_1.json")

if __name__ == "__main__":
    apply_fixes()
