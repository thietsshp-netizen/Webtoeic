
const XLSX = require('xlsx');
const path = require('path');

const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(datasheet);

    if (data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Total rows:', data.length);
        console.log('--- Sample Row 1 ---');
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log('Excel file is empty.');
    }
} catch (error) {
    console.error('Error reading Excel file:', error.message);
}
