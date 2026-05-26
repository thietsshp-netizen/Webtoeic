import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToeicPlayerClient from "./ToeicPlayerClient";

export default async function ToeicTestLoader({ 
  toeicTestId, 
  lessonId,
  courseId,
  nextLessonId,
  isReviewMode = false,
  jumpToQ,
  videoExplanation
}: { 
  toeicTestId: string | null;
  lessonId: string;
  courseId?: string;
  nextLessonId?: string;
  isReviewMode?: boolean;
  jumpToQ?: string;
  videoExplanation?: any;
}) {
  if (!toeicTestId) return (
    <div className="text-center py-10 text-slate-500 bg-slate-50 border border-dashed rounded-3xl">
      Bài học này chưa được gán bộ đề TOEIC thực hành nào.
    </div>
  );

  const test = await prisma.toeicTest.findUnique({
    where: { id: toeicTestId },
    include: {
      parts: {
        include: {
          groups: {
            include: {
              questions: true
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { partNumber: 'asc' }
      }
    }
  });

  if (!test || test.parts.length === 0) return (
    <div className="text-center py-10 text-slate-500 bg-slate-50 border border-dashed rounded-3xl">
      Đề thi này hiện chưa có dữ liệu để thực hành.
    </div>
  );

  // Pre-fetch past user attempts for ALL parts
  const session = await getServerSession(authOptions) as any;
  let initialProgress = {};
  
  if (session?.user?.id) {
    const allQuestionIds = test.parts.flatMap(p => p.groups.flatMap(g => g.questions.map(q => q.id)));
    const attempts = await prisma.questionAttempt.findMany({
      where: {
        userId: session.user.id,
        questionId: { in: allQuestionIds }
      }
    });
    
    initialProgress = attempts.reduce((acc: any, curr) => {
      acc[curr.questionId] = {
        isCorrect: curr.isCorrect,
        userAnswer: curr.userAnswer,
        isFlagged: curr.isFlagged,
        flagColor: (curr as any).flagColor,
        flagNote: (curr as any).flagNote
      };
      return acc;
    }, {});
  }

  // Pass all parts data to the client
  const partsData = test.parts.map(p => ({
    partNumber: p.partNumber,
    groups: p.groups
  }));

  return (
    <ToeicPlayerClient 
      partsData={partsData}
      lessonId={lessonId}
      initialProgress={initialProgress}
      courseId={courseId}
      nextLessonId={nextLessonId}
      isReviewMode={isReviewMode}
      jumpTo={jumpToQ ? { id: jumpToQ, ts: Date.now() } : undefined}
      videoExplanation={videoExplanation}
    />
  );
}
