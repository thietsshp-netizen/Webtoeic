
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const patches = {
  "ETS2024_TEST_01_32_34": [
    "Người nam chào 'Chef Ayaka' và thảo luận về doanh số món 'beef stew', cho thấy họ làm việc tại nhà hàng.",
    "Người nam đề cập việc giá thịt bò (beef prices) thay đổi thường xuyên nên cần cân nhắc khi lập giá cho món ăn (set the price).",
    "Người nữ nói 'I'll call our supplier' để đảm bảo lượng thịt bò cung cấp hàng tuần, tức là liên hệ với nhà cung cấp."
  ],
  "ETS2024_TEST_01_35_37": [
    "Hội thoại nhắc đến 'expense reports' và 'travel reimbursement forms', là những công việc của bộ phận kế toán.",
    "Người nữ nêu vấn đề nhân viên ở tại khách sạn không có trong 'list of approved accommodations', tức là vi phạm chính sách công ty.",
    "Người nam nói 'I can approve the expense this one time', tương đương với việc ủy quyền hoàn tiền (authorize a reimbursement)."
  ],
  "ETS2024_TEST_01_38_40": [
    "Hội thoại diễn ra trên 'deck' của một 'cargo ship', cho thấy họ làm việc trong ngành vận tải biển (shipping).",
    "Người nữ nói tàu không thể rời đi cho đến khi 'weather improves', nguyên nhân là do điều kiện thời tiết xấu.",
    "Người nam nói sẽ gọi cho 'port authority' để cập nhật tình hình, tương ứng với việc thực hiện một cuộc gọi."
  ],
  "ETS2024_TEST_01_41_43": [
    "Người nữ muốn 'paving the driveway', cho thấy mục đích là bảo trì/cải thiện nhà cửa (home maintenance).",
    "Người nữ yêu cầu 'cost estimate' (ước tính chi phí) cho dự án trước thứ Tư.",
    "Người nam nói sẽ ghé qua nhà người nữ vào ngày mai (tomorrow) sau khi thăm các dự án khác."
  ],
  "ETS2024_TEST_01_44_46": [
    "Hội thoại nhắc đến 'design for the new website', khẳng định họ làm việc về thiết kế web.",
    "Người nữ nói 'We're going to need a few more people' để hoàn thành đúng hạn, cho thấy họ cần thêm nhân lực.",
    "Người nam gợi ý 'contact the staffing agency', tương đương với đề nghị thuê nhân viên thông qua công ty môi giới."
  ],
  "ETS2024_TEST_01_47_49": [
    "Người phụ nữ hỏi 'Did you receive the new policy for employee discounts?', cho thấy bối cảnh là các chính sách nội bộ công ty.",
    "Người nam nói anh ta lo lắng về việc 'processing orders' sẽ mất nhiều thời gian hơn, liên quan đến hiệu quả làm việc.",
    "Người nữ đề nghị 'send out an email to the staff' để thông báo về sự thay đổi, tương ứng với việc gửi thông báo."
  ],
  "ETS2024_TEST_01_50_52": [
    "Người nam giới thiệu về 'community park project', cho thấy chủ đề chính là một dự án công viên cộng đồng.",
    "Người nữ khen ngợi bản kế hoạch và nói 'it's very impressive', thể hiện thái độ hài lòng và ấn tượng.",
    "Người nam nói 'I'll bring some blueprints to our next meeting', tương đương với việc mang theo bản vẽ thiết kế."
  ],
  "ETS2024_TEST_01_53_55": [
    "Người nam nhắc đến việc 'ordering inventory' và 'restocking the shelves' tại cửa hàng quần áo.",
    "Người nữ đề xuất 'creating a loyalty program' để thu hút thêm khách hàng quay lại.",
    "Người nam sẽ 'look for some software' để quản lý chương trình khách hàng thân thiết."
  ],
  "ETS2024_TEST_01_56_58": [
    "Người nam chào 'Welcome to the library' và thảo luận về việc đăng ký thẻ đọc sách.",
    "Người nữ hỏi về 'late fees' và quy định trả sách, thể hiện sự quan tâm đến các chính sách của thư viện.",
    "Người nam đưa cho người nữ một tờ rơi (brochure) về các sự kiện sắp tới."
  ],
  "ETS2024_TEST_01_59_61": [
    "Người phụ nữ nhắc đến việc 'organizing the company picnic', cho thấy họ đang lên kế hoạch cho một sự kiện nội bộ.",
    "Người nam đề cập đến việc 'renting a bus' để đưa đón nhân viên, cho thấy phương tiện di chuyển là xe buýt.",
    "Người nữ sẽ 'check the weather forecast' để chọn ngày phù hợp nhất."
  ],
  "ETS2024_TEST_01_62_64": [
    "Người phụ nữ đề cập đến việc 'redesigning the office layout', cho thấy dự án là cải tạo văn phòng.",
    "Người nam lo lắng về 'budget constraints' (hạn chế ngân sách) khi mua đồ nội thất mới.",
    "Người nữ đề nghị 'look for used furniture' để tiết kiệm chi phí."
  ],
  "ETS2024_TEST_01_65_67": [
    "Người nói thảo luận về 'opening a new branch' tại một thành phố khác, liên quan đến việc mở rộng doanh nghiệp.",
    "Người phụ nữ hỏi về 'hiring process' cho các vị trí quản lý chi nhánh mới.",
    "Người nam sẽ 'schedule some interviews' vào tuần tới."
  ],
  "ETS2024_TEST_01_68_70": [
    "Người nữ đề cập đến việc 'attending a graphics design workshop', cho thấy họ làm việc trong ngành thiết kế đồ họa.",
    "Người nam hỏi về 'registration fee' và thời hạn đăng ký tham gia.",
    "Người nữ sẽ 'fill out the application form' giúp người nam."
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
    console.log("Successfully applied updates for Test 01.");
} catch (e) {
    console.error("Error:", e.message);
}
