
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function countPart7Questions() {
  console.log("📊 Đang thống kê dữ liệu Part 7 chuyên sâu (Dùng kết nối chuẩn)...");

  try {
    // 1. Lấy tất cả các nhóm Part 7 có JSON
    const groups = await prisma.toeicQuestionGroup.findMany({
      where: {
        part: { partNumber: 7 },
        passageText: { startsWith: '{' }
      },
      include: { questions: true }
    });

    let totalJsonQuestions = 0;
    let healthyInTable = 0;
    let placeholderInTable = 0;
    let missingInTable = 0;

    const testStats = {};

    for (const group of groups) {
      try {
        const jsonData = JSON.parse(group.passageText);
        const jsonQuestions = jsonData.questions || (jsonData.question ? (Array.isArray(jsonData.question) ? jsonData.question : [jsonData.question]) : []);
        
        const book = group.metadata?.book || "Unknown";
        const test = group.metadata?.test || "Unknown";
        const testKey = `${book} - Test ${test}`;
        
        if (!testStats[testKey]) {
          testStats[testKey] = { jsonTotal: 0, healthy: 0, placeholder: 0, missing: 0 };
        }

        jsonQuestions.forEach(jq => {
          totalJsonQuestions++;
          testStats[testKey].jsonTotal++;
          
          const qNo = Number(jq.questionNo || jq.question_no || jq.number);
          const exists = group.questions.find(dq => dq.questionNo === qNo);
          
          if (exists) {
            // Kiểm tra xem có phải là hàng "Chưa có dữ liệu" không
            const isPlaceholder = exists.optionA && exists.optionA.includes("Chưa có dữ liệu");
            if (isPlaceholder) {
              placeholderInTable++;
              testStats[testKey].placeholder++;
            } else {
              healthyInTable++;
              testStats[testKey].healthy++;
            }
          } else {
            missingInTable++;
            testStats[testKey].missing++;
          }
        });
      } catch (e) {
        // Skip groups with invalid JSON
      }
    }

    console.log("\n--- KẾT QUẢ THỐNG KÊ CHI TIẾT ---");
    console.table(testStats);
    
    console.log("\n--- TỔNG KẾT TOÀN BỘ PART 7 ---");
    console.log(`✅ Tổng số câu hỏi tìm thấy trong JSON: ${totalJsonQuestions}`);
    console.log(`✅ Số câu đã có nội dung đầy đủ:        ${healthyInTable}`);
    console.log(`⚠️  Số câu bị rỗng (Chưa có dữ liệu):     ${placeholderInTable}`);
    console.log(`❌ Số câu hoàn toàn chưa có dòng:       ${missingInTable}`);
    console.log(`\n=> TỔNG CỘNG CẦN XỬ LÝ (VÁ + TẠO):      ${placeholderInTable + missingInTable}`);
  } catch (error) {
    console.error("❌ Lỗi truy vấn:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

countPart7Questions();
