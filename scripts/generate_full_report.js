
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

try {
    const workbook = XLSX.readFile(inputFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    console.log('| Dòng | AudioID | Câu | Dịch (vi) | Giải thích (why_correct) |');
    console.log('| :--- | :--- | :--- | :--- | :--- |');
    
    data.forEach((row, i) => {
        if (!row.Json || !row.Json.startsWith('{')) return;
        try {
            const j = JSON.parse(row.Json);
            j.questions.forEach((q, qi) => {
                const vi = q.explanation.vi || "---";
                const why = q.explanation.why_correct || "---";
                // Limiting length for display
                console.log(`| ${i+1} | ${row.AudioID} | ${q.questionNo} | ${vi} | ${why} |`);
            });
        } catch(e) {}
    });
} catch (e) {
    console.error(e.message);
}
