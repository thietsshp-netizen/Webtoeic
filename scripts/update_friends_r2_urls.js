const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const R2_BASE = 'https://pub-d60184ec6eae4e6299cd4882b5d212dc.r2.dev';
const SEASONS_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Phim /Friends_iOS_Ready';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- 1. Quét các file video trong S01, S02, S03 ---');
  const fileMap = new Map(); // key: 'S01E01' -> R2 URL

  const seasons = ['S01', 'S02', 'S03'];
  for (const s of seasons) {
    const sDir = path.join(SEASONS_DIR, s);
    if (!fs.existsSync(sDir)) {
      console.warn(`Thư mục không tồn tại: ${sDir}`);
      continue;
    }
    const files = fs.readdirSync(sDir).filter(f => f.endsWith('.mp4'));
    console.log(`Tìm thấy ${files.length} file mp4 trong ${s}`);
    
    for (const f of files) {
      // Regex trích xuất mã tập: S01E01 hoặc S01E16-E17
      const match = f.match(/S\d{2}E\d{2}(-E\d{2})?/i);
      if (match) {
        const epKey = match[0].toUpperCase();
        // encodeURI giữ nguyên các ký tự hợp lệ nhưng encode các ký tự đặc biệt nếu có
        const r2Url = `${R2_BASE}/${encodeURI(f)}`;
        fileMap.set(epKey, r2Url);
      }
    }
  }

  console.log(`Tổng số tập video R2 sẵn sàng: ${fileMap.size}`);

  console.log('--- 2. Lấy danh sách bài học khóa Friends trong Database ---');
  const course = await prisma.course.findUnique({
    where: { id: 'cmr7cn15r000098he1wz4diuc' },
    include: {
      sections: {
        include: {
          lessons: {
            select: { id: true, title: true, videoUrl: true }
          }
        }
      }
    }
  });

  if (!course) {
    console.error('Không tìm thấy khóa học Friends!');
    await pool.end();
    return;
  }

  const allLessons = [];
  course.sections.forEach(sec => allLessons.push(...sec.lessons));
  console.log(`Tìm thấy ${allLessons.length} bài học trong khóa`);

  // 3. Tạo bản sao lưu Backup trước khi sửa
  const backupData = allLessons.map(l => ({ id: l.id, title: l.title, videoUrl: l.videoUrl }));
  const backupPath = path.join(__dirname, `backup_friends_urls_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`Đã sao lưu dữ liệu an toàn tại: ${backupPath}`);

  // 4. Tiến hành cập nhật
  let updatedCount = 0;
  let skippedCount = 0;

  for (const lesson of allLessons) {
    // Trích xuất mã tập từ title bài học, ví dụ: "S01E01 - The One..."
    const match = lesson.title.match(/S\d{2}E\d{2}(-E\d{2})?/i);
    if (!match) {
      skippedCount++;
      continue;
    }

    const epKey = match[0].toUpperCase();
    const newR2Url = fileMap.get(epKey);

    if (newR2Url) {
      if (lesson.videoUrl !== newR2Url) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { videoUrl: newR2Url }
        });
        console.log(`✓ [${epKey}] Cập nhật: "${lesson.title}" -> ${newR2Url}`);
        updatedCount++;
      } else {
        // Đã là link R2 rồi
        skippedCount++;
      }
    } else {
      console.log(`- [${epKey}] Không có file trong R2 (S01, S02, S03): "${lesson.title}"`);
      skippedCount++;
    }
  }

  console.log('--- HOÀN TẤT ---');
  console.log(`Số bài học đã cập nhật link Cloudflare R2: ${updatedCount}`);
  console.log(`Số bài học giữ nguyên (thuộc Season khác hoặc đã cập nhật): ${skippedCount}`);

  await pool.end();
}

main().catch(err => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
