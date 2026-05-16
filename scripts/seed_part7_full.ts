import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const excelPath = "/Users/thietphamvan/hoctoeic/Webtoeic/Part 7/Part 7.xlsx";

  if (!fs.existsSync(excelPath)) {
    console.error("Excel file not found at:", excelPath);
    return;
  }

  console.log("Reading Excel file...");
  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} rows in Excel.`);

  // 1. CLEAR EXISTING PART 7 DATA
  console.log("Cleaning existing Part 7 data...");
  const part7s = await prisma.toeicPart.findMany({
    where: { partNumber: 7 }
  });

  for (const part of part7s) {
    console.log(`Deleting Part 7 for Test ID: ${part.testId}`);
    await prisma.toeicPart.delete({
      where: { id: part.id }
    });
  }
  console.log("Cleaned up existing Part 7 data.");

  let seededGroups = 0;
  let seededQuestions = 0;

  for (const row of data) {
    const { Book, Test, Part, QuestionRange, Json } = row;

    if (!Json) {
      console.warn(`Skipping row with missing JSON data: ${QuestionRange}`);
      continue;
    }

    try {
      const fullJson = JSON.parse(Json);
      
      const bookTitle = String(Book || "Unknown Book");
      const testTitle = String(Test || "Unknown Test");
      const fullTestTitle = `${bookTitle} - ${testTitle}`;

      // 2. Find or Create ToeicTest
      let test = await prisma.toeicTest.findFirst({
        where: { title: fullTestTitle }
      });

      if (!test) {
        test = await prisma.toeicTest.create({
          data: {
            title: fullTestTitle,
            description: `Seeded from Part 7 Excel`,
            isPublished: true,
          }
        });
        console.log(`Created new Test: ${fullTestTitle}`);
      }

      // 3. Create ToeicPart
      let toeicPart = await prisma.toeicPart.findFirst({
        where: { testId: test.id, partNumber: 7 }
      });

      if (!toeicPart) {
        toeicPart = await prisma.toeicPart.create({
          data: {
            testId: test.id,
            partNumber: 7,
            title: `Part 7: Reading Comprehension`,
          }
        });
      }

      // 4. Create ToeicQuestionGroup
      const groupMetadata = {
        book: Book,
        test: Test,
        questionRange: QuestionRange,
        intro_text: fullJson.group_metadata?.intro_text,
        intro_text_vn: fullJson.group_metadata?.intro_text_vn,
        complexity: fullJson.group_metadata?.complexity, // FOR FILTERING
        passage_count: fullJson.group_metadata?.passage_count,
        category: fullJson.passages?.[0]?.category // FOR FILTERING
      };

      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: toeicPart.id,
          passageText: JSON.stringify(fullJson.passages),
          metadata: groupMetadata as any
        }
      });

      seededGroups++;

      // 5. Create ToeicQuestions
      const questionsArray = fullJson.questions || [];
      for (const q of questionsArray) {
        const qData = {
          groupId: group.id,
          questionNo: Number(q.questionNo),
          questionText: q.questionText,
          optionA: String(q.options.A),
          optionB: String(q.options.B),
          optionC: String(q.options.C),
          optionD: q.options.D ? String(q.options.D) : null,
          correctAnswer: q.correctAnswer,
          explanation: JSON.stringify({
            why_correct: q.explanation?.why_correct,
            wrong: q.explanation?.wrong_options,
          }),
          metadata: {
            questionText_vn: q.questionText_vn,
            options_vn: q.options_vn,
            evidence_sids: q.evidence_sids,
            highlight_color: q.highlight_color,
            type: q.type // FOR FILTERING
          } as any
        };

        await prisma.toeicQuestion.create({
          data: qData
        });

        seededQuestions++;
      }
      console.log(`Uploaded Group: ${QuestionRange} (${fullJson.group_metadata?.complexity}) - ${questionsArray.length} questions`);

    } catch (err) {
      console.error(`Error processing QuestionRange ${QuestionRange}:`, err);
    }
  }

  console.log(`\nCOMPLETED! Seeded ${seededGroups} groups and ${seededQuestions} questions successfully.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
