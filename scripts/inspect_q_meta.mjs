import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const qs = await prisma.toeicQuestion.findMany({
    where: { group: { part: { partNumber: 7 } } },
    take: 3,
    select: { questionNo: true, metadata: true }
  });
  console.log(JSON.stringify(qs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
