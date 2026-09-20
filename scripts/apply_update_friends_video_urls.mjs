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

async function applyUpdate() {
  try {
    const driveVideosPath = path.join(process.cwd(), 'scripts', 'friends_drive_videos.json');
    const driveVideos = JSON.parse(fs.readFileSync(driveVideosPath, 'utf-8'));

    // 1. Lấy danh sách Section và Lesson hiện tại của khóa học
    const sections = await prisma.section.findMany({
      where: { courseId: COURSE_ID },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            videoUrl: true,
            order: true,
            sectionId: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    // 2. BƯỚC AN TOÀN: Sao lưu lại danh sách URL cũ phòng trường hợp cần hoàn tác
    const backupData = [];
    sections.forEach(s => {
      s.lessons.forEach(l => {
        backupData.push({ id: l.id, title: l.title, videoUrl: l.videoUrl, sectionTitle: s.title });
      });
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(process.cwd(), 'scripts', `backup_friends_urls_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`🔒 [BƯỚC AN TOÀN] Đã tạo file sao lưu trạng thái hiện tại: ${backupFile}`);

    // 3. Thực hiện CẬP NHẬT CHỈ TRƯỜNG videoUrl
    console.log(`\n🚀 BẮT ĐẦU CẬP NHẬT videoUrl CHO 233 BÀI HỌC...`);
    let updatedCount = 0;

    for (const section of sections) {
      const seasonMatch = section.title.match(/Season\s*(\d+)/i);
      const seasonNum = seasonMatch ? parseInt(seasonMatch[1], 10) : null;
      const seasonKey = seasonNum ? `Season_${seasonNum}` : null;
      const driveList = seasonKey ? (driveVideos[seasonKey] || []) : [];

      for (const lesson of section.lessons) {
        let epMatch = lesson.title.match(/S\d{2}E(\d{2}(?:-E?\d{2}|-\d{2})?)/i);
        let epStr = epMatch ? epMatch[1] : null;

        if (!epStr) {
          const numMatch = lesson.title.match(/(?:Tập\s*)?(\d+)/i);
          if (numMatch) {
            epStr = String(parseInt(numMatch[1], 10)).padStart(2, '0');
          }
        }

        let matchedDriveVideo = null;
        if (epStr) {
          matchedDriveVideo = driveList.find(v => {
            if (!v.epKey) return false;
            if (v.epKey === epStr) return true;
            const numV = parseInt(v.epKey, 10);
            const numL = parseInt(epStr, 10);
            return !isNaN(numV) && !isNaN(numL) && numV === numL;
          });
        }

        if (matchedDriveVideo) {
          // CHỈ CẬP NHẬT DUY NHẤT TRƯỜNG videoUrl
          await prisma.lesson.update({
            where: { id: lesson.id },
            data: {
              videoUrl: matchedDriveVideo.driveUrl
            }
          });
          updatedCount++;
          if (updatedCount % 25 === 0 || updatedCount === 233) {
            console.log(`  ✓ Đã cập nhật xong: ${updatedCount}/233 bài học...`);
          }
        } else {
          console.warn(`  ⚠️ Cảnh báo: Không khớp bài học ID ${lesson.id} - ${lesson.title}`);
        }
      }
    }

    console.log(`\n🎉 HOÀN TẤT THÀNH CÔNG! Đã cập nhật link Google Drive cho ${updatedCount} bài học.`);
  } catch (err) {
    console.error("❌ Lỗi trong quá trình cập nhật:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

applyUpdate();
