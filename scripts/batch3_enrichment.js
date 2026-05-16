
const fs = require('fs');
const dictPath = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/pedagogical_dict.json';
const currentDict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

const batch3 = {
  "ETS2024_TEST_03_32_34": {
    "questions": [
      { "vi": "Người nói làm việc có khả năng nhất ở đâu?", "why_correct": "Người nam nhắc đến việc 'ordering supplies for the dental clinic', xác nhận địa điểm là **phòng khám nha khoa (B)**." },
      { "vi": "Người phụ nữ đề cập đến vấn đề gì?", "why_correct": "Cô ấy báo rằng mặt hàng 'blue surgical gloves' đang hết hàng ('out of stock'), đáp án là **A**." },
      { "vi": "Người nam nói anh ấy sẽ làm gì?", "why_correct": "Ông ấy nói 'I'll check with our regular supplier', đáp án là **B**." }
    ]
  },
  "ETS2024_TEST_04_32_34": {
    "questions": [
      { "vi": "Họ đang thảo luận về dự án nào?", "why_correct": "Hội thoại nhắc đến 'the upcoming charity auction', đáp án là **Buổi đấu giá từ thiện (C)**." },
      { "vi": "Vấn đề kỹ thuật là gì?", "why_correct": "Người nữ nói 'the online bidding system crashed', đáp án là **Hệ thống gặp sự cố (D)**." },
      { "vi": "Người nam đề nghị làm gì?", "why_correct": "Ông ấy nói 'I'll call the IT guy' để sửa lỗi, đáp án là **D**." }
    ]
  },
  "ETS2024_TEST_04_35_37": {
    "questions": [
      { "vi": "Họ làm việc ở đâu?", "why_correct": "Họ thảo luận về 'library book, magazine, or newspaper', khẳng định làm tại **Thư viện (B)**." },
      { "vi": "Tại sao người nam lại ở đó?", "why_correct": "Anh ấy nhận được 'e-mail this morning' báo có sách cần lấy, đáp án là **A**." },
      { "vi": "Người phụ nữ sẽ làm gì tiếp theo?", "why_correct": "Cô ấy nói sẽ đi 'search for an item' trên các kệ sách, đáp án là **D**." }
    ]
  },
  "ETS2024_TEST_01_98_100": {
    "questions": [
      { "vi": "Loại sự kiện nào được nhắc đến?", "why_correct": "Văn bản nêu rõ đây là bữa tiệc 'to celebrate the retirement', tức là **tiệc nghỉ hưu (C)**." },
      { "vi": "Kota sẽ làm gì?", "why_correct": "Kota thay thế Amanda làm việc 'hang the decorations', đáp án là **B**." },
      { "vi": "Người nói làm gì vào lúc giữa trưa?", "why_correct": "Cô ấy có 'meeting with a potential client', đáp án là **D**." }
    ]
  }
};

Object.assign(currentDict, batch3);
fs.writeFileSync(dictPath, JSON.stringify(currentDict, null, 2));
console.log("Batch 3 enrichment added.");
