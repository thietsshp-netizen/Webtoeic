import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const ROOT_PART_PATH = path.join(process.cwd(), 'Part 2');
const EXCEL_PATH = path.join(ROOT_PART_PATH, 'Part2.xlsx');
const AUDIO_ROOT_FOLDER = path.join(ROOT_PART_PATH, 'Part 2_audio');
const BUCKET_NAME = 'lessons';

// Cache to find audio files recursively
const audioFileMap: Record<string, string> = {};
function scanAudioFiles(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanAudioFiles(fullPath);
        } else if (file.endsWith('.mp3')) {
            audioFileMap[file.replace('.mp3', '')] = fullPath;
        }
    }
}

async function uploadToSupabase(filePath: string, contentType: string, fileName: string): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARNING] File not found: ${filePath}`);
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const destPath = `toeic_part2/${fileName}`;
  
  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(destPath, fileBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.error(`[ERROR] Supabase upload failed for ${fileName}:`, error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(destPath);
  return publicUrl;
}

async function main() {
  console.log("Starting Reseeding Process for Part 2...");
  
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found at ${EXCEL_PATH}`);
    return;
  }

  console.log("Scanning audio files...");
  scanAudioFiles(AUDIO_ROOT_FOLDER);

  // 1. Delete all existing Part 2 data
  console.log("Cleaning up old Part 2 data...");
  const deletedParts = await prisma.toeicPart.deleteMany({
    where: { partNumber: 2 }
  });
  console.log(`Deleted ${deletedParts.count} existing Part 2 records.`);

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${rows.length} rows in Excel.`);

  // 2. Group by Book and Test
  const groupedData: Record<string, any[]> = {};
  for (const row of rows) {
    const key = `${row.Book} - Test ${row.Test}`;
    if (!groupedData[key]) groupedData[key] = [];
    groupedData[key].push(row);
  }

  for (const [testTitle, testRows] of Object.entries(groupedData)) {
    console.log(`\n--- Processing: ${testTitle} (${testRows.length} questions) ---`);
    
    // 3. Find or Create ToeicTest
    let toeicTest = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
    if (!toeicTest) {
      toeicTest = await prisma.toeicTest.create({
        data: {
          title: testTitle,
          description: `Bộ đề luyện tập từ sách ${testTitle.split(' - ')[0]}`,
          isPublished: true,
        }
      });
      console.log(`Created ToeicTest: ${toeicTest.id}`);
    }

    // 4. Create ToeicPart
    const toeicPart = await prisma.toeicPart.create({
      data: {
        testId: toeicTest.id,
        partNumber: 2,
        title: "Part 2: Question-Response"
      }
    });

    for (const row of testRows) {
      const qNo = row.QuestionNo;
      process.stdout.write(`  Q${qNo}... `);
      
      const audioPath = audioFileMap[row.AudioID];
      const audioUrl = audioPath ? await uploadToSupabase(audioPath, 'audio/mpeg', `${row.AudioID}.mp3`) : null;

      let questionJson: any = {};
      try {
          questionJson = JSON.parse(row.Json);
      } catch (e) {
          console.error(`\n[ERROR] Invalid JSON for Question ${qNo} in ${testTitle}`);
          continue;
      }

      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: toeicPart.id,
          audioUrl: audioUrl || "",
          transcript: questionJson.question?.en || "",
          metadata: {
            Book: row.Book,
            Test: row.Test,
            Part: row.Part,
            type: questionJson.type
          }
        }
      });

      await prisma.toeicQuestion.create({
        data: {
          groupId: group.id,
          questionNo: parseInt(qNo) || 0,
          questionText: questionJson.question?.en || "",
          optionA: questionJson.options?.[0]?.en || "",
          optionB: questionJson.options?.[1]?.en || "",
          optionC: questionJson.options?.[2]?.en || "",
          optionD: questionJson.options?.[3]?.en || "",
          correctAnswer: questionJson.correctAnswer || "A",
          explanation: JSON.stringify(questionJson.explanation || {}),
          metadata: {
            Book: row.Book,
            Test: row.Test,
            Part: row.Part,
            QuestionNo: row.QuestionNo,
            type: questionJson.type,
            vietnamese: {
                question: questionJson.question?.vi,
                options: questionJson.options?.map((o: any) => ({ label: o.label, text: o.vi })),
                explanation: questionJson.explanation
            }
          }
        }
      });
      process.stdout.write(`Done\n`);
    }
  }

  console.log("\nReseeding Script Finished successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
