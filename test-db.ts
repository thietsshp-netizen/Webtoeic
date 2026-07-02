import { prisma } from './src/lib/prisma';
async function main() {
  const count = await prisma.lesson.count();
  console.log("Lesson count:", count);
  const lessons = await prisma.lesson.findMany({ take: 5 });
  console.log("Sample lessons:", lessons.map(l => ({ id: l.id, title: l.title })));
}
main();
