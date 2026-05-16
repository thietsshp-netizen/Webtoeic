import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const sections = await prisma.section.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        }
      }
    });
    return NextResponse.json(sections);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    // Kiểm tra Course có tồn tại không
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const { title, order, bookId } = await req.json();

    // Lưu Section bằng Prisma
    const section = await prisma.section.create({
      data: {
        courseId,
        title,
        order: order || 0,
        bookId: bookId || undefined
      }
    });

    // Trả về Object chứa ID thật từ Database
    return NextResponse.json(section);
  } catch (error: any) {
    console.error("API Section Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// [DELETE] Xóa một hoặc nhiều chương
/* 
  LƯU Ý QUAN TRỌNG: TUYỆT ĐỐI KHÔNG xóa các file vật lý (.html, .pdf, .mp4, ...) khi xóa chương.
  Giữ lại file để tránh ảnh hưởng đến các khóa học khác có thể đang dùng chung tài liệu này. 
  Chỉ thực hiện xóa bản ghi liên kết (Reference) trong Database.
*/
export async function DELETE(req: Request) {

  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Tham số 'ids' không hợp lệ" }, { status: 400 });
    }

    await prisma.section.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({ success: true, message: "Đã xóa chương thành công (Giữ nguyên file gốc)" });
  } catch (error: any) {
    console.error('[SECTIONS_DELETE_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



