import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToeicPart1Player from "./ToeicPart1Player";
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ToeicPart1Loader({
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
    let filters: any = {};
    try {
      const parsed = JSON.parse(content || "{}");
      filters = parsed.filters || parsed;
    } catch (e) {
      console.error("Lỗi parse JSON:", e);
    }

    // ── Lọc thẳng trong DB thay vì load-all rồi filter JS ──
    // Trước: load toàn bộ 330 groups → lọc JS → trả ~15 groups
    // Sau:   query chỉ lấy đúng groups match (tiết kiệm ~95% egress)
    const andConditions: any[] = [
      { part: { partNumber: 1 } }
    ];

    // Filter theo PicType (field "PicType" uppercase trong Part 1 metadata)
    if (filters.picType) {
      const picTypeVal = String(filters.picType).trim();
      andConditions.push({
        OR: [
          { metadata: { path: ['PicType'], equals: picTypeVal } },
          { metadata: { path: ['picType'], equals: picTypeVal } },
          // Fallback: case-insensitive string_contains phòng trường hợp data không đồng nhất
          { metadata: { path: ['PicType'], string_contains: picTypeVal, mode: 'insensitive' } },
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

    console.log(`[Part1Loader] Found ${filterGroups.length} groups for filters:`, filters);

  } catch (e) {
    console.error("Lỗi phân tích bộ lọc Part 1:", e);
  }

  const session = await getServerSession(authOptions) as any;
  const userId = session?.user?.id || null;
  let initialProgress = {};
  if (userId && filterGroups.length > 0) {
    const questionIds = filterGroups.flatMap(g => g.questions.map((q: any) => q.id));
    const attempts = await prisma.questionAttempt.findMany({
      where: {
        userId: userId,
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
        <div className="text-slate-400 font-bold mb-2">KHÔNG TÌM THẤY BÀI TẬP PART 1</div>
        <div className="text-sm text-slate-500 italic">Hệ thống đang cập nhật dữ liệu cho bộ lọc này.</div>
      </div>
    );
  }

  return (
    <ToeicPart1Player
      data={filterGroups}
      lessonId={lessonId}
      courseId={courseId}
      nextLessonId={nextLessonId}
      initialProgress={initialProgress}
      jumpTo={jumpToQ ? { id: jumpToQ, ts: Date.now() } : undefined}
      videoExplanation={videoExplanation}
      userId={userId}
    />
  );
}
