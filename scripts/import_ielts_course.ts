import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelPath = '/Volumes/MacOS Sandisk - Data/Users/thietphamvan/hoctoeic/IELTS/Ielts reading - json.xlsx';

const generateCuid = () => {
  return 'c' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Hàm parse JSON thông minh tự động cắt bỏ ký tự dư thừa ở cuối dựa trên báo lỗi của V8
const smartJsonParse = (str: string): any => {
  let currentStr = str.trim();
  
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return JSON.parse(currentStr);
    } catch (e: any) {
      const msg = e.message;
      const posMatch = msg.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1], 10);
        if (pos > 0 && pos < currentStr.length) {
          currentStr = currentStr.substring(0, pos).trim();
          continue;
        }
      }
      throw e;
    }
  }
  return JSON.parse(currentStr);
};

const cleanJsonStr = (str: string): string => {
  const startBrace = str.indexOf('{');
  const startBracket = str.indexOf('[');
  let start = -1;
  if (startBrace !== -1 && startBracket !== -1) {
    start = Math.min(startBrace, startBracket);
  } else if (startBrace !== -1) {
    start = startBrace;
  } else if (startBracket !== -1) {
    start = startBracket;
  }
  
  if (start === -1) return str;
  
  const endBrace = str.lastIndexOf('}');
  const endBracket = str.lastIndexOf(']');
  const end = Math.max(endBrace, endBracket);
  
  if (end === -1 || end < start) return str;
  
  return str.substring(start, end + 1);
};

