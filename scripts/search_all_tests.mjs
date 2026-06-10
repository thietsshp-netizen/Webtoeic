import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkOtherBooks() {
  try {
    const books = ["ETS2019", "ETS2022", "ETS2023", "ETS2024", "ETS2026"];
    
    for (const book of books) {
      console.log(`\n==================== ${book} ====================`);
      const tests = await prisma.toeicTest.findMany({
        where: {
          title: {
            contains: book
          },
          OR: [
            { title: { contains: "Test 1" } },
            { title: { contains: "Test 10" } }
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
      
      tests.forEach(test => {
        let totalQ = 0;
        test.parts.forEach(part => {
          part.groups.forEach(g => {
            totalQ += g.questions.length;
          });
        });
        console.log(`Title: "${test.title}" | ID: ${test.id} | Total: ${totalQ}`);
        test.parts.forEach(part => {
          let qCount = 0;
          part.groups.forEach(g => {
            qCount += g.questions.length;
          });
          console.log(`  - Part ${part.partNumber}: ${qCount} câu`);
        });
      });
    }

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkOtherBooks();
