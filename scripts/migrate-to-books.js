const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration to 3-level hierarchy...');

  const courses = await prisma.course.findMany({
    include: {
      sections: true,
    },
  });

  for (const course of courses) {
    console.log(`Processing course: ${course.title} (${course.id})`);

    // 1. Create a default book for each course
    const defaultBook = await prisma.book.create({
      data: {
        title: 'Sách 1',
        courseId: course.id,
        order: 0,
      },
    });

    console.log(`  Created default book: ${defaultBook.title}`);

    // 2. Link all sections of this course to the new book
    if (course.sections.length > 0) {
      const result = await prisma.section.updateMany({
        where: {
          courseId: course.id,
        },
        data: {
          bookId: defaultBook.id,
        },
      });
      console.log(`  Updated ${result.count} sections to link to this book.`);
    }
  }

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
