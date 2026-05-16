import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const { title, order } = await req.json();

    const book = await (prisma as any).book.create({
      data: {
        courseId,
        title,
        order: order || 0
      }
    });

    return NextResponse.json(book);
  } catch (error: any) {
    console.error("API Book Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Tham số 'ids' không hợp lệ" }, { status: 400 });
    }

    await (prisma as any).book.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({ success: true, message: "Đã xóa sách thành công" });
  } catch (error: any) {
    console.error('[BOOKS_DELETE_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
