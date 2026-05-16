
const fs = require('fs');
const dictPath = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/pedagogical_dict.json';
const currentDict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

const ets2026_test4 = {
  "ETS2026_TEST_04_38_40": {
    "questions": [
      { "vi": "Theo người nam, Pelicon sản xuất cái gì?", "why_correct": "Người nam giới thiệu Pelicon là 'local producer of beauty products', tương ứng với **Mỹ phẩm (B)**." },
      { "vi": "Người nữ lo lắng về điều gì?", "why_correct": "Cô ấy bày tỏ 'I’m worried that we don’t produce enough lanolin', tức là **không làm đủ sản phẩm (D)**." },
      { "vi": "Tại sao người nam khuyên nên đọc email?", "why_correct": "Anh ấy giải thích hợp đồng hiện tại sắp hết hạn và Pelicon là cơ hội mới, tức là **xem xét một đề xuất kinh doanh (A)**." }
    ]
  },
  "ETS2026_TEST_04_56_58": {
    "questions": [
      { "vi": "Hai người phụ nữ sở hữu loại hình kinh doanh nào?", "why_correct": "Hội thoại nhắc đến việc họ sản xuất trang phục thể dục và tìm người đại diện, khẳng định đây là một **công ty quần áo (C)**." },
      { "vi": "Người đàn ông nói gì về truyền hình?", "why_correct": "Ông ấy phân tích hiện nay có nhiều nền tảng số hiệu quả hơn, chỉ ra rằng **truyền hình không còn là lựa chọn duy nhất (D)**." },
      { "vi": "Saskia Hoffman là một lựa chọn tốt vì điều gì?", "why_correct": "Ông ấy nhấn mạnh Saskia có hàng triệu người theo dõi trên mạng xã hội chuyên về thể hình, chứng tỏ cô ấy **rất nổi tiếng (D)**." }
    ]
  },
  "ETS2026_TEST_04_59_61": {
    "questions": [
      { "vi": "Cửa hàng của người phụ nữ là gì?", "why_correct": "Người phụ nữ nói rõ 'I need some floor mats for my hair salon', xác nhận địa điểm là **tiệm làm tóc (A)**." },
      { "vi": "Tại sao người phụ nữ lại hài lòng với một sản phẩm?", "why_correct": "Cô ấy khen ngợi những tấm thảm này giúp nhân viên không bị mỏi chân khi đứng cả ngày, tức là vì **sự thoải mái (B)**." },
      { "vi": "Người phụ nữ có ý gì khi nói 'those are quite large'?", "why_correct": "Sau khi nghe báo giá $200 cho mỗi tấm thảm, cô ấy nói vậy để ám chỉ rằng **giá đó là hợp lý (A)** vì kích thước thảm lớn." }
    ]
  },
  "ETS2026_TEST_04_71_73": {
    "questions": [
      { "vi": "Người nói làm việc trong lĩnh vực nào?", "why_correct": "Thông báo dành cho khách hàng của 'Casella Transit' về việc bảo trì đường ray và tàu hỏa, xác nhận ngành **Giao thông vận tải (B)**." },
      { "vi": "Người nghe có thể nhận thông báo về điều gì?", "why_correct": "Người nói nhắc đến việc cài ứng dụng để 'receive notifications regarding delays', tức là **chậm trễ lịch trình (D)**." },
      { "vi": "Làm thế nào để giảm chi phí đi lại?", "why_correct": "Người nói khuyên 'Purchase your e-ticket through the mobile app' để tránh phí in vé tại quầy, tức là **mua vé điện tử (A)**." }
    ]
  },
  "ETS2026_TEST_04_89_91": {
    "questions": [
      { "vi": "Điểm mới của sự kiện năm nay là gì?", "why_correct": "Người nói hào hứng thông báo 'we're streaming this event live... for the very first time', nghĩa là **phát trực tiếp (D)**." },
      { "vi": "Tại sao bà Alabi lại được vinh danh?", "why_correct": "Bà được nhắc đến là người đã 'founded the I-Beat music label in 1996', nghĩa là bà đã **thành lập một hãng thu âm (C)**." },
      { "vi": "Điều gì sẽ xảy ra sau khi bà Alabi nhận giải?", "why_correct": "Văn bản cho biết 'some of her most famous clients will perform', tức là có **các nhạc sĩ biểu diễn (C)**." }
    ]
  },
  "ETS2026_TEST_04_98_100": {
    "questions": [
      { "vi": "Loại sự kiện nào được tổ chức tối nay?", "why_correct": "Người nói nêu rõ đây là 'dinner party to celebrate the retirement', tức là **tiệc nghỉ hưu (C)**." },
      { "vi": "Kota sẽ chịu trách nhiệm nhiệm vụ nào?", "why_correct": "Người nói bảo 'Kota's covering for Amanda', mà công việc của Amanda là 'hang the decorations', đáp án là **Treo đồ trang trí (B)**." },
      { "vi": "Người nói phải làm gì vào buổi trưa?", "why_correct": "Cô ấy nói 'I have a meeting with a potential client at noon', tức là **tham dự một cuộc họp (D)**." }
    ]
  }
};

Object.assign(currentDict, ets2026_test4);
fs.writeFileSync(dictPath, JSON.stringify(currentDict, null, 2));
console.log("ETS 2026 Test 04 pedagogical enrichment added.");
