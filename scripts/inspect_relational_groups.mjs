import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectRelationalGroups() {
  try {
    const testId = "cmopif7eq0000znaek3i5tmtz"; // ETS2020 - Test 10
    const parts = await prisma.toeicPart.findMany({
      where: { testId },
      include: {
        groups: {
          include: {
            questions: true
          }
        }
      }
    });

    parts.forEach(part => {
      if (part.partNumber === 3 || part.partNumber === 4) {
        console.log(`\n=== Relational Groups in Part ${part.partNumber} ===`);
        part.groups.forEach((g, idx) => {
          console.log(`  [Group ${idx + 1}] ID: ${g.id}, QNo đầu: ${g.questions?.[0]?.questionNo}, số câu: ${g.questions?.length}`);
        });
      }
    });

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

inspectRelationalGroups();
