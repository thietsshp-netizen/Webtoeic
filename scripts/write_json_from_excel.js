const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/Ielts reading - json.xlsx';
const OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output';

if (!fs.existsSync(EXCEL_PATH)) {
    console.error("Excel file not found at path:", EXCEL_PATH);
    process.exit(1);
}

console.log("Reading Excel file:", EXCEL_PATH);
const workbook = XLSX.readFile(EXCEL_PATH);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(worksheet);
console.log(`Successfully loaded ${data.length} rows from Excel sheet "${sheetName}".`);

let writtenCount = 0;

for (const row of data) {
    const testId = parseInt(row['TEST'], 10);
    const passageNumber = parseInt(row['Passage'], 10);
    const jsonStr = row['Json'];
    
    if (isNaN(testId) || isNaN(passageNumber) || !jsonStr) {
        console.warn("Skipping invalid row:", row['TEST'], row['Passage']);
        continue;
    }
    
    // Only process the first 7 tests as requested
    if (testId < 1 || testId > 7) {
        continue;
    }
    
    try {
        let jsonObj;
        const cleanJsonStr = jsonStr.replace(/\r\n/g, '\n').trim();
        const parts = cleanJsonStr.split(/\n(?={)/);
        
        if (parts.length >= 2) {
            const obj1 = JSON.parse(parts[0]);
            const obj2 = JSON.parse(parts[1]);
            obj1.question_groups = obj2.question_groups;
            jsonObj = obj1;
        } else {
            jsonObj = JSON.parse(cleanJsonStr);
        }
        
        const outFilename = `test_${String(testId).padStart(2, '0')}_passage_${passageNumber}.json`;
        const outPath = path.join(OUT_DIR, outFilename);
        
        fs.writeFileSync(outPath, JSON.stringify(jsonObj, null, 2), 'utf-8');
        console.log(`  Saved ${outFilename} successfully.`);
        writtenCount++;
    } catch (err) {
        console.error(`Error parsing JSON for Test ${testId} Passage ${passageNumber}:`, err.message);
    }
}

console.log(`\nCompleted! Overwrote ${writtenCount} JSON files for Tests 1-7 from Excel.`);
