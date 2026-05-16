import { prisma } from "../src/lib/prisma";

async function main() {
  const count = await prisma.questionAttempt.count();
  console.log("Total QuestionAttempt records in DB:", count);
  
  const testCount = await prisma.fullTestAttempt.count();
  console.log("Total FullTestAttempt records in DB:", testCount);

  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  console.log("Users:", users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
