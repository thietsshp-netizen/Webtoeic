require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== QUÉT BỘ ĐỀ ETS2020 TRONG TOEIC QUESTION GROUPS ===');

  const groups = await prisma.toeicQuestionGroup.findMany({
    where: {
      OR: [
        { audioUrl: { contains: 'ETS2020' } },
        { imageUrl: { contains: 'ETS2020' } }
      ]
    },
    select: {
      id: true,
      audioUrl: true,
      imageUrl: true,
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

  console.log(`Tìm thấy tổng cộng ${groups.length} nhóm câu hỏi chứa ETS2020.`);

  groups.slice(0, 15).forEach((g, idx) => {
    console.log(`\n[${idx + 1}] Group ID: ${g.id}`);
    console.log(`  - Part: ${g.part?.partNumber} (Test: "${g.part?.test?.title}")`);
    console.log(`  - Questions: [${g.questions.map(q => q.questionNo).join(', ')}]`);
    console.log(`  - Audio: ${g.audioUrl}`);
    console.log(`  - Image: ${g.imageUrl}`);
    console.log(`  - Metadata:`, JSON.stringify(g.metadata));
  });

  await pool.end();
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
