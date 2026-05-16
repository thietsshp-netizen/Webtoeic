
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const workbook = XLSX.readFile(inputFile);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Fix Row 264 (Index 263)
let row264Json = data[263].Json;
if (row264Json.includes('"options_vn":')) {
    // Manually close the JSON
    // It stopped at options_vn:
    // We need to provide the missing options_vn content or just close it if we can
    // Looking at the console output, it was: "options_vn":
    // It's very broken. I will reconstruct it from context if possible or just mark for AI fix.
    console.log("Row 264 is too broken to fix with simple regex. Marking for AI reconstruction.");
}

// Fix Row 310 (Index 309)
let row310Json = data[309].Json;
if (!row310Json.endsWith('}')) {
    row310Json += '\n}';
    data[309].Json = row310Json;
    console.log("Fixed Row 310 by adding missing closing brace.");
}

const newSheet = XLSX.utils.json_to_sheet(data);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newSheet, workbook.SheetNames[0]);
XLSX.writeFile(newWorkbook, inputFile);
