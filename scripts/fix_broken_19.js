
const fs = require('fs');
const XLSX = require('xlsx');
const excelFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const broken19Fixes = {
  "ETS2026_TEST_01_62_64": [
    { "qNo": 62, "vi": "Người phụ nữ đang ở đâu?", "why": "Người nữ nói 'I am at the airport' (Tôi đang ở sân bay) để đợi chuyến bay, đáp án là **C**." },
    { "qNo": 63, "vi": "Dựa vào sơ đồ, người nữ muốn gặp nhà đầu tư vào khi nào?", "why": "Người nữ đề nghị gặp ngay sau cuộc họp với nhân viên ở Chicago. Trên sơ đồ, cuộc họp này diễn ra vào **Thứ Tư (Wednesday - C)**." },
    { "qNo": 64, "vi": "Người nam chia sẻ tin tốt gì?", "why": "Người nam nhắc đến việc công ty vừa giành được một giải thưởng ('won an award') cho những đóng góp cộng đồng, đáp án là **D**." }
  ],
  "ETS2026_TEST_01_65_67": [
    { "qNo": 65, "vi": "Các diễn giả làm việc ở đâu?", "why": "Người nam nhắc đến khách hàng muốn ghé thăm 'botanical garden' (vườn bách thảo), xác nhận địa chỉ nơi họ làm việc, đáp án là **D**." },
    { "qNo": 66, "vi": "Dựa vào sơ đồ, người nam muốn thay đổi trang nào trên trang web?", "why": "Anh ấy muốn chuyển thông tin bãi đậu xe từ trang 'About Us' sang một trang riêng. Trên sơ đồ, trang 'About Us' mã hóa là **Trang 1 (A)**." },
    { "qNo": 67, "vi": "Tại sao người nữ nói cô ấy không thể hoàn thành công việc cho đến Thứ Hai?", "why": "Cô ấy giải thích 'we're in the middle of updating our software' (đang cập nhật phần mềm), đáp án là **C**." }
  ],
  "ETS2026_TEST_01_68_70": [
    { "qNo": 68, "vi": "Người nam chia sẻ tin tức gì?", "why": "Người nam báo tin dự án lắp đặt giá để xe đạp đã được 'received the go-ahead' (được chấp thuận), đáp án là **B**." },
    { "qNo": 69, "vi": "Dựa vào sơ đồ, các diễn giả quyết định lắp đặt giá để xe đạp ở đâu?", "why": "Họ quyết định đặt giá xe ở vị trí gần sân ga (platform) nhất có thể. Trên sơ đồ, vị trí này là **Khu vực đỗ xe có mái che (A)**." },
    { "qNo": 70, "vi": "Tại sao người nữ nói cô ấy sẽ liên lạc với một số công ty?", "why": "Cô ấy nói 'I’ll contact some companies for estimates' (hỏi báo giá), đáp án là **C**." }
  ],
  "ETS2026_TEST_01_95_97": [
    { "qNo": 95, "vi": "Theo người nói, điểm đặc biệt của Tòa nhà Văn phòng Reston là gì?", "why": "Văn bản nêu rõ đặc điểm phi thường nhất là 'beautiful garden, located in the lobby' (khu vườn xinh đẹp ở sảnh), đáp án là **A**." },
    { "qNo": 96, "vi": "Dựa vào sơ đồ, những tầng nào sẽ có người dọn đến vào tháng Giêng?", "why": "Người phát ngôn phỏng vấn CEO của Barnum Financial Services về việc dọn đến vào tháng Giêng. Trên sơ đồ, công ty này thuê **Tầng 11-14 (C)**." },
    { "qNo": 97, "vi": "Người nói cho biết điều gì có sẵn trên trang web?", "why": "Cô ấy nói 'recording of the full interview' (bản ghi âm cuộc phỏng vấn đầy đủ) đã có trên web, đáp án là **D**." }
  ],
  "ETS2026_TEST_01_98_100": [
    { "qNo": 98, "vi": "Người nghe có khả năng nhất là ai?", "why": "Người nói cảm ơn sự tham dự của 'potential investors' (nhà đầu tư tiềm năng), đáp án là **D**." },
    { "qNo": 99, "vi": "Dựa vào sơ đồ, mỏ mới sẽ được xây dựng ở đâu?", "why": "Họ quyết định xây mỏ tại địa điểm có trữ lượng lớn hơn với hàm lượng 390 gam bạc/tấn. Trên sơ đồ, đây là **Địa điểm 3 (C)**." },
    { "qNo": 100, "vi": "Người nói cho biết bước tiếp theo là gì?", "why": "Ông ấy nói 'Next step is applying for the necessary permits' (nộp đơn xin giấy phép), đáp án là **A**." }
  ],
  "ETS2026_TEST_04_95_97": [
    { "qNo": 95, "vi": "Người nghe đang ở đâu?", "why": "Hội thoại nhắc đến 'modern sports facility' và 'football fan', khẳng định bối cảnh tại **Sân vận động (D)**." },
    { "qNo": 96, "vi": "Dựa vào sơ đồ, chuyến tham quan diễn ra vào lúc nào?", "why": "Người nói nhắc đến dự báo 'sun and clouds, no rain'. Trên sơ đồ thời tiết, trạng thái này ứng với **Thứ Hai (A)**." },
    { "qNo": 97, "vi": "Điều gì sẽ xảy ra khi kết thúc buổi tham quan?", "why": "Sẽ có một chiếc xe buýt đưa đón ('shuttle bus') đón mọi người về bãi đậu xe, đáp án là **D**." }
  ]
};

function applyFixes() {
    const workbook = XLSX.readFile(excelFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    const updated = data.map(row => {
        if (broken19Fixes[row.AudioID]) {
            const j = JSON.parse(row.Json);
            const fixes = broken19Fixes[row.AudioID];
            
            let questions = j.questions || (j.passages && j.passages[0].questions);
            if (questions) {
                questions.forEach(q => {
                    const qNo = q.questionNo || q.question_number;
                    const f = fixes.find(x => x.qNo === qNo);
                    if (f) {
                        q.explanation.vi = f.vi;
                        q.explanation.why_correct = f.why;
                    }
                });
            }
            row.Json = JSON.stringify(j, null, 2);
        }
        return row;
    });

    const ns = XLSX.utils.json_to_sheet(updated);
    const nwb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(nwb, ns, workbook.SheetNames[0]);
    XLSX.writeFile(nwb, excelFile);
    console.log("Successfully fixed selected broken rows with high-quality logic.");
}

applyFixes();
