const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

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
const EXCEL_PATH = path.join(FOLDER_PATH, 'Part34_Json.xlsx');
const BUCKET_NAME = 'lessons';

async function uploadToSupabase(filePath, contentType, fileName) {
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

async function seedTests(groupedByDay) {
  for (const [day, rows] of Object.entries(groupedByDay)) {
    const partsInDay = [3, 4];

    for (const partNum of partsInDay) {
        const partRows = rows.filter(r => r.Part === partNum);
        if (partRows.length === 0) continue;

        const testTitle = `Luyện tập ${day} - Part ${partNum} (Modern)`;
        console.log(`\n--- Processing: ${testTitle} (${partRows.length} groups) ---`);
        
        let toeicTest = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
        if (!toeicTest) {
          toeicTest = await prisma.toeicTest.create({
            data: {
              title: testTitle,
              description: `Bộ luyện tập phần ${partNum === 3 ? "Conversations" : "Short Talks"} - ${day}`,
              isPublished: true,
            }
          });
        }

        const existingPart = await prisma.toeicPart.findFirst({
            where: { testId: toeicTest.id, partNumber: partNum }
        });
        if (existingPart) {
            console.log(`  Clearing old Part ${partNum} data...`);
            await prisma.toeicPart.delete({ where: { id: existingPart.id } });
        }

        const toeicPart = await prisma.toeicPart.create({
          data: { 
            testId: toeicTest.id, 
            partNumber: partNum, 
            title: partNum === 3 ? "Part 3: Conversations" : "Part 4: Short Talks" 
          }
        });

        for (const row of partRows) {
            const audioId = row.AudioID;
            const jsonData = JSON.parse(row.Json);
            
            console.log(`  Seeding AudioID: ${audioId}...`);
            
            const audioPath = path.join(AUDIO_DIR, `${audioId}.mp3`);
            const picId = row.PicID || audioId;
            const imgPathJpg = path.join(PICTURE_DIR, `${picId}.jpg`);
            const imgPathJpeg = path.join(PICTURE_DIR, `${picId}.jpeg`);
            
            let imgPath = null;
            if (fs.existsSync(imgPathJpg)) imgPath = imgPathJpg;
            else if (fs.existsSync(imgPathJpeg)) imgPath = imgPathJpeg;

            const audioUrl = await uploadToSupabase(audioPath, 'audio/mpeg', `${audioId}.mp3`);
            const imgUrl = imgPath ? await uploadToSupabase(imgPath, 'image/jpeg', `${picId}.jpg`) : null;

            const group = await prisma.toeicQuestionGroup.create({
              data: {
                partId: toeicPart.id,
                audioUrl: audioUrl || "",
                imageUrl: imgUrl || "",
                passageText: row.Json,
                metadata: { audioId: audioId, isModern: true }
              }
            });

            for (const q of jsonData.questions) {
                await prisma.toeicQuestion.create({
                    data: {
                        groupId: group.id,
                        questionNo: q.questionNo,
                        questionText: q.text,
                        optionA: q.options.A,
                        optionB: q.options.B,
                        optionC: q.options.C,
                        optionD: q.options.D,
                        correctAnswer: q.correct,
                        explanation: JSON.stringify(q.explanation),
                        metadata: { evidence_sids: q.evidence_sids }
                    }
                });
            }
        }
    }
  }
}

async function main() {
  console.log("Starting JS Seeding Process for Part 3 & 4...");
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel error: ${EXCEL_PATH} not found.`);
    return;
  }

  const workbook = xlsx.readFile(EXCEL_PATH);
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  const groupedByDay = {};
  rows.forEach(r => {
    const day = r.Day || "Unassigned";
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(r);
  });

  await seedTests(groupedByDay);
  console.log("\nSuccess! Database is now updated with modern Part 3/4 data.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
