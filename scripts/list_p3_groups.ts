import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Querying all groups in Test 1 Part 3...");
  const test = await prisma.toeicTest.findFirst({
    where: {
      title: {
        contains: "2020 - Test 1"
      }
    }
  });

  if (!test) {
    console.log("Test not found!");
    return;
  }

  const part = await prisma.toeicPart.findFirst({
    where: {
      testId: test.id,
      partNumber: 3
    }
  });

  if (!part) {
    console.log("Part 3 not found!");
    return;
  }

  const groups = await prisma.toeicQuestionGroup.findMany({
    where: {
      partId: part.id
    },
    include: {
      questions: true
    }
  });

  console.log(`Found ${groups.length} groups in Part 3.`);
  groups.forEach(g => {
    console.log(`- ID: ${g.id}, AudioID: ${g.audioUrl}, QuestionRange: ${g.questions.map(q => q.questionNo).join(', ')}`);
  });
}

main().catch(console.error);
