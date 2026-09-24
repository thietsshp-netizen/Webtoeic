require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const OLD_PREFIX = 'https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/lessons/toeic_part2/';
const NEW_PREFIX = 'https://pub-a270e288fced4421a7e23ed68853d699.r2.dev/toeic_part2/';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== BƯỚC 1: QUÉT & SAO LƯU (BACKUP) DỮ LIỆU PART 2 ===');

  const groups = await prisma.toeicQuestionGroup.findMany({
    where: {
      OR: [
        { audioUrl: { contains: 'toeic_part2' } },
        { part: { partNumber: 2 } }
      ]
    },
    select: {
      id: true,
      audioUrl: true,
      partId: true
    }
  });

  console.log(`Tìm thấy tổng cộng ${groups.length} nhóm câu hỏi Part 2 để backup.`);

  if (groups.length === 0) {
    console.log('Không tìm thấy dữ liệu Part 2 để cập nhật.');
    await pool.end();
    return;
  }

  // 1. Tạo file sao lưu Backup an toàn
  const timestamp = Date.now();
  const backupFileName = `backup_part2_groups_${timestamp}.json`;
  const backupFilePath = path.join(__dirname, backupFileName);

  fs.writeFileSync(
    backupFilePath,
    JSON.stringify(groups, null, 2),
    'utf-8'
  );

  console.log(`✓ SAO LƯU THÀNH CÔNG! Bản sao lưu được lưu tại: ${backupFilePath}`);
  console.log(`Dung lượng bản sao lưu: ${(fs.statSync(backupFilePath).size / 1024).toFixed(2)} KB`);

  // 2. Tiến hành Cập nhật CSDL
  console.log('\n=== BƯỚC 2: CẬP NHẬT ĐƯỜNG DẪN CLOUDFLARE R2 PART 2 VÀO CSDL ===');

  let updatedAudioCount = 0;
  let totalGroupsUpdated = 0;

  for (const group of groups) {
    let newAudio = group.audioUrl;
    let hasChanged = false;

    if (newAudio && newAudio.includes(OLD_PREFIX)) {
      newAudio = newAudio.replace(OLD_PREFIX, NEW_PREFIX);
      updatedAudioCount++;
      hasChanged = true;
    } else if (newAudio && newAudio.includes('/lessons/toeic_part2/')) {
      newAudio = newAudio.replace(/https:\/\/[^/]+\/storage\/v1\/object\/public\/lessons\/toeic_part2\//, NEW_PREFIX);
      updatedAudioCount++;
      hasChanged = true;
    }

    if (hasChanged) {
      await prisma.toeicQuestionGroup.update({
        where: { id: group.id },
        data: {
          audioUrl: newAudio
        }
      });
      totalGroupsUpdated++;
    }
  }

  console.log(`✓ HOÀN TẤT CẬP NHẬT CSDL PART 2:`);
  console.log(`  - Số nhóm câu hỏi đã cập nhật: ${totalGroupsUpdated}/${groups.length}`);
  console.log(`  - Số link Audio Part 2 đã đổi sang R2: ${updatedAudioCount}`);

  await pool.end();
}

main().catch(err => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
