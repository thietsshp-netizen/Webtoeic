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

const EXCEL_DIR = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 7';

async function main() {
  console.log("🚀 Starting Seeding Process for Part 7...");

  // [DỌN DẸP MỘT LẦN] Xóa sạch dữ liệu ETS2026 trước khi nạp lại chuẩn
  const deReset = 'ETS2026';
  console.log(`[DỌN DẸP] Đang xóa toàn bộ dữ liệu cũ của bộ: ${deReset}...`);
  const resetCount = await prisma.toeicQuestionGroup.deleteMany({
    where: {
      part: { partNumber: 7 },
      OR: [
        { metadata: { path: ['book'], equals: deReset } },
        { metadata: { path: ['de'], equals: deReset } }
      ]
    }
  });
  console.log(`[XONG] Đã xóa sạch ${resetCount.count} cụm câu hỏi cũ của bộ ${deReset}.`);

  // Lọc chỉ nạp file Test 1 theo yêu cầu
  const files = fs.readdirSync(EXCEL_DIR).filter(f => f.endsWith('.xlsx') && f.includes('ETS2026_Test 1'));
  console.log(`📂 Found ${files.length} target Excel files:`, files);

  for (const file of files) {
    const filePath = path.join(EXCEL_DIR, file);
    console.log(`\n📄 Processing file: ${file}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const deName = 'ETS2026'; // Explicitly set as requested
    const defaultTestNo = 1;

    // 1. Find or Create ToeicTest
    let toeicTest = await prisma.toeicTest.findFirst({ where: { title: deName } });
    if (!toeicTest) {
      toeicTest = await prisma.toeicTest.create({
        data: {
          title: deName,
          description: `Bộ đề luyện tập TOEIC ${deName}`,
          isPublished: true,
        }
      });
      console.log(`✅ Created ToeicTest: ${toeicTest.id}`);
    }

    // 2. Find or Create ToeicPart (Part 7)
    let toeicPart = await prisma.toeicPart.findFirst({
      where: { testId: toeicTest.id, partNumber: 7 }
    });
    if (!toeicPart) {
      toeicPart = await prisma.toeicPart.create({
        data: {
          testId: toeicTest.id,
          partNumber: 7,
          title: "Part 7: Reading Comprehension"
        }
      });
    }

    // 3. Process Sheet Rows
    console.log(`[File: ${file}] Processing ${data.length} rows...`);

    for (const row of data as any[]) {
      const bookValue = row['Book'] || deName;
      const testNo = row['Test'] ? parseInt(row['Test']) : defaultTestNo;
      const range = (row['QuestionRange'] || '').toString().trim();
      const jsonContent = row['Json'];

      if (!range || !jsonContent) continue;

      // SURGICAL IDENTIFICATION: Book + Test + Part + Range
      const existingGroup = await prisma.toeicQuestionGroup.findFirst({
        where: {
          partId: toeicPart.id,
          AND: [
            { metadata: { path: ['book'], equals: bookValue } },
            { metadata: { path: ['test'], equals: testNo } },
            { metadata: { path: ['range'], equals: range } }
          ]
        }
      });

      let parsedData;
      try {
        parsedData = JSON.parse(jsonContent);
      } catch (e) {
        console.error(`❌ Lỗi parse JSON cho Range ${range}`);
        continue;
      }

      // Chuẩn hóa dữ liệu từ JSON column
      const passageData = {
        passages: parsedData.passages || [],
        group_metadata: parsedData.group_metadata || {}
      };

      let group;
      const groupPayload = {
        passageText: JSON.stringify(passageData),
        metadata: {
          range: range,
          test: testNo,
          book: bookValue,
          day: row['Day']?.toString() || '',
          type: row['Type']?.toString() || ''
        }
      };

      if (existingGroup) {
        console.log(`   [Update] Range ${range} (Test ${testNo})`);
        group = await prisma.toeicQuestionGroup.update({
          where: { id: existingGroup.id },
          data: groupPayload
        });
      } else {
        console.log(`   [Create] Range ${range} (Test ${testNo})`);
        group = await prisma.toeicQuestionGroup.create({
          data: {
            partId: toeicPart.id,
            ...groupPayload
          }
        });
      }

      // 4. Handle Questions from JSON
      const questions = parsedData.questions || [];
      for (const q of questions) {
        const qNo = q.questionNo;
        const existingQuestion = await prisma.toeicQuestion.findFirst({
          where: {
            groupId: group.id,
            questionNo: qNo
          }
        });

        const questionPayload = {
          questionNo: qNo,
          questionText: q.questionText || '',
          optionA: (q.options?.A || '').toString(),
          optionB: (q.options?.B || '').toString(),
          optionC: (q.options?.C || '').toString(),
          optionD: (q.options?.D || '').toString(),
          correctAnswer: (q.correctAnswer || 'A').toString().toUpperCase(),
          explanation: typeof q.explanation === 'object' ? JSON.stringify(q.explanation) : (q.explanation || ''),
          metadata: q // Đưa nguyên xi dữ liệu từ Excel vào metadata
        };

        if (existingQuestion) {
          await prisma.toeicQuestion.update({
            where: { id: existingQuestion.id },
            data: questionPayload
          });
        } else {
          await prisma.toeicQuestion.create({
            data: {
              groupId: group.id,
              ...questionPayload
            }
          });
        }
      }
    }
  }

  console.log("\n✨ Seeding Script Finished successfully!");
}

main()
  .catch(e => {
    console.error("💥 ERROR during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
