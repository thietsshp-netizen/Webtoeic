import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function simulateLoader() {
  try {
    // 1. Tìm test
    const toeicTestId = "full-test-ets2020-t10"; // or look up by title
    let dbTest = await prisma.toeicTest.findFirst({
      where: {
        OR: [
          { id: toeicTestId },
          { id: toeicTestId.replace("full-test-", "") }
        ]
      },
      include: {
        parts: {
          orderBy: { partNumber: 'asc' },
          include: {
            groups: {
              include: { questions: { orderBy: { questionNo: 'asc' } } }
            }
          }
        }
      }
    });

    if (!dbTest) {
      console.log("❌ Không tìm thấy test!");
      return;
    }

    console.log(`dbTest tìm thấy: ${dbTest.title} (ID: ${dbTest.id})`);

    // Phân tích cấu hình book/test
    const parts = toeicTestId.split("-");
    let book = parts[2]?.toUpperCase() || "";
    let test = parts[3]?.replace("t", "") || "";

    const title = dbTest.title.toUpperCase();
    const bookMatch = title.match(/(ETS\s*\d+|NEW\s*ECONOMY|HACKERS)/i);
    const testMatch = title.match(/TEST\s*(\d+)/i);

    const targetBook = bookMatch ? bookMatch[0].toUpperCase().replace(/[\s\-_]/g, "") : book.toUpperCase().replace(/[\s\-_]/g, "");
    const targetTestNum = testMatch ? testMatch[1] : test;
    const targetTestNumInt = parseInt(targetTestNum || "0");

    console.log(`targetBook: ${targetBook}, targetTestNum: ${targetTestNum}, targetTestNumInt: ${targetTestNumInt}`);

    const mainKeyword = targetBook.match(/[A-Z]{3,}/i)?.[0] || targetBook.substring(0, 3);
    console.log(`mainKeyword dùng để search metadata: ${mainKeyword}`);

    // Tìm trong Database
    const allGroups = await prisma.toeicQuestionGroup.findMany({
      where: {
        OR: [
          { metadata: { path: ['Book'], string_contains: mainKeyword } },
          { metadata: { path: ['book'], string_contains: mainKeyword } },
          { passageText: { contains: mainKeyword, mode: 'insensitive' } }
        ]
      },
      include: {
        questions: { orderBy: { questionNo: 'asc' } },
        part: true
      }
    });

    console.log(`Tìm thấy tất cả ${allGroups.length} groups từ metadata lỏng.`);

    const normalizedTargetBook = targetBook.toUpperCase().replace(/[\s\-_]/g, "");
    const aggregatedData = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    const seenGroupIds = new Set();

    let matchedGroupsCount = 0;
    allGroups.forEach((g) => {
      const m = g.metadata;
      if (!m) return;

      let gBook = "";
      let gTest = "";
      try {
        const mObj = typeof m === 'string' ? JSON.parse(m) : m;
        gBook = String(mObj.Book || mObj.book || "");
        gTest = String(mObj.Test || mObj.test || "");
      } catch (e) { }

      const cleanGBook = gBook.toUpperCase().replace(/[\s\-_]/g, "");
      const cleanGTestNum = gTest.toUpperCase().match(/\d+/)?.[0] || "0";
      const gTestNumInt = parseInt(cleanGTestNum);

      const isBookMatch = normalizedTargetBook !== "" && (cleanGBook.includes(normalizedTargetBook) || normalizedTargetBook.includes(cleanGBook));
      const isTestMatch = targetTestNumInt > 0 && gTestNumInt === targetTestNumInt;

      if (isBookMatch && isTestMatch) {
        matchedGroupsCount++;
        if (seenGroupIds.has(g.id)) return;
        seenGroupIds.add(g.id);

        let pNum = g.part?.partNumber || 0;
        if (pNum === 0 && g.questions?.length > 0) {
          const qNo = g.questions[0].questionNo;
          if (qNo >= 1 && qNo <= 6) pNum = 1;
          else if (qNo >= 7 && qNo <= 31) pNum = 2;
          else if (qNo >= 32 && qNo <= 70) pNum = 3;
          else if (qNo >= 71 && qNo <= 100) pNum = 4;
          else if (qNo >= 101 && qNo <= 130) pNum = 5;
          else if (qNo >= 131 && qNo <= 146) pNum = 6;
          else if (qNo >= 147 && qNo <= 200) pNum = 7;
        }

        if (pNum >= 1 && pNum <= 7) {
          aggregatedData[pNum].push(g);
        }
      }
    });

    console.log(`Số groups khớp Book & Test qua Metadata: ${matchedGroupsCount}`);

    // Nạp thêm dữ liệu từ quan hệ Database truyền thống
    dbTest.parts.forEach(p => {
      const pNum = p.partNumber;
      if (pNum >= 1 && pNum <= 7) {
        p.groups.forEach(group => {
          if (seenGroupIds.has(group.id)) return;
          seenGroupIds.add(group.id);
          aggregatedData[pNum].push(group);
        });
      }
    });

    console.log("\nSau khi gộp cả 2 nguồn nạp:");
    let totalQuestions = 0;
    [1, 2, 3, 4, 5, 6, 7].forEach(pNum => {
      let partQCount = 0;
      aggregatedData[pNum].forEach(g => {
        partQCount += g.questions?.length || 0;
      });
      totalQuestions += partQCount;
      console.log(`- Part ${pNum}: có ${aggregatedData[pNum].length} groups, tổng ${partQCount} câu hỏi.`);
      
      // Liệt kê chi tiết nguồn gốc từng group trong Part
      console.log(`  Chi tiết các Group trong Part ${pNum}:`);
      aggregatedData[pNum].forEach((g, idx) => {
        const metadataBook = g.metadata?.Book || g.metadata?.book || "N/A";
        const metadataTest = g.metadata?.Test || g.metadata?.test || "N/A";
        console.log(`    [Group ${idx + 1}] ID: ${g.id}, QNo đầu: ${g.questions?.[0]?.questionNo}, số câu: ${g.questions?.length}, Metadata: {Book: "${metadataBook}", Test: "${metadataTest}"}`);
      });
    });

    console.log(`\n=> TỔNG CỘNG CÓ: ${totalQuestions} CÂU HỎI TRONG UI!`);

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

simulateLoader();
