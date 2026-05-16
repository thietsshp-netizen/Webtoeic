
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXCEL_PATH = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 1/Part 1.xlsx';
const PIC_DIR = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 1/Par 1_picture';
const AUDIO_DIR = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 1/Part 1_audio';
const BUCKET = 'lessons';
const STORAGE_PATH = 'toeic_part1';

function parseOptions(text: string) {
  if (!text) return ["", "", "", ""];
  const matches = [...text.matchAll(/\((A|B|C|D)\)\s*([\s\S]*?)(?=\s*\((A|B|C|D)\)|$)/g)];
  const options: Record<string, string> = { A: "", B: "", C: "", D: "" };
  matches.forEach(m => {
    options[m[1]] = m[2].trim();
  });
  return [options.A, options.B, options.C, options.D];
}

async function run() {
  console.log("Starting Part 1 Import...");
  
  const workbook = XLSX.readFile(EXCEL_PATH);
  const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  console.log(`Loaded ${data.length} rows from Excel.`);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const { Book, Test, Part, QuestionNo, AudioID, PicID, EngText, VietText, Answer, PicType } = row;
    
    console.log(`[${i+1}/${data.length}] Processing ${Book} Test ${Test} Q${QuestionNo}...`);

    try {
      // 1. Handle Files
      let imageUrl = "";
      let audioUrl = "";

      // Image
      const picExts = ['.jpeg', '.jpg', '.png'];
      let picFile = "";
      for (const ext of picExts) {
        const p = path.join(PIC_DIR, `${PicID}${ext}`);
        if (fs.existsSync(p)) { picFile = p; break; }
      }

      if (picFile) {
        const fileData = fs.readFileSync(picFile);
        const fileName = path.basename(picFile);
        const uploadPath = `${STORAGE_PATH}/${fileName}`;
        const { data: upData, error: upErr } = await supabase.storage.from(BUCKET).upload(uploadPath, fileData, { upsert: true });
        if (upErr) throw upErr;
        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${uploadPath}`;
      }

      // Audio
      const audioFile = path.join(AUDIO_DIR, `${AudioID}.mp3`);
      if (fs.existsSync(audioFile)) {
        const fileData = fs.readFileSync(audioFile);
        const fileName = path.basename(audioFile);
        const uploadPath = `${STORAGE_PATH}/${fileName}`;
        const { data: upData, error: upErr } = await supabase.storage.from(BUCKET).upload(uploadPath, fileData, { upsert: true });
        if (upErr) throw upErr;
        audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${uploadPath}`;
      }

      // 2. Database
      // Find or Create ToeicTest
      const testTitle = `${Book} - Test ${Test}`;
      let testRes = await pool.query('SELECT id FROM "ToeicTest" WHERE title = $1', [testTitle]);
      let testId = testRes.rows[0]?.id;
      if (!testId) {
        testRes = await pool.query('INSERT INTO "ToeicTest" (id, title, "isPublished", "updatedAt") VALUES ($1, $2, true, NOW()) RETURNING id', [
          `test_${Book}_${Test}`.toLowerCase().replace(/\s+/g, '_'),
          testTitle
        ]);
        testId = testRes.rows[0].id;
      }

      // Find or Create ToeicPart
      let partRes = await pool.query('SELECT id FROM "ToeicPart" WHERE "testId" = $1 AND "partNumber" = 1', [testId]);
      let partId = partRes.rows[0]?.id;
      if (!partId) {
        partRes = await pool.query('INSERT INTO "ToeicPart" (id, "testId", "partNumber", "updatedAt") VALUES ($1, $2, 1, NOW()) RETURNING id', [
          `part1_${testId}`,
          testId
        ]);
        partId = partRes.rows[0].id;
      }

      // Create Group
      const groupMetadata = { Book, Test, PicType };
      const groupRes = await pool.query(
        'INSERT INTO "ToeicQuestionGroup" (id, "partId", "audioUrl", "imageUrl", metadata, "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
        [`group_${PicID}_${Date.now()}`, partId, audioUrl, imageUrl, JSON.stringify(groupMetadata)]
      );
      const groupId = groupRes.rows[0].id;

      // Create Question
      const [optA, optB, optC, optD] = parseOptions(EngText);
      const [vA, vB, vC, vD] = parseOptions(VietText);
      const qMetadata = { 
        translation: { A: vA, B: vB, C: vC, D: vD },
        type: PicType
      };

      await pool.query(
        'INSERT INTO "ToeicQuestion" (id, "groupId", "questionNo", "optionA", "optionB", "optionC", "optionD", "correctAnswer", metadata, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())',
        [
          `q_${PicID}_${QuestionNo}_${Date.now()}`, 
          groupId, 
          QuestionNo, 
          optA || "", 
          optB || "", 
          optC || "", 
          optD || "", 
          Answer.trim().toUpperCase(), 
          JSON.stringify(qMetadata)
        ]
      );

    } catch (err) {
      console.error(`Error processing row ${i+1}:`, err);
    }
  }

  console.log("Import completed!");
  await pool.end();
}

run();
