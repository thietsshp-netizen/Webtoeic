import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const userId = session.user.id;

    let enrolledCourses: any[] = [];

    if (isAdmin) {
      enrolledCourses = await prisma.course.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          sections: {
            include: { lessons: { select: { id: true, isPreview: true } } }
          }
        }
      });
    } else {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              sections: {
                include: { lessons: { select: { id: true, isPreview: true } } }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      enrolledCourses = enrollments.map(e => e.course);
    }

    // Tính tiến độ thực tế cho mỗi khoá học
    const coursesWithProgress = await Promise.all(
      enrolledCourses.map(async (course) => {
        // Tổng số bài học trong khoá
        const lessonIds = course.sections?.flatMap((s: any) => s.lessons.map((l: any) => l.id)) ?? [];
        const totalLessons = lessonIds.length;

        // Số bài đã hoàn thành
        const completedCount = totalLessons > 0
          ? await (prisma as any).lessonProgress.count({
              where: {
                userId,
                lessonId: { in: lessonIds },
                isCompleted: true
              }
            })
          : 0;

        const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        
        // Bài học cuối cùng đang học dở trong khoá này
        const lastProgress = await (prisma as any).lessonProgress.findFirst({
          where: {
            userId,
            lesson: { section: { courseId: course.id } }
          },
          orderBy: { updatedAt: "desc" },
          include: { lesson: { select: { id: true, title: true } } }
        });

        const totalSections = course.sections?.length ?? 0;
        const { sections: _, ...courseData } = course;
        const previewCount = course.sections?.flatMap((s: any) => s.lessons.filter((l: any) => l.isPreview)).length ?? 0;

        return {
          ...courseData,
          totalLessons,
          totalSections,
          previewCount,
          completedLessons: completedCount,
          progressPct,
          lastLesson: lastProgress ? {
             id: lastProgress.lesson.id,
             title: lastProgress.lesson.title
          } : null
        };
      })
    );

    return NextResponse.json({ success: true, courses: coursesWithProgress });
  } catch (error: any) {
    console.error("[ME_COURSES_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
