
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const patches = {
  // TEST 03 (Last parts)
  "ETS2024_TEST_03_53_55": ["Người nam nhắc đến việc 'ordering inventory' và 'restocking the shelves' tại cửa hàng quần áo.", "Người nữ đề xuất 'creating a loyalty program' để thu hút thêm khách hàng quay lại.", "Người nam sẽ 'look for some software' để quản lý chương trình khách hàng thân thiết."],
  "ETS2024_TEST_03_56_58": ["Người nam chào 'Welcome' và nhắc đến 'replacing a digital display', bối cảnh là bảo trì thiết bị.", "Người nữ lo ngại về việc 'customer confusion' (khách hàng bối rối) khi máy không hoạt động.", "Người nam đề nghị 'placing a sign' (đặt biển báo) để hướng dẫn khách."],
  "ETS2024_TEST_03_59_61": ["Các nhân viên đang bàn về việc 'scheduling appointments' cho bệnh nhân, bối cảnh phòng khám.", "Người nam khẳng định quy trình này rất đơn giản: 'You just have to check a box'.", "Người nữ sẽ 'investigate options' (tìm kiếm các lựa chọn) để cải thiện quy trình chiều nay."],
  "ETS2024_TEST_03_62_64": ["Người đàn ông nói sẽ tặng quà cho 'employees' (nhân viên) nhân dịp kỷ niệm.", "Dựa vào biểu đồ, chiếc cốc (mug) mà người nữ thích có giá $23.", "Người đàn ông sẽ 'approve an order' (phê duyệt đơn hàng) sau khi kiểm tra lại số lượng."],
  "ETS2024_TEST_03_65_67": ["Người nói thảo luận về 'location scouting' cho một bộ phim, xác nhận ngành công nghiệp là điện ảnh (film).", "Người phụ nữ muốn thay đổi để 'process will be easier' (quy trình dễ dàng hơn).", "Dựa vào sơ đồ, con đường cần đóng (closed) là Bangalore Avenue."],
  // TEST 04 Selection
  "ETS2024_TEST_04_32_34": ["Người nữ thông báo về 'office relocation' (chuyển văn phòng) sang tòa nhà mới.", "Người nam lo lắng về việc 'moving heavy equipment' (di chuyển thiết bị nặng).", "Người nữ nói 'I've already hired a moving company' để giải quyết vấn đề."],
  "ETS2024_TEST_04_35_37": ["Người nam thảo luận về 'training schedule' cho nhân viên mới.", "Người nữ đề nghị 'using the conference room' cho buổi đào tạo.", "Người nam sẽ 'send out an email' để xác nhận thời gian."],
  "ETS2024_TEST_04_38_40": ["Hội thoại nhắc đến 'customer survey results' cho một dòng sản phẩm gia dụng mới.", "Người nữ hài lòng vì 'the feedback is very positive' (phản hồi tích cực).", "Người nam đề xuất 'increasing the production' để đáp ứng nhu cầu."]
};

try {
    const workbook = XLSX.readFile(inputFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    data.forEach(row => {
        if (patches[row.AudioID]) {
            try {
                let json = JSON.parse(row.Json);
                json.questions.forEach((q, i) => {
                    if (!q.explanation) q.explanation = {};
                    if (patches[row.AudioID][i]) {
                        q.explanation.analysis = patches[row.AudioID][i];
                    }
                });
                row.Json = JSON.stringify(json, null, 2);
            } catch(je) {
                console.error(`Row ${row.AudioID} JSON error: ${je.message}`);
            }
        }
    });

    const newSheet = XLSX.utils.json_to_sheet(data);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, workbook.SheetNames[0]);
    XLSX.writeFile(newWorkbook, inputFile);
    console.log("Successfully applied Batch 4 patches (Test 03-04).");
} catch (e) {
    console.error("Error:", e.message);
}
