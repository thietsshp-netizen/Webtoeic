const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('--- Đang bắt đầu quá trình dọn dẹp hệ thống ---');
  
  try {
    // 1. Xóa các Lesson có ID chứa 'temp'
    const deletedLessons = await prisma.lesson.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'temp' } },
          { id: { contains: 'temp' } }
        ]
      }
    });
    console.log(`✅ Đã xóa ${deletedLessons.count} bài học lỗi.`);

    // 2. Xóa các Section có ID chứa 'temp'
    const deletedSections = await prisma.section.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'temp' } },
          { id: { contains: 'temp' } }
        ]
      }
    });
    console.log(`✅ Đã xóa ${deletedSections.count} chương lỗi.`);

    console.log('--- Chúc mừng! Hệ thống của bạn đã sạch đẹp ---');
  } catch (error) {
    console.error('❌ Lỗi khi dọn dẹp:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
