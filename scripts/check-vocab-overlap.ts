import { prisma } from '../src/lib/prisma';

async function checkOverlap() {
  const days = await prisma.vocabDay.findMany();
  let vocabWords: string[] = [];
  
  days.forEach(d => {
    try {
      const data = JSON.parse(d.data);
      if (Array.isArray(data)) {
        data.forEach((v: any) => {
          if (v.word) vocabWords.push(v.word.toLowerCase().trim());
        });
      }
    } catch (e) {}
  });

  const uniqueVocabWords = Array.from(new Set(vocabWords));
  
  const intersection = await prisma.dictionary.count({
    where: {
      word: { in: uniqueVocabWords }
    }
  });

  const totalDict = await prisma.dictionary.count();

  console.log('--- PHÂN TÍCH TRÙNG LẶP ---');
  console.log('Tổng số từ trong 30 Ngày Từ Vựng:', uniqueVocabWords.length);
  console.log('Số từ trùng lặp đã có trong Từ điển (Dictionary):', intersection);
  console.log('Tổng số từ hiện có trong Từ điển (Dictionary):', totalDict);
}

checkOverlap().catch(console.error).finally(() => prisma.$disconnect());
