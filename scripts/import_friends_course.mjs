import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// DRY_RUN = true will only scan files, parse, and check DB without writing anything.
// DRY_RUN = false will actually write to DB.
const DRY_RUN = false;

const COURSE_ID = "cmr7cn15r000098he1wz4diuc"; // LUYỆN NGHE-NÓI QUA VIDEO
const BOOK_ID = "cmr7cri8b000198he0i1yucb8";   // The Friends
const BASE_DIR = "/Volumes/MacOS Sandisk - Data/Users/thietphamvan/hoctoeic/Friends.Complete.Series.720p.BluRay.2CH.x265.HEVC-PSA";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to convert time format (e.g. 0:00:52.97) to seconds
function timeToSeconds(timeStr) {
  const parts = timeStr.split(':');
  if (parts.length < 3) return 0;
  const hours = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

// Parse ASS subtitle file into clean Subtitle[] array
function parseAss(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const subtitles = [];

  for (const line of lines) {
    if (!line.startsWith('Dialogue:')) continue;

    // Find the 9th comma
    let commaCount = 0;
    let textStartIndex = -1;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === ',') {
        commaCount++;
        if (commaCount === 9) {
          textStartIndex = i + 1;
          break;
        }
      }
    }

    if (textStartIndex === -1) continue;

    const metadata = line.substring(0, textStartIndex - 1);
    const textPart = line.substring(textStartIndex);

    const metaParts = metadata.split(',');
    if (metaParts.length < 3) continue;

    const startStr = metaParts[1].trim();
    const endStr = metaParts[2].trim();

    const startSec = timeToSeconds(startStr);
    const endSec = timeToSeconds(endStr);

    // Split text by \N or \n
    const textLines = textPart.split(/\\N|\\n|\\h/i);

    const englishParts = [];
    const vietnameseParts = [];
    const noteParts = [];

    for (const textLine of textLines) {
      const trimmedTextLine = textLine.trim();
      if (!trimmedTextLine) continue;

      const cleanTextLine = trimmedTextLine.replace(/\{[^}]*\}/g, '').trim();
      if (!cleanTextLine) continue;

      const isNote = textLine.includes('c&H888888') || 
                     cleanTextLine.toLowerCase().startsWith('note:') || 
                     cleanTextLine.toLowerCase().startsWith('(note:');

      const isVietnamese = textLine.includes('c&H00FFFF') || 
                           /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(cleanTextLine);

      if (isNote) {
        let cleanNote = cleanTextLine;
        if (cleanNote.startsWith('(') && cleanNote.endsWith(')')) {
          cleanNote = cleanNote.substring(1, cleanNote.length - 1).trim();
        }
        noteParts.push(cleanNote);
      } else if (isVietnamese) {
        vietnameseParts.push(cleanTextLine);
      } else {
        englishParts.push(cleanTextLine);
      }
    }

    subtitles.push({
      start: parseFloat(startSec.toFixed(2)),
      end: parseFloat(endSec.toFixed(2)),
      text: englishParts.join(' '),
      ipa: "",
      vietnamese: vietnameseParts.join(' '),
      note: noteParts.join('\n')
    });
  }

  return subtitles;
}

// Convert video filename to clean lesson title
// E.g. Friends.S02E04.The.One.with.Phoebe's.Husband.720p.BluRay.2CH.x265.HEVC-PSA.mp4
//   => S02E04 - The One with Phoebe's Husband
function getConciseLessonTitle(filename) {
  // Regex to match prefix Friends.SxxExx and capture Title part
  const match = filename.match(/^Friends\.(S\d{2}E\d{2}(?:-E?\d{2}|-\d{2})?)\.(.*?)\.720p/i);
  if (match) {
    const seasonEp = match[1].toUpperCase();
    const rawTitle = match[2];
    const cleanTitle = rawTitle.replace(/\./g, ' ');
    return `${seasonEp} - ${cleanTitle}`;
  }
  // Fallback if regex fails
  return filename.replace('.mp4', '').replace(/\./g, ' ');
}

// Parse episode number
// E.g. S02E04 => 4
// E.g. S10E17-18 => "17-18"
function parseEpisodeNumber(filename) {
  const match = filename.match(/S\d{2}E(\d{2}(?:-E?\d{2}|-\d{2})?)/i);
  if (match) {
    const epStr = match[1].toUpperCase();
    // If it's a range like 17-18 or 17-E18, clean it
    if (epStr.includes('-')) {
      return epStr.replace('E', '').split('-').map(x => parseInt(x, 10)).join('-');
    }
    return String(parseInt(epStr, 10));
  }
  return "0";
}

