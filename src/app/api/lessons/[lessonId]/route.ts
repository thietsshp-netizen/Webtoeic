import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// [GET] Lấy chi tiết bài học
export async function GET(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson NOT FOUND" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error: any) {
    console.error('[GET_LESSON_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// [PUT] Cập nhật thông tin bài học
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const body = await req.json();

    // Chỉ cập nhật các trường cần thiết
    const { title, sectionId, contentType, content, videoUrl, isPreview, order, toeicTestId, vocabDayId } = body;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title,
        sectionId,
        contentType,
        content,
        videoUrl,
        isPreview,
        order,
        toeicTestId,
        vocabDayId,
      }
    });

    return NextResponse.json(lesson);
  } catch (error: any) {
    console.error('[PUT_LESSON_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

