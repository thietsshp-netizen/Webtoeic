const xlsx = require('xlsx');
const json5 = require('json5');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../Part 3_4/Part34_Json.xlsx');
const outputPath = path.join(__dirname, '../Part 3_4/Part34_Json_Merged.xlsx');

console.log(`Đang đọc file: ${inputPath}`);

try {
    const workbook = xlsx.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const range = xlsx.utils.decode_range(worksheet['!ref']);

    if (range.e.c < 10) {
        range.e.c = 10;
    }
    worksheet['!ref'] = xlsx.utils.encode_range(range);

    const headerCellRef = xlsx.utils.encode_cell({ r: 0, c: 10 });
    worksheet[headerCellRef] = { t: 's', v: 'Merged_JSON' };

    let successCount = 0;
    let autoFixedCount = 0;
    let errorCount = 0;

    for (let R = 1; R <= range.e.r; ++R) {
        const cellI_ref = xlsx.utils.encode_cell({ c: 8, r: R });
        const cellJ_ref = xlsx.utils.encode_cell({ c: 9, r: R });
        
        const cellI = worksheet[cellI_ref];
        const cellJ = worksheet[cellJ_ref];
        
        if (!cellI || cellI.v === undefined) continue;
        
        let jsonI, jsonJ;
        let finalJsonStr = cellI.v; 
        let wasAutoFixed = false;
        
        try {
            jsonI = JSON.parse(cellI.v);
        } catch (e) {
            // Thử cứu lỗi nhẹ bằng json5
            try {
                jsonI = json5.parse(cellI.v);
                wasAutoFixed = true;
            } catch (e2) {
                // Thất bại hoàn toàn (lỗi nặng)
                errorCount++;
                console.log(`- Lỗi nặng ở cột I dòng ${R + 1}, tự động bỏ qua để đảm bảo an toàn.`);
                const cellK_ref = xlsx.utils.encode_cell({ c: 10, r: R });
                worksheet[cellK_ref] = { t: 's', v: finalJsonStr };
                continue;
            }
        }
        
        // Cập nhật lại format chuẩn nếu đã autofix thành công
        if (wasAutoFixed) {
            finalJsonStr = JSON.stringify(jsonI, null, 2);
            autoFixedCount++;
        }

        if (cellJ && cellJ.v !== undefined) {
            try {
                // Parse cột J
                try {
                    jsonJ = JSON.parse(cellJ.v);
                } catch(e) {
                    jsonJ = json5.parse(cellJ.v); // Fallback
                }
                
                let hasChanges = false;
                
                // 1. Gộp category
                if (jsonJ.passages && jsonJ.passages[0] && jsonJ.passages[0].category) {
                    if (jsonI.passages && jsonI.passages[0]) {
                        if (jsonI.passages[0].category !== jsonJ.passages[0].category) {
                            jsonI.passages[0].category = jsonJ.passages[0].category;
                            hasChanges = true;
                        }
                    }
                }

                // 2. Gộp why_correct và why_wrong
                if (jsonJ.questions && jsonI.questions) {
                    for (let q = 0; q < jsonI.questions.length; q++) {
                        const qJ = jsonJ.questions[q];
                        const qI = jsonI.questions[q];
                        
                        if (qJ && qJ.explanation) {
                            const whyCorrect = qJ.explanation['why_correct'] || qJ.explanation['why-correct'];
                            const whyWrong = qJ.explanation['why_wrong'] || qJ.explanation['why-wrong'];
                            
                            if (whyCorrect || whyWrong) {
                                if (!qI.explanation) qI.explanation = {};
                                if (whyCorrect) {
                                    qI.explanation.why_correct = whyCorrect;
                                    hasChanges = true;
                                }
                                if (whyWrong) {
                                    qI.explanation.why_wrong = whyWrong;
                                    hasChanges = true;
                                }
                            }
                        }
                    }
                }
                
                if (hasChanges || wasAutoFixed) {
                    finalJsonStr = JSON.stringify(jsonI, null, 2);
                    if (!wasAutoFixed) successCount++;
                }
            } catch (e) {
                // Lỗi khi parse J, bỏ qua merge J, nhưng vẫn lưu I nếu I được autofix
                console.log(`- Lỗi parse JSON ở cột J dòng ${R + 1}, chỉ lưu nguyên cột I.`);
            }
        }
        
        const cellK_ref = xlsx.utils.encode_cell({ c: 10, r: R });
        worksheet[cellK_ref] = { t: 's', v: finalJsonStr };
    }

    xlsx.writeFile(workbook, outputPath);
    console.log(`\nHoàn tất!`);
    console.log(`- Đã gộp thành công dữ liệu cho ${successCount} dòng hợp lệ ban đầu.`);
    console.log(`- Đã TỰ ĐỘNG SỬA LỖI JSON (và gộp data cột J) thành công cho ${autoFixedCount} dòng lỗi nhẹ.`);
    console.log(`- Còn lại ${errorCount} dòng bị lỗi nặng (cần sửa bằng tay).`);
    console.log(`- File mới đã được lưu tại: ${outputPath}`);

} catch (error) {
    console.error("Lỗi khi xử lý file:", error);
}
