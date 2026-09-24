require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== QUÉT TOÀN BỘ QUESTION GROUPS CÓ AUDIO/IMAGE THUỘC LESSONS/PART1 ===');

  const groups = await prisma.toeicQuestionGroup.findMany({
    where: {
      OR: [
        { audioUrl: { contains: 'toeic_part1' } },
        { imageUrl: { contains: 'toeic_part1' } },
        { audioUrl: { contains: 'lessons' } },
        { imageUrl: { contains: 'lessons' } }
      ]
    },
    select: {
      id: true,
      audioUrl: true,
      imageUrl: true,
      part: {
        select: {
          partNumber: true,
          test: {
            select: { id: true, title: true }
          }
        }
      },
      questions: {
        select: { id: true, questionNo: true }
      }
    }
  });

  console.log(`Tìm thấy tổng cộng ${groups.length} nhóm câu hỏi trong DB.`);

  // Phân loại theo Part & URL pattern
  const part1Groups = groups.filter(g => g.part?.partNumber === 1 || g.audioUrl?.includes('part1') || g.imageUrl?.includes('part1'));
  console.log(`=> Trong đó thuộc Part 1: ${part1Groups.length} nhóm.`);

  console.log('\nMẫu 10 nhóm câu hỏi Part 1 đầu tiên:');
  part1Groups.slice(0, 10).forEach((g, idx) => {
    console.log(`[${idx + 1}] ID: ${g.id} | Test: "${g.part?.test?.title}" | Audio: ${g.audioUrl} | Image: ${g.imageUrl}`);
  });

  await pool.end();
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
