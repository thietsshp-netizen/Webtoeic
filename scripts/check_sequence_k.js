const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../Part 3_4/Part34_Json_Merged.xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const maxRow = 461;
    let prevRowJsonStr = null;
    let prevLastQuestionNo = null;

    let duplicateCount = 0;
    let sequenceErrorCount = 0;

    for (let R = 1; R < maxRow; ++R) {
        const cellK_ref = xlsx.utils.encode_cell({ c: 10, r: R });
        const cellK = worksheet[cellK_ref];
        
        if (!cellK || !cellK.v) continue;
        
        const currentJsonStr = cellK.v;
        
        // 1. Check duplicate adjacent rows
        if (prevRowJsonStr && currentJsonStr === prevRowJsonStr) {
            console.log(`- LỖI TRÙNG LẶP: Dòng ${R + 1} giống hệt nội dung của dòng ${R}`);
            duplicateCount++;
        }

        try {
            const json = JSON.parse(currentJsonStr);
            if (json.questions && json.questions.length > 0) {
                const firstQuestionNo = json.questions[0].questionNo;
                const lastQuestionNo = json.questions[json.questions.length - 1].questionNo;

                // 2. Check sequence
                if (prevLastQuestionNo !== null) {
                    const expectedNext = prevLastQuestionNo + 1;
                    // Chấp nhận nhảy về 32 (bắt đầu test mới Part 3) hoặc 71 (bắt đầu test mới Part 4)
                    if (firstQuestionNo !== expectedNext && firstQuestionNo !== 32 && firstQuestionNo !== 71) {
                         console.log(`- LỖI DÃY CÂU HỎI: Dòng ${R} kết thúc ở câu ${prevLastQuestionNo}, nhưng dòng ${R + 1} lại bắt đầu bằng câu ${firstQuestionNo}`);
                         sequenceErrorCount++;
                    }
                }
                
                prevLastQuestionNo = lastQuestionNo;
            }
        } catch (e) {
            // Ignore parse errors, already handled previously
        }

        prevRowJsonStr = currentJsonStr;
    }

    console.log(`\nKiểm tra hoàn tất tới dòng 461!`);
    console.log(`- Số dòng bị trùng lặp liền kề: ${duplicateCount}`);
    console.log(`- Số dòng bị nhảy số câu hỏi (không liên tiếp): ${sequenceErrorCount}`);

} catch (error) {
    console.error("Lỗi khi xử lý file:", error);
}
