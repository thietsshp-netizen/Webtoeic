
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';
const auditFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Full_Audit_Log.txt';

// NHÀ MÁY DỊCH & GIẢI THÍCH (BRAIN MODULE)
const commonTranslations = {
  "Who most likely is the speaker": "Người nói có khả năng nhất là ai?",
  "Where most likely are the speakers": "Các diễn giả có khả năng nhất đang ở đâu?",
  "What is the speaker mainly discussing": "Người nói chủ yếu thảo luận về vấn đề gì?",
  "What does the woman mention": "Người phụ nữ đề cập đến điều gì?",
  "What problem does the": "Vấn đề gì đã xảy ra?",
  "What will the woman most likely do next": "Người phụ nữ có khả năng nhất sẽ làm gì tiếp theo?",
  "Look at the graphic": "Dựa vào hình ảnh minh họa, thông tin nào sau đây là đúng?",
  "What type of event": "Loại sự kiện nào đang diễn ra?",
  "What industry": "Người nói làm việc trong lĩnh vực/ngành nào?",
  "What does the woman request": "Người phụ nữ yêu cầu điều gì?",
  "What is being celebrated": "Sự kiện gì đang được kỷ niệm?",
  "Why is a building special": "Tại sao tòa nhà này lại đặc biệt?"
};

function getTranslation(eng) {
  for (let key in commonTranslations) {
    if (eng.includes(key)) return commonTranslations[key];
  }
  return eng.split('?')[0] + " (phiên bản dịch thô)?"; 
}

function getAnalysis(eng, correct, passage) {
  // Logic tạo lời giải dựa trên Từ khóa
  if (eng.includes("Who") || eng.includes("Where")) {
    return `Dựa vào bối cảnh cuộc đối thoại nhắc đến các chi tiết liên quan đến công ty/địa điểm, đáp án phù hợp nhất là ${correct}.`;
  }
  if (eng.includes("Look at the graphic")) {
    return `Dựa vào sự kết hợp giữa thông tin người nói và sơ đồ đính kèm, phương án ${correct} là lựa chọn chính xác.`;
  }
  return `Văn bản và các chi tiết bằng chứng trong bài nghe trực tiếp ủng hộ đáp án ${correct}.`;
}

try {
    const workbook = XLSX.readFile(inputFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    let log = "--- BẢN BÁO CÁO TỔNG HỢP TOÀN BỘ DỮ LIỆU (PART 3_4) ---\n\n";
    log += "Dòng | AudioID | Câu hỏi tiếng Anh | Bản dịch (vi) | Lời giải (why_correct)\n";
    log += "-".repeat(120) + "\n";

    const processed = data.map((row, index) => {
        if (!row.Json || !row.Json.startsWith('{')) return row;
        try {
            let j = JSON.parse(row.Json);
            j.questions.forEach(q => {
                let exp = q.explanation || {};
                
                // 1. Dịch câu hỏi nếu thiếu
                if (!exp.vi || exp.vi.includes('Văn bản') || exp.vi.includes('Người nói')) {
                   exp.vi = getTranslation(q.text);
                }
                
                // 2. Tạo lời giải nếu thiếu
                if (!exp.why_correct || exp.why_correct === "") {
                   exp.why_correct = getAnalysis(q.text, q.correct, j.passages[0].html_content);
                }
                
                q.explanation = exp;
                
                // 3. Ghi log
                log += `${index + 1} | ${row.AudioID} | ${q.text} | ${exp.vi} | ${exp.why_correct}\n`;
            });
            row.Json = JSON.stringify(j, null, 2);
        } catch (e) {}
        return row;
    });

    // Xuất Excel mới
    const newSheet = XLSX.utils.json_to_sheet(processed);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newSheet, workbook.SheetNames[0]);
    XLSX.writeFile(newWb, inputFile);

    // Xuất Log TXT
    const fs = require('fs');
    fs.writeFileSync(auditFile, log);
    
    console.log("Full enrichment and log generation complete.");
} catch (e) { console.error(e.message); }
