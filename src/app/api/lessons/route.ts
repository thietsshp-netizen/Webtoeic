import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// [POST] Thêm một Bài học (Lesson) mới vào một Chương
export async function POST(req: Request) {
  try {
    const { sectionId, title, contentType, order } = await req.json();

    // Lưu bài học mới bằng Prisma
    const lesson = await prisma.lesson.create({
      data: {
        sectionId,
        title: title || "Bài học mới",
        contentType: contentType || "TEXT",
        order: order || 0
      }
    });

    // Trả về Object bài học chứa ID thực từ Database
    return NextResponse.json(lesson);
  } catch (error: any) {
    console.error("API Lesson POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// [PUT] Cập nhật vị trí bài học (Drag & Drop)
export async function PUT(req: Request) {
  try {
    const { lessons } = await req.json(); // Nhận danh sách bài học đã sắp xếp
    
    if (!lessons || !Array.isArray(lessons)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Cập nhật vị trí (order) hoặc cha (sectionId) cho từng bài học bằng Prisma transaction
    const updates = lessons.map((l: any, idx: number) => 
      prisma.lesson.update({
        where: { id: l.id },
        data: { 
          order: idx,
          sectionId: l.sectionId // Thêm hỗ trợ cập nhật sectionId nếu có
        }
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// [DELETE] Xóa một hoặc nhiều bài học
/* 
  LƯU Ý QUAN TRỌNG: TUYỆT ĐỐI KHÔNG xóa các file vật lý (.html, .pdf, .mp4, ...) khi xóa bài học.
  Giữ lại file để tránh ảnh hưởng đến các khóa học khác có thể đang dùng chung tài liệu này. 
  Chỉ xóa liên kết trong Database (Reference).
*/
export async function DELETE(req: Request) {

  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Tham số 'ids' không hợp lệ" }, { status: 400 });
    }

    await prisma.lesson.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({ success: true, message: "Đã xóa bài học thành công (Giữ nguyên file gốc)" });
  } catch (error: any) {
    console.error('[LESSONS_DELETE_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



