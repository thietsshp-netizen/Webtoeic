const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.userVocabulary.count();
    console.log('Total user vocabularies:', count);
    const samples = await prisma.userVocabulary.findMany({ take: 5 });
    console.log('Samples:', JSON.stringify(samples, null, 2));
  } catch (e) {
    console.error('Error checking:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