async function main() {
  console.log("Checking if excel file exists...");
  if (!fs.existsSync(excelPath)) {
    console.error("Excel file NOT found at:", excelPath);
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL Database directly using pg Pool...");
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 2
  });

  console.log("Reading excel file...");
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert sheet to JSON rows
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  console.log(`Successfully read ${rows.length} rows from excel.`);

  // Group passages by TEST ID
  const testsGroup: Record<number, Record<number, any>> = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;

    const testIdRaw = row[0];
    const passageNumRaw = row[1];
    const colDVal = row[3]; // JSON column

    if (testIdRaw === undefined || passageNumRaw === undefined || !colDVal) continue;

    const testId = parseInt(testIdRaw, 10);
    const passageNum = parseInt(passageNumRaw, 10);

    if (isNaN(testId) || isNaN(passageNum)) continue;

    const cleanStr = cleanJsonStr(String(colDVal).trim());

    try {
      const parsedJson = smartJsonParse(cleanStr);
      
      if (!testsGroup[testId]) {
        testsGroup[testId] = {};
      }
      
      testsGroup[testId][passageNum] = parsedJson;
    } catch (e: any) {
      console.error(`❌ Error parsing JSON at Row ${i + 1} (Test ${testIdRaw}, Passage ${passageNumRaw}):`, e.message);
    }
  }

  const sortedTestIds = Object.keys(testsGroup).map(Number).sort((a, b) => a - b);
  console.log(`Found ${sortedTestIds.length} successfully parsed IELTS Reading Tests:`, sortedTestIds);

  if (sortedTestIds.length === 0) {
    console.error("No valid IELTS Reading Tests grouped. Exiting.");
    await pool.end();
    return;
  }

  // 1. Kiểm tra hoặc Tạo Course "IELTS READING"
  let courseId = "";
  const courseRes = await pool.query('SELECT id FROM "Course" WHERE LOWER(title) = $1 LIMIT 1', ['ielts reading']);
  
  if (courseRes.rows.length > 0) {
    courseId = courseRes.rows[0].id;
    console.log("Found existing Course 'IELTS READING' with ID:", courseId);
  } else {
    courseId = generateCuid();
    console.log("Creating new Course 'IELTS READING' with ID:", courseId);
    await pool.query(
      'INSERT INTO "Course" (id, title, description, "isPublic", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
      [courseId, "IELTS READING", "Khoá học luyện tập IELTS Reading toàn diện với bộ 3 bài đọc chuẩn thi máy tính.", true]
    );
    console.log("Course created successfully.");
  }

  // 1.5. Kiểm tra hoặc Tạo Book "IELTS Reading" (Yêu cầu bắt buộc để LearnSidebar hiển thị bài học)
  let bookId = "";
  const bookRes = await pool.query(
    'SELECT id FROM "Book" WHERE "courseId" = $1 AND LOWER(title) = $2 LIMIT 1',
    [courseId, 'ielts reading']
  );

  if (bookRes.rows.length > 0) {
    bookId = bookRes.rows[0].id;
    console.log("Found existing Book 'IELTS Reading' with ID:", bookId);
  } else {
    bookId = generateCuid();
    console.log("Creating new Book 'IELTS Reading' with ID:", bookId);
    await pool.query(
      'INSERT INTO "Book" (id, "courseId", title, "order", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
      [bookId, courseId, "IELTS Reading", 1]
    );
    console.log("Book created successfully.");
  }

  // 2. Kiểm tra hoặc Tạo Section "IELTS Reading Tests"
  let sectionId = "";
  const sectionRes = await pool.query(
    'SELECT id FROM "Section" WHERE "courseId" = $1 AND "bookId" = $2 AND LOWER(title) = $3 LIMIT 1', 
    [courseId, bookId, 'ielts reading tests']
  );

  if (sectionRes.rows.length > 0) {
    sectionId = sectionRes.rows[0].id;
    console.log("Found existing Section 'IELTS Reading Tests' with ID:", sectionId);
  } else {
    // Nếu có section cũ nhưng chưa liên kết bookId, chúng ta cập nhật bookId cho nó
    const oldSectionRes = await pool.query(
      'SELECT id FROM "Section" WHERE "courseId" = $1 AND LOWER(title) = $2 LIMIT 1',
      [courseId, 'ielts reading tests']
    );

    if (oldSectionRes.rows.length > 0) {
      sectionId = oldSectionRes.rows[0].id;
      console.log("Found old Section without Book connection. Connecting Section ID:", sectionId, "to Book ID:", bookId);
      await pool.query(
        'UPDATE "Section" SET "bookId" = $1, "updatedAt" = NOW() WHERE id = $2',
        [bookId, sectionId]
      );
    } else {
      sectionId = generateCuid();
      console.log("Creating Section 'IELTS Reading Tests' with ID:", sectionId);
      await pool.query(
        'INSERT INTO "Section" (id, "courseId", title, "order", "bookId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [sectionId, courseId, "IELTS Reading Tests", 1, bookId]
      );
      console.log("Section created successfully.");
    }
  }

  // 3. Import từng đề (Lesson)
  console.log("\nStarting import of lessons in order...");

  for (let idx = 0; idx < sortedTestIds.length; idx++) {
    const testId = sortedTestIds[idx];
    const passageMap = testsGroup[testId];
    
    // Gom bộ 3 passages thành 1 mảng và sắp xếp theo passage_number
    const sortedPassages = Object.keys(passageMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map(pNum => passageMap[pNum]);

    if (sortedPassages.length === 0) continue;

    // Trích xuất tiêu đề bài thi
    const firstPassage = sortedPassages[0];
    const testTitle = firstPassage.test_title || `IELTS Reading Test ${testId}`;
    const lessonTitle = `${testTitle}`;

    // Tạo mảng content JSON để lưu vào DB
    const contentStr = JSON.stringify(sortedPassages, null, 2);

    // Kiểm tra xem Lesson này đã có trong Section chưa
    const lessonRes = await pool.query(
      'SELECT id FROM "Lesson" WHERE "sectionId" = $1 AND title = $2 LIMIT 1',
      [sectionId, lessonTitle]
    );

    if (lessonRes.rows.length === 0) {
      const lessonId = generateCuid();
      console.log(`[NEW] Creating Lesson: "${lessonTitle}" (Order: ${testId}, ID: ${lessonId})...`);
      await pool.query(
        'INSERT INTO "Lesson" (id, "sectionId", title, "contentType", content, "order", "isPreview", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
        [lessonId, sectionId, lessonTitle, "IELTS_READING", contentStr, testId, false]
      );
      console.log(`      Created success.`);
    } else {
      const existingLessonId = lessonRes.rows[0].id;
      console.log(`[UPDATE] Updating existing Lesson content: "${lessonTitle}" (Order: ${testId}, ID: ${existingLessonId})...`);
      await pool.query(
        'UPDATE "Lesson" SET content = $1, "contentType" = $2, "order" = $3, "updatedAt" = NOW() WHERE id = $4',
        [contentStr, "IELTS_READING", testId, existingLessonId]
      );
      console.log(`         Updated success.`);
    }
  }

  console.log("\n==========================================");
  console.log("IELTS Reading Course Import Completed Successfully!");
  console.log("==========================================");
  
  await pool.end();
}

main().catch((e) => {
  console.error("Global Error in import script:", e);
  process.exit(1);
});
