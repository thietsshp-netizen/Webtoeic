import { prisma } from '../src/lib/prisma';

async function checkDistribution() {
  const questions = await prisma.toeicQuestion.findMany({
    where: {
      group: {
        part: {
          partNumber: 5,
          test: { title: 'QUESTION_BANK_PART5' }
        }
      }
    }
  });

  const days: Record<string, number> = {};
  const types: Record<string, number> = {};

  questions.forEach((q: any) => {
    const d = q.metadata?.day || 'None';
    const t = q.metadata?.type || 'None';
    days[d] = (days[d] || 0) + 1;
    types[t] = (types[t] || 0) + 1;
  });

  console.log('--- DAYS Distribution ---');
  Object.entries(days).sort().forEach(([k, v]) => console.log(`${k}: ${v} questions`));
  
  console.log('\n--- TYPES Distribution ---');
  Object.entries(types).sort().forEach(([k, v]) => console.log(`${k}: ${v} questions`));
}

checkDistribution().catch(console.error).finally(() => prisma.$disconnect());
