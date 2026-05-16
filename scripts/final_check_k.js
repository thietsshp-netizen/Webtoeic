const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../Part 3_4/Part34_Json_Merged.xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    let validCount = 0;
    let invalidCount = 0;
    let invalidRows = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row) continue;
        
        const colI = row[8];
        const colK = row[10];
        
        // Nếu cột I có dữ liệu thì cột K bắt buộc phải có JSON hợp lệ
        if (!colI) continue; 
        
        if (!colK) {
            invalidRows.push({ row: i + 1, error: "Cột K bị trống dù cột I có dữ liệu" });
            invalidCount++;
            continue;
        }

        try {
            JSON.parse(colK);
            validCount++;
        } catch(e) {
            invalidRows.push({ row: i + 1, error: e.message });
            invalidCount++;
        }
    }

    console.log(`\n--- KẾT QUẢ KIỂM TRA CHUNGT CUỘC CỘT K ---`);
    console.log(`- Tổng số dòng đã kiểm tra (có dữ liệu gốc): ${validCount + invalidCount}`);
    console.log(`- Số dòng JSON hợp lệ 100%: ${validCount}`);
    console.log(`- Số dòng bị lỗi JSON: ${invalidCount}`);
    
    if (invalidCount > 0) {
        console.log(`\nChi tiết các dòng bị lỗi để bạn kiểm tra lại:`);
        invalidRows.forEach(r => console.log(`  + Dòng ${r.row}: ${r.error}`));
    }

} catch (error) {
    console.error("Lỗi khi xử lý file:", error);
}
