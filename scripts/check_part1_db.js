require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to DB:', connectionString ? connectionString.substring(0, 30) + '...' : 'NONE');

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('\n=== 1. KIỂM TRA BÀI THI CÓ PART 1 TRONG CSDL ===');
  const part1s = await prisma.toeicPart.findMany({
    where: { partNumber: 1 },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          lessons: {
            select: {
              title: true,
              section: {
                select: {
                  title: true,
                  book: { select: { title: true } },
                  course: { select: { title: true } }
                }
              }
            }
          }
        }
      },
      groups: {
        select: {
          id: true,
          audioUrl: true,
          imageUrl: true,
          questions: { select: { questionNo: true } }
        }
      }
    }
  });

  console.log('Tổng số Bài Test có Part 1:', part1s.length);

  const report = part1s.map(p1 => {
    const testTitle = p1.test?.title || 'Unknown Test';
    const lessons = p1.test?.lessons || [];
    const bookTitle = lessons[0]?.section?.book?.title || lessons[0]?.section?.course?.title || 'No Book';
    const sectionTitle = lessons[0]?.section?.title || 'No Section';

    const sampleGroup = p1.groups[0];
    const groupCount = p1.groups.length;

    return {
      partId: p1.id,
      testId: p1.testId,
      testTitle,
      bookTitle,
      sectionTitle,
      groupCount,
      sampleAudio: sampleGroup?.audioUrl,
      sampleImage: sampleGroup?.imageUrl,
      questionNos: p1.groups.map(g => g.questions.map(q => q.questionNo)).flat().slice(0, 6)
    };
  });

  console.log(JSON.stringify(report, null, 2));
  await pool.end();
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
