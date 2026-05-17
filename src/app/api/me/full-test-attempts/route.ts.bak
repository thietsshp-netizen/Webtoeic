import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { 
      lessonId, 
      testId, 
      lcScore, 
      rcScore, 
      totalScore, 
      correctCount, 
      incorrectCount, 
      unansweredCount, 
      timeSpent,
      attempts 
    } = body;

    // 1. Save the full test summary
    let attempt;
    try {
      attempt = await prisma.fullTestAttempt.create({
        data: {
          userId,
          lessonId: lessonId || null,
          testId: testId || "Full Test",
          lcScore: lcScore || 0,
          rcScore: rcScore || 0,
          totalScore: totalScore || 0,
          correctCount: correctCount || 0,
          incorrectCount: incorrectCount || 0,
          unansweredCount: unansweredCount || 0,
          timeSpent: timeSpent || 0
        }
      });
    } catch (createError) {
      console.error("Failed to create FullTestAttempt:", createError);
      return NextResponse.json({ error: "Failed to create test summary" }, { status: 500 });
    }

    // 2. Batch upsert individual question attempts
    if (attempts && Array.isArray(attempts)) {
      const validAttempts = attempts.filter((a: any) => !!a.questionId);
      
      if (validAttempts.length > 0) {
        try {
          const chunkSize = 50;
          for (let i = 0; i < validAttempts.length; i += chunkSize) {
            const chunk = validAttempts.slice(i, i + chunkSize);
            await prisma.$transaction(
              chunk.map((a: any) => 
                prisma.questionAttempt.upsert({
                  where: {
                    userId_questionId_lessonId: {
                      userId,
                      questionId: a.questionId,
                      lessonId: lessonId || null,
                    }
                  },
                  update: {
                    userAnswer: a.userAnswer,
                    isCorrect: a.isCorrect,
                    isFlagged: a.isFlagged,
                    flagColor: a.flagColor,
                    updatedAt: new Date()
                  },
                  create: {
                    userId,
                    questionId: a.questionId,
                    userAnswer: a.userAnswer,
                    isCorrect: a.isCorrect,
                    isFlagged: a.isFlagged,
                    flagColor: a.flagColor,
                    lessonId: lessonId || null
                  }
                })
              )
            );
          }
        } catch (txError) {
          console.error("Error in question attempts transaction:", txError);
        }
      }
    }

    return NextResponse.json({ success: true, id: attempt.id });
  } catch (error) {
    console.error("Full Test Attempt Global Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const history = await prisma.fullTestAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    // 1. Tìm các bài học dựa trên lessonId hiện có
    const existingLessonIds = Array.from(new Set(history.map(h => h.lessonId).filter(Boolean))) as string[];
    const lessons = await prisma.lesson.findMany({
      where: { id: { in: existingLessonIds } },
      select: { id: true, section: { select: { courseId: true } } }
    });

    const lessonMap = lessons.reduce((acc: any, l) => {
      acc[l.id] = l.section.courseId;
      return acc;
    }, {});

    // 2. Tìm lessonId dự phòng dựa trên testId (dành cho các bản ghi cũ thiếu lessonId)
    const missingLessonTestIds = Array.from(new Set(history.filter(h => !h.lessonId && h.testId).map(h => h.testId))) as string[];
    
    // Lưu ý: testId trong FullTestAttempt có thể là "book-test", 
    // trong khi toeicTestId trong Lesson là mã UUID. Cần check cả hai hoặc match title.
    // Tuy nhiên, nếu user nói "dạng 1 bài học hết" thì ta sẽ cố gắng tìm lesson có toeicTestId khớp hoặc title khớp.
    const fallbackLessons = await prisma.lesson.findMany({
      where: { 
        OR: [
          { toeicTestId: { in: missingLessonTestIds } },
          { title: { in: missingLessonTestIds } }
        ]
      },
      select: { id: true, toeicTestId: true, title: true, section: { select: { courseId: true } } }
    });

    const fallbackMap = fallbackLessons.reduce((acc: any, l) => {
      if (l.toeicTestId) acc[l.toeicTestId] = { lessonId: l.id, courseId: l.section.courseId };
      acc[l.title] = { lessonId: l.id, courseId: l.section.courseId };
      return acc;
    }, {});

    const enrichedHistory = history.map(h => {
      let lId = h.lessonId;
      let cId = h.lessonId ? lessonMap[h.lessonId] : null;

      // Fallback nếu thiếu thông tin
      if (!lId && h.testId && fallbackMap[h.testId]) {
        lId = fallbackMap[h.testId].lessonId;
        cId = fallbackMap[h.testId].courseId;
      }

      return {
        ...h,
        lessonId: lId,
        courseId: cId
      };
    });

    return NextResponse.json({ success: true, history: enrichedHistory });
  } catch (error) {
    console.error("Error fetching test history:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
