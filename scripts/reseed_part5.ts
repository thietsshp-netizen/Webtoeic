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

const EXCEL_PATH = path.join(process.cwd(), 'Part 5', 'Part 5 - tong hop_phanLoai--.xlsx');

async function main() {
  console.log("Starting Reseeding Process for Part 5...");
  
  // 1. Cleanup Part 5
  console.log("Cleaning up old Part 5 records from DB...");
  const deletedParts = await prisma.toeicPart.deleteMany({
    where: { partNumber: 5 }
  });
  console.log(`Deleted ${deletedParts.count} existing Part 5 records.`);

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${rows.length} questions in Excel.`);

  const groupedData: Record<string, any[]> = {};
  for (const row of rows) {
    const key = `${row.Book} - Test ${row.Test}`;
    if (!groupedData[key]) groupedData[key] = [];
    groupedData[key].push(row);
  }

  for (const [testTitle, testRows] of Object.entries(groupedData)) {
    console.log(`\n--- Processing: ${testTitle} (${testRows.length} questions) ---`);
    
    let toeicTest = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
    if (!toeicTest) {
      toeicTest = await prisma.toeicTest.create({
        data: { title: testTitle, description: `Bộ đề luyện tập ${testTitle}`, isPublished: true }
      });
    }

    const part5 = await prisma.toeicPart.create({
      data: { testId: toeicTest.id, partNumber: 5, title: "Part 5" }
    });

    for (const row of testRows) {
      process.stdout.write(`  Q${row.QuestionNo}... `);
      
      let json: any = {};
      try {
          json = typeof row.Json === 'string' ? JSON.parse(row.Json) : row.Json;
      } catch (e) {
          console.error(`\n[ERROR] Invalid JSON for Q${row.QuestionNo}`);
          continue;
      }

      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: part5.id,
          metadata: {
            Book: row.Book,
            Test: row.Test,
            Part: row.Part,
            QuestionNo: row.QuestionNo,
            Question_Type: json.Question_Type
          }
        }
      });

      await prisma.toeicQuestion.create({
        data: {
          groupId: group.id,
          questionNo: parseInt(row.QuestionNo),
          questionText: json.questionText || "",
          optionA: json.optionA || "",
          optionB: json.optionB || "",
          optionC: json.optionC || "",
          optionD: json.optionD || "",
          correctAnswer: row.Correct_Answer || json.correctAnswer || "A",
          explanation: JSON.stringify(json.explanation || {}),
          metadata: {
              translation: json.translation,
              vocabulary: json.vocabulary,
              Question_Type: json.Question_Type
          }
        }
      });
      process.stdout.write(`Done\n`);
    }
  }

  console.log("\nReseeding Script Finished successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
