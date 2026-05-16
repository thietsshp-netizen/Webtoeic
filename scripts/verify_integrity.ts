import { prisma } from "../src/lib/prisma";

async function main() {
  const courseCount = await prisma.course.count();
  const lessonCount = await prisma.lesson.count();
  const userCount = await prisma.user.count();
  
  console.log(`[DB STATUS] Courses: ${courseCount}, Lessons: ${lessonCount}, Users: ${userCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
