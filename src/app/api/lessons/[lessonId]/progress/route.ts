import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  try {
    // 1. Fetch lesson to find the corresponding courseId
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          select: { courseId: true }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // 2. Perform database enrollment and expiration verification
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, accountExpiresAt: true }
    });

    let hasAccess = false;
    if (dbUser) {
      const isExpired = !!(dbUser.role !== "ADMIN" && dbUser.accountExpiresAt && new Date(dbUser.accountExpiresAt) < new Date());
      if (lesson.isPreview) {
        hasAccess = true;
      } else if (!isExpired) {
        if (dbUser.role === "ADMIN") {
          hasAccess = true;
        } else {
          const enrollment = await prisma.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId: session.user.id,
                courseId: lesson.section.courseId,
              },
            },
          });
          if (enrollment) hasAccess = true;
        }
      }
    } else if (lesson.isPreview) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Upsert progress safely
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId,
        },
      },
      update: { updatedAt: new Date() },
      create: {
        userId: session.user.id,
        lessonId: lessonId,
        isCompleted: false,
      },
      select: { id: true }, // Chỉ trả về ID để giảm thiểu I/O tối đa
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi ghi nhận tiến độ học tập:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
