
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_PATH = "/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4";
const EXCEL_FILE = path.join(BASE_PATH, "Part34_2020-2022-2023-22024-2026Json.xlsx");
const BUCKET_NAME = "lessons";
const REMOTE_FOLDER = "toeic_part3_4";

// Simple CUID-like generator
function generateId() {
  return "cm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function main() {
  console.log("🚀 Starting Re-import Process for Part 3/4...");

  // 1. Identify Part IDs
  const { data: parts, error: partError } = await supabase
    .from("ToeicPart")
    .select("id, title, partNumber")
    .or("title.ilike.Part 3%,title.ilike.Part 4%");

  if (partError) {
    console.error("❌ Error fetching Part IDs:", partError);
    return;
  }

  const partIds = parts.map(p => p.id);
  console.log(`📌 Found ${partIds.length} Part entries for Part 3 & 4.`);

  // 2. Wipe Storage
  console.log(`🧹 Wiping Storage folder: ${REMOTE_FOLDER}...`);
  await wipeStorageFolder(REMOTE_FOLDER);

  // 3. Wipe Database Records
  console.log("🧹 Wiping Database records for Part 3 & 4...");
  // Get all group IDs for those parts
  const { data: groupsToDel } = await supabase.from("ToeicQuestionGroup").select("id").in("partId", partIds);
  const groupIds = groupsToDel?.map(g => g.id) || [];

  if (groupIds.length > 0) {
    const { error: delQError } = await supabase
      .from("ToeicQuestion")
      .delete()
      .in("groupId", groupIds);
    if (delQError) console.warn("⚠️ Warning during Question wipe:", delQError.message);

    const { error: delGError } = await supabase
      .from("ToeicQuestionGroup")
      .delete()
      .in("partId", partIds);
    if (delGError) console.warn("⚠️ Warning during Group wipe:", delGError.message);
  }

  // 4. Process Excel
  console.log("📖 Reading Excel file...");
  const workbook = xlsx.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  console.log(`📊 Total rows to process: ${rows.length}`);

  for (const row of rows) {
    const { Book, Test, Part, AudioID, QuestionRange, Json } = row;
    if (!Json) continue;

    const richJson = JSON.parse(Json);
    console.log(`📦 Processing Group: ${AudioID} (${QuestionRange})`);

    const partEntry = await findPartId(Book, Test, Part);
    if (!partEntry) {
      console.error(`❌ Could not find Part ID for Book: ${Book}, Test: ${Test}, Part: ${Part}`);
      continue;
    }

    // A. Upload Audio
    const audioLocalPath = path.join(BASE_PATH, "Audio", `${Book}_PART34`, `${AudioID}.mp3`);
    let audioUrl = "";
    if (fs.existsSync(audioLocalPath)) {
      audioUrl = await uploadFile(audioLocalPath, `${REMOTE_FOLDER}/Audio/${Book}_PART34/${AudioID}.mp3`);
    }

    // B. Upload Picture
    const picLocalPath = path.join(BASE_PATH, "Picture", Book, `${AudioID}.jpg`);
    let imageUrl = "";
    if (fs.existsSync(picLocalPath)) {
      imageUrl = await uploadFile(picLocalPath, `${REMOTE_FOLDER}/Picture/${Book}/${AudioID}.jpg`);
    }

    // C. Create QuestionGroup
    const groupId = generateId();
    const now = new Date().toISOString();
    const { data: group, error: groupError } = await supabase
      .from("ToeicQuestionGroup")
      .insert({
        id: groupId,
        partId: partEntry.id,
        audioUrl,
        imageUrl,
        transcript: richJson.passages?.[0]?.html_content || "",
        metadata: {
          Book,
          Test,
          Part,
          QuestionRange,
          Json: richJson 
        },
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (groupError) {
      console.error(`❌ Error creating Group ${AudioID}:`, groupError);
      continue;
    }

    // D. Create Questions
    if (richJson.questions && Array.isArray(richJson.questions)) {
      const questionInserts = richJson.questions.map((q, idx) => {
        const qNo = parseInt(QuestionRange.split("-")[0]) + idx;
        return {
          id: generateId(),
          groupId: groupId,
          questionNo: qNo,
          questionText: q.question,
          optionA: q.options.A,
          optionB: q.options.B,
          optionC: q.options.C,
          optionD: q.options.D,
          correctAnswer: q.correct,
          explanation: q.explanation,
          createdAt: now,
          updatedAt: now
        };
      });

      const { error: qError } = await supabase
        .from("ToeicQuestion")
        .insert(questionInserts);

      if (qError) console.error(`❌ Error creating questions for ${AudioID}:`, qError);
    }
  }

  console.log("✅ Re-import completed successfully!");
}

async function wipeStorageFolder(folderPath) {
  const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list(folderPath, { limit: 1000 });
  if (error || !files || files.length === 0) return;

  const filesToDelete = [];
  for (const file of files) {
    const fullPath = `${folderPath}/${file.name}`;
    if (file.id === null) { // Folder
      await wipeStorageFolder(fullPath);
    } else {
      filesToDelete.push(fullPath);
    }
  }

  if (filesToDelete.length > 0) {
    console.log(`🗑️ Deleting ${filesToDelete.length} files in ${folderPath}...`);
    await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
  }
}

async function uploadFile(localPath, remotePath) {
  const fileBuffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(remotePath, fileBuffer, { upsert: true, contentType: remotePath.endsWith(".mp3") ? "audio/mpeg" : "image/jpeg" });

  if (error) {
    console.error(`❌ Upload failed: ${remotePath}`, error);
    return "";
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(remotePath);
  return data.publicUrl;
}

async function findPartId(book, test, partNum) {
  // 1. Find Test
  // Test title could be "ETS 2020 - Test 1" or similar
  const { data: tests } = await supabase
    .from("ToeicTest")
    .select("id, title")
    .ilike("title", `%${book}%`)
    .ilike("title", `%Test ${parseInt(test)}%`);

  if (!tests || tests.length === 0) return null;

  // 2. Find Part within those tests
  const { data: parts } = await supabase
    .from("ToeicPart")
    .select("id, title")
    .in("testId", tests.map(t => t.id))
    .eq("partNumber", parseInt(partNum));

  return parts && parts.length > 0 ? parts[0] : null;
}

main();
