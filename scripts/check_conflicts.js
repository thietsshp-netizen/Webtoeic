
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

try {
    const workbook = XLSX.readFile(inputFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    let conflicts = 0;
    data.forEach(row => {
        if (!row.Json || !row.Json.startsWith('{')) return;
        try {
            const j = JSON.parse(row.Json);
            j.questions.forEach(q => {
                const exp = q.explanation || {};
                const vi = exp.vi || "";
                const why = exp.why_correct || exp.analysis || exp.whyCorrect || "";
                
                // Heuristic for analysis in 'vi'
                const isViAnalysis = (vi.includes('Người') || vi.includes('Văn bản') || vi.includes('vì') || vi.includes('do')) && !vi.includes('?');
                
                if (isViAnalysis && why) {
                    conflicts++;
                    if (conflicts < 10) console.log(`Conflict in ${row.AudioID}: vi=[${vi.substring(0,30)}...] why=[${why.substring(0,30)}...]`);
                }
            });
        } catch(e) {}
    });
    console.log(`Total potential conflicts: ${conflicts}`);
} catch (e) {
    console.error(e.message);
}
