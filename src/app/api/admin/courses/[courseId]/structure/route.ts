import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API Reorder cấu trúc khóa học khi User Drag & Drop
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await req.json();
    const { list } = body; 
    // list format: [{ id: "section1", order: 0, lessons: [{ id: "lesson1", order: 0 }, { id: "lesson2", order: 1 }] }]

    if (!list || !Array.isArray(list)) {
       return NextResponse.json({ error: "Tham số list không hợp lệ" }, { status: 400 });
    }

    // Khởi tạo 1 Transaction (Thành công hết hoặc Rollback)
    await prisma.$transaction(async (tx) => {
      for (const section of list) {
        // Cập nhật vị trí của Section
        await tx.section.update({
          where: { id: section.id },
          data: { order: section.order }
        });

        // Cập nhật vị trí các Lesson bên trong Section đó
        if (section.lessons && Array.isArray(section.lessons)) {
          for (const lesson of section.lessons) {
             await tx.lesson.update({
               where: { id: lesson.id },
               data: { order: lesson.order, sectionId: section.id } // Update cả sectionId lỡ kéo từ phần này sang phần kia
             });
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: "Cập nhật cấu trúc khoá học thành công" });
  } catch (error) {
    console.error('[COURSE_STRUCTURE_PUT]', error);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật mảng Dnd" }, { status: 500 });
  }
}
