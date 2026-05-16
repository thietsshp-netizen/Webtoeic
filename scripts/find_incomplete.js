
const XLSX = require('xlsx');
const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const datasheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(datasheet);

    const incomplete = [];

    rows.forEach((row, i) => {
        if (!row.Json || !row.Json.trim().startsWith('{')) return;
        
        try {
            const data = JSON.parse(row.Json);
            let reason = '';
            
            if (data.questions) {
                data.questions.forEach((q, qi) => {
                    if (!q.explanation) {
                        reason += `Q${qi+1} missing explanation. `;
                    } else {
                        if (!q.explanation.vi) reason += `Q${qi+1} missing vi translation. `;
                        if (!q.explanation.options_vn) reason += `Q${qi+1} missing options_vn. `;
                        if (!q.explanation.analysis) reason += `Q${qi+1} missing analysis. `;
                    }
                });
            }

            if (reason) {
                incomplete.push({
                    row: i + 1,
                    audioId: row.AudioID,
                    reason: reason.trim(),
                    json: row.Json
                });
            }
        } catch (e) {
            incomplete.push({ row: i+1, audioId: row.AudioID, reason: 'Broken JSON: ' + e.message, json: row.Json });
        }
    });

    console.log(`Found ${incomplete.length} incomplete rows.`);
    incomplete.slice(0, 5).forEach(item => {
        console.log(`\nRow ${item.row} (${item.audioId}): ${item.reason}`);
    });

} catch (e) {
    console.error(e.message);
}
