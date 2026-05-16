
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

function extractEvidenceText(html, qNo) {
    if (!html) return "";
    const tag = `<sup>${qNo}</sup>`;
    if (!html.includes(tag)) return "";
    
    // Split by tag, take the part AFTER it
    const parts = html.split(tag);
    let after = parts[1];
    
    // Logic: If there is a </b> close tag nearby, the evidence is likely inside the current bold block
    // OR we just take the first few words until the next </div> or <sup> or 15 words.
    
    // Rough extraction: strip tags and take first 80 characters
    let cleaned = after.split(/<\/div>|<sup>/i)[0].replace(/<[^>]*>/g, '').trim();
    return cleaned.split(' ').slice(0, 15).join(' '); // Take first 15 words
}

try {
    const workbook = XLSX.readFile(inputFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    console.log("Analyzing 10 rows for evidence extraction quality...");
    [0, 5, 24, 50, 70, 98, 120, 150, 200, 319].forEach(idx => {
        const row = data[idx];
        if (!row || !row.Json) return;
        const j = JSON.parse(row.Json);
        console.log(`\nRow ${idx+1} [${row.AudioID}]`);
        j.questions.forEach(q => {
            const ev = extractEvidenceText(j.passages[0].html_content, q.questionNo);
            console.log(`  Q${q.questionNo} [${q.correct}]: ${q.options[q.correct]}`);
            console.log(`  Extracted Evidence: ${ev}`);
        });
    });
} catch (e) {
    console.error(e.message);
}
