
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const patches = {
  // TEST 02 Continued
  "ETS2024_TEST_02_47_49": [
    "Người nam nói 'I'm here to pick up the supplies for the charity event', xác nhận mục đích là lấy đồ gia dụng/cung cấp cho sự kiện.",
    "Người phụ nữ xin lỗi vì 'the printer is broken' nên không thể in hóa đơn ngay lập tức.",
    "Người đàn ông đề nghị 'send the receipt by email' sau khi máy in được sửa."
  ],
  "ETS2024_TEST_02_50_52": [
    "Người phụ nữ giới thiệu về 'new mobile app' cho công ty, đây là chủ đề chính.",
    "Người nam lo lắng về 'user interface' có phần phức tạp đối với người dùng lớn tuổi.",
    "Người phụ nữ tin rằng 'video tutorial' (video hướng dẫn) sẽ giúp giải quyết vấn đề này."
  ],
  // TEST 03 Continued 
  "ETS2024_TEST_03_38_40": [
    "Hội thoại nhắc đến 'inventory software update', xác nhận họ đang làm việc với phần mềm quản lý kho.",
    "Người nữ lo ngại về việc 'training the staff' (đào tạo nhân viên) sử dụng hệ thống mới.",
    "Người nam đề xuất 'hiring a consultant' để hỗ trợ quá trình chuyển đổi."
  ],
  "ETS2024_TEST_03_41_43": [
     "Người nữ hỏi về 'conference room availability', cho thấy cô ấy muốn đặt phòng họp.",
     "Người nam thông báo 'the larger rooms are booked', vấn đề là các phòng lớn đã hết chỗ.",
     "Người nữ chấp nhận 'using a smaller room' và yêu cầu thêm ghế (additional chairs)."
  ],
  "ETS2024_TEST_03_44_46": [
     "Hội thoại nhắc đến 'submitting travel expenses', tương tự chủ đề kế toán chi phí.",
     "Người nam thông báo 'the deadline was yesterday', vấn đề là đã quá hạn nộp.",
     "Người nữ giải thích do 'system outage' (lỗi hệ thống) nên cô không thể nộp đúng hạn."
  ],
  "ETS2024_TEST_03_47_49": [
     "Hội thoại thảo luận về 'purchasing new monitors' cho văn phòng sáng tạo.",
     "Người phụ nữ đề cập đến 'budget limit' (giới hạn ngân sách) cho việc mua sắm thiết bị.",
     "Người đàn ông đề nghị 'starting with a few units' (bắt đầu với một vài máy) thay vì mua toàn bộ ngay lập tức."
  ],
  "ETS2024_TEST_03_50_52": [
     "Người nữ hỏi 'Where should we display the new summer collection?', khẳng định bối cảnh là cửa hàng thời trang.",
     "Người nam lo ngại về 'lack of shelf space' (thiếu không gian kệ hàng).",
     "Người nữ gợi ý 'moving some winter clothes to the back room' để giải phóng diện tích."
  ]
};

try {
    const workbook = XLSX.readFile(inputFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    data.forEach(row => {
        if (patches[row.AudioID]) {
            let json = JSON.parse(row.Json);
            json.questions.forEach((q, i) => {
                if (!q.explanation) q.explanation = {};
                q.explanation.analysis = patches[row.AudioID][i];
            });
            row.Json = JSON.stringify(json, null, 2);
        }
    });

    const newSheet = XLSX.utils.json_to_sheet(data);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, workbook.SheetNames[0]);
    XLSX.writeFile(newWorkbook, inputFile);
    console.log("Successfully applied updates for Test 02 & 03 (Part 2).");
} catch (e) {
    console.error("Error:", e.message);
}
