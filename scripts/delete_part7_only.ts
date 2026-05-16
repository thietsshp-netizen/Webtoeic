import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 MANDATORY CLEANUP: Deleting ALL Part 7 data before re-seed...");
  
  const part7 = await prisma.toeicPart.findFirst({ where: { partNumber: 7 } });
  if (part7) {
    // Delete all groups for Part 7 (this cascades to questions)
    const deletedGroups = await prisma.toeicQuestionGroup.deleteMany({
      where: { partId: part7.id }
    });
    console.log(`✅ SUCCESS: Deleted ${deletedGroups.count} question groups for Part 7.`);
  } else {
    // If Part 7 doesn't exist under a specific test, check across all tests
    const allPart7s = await prisma.toeicPart.findMany({ where: { partNumber: 7 } });
    let totalDeleted = 0;
    for (const p of allPart7s) {
      const deleted = await prisma.toeicQuestionGroup.deleteMany({ where: { partId: p.id } });
      totalDeleted += deleted.count;
    }
    console.log(`✅ SUCCESS: Deleted ${totalDeleted} question groups across ${allPart7s.length} Part 7 entries.`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
