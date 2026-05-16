
const fs = require('fs');
const dictPath = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/pedagogical_dict.json';
const currentDict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

const batch4 = {
  "ETS2024_TEST_05_32_34": {
    "questions": [
      { "vi": "Người nói đang ở đâu?", "why_correct": "Người nam nhắc đến việc 'picked up the dry cleaning', xác nhận địa điểm là **tiệm giặt khô (A)**." },
      { "vi": "Người phụ nữ đề cập đến vấn đề gì?", "why_correct": "Cô ấy báo rằng 'the zipper on this jacket is broken', đáp án là **B**." },
      { "vi": "Người nam đề nghị làm gì?", "why_correct": "Ông ấy nói 'I can fix it for you by tomorrow', đáp án là **Sửa chữa một món đồ (C)**." }
    ]
  },
  "ETS2024_TEST_06_32_34": {
    "questions": [
      { "vi": "Mục đích của cuộc gọi là gì?", "why_correct": "Người gọi muốn 'make a reservation for a graduation party', đáp án là **D**." },
      { "vi": "Sự kiện diễn ra vào ngày nào?", "why_correct": "Văn bản xác nhận là 'Saturday, June 12th', đáp án là **A**." },
      { "vi": "Người phụ nữ yêu cầu người nam làm gì?", "why_correct": "Cô ấy bảo 'Please choose a menu option', đáp án là **B**." }
    ]
  },
  "ETS2024_TEST_07_32_34": {
    "questions": [
      { "vi": "Họ đang thảo luận về chủ đề gì?", "why_correct": "Hội thoại kể về 'the upcoming company reorganization', đáp án là **Tái cơ cấu công ty (C)**." },
      { "vi": "Người nữ lo lắng về điều gì?", "why_correct": "Cô ấy sợ rằng 'my department will be moved to another city', đáp án là **Việc di dời văn phòng (D)**." },
      { "vi": "Người nam khuyên nên làm gì?", "why_correct": "Ông ấy nói 'Wait until the official announcement', đáp án là **Chờ đợi thêm thông tin (A)**." }
    ]
  }
};

Object.assign(currentDict, batch4);
fs.writeFileSync(dictPath, JSON.stringify(currentDict, null, 2));
console.log("Batch 4 enrichment added.");
