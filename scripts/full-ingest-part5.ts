import { prisma } from '../src/lib/prisma';
import { processPart5Batch } from '../src/lib/gemini';
import * as xlsx from 'xlsx';
import * as path from 'path';

async function fullIngestion() {
  console.log("🧹 [1/3] Đang dọn dẹp dữ liệu cũ...");
  
  // 1. Tìm Part 1 của bộ QUESTION_BANK_PART5
  const test = await prisma.toeicTest.findFirst({
    where: { title: "QUESTION_BANK_PART5" }
  });

  if (test) {
    const part5 = await prisma.toeicPart.findFirst({
      where: { testId: test.id, partNumber: 5 }
    });

    if (part5) {
      // Xóa tất cả group (sẽ cascade xóa các câu hỏi liên quan)
      const deleteResult = await prisma.toeicQuestionGroup.deleteMany({
        where: { partId: part5.id }
      });
      console.log(`✅ Đã xóa ${deleteResult.count} nhóm câu hỏi cũ.`);
    }
  }

  // Đảm bảo có Test và Part 5 sạch sẽ
  let currentTest = test;
  if (!currentTest) {
    currentTest = await prisma.toeicTest.create({
      data: {
        title: "QUESTION_BANK_PART5",
        description: "Ngân hàng câu hỏi Part 5 tập trung.",
        isPublished: true
      }
    });
  }

  let part5 = await prisma.toeicPart.findFirst({
    where: { testId: currentTest.id, partNumber: 5 }
  });

  if (!part5) {
    part5 = await prisma.toeicPart.create({
      data: {
        testId: currentTest.id,
        partNumber: 5,
        title: "Part 5"
      }
    });
  }

  console.log("📖 [2/3] Đang đọc file Excel...");
  const filePath = path.join(process.cwd(), 'Part 5', 'PART 5.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet) as any[];

  console.log(`📦 Tìm thấy ${rows.length} câu hỏi. Bắt đầu nạp Deep Analysis...`);

  const BATCH_SIZE = 5;
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const currentBatchNum = i / BATCH_SIZE + 1;
    const progress = ((i / rows.length) * 100).toFixed(1);
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    console.log(`\n-----------------------------------------------------------`);
    console.log(`📊 TIẾN ĐỘ: ${progress}% [Batch ${currentBatchNum}/${totalBatches}]`);
    console.log(`🔄 Đang chuẩn bị gửi ${batch.length} câu sang AI...`);

    const rawTexts = batch.map(row => {
      return `${row.Question_No}. ${row.Question_EN}`;
    });

    try {
      console.log(`⏳ Đang đợi AI (Gemini) viết lời giải siêu chi tiết...`);
      const enrichedData = await processPart5Batch(rawTexts);
      console.log(`✨ AI đã phản hồi! Đang cập nhật Database (Câu ${i + 1} - ${Math.min(i + BATCH_SIZE, rows.length)})...`);

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const ai = enrichedData[j];
        if (!ai) continue;

        // Lưu Group
        const group = await prisma.toeicQuestionGroup.create({
          data: {
            partId: part5!.id,
            metadata: {
              day: row.Day,
              type: row.Question_Type,
              book: row.Book,
              test: row.Test,
              status: 'PUBLISHED'
            }
          }
        });

        // Lưu Question
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
              day: row.Day,
              type: row.Question_Type,
              book: row.Book,
              test: row.Test,
              translation: ai.translation,
              vocabulary: ai.vocabulary?.map((v: any) => v.word) || []
            }
          }
        });

        // Cập nhật Dictionary
        if (ai.vocabulary && Array.isArray(ai.vocabulary)) {
          for (const v of ai.vocabulary) {
            await prisma.dictionary.upsert({
              where: { word: v.word.toLowerCase() },
              update: {
                ipa: v.ipa,
                meaning: v.meaning,
                examples: v.examples,
                synonyms: Array.isArray(v.synonyms) ? v.synonyms : (v.synonyms ? [v.synonyms] : []),
                antonyms: Array.isArray(v.antonyms) ? v.antonyms : (v.antonyms ? [v.antonyms] : [])
              },
              create: {
                word: v.word.toLowerCase(),
                ipa: v.ipa,
                meaning: v.meaning,
                examples: v.examples,
                synonyms: Array.isArray(v.synonyms) ? v.synonyms : (v.synonyms ? [v.synonyms] : []),
                antonyms: Array.isArray(v.antonyms) ? v.antonyms : (v.antonyms ? [v.antonyms] : [])
              }
            });
          }
        }
      }
      console.log(`✅ Xử lý thành công batch ${i + 1}`);
    } catch (err: any) {
      console.error(`❌ Lỗi tại batch ${i + 1}:`, err.message);
      console.log("⏳ Nghỉ 10s trước khi thử lại...");
      await new Promise(r => setTimeout(r, 10000));
      i -= BATCH_SIZE;
    }
  }

  console.log("\n✨ [3/3] TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC NẠP THÀNH CÔNG VỚI LỜI GIẢI CHI TIẾT!");
}

fullIngestion()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
