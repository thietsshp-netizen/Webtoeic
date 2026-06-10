import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkExistingVideoExplanation() {
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        videoExplanation: {
          not: null
        }
      },
      take: 5
    });

    console.log(`=== FOUND ${lessons.length} LESSONS WITH EXISTING VIDEO EXPLANATION ===`);
    lessons.forEach(l => {
      console.log(`\nLesson ID: ${l.id} | Title: "${l.title}"`);
      console.log(JSON.stringify(l.videoExplanation, null, 2));
    });

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkExistingVideoExplanation();
