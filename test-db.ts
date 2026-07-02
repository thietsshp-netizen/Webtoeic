import { prisma } from './src/lib/prisma';
async function main() {
  const lessons = await prisma.lesson.findMany({
    where: {
      title: {
        contains: 'Text-'
      }
    }
  });

  console.log(`Found ${lessons.length} lessons:`);
  lessons.forEach(l => {
    console.log(`- ID: ${l.id}`);
    console.log(`  Title: ${l.title}`);
    console.log(`  ContentType: ${l.contentType}`);
    console.log(`  Content:`, l.content);
  });
}
main();
