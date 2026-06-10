import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const EXCEL_PATH = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 1/Part1_Vocabulary_Groups.xlsx';
const OUTPUT_PATH = '/Users/thietphamvan/hoctoeic/Webtoeic/src/data/part1_word_families.json';

try {
  console.log('Reading Part 1 Excel file...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`Read ${data.length} rows.`);
  const wordFamilies = [];

  data.forEach((row, i) => {
    const colA = row[0];
    const colB = row[1];
    if (!colA || !colB) return;

    const groupName = String(colA).trim();
    const wordsContent = String(colB).trim();

    // Strip brackets
    let cleanText = wordsContent.replace(/\[Đồng nghĩa TOEIC hay gặp:/g, '').replace(/\]/g, '');
    
    // Pattern to capture word/phrase before parentheses
    const regex = /([a-zA-Z\s'’/↔\-]+)\s*\((?:"[^"]*"|[^)]+)\)/g;
    let match;
    const extractedWords = new Set();

    while ((match = regex.exec(cleanText)) !== null) {
      const term = match[1].trim().toLowerCase();
      const subTerms = term.split(/[/↔]/);
      subTerms.forEach(st => {
        const cleanSt = st.trim();
        if (cleanSt && cleanSt.length > 1) {
          extractedWords.add(cleanSt);
        }
      });
    }

    if (extractedWords.size > 0) {
      wordFamilies.push({
        id: `part1-row-${i}`,
        type: 'word',
        key: groupName,
        words: Array.from(extractedWords),
        originalValue: wordsContent
      });
    }
  });

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(wordFamilies, null, 2), 'utf-8');
  console.log(`Successfully parsed Part 1 Excel and saved ${wordFamilies.length} word families to ${OUTPUT_PATH}`);

} catch (e) {
  console.error('Error running parser script:', e);
}
