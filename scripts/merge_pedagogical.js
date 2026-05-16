
const fs = require('fs');
const XLSX = require('xlsx');

// This script will merge high-quality content from a dictionary into the final Excel
const dictFile = '/Users/thietphamvan/hoctoeic/Webtoeic/scripts/pedagogical_dict.json';
const excelFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

function mergeEnrichment() {
    if (!fs.existsSync(dictFile)) {
        console.log("Dictionary not found. Please populate pedagogical_dict.json first.");
        return;
    }
    
    const dict = JSON.parse(fs.readFileSync(dictFile, 'utf8'));
    const workbook = XLSX.readFile(excelFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    const updated = data.map(row => {
        if (!row.Json || !row.Json.startsWith('{')) return row;
        const j = JSON.parse(row.Json);
        const id = row.AudioID;
        
        if (dict[id]) {
            const enrich = dict[id];
            
            // Fix questions
            let questions = j.questions;
            if (!questions && j.passages && j.passages[0].questions) {
                questions = j.passages[0].questions;
            }
            
            if (questions && enrich.questions) {
                questions.forEach((q, idx) => {
                    if (enrich.questions[idx]) {
                        const e = enrich.questions[idx];
                        if (e.vi) q.explanation.vi = e.vi;
                        if (e.why_correct) q.explanation.why_correct = e.why_correct;
                        // Clean up "dịch thô" if it exists in the original vi field
                        q.explanation.vi = q.explanation.vi.replace(/ \(phiên bản dịch thô\)/g, '').trim();
                    }
                });
            }
            row.Json = JSON.stringify(j, null, 2);
        }
        return row;
    });
    
    const newSheet = XLSX.utils.json_to_sheet(updated);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newSheet, workbook.SheetNames[0]);
    XLSX.writeFile(newWb, excelFile);
    console.log("Merge complete.");
}

mergeEnrichment();
