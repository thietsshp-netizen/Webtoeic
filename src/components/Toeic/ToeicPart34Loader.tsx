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

    // 2. Fetch all groups for this part
    const allGroups = await prisma.toeicQuestionGroup.findMany({
      where: { part: { partNumber: partNumber } },
      include: { questions: { orderBy: { questionNo: 'asc' } } }
    });

    // 3. Simple & Robust Graphic Filtering
    const filterVal = String(filters.hasGraphic || "").toLowerCase().trim();
    const isLookingForGraphic = filterVal === "yes" || filterVal === "true";
    const isLookingForNoGraphic = filterVal === "no" || filterVal === "false";

    filterGroups = allGroups.filter((g: any) => {
      const meta = g.metadata as any || {};
      const hasGraphic = (meta.pic_id && String(meta.pic_id).trim().length > 0) ||
        (meta.PicID && String(meta.PicID).trim().length > 0) ||
        (g.imageUrl && String(g.imageUrl).trim().length > 0) ||
        (String(meta.has_graphic || "").toLowerCase().trim() === "yes");

      if (isLookingForGraphic) return hasGraphic;
      if (isLookingForNoGraphic) return !hasGraphic;

      // Book & Test Filter
      if (filters.book && String(meta.Book || meta.book || "").trim().toLowerCase() !== String(filters.book).trim().toLowerCase()) return false;
      if (filters.test && String(meta.Test || meta.test || "").trim().toString() !== String(filters.test).trim().toString()) return false;

      return true;
    });

    // 4. Sort BEFORE chunking
    filterGroups.sort((a, b) => (a.questions[0]?.questionNo || 0) - (b.questions[0]?.questionNo || 0));

    // 5. Handle Chunking (Passage Packs)
    if (filters.passageType && filters.passageType.trim() !== "") {
      const match = String(filters.passageType).match(/(.+) \((\d+)-(\d+)\)/);
      if (match) {
        const start = parseInt(match[2]) - 1;
        const end = parseInt(match[3]);
        const isGraphicPack = match[1].trim() === "Có hình";

        // Re-filter to match the exact bucket of the pack
        const bucket = filterGroups.filter(g => {
          const m = g.metadata as any || {};
          const hasG = (m.pic_id && String(m.pic_id).trim().length > 0) ||
            (m.PicID && String(m.PicID).trim().length > 0) ||
            (g.imageUrl && String(g.imageUrl).trim().length > 0) ||
            (String(m.has_graphic || "").toLowerCase().trim() === "yes");
          return isGraphicPack ? hasG : !hasG;
        });

        filterGroups = bucket.slice(start, end);
      }
    } else {
      // Default limit for non-chunked or "All" view
      if (filterGroups.length > 50) filterGroups = filterGroups.slice(0, 50);
    }

    // Đảm bảo nhóm chứa jumpToQ luôn được bao gồm nếu nó nằm ngoài slice/chunk
    if (jumpToQ) {
      const isIncluded = filterGroups.some(g => g.questions.some((q: any) => q.id === jumpToQ || String(q.questionNo) === jumpToQ));
      if (!isIncluded) {
        const targetGroup = allGroups.find(g => g.questions.some((q: any) => q.id === jumpToQ || String(q.questionNo) === jumpToQ));
        if (targetGroup) {
          filterGroups.push(targetGroup);
          // Sắp xếp lại theo questionNo để giữ thứ tự logic
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
