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

    // Fetch all Part 2 groups to allow robust in-memory filtering (case-insensitive)
    const allGroups = await prisma.toeicQuestionGroup.findMany({
      where: { part: { partNumber: 2 } },
      include: {
        questions: {
          orderBy: { questionNo: 'asc' }
        }
      }
    });

    filterGroups = allGroups.filter((g: any) => {
      const gMeta = g.metadata as any || {};
      const questions = g.questions || [];
      
      // Type Filter - Case Insensitive - Check group meta OR first question meta
      if (filters.type) {
        const filterType = String(filters.type).trim().toLowerCase();
        
        const gType = String(gMeta.Type || gMeta.type || gMeta.Question_Type || "").trim().toLowerCase();
        const qType = questions.length > 0 ? String(questions[0].metadata?.type || questions[0].metadata?.Type || questions[0].metadata?.Question_Type || "").trim().toLowerCase() : "";
        
        if (gType !== filterType && qType !== filterType) return false;
      }

      // Book & Test Filter
      const gBook = String(gMeta.Book || gMeta.book || "").trim().toLowerCase();
      const gTest = String(gMeta.Test || gMeta.test || "").trim().toLowerCase();
      
      if (filters.book && gBook !== String(filters.book).trim().toLowerCase()) return false;
      if (filters.test && gTest !== String(filters.test).trim().toLowerCase()) return false;

      return true;
    });

    // No limit for filtered groups

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
