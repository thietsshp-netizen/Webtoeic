import * as dotenv from 'dotenv';
dotenv.config();

console.log("🚀 [DEBUG] Script đã khởi động thành công!");

import { prisma } from '../src/lib/prisma';
import { processPart5Batch } from '../src/lib/gemini';
import * as xlsx from 'xlsx';
import * as path from 'path';

async function testIngestion() {
  console.log("🔍 Đang kết nối Database...");
  console.log("🧹 [1/3] Đang dọn dẹp dữ liệu cũ để thử nghiệm 10 câu mới...");
  
  const test = await prisma.toeicTest.findFirst({
    where: { title: "QUESTION_BANK_PART5" }
  });

  if (test) {
    const part5 = await prisma.toeicPart.findFirst({
      where: { testId: test.id, partNumber: 5 }
    });

    if (part5) {
      await prisma.toeicQuestionGroup.deleteMany({
        where: { partId: part5.id }
      });
    }
  }

  // Đảm bảo có Test và Part 5
  let currentTest = test || await prisma.toeicTest.create({
    data: { title: "QUESTION_BANK_PART5", isPublished: true }
  });

  let part5 = await prisma.toeicPart.findFirst({
    where: { testId: currentTest.id, partNumber: 5 }
  }) || await prisma.toeicPart.create({
    data: { testId: currentTest.id, partNumber: 5, title: "Part 5" }
  });

  console.log("📖 [2/3] Đang đọc file Excel (Lấy 10 câu đầu)...");
  const filePath = path.join(process.cwd(), 'Part 5', 'PART 5.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows = xlsx.utils.sheet_to_json(sheet) as any[];
  const rows = allRows.slice(0, 10); // CHỈ LẤY 10 CÂU

  console.log(`📦 Bắt đầu nạp thử nghiệm ${rows.length} câu hỏi...`);

  const BATCH_SIZE = 5;
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const currentBatchNum = i / BATCH_SIZE + 1;
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    console.log(`\n-------------------------------------------`);
    console.log(`📦 BATCH ${currentBatchNum}/${totalBatches}`);
    console.log(`🔄 Đang chuẩn bị dữ liệu cho ${batch.length} câu...`);
    
    const rawTexts = batch.map(row => `${row.Question_No}. ${row.Question_EN}`);

    try {
      console.log(`⏳ Đang đợi AI (Gemini) phân tích chi tiết... (Thường mất 15-30s)`);
      const enrichedData = await processPart5Batch(rawTexts);
      console.log(`✨ AI đã phản hồi! Đang lưu vào Database...`);

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const ai = enrichedData[j];
        if (!ai) continue;

        const group = await prisma.toeicQuestionGroup.create({
          data: {
            partId: part5.id,
            metadata: { day: row.Day, type: row.Question_Type, book: row.Book, test: row.Test, status: 'PUBLISHED' }
          }
        });

        await prisma.toeicQuestion.create({
          data: {
            groupId: group.id,
            questionNo: parseInt(row.Question_No) || 0,
            questionText: ai.questionText,
            optionA: ai.optionA,
            optionB: ai.optionB,
            optionC: ai.optionC,
            optionD: ai.optionD,
            correctAnswer: row.Correct_Answer || ai.correctAnswer,
            explanation: JSON.stringify(ai.explanation),
            metadata: {
              day: row.Day, type: row.Question_Type, book: row.Book, test: row.Test,
              translation: ai.translation,
              vocabulary: ai.vocabulary?.map((v: any) => v.word) || []
            }
          }
        });

        console.log(`✅ Đã nạp xong câu ${row.Question_No}`);
      }
    } catch (err: any) {
      console.error(`❌ Lỗi batch:`, err.message);
    }
  }

  console.log("\n✨ HOÀN TẤT THỬ NGHIỆM 10 CÂU. Mời bạn vào kiểm tra giao diện!");
}

testIngestion()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
