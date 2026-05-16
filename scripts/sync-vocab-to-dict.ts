import { prisma } from '../src/lib/prisma';

async function syncVocabToDict() {
  console.log("🚀 Bắt đầu đồng bộ từ vựng 30 ngày vào Từ điển chung...");

  const days = await prisma.vocabDay.findMany();
  let newWordsCount = 0;
  let skippedWordsCount = 0;

  for (const day of days) {
    let vocabData: any[];
    try {
      vocabData = JSON.parse(day.data);
    } catch (e) {
      console.error(`❌ Lỗi parse JSON Day ${day.dayNumber}`);
      continue;
    }

    if (!Array.isArray(vocabData)) continue;

    for (const item of vocabData) {
      const wordClean = item.word?.toLowerCase().trim();
      if (!wordClean) continue;

      // Kiểm tra xem từ đã tồn tại trong Dictionary chưa
      const existing = await prisma.dictionary.findUnique({
        where: { word: wordClean }
      });

      if (existing) {
        // Đã có từ Part 5 hoặc nguồn khác -> Giữ nguyên theo ý USER
        skippedWordsCount++;
        continue;
      }

      // Chưa có -> Nạp mới hoàn toàn từ bộ 30 ngày
      const examples = [];
      if (item.ex) {
        examples.push({ en: item.ex, vi: item.exVi || "" });
      }

      try {
        await prisma.dictionary.create({
          data: {
            word: wordClean,
            ipa: item.ipa || "",
            meaning: item.mean || "",
            examples: examples,
            synonyms: Array.isArray(item.syns) ? item.syns : (item.syns ? [item.syns] : []),
            antonyms: []
          }
        });
        newWordsCount++;
      } catch (err: any) {
        console.error(`❌ Lỗi khi nạp từ "${wordClean}":`, err.message);
      }
    }
    console.log(`✅ Đã xong Day ${day.dayNumber}`);
  }

  console.log(`\n✨ HOÀN THÀNHĐỒNG BỘ:`);
  console.log(`- Số từ mới nạp thêm: ${newWordsCount}`);
  console.log(`- Số từ đã có (giữ nguyên): ${skippedWordsCount}`);
  
  const finalTotal = await prisma.dictionary.count();
  console.log(`- Tổng số từ hiện có trong Từ điển: ${finalTotal}`);
}

syncVocabToDict().catch(console.error).finally(() => prisma.$disconnect());
