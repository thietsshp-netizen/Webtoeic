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

const ROOT_PART_PATH = path.join(process.cwd(), 'Part 3_4');
const EXCEL_PATH = path.join(ROOT_PART_PATH, 'Part34_2020-2022-2023-22024-2026Json.xlsx');
const AUDIO_ROOT_FOLDER = path.join(ROOT_PART_PATH, 'Audio');
const PIC_ROOT_FOLDER = path.join(ROOT_PART_PATH, 'Picture');
const BUCKET_NAME = 'lessons';

// Cache to find files recursively
const audioFileMap: Record<string, string> = {};
const picFileMap: Record<string, string> = {};

function scanFiles(dir: string, map: Record<string, string>, ext: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanFiles(fullPath, map, ext);
        } else if (file.toLowerCase().endsWith(ext)) {
            map[file.replace(new RegExp(`\\${ext}$`, 'i'), '')] = fullPath;
        }
    }
}

async function uploadToSupabase(filePath: string, contentType: string, fileName: string): Promise<string | null> {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  const destPath = `toeic_part3_4/${fileName}`;
  
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
  console.log("Starting Reseeding Process for Part 3 & 4...");
  
  console.log("Scanning media files...");
  scanFiles(AUDIO_ROOT_FOLDER, audioFileMap, '.mp3');
  scanFiles(PIC_ROOT_FOLDER, picFileMap, '.png');
  scanFiles(PIC_ROOT_FOLDER, picFileMap, '.jpg');
  scanFiles(PIC_ROOT_FOLDER, picFileMap, '.jpeg');

  // 1. Cleanup Part 3 and Part 4
  console.log("Cleaning up old Part 3 & 4 records from DB...");
  const deletedParts = await prisma.toeicPart.deleteMany({
    where: { partNumber: { in: [3, 4] } }
  });
  console.log(`Deleted ${deletedParts.count} existing Part 3/4 records.`);

  // Cleanup Storage
  console.log("Cleaning up toeic_part3_4 folder in Storage...");
  const { data: storageFiles } = await supabase.storage.from(BUCKET_NAME).list('toeic_part3_4', { limit: 10000 });
  if (storageFiles && storageFiles.length > 0) {
      await supabase.storage.from(BUCKET_NAME).remove(storageFiles.map(f => `toeic_part3_4/${f.name}`));
      console.log(`Deleted ${storageFiles.length} files from storage.`);
  }

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${rows.length} groups in Excel.`);

  const groupedData: Record<string, any[]> = {};
  for (const row of rows) {
    const key = `${row.Book} - Test ${row.Test}`;
    if (!groupedData[key]) groupedData[key] = [];
    groupedData[key].push(row);
  }

  for (const [testTitle, testRows] of Object.entries(groupedData)) {
    console.log(`\n--- Processing: ${testTitle} (${testRows.length} groups) ---`);
    
    let toeicTest = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
    if (!toeicTest) {
      toeicTest = await prisma.toeicTest.create({
        data: { title: testTitle, description: `Bộ đề luyện tập ${testTitle}`, isPublished: true }
      });
    }

    // Map for parts (3 and 4)
    const partsMap: Record<number, any> = {};

    for (const row of testRows) {
      const pNum = parseInt(row.Part);
      if (!partsMap[pNum]) {
        partsMap[pNum] = await prisma.toeicPart.create({
          data: { testId: toeicTest.id, partNumber: pNum, title: `Part ${pNum}` }
        });
      }

      process.stdout.write(`  Range ${row.QuestionRange}... `);
      
      const audioPath = audioFileMap[row.AudioID];
      const audioUrl = audioPath ? await uploadToSupabase(audioPath, 'audio/mpeg', `${row.AudioID}.mp3`) : null;
      
      const picPath = picFileMap[row.PicID];
      const imageUrl = picPath ? await uploadToSupabase(picPath, 'image/png', `${row.PicID}${path.extname(picPath)}`) : null;

      let json: any = {};
      try {
          json = JSON.parse(row.Json);
      } catch (e) {
          console.error(`\n[ERROR] Invalid JSON for ${row.QuestionRange}`);
          continue;
      }

      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: partsMap[pNum].id,
          audioUrl: audioUrl || "",
          imageUrl: imageUrl || "",
          transcript: json.html_content || "",
          metadata: {
            Book: row.Book,
            Test: row.Test,
            Part: row.Part,
            QuestionRange: row.QuestionRange,
            translation_map: json.translation_map
          }
        }
      });

      for (const q of json.questions) {
        await prisma.toeicQuestion.create({
          data: {
            groupId: group.id,
            questionNo: q.questionNo,
            questionText: q.text || "",
            optionA: q.options?.A || "",
            optionB: q.options?.B || "",
            optionC: q.options?.C || "",
            optionD: q.options?.D || "",
            correctAnswer: q.correct || "A",
            explanation: JSON.stringify(q.explanation || {}),
            metadata: {
                evidence_sids: q.evidence_sids || [],
                explanation_vn: q.explanation || {}
            }
          }
        });
      }
      process.stdout.write(`Done\n`);
    }
  }

  console.log("\nReseeding Script Finished successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
