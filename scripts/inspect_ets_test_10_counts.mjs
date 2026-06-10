import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectTest10Counts() {
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
    
    // Thu thập tất cả câu hỏi
    const allQuestions = [];
    test.parts.forEach(part => {
      part.groups.forEach(group => {
        group.questions.forEach(q => {
          allQuestions.push({
            partNumber: part.partNumber,
            questionNo: q.questionNo,
            id: q.id,
            groupId: group.id,
            questionText: q.questionText,
            correctAnswer: q.correctAnswer
          });
        });
      });
    });

    console.log(`Tổng số câu hỏi: ${allQuestions.length}`);

    // Đếm số lượng câu hỏi theo từng part
    const partsMap = {};
    allQuestions.forEach(q => {
      partsMap[q.partNumber] = partsMap[q.partNumber] || [];
      partsMap[q.partNumber].push(q);
    });

    Object.keys(partsMap).forEach(partNumber => {
      const qList = partsMap[partNumber];
      console.log(`\n--- Part ${partNumber} có ${qList.length} câu ---`);
      
      // Tìm các số câu hỏi xuất hiện trong part này
      const noCounts = {};
      qList.forEach(q => {
        noCounts[q.questionNo] = (noCounts[q.questionNo] || 0) + 1;
      });

      const duplicates = Object.keys(noCounts).filter(no => noCounts[no] > 1);
      console.log(`Các số câu bị lặp: ${duplicates.join(", ") || "Không có"}`);
    });

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

inspectTest10Counts();
