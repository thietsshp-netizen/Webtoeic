const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const book = 'ETS2026';
  const test = '9';
  
  console.log(`Checking data for Book: ${book}, Test: ${test}...`);

  const allGroups = await prisma.toeicQuestionGroup.findMany({
    where: {
      part: { partNumber: 7 }
    }
  });

  const filtered = allGroups.filter(g => {
    const meta = g.metadata;
    const matchBook = (meta.book === book || meta.de === book);
    const matchTest = String(meta.test) === test;
    return matchBook && matchTest;
  });

  console.log(`Found ${filtered.length} groups matching Test ${test}`);
  filtered.forEach(g => {
    console.log(`- ID: ${g.id}, Range: ${g.metadata.range}, Test: ${g.metadata.test}, Book: ${g.metadata.book || g.metadata.de}`);
  });

  const ets2026Groups = allGroups.filter(g => (g.metadata.book === book || g.metadata.de === book));
  console.log(`Total groups for ${book}: ${ets2026Groups.length}`);

}

main().catch(console.error).finally(() => prisma.$disconnect());
