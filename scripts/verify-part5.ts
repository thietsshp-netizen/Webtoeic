import { prisma } from '../src/lib/prisma';

async function verify() {
  const count = await prisma.toeicQuestion.count({
    where: {
      group: {
        part: {
          partNumber: 5,
          test: { title: 'QUESTION_BANK_PART5' }
        }
      }
    }
  });

  console.log('Total Part 5 questions:', count);

  const sample = await prisma.toeicQuestion.findFirst({
    where: {
      group: {
        part: {
          partNumber: 5,
          test: { title: 'QUESTION_BANK_PART5' }
        }
      }
    },
    include: { group: true }
  });

  if (sample) {
    console.log('Sample metadata:', JSON.stringify(sample.metadata, null, 2));
    console.log('Sample explanation:', sample.explanation ? 'Exists' : 'Missing');
  } else {
    console.log('No sample found!');
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
