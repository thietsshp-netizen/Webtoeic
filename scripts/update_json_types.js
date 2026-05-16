const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 5/Part 5-tong hop/Part 5 - tong hop_phanLoai.xlsx';
const backupPath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 5/Part 5-tong hop/Part 5 - tong hop_phanLoai_backup.xlsx';

async function main() {
    console.log('Loading workbook...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    console.log(`Processing sheet: ${sheetName}`);

    const range = XLSX.utils.decode_range(sheet['!ref']);
    let aiJsonCol = -1;
    let qTypeCol = -1;

    // Find column indices
    for (let c = range.s.c; c <= range.e.c; ++c) {
        const address = XLSX.utils.encode_col(c) + "1";
        if (!sheet[address]) continue;
        const val = sheet[address].v;
        if (val === 'AI_JSON') aiJsonCol = c;
        if (val === 'Question_Type') qTypeCol = c;
    }

    if (aiJsonCol === -1 || qTypeCol === -1) {
        console.error('Could not find AI_JSON or Question_Type columns.');
        console.log('Columns found:', range.s.c, 'to', range.e.c);
        process.exit(1);
    }

    console.log(`AI_JSON column: ${XLSX.utils.encode_col(aiJsonCol)}`);
    console.log(`Question_Type column: ${XLSX.utils.encode_col(qTypeCol)}`);

    let updateCount = 0;
    for (let r = range.s.r + 1; r <= range.e.r; ++r) {
        const jsonCellAddr = XLSX.utils.encode_cell({ r, c: aiJsonCol });
        const qTypeCellAddr = XLSX.utils.encode_cell({ r, c: qTypeCol });

        const jsonCell = sheet[jsonCellAddr];
        const qTypeCell = sheet[qTypeCellAddr];

        if (jsonCell && jsonCell.v && qTypeCell && qTypeCell.v) {
            try {
                const jsonStr = jsonCell.v.toString().trim();
                const qType = qTypeCell.v.toString().trim();

                if (jsonStr.startsWith('{')) {
                    const obj = JSON.parse(jsonStr);
                    
                    // Skip if already has Question_Type (optional, but safer to update)
                    // Create new object to maintain order
                    const newObj = {};
                    let added = false;
                    
                    for (const key in obj) {
                        newObj[key] = obj[key];
                        if (key === 'questionText') {
                            newObj['Question_Type'] = qType;
                            added = true;
                        }
                    }
                    
                    if (!added) {
                        newObj['Question_Type'] = qType;
                    }

                    // Update cell value
                    jsonCell.v = JSON.stringify(newObj);
                    updateCount++;
                }
            } catch (e) {
                console.error(`Error processing row ${r + 1}: ${e.message}`);
            }
        }
    }

    console.log(`Updated ${updateCount} rows.`);
    
    console.log('Saving workbook with compression and SST...');
    XLSX.writeFile(workbook, filePath, { compression: true, bookSST: true });
    console.log('Done!');
}

main().catch(console.error);
