const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const R2_BASE = 'https://pub-b39190faa3bc46a79df52b7a4f47c377.r2.dev';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- 1. Lấy danh sách 10 bài Test ETS2026 ---');
  const lessons = await prisma.lesson.findMany({
    where: {
      OR: [
        { title: { contains: 'Test 1' } },
        { title: { contains: 'Test 2' } },
        { title: { contains: 'Test 3' } },
        { title: { contains: 'Test 4' } },
        { title: { contains: 'Test 5' } },
        { title: { contains: 'Test 6' } },
        { title: { contains: 'Test 7' } },
        { title: { contains: 'Test 8' } },
        { title: { contains: 'Test 9' } },
        { title: { contains: 'Test 10' } }
      ],
      videoExplanation: { not: null }
    }
  });

  console.log(`Tìm thấy ${lessons.length} bài thi ETS2026 có video chữa đề.`);

  // 2. Sao lưu Backup dữ liệu cũ trước khi sửa
  const backupPath = path.join(__dirname, `backup_ets2026_video_explanation_${Date.now()}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      lessons.map(l => ({ id: l.id, title: l.title, videoExplanation: l.videoExplanation })),
      null,
      2
    ),
    'utf-8'
  );
  console.log(`✓ Đã sao lưu Backup dữ liệu an toàn tại: ${backupPath}`);

  // 3. Tiến hành cập nhật
  let updatedCount = 0;

  for (const lesson of lessons) {
    // Trích xuất số Test (1 đến 10) từ title: ví dụ "Đề 2026 - Test 3"
    const testMatch = lesson.title.match(/Test\s*(\d+)/i);
    if (!testMatch) {
      console.log(`Bỏ qua bài không nhận diện được số Test: ${lesson.title}`);
      continue;
    }
    const testNum = parseInt(testMatch[1], 10);
    console.log(`\n--- Đang xử lý: ${lesson.title} (Test ${testNum}) ---`);

    let explanationData = lesson.videoExplanation;
    if (!explanationData) continue;

    const isArray = Array.isArray(explanationData);
    const videoList = isArray ? explanationData : [explanationData];

    let hasChanged = false;

    const updatedVideoList = videoList.map(v => {
      const vTitle = (v.title || '').toLowerCase();
      let targetFilename = '';

      if (vTitle.includes('part 6') || vTitle.includes('131-146')) {
        targetFilename = `ETS2026 - Test ${testNum} - 131-146.mp4`;
      } else {
        // Mặc định là Part 5 (101-130)
        targetFilename = `ETS2026 - Test ${testNum} - 101-130.mp4`;
      }

      const newUrl = `${R2_BASE}/${encodeURIComponent(targetFilename)}`;
      console.log(`  -> Video [${v.title}]: đổi sang ${newUrl}`);

      hasChanged = true;
      return {
        ...v,
        videoUrl: newUrl,
        videoType: 'direct' // Sử dụng direct để kích hoạt HTML5 video player mượt mà
      };
    });

    if (hasChanged) {
      const newExplanationData = isArray ? updatedVideoList : updatedVideoList[0];
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          videoExplanation: newExplanationData
        }
      });
      console.log(`✓ Cập nhật thành công cho bài: ${lesson.title}`);
      updatedCount++;
    }
  }

  console.log(`\n=== HOÀN TẤT: Đã cập nhật ${updatedCount}/${lessons.length} bài thi ETS2026 sang Cloudflare R2 ===`);
  await pool.end();
}

main().catch(err => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
