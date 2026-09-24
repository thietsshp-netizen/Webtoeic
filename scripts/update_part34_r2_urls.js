require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const OLD_PREFIX = 'https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/lessons/toeic_part3_4/';
const NEW_PREFIX = 'https://pub-a270e288fced4421a7e23ed68853d699.r2.dev/toeic_part3_4/';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== BƯỚC 1: QUÉT & SAO LƯU (BACKUP) DỮ LIỆU PART 3 & PART 4 ===');

  const groups = await prisma.toeicQuestionGroup.findMany({
    where: {
      part: {
        partNumber: { in: [3, 4] }
      }
    },
    select: {
      id: true,
      audioUrl: true,
      imageUrl: true,
      partId: true
    }
  });

  console.log(`Tìm thấy tổng cộng ${groups.length} nhóm câu hỏi Part 3 & 4 để backup.`);

  if (groups.length === 0) {
    console.log('Không tìm thấy dữ liệu Part 3 & 4 để cập nhật.');
    await pool.end();
    return;
  }

  // 1. Tạo file sao lưu Backup an toàn
  const timestamp = Date.now();
  const backupFileName = `backup_part34_groups_${timestamp}.json`;
  const backupFilePath = path.join(__dirname, backupFileName);

  fs.writeFileSync(
    backupFilePath,
    JSON.stringify(groups, null, 2),
    'utf-8'
  );

  console.log(`✓ SAO LƯU THÀNH CÔNG! Bản sao lưu được lưu tại: ${backupFilePath}`);
  console.log(`Dung lượng bản sao lưu: ${(fs.statSync(backupFilePath).size / 1024).toFixed(2)} KB`);

  // 2. Tiến hành Cập nhật CSDL
  console.log('\n=== BƯỚC 2: CẬP NHẬT ĐƯỜNG DẪN CLOUDFLARE R2 PART 3 & 4 VÀO CSDL ===');

  let updatedAudioCount = 0;
  let updatedImageCount = 0;
  let totalGroupsUpdated = 0;

  for (const g of groups) {
    let needsUpdate = false;
    let newAudioUrl = g.audioUrl;
    let newImageUrl = g.imageUrl;

    if (g.audioUrl && g.audioUrl.startsWith(OLD_PREFIX)) {
      newAudioUrl = g.audioUrl.replace(OLD_PREFIX, NEW_PREFIX);
      needsUpdate = true;
      updatedAudioCount++;
    }

    if (g.imageUrl && g.imageUrl.startsWith(OLD_PREFIX)) {
      newImageUrl = g.imageUrl.replace(OLD_PREFIX, NEW_PREFIX);
      needsUpdate = true;
      updatedImageCount++;
    }

    if (needsUpdate) {
      await prisma.toeicQuestionGroup.update({
        where: { id: g.id },
        data: {
          audioUrl: newAudioUrl,
          imageUrl: newImageUrl
        }
      });
      totalGroupsUpdated++;
    }
  }

  console.log(`\n🎉 HOÀN THÀNH CẬP NHẬT CSDL PART 3 & 4!`);
  console.log(`- Số nhóm câu hỏi được cập nhật: ${totalGroupsUpdated}/${groups.length}`);
  console.log(`- Đường dẫn Audio đã đổi sang R2: ${updatedAudioCount}`);
  console.log(`- Đường dẫn Image đã đổi sang R2: ${updatedImageCount}`);

  await pool.end();
}

main().catch(err => {
  console.error('Lỗi trong quá trình cập nhật:', err);
  process.exit(1);
});
