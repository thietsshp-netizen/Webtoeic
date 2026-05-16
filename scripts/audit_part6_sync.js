const XLSX = require('xlsx');
const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 6/Part 6_ETS2024-2026_Test 1-10.xlsx';

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`--- BÁO CÁO CÁC DÒNG BỊ LỆCH (English vs Vietnamese) ---`);
let mismatchCount = 0;

data.forEach((row, index) => {
    if (!row.Json) return;
    try {
        const json = JSON.parse(row.Json);
        const enSentences = json.passage && json.passage.english ? json.passage.english : [];
        const vnSentences = json.passage && json.passage.vietnamese ? json.passage.vietnamese : [];
        
        const enLen = enSentences.length;
        const vnLen = vnSentences.length;
        
        if (enLen !== vnLen) {
            mismatchCount++;
            console.log(`Dòng Excel ${index + 2} (Câu ${row.QuestionRange || 'N/A'}):`);
            console.log(`   - English: ${enLen} câu`);
            console.log(`   - Vietnamese: ${vnLen} câu`);
            
            // Tìm các ID bị thiếu ở bên VN so với EN
            const enIDs = enSentences.map(s => s.sentenceID);
            const vnIDs = vnSentences.map(s => s.sentenceID);
            const missingInVn = enIDs.filter(id => !vnIDs.includes(id));
            
            if (missingInVn.length > 0) {
                console.log(`   - Các ID Tiếng Việt bị thiếu: ${missingInVn.join(', ')}`);
            }
            console.log('------------------------------------------------');
        }
    } catch (e) {
        console.log(`Dòng Excel ${index + 2}: Lỗi parse JSON.`);
    }
});

if (mismatchCount === 0) {
    console.log("Chúc mừng! Tất cả các dòng đều đồng bộ.");
} else {
    console.log(`Tổng cộng có ${mismatchCount} dòng bị lệch.`);
}
