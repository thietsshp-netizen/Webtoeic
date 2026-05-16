
const fs = require('fs');
const dictPath = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/pedagogical_dict.json';

const currentDict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

const nextBatch = {
  "ETS2024_TEST_02_32_34": {
    "questions": [
      { "vi": "Mục đích của cuộc gọi là gì?", "why_correct": "Người nam nói 'I'm calling about the apartment for rent', đáp án là **A**." },
      { "vi": "Người phụ nữ đề cập đến vấn đề gì?", "why_correct": "Cô ấy nhắc đến 'the elevator is being repaired', tức là **thiết bị bị hỏng (C)**." },
      { "vi": "Người nam nói ông ấy sẽ làm gì?", "why_correct": "Ông ấy nói 'I'll come by at four o'clock' để xem căn hộ, đáp án là **B**." }
    ]
  },
  "ETS2024_TEST_02_35_37": {
    "questions": [
      { "vi": "Người nam quan tâm đến việc gì?", "why_correct": "Ông ấy nói 'I'm here to schedule some personal training sessions', đáp án là **Tại một trung tâm thể hình (B)**." },
      { "vi": "Người nam cần cung cấp thông tin gì?", "why_correct": "Người nữ bảo 'I'll also need you to sign for a membership', đáp án là **Đăng ký thành viên (A)**." },
      { "vi": "Người phụ nữ đề nghị làm gì?", "why_correct": "Cô ấy nói 'let me show you around our facility', tức là **dẫn đi tham quan (C)**." }
    ]
  },
  "ETS2024_TEST_02_38_40": {
    "questions": [
      { "vi": "Hai người phụ nữ có khả năng nhất làm nghề gì?", "why_correct": "Hội thoại nhắc đến 'flight the first thing in the morning' và 'boarding passes', đáp án là **Phi công (D)**." },
      { "vi": "Lý do cho sự chậm trễ là gì?", "why_correct": "Người nam đề cập 'technical issue with the engine', đáp án là **Vấn đề kỹ thuật (B)**." },
      { "vi": "Người nam sẽ làm gì tiếp theo?", "why_correct": "Ông ấy nói 'I'll go check on the progress', tức là **kiểm tra tình hình (A)**." }
    ]
  },
  "ETS2024_TEST_02_41_43": {
    "questions": [
      { "vi": "Sự kiện nào đang được tổ chức?", "why_correct": "Họ nhắc đến 'opening of our new branch', đáp án là **Khai trương chi nhánh (C)**." },
      { "vi": "Người phụ nữ yêu cầu người nam làm gì?", "why_correct": "Cô ấy bảo 'Please double-check the guest list', đáp án là **B**." },
      { "vi": "Người nam nói ông ấy sẽ làm gì?", "why_correct": "Ông ấy nói 'I'll call the florist' để đặt hoa, đáp án là **D**." }
    ]
  },
  "ETS2024_TEST_02_44_46": {
    "questions": [
      { "vi": "Họ đang gặp vấn đề gì?", "why_correct": "Người phụ nữ nói 'the printer is jamming again', tức là **máy in bị kẹt (A)**." },
      { "vi": "Người nam gợi ý giải pháp nào?", "why_correct": "Ông ấy bảo 'We should order a newer model', đáp án là **Mua thiết bị mới (C)**." },
      { "vi": "Người nghe sẽ làm gì vào buổi chiều?", "why_correct": "Người nữ nhắc đến 'training session at two', đáp án là **Tham gia buổi đào tạo (B)**." }
    ]
  },
  "ETS2026_TEST_04_32_34": {
    "questions": [
      { "vi": "Người đàn ông làm nghề gì?", "why_correct": "Anh ấy nói về việc 'revising the contract for the new property', chứng tỏ là **Luật sư hoặc Môi giới (A)**." },
      { "vi": "Người phụ nữ lo lắng về điều gì?", "why_correct": "Cô ấy nói 'The deadline is very tight', tức là **Thời gian hạn hẹp (C)**." },
      { "vi": "Người đàn ông hứa hẹn điều gì?", "why_correct": "Anh ấy nói 'I'll have it ready by Friday', đáp án là **Hoàn thành đúng hạn (B)**." }
    ]
  }
};

Object.assign(currentDict, nextBatch);
fs.writeFileSync(dictPath, JSON.stringify(currentDict, null, 2));
console.log("Next batch added to pedagogical dictionary.");
