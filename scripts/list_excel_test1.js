const xlsx = require('xlsx');

const excelPath = "/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_2020-2022-2023-22024-2026Json.xlsx";
console.log("Loading excel...");
const workbook = xlsx.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

console.log("Filtering rows for Book=ETS2020, Test=1, Part=3...");
const matched = rows.filter(r => r.Book === 'ETS2020' && String(r.Test) === '1' && String(r.Part) === '3');

console.log(`Found ${matched.length} rows.`);
matched.forEach(row => {
  console.log(`- AudioID: ${row.AudioID}, QuestionRange: ${row.QuestionRange}`);
  try {
    const data = JSON.parse(row.Json);
    const firstP = data.passages?.[0];
    const html = firstP?.html_content || "";
    const excerpt = html.substring(0, 100);
    console.log(`  Excerpt: ${excerpt}`);
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
});
