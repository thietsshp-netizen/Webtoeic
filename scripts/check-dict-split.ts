import { prisma } from '../src/lib/prisma';

async function check() {
  const total = await prisma.dictionary.count();
  
  // Today started at 2026-04-15 00:00:00 ICT (2026-04-14 17:00:00 UTC)
  const todayStart = new Date('2026-04-14T17:00:00Z');
  
  const createdToday = await prisma.dictionary.count({
    where: { createdAt: { gte: todayStart } }
  });
  
  const beforeToday = await prisma.dictionary.count({
    where: { createdAt: { lt: todayStart } }
  });

  console.log('Total entries:', total);
  console.log('Created during this session (today):', createdToday);
  console.log('Created before this session:', beforeToday);
}

check().catch(console.error).finally(() => prisma.$disconnect());
