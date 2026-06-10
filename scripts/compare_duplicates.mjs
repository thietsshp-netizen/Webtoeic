import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function compareDuplicates() {
  try {
    const testId = "cmopif7eq0000znaek3i5tmtz"; // ETS2020 - Test 10
    const parts = await prisma.toeicPart.findMany({
      where: { testId },
      include: {
        groups: {
          include: {
            questions: {
              orderBy: { questionNo: 'asc' }
            }
          }
        }
      }
    });

    console.log("=== PHÂN TÍCH NHÓM CÂU HỎI TRÙNG LẶP (PART 3 & PART 4) ===");
    
    parts.forEach(part => {
      if (part.partNumber === 3 || part.partNumber === 4) {
        console.log(`\n--- PART ${part.partNumber} ---`);
        
        // Group by starting question number
        const groupsByQNo = {};
        part.groups.forEach(g => {
          const qNo = g.questions?.[0]?.questionNo;
          if (qNo !== undefined) {
            if (!groupsByQNo[qNo]) groupsByQNo[qNo] = [];
            groupsByQNo[qNo].push(g);
          }
        });

        Object.keys(groupsByQNo).forEach(qNo => {
          const list = groupsByQNo[qNo];
          if (list.length > 1) {
            const g1 = list[0];
            const g2 = list[1];
            
            const g1Test = g1.audioUrl?.includes("TEST_01") ? "TEST 01 (RÁC)" : (g1.audioUrl?.includes("TEST_10") ? "TEST 10 (ĐÚNG)" : "KHÔNG RÕ");
            const g2Test = g2.audioUrl?.includes("TEST_01") ? "TEST 01 (RÁC)" : (g2.audioUrl?.includes("TEST_10") ? "TEST 10 (ĐÚNG)" : "KHÔNG RÕ");

            console.log(`Câu ${qNo}:`);
            console.log(`  - Nhóm 1: ID = ${g1.id} | Audio: ${g1.audioUrl?.substring(g1.audioUrl?.lastIndexOf('/') + 1)} -> Nguồn gốc: ${g1Test}`);
            console.log(`  - Nhóm 2: ID = ${g2.id} | Audio: ${g2.audioUrl?.substring(g2.audioUrl?.lastIndexOf('/') + 1)} -> Nguồn gốc: ${g2Test}`);
          }
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

compareDuplicates();
