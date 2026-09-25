import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToeicPart6Player from "./ToeicPart6Player";
export const revalidate = 0;

export default async function ToeicPart6Loader({ 
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
  let filters: any = {};
  let allGroups: any[] = [];

  try {
    filters = JSON.parse(content || "{}");

    // ── Lọc trực tiếp trong DB ──
    const baseCondition: any = { part: { partNumber: 6 } };
    const whereConditions: any[] = [baseCondition];

    if (filters.book && filters.book.trim() !== "") {
      const bookVal = filters.book.trim();
      whereConditions.push({
        OR: [
          { metadata: { path: ['Book'], equals: bookVal } },
          { metadata: { path: ['book'], equals: bookVal } },
        ]
      });
    }

    if (filters.test && String(filters.test).trim() !== "") {
      const testVal = String(filters.test).trim();
      const testNum = isNaN(Number(testVal)) ? testVal : Number(testVal);
      whereConditions.push({
        OR: [
          { metadata: { path: ['Test'], equals: testVal } },
          { metadata: { path: ['test'], equals: testVal } },
          { metadata: { path: ['Test'], equals: testNum } },
          { metadata: { path: ['test'], equals: testNum } },
        ]
      });
    }

    if (filters.passageType && filters.passageType.trim() !== "") {
      const pType = filters.passageType.trim();
      whereConditions.push({
        OR: [
          { metadata: { path: ['PassageType'], equals: pType } },
          { metadata: { path: ['passageType'], equals: pType } },
        ]
      });
    }

    filterGroups = await prisma.toeicQuestionGroup.findMany({
      where: { AND: whereConditions },
      include: {
        questions: {
          orderBy: { questionNo: 'asc' }
        }
      }
    });

    console.log(`[Part6Loader] FETCHING FOR LESSON: ${lessonId}`);
    console.log(`[Part6Loader] Groups found in DB: ${filterGroups.length}`);

    // Đảm bảo nhóm chứa jumpToQ luôn được bao gồm nếu nó nằm ngoài slice
    if (jumpToQ) {
      const isIncluded = filterGroups.some(g => g.questions.some((q: any) => q.id === jumpToQ || String(q.questionNo) === jumpToQ));
      if (!isIncluded) {
        const targetGroup = allGroups.find(g => g.questions.some((q: any) => q.id === jumpToQ || String(q.questionNo) === jumpToQ));
        if (targetGroup) {
          filterGroups.push(targetGroup);
          // Sắp xếp lại theo questionNo để giữ thứ tự logic
          filterGroups.sort((a, b) => {
             const aMin = Math.min(...a.questions.map((q:any) => q.questionNo || 999));
             const bMin = Math.min(...b.questions.map((q:any) => q.questionNo || 999));
             return aMin - bMin;
          });
        }
      }
    }

  } catch (e) {
    console.error("Lỗi phân tích bộ lọc Part 6:", e);
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
        <div className="text-slate-400 font-bold mb-2">KHÔNG TÌM THẤY BÀI TẬP PART 6 (DEBUG MODE)</div>
        <div className="text-sm text-slate-500 italic mb-4">Vui lòng kiểm tra lại bộ lọc trong giáo án.</div>
        
        {/* Debug info for Admin */}
        <div className="mt-8 p-4 bg-white rounded-xl border text-left max-w-md mx-auto">
          <div className="text-xs font-bold text-slate-400 uppercase mb-2">Thông tin debug cho Admin:</div>
          <div className="text-sm space-y-1">
            <div>• Part Number: 6</div>
            <div>• Tổng số nhóm trong DB: {allGroups?.length || 0}</div>
            <div>• Bộ lọc nhận được: <code className="bg-slate-100 px-1 rounded">{JSON.stringify(filters)}</code></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToeicPart6Player 
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
