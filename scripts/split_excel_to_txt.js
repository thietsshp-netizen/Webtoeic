const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelFilePath = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Part 1 - 7 pdf/Catucanlamthem-hon 5000 tu.xlsx';
const outputDir = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic';
const startBatchNumber = 376;
const wordsPerBatch = 30;

function splitIntoBatches() {
    try {
        console.log(`Reading file: ${excelFilePath}`);
        const workbook = XLSX.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Read all rows as an array of arrays
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Extract words from the first column (index 0), skipping the header (index 0)
        const words = data.slice(1)
            .map(row => row[0])
            .filter(word => word && typeof word === 'string' && word.trim() !== '');
            
        console.log(`Total words extracted: ${words.length}`);
        
        let batchIndex = startBatchNumber;
        for (let i = 0; i < words.length; i += wordsPerBatch) {
            const batchWords = words.slice(i, i + wordsPerBatch);
            const fileName = `batch${batchIndex}.txt`;
            const filePath = path.join(outputDir, fileName);
            
            fs.writeFileSync(filePath, batchWords.join('\n'), 'utf8');
            console.log(`Saved ${batchWords.length} words to ${fileName}`);
            batchIndex++;
        }
        
        console.log('Processing complete.');
    } catch (error) {
        console.error('Error processing Excel file:', error);
    }
}

splitIntoBatches();
