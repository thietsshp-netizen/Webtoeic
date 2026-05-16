import { prisma } from '../src/lib/prisma';

async function check() {
  const count = await prisma.dictionary.count();
  console.log('Total dictionary entries:', count);
}

check().catch(console.error).finally(() => prisma.$disconnect());
