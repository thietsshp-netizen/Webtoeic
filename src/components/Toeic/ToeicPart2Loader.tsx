import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToeicPart2Player from "./ToeicPart2Player";
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ToeicPart2Loader({
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
  let filterGroups: any[] = [];
  try {
    const filters = JSON.parse(content || "{}");

    // ── Xây dựng WHERE clause lọc thẳng trong DB thay vì load-all rồi filter JS ──
    // Trước: load toàn bộ 1,250 groups → lọc JS → trả ~80 groups (tốn 1,250× egress)
    // Sau:   query chỉ lấy đúng groups match → trả ~80 groups (tiết kiệm ~94% egress)
    const andConditions: any[] = [
      { part: { partNumber: 2 } }
    ];

    // Filter theo type (field "type" lowercase trong Part 2 metadata)
    if (filters.type) {
      const typeVal = String(filters.type).trim();
      andConditions.push({
        OR: [
          { metadata: { path: ['type'],          equals: typeVal } },
          { metadata: { path: ['Type'],          equals: typeVal } },
          { metadata: { path: ['Question_Type'], equals: typeVal } },
          // Fallback case-insensitive (mode insensitive chỉ áp dụng cho string filter)
          { metadata: { path: ['type'],          string_contains: typeVal, mode: 'insensitive' } },
        ]
      });
    }

    // Filter theo book
    if (filters.book) {
      const bookVal = String(filters.book).trim();
      andConditions.push({
        OR: [
          { metadata: { path: ['Book'], equals: bookVal } },
          { metadata: { path: ['book'], equals: bookVal } },
        ]
      });
    }

    // Filter theo test
    if (filters.test) {
      const testVal = String(filters.test).trim();
      andConditions.push({
        OR: [
          { metadata: { path: ['Test'], equals: testVal } },
          { metadata: { path: ['test'], equals: testVal } },
        ]
      });
    }

    filterGroups = await prisma.toeicQuestionGroup.findMany({
      where: { AND: andConditions },
      include: {
        questions: {
          orderBy: { questionNo: 'asc' }
        }
      }
    });

  } catch (e) {
    console.error("Lỗi phân tích bộ lọc Part 2:", e);
  }

  const session = await getServerSession(authOptions) as any;
  let initialProgress = {};
  if (session?.user?.id && filterGroups.length > 0) {
    const questionIds = filterGroups.flatMap(g => g.questions.map((q: any) => q.id));
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

  if (filterGroups.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 border border-dashed rounded-3xl m-4">
        <div className="text-slate-400 font-bold mb-2">KHÔNG TÌM THẤY BÀI TẬP PART 2</div>
        <div className="text-sm text-slate-500 italic">Vui lòng kiểm tra lại bộ lọc trong giáo án.</div>
      </div>
    );
  }

  return (
    <ToeicPart2Player
      data={filterGroups}
      lessonId={lessonId}
      courseId={courseId}
      nextLessonId={nextLessonId}
      initialProgress={initialProgress}
      jumpTo={jumpToQ ? { id: jumpToQ, ts: Date.now() } : undefined}
      videoExplanation={videoExplanation}
    />
  );
}
