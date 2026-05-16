
const XLSX = require('xlsx');

const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 5/Part 5 - tong hop_phanLoai--.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length > 0) {
        console.log('--- Columns ---');
        console.log(Object.keys(data[0]));
        
        console.log('\n--- Sample Row ---');
        const sample = data[0];
        for (const key in sample) {
            console.log(`[${key}]: ${String(sample[key]).substring(0, 200)}${String(sample[key]).length > 200 ? '...' : ''}`);
        }

        // Check if there is a column with JSON
        const jsonColumn = Object.keys(sample).find(k => k.toLowerCase().includes('json') || k === 'K');
        if (jsonColumn) {
            console.log('\n--- JSON Column Content (Parsed) ---');
            try {
                const parsed = JSON.parse(sample[jsonColumn]);
                console.log(JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('Could not parse JSON column:', sample[jsonColumn]);
            }
        }
    } else {
        console.log('No data found in sheet.');
    }
} catch (error) {
    console.error('Error reading excel file:', error);
}
