
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json.xlsx';

try {
    const workbook = XLSX.readFile(inputFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    const stats = {
        total: data.length,
        hasJson: 0,
        noJson: 0,
        brokenJson: 0,
        variants: {}
    };

    data.forEach((row, i) => {
        if (!row.Json || !row.Json.trim().startsWith('{')) {
            stats.noJson++;
            return;
        }
        
        stats.hasJson++;
        try {
            const j = JSON.parse(row.Json);
            if (j.questions && j.questions[0]) {
                const q = j.questions[0];
                const exp = q.explanation;
                
                let keyStr = '';
                if (typeof exp === 'string') {
                    keyStr = 'EXP_IS_STRING';
                } else if (exp && typeof exp === 'object') {
                    keyStr = Object.keys(exp).sort().join(',');
                } else {
                    keyStr = 'EXP_MISSING';
                }
                
                // Also check for keys like 'why_correct' or 'analysis' directly in question object
                const otherKeys = Object.keys(q).filter(k => 
                    ['why_correct', 'whyCorrect', 'analysis', 'explanation_text'].includes(k)
                ).sort().join(',');
                
                const finalKey = `EXP:{${keyStr}} | Q_KEYS:{${otherKeys}}`;
                
                if (!stats.variants[finalKey]) stats.variants[finalKey] = [];
                stats.variants[finalKey].push(row.AudioID);
            } else {
                if (!stats.variants['QUESTIONS_MISSING']) stats.variants['QUESTIONS_MISSING'] = [];
                stats.variants['QUESTIONS_MISSING'].push(row.AudioID);
            }
            
        } catch (e) {
            stats.brokenJson++;
        }
    });

    console.log(JSON.stringify(stats, null, 2));

} catch (e) {
    console.error(e.message);
}
