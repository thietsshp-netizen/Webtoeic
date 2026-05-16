
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findTrueHealthy() {
  try {
    // Tìm câu Ms. Alonso
    const alonso = await prisma.toeicQuestion.findFirst({
      where: { 
        questionText: { contains: "Alonso" }
      }
    });

    if (alonso) {
      console.log("--- MẪU CHUẨN (Ms. Alonso) ---");
      console.log(`- ID: ${alonso.id}`);
      console.log(`- Câu hỏi: ${alonso.questionText}`);
      console.log(`- Đáp án A: ${alonso.optionA}`);
      console.log(`- Đáp án B: ${alonso.optionB}`);
      console.log(`- Đáp án C: ${alonso.optionC}`);
      console.log(`- Đáp án D: ${alonso.optionD}`);
      console.log(`- Đáp án đúng: ${alonso.correctAnswer}`);
    } else {
      console.log("Không tìm thấy Ms. Alonso. Đang tìm câu Part 7 bất kỳ có nội dung dài...");
      const longQ = await prisma.toeicQuestion.findFirst({
        where: {
          questionNo: { gte: 147 },
          optionA: { contains: " " } // Có dấu cách
        }
      });
      if (longQ) {
         console.log(`--- MẪU PART 7 TÌM THẤY ---`);
         console.log(`- ID: ${longQ.id}`);
         console.log(`- Câu hỏi: ${longQ.questionText}`);
         console.log(`- Đáp án A: ${longQ.optionA}`);
      }
    }
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

findTrueHealthy();
