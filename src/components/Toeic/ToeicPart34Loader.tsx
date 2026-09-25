import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToeicPart34Player from "./ToeicPart34Player";
export const revalidate = 0;

export default async function ToeicPart34Loader({
  content,
  lessonId,
  courseId,
  nextLessonId,
  partNumber,
  jumpToQ,
  videoExplanation
}: {
  content: string;
  lessonId: string;
  courseId?: string;
  nextLessonId?: string;
  partNumber: number;
  jumpToQ?: string;
  videoExplanation?: any;
}) {
  let filterGroups: any[] = [];
  let filters: any = {};

  try {
    try {
      let parsed: any;
      if (typeof content === "string") {
        parsed = JSON.parse(content || "{}");
      } else {
        parsed = content || {};
      }

      filters = parsed.filters || (parsed.part ? parsed.filters : parsed) || parsed;
      if (Array.isArray(parsed)) filters = parsed[0]?.filters || {};
    } catch (e) {
      console.error("Content parsing error in Loader:", e);
    }

    // ── Lọc thẳng trong DB thay vì load-all rồi filter JS ──
    // Trước: load toàn bộ 650 (Part 3) / 500 (Part 4) groups rồi lọc JS
    // Sau:   query chỉ đúng nhóm có/không hình → tiết kiệm ~77% egress
    const filterVal = String(filters.hasGraphic || "").toLowerCase().trim();
    let isLookingForGraphic = filterVal === "yes" || filterVal === "true";
    let isLookingForNoGraphic = filterVal === "no" || filterVal === "false";

    // Fallback nếu lesson metadata dùng passageType
    if (!isLookingForGraphic && !isLookingForNoGraphic && filters.passageType) {
      const pType = String(filters.passageType).trim();
      if (pType.startsWith("Có hình")) isLookingForGraphic = true;
      else if (pType.startsWith("Không có hình")) isLookingForNoGraphic = true;
    }

    // Xây dựng WHERE condition cho imageUrl (trong DB Part 3 & 4, nhóm có hình có imageUrl R2 URL hợp lệ)
    const baseCondition: any = { part: { partNumber: partNumber } };

    let graphicCondition: any = null;
    if (isLookingForGraphic) {
      // Có hình: imageUrl không null VÀ không rỗng
      graphicCondition = {
        AND: [
          { imageUrl: { not: null } },
          { imageUrl: { not: "" } },
        ]
      };
    } else if (isLookingForNoGraphic) {
      // Không hình: imageUrl null HOẶC rỗng
      graphicCondition = {
        OR: [
          { imageUrl: null },
          { imageUrl: "" },
        ]
      };
    }

    // Filter book/test nếu có
    const bookTestConditions: any[] = [];
    if (filters.book) {
      const bookVal = String(filters.book).trim();
      bookTestConditions.push({
        OR: [
          { metadata: { path: ['Book'], equals: bookVal } },
          { metadata: { path: ['book'], equals: bookVal } },
        ]
      });
    }
    if (filters.test) {
      const testVal = String(filters.test).trim();
      bookTestConditions.push({
        OR: [
          { metadata: { path: ['Test'], equals: testVal } },
          { metadata: { path: ['test'], equals: testVal } },
        ]
      });
    }

    const whereClause: any = {
      AND: [
        baseCondition,
        ...(graphicCondition ? [graphicCondition] : []),
        ...bookTestConditions,
      ]
    };

    filterGroups = await prisma.toeicQuestionGroup.findMany({
      where: whereClause,
      include: { questions: { orderBy: { questionNo: 'asc' } } }
    });

    // 4. Sort BEFORE chunking
    filterGroups.sort((a, b) => (a.questions[0]?.questionNo || 0) - (b.questions[0]?.questionNo || 0));

    // 5. Handle Chunking (Passage Packs)
    if (filters.passageType && filters.passageType.trim() !== "") {
      const match = String(filters.passageType).match(/(.+) \((\d+)-(\d+)\)/);
      if (match) {
        const start = parseInt(match[2]) - 1;
        const end = parseInt(match[3]);
        filterGroups = filterGroups.slice(start, end);
      }
    } else {
      // Default limit for non-chunked or "All" view
      if (filterGroups.length > 50) filterGroups = filterGroups.slice(0, 50);
    }

    // Đảm bảo nhóm chứa jumpToQ luôn được bao gồm nếu nó nằm ngoài slice/chunk
    if (jumpToQ) {
      const isIncluded = filterGroups.some(g => g.questions.some((q: any) => q.id === jumpToQ || String(q.questionNo) === jumpToQ));
      if (!isIncluded) {
        // Tìm lại từ DB chỉ nhóm chứa câu jumpToQ (không cần load toàn bộ)
        const targetGroup = await prisma.toeicQuestionGroup.findFirst({
          where: {
            part: { partNumber: partNumber },
            questions: { some: { id: jumpToQ } }
          },
          include: { questions: { orderBy: { questionNo: 'asc' } } }
        });
        if (targetGroup) {
          filterGroups.push(targetGroup);
          filterGroups.sort((a, b) => (a.questions[0]?.questionNo || 0) - (b.questions[0]?.questionNo || 0));
        }
      }
    }

  } catch (e) {
    console.error("Critical Loader Error:", e);
  }

  const session = await getServerSession(authOptions) as any;
  let initialProgress = {};
  if (session?.user?.id && filterGroups.length > 0) {
    const questionIds = filterGroups.flatMap(g => g.questions.map((q: any) => q.id));
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId: session.user.id, questionId: { in: questionIds } }
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
    return <div className="p-20 text-center text-slate-400">Không tìm thấy bài tập phù hợp với cấu hình của Admin.</div>;
  }

  return (
    <ToeicPart34Player
      data={filterGroups}
      lessonId={lessonId}
      courseId={courseId}
      nextLessonId={nextLessonId}
      initialProgress={initialProgress}
      targetPart={partNumber}
      jumpTo={jumpToQ ? { id: jumpToQ, ts: Date.now() } : undefined}
      videoExplanation={videoExplanation}
    />
  );
}
