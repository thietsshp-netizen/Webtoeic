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

const FOLDER_PATH = path.join(process.cwd(), 'Part 1');
const EXCEL_PATH = path.join(FOLDER_PATH, 'Part 1.xlsx');
const BUCKET_NAME = 'lessons';

async function uploadToSupabase(filePath: string, contentType: string, fileName: string): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARNING] File not found: ${filePath}`);
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const destPath = `toeic_part1/${Date.now()}_${fileName}`;
  
  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(destPath, fileBuffer, {
    contentType,
    upsert: true,
    cacheControl: '86400',
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

async function seedTests(groupedData: Record<string, any[]>, prefixLabel: string) {
  for (const [key, rows] of Object.entries(groupedData)) {
    const testTitle = `Part 1 - ${prefixLabel} ${key}`;
    console.log(`\n--- Processing: ${testTitle} (${rows.length} questions) ---`);
    
    let toeicTest = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
    if (!toeicTest) {
      toeicTest = await prisma.toeicTest.create({
        data: {
          title: testTitle,
          description: `Bộ luyện tập phần Photographs - ${prefixLabel} ${key}`,
          isPublished: true,
        }
      });
      console.log(`Created ToeicTest: ${toeicTest.id}`);
    }

    // Clear existing Part 1 data for this test to handle duplicates
    const existingPart = await prisma.toeicPart.findFirst({
        where: { testId: toeicTest.id, partNumber: 1 }
    });
    if (existingPart) {
        console.log(`Clearing existing Part 1 data for Test: ${testTitle}`);
        await prisma.toeicPart.delete({ where: { id: existingPart.id } });
    }

    const toeicPart = await prisma.toeicPart.create({
      data: {
        testId: toeicTest.id,
        partNumber: 1,
        title: "Part 1: Photographs"
      }
    });

    for (const row of rows) {
      const qNo = row.Id;
      console.log(`Processing Question ${qNo}...`);
      
      const audioPath = path.join(FOLDER_PATH, `${row.AudioID}.mp3`);
      const imgPathExt1 = path.join(FOLDER_PATH, `${row.PicID}.jpg`);
      const imgPathExt2 = path.join(FOLDER_PATH, `${row.PicID}.JPG`);
      const imgPathExt3 = path.join(FOLDER_PATH, `${row.PicID}.jpeg`);
      const imgPathExt4 = path.join(FOLDER_PATH, `${row.PicID}.JPEG`);
      let imgPath = null;
      if (fs.existsSync(imgPathExt1)) imgPath = imgPathExt1;
      else if (fs.existsSync(imgPathExt2)) imgPath = imgPathExt2;
      else if (fs.existsSync(imgPathExt3)) imgPath = imgPathExt3;
      else if (fs.existsSync(imgPathExt4)) imgPath = imgPathExt4;

      const audioUrl = await uploadToSupabase(audioPath, 'audio/mpeg', `${row.AudioID}.mp3`);
      const imgUrl = imgPath ? await uploadToSupabase(imgPath, 'image/jpeg', `${row.PicID}.jpeg`) : null;

      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: toeicPart.id,
          audioUrl: audioUrl || "",
          imageUrl: imgUrl || "",
          transcript: row.EngText || "", // Optional, stored in question as well
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
          explanation: explanationJson
        }
      });
    }
  }
}

async function main() {
  console.log("Starting Seeding Process for Part 1...");
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found at ${EXCEL_PATH}`);
    return;
  }

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${rows.length} rows in Excel.`);

  // Grouping 1: By Day
  const groupedByDay: Record<string, any[]> = {};
  // Grouping 2: By PicType (Category/QuesType)
  const groupedByType: Record<string, any[]> = {};

  for (const row of rows) {
    const day = row.Day || "Unassigned";
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(row);

    const type = row.PicType || "General";
    if (!groupedByType[type]) groupedByType[type] = [];
    groupedByType[type].push(row);
  }

  // Seed both groupings
  await seedTests(groupedByDay, "Luyện tập Day");
  await seedTests(groupedByType, "Category");

  console.log("Seeding Script Finished successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