async function run() {
  try {
    if (!fs.existsSync(BASE_DIR)) {
      console.error(`Error: Base directory '${BASE_DIR}' does not exist.`);
      return;
    }

    console.log("============================================================");
    console.log(`FRIENDS LESSONS IMPORT SCRIPT - DRY_RUN = ${DRY_RUN}`);
    console.log("============================================================");

    // BƯỚC 0: TỰ ĐỘNG SAO LƯU (BACKUP)
    console.log(">> Bước 0: Đang thực hiện sao lưu (Backup) Section và Lesson hiện tại...");
    const currentSections = await prisma.section.findMany({
      where: { courseId: COURSE_ID }
    });
    const currentLessons = await prisma.lesson.findMany({
      where: { section: { courseId: COURSE_ID } }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'scripts');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, `backup_friends_db_${timestamp}.json`);
    
    fs.writeFileSync(backupPath, JSON.stringify({ sections: currentSections, lessons: currentLessons }, null, 2));
    console.log(`✅ Đã lưu file backup tại: ${backupPath}`);
    console.log(`  (Sao lưu ${currentSections.length} Sections và ${currentLessons.length} Lessons)`);
    console.log("------------------------------------------------------------");

    // Scan directories S01 to S10
    const seasonDirs = [];
    for (let i = 1; i <= 10; i++) {
      const dirName = `S${String(i).padStart(2, '0')}`;
      const fullPath = path.join(BASE_DIR, dirName);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        seasonDirs.push({ seasonNum: i, dirPath: fullPath, dirName });
      }
    }

    for (const { seasonNum, dirPath, dirName } of seasonDirs) {
      console.log(`\n📂 Đang xử lý Season ${seasonNum} (${dirName})...`);

      // 1. Quản lý Section cho Season
      let sectionTitle = `Season ${seasonNum}`;
      if (seasonNum === 1) sectionTitle = "SEASON 1"; // Match existing SEASON 1
      
      let section = await prisma.section.findFirst({
        where: {
          courseId: COURSE_ID,
          bookId: BOOK_ID,
          title: sectionTitle
        }
      });

      if (!section) {
        const orderValue = seasonNum + 1; // Season 3 -> 4, Season 4 -> 5, ...
        if (DRY_RUN) {
          console.log(`[DRY RUN] Sẽ tạo Section mới: "${sectionTitle}" (Order: ${orderValue})`);
          section = { id: `MOCK_SECTION_ID_S${seasonNum}`, title: sectionTitle };
        } else {
          section = await prisma.section.create({
            data: {
              courseId: COURSE_ID,
              bookId: BOOK_ID,
              title: sectionTitle,
              order: orderValue
            }
          });
          console.log(`✅ Đã tạo Section mới: "${sectionTitle}" (ID: ${section.id})`);
        }
      } else {
        console.log(`ℹ️ Đã có sẵn Section: "${sectionTitle}" (ID: ${section.id})`);
      }

      // 2. Quét các file video và phụ đề trong folder
      const files = fs.readdirSync(dirPath);
      const mp4Files = files.filter(f => f.toLowerCase().endsWith('.mp4')).sort();

      let orderIdx = 0;
      for (const videoFile of mp4Files) {
        const videoFilePath = path.join(dirPath, videoFile);
        const baseName = videoFile.slice(0, -4);
        const assFile = baseName + '.ass';
        const assFilePath = path.join(dirPath, assFile);

        if (!fs.existsSync(assFilePath)) {
          console.warn(`⚠️ Cảnh báo: Không tìm thấy file phụ đề .ass cho ${videoFile}. Bỏ qua.`);
          continue;
        }

        // Tên bài học
        const lessonTitle = getConciseLessonTitle(videoFile);
        const epNumStr = parseEpisodeNumber(videoFile);
        const epPrefix = `${dirName}E${String(epNumStr).padStart(2, '0')}`;

        // Kiểm tra trùng lặp
        let isDuplicate = false;
        if (section.id && !section.id.startsWith('MOCK_SECTION')) {
          const existingLesson = await prisma.lesson.findFirst({
            where: {
              sectionId: section.id,
              OR: [
                { title: epNumStr },
                { title: { startsWith: epPrefix } },
                { title: lessonTitle },
                { videoUrl: { contains: epPrefix } }
              ]
            }
          });
          if (existingLesson) {
            isDuplicate = true;
          }
        } else {
          // In dry-run, if mock section, check if matched against existing lessons
          const existingMock = currentLessons.find(l => 
            l.sectionId === section.id || 
            l.title === epNumStr || 
            l.title.startsWith(epPrefix) || 
            (l.videoUrl && l.videoUrl.includes(epPrefix))
          );
          if (existingMock) {
            isDuplicate = true;
          }
        }

        if (isDuplicate) {
          console.log(`  - [Bỏ qua] Tập ${epNumStr} đã tồn tại trong database.`);
          orderIdx++;
          continue;
        }

        // Parse phụ đề
        const subtitles = parseAss(assFilePath);
        const contentStr = JSON.stringify(subtitles);
        const supabaseVideoUrl = `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/The%20Friends/${encodeURIComponent(videoFile)}`;

        if (DRY_RUN) {
          console.log(`  - [DRY RUN] Sẽ thêm bài học: "${lessonTitle}"`);
          console.log(`    * Video: ${supabaseVideoUrl}`);
          console.log(`    * Phụ đề: ${subtitles.length} câu thoại | Thứ tự hiển thị: ${orderIdx}`);
        } else {
          await prisma.lesson.create({
            data: {
              sectionId: section.id,
              title: lessonTitle,
              contentType: "YOUTUBE_DICTATION",
              content: contentStr,
              videoUrl: supabaseVideoUrl,
              order: orderIdx,
              isPreview: false
            }
          });
          console.log(`  - ✅ Đã tạo thành công bài học: "${lessonTitle}"`);
        }
        orderIdx++;
      }
    }

    console.log("\n============================================================");
    if (DRY_RUN) {
      console.log("HOÀN THÀNH CHẠY THỬ (DRY RUN)!");
      console.log("Vui lòng kiểm tra kỹ log ở trên. Nếu chính xác, hãy đổi DRY_RUN = false để ghi thật vào DB.");
    } else {
      console.log("QUÁ TRÌNH NHẬP DỮ LIỆU ĐÃ HOÀN TẤT THÀNH CÔNG!");
    }
    console.log("============================================================");

  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
