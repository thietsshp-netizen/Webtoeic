import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToeicPart5Player from "./ToeicPart5Player";

export default async function ToeicPart5Loader({
  content,
  lessonId,
  courseId,
  nextLessonId,
  jumpToQ,
  videoExplanation
}: {
  content: string;
  lessonId: string;
  courseId?: string;
  nextLessonId?: string;
  jumpToQ?: string;
  videoExplanation?: any;
}) {
  // 1. Lấy thông tin phiên đăng nhập
  const session = await getServerSession(authOptions) as any;

  // 2. Phân tích bộ lọc từ content và query trực tiếp từ DB
  let questions: any[] = [];
  let filters: any = {};
  try {
    let parsed: any;
    if (typeof content === "string") {
      parsed = JSON.parse(content || "{}");
    } else {
      parsed = content || {};
    }
    filters = parsed.filters || (parsed.part ? parsed.filters : parsed) || parsed;
    if (Array.isArray(parsed)) filters = parsed[0]?.filters || {};

    // ── Lọc trực tiếp trong DB ──
    const whereConditions: any[] = [
      { group: { part: { partNumber: 5 } } }
    ];

    if (filters.type) {
      const typeVal = String(filters.type).trim();
      whereConditions.push({
        OR: [
          { metadata: { path: ['Question_Type'], equals: typeVal } },
          { metadata: { path: ['type'], equals: typeVal } },
        ]
      });
    }

    if (filters.book) {
      const bookVal = String(filters.book).trim();
      whereConditions.push({
        OR: [
          { metadata: { path: ['book'], equals: bookVal } },
          { metadata: { path: ['Book'], equals: bookVal } },
          { group: { metadata: { path: ['book'], equals: bookVal } } },
          { group: { metadata: { path: ['Book'], equals: bookVal } } },
        ]
      });
    }

    if (filters.test) {
      const testVal = String(filters.test).trim();
      const testNum = isNaN(Number(testVal)) ? testVal : Number(testVal);
      whereConditions.push({
        OR: [
          { metadata: { path: ['test'], equals: testVal } },
          { metadata: { path: ['Test'], equals: testVal } },
          { metadata: { path: ['test'], equals: testNum } },
          { metadata: { path: ['Test'], equals: testNum } },
          { group: { metadata: { path: ['test'], equals: testVal } } },
          { group: { metadata: { path: ['Test'], equals: testVal } } },
          { group: { metadata: { path: ['test'], equals: testNum } } },
          { group: { metadata: { path: ['Test'], equals: testNum } } },
        ]
      });
    }

    if (filters.day) {
      const dayVal = String(filters.day).trim();
      whereConditions.push({
        metadata: { path: ['day'], equals: dayVal }
      });
    }

    questions = await prisma.toeicQuestion.findMany({
      where: {
        AND: whereConditions
      },
      include: {
        group: true
      },
      orderBy: {
        questionNo: 'asc'
      }
    });

  } catch (e) {
    console.error("Lỗi phân tích bộ lọc Part 5:", e);
  }

  // 3. Lấy tiến độ cũ (nếu có)
  let initialProgress = {};
  if (session?.user?.id && questions.length > 0) {
    const questionIds = questions.map(q => q.id);
    const attempts = await prisma.questionAttempt.findMany({
      where: {
        userId: session.user.id,
        questionId: { in: questionIds }
      }
    });

    initialProgress = attempts.reduce((acc: any, curr) => {
      acc[curr.questionId] = {
        isCorrect: curr.isCorrect,
        userAnswer: curr.userAnswer,
        isFlagged: curr.isFlagged,
        flagColor: curr.flagColor,
        flagNote: curr.flagNote
      };
      return acc;
    }, {});
  }

  return (
    <ToeicPart5Player
      content={content}
      lessonId={lessonId}
      courseId={courseId}
      nextLessonId={nextLessonId}
      initialProgress={initialProgress}
      jumpTo={jumpToQ ? { id: jumpToQ, ts: Date.now() } : undefined}
      videoExplanation={videoExplanation}
    />
  );
}
