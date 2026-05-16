
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findPlaceholderPart7() {
  console.log("🕵️ Đang tìm kiếm đích danh một câu Part 7 bị rỗng nội dung...");

  try {
    const placeholder = await prisma.toeicQuestion.findFirst({
      where: { 
        optionA: { contains: "Chưa có dữ liệu" }
      }
    });

    if (placeholder) {
      console.log("--- MẪU CÂU ĐANG BỊ RỖNG (Dữ liệu hiện tại) ---");
      console.log(JSON.stringify(placeholder, null, 2));
      
      // Lấy thêm Group của nó để xem JSON gốc
      const group = await prisma.toeicQuestionGroup.findUnique({
        where: { id: placeholder.groupId }
      });
      
      if (group) {
         console.log("\n--- DỮ LIỆU JSON TƯƠNG ỨNG TRONG GROUP ---");
         const jsonData = JSON.parse(group.passageText);
         const qJson = jsonData.questions.find(q => q.questionNo === placeholder.questionNo);
         console.log(JSON.stringify(qJson, null, 2));
      }
    } else {
      console.log("Không tìm thấy câu rỗng nào.");
    }

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

findPlaceholderPart7();
