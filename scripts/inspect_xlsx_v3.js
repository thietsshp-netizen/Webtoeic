
const XLSX = require('xlsx');
const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(datasheet);

    if (data.length > 0) {
        console.log('--- COLUMNS ---');
        console.log(Object.keys(data[0]).join(', '));
        console.log('Total rows:', data.length);
        
        // Sample first 5 rows with JSON
        let count = 0;
        data.forEach((row, i) => {
            if (row.Json && row.Json.trim().startsWith('{') && count < 3) {
                console.log(`\n--- ROW ${i+1} (${row.AudioID}) ---`);
                console.log(row.Json);
                count++;
            }
        });
    }
} catch (error) {
    console.error('Error:', error.message);
}
