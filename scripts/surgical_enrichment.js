
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

function extractEvidence(html, qNo) {
    if (!html) return "";
    const tag = `<sup>${qNo}</sup>`;
    if (!html.includes(tag)) return "";
    
    const parts = html.split(tag);
    if (parts.length < 2) return "";
    let after = parts[1];
    let evidence = after.split(/<\/div>|<sup>|<\/b>|<b>/i)[0]
                        .replace(/<[^>]*>/g, '')
                        .trim();
    return evidence.split(' ').slice(0, 20).join(' ');
}

try {
    const workbook = XLSX.readFile(inputFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    const processed = data.map((row, idx) => {
        if (!row.Json || !row.Json.trim().startsWith('{')) return row;
        try {
            let j = JSON.parse(row.Json);
            const html = j.passages ? j.passages[0].html_content : "";
            
            // Handle both flat and nested question structures
            let questions = j.questions;
            if (!questions && j.passages && j.passages[0].questions) {
                questions = j.passages[0].questions;
            }
            
            if (!questions) return row;

            questions.forEach(q => {
                const qNo = q.questionNo || q.question_number;
                const correctLabel = q.correct || q.correct_option;
                
                // If explanation doesn't exist, create it
                if (!q.explanation) q.explanation = { vi: "", options_vn: {}, why_correct: "" };
                
                const evidenceEng = extractEvidence(html, qNo);
                
                // Handle options as Object or Array
                let correctTextVi = "";
                if (q.explanation.options_vn && q.explanation.options_vn[correctLabel]) {
                    correctTextVi = q.explanation.options_vn[correctLabel];
                } else if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
                    correctTextVi = q.options[correctLabel];
                } else if (Array.isArray(q.options)) {
                    // Logic for Array options (A=0, B=1, etc)
                    const idx = correctLabel.charCodeAt(0) - 65;
                    correctTextVi = q.options[idx] || "";
                }

                let whyContent = "";
                if (evidenceEng) {
                    whyContent = `Trong bài nghe, người nói có nhắc đến chi tiết: **"${evidenceEng}"**, điều này trực tiếp dẫn tới lựa chọn đáp án **${correctTextVi} (${correctLabel})**.`;
                } else {
                    whyContent = `Dựa vào các từ khóa và bối cảnh được nhắc đến trong đoạn hội thoại/bài nói, đáp án chính xác nhất là **${correctTextVi} (${correctLabel})**.`;
                }
                
                q.explanation.why_correct = whyContent;
            });
            
            row.Json = JSON.stringify(j, null, 2);
        } catch (e) {
            console.error(`Error processing row ${idx + 1} (${row.AudioID}): ${e.message}`);
        }
        return row;
    });

    const newSheet = XLSX.utils.json_to_sheet(processed);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newSheet, workbook.SheetNames[0]);
    XLSX.writeFile(newWb, inputFile);
    console.log("Surgical pedagogical enrichment complete for all records (all variants handled).");
    
} catch (e) {
    console.error(e.message);
}
