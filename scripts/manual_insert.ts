import { prisma } from "../src/lib/prisma";

async function main() {
  const userId = "cmnqdqtov0000rraexfvqldj3";
  console.log("Manually inserting test record for user:", userId);

  try {
    const attempt = await prisma.fullTestAttempt.create({
      data: {
        userId,
        testId: "MANUAL_TEST",
        lcScore: 5,
        rcScore: 5,
        totalScore: 10,
        correctCount: 2,
        incorrectCount: 198,
        unansweredCount: 0,
        timeSpent: 3600
      }
    });
    console.log("Success! Created record ID:", attempt.id);
  } catch (e) {
    console.error("Failed to create manual record:", e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
