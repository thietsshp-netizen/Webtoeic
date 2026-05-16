import { prisma } from '../src/lib/prisma';

async function checkCompleteness() {
  const total = await prisma.dictionary.count();
  
  // Lấy mẫu 100 từ bất kỳ
  const sample = await prisma.dictionary.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' }
  });

  let hasIpa = 0;
  let hasMeaning = 0;
  let hasExamples = 0;
  let hasSynonyms = 0;

  sample.forEach(e => {
    if (e.ipa || e.ipa_uk || e.ipa_us) hasIpa++;
    if (e.meaning && e.meaning.trim() !== '') hasMeaning++;
    if (Array.isArray(e.examples) && (e.examples as any[]).length > 0) hasExamples++;
    if (Array.isArray(e.synonyms) && e.synonyms.length > 0) hasSynonyms++;
  });

  console.log(`Kiểm tra mẫu ${sample.length} từ trên tổng số ${total} từ:`);
  console.log(`- Có phiên âm: ${hasIpa}/${sample.length}`);
  console.log(`- Có nghĩa: ${hasMeaning}/${sample.length}`);
  console.log(`- Có ví dụ: ${hasExamples}/${sample.length}`);
  console.log(`- Có từ đồng nghĩa: ${hasSynonyms}/${sample.length}`);

  // Kiểm tra riêng nhóm từ cũ (trước hôm nay)
  const todayStart = new Date('2026-04-14T17:00:00Z');
  const oldSample = await prisma.dictionary.findMany({
    where: { createdAt: { lt: todayStart } },
    take: 50
  });

  if (oldSample.length > 0) {
    let oldHasEx = 0;
    oldSample.forEach(e => {
      if (Array.isArray(e.examples) && (e.examples as any[]).length > 0) oldHasEx++;
    });
    console.log(`\nKiểm tra riêng mẫu ${oldSample.length} từ CŨ (trước hôm nay):`);
    console.log(`- Có ví dụ: ${oldHasEx}/${oldSample.length}`);
  }
}

checkCompleteness().catch(console.error).finally(() => prisma.$disconnect());
