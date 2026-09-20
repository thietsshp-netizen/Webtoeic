import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const COURSE_ID = "cmr7cn15r000098he1wz4diuc"; // LUYỆN NGHE-NÓI QUA VIDEO

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspect() {
  try {
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

    console.log(`Tìm thấy ${sections.length} Sections:`);
    let totalLessons = 0;
    for (const s of sections) {
      console.log(`\n📁 Section [${s.title}] (ID: ${s.id}, Order: ${s.order}) - Số bài: ${s.lessons.length}`);
      totalLessons += s.lessons.length;
      if (s.lessons.length > 0) {
        console.log(`   Ví dụ bài đầu: "${s.lessons[0].title}" | videoUrl: "${s.lessons[0].videoUrl}"`);
        console.log(`   Ví dụ bài cuối: "${s.lessons[s.lessons.length - 1].title}" | videoUrl: "${s.lessons[s.lessons.length - 1].videoUrl}"`);
      }
    }
    console.log(`\n===> Tổng số bài học trong khóa: ${totalLessons}`);
  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

inspect();
