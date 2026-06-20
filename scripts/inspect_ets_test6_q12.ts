import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const tests = await prisma.toeicTest.findMany({
      where: {
        title: {
          contains: '2026'
        }
      },
      include: {
        parts: {
          where: {
            partNumber: 2
          },
          include: {
            groups: {
              include: {
                questions: {
                  where: {
                    questionNo: 12
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Found ${tests.length} tests matching '2026'`);
    for (const test of tests) {
      console.log("\\n------------------------------------");
      console.log("Test Title:", test.title);
      console.log("Test ID:", test.id);
      
      const part2 = test.parts[0];
      if (part2 && part2.groups) {
        let found = false;
        for (const group of part2.groups) {
          if (group.questions.length > 0) {
            found = true;
            console.log("Group ID:", group.id);
            console.log("Audio URL:", group.audioUrl);
            for (const q of group.questions) {
              console.log("Question ID:", q.id);
              console.log("Question No:", q.questionNo);
              console.log("Question Text:", q.questionText);
              console.log("Option A:", q.optionA);
              console.log("Option B:", q.optionB);
              console.log("Option C:", q.optionC);
              console.log("Option D:", q.optionD);
              console.log("Correct Answer:", q.correctAnswer);
              console.log("Explanation:", q.explanation);
            }
          }
        }
        if (!found) {
          console.log("No Question 12 found in Part 2 of this test.");
        }
      } else {
        console.log("No Part 2 found in this test.");
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
