import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listFirstLessons() {
  try {
    const lessons = await prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
        contentType: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 100
    });

    console.log(`=== FIRST 100 LESSONS ===`);
    lessons.forEach((l, idx) => {
      console.log(`[Bài ${idx + 1}] ID: ${l.id} | Title: "${l.title}" | Type: ${l.contentType} | Created: ${l.createdAt}`);
    });

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

listFirstLessons();
