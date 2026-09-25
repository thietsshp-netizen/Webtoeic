import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const isAdmin = session.user.role === "ADMIN";

    const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;

    let enrolledCourses: any[] = [];

    if (isAdmin && !targetUserId) {
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

    // Tập hợp tất cả lessonId từ mọi khóa học
    const allLessonIds = enrolledCourses.flatMap(
      (course) => course.sections?.flatMap((s: any) => s.lessons.map((l: any) => l.id)) ?? []
    );
    const courseIdSet = enrolledCourses.map((c) => c.id);

    // --- BATCH QUERY 1: Đếm số bài hoàn thành của TẤT CẢ khóa học cùng lúc ---
    // Thay vì loop count() N lần, dùng groupBy 1 lần duy nhất
    const completedRows = allLessonIds.length > 0
      ? await (prisma as any).lessonProgress.groupBy({
          by: ["lessonId"],
          where: {
            userId,
            lessonId: { in: allLessonIds },
            isCompleted: true,
          },
          _count: { lessonId: true },
        })
      : [];

    // Map lessonId → completed (true/false) để tra nhanh
    const completedLessonIdSet = new Set<string>(
      completedRows.map((r: any) => r.lessonId)
    );

    // --- BATCH QUERY 2: Lấy bài cuối của TẤT CẢ khóa học cùng lúc ---
    // Thay vì findFirst N lần, lấy tất cả rồi lọc trong JS
    const allLastProgress = courseIdSet.length > 0
      ? await (prisma as any).lessonProgress.findMany({
          where: {
            userId,
            lesson: { section: { courseId: { in: courseIdSet } } },
          },
          orderBy: { updatedAt: "desc" },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                section: { select: { courseId: true } },
              },
            },
          },
        })
      : [];

    // Map courseId → bài học cuối cùng (chỉ lấy bản ghi đầu tiên của mỗi course)
    const lastProgressByCourse = new Map<string, { id: string; title: string }>();
    for (const row of allLastProgress) {
      const cId = row.lesson?.section?.courseId;
      if (cId && !lastProgressByCourse.has(cId)) {
        lastProgressByCourse.set(cId, { id: row.lesson.id, title: row.lesson.title });
      }
    }

    // --- Ghép dữ liệu trong JS (không query thêm) ---
    const coursesWithProgress = enrolledCourses.map((course) => {
      const lessonIds: string[] =
        course.sections?.flatMap((s: any) => s.lessons.map((l: any) => l.id as string)) ?? [];
      const totalLessons = lessonIds.length;
      const completedCount = lessonIds.filter((id) => completedLessonIdSet.has(id)).length;
      const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      const totalSections = course.sections?.length ?? 0;
      const previewCount =
        course.sections?.flatMap((s: any) => s.lessons.filter((l: any) => l.isPreview)).length ?? 0;
      const { sections: _, ...courseData } = course;

      return {
        ...courseData,
        totalLessons,
        totalSections,
        previewCount,
        completedLessons: completedCount,
        progressPct,
        lastLesson: lastProgressByCourse.get(course.id) ?? null,
      };
    });

    return NextResponse.json({ success: true, courses: coursesWithProgress });
  } catch (error: any) {
    console.error("[ME_COURSES_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
