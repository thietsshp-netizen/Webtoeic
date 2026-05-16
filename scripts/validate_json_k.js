const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../Part 3_4/Part34_Json_Merged.xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    let missingFieldsCount = 0;
    let missingWhyCorrectCount = 0;
    let missingWhyWrongCount = 0;

    const maxRow = 461; // Kiểm tra tới dòng 461 theo yêu cầu

    for (let R = 1; R < maxRow; ++R) {
        const cellK_ref = xlsx.utils.encode_cell({ c: 10, r: R });
        const cellK = worksheet[cellK_ref];
        
        if (!cellK || !cellK.v) continue;
        
        try {
            const json = JSON.parse(cellK.v);
            let rowHasError = false;

            if (!json.passages || !json.passages[0] || !json.passages[0].html_content || !json.passages[0].translation_map) {
                console.log(`- Dòng ${R + 1}: Thiếu passages, html_content hoặc translation_map.`);
                rowHasError = true;
            }

            if (!json.questions || !Array.isArray(json.questions)) {
                console.log(`- Dòng ${R + 1}: Thiếu questions.`);
                rowHasError = true;
            } else {
                for (const q of json.questions) {
                    if (!q.text || !q.options || !q.correct || !q.evidence_sids || !q.explanation) {
                        console.log(`- Dòng ${R + 1} (Câu ${q.questionNo}): Thiếu các trường cơ bản (text, options, correct, evidence_sids, explanation).`);
                        rowHasError = true;
                    } else {
                        if (!q.explanation.vi || !q.explanation.options_vn) {
                            console.log(`- Dòng ${R + 1} (Câu ${q.questionNo}): Thiếu vi hoặc options_vn trong explanation.`);
                            rowHasError = true;
                        }
                        if (!q.explanation.why_correct) {
                            missingWhyCorrectCount++;
                        }
                        if (!q.explanation.why_wrong) {
                            missingWhyWrongCount++;
                        }
                    }
                }
            }

            if (rowHasError) missingFieldsCount++;

        } catch (e) {
            console.log(`- Dòng ${R + 1}: Không thể parse JSON ở cột K.`);
        }
    }

    console.log(`\nĐã kiểm tra toàn bộ dữ liệu tới dòng 461!`);
    console.log(`- Số dòng bị thiếu cấu trúc gốc (passages, html, translation, questions...): ${missingFieldsCount}`);
    if (missingWhyCorrectCount > 0 || missingWhyWrongCount > 0) {
        console.log(`- LƯU Ý: Có ${missingWhyCorrectCount} câu hỏi bị thiếu 'why_correct' và ${missingWhyWrongCount} câu bị thiếu 'why_wrong' (Có thể do Gemini lúc đầu không sinh ra đủ cho các câu này).`);
    } else {
        console.log(`- Tuyệt vời: Tất cả câu hỏi đều đã được bổ sung đầy đủ 'why_correct' và 'why_wrong'!`);
    }

} catch (error) {
    console.error("Lỗi khi xử lý file:", error);
}
