
const XLSX = require('xlsx');

const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 5/Part 5 - tong hop_phanLoai--.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('Headers:', data[0]);
    console.log('Row 1:', data[1]);
    console.log('Row 2:', data[2]);
} catch (error) {
    console.error('Error reading excel file:', error);
}
