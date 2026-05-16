import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// [GET] Lấy toàn bộ cấu trúc Syllabus cho Builder sử dụng Prisma
export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions) as any;
    
    // 1. Lấy cấu trúc bài học 3 tầng: Book -> Section -> Lesson
    const books = await (prisma as any).book.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    // Tính toán lại sections cho các logic phía sau (để không bị lỗi break code cũ quá nhiều)
    const allSections: any[] = [];
    books.forEach((b: any) => {
      allSections.push(...b.sections);
    });

    // 2. Kiểm tra quyền truy cập (Enrollment)
    let isEnrolled = false;
    let isAdmin = session?.user?.role === "ADMIN";

    if (isAdmin) {
      isEnrolled = true;
    } else if (session?.user?.id) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: courseId
          }
        }
      });
      if (enrollment) isEnrolled = true;
    }

    // 3. Lấy tiến độ học tập của User hiện tại qua bảng LessonProgress & QuestionAttempt
    let progressMap: Record<string, any> = {};
    if (session?.user?.id) {
        // Lấy trạng thái hoàn thành bài học
        const userProgresses = await prisma.lessonProgress.findMany({
          where: { userId: session.user.id },
          select: { lessonId: true, isCompleted: true }
        });
        
        // Lấy chi tiết số câu đúng/tổng câu từ QuestionAttempt
        const attempts = await prisma.questionAttempt.groupBy({
           by: ['lessonId', 'isCorrect'],
           where: { userId: session.user.id, lessonId: { not: null } },
           _count: { _all: true }
        });
        
        userProgresses.forEach(p => {
           progressMap[p.lessonId] = { isCompleted: p.isCompleted, correctCount: 0, totalCount: 0 };
        });
        
        attempts.forEach(a => {
           if (!a.lessonId) return;
           if (!progressMap[a.lessonId]) {
              progressMap[a.lessonId] = { isCompleted: false, correctCount: 0, totalCount: 0 };
           }
           progressMap[a.lessonId].totalCount += a._count._all;
           if (a.isCorrect) {
              progressMap[a.lessonId].correctCount += a._count._all;
           }
        });

       // 3. Lấy số từ chưa thuộc từ VocabBookmark
       const bookmarks = await prisma.vocabBookmark.groupBy({
         by: ['vocabDayId'],
         where: { userId: session.user.id },
         _count: { _all: true }
       });

       const bookmarkCountMap: Record<string, number> = {};
       bookmarks.forEach(b => {
         bookmarkCountMap[b.vocabDayId] = b._count._all;
       });

       // Gắn unlearnedCount vào progressMap dựa trên vocabDayId của lesson
       allSections.forEach(s => {
         s.lessons.forEach((l: any) => {
            const unlearnedCount = bookmarkCountMap[l.vocabDayId || ""] || 0;
            if (unlearnedCount > 0) {
               if (!progressMap[l.id]) {
                  progressMap[l.id] = { isCompleted: false, correctCount: 0, totalCount: 0 };
               }
               progressMap[l.id].unlearnedCount = unlearnedCount;
            }
         });
       });
    }

    return NextResponse.json({ success: true, books, isEnrolled, isAdmin, progressMap });
  } catch (error: any) {
    console.error("[SYLLABUS_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
