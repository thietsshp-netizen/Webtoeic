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

const ROOT_PART_PATH = path.join(process.cwd(), 'Part 1');
const EXCEL_PATH = path.join(ROOT_PART_PATH, 'Part 1.xlsx');
const AUDIO_FOLDER = path.join(ROOT_PART_PATH, 'Part 1_audio');
const PICTURE_FOLDER = path.join(ROOT_PART_PATH, 'Par 1_picture'); // Note the 'Par' typo
const BUCKET_NAME = 'lessons';

async function uploadToSupabase(filePath: string, contentType: string, fileName: string): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARNING] File not found: ${filePath}`);
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  // Using a cleaner path in storage
  const destPath = `toeic_part1/${fileName}`;
  
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

function parseOptions(text: string) {
  let A = "", B = "", C = "", D = "";
  if (!text) return { A, B, C, D };
  
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.includes('(A)')) A = line.replace('(A)', '').trim();
    if (line.includes('(B)')) B = line.replace('(B)', '').trim();
    if (line.includes('(C)')) C = line.replace('(C)', '').trim();
    if (line.includes('(D)')) D = line.replace('(D)', '').trim();
  }
  return { A, B, C, D };
}

async function main() {
  console.log("Starting Reseeding Process for Part 1...");
  
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found at ${EXCEL_PATH}`);
    return;
  }

  // 1. Delete all existing Part 1 data
  console.log("Cleaning up old Part 1 data...");
  const deletedParts = await prisma.toeicPart.deleteMany({
    where: { partNumber: 1 }
  });
  console.log(`Deleted ${deletedParts.count} existing Part 1 records.`);

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${rows.length} rows in new Excel.`);

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
        partNumber: 1,
        title: "Part 1: Photographs"
      }
    });

    for (const row of testRows) {
      const qNo = row.QuestionNo;
      process.stdout.write(`  Q${qNo}... `);
      
      const audioPath = path.join(AUDIO_FOLDER, `${row.AudioID}.mp3`);
      
      // Check multiple extensions for image
      const imgExts = ['.jpg', '.jpeg', '.JPG', '.JPEG'];
      let imgPath = null;
      let finalImgName = "";
      for (const ext of imgExts) {
        const p = path.join(PICTURE_FOLDER, `${row.PicID}${ext}`);
        if (fs.existsSync(p)) {
          imgPath = p;
          finalImgName = `${row.PicID}${ext}`;
          break;
        }
      }

      const audioUrl = await uploadToSupabase(audioPath, 'audio/mpeg', `${row.AudioID}.mp3`);
      const imgUrl = imgPath ? await uploadToSupabase(imgPath, 'image/jpeg', finalImgName) : null;

      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: toeicPart.id,
          audioUrl: audioUrl || "",
          imageUrl: imgUrl || "",
          transcript: row.EngText || "",
          metadata: {
            Book: row.Book,
            Test: row.Test,
            Part: row.Part,
            PicType: row.PicType
          }
        }
      });

      const engOpts = parseOptions(row.EngText);
      const explanationJson = JSON.stringify({
        engText: row.EngText || "",
        vietText: row.VietText || ""
      });

      await prisma.toeicQuestion.create({
        data: {
          groupId: group.id,
          questionNo: parseInt(qNo) || 0,
          optionA: engOpts.A || "Option A",
          optionB: engOpts.B || "Option B",
          optionC: engOpts.C || "Option C",
          optionD: engOpts.D || "Option D",
          correctAnswer: row.Answer?.trim().toUpperCase() || "A",
          explanation: explanationJson,
          metadata: {
            Book: row.Book,
            Test: row.Test,
            Part: row.Part,
            QuestionNo: row.QuestionNo,
            PicType: row.PicType
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
