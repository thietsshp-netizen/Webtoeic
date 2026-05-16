import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const groups = await prisma.toeicQuestionGroup.findMany({
    where: { part: { partNumber: 7 } },
    take: 2,
    select: { id: true, passageText: true }
  });
  
  for (const g of groups) {
    console.log(`\n--- GROUP ID: ${g.id} ---`);
    try {
      const parsed = JSON.parse(g.passageText);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(g.passageText);
    }
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
