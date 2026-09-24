require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const https = require('https');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const R2_BASE = 'https://pub-a270e288fced4421a7e23ed68853d699.r2.dev/toeic_part2/';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== 1. AUDIT DỮ LIỆU PART 2 TRONG CSDL SUPABASE ===');

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
      metadata: true,
      part: {
        select: {
          partNumber: true,
          test: { select: { id: true, title: true } }
        }
      },
      questions: {
        select: { id: true, questionNo: true }
      }
    }
  });

  console.log(`Tìm thấy tổng cộng ${groups.length} nhóm câu hỏi Part 2 trong CSDL.`);

  // Phân loại nhóm theo Bộ đề / Đề thi
  const testMap = new Map();

  groups.forEach(g => {
    const testTitle = g.part?.test?.title || 'Luyện tập Part 2 / Khác';
    if (!testMap.has(testTitle)) {
      testMap.set(testTitle, []);
    }
    testMap.get(testTitle).push(g);
  });

  console.log(`\nPhân bổ theo ${testMap.size} Bộ đề / Đề thi:`);
  for (const [title, list] of testMap.entries()) {
    console.log(`  - "${title}": ${list.length} nhóm câu hỏi Part 2`);
  }

  // 2. Thử nghiệm kiểm tra ngẫu nhiên 20 file Part 2 trên Cloudflare R2
  console.log('\n=== 2. THỬ NGHIỆM ĐỐI SOÁT TRỰC TIẾP VỚI CLOUDFLARE R2 ===');
  
  const sampleGroups = groups.slice(0, 20);
  let successCount = 0;
  let failCount = 0;

  for (const g of sampleGroups) {
    if (!g.audioUrl) continue;
    const fileName = g.audioUrl.split('/').pop();
    const r2Url = `${R2_BASE}${fileName}`;
    const isOk = await checkUrl(r2Url);
    
    if (isOk) {
      successCount++;
      console.log(`✓ [200 OK] ${fileName} -> ${r2Url}`);
    } else {
      failCount++;
      console.log(`❌ [FAIL/404] ${fileName} -> ${r2Url}`);
    }
  }

  console.log(`\nKết quả thử nghiệm 20 mẫu file Part 2: ${successCount} thành công, ${failCount} thất bại.`);

  await pool.end();
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
