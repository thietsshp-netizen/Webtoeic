const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu chuyển đổi dữ liệu sang 3 tầng (Sách - Chương - Bài) ---');

  try {
    // 1. Lấy danh sách các khóa học hiện có
    const courses = await prisma.course.findMany({
      include: {
        sections: {
          orderBy: { order: 'asc' }
        },
      },
    });

    for (const course of courses) {
      console.log(`Đang xử lý khóa học: "${course.title}" (ID: ${course.id})`);

      // Kiểm tra xem khóa học này đã có Sách nào chưa
      const existingBooks = await prisma.book.findMany({
        where: { courseId: course.id }
      });

      let targetBook;
      if (existingBooks.length === 0) {
        // Nếu chưa có, tạo một Sách mặc định
        targetBook = await prisma.book.create({
          data: {
            title: 'Sách mặc định',
            courseId: course.id,
            order: 0,
          },
        });
        console.log(`  -> Đã tạo Sách mặc định cho khóa học này.`);
      } else {
        targetBook = existingBooks[0];
        console.log(`  -> Đã tìm thấy Sách hiện có: "${targetBook.title}"`);
      }

      // 2. Cập nhật tất cả các Chương (Section) chưa có bookId của khóa học này
      const result = await prisma.section.updateMany({
        where: {
          courseId: course.id,
          bookId: null, // Chỉ cập nhật những chương chưa có Sách
        },
        data: {
          bookId: targetBook.id,
        },
      });

      console.log(`  -> Đã liên kết ${result.count} chương vào Sách.`);
    }

    console.log('--- Chuyển đổi hoàn tất thành công! ---');
  } catch (error) {
    console.error('Lỗi trong quá trình chuyển đổi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
