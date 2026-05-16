import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const EXCEL_PATH = path.join(process.cwd(), 'Part 7', 'Part 7.xlsx');

async function main() {
  console.log("Starting Reseeding Process for Part 7 (Final Version)...");

  // 1. Cleanup Part 7
  console.log("Cleaning up old Part 7 records from DB...");
  await prisma.toeicPart.deleteMany({ where: { partNumber: 7 } });

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${rows.length} passages/groups in Excel.`);

  const groupedData: Record<string, any[]> = {};
  for (const row of rows) {
    const key = `${row.Book} - Test ${row.Test}`;
    if (!groupedData[key]) groupedData[key] = [];
    groupedData[key].push(row);
  }

  for (const [testTitle, testRows] of Object.entries(groupedData)) {
    console.log(`\n--- Processing: ${testTitle} ---`);

    let toeicTest = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
    if (!toeicTest) {
      toeicTest = await prisma.toeicTest.create({
        data: { title: testTitle, description: `Bộ đề luyện tập ${testTitle}`, isPublished: true }
      });
    }

    const part7 = await prisma.toeicPart.create({
      data: { testId: toeicTest.id, partNumber: 7, title: "Part 7" }
    });

    for (const row of testRows) {
      process.stdout.write(`  Range ${row.QuestionRange}... `);

      let json: any = {};
      let cleanJsonStr = "";
      try {
        let rawJson = typeof row.Json === 'string' ? row.Json : JSON.stringify(row.Json);

        // 1. Remove bad control characters (tabs, newlines inside strings that are unescaped)
        rawJson = rawJson.replace(/[\u0000-\u001F]+/g, (match: string) => {
          if (match === '\n' || match === '\r' || match === '\t') return match;
          return ' ';
        });

        // 2. Fix Double Quotes
        if (rawJson.trim().startsWith('"') && rawJson.trim().endsWith('"') && rawJson.includes('""')) {
          rawJson = rawJson.trim().slice(1, -1).replace(/""/g, '"');
        } else {
          rawJson = rawJson.replace(/""/g, '"');
        }

        // 3. Fix trailing commas and missing commas between objects
        rawJson = rawJson.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
        rawJson = rawJson.replace(/}\s*{/g, '},{').replace(/]\s*\[/g, '],[');

        json = JSON.parse(rawJson);
        cleanJsonStr = JSON.stringify(json);
      } catch (e) {
        console.error(`\n[ERROR] Invalid JSON for ${row.QuestionRange}: ${(e as any).message}`);
        continue;
      }

      const gMeta = json.group_metadata || {};

      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: part7.id,
          transcript: cleanJsonStr, // RAW JSON for UI
          metadata: {
            Book: row.Book,
            Test: row.Test,
            Part: row.Part,
            QuestionRange: row.QuestionRange,
            passage_type: gMeta.passage_type,
            complexity: gMeta.complexity,
            intro_text: gMeta.intro_text
          }
        }
      });

      if (json.questions && Array.isArray(json.questions)) {
        for (const q of json.questions) {
          const qNo = q.questionNo || q.id || 0;
          const correct = q.correctAnswer || q.correct || q.correct_answer || "A";

          let optA = "", optB = "", optC = "", optD = "";
          if (q.optionA) {
            optA = q.optionA; optB = q.optionB; optC = q.optionC; optD = q.optionD;
          } else if (q.options) {
            optA = q.options.A || ""; optB = q.options.B || ""; optC = q.options.C || ""; optD = q.options.D || "";
          }

          await prisma.toeicQuestion.create({
            data: {
              groupId: group.id,
              questionNo: parseInt(qNo),
              questionText: q.questionText || q.text || "",
              optionA: optA,
              optionB: optB,
              optionC: optC,
              optionD: optD,
              correctAnswer: correct,
              explanation: JSON.stringify(q.explanation || {}),
              metadata: {
                type: q.type || q.Question_Type || "General",
                evidence_sids: q.evidence_sids || q.clue_sentence_ids || [],
                explanation_vn: q.explanation || {}
              }
            }
          });
        }
      }
      process.stdout.write(`Done\n`);
    }
  }

  console.log("\nReseeding Script Finished successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
