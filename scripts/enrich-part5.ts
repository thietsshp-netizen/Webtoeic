import { prisma } from '../src/lib/prisma';
import { processPart5Batch } from '../src/lib/gemini';

async function enrichment() {
  console.log("🚀 [DEEP ANALYSIS] Bắt đầu quy trình làm giàu dữ liệu Part 5...");

  const questions = await prisma.toeicQuestion.findMany({
    where: {
      group: {
        part: {
          test: { title: 'QUESTION_BANK_PART5' }
        }
      }
    },
    select: {
      id: true,
      questionNo: true,
      questionText: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
      correctAnswer: true,
      metadata: true
    },
    orderBy: { questionNo: 'asc' }
  });

  console.log(`📦 Tìm thấy ${questions.length} câu hỏi cần được nâng cấp.`);

  const BATCH_SIZE = 5; 
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    console.log(`\n🔄 [${i + 1}/${questions.length}] Đang xử lý batch...`);

    const rawTexts = batch.map(q => {
      return `${q.questionNo}. ${q.questionText} (A) ${q.optionA} (B) ${q.optionB} (C) ${q.optionC} (D) ${q.optionD}`;
    });

    try {
      const enrichedData = await processPart5Batch(rawTexts);

      for (let j = 0; j < batch.length; j++) {
        const q = batch[j];
        const ai = enrichedData[j];

        if (!ai) continue;

        // 1. Cập nhật câu hỏi
        await prisma.toeicQuestion.update({
          where: { id: q.id },
          data: {
            explanation: JSON.stringify(ai.explanation),
            metadata: {
              ...(q.metadata as any),
              translation: ai.translation,
              vocabulary: ai.vocabulary?.map((v: any) => v.word) || []
            }
          }
        });

        // 2. Làm giàu Dictionary (Từ vựng tiêu điểm)
        if (ai.vocabulary && Array.isArray(ai.vocabulary)) {
          for (const v of ai.vocabulary) {
             const synonyms = Array.isArray(v.synonyms) ? v.synonyms : (v.synonyms ? v.synonyms.split(',').map((s: string) => s.trim()) : []);
             const antonyms = Array.isArray(v.antonyms) ? v.antonyms : (v.antonyms ? v.antonyms.split(',').map((a: string) => a.trim()) : []);
             
             await prisma.dictionary.upsert({
                where: { word: v.word.toLowerCase() },
                update: {
                   ipa: v.ipa,
                   meaning: v.meaning,
                   examples: v.examples,
                   synonyms,
                   antonyms
                },
                create: {
                   word: v.word.toLowerCase(),
                   ipa: v.ipa,
                   meaning: v.meaning,
                   examples: v.examples,
                   synonyms,
                   antonyms
                }
             });
          }
        }
      }
      console.log(`✅ Hoàn thành batch câu ${i + 1}`);
    } catch (err: any) {
      console.error(`❌ Lỗi tại batch ${i + 1}:`, err.message);
      console.log("⏳ Nghỉ 10s trước khi thử lại...");
      await new Promise(r => setTimeout(r, 10000));
      i -= BATCH_SIZE; 
    }
  }

  console.log("\n✨ HOÀN TẤT: TOÀN BỘ CÂU HỎI ĐÃ CÓ LỜI GIẢI SIÊU CHI TIẾT!");
}

enrichment()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
