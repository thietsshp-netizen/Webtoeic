
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectTableStructure() {
  console.log("🕵️ Đang soi chi tiết từng cột trong bảng ToeicQuestion...\n");

  try {
    // 1. Tìm 1 câu "Xịn" (có đủ dữ liệu)
    const questions = await prisma.toeicQuestion.findMany({
      take: 100
    });

    const healthy = questions.find(q => q.optionA && !q.optionA.includes("Chưa có dữ liệu"));
    const placeholder = questions.find(q => q.optionA && q.optionA.includes("Chưa có dữ liệu"));

    console.log("--- MẪU 1: CÂU ĐÃ CÓ DỮ LIỆU ĐẦY ĐỦ (Dòng Xịn) ---");
    if (healthy) {
      console.log(JSON.stringify(healthy, null, 2));
    } else {
      console.log("Không tìm thấy câu xịn trong 100 dòng đầu.");
    }

    console.log("\n--- MẪU 2: CÂU ĐANG BỊ RỖNG (Dòng Lỗi) ---");
    if (placeholder) {
      console.log(JSON.stringify(placeholder, null, 2));
    } else {
      console.log("Không tìm thấy câu rỗng trong 100 dòng đầu.");
    }

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

inspectTableStructure();
