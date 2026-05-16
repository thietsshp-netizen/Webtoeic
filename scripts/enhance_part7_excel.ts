import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelPath = "/Users/thietphamvan/hoctoeic/Webtoeic/Part 7/Part 7.xlsx";
const outputPath = "/Users/thietphamvan/hoctoeic/Webtoeic/Part 7/Part 7_Enhanced.xlsx";

function analyzeQuestionMapping(questions: any[], passages: any[]) {
  return questions.map(q => {
    const type = q.type || "General";
    const qNo = q.questionNo;
    const meta = q.metadata || {};
    const rawSids = meta.evidence_sids || q.evidence_sids || [];
    const sids = Array.isArray(rawSids) ? rawSids : [rawSids];
    
    const relevantPassages = new Set<string>();
    sids.forEach((sid: any) => {
      const s = String(sid).toLowerCase();
      if (s.includes('p1-') || s.startsWith('s')) relevantPassages.add('P1');
      if (s.includes('p2-')) relevantPassages.add('P2');
      if (s.includes('p3-')) relevantPassages.add('P3');
    });

    // Fallback: If no SIDs found but it's a single passage, it's P1
    if (relevantPassages.size === 0 && passages.length === 1) relevantPassages.add('P1');
    // If double/triple and no SIDs, we might need all for context, but let's be conservative
    if (relevantPassages.size === 0) relevantPassages.add('P1');

    const passageStr = Array.from(relevantPassages).sort().join(',');
    return `${qNo}: ${type} (${passageStr})`;
  }).join(' | ');
}

async function main() {
  console.log("Reading original Excel...");
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Processing ${data.length} rows...`);

  const enhancedData = data.map(row => {
    try {
      if (!row.Json) return row;
      const fullJson = JSON.parse(row.Json);
      const passages = fullJson.passages || [];
      const questions = fullJson.questions || [];
      
      const pCount = passages.length;
      let complexity = "Single Passage";
      if (pCount === 2) complexity = "Double Passage";
      if (pCount === 3) complexity = "Triple Passage";

      return {
        ...row,
        PassageCount: pCount,
        Complexity: complexity,
        P1_Category: passages[0]?.category || "",
        P2_Category: passages[1]?.category || "",
        P3_Category: passages[2]?.category || "",
        Question_Analysis: analyzeQuestionMapping(questions, passages)
      };
    } catch (e) {
      console.error(`Error processing row ${row.QuestionRange}:`, e);
      return row;
    }
  });

  console.log("Writing enhanced Excel...");
  const newSheet = XLSX.utils.json_to_sheet(enhancedData);
  const newWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Part 7 Enhanced");
  XLSX.writeFile(newWorkbook, outputPath);

  console.log(`\nSUCCESS! Created: ${outputPath}`);
}

main().catch(console.error);
