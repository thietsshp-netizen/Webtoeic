
import * as XLSX from 'xlsx';
import * as path from 'path';

const excelPath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 1/Part 1.xlsx';
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log("EXCEL SAMPLE (First 2 rows):");
console.log(JSON.stringify(data.slice(0, 2), null, 2));
console.log("COLUMNS FOUND:", Object.keys(data[0] || {}));
