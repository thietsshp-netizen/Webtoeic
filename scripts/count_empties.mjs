
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function countEmptyQuestions() {
  console.log("📊 Đang thống kê các câu bị chữ 'EMPTY'...");

  try {
    const emptyCount = await prisma.toeicQuestion.count({
      where: {
        OR: [
          { optionA: { equals: "EMPTY" } },
          { optionA: { equals: "A. (Chưa có dữ liệu)" } },
          { optionA: { equals: "" } }
        ]
      }
    });

    console.log(`⚠️  Phát hiện: ${emptyCount} câu đang bị 'EMPTY' hoặc rỗng.`);
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

countEmptyQuestions();
