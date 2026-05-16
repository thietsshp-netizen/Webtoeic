import { prisma } from '../src/lib/prisma';

async function check() {
  const day = await prisma.vocabDay.findFirst();
  if (day) {
    const data = JSON.parse(day.dayNumber === 1 ? day.data : day.data); // just take first
    console.log(JSON.stringify(JSON.parse(day.data)[0], null, 2));
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
