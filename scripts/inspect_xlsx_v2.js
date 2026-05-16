
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
        
        // Find a row that actually has JsonData
        const rowWithJson = data.find(r => r.JsonData && r.JsonData.trim().startsWith('{'));
        if (rowWithJson) {
            console.log('\n--- SAMPLE JSON DATA ---');
            console.log(rowWithJson.JsonData);
        } else {
            console.log('\nNo rows found with valid JSON in "JsonData" column.');
        }
    }
} catch (error) {
    console.error('Error:', error.message);
}
