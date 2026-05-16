require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("LỖI: Không tìm thấy DATABASE_URL trong .env");
    return;
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const tests = await prisma.toeicTest.findMany({
    include: {
      parts: {
        include: {
          groups: {
            include: { questions: true }
          }
        }
      }
    }
  });
  
  console.log("=== THỐNG KÊ DỮ LIỆU TOEIC ===");
  tests.forEach(t => {
    console.log(`\nBộ đề: ${t.title}`);
    const partCounts = {};
    t.parts.forEach(p => {
      let qCount = 0;
      p.groups.forEach(g => qCount += g.questions.length);
      partCounts[p.partNumber] = qCount;
    });
    for(let i=1; i<=7; i++) {
      console.log(`- Part ${i}: ${partCounts[i] || 0} câu`);
    }
    const isFull = [1,2,3,4,5,6,7].every(p => (partCounts[p] || 0) > 0);
    console.log(`=> Trạng thái: ${isFull ? "ĐỦ 7 PART (Làm được Full Test)" : "THIẾU DỮ LIỆU"}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
