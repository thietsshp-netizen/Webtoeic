
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function showSampleMapping() {
  console.log("🔍 Đang trích xuất mẫu dữ liệu thực tế từ Database...\n");

  try {
    // Lấy 1 nhóm Part 7 của bộ ETS 2023 làm mẫu
    const group = await prisma.toeicQuestionGroup.findFirst({
      where: {
        part: { partNumber: 7 },
        metadata: { path: ['book'], equals: 'ETS2023' }
      }
    });

    if (!group) {
      console.log("❌ Không tìm thấy mẫu ETS 2023.");
      return;
    }

    const jsonData = JSON.parse(group.passageText);
    const q = jsonData.questions[0]; // Lấy câu đầu tiên trong nhóm

    console.log("--- DỮ LIỆU GỐC TRONG JSON ---");
    console.log(JSON.stringify(q, null, 2));

    console.log("\n--- CÁCH ÁNH XẠ VÀO BẢNG TOEICQUESTION ---");
    console.log(`1. questionNo    -> ${q.questionNo}`);
    console.log(`2. questionText  -> ${q.questionText}`);
    console.log(`3. optionA       -> ${q.options?.A || q.optionA}`);
    console.log(`4. optionB       -> ${q.options?.B || q.optionB}`);
    console.log(`5. optionC       -> ${q.options?.C || q.optionC}`);
    console.log(`6. optionD       -> ${q.options?.D || q.optionD}`);
    console.log(`7. correctAnswer -> ${q.correctAnswer}`);
    console.log(`8. explanation   -> (Sẽ được lưu dạng chuỗi JSON hoặc text)`);
    console.log(`9. metadata      -> (Toàn bộ object JSON ở trên sẽ được cất vào đây)`);

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

showSampleMapping();
