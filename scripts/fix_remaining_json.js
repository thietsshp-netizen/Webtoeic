const xlsx = require('xlsx');
const json5 = require('json5');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../Part 3_4/Part34_Json_Merged.xlsx');

console.log(`Đang đọc file: ${filePath}`);

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const targetRows = [239, 251, 262, 270, 273, 275, 283, 297, 767];
    let successCount = 0;

    for (const rowNum of targetRows) {
        const R = rowNum - 1; // 0-indexed in xlsx
        const cellI_ref = xlsx.utils.encode_cell({ c: 8, r: R });
        const cellJ_ref = xlsx.utils.encode_cell({ c: 9, r: R });
        const cellK_ref = xlsx.utils.encode_cell({ c: 10, r: R });
        
        const cellI = worksheet[cellI_ref];
        const cellJ = worksheet[cellJ_ref];
        
        if (!cellI || cellI.v === undefined) {
            console.log(`- Dòng ${rowNum}: Cột I trống, bỏ qua.`);
            continue;
        }
        
        let jsonI, jsonJ;
        
        try {
            jsonI = JSON.parse(cellI.v);
        } catch (e) {
            console.log(`- Dòng ${rowNum}: Cột I vẫn chưa phải là JSON hợp lệ: ${e.message}`);
            continue;
        }

        if (cellJ && cellJ.v !== undefined) {
            try {
                try {
                    jsonJ = JSON.parse(cellJ.v);
                } catch(e) {
                    jsonJ = json5.parse(cellJ.v);
                }
                
                // Gộp category
                if (jsonJ.passages && jsonJ.passages[0] && jsonJ.passages[0].category) {
                    if (jsonI.passages && jsonI.passages[0]) {
                        jsonI.passages[0].category = jsonJ.passages[0].category;
                    }
                }

                // Gộp why_correct và why_wrong
                if (jsonJ.questions && jsonI.questions) {
                    for (let q = 0; q < jsonI.questions.length; q++) {
                        const qJ = jsonJ.questions[q];
                        const qI = jsonI.questions[q];
                        
                        if (qJ && qJ.explanation) {
                            const whyCorrect = qJ.explanation['why_correct'] || qJ.explanation['why-correct'];
                            const whyWrong = qJ.explanation['why_wrong'] || qJ.explanation['why-wrong'];
                            
                            if (whyCorrect || whyWrong) {
                                if (!qI.explanation) qI.explanation = {};
                                if (whyCorrect) qI.explanation.why_correct = whyCorrect;
                                if (whyWrong) qI.explanation.why_wrong = whyWrong;
                            }
                        }
                    }
                }
                
                // Cập nhật lại cột K
                worksheet[cellK_ref] = { t: 's', v: JSON.stringify(jsonI, null, 2) };
                successCount++;
                console.log(`- Dòng ${rowNum}: Gộp thành công!`);
                
            } catch (e) {
                console.log(`- Dòng ${rowNum}: Cột J lỗi parse, chỉ format lại cột K theo cột I gốc.`);
                worksheet[cellK_ref] = { t: 's', v: JSON.stringify(jsonI, null, 2) };
                successCount++;
            }
        } else {
             // Không có cột J thì chỉ chép cột I qua K
             worksheet[cellK_ref] = { t: 's', v: JSON.stringify(jsonI, null, 2) };
             successCount++;
             console.log(`- Dòng ${rowNum}: Không có dữ liệu Gemini, chỉ format lại JSON.`);
        }
    }

    if (successCount > 0) {
        xlsx.writeFile(workbook, filePath);
        console.log(`\nĐã cập nhật thành công ${successCount} dòng vào file Part34_Json_Merged.xlsx!`);
    } else {
        console.log(`\nKhông có dòng nào được cập nhật.`);
    }

} catch (error) {
    console.error("Lỗi khi xử lý file:", error);
}
