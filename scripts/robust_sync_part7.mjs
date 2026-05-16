
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes('--execute') ? false : true;

async function syncPart7Final() {
  console.log(`\n🚀 BẮT ĐẦU QUY TRÌNH QUÉT SẠCH 'EMPTY' (${DRY_RUN ? 'CHẾ ĐỘ CHẠY THỬ' : 'CHẾ ĐỘ THỰC THI'})`);

  try {
    const groups = await prisma.toeicQuestionGroup.findMany({
      where: {
        passageText: { startsWith: '{' }
      },
      include: { questions: true }
    });

    let updatedCount = 0;

    for (const group of groups) {
      let jsonData;
      try {
        jsonData = JSON.parse(group.passageText);
      } catch (e) {
        continue;
      }

      const jsonQuestions = jsonData.questions || (jsonData.question ? (Array.isArray(jsonData.question) ? jsonData.question : [jsonData.question]) : []);

      for (const jq of jsonQuestions) {
        const qNo = Number(jq.questionNo || jq.question_no || jq.number);
        const existing = group.questions.find(dq => dq.questionNo === qNo);

        if (existing) {
          // KIỂM TRA TẤT CẢ CÁC LOẠI DỮ LIỆU LỖI: Rỗng, EMPTY, hoặc Chưa có dữ liệu
          const isBadData = !existing.optionA || 
                            existing.optionA === "EMPTY" || 
                            existing.optionA === "" || 
                            existing.optionA.includes("Chưa có dữ liệu");

          if (isBadData) {
            const questionPayload = {
              questionText: jq.questionText || jq.text || "",
              optionA: (jq.optionA || jq.options?.A || "A").toString(),
              optionB: (jq.optionB || jq.options?.B || "B").toString(),
              optionC: (jq.optionC || jq.options?.C || "C").toString(),
              optionD: (jq.optionD || jq.options?.D || "D").toString(),
              correctAnswer: (jq.correctAnswer || jq.answer || "A").toString().toUpperCase().trim(),
              explanation: typeof jq.explanation === 'object' ? JSON.stringify(jq.explanation) : (jq.explanation || ""),
              metadata: jq
            };

            if (!DRY_RUN) {
              await prisma.toeicQuestion.update({
                where: { id: existing.id },
                data: questionPayload
              });
            }
            updatedCount++;
            if (DRY_RUN && updatedCount < 50) console.log(`🔧 [SỬA EMPTY] Q${qNo} tại Group ${group.id}`);
          }
        }
      }
    }

    console.log(`\n--- KẾT QUẢ ---`);
    console.log(`✅ Đã sửa thành công: ${updatedCount} câu bị EMPTY hoặc lỗi.`);
    
    if (DRY_RUN) {
      console.log("\n⚠️ ĐÂY LÀ CHẾ ĐỘ CHẠY THỬ.");
    } else {
      console.log("\n🎉 ĐÃ DỌN SẠCH TẤT CẢ CÂU EMPTY TRONG DATABASE.");
    }

  } catch (error) {
    console.error("💥 LỖI:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

syncPart7Final();
