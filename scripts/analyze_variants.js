
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json.xlsx';

try {
    const workbook = XLSX.readFile(inputFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    const variants = {};
    const broken = [];

    data.forEach((row, i) => {
        if (!row.Json || !row.Json.trim().startsWith('{')) return;
        
        try {
            const j = JSON.parse(row.Json);
            let schemaKey = '';
            
            if (j.questions && j.questions[0]) {
                const exp = j.questions[0].explanation;
                if (typeof exp === 'string') {
                    schemaKey = 'explanation:string';
                } else if (typeof exp === 'object' && exp !== null) {
                    schemaKey = 'explanation:keys:' + Object.keys(exp).sort().join(',');
                } else {
                    schemaKey = 'explanation:missing';
                }
            } else {
                schemaKey = 'questions:missing';
            }
            
            if (!variants[schemaKey]) variants[schemaKey] = [];
            variants[schemaKey].push(row.AudioID);
            
        } catch (e) {
            broken.push(row.AudioID);
        }
    });

    console.log('--- JSON STRUCTURE VARIANTS ---');
    Object.keys(variants).forEach(key => {
        console.log(`\nVariant [${key}]: ${variants[key].length} rows`);
        console.log(`Example IDs: ${variants[key].slice(0, 3).join(', ')}`);
    });
    
    console.log(`\nBroken Rows: ${broken.length}`);
    if (broken.length > 0) console.log(`Example Broken: ${broken.slice(0, 5).join(', ')}`);

} catch (e) {
    console.error(error.message);
}
