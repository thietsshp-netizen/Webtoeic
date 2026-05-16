
const XLSX = require('xlsx');
const fs = require('fs');

const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const patches = {
  "ETS2024_TEST_01_32_34": [
    "Người nam chào 'Chef Ayaka' và hỏi về 'beef stew special', cho thấy họ đang làm việc trong môi trường nhà hàng.",
    "Người nam gợi ý rằng cần cân nhắc giá thịt bò (beef prices) khi thiết lập giá món ăn (set the price for the dish) do giá nguyên liệu thay đổi thường xuyên.",
    "Người nữ nói sẽ 'call our supplier' để đảm bảo nguồn cung thịt bò, tương ứng với việc liên hệ nhà cung cấp."
  ],
  "ETS2024_TEST_01_35_37": [
    "Người nói thảo luận về 'calculating expense reports' và 'travel reimbursement forms', là những công việc đặc thù của bộ phận kế toán.",
    "Người phụ nữ đề cập vấn đề nhân viên ở khách sạn không nằm trong 'list of approved accommodations', tức là không tuân thủ chính sách công ty.",
    "Người đàn ông nói 'I can approve the expense this one time', tương đương với việc ủy quyền hoàn tiền (authorize a reimbursement)."
  ],
  "ETS2024_TEST_01_38_40": [
    "Hội thoại diễn ra trên 'deck' (boong tàu) của một 'cargo ship' (tàu chở hàng), cho thấy họ làm việc trong ngành vận tải biển (shipping).",
    "Người phụ nữ nói con tàu không thể rời đi cho đến khi 'the weather improves', cho thấy lý do chậm trễ là điều kiện thời tiết xấu.",
    "Người đàn ông nói 'I'll be sure to call the port authority', tương ứng với việc thực hiện một cuộc gọi điện thoại."
  ],
  "ETS2024_TEST_01_41_43": [
    "Thông tin về việc 'paving the driveway' (lát đường lái xe) tại nhà, cho thấy người phụ nữ đang có kế hoạch cải tạo hoặc bảo trì nhà cửa.",
    "Người phụ nữ yêu cầu người đàn ông thực hiện khảo sát mặt bằng và gửi 'cost estimate' (ước tính chi phí) trước thứ Tư.",
    "Người nam xác nhận 'I have several other project sites to visit tomorrow', nên anh ta sẽ ghé qua nhà người nữ vào ngày mai."
  ],
  "ETS2024_TEST_01_44_46": [
    "Người nam hỏi 'Has the design for the new website been finalized?', cho thấy công ty đang làm việc về thiết kế trang web.",
    "Người phụ nữ đề cập 'We're going to need a few more people' để hoàn thành dự án đúng hạn, cho thấy họ cần thêm lực lượng lao động.",
    "Người nam gợi ý 'Why don't we contact the staffing agency?', tức là đề nghị thuê thêm người thông qua đại lý nhân sự."
  ],
  "ETS2026_TEST_02_59_61": [
     "Người nữ nói thảm dành cho 'waiting room at my hair salon', xác nhận cô ấy làm việc tại tiệm làm tóc.",
     "Người nữ nêu lý do thảm hiện tại là 'light color' và có nhiều khách đi lại nên dễ bẩn, ngụ ý cần thay đổi sang loại tối màu hoặc bền hơn.",
     "Người nam đề cập 'I offer free cleaning services for a year', tức là cung cấp dịch vụ vệ sinh miễn phí."
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
    console.log("Applied Batch 1 Patches successfully.");
} catch (e) {
    console.error("Error applying patches:", e.message);
}
