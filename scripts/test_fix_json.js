const xlsx = require('xlsx');
const json5 = require('json5');
const path = require('path');

const inputPath = path.join(__dirname, '../Part 3_4/Part34_Json.xlsx');
const workbook = xlsx.readFile(inputPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

function tryFix(str) {
    let fixed = str;
    
    // Fix smart quotes
    fixed = fixed.replace(/“/g, '"').replace(/”/g, '"');
    
    // Fix single quoted keys or values that caused issues
    // json5 should handle most of this

    try {
        const obj = JSON.parse(fixed);
        return { success: true, obj, method: 'JSON.parse with smart quote fix' };
    } catch(e1) {
        try {
            const obj = json5.parse(fixed);
            return { success: true, obj, method: 'json5.parse' };
        } catch(e2) {
            // Some specific regex fixes for common missing commas
            // e.g. "options": { "A": "..." "B": "..." } -> missing comma
            let regexFixed = fixed.replace(/"\s+"/g, '", "'); // simple attempt
            try {
                const obj = json5.parse(regexFixed);
                return { success: true, obj, method: 'json5.parse with regex fix' };
            } catch(e3) {
                return { success: false, error: e2.message };
            }
        }
    }
}

let failed = [];

for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const colI = row[8];
    if (!colI) continue;

    try {
        JSON.parse(colI);
    } catch(err) {
        // It failed originally
        const result = tryFix(colI);
        if (result.success) {
            console.log(`Dòng ${i+1}: Sửa thành công bằng ${result.method}`);
        } else {
            console.log(`Dòng ${i+1}: KHÔNG THỂ SỬA - ${result.error}`);
            failed.push({ row: i+1, text: colI });
        }
    }
}
