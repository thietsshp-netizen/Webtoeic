import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const FOLDER_PATH = path.join(process.cwd(), 'Part 1');
    const EXCEL_PATH = path.join(FOLDER_PATH, 'Part 1.xlsx');

    if (!fs.existsSync(EXCEL_PATH)) {
      return NextResponse.json({ error: "Excel file not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(EXCEL_PATH);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Group by Day
    const groupedByDay: Record<string, any[]> = {};
    for (const row of rows) {
      const day = row.Day || 1;
      if (!groupedByDay[day]) groupedByDay[day] = [];
      groupedByDay[day].push(row);
    }

    let logs = [];

    for (const [day, dayRows] of Object.entries(groupedByDay)) {
      const testTitle = `Luyện tập Part 1 - Day ${day}`;
      logs.push(`Processing Day ${day}...`);

      let toeicTest = await db.toeicTest.findFirst({ where: { title: testTitle } });
      if (!toeicTest) {
        toeicTest = await db.toeicTest.create({
          data: {
            title: testTitle,
            description: `Bộ luyện tập phần Photographs cho Ngày ${day}`,
            isPublished: true,
          }
        });
      }

      let toeicPart = await db.toeicPart.findFirst({ where: { testId: toeicTest.id, partNumber: 1 } });
      if (!toeicPart) {
        toeicPart = await db.toeicPart.create({
          data: {
            testId: toeicTest.id,
            partNumber: 1,
            title: "Part 1: Photographs"
          }
        });
      }

      // Check if questions already seeded to avoid duplicates during dev
      const existingQGroup = await db.toeicQuestionGroup.findFirst({ where: { partId: toeicPart.id } });

      if (existingQGroup && force) {
        logs.push(`Day ${day} already seeded. FORCE flag is true, clearing old data...`);
        await db.toeicTest.delete({ where: { id: toeicTest.id } });

        // Re-create after deletion
        toeicTest = await db.toeicTest.create({
          data: {
            title: testTitle,
            description: `Bộ luyện tập phần Photographs cho Ngày ${day}`,
            isPublished: true,
          }
        });
        toeicPart = await db.toeicPart.create({
          data: {
            testId: toeicTest.id,
            partNumber: 1,
            title: "Part 1: Photographs"
          }
        });
      } else if (existingQGroup && !force) {
        logs.push(`Day ${day} already seeded. Skipping. (use ?force=true to overwrite)`);
        continue;
      }

      for (const row of dayRows) {
        const qNo = row.Id;

        const audioPath = path.join(FOLDER_PATH, 'Part 1_audio', `${row.AudioID}.mp3`);
        const imgPathExt1 = path.join(FOLDER_PATH, 'Par 1_picture', `${row.PicID}.jpg`);
        const imgPathExt2 = path.join(FOLDER_PATH, 'Par 1_picture', `${row.PicID}.JPG`);
        const imgPathExt3 = path.join(FOLDER_PATH, 'Par 1_picture', `${row.PicID}.png`);
        const imgPath = fs.existsSync(imgPathExt1) ? imgPathExt1 : (fs.existsSync(imgPathExt2) ? imgPathExt2 : imgPathExt3);

        const audioUrl = await uploadToSupabase(audioPath, 'audio/mpeg', `${row.AudioID}.mp3`);
        const imgUrl = await uploadToSupabase(imgPath, 'image/jpeg', `${row.PicID}.jpg`);

        const group = await db.toeicQuestionGroup.create({
          data: {
            partId: toeicPart.id,
            audioUrl: audioUrl || "",
            imageUrl: imgUrl || "",
            transcript: row.EngText || "",
            metadata: {
              PicType: row.PicType || "",
              Book: row.Book || `Book ${day}`,
              Test: row.Test || "Test 1",
              Part: row.Part || "1"
            }
          }
        });

        const engOpts = parseOptions(row.EngText);
        const explanationJson = JSON.stringify({
          vietText: row.VietText || ""
        });

        await db.toeicQuestion.create({
          data: {
            groupId: group.id,
            questionNo: parseInt(row.QuestionNo || row.Id || "0"),
            optionA: engOpts.A || "Option A",
            optionB: engOpts.B || "Option B",
            optionC: engOpts.C || "Option C",
            optionD: engOpts.D || "Option D",
            correctAnswer: (row.Answer || "A").toString().trim().toUpperCase(),
            explanation: explanationJson
          }
        });
      }
      logs.push(`Day ${day} seeded completely.`);
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
