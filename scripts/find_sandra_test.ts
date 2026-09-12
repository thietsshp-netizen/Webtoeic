import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const group = await prisma.toeicQuestionGroup.findUnique({
    where: { id: "cmsvoqcuwj25ko1g7ccg" }
  });
  if (!group) return;
  const part = await prisma.toeicPart.findUnique({
    where: { id: group.partId }
  });
  if (!part) return;
  const test = await prisma.toeicTest.findUnique({
    where: { id: part.testId }
  });
  if (!test) return;
  console.log(`Group belongs to Part ${part.partNumber} of Test: "${test.title}" (ID: ${test.id})`);
}

main().catch(console.error);
