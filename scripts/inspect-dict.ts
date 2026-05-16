import { prisma } from '../src/lib/prisma';

async function check() {
  const entries = await prisma.dictionary.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' }
  });
  
  if (entries.length === 0) {
    console.log('No entries found.');
    return;
  }

  console.log('--- Sample Entries ---');
  entries.forEach((e, idx) => {
    console.log(`${idx + 1}. Word: ${e.word} | CreatedAt: ${e.createdAt}`);
    if (idx < 5) {
      console.log('   Meaning:', e.meaning);
      console.log('   Examples Count:', (e.examples as any[]).length);
    }
  });

  const oldest = await prisma.dictionary.findMany({
    take: 1,
    orderBy: { createdAt: 'asc' }
  });
  if (oldest.length > 0) {
    console.log('\nOldest entry created at:', oldest[0].createdAt);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
