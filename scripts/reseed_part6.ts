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

const EXCEL_PATH = path.join(process.cwd(), 'Part 6', 'Part 6.xlsx');

async function main() {
  console.log("Starting Reseeding Process for Part 6 (Smart Schema Mapping)...");
  
  // 1. Cleanup Part 6
  console.log("Cleaning up old Part 6 records from DB...");
  await prisma.toeicPart.deleteMany({ where: { partNumber: 6 } });

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${rows.length} passages in Excel.`);

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

    const part6 = await prisma.toeicPart.create({
      data: { testId: toeicTest.id, partNumber: 6, title: "Part 6" }
    });

    for (const row of testRows) {
      process.stdout.write(`  Range ${row.QuestionRange}... `);
      
      let json: any = {};
      try {
          // Handle potential double quote issues in raw string if any
          let rawJson = typeof row.Json === 'string' ? row.Json : JSON.stringify(row.Json);
          // If it's a messed up string with "" and wrapped in ", fix it
          if (rawJson.startsWith('"') && rawJson.endsWith('"') && rawJson.includes('""')) {
              rawJson = rawJson.slice(1, -1).replace(/""/g, '"');
          }
          json = JSON.parse(rawJson);
      } catch (e) {
          console.error(`\n[ERROR] Invalid JSON for ${row.QuestionRange}: ${(e as any).message}`);
          continue;
      }

      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: part6.id,
          transcript: json.html_content || "",
          metadata: {
            Book: row.Book,
            Test: row.Test,
            Part: row.Part,
            QuestionRange: row.QuestionRange,
            PassageType: json.PassageType,
            translation_map: json.translation_map
          }
        }
      });

      if (json.questions && Array.isArray(json.questions)) {
          for (const q of json.questions) {
            // SMART MAPPING
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
                questionText: q.text || q.questionText || "",
                optionA: optA,
                optionB: optB,
                optionC: optC,
                optionD: optD,
                correctAnswer: correct,
                explanation: JSON.stringify(q.explanation || {}),
                metadata: {
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
