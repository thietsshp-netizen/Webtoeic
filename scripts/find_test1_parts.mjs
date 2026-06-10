import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findParts() {
  try {
    const tests = await prisma.toeicTest.findMany({
      where: {
        title: {
          contains: "2020"
        }
      },
      include: {
        parts: true
      }
    });

    // Find exact Test 1
    const test1 = tests.find(t => t.title === "ETS2020 - Test 1");

    if (!test1) {
      console.log("❌ Không tìm thấy đề 'ETS2020 - Test 1'");
      return;
    }

    console.log(`=== ĐỀ: ${test1.title} (ID: ${test1.id}) ===`);
    test1.parts.forEach(p => {
      console.log(`- Part ${p.partNumber} ID: ${p.id}`);
    });

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

findParts();
