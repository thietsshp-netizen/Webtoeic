import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: { sections: true }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error("[COURSE_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// [PATCH] Cập nhật thông tin khóa học (Title, Description, isPublic, CoverImage)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const { title, description, isPublic, coverImage } = await req.json();

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        isPublic,
        coverImage
      }
    });

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error("[COURSE_PATCH_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
