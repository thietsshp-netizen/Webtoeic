
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const patches = {
  // TEST 02
  "ETS2024_TEST_02_32_34": [
    "Người nam nói 'the staff told me you were here' and 'helping a customer', cho thấy hội thoại diễn ra tại một cửa hiệu hoặc nơi làm việc dịch vụ.",
    "Người phụ nữ đề cập đến 'refrigeration system' (hệ thống làm lạnh) gặp vấn đề, xác nhận đó là thiết bị cần sửa.",
    "Người đàn ông nói sẽ 'speak to the manager' (nói chuyện với quản lý) để giải thích sự chậm trễ."
  ],
  "ETS2024_TEST_02_35_37": [
    "Người phụ nữ hỏi 'Did you see the first draft of the logo for our new juice drink?', cho thấy chủ đề thảo luận là thiết kế logo.",
    "Người nam khen ngợi 'They did a wonderful job', thể hiện thái độ ấn tượng và hài lòng với công việc của biên tập viên/nhà thiết kế.",
    "Người phụ nữ nói sẽ 'show the logo to the president' để nhận phản hồi cuối cùng."
  ],
  "ETS2024_TEST_02_38_40": [
    "Hội thoại diễn ra tại 'security desk' và nhắc đến 'visitors', cho thấy người nam làm việc ở bộ phận an ninh/lễ tân.",
    "Họ thảo luận về 'parking lot' và 'space is limited', nguyên nhân vấn đề là do bãi đỗ xe không đủ chỗ.",
    "Người nữ gợi ý 'handing out maps' cho khách để họ biết nơi đỗ xe thay thế."
  ],
  "ETS2024_TEST_02_41_43": [
    "Hội thoại nhắc đến 'architectary project' và 'designing the lobby', cho thấy họ là kiến trúc sư hoặc nhà thiết kế.",
    "Người phụ nữ lo ngại về 'building materials' sẽ không đến kịp hạn chót (deadline).",
    "Người nam gợi ý 'calling the warehouse' để kiểm tra tình trạng hàng hóa."
  ],
  "ETS2024_TEST_02_44_46": [
    "Người nam chào 'Welcome to the fitness center' và thảo luận về các gói tập (membership plans).",
    "Người phụ nữ hỏi về 'personal training sessions' và 'equipment tutorials', thể hiện sự quan tâm đến việc nhận tư vấn/hướng dẫn.",
    "Người nam mời người nữ đi tham quan 'locker rooms' và 'exercise area'."
  ],
  // TEST 03
  "ETS2024_TEST_03_32_34": [
    "Người nam nói 'I'd like to sign up for the ceramic-making workshop', xác nhận mục đích là đăng ký một lớp học làm gốm.",
    "Người nữ giải thích rằng vì lớp học cần sử dụng 'kilns' (lò nung) có hạn, nên số lượng học viên bị giới hạn.",
    "Người nữ gợi ý người nam nên 'register online' ngay lập tức để không bỏ lỡ chỗ."
  ],
  "ETS2024_TEST_03_35_37": [
    "Hội thoại nhắc đến việc 'ordering inventory' cho 'bookstore', xác nhận loại hình kinh doanh là nhà sách.",
    "Người phụ nữ lo ngại 'some books are out of stock', nguyên nhân vấn đề là do thiếu hàng hóa.",
    "Người đàn ông nói 'I'll update the inventory list' để kiểm tra lại con số chính xác."
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
    console.log("Successfully applied updates for Test 02 and 03 Batch.");
} catch (e) {
    console.error("Error:", e.message);
}
