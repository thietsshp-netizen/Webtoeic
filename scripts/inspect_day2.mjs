import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectDay2() {
  try {
    const day2 = await prisma.lesson.findFirst({
      where: {
        title: {
          contains: "Ngày 2"
        }
      }
    });

    if (day2) {
      console.log("=== DAY 2 FIELDS ===");
      console.log(`- ID: ${day2.id}`);
      console.log(`- Title: "${day2.title}"`);
      console.log(`- contentType: "${day2.contentType}"`);
      console.log(`- chapterId: "${day2.chapterId}"`);
      console.log(`- order: ${day2.order}`);
      console.log(`- isPreview: ${day2.isPreview}`);
      console.log(`- vocabDayId: "${day2.vocabDayId}"`);
    }

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

inspectDay2();
