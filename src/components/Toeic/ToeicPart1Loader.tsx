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

    // Fetch all Part 1 groups to allow robust in-memory filtering (case-insensitive)
    const allGroups = await prisma.toeicQuestionGroup.findMany({
      where: { part: { partNumber: 1 } },
      include: {
        questions: {
          orderBy: { questionNo: 'asc' }
        }
      }
    });

    filterGroups = allGroups.filter((g: any) => {
      const meta = g.metadata as any;
      if (!meta) return false;

      // PicType Filter - Case Insensitive
      if (filters.picType) {
        const dbPicType = String(meta.PicType || meta.picType || "").trim().toLowerCase();
        const filterPicType = String(filters.picType).trim().toLowerCase();
        if (dbPicType !== filterPicType) return false;
      }

      // Các filter khác (Book, Test)
      if (filters.book) {
        const dbBook = String(meta.Book || meta.book || "").trim().toLowerCase();
        if (dbBook !== String(filters.book).trim().toLowerCase()) return false;
      }
      if (filters.test) {
        const dbTest = String(meta.Test || meta.test || "").trim().toLowerCase();
        if (dbTest !== String(filters.test).trim().toLowerCase()) return false;
      }

      return true;
    });

    // Removed the 10 groups limit to allow all questions in the category to be displayed

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
