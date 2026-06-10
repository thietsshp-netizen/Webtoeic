import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectAllParts() {
  try {
    const test = await prisma.toeicTest.findFirst({
      where: {
        title: {
          contains: "2020",
        },
        OR: [
          { title: { contains: "Test 10" } },
          { title: { contains: "T10" } }
        ]
      },
      include: {
        parts: {
          include: {
            groups: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    });

    if (!test) {
      console.log("❌ Không tìm thấy đề '2020 - Test 10'");
      return;
    }

    console.log(`=== ĐỀ: ${test.title} (ID: ${test.id}) ===`);
    console.log(`Số lượng Part có trong đề này: ${test.parts.length}`);
    
    test.parts.forEach(part => {
      let qCount = 0;
      part.groups.forEach(g => {
        qCount += g.questions.length;
      });
      console.log(`- Part ${part.partNumber} (ID: ${part.id}): có ${part.groups.length} groups, tổng ${qCount} câu hỏi.`);
    });

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

inspectAllParts();
