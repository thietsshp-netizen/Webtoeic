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

const FOLDER_PATH = path.join(process.cwd(), 'Part 2');
const AUDIO_FOLDER_PATH = path.join(FOLDER_PATH, 'Audio_Part2');
const EXCEL_PATH = path.join(FOLDER_PATH, 'Part2.xlsx');
const BUCKET_NAME = 'lessons';

async function uploadToSupabase(filePath: string, contentType: string, fileName: string): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARNING] File not found: ${filePath}`);
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const destPath = `toeic_part2/${Date.now()}_${fileName}`;
  
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

function parsePart2Options(text: string) {
  let question = "";
  let A = "", B = "", C = "";
  if (!text) return { question, A, B, C };
  
  // Split by labels (A), (B), (C)
  const parts = text.split(/(?=\([ABC]\))/);
  
  question = parts[0]?.trim() || "";
  
  for (const p of parts) {
    const clean = p.trim();
    if (clean.startsWith('(A)')) A = clean.replace('(A)', '').trim();
    if (clean.startsWith('(B)')) B = clean.replace('(B)', '').trim();
    if (clean.startsWith('(C)')) C = clean.replace('(C)', '').trim();
  }
  
  return { question, A, B, C };
}

// Cache files in audio folder for matching
let audioFilesCache: string[] = [];
function getAudioFiles() {
    if (audioFilesCache.length > 0) return audioFilesCache;
    if (fs.existsSync(AUDIO_FOLDER_PATH)) {
        audioFilesCache = fs.readdirSync(AUDIO_FOLDER_PATH);
    }
    return audioFilesCache;
}

function normalize(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findBestAudioMatch(audioId: string): string | null {
    if (!audioId) return null;
    
    // 1. Try direct mapping with logic
    // Excel: "01- Choice_Preference_ETS2024_Test 01_13"
    // Disk:  "01- Choice_Preference_01_13.mp3"
    const simplified = audioId.replace(/\s*_ETS2024_Test\s*/i, '_').replace(/\s+/g, '_');
    const directMatch = simplified + '.mp3';
    
    const diskFiles = getAudioFiles();
    if (diskFiles.includes(directMatch)) return directMatch;
    
    // 2. Fuzzy match
    const normTarget = normalize(simplified);
    const fuzzy = diskFiles.find(f => normalize(f.replace('.mp3', '')) === normTarget);
    if (fuzzy) return fuzzy;
    
    return null;
}

async function seedTests(groupedData: Record<string, any[]>, prefix: string) {
  for (const [key, rows] of Object.entries(groupedData)) {
    const testTitle = `Part 2 - ${prefix} ${key}`;
    console.log(`\n--- Processing: ${testTitle} (${rows.length} questions) ---`);
    
    let toeicTest = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
    if (!toeicTest) {
      toeicTest = await prisma.toeicTest.create({
        data: {
          title: testTitle,
          description: `Bộ luyện tập Part 2 - ${prefix} ${key}`,
          isPublished: true,
        }
      });
      console.log(`Created ToeicTest: ${toeicTest.id}`);
    }

    const existingPart = await prisma.toeicPart.findFirst({
        where: { testId: toeicTest.id, partNumber: 2 }
    });

    if (existingPart) {
        console.log(`Clearing existing Part 2 data for Test: ${testTitle}`);
        await prisma.toeicPart.delete({ where: { id: existingPart.id } });
    }

    const toeicPart = await prisma.toeicPart.create({
      data: {
        testId: toeicTest.id,
        partNumber: 2,
        title: "Part 2: Question-Response"
      }
    });

    for (const row of rows) {
      const qNo = row.Id;
      console.log(`Processing Question ${qNo}...`);
      
      const audioFileName = findBestAudioMatch(row.AudioID);
      let audioUrl = null;
      
      if (audioFileName) {
        const audioPath = path.join(AUDIO_FOLDER_PATH, audioFileName);
        audioUrl = await uploadToSupabase(audioPath, 'audio/mpeg', audioFileName);
      } else {
        console.error(`[CRITICAL] Audio NOT FOUND for AudioID: ${row.AudioID}`);
      }

      const parsed = parsePart2Options(row.EngText);
      
      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: toeicPart.id,
          audioUrl: audioUrl || "",
          transcript: row.EngText || "", 
        }
      });

      const explanationJson = JSON.stringify({
        engText: row.EngText || "",
        vietText: row.VietText || ""
      });

      await prisma.toeicQuestion.create({
        data: {
          groupId: group.id,
          questionNo: parseInt(qNo) || 0,
          questionText: parsed.question,
          optionA: parsed.A || "Option A",
          optionB: parsed.B || "Option B",
          optionC: parsed.C || "Option C",
          correctAnswer: row.Answer?.trim().toUpperCase() || "A",
          explanation: explanationJson
        }
      });
      console.log(`Added Question ${qNo} to DB.`);
    }
  }
}

async function main() {
  console.log("Starting Part 2 Seeding Process...");
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
  // Grouping 2: By QuesType
  const groupedByType: Record<string, any[]> = {};

  for (const row of rows) {
    const day = row.Day || "Unassigned";
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(row);

    const type = row.QuesType || "General";
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
