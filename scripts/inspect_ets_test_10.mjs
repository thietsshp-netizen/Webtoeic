import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectTest10() {
  try {
    // 1. Tìm test
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

    console.log(`Tổng số câu hỏi thực tế trong DB cho đề này: ${allQuestions.length}`);

    // Đếm số câu hỏi theo từng Part
    const partCounts = {};
    allQuestions.forEach(q => {
      partCounts[q.partNumber] = (partCounts[q.partNumber] || 0) + 1;
    });
    console.log("\nSố lượng câu hỏi theo từng Part:");
    Object.keys(partCounts).forEach(partNum => {
      console.log(`- Part ${partNum}: ${partCounts[partNum]} câu`);
    });

    // Tìm các câu hỏi bị trùng số câu (questionNo) trong cùng một Part
    const duplicates = {};
    allQuestions.forEach(q => {
      const key = `Part ${q.partNumber} - Câu ${q.questionNo}`;
      if (!duplicates[key]) {
        duplicates[key] = [];
      }
      duplicates[key].push(q);
    });

    console.log("\nDanh sách các câu hỏi bị lặp hoặc có cùng số câu:");
    let duplicateCount = 0;
    Object.keys(duplicates).forEach(key => {
      if (duplicates[key].length > 1) {
        duplicateCount++;
        console.log(`\n🚨 ${key} bị lặp ${duplicates[key].length} lần:`);
        duplicates[key].forEach((q, idx) => {
          console.log(`  [Lần ${idx + 1}] ID: ${q.id}, GroupId: ${q.groupId}, Text: ${q.questionText || "(Trống)"}, Đáp án: ${q.correctAnswer}`);
        });
      }
    });

    if (duplicateCount === 0) {
      console.log("Không có câu hỏi nào trùng số câu (questionNo).");
    }

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

inspectTest10();
