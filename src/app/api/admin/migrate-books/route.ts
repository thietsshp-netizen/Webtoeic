import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log('--- Bắt đầu chuyển đổi dữ liệu sang 3 tầng (Sách - Chương - Bài) ---');

    // 1. Kiểm tra sự tồn tại của các model
    if (!prisma.course || !(prisma as any).book || !prisma.section) {
      throw new Error("Prisma client chưa cập nhật đầy đủ các model (Course, Book, Section). Hãy đợi vài giây rồi thử lại.");
    }

    const courses = await prisma.course.findMany({
      include: {
        sections: {
          orderBy: { order: 'asc' }
        },
      },
    });

    console.log(`Tìm thấy ${courses.length} khóa học.`);

    const results = [];

    for (const course of courses) {
      // 1. Kiểm tra xem khóa học này đã có Sách nào chưa
      const existingBooks = await (prisma as any).book.findMany({
        where: { courseId: course.id }
      });

      let targetBook;
      if (existingBooks.length === 0) {
        targetBook = await (prisma as any).book.create({
          data: {
            title: 'Sách 1',
            courseId: course.id,
            order: 0,
          },
        });
        console.log(`Đã tạo Sách 1 cho khóa học ${course.title}`);
      } else {
        targetBook = existingBooks[0];
        console.log(`Đã tìm thấy Sách cho khóa học ${course.title}: ${targetBook.title}`);
      }

      // 2. Cập nhật tất cả các Chương (Section) chưa có bookId của khóa học này
      const result = await prisma.section.updateMany({
        where: {
          courseId: course.id,
          bookId: null,
        },
        data: {
          bookId: targetBook.id,
        },
      });

      results.push({
        course: course.title,
        book: targetBook.title,
        sectionsUpdated: result.count
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
