const xlsx = require('xlsx');
const path = require('path');

const excelPath = "/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_2020-2022-2023-22024-2026Json.xlsx";
console.log("Loading excel...");
const workbook = xlsx.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

console.log("Searching rows...");
const matched = rows.filter(r => r.Json && r.Json.toLowerCase().includes("hi, sandra"));

console.log(`Found ${matched.length} matching rows.`);
matched.forEach((row, idx) => {
  console.log(`\nRow index in sheet: ${idx}`);
  console.log(`Book: ${row.Book}, Test: ${row.Test}, Part: ${row.Part}`);
  console.log(`AudioID: ${row.AudioID}, QuestionRange: ${row.QuestionRange}`);
  
  try {
    const data = JSON.parse(row.Json);
    console.log("Parsed JSON:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error parsing JSON:", e.message);
  }
});
