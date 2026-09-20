import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const COURSE_ID = "cmr7cn15r000098he1wz4diuc"; // LUYỆN NGHE-NÓI QUA VIDEO

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function dryRunMatch() {
  try {
    const driveVideosPath = path.join(process.cwd(), 'scripts', 'friends_drive_videos.json');
    const driveVideos = JSON.parse(fs.readFileSync(driveVideosPath, 'utf-8'));

    // Lấy danh sách Section và Lesson trong DB (CHỈ ĐỌC)
    const sections = await prisma.section.findMany({
      where: { courseId: COURSE_ID },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            videoUrl: true,
            order: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    console.log(`\n=== KẾT QUẢ ĐỐI SOÁT GIỮA DATABASE VÀ GOOGLE DRIVE (CHẾ ĐỘ CHỈ ĐỌC - DRY RUN) ===`);

    let totalLessonsInDb = 0;
    let totalMatched = 0;
    let totalUnmatched = 0;

    for (const section of sections) {
      // Tìm số Season từ tiêu đề section (ví dụ: "Season 1", "SEASON 1", "Season 02", ...)
      const seasonMatch = section.title.match(/Season\s*(\d+)/i);
      const seasonNum = seasonMatch ? parseInt(seasonMatch[1], 10) : null;
      const seasonKey = seasonNum ? `Season_${seasonNum}` : null;
      const driveList = seasonKey ? (driveVideos[seasonKey] || []) : [];

      console.log(`\n------------------------------------------------------------`);
      console.log(`📁 Section: "${section.title}" (Season ${seasonNum || '?'}) | DB: ${section.lessons.length} bài | Drive: ${driveList.length} video`);
      console.log(`------------------------------------------------------------`);

      totalLessonsInDb += section.lessons.length;

      for (const lesson of section.lessons) {
        // Tìm mã tập trong title của lesson (ví dụ: "S02E01 - ...", hoặc "Tập 1", "1", "S01E01", ...)
        let epMatch = lesson.title.match(/S\d{2}E(\d{2}(?:-E?\d{2}|-\d{2})?)/i);
        let epStr = epMatch ? epMatch[1] : null;

        if (!epStr) {
          // Thử tìm số ở đầu tiêu đề hoặc dạng "Tập X"
          const numMatch = lesson.title.match(/(?:Tập\s*)?(\d+)/i);
          if (numMatch) {
            epStr = String(parseInt(numMatch[1], 10)).padStart(2, '0');
          }
        }

        // Tìm video tương ứng trong danh sách Drive của Season đó
        let matchedDriveVideo = null;
        if (epStr) {
          // Chuẩn hóa epStr (ví dụ: "01", "17-18")
          matchedDriveVideo = driveList.find(v => {
            if (!v.epKey) return false;
            // Khớp chính xác epKey (ví dụ "01" == "01")
            if (v.epKey === epStr) return true;
            // Khớp số integer (ví dụ 1 == 1)
            const numV = parseInt(v.epKey, 10);
            const numL = parseInt(epStr, 10);
            if (!isNaN(numV) && !isNaN(numL) && numV === numL) return true;
            return false;
          });
        }

        if (matchedDriveVideo) {
          totalMatched++;
          console.log(`  ✅ [DB: ${lesson.title.padEnd(35)}] <==> [Drive: ${matchedDriveVideo.filename}]`);
        } else {
          totalUnmatched++;
          console.log(`  ❌ [CHƯA KHỚP] DB: "${lesson.title}" (epStr: ${epStr})`);
        }
      }
    }

    console.log(`\n============================================================`);
    console.log(`📊 TỔNG KẾT ĐỐI SOÁT:`);
    console.log(`- Tổng số bài học trong DB: ${totalLessonsInDb}`);
    console.log(`- Số bài khớp chính xác với video Google Drive: ${totalMatched}`);
    console.log(`- Số bài chưa khớp: ${totalUnmatched}`);
    console.log(`============================================================\n`);

  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

dryRunMatch();
