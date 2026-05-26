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

  // 2. Phân tích bộ lọc từ content
  let questions: any[] = [];
  try {
    const filters = JSON.parse(content);

    // Ghi chú: Vì Prisma không hỗ trợ lọc JSON linh hoạt bằng các trường động trong metadata
    // Chúng ta sẽ lấy danh sách câu hỏi thông qua API nội bộ hoặc fetch trực tiếp nếu có thể.
    // Để an toàn và đồng bộ, tôi sẽ fetch trực tiếp từ DB bằng Prisma.

    const allBankQuestions = await prisma.toeicQuestion.findMany({
      where: {
        group: {
          part: {
            partNumber: 5
          }
        }
      },
      include: {
        group: true
      }
    });

    // Lọc thủ công trên Server để đảm bảo chính xác theo metadata Book/Test/Type
    questions = allBankQuestions.filter((q: any) => {
      const qMeta = q.metadata as any;
      const gMeta = q.group.metadata as any;
      let match = true;
      
      // Support old 'day' and new 'book/test'
      if (filters.day && String(qMeta.day || "").toLowerCase() !== String(filters.day).toLowerCase()) match = false;
      if (filters.book && String(gMeta.book || gMeta.Book || "").trim().toLowerCase() !== String(filters.book).trim().toLowerCase()) match = false;
      if (filters.test && String(gMeta.test || gMeta.Test || "").trim().toString() !== String(filters.test).trim().toString()) match = false;
      
      // Support old 'type' and new 'Question_Type'
      if (filters.type) {
        const qType = String(qMeta.Question_Type || qMeta.type || "").trim().toLowerCase();
        if (qType !== String(filters.type).trim().toLowerCase()) match = false;
      }
      
      return match;
    }).sort((a, b) => (a.questionNo || 0) - (b.questionNo || 0));

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
