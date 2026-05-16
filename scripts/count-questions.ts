import { prisma } from './src/lib/prisma';
async function main() {
  const count = await prisma.toeicQuestion.count({
    where: { group: { part: { partNumber: 5 } } }
  });
  console.log('REAL_PART5_COUNT:', count);
}
main().finally(() => prisma.$disconnect());
