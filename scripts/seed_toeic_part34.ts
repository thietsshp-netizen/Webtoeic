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

const FOLDER_PATH = path.join(process.cwd(), 'Part 3_4');
const AUDIO_DIR = path.join(FOLDER_PATH, 'Audio');
const PICTURE_DIR = path.join(FOLDER_PATH, 'Picture');
const EXCEL_PATH = path.join(FOLDER_PATH, 'Part 3_4.xlsx');
const BUCKET_NAME = 'lessons';

async function uploadToSupabase(filePath: string, contentType: string, fileName: string): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const destPath = `toeic_part3_4/${Date.now()}_${fileName}`;

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

async function seedTests(groupedDataByDay: Record<string, any[]>) {
  for (const [day, allRows] of Object.entries(groupedDataByDay)) {
    // Tách theo Part 3 và Part 4 trong cùng 1 Day
    const partsInDay = [3, 4];

    for (const partNum of partsInDay) {
      const rows = allRows.filter(r => r.Part === partNum);
      if (rows.length === 0) continue;

      const testTitle = `Luyện tập ${day} - Part ${partNum}`;
      console.log(`\n--- Processing: ${testTitle} (${rows.length} questions) ---`);

      let toeicTest = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
      if (!toeicTest) {
        toeicTest = await prisma.toeicTest.create({
          data: {
            title: testTitle,
            description: `Bộ luyện tập phần ${partNum === 3 ? "Conversations" : "Short Talks"} - ${day}`,
            isPublished: true,
          }
        });
        console.log(`Created ToeicTest: ${toeicTest.id}`);
      }

      // Clear existing Part data for this test
      const existingPart = await prisma.toeicPart.findFirst({
        where: { testId: toeicTest.id, partNumber: partNum }
      });
      if (existingPart) {
        console.log(`Clearing existing Part ${partNum} data for Test: ${testTitle}`);
        await prisma.toeicPart.delete({ where: { id: existingPart.id } });
      }

      const toeicPart = await prisma.toeicPart.create({
        data: { testId: toeicTest.id, partNumber: partNum, title: partNum === 3 ? "Part 3: Conversations" : "Part 4: Short Talks" }
      });

      // Group rows by AudioID (3 questions per group)
      const groups: Record<string, any[]> = {};
      rows.forEach(r => {
        if (!groups[r.AudioID]) groups[r.AudioID] = [];
        groups[r.AudioID].push(r);
      });

      for (const [audioId, groupRows] of Object.entries(groups)) {
        console.log(`  Processing Group ${audioId} (${groupRows.length} questions)...`);

        const audioPath = path.join(AUDIO_DIR, `${audioId}.mp3`);
        // PicID in Part 3/4 might be same as AudioID
        const picId = groupRows[0].PicID || groupRows[0].AudioID;
        const imgPathJpg = path.join(PICTURE_DIR, `${picId}.jpg`);
        const imgPathJpeg = path.join(PICTURE_DIR, `${picId}.jpeg`);

        let imgPath = null;
        if (fs.existsSync(imgPathJpg)) imgPath = imgPathJpg;
        else if (fs.existsSync(imgPathJpeg)) imgPath = imgPathJpeg;

        const audioUrl = await uploadToSupabase(audioPath, 'audio/mpeg', `${audioId}.mp3`);
        const imgUrl = imgPath ? await uploadToSupabase(imgPath, 'image/jpeg', `${picId}.jpg`) : null;

        // Transcript logic: Save English in transcript, Vietnamese in explanation (as currently done in P1/2)
        // Or save structured JSON in transcript? Part 1/2 saves raw text in transcript.
        const group = await prisma.toeicQuestionGroup.create({
          data: {
            partId: toeicPart.id,
            audioUrl: audioUrl || "",
            imageUrl: imgUrl || "",
            transcript: (groupRows[0].Transcript_EN || "").replace(/_/g, " "),
          }
        });

        for (const row of groupRows) {
          const explanationJson = JSON.stringify({
            engText: (row.Transcript_EN || "").replace(/_/g, " "),
            vietText: (row.Transcript_VI || "").replace(/_/g, " "),
            questionVi: row.Question_VI || "",
            optionAVi: row.Option_A_VI || "",
            optionBVi: row.Option_B_VI || "",
            optionCVi: row.Option_C_VI || "",
            optionDVi: row.Option_D_VI || ""
          });

          await prisma.toeicQuestion.create({
            data: {
              groupId: group.id,
              questionNo: parseInt(row.Question_No) || 0,
              questionText: String(row.Question_EN || ""),
              optionA: String(row.Option_A_EN || ""),
              optionB: String(row.Option_B_EN || ""),
              optionC: String(row.Option_C_EN || ""),
              optionD: String(row.Option_D_EN || ""),
              correctAnswer: String(row.Correct_Answer || "A").trim().toUpperCase(),
              explanation: explanationJson
            }
          });
        }
      }
    }
  }
}

async function main() {
  console.log("Starting Seeding Process for Part 3 & 4...");
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found at ${EXCEL_PATH}`);
    return;
  }

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${rows.length} rows in Excel.`);

  const groupedByDay: Record<string, any[]> = {};
  for (const row of rows) {
    const day = row.Day || "Unassigned";
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(row);
  }

  await seedTests(groupedByDay);
  console.log("Seeding Script Finished successfully!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
