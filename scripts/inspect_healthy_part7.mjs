
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findHealthyPart7() {
  try {
    const healthy = await prisma.toeicQuestion.findFirst({
      where: { 
        questionNo: { gte: 147 },
        optionA: { 
          not: { contains: "Chưa có dữ liệu" },
          not: ""
        },
        group: {
          part: { partNumber: 7 }
        }
      }
    });

    if (healthy) {
      console.log("--- MẪU CÂU PART 7 ĐÃ ĐẦY ĐỦ (Dòng Xịn) ---");
      console.log(`- ID: ${healthy.id}`);
      console.log(`- Câu số: ${healthy.questionNo}`);
      console.log(`- Nội dung câu hỏi: ${healthy.questionText}`);
      console.log(`- Đáp án A: ${healthy.optionA}`);
      console.log(`- Đáp án B: ${healthy.optionB}`);
      console.log(`- Đáp án C: ${healthy.optionC}`);
      console.log(`- Đáp án D: ${healthy.optionD}`);
      console.log(`- Đáp án đúng: ${healthy.correctAnswer}`);
      console.log(`- Lời giải (trích đoạn): ${healthy.explanation?.substring(0, 100)}...`);
    } else {
      console.log("Không tìm thấy câu Part 7 nào xịn hoàn toàn.");
    }
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

findHealthyPart7();
