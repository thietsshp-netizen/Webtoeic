import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ToeicReviewManager, { ReviewItem } from "@/components/Toeic/ToeicReviewManager";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReviewPage({
  params,
  searchParams
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ filter?: 'all' | 'incorrect' | 'flagged' | 'note', active?: string }>;
}) {
  const { courseId } = await params;
  const { filter = 'all' } = await searchParams;
  const session = await getServerSession(authOptions) as any;
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  // Lấy chi tiết khóa học
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        include: { lessons: true }
      }
    }
  });

  if (!course) return <div>Không tìm thấy khoá học</div>;

  const lessons = course.sections.flatMap((s: any) => s.lessons);
  const lessonIds = lessons.map((l: any) => l.id);

  // Luôn lấy toàn bộ câu sai HOẶC câu gắn cờ để Client có thể switch filter mượt mà
  const condition: any = {
    userId,
    lessonId: { in: lessonIds },
    OR: [
      { isCorrect: false },
      { isFlagged: true },
      { flagNote: { not: null } },
      { flagNote: { not: "" } }
    ]
  };

  const attempts = await prisma.questionAttempt.findMany({
    where: condition,
    include: {
       question: {
         include: {
           group: {
             include: {
               part: true,
               questions: true
             }
           }
         }
       },
       lesson: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // Chỉ giữ câu sai (đã trả lời) HOẶC câu gắn cờ HOẶC câu có ghi chú
  const filteredAttempts = attempts.filter(a => {
    const hasAnswer = a.userAnswer && a.userAnswer !== "";
    const isIncorrect = a.isCorrect === false && hasAnswer;
    const isFlagged = a.isFlagged;
    const hasNote = a.flagNote && a.flagNote.trim() !== "";
    return isIncorrect || isFlagged || hasNote;
  });

  // Chuyển đổi sang format mà ReviewManager cần
  const reviewItems: ReviewItem[] = filteredAttempts.map(a => ({
    attemptId: a.id,
    questionId: a.questionId,
    lessonId: a.lessonId || '',
    courseId: courseId,
    lessonTitle: a.lesson?.title || 'Bài học',
    partNumber: a.question.group.part?.partNumber || 1,
    isCorrect: a.isCorrect,
    isFlagged: a.isFlagged,
    flagColor: ((a as any).flagColor as any) || 'RED',
    flagNote: a.flagNote || (a.question as any).flagNote || (a.question as any).note || '',
    userAnswer: a.userAnswer || '',
    updatedAt: a.updatedAt.toISOString(),
    question: a.question
  }));

  return (
    <div className="flex flex-col h-screen bg-slate-50 p-4 lg:p-8">
      {/* Breadcrumb / Header thu nhỏ */}
      <div className="mb-6 flex items-center justify-between px-4">
         <div>
            <Link href="/?tab=dashboard" className="text-slate-400 group flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-blue-600 transition-colors">
               <ArrowLeft size={16} /> Quay lại Dashboard
            </Link>
            <h1 className="text-xl font-black text-slate-800 mt-2">TRUNG TÂM ÔN TẬP CÁ NHÂN</h1>
         </div>
         <div className="hidden md:block">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-8">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Khóa học</span>
                  <span className="text-xs font-bold text-slate-700">{course.title}</span>
               </div>
               <div className="w-px h-8 bg-slate-100" />
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Tổng số câu</span>
                  <span className="text-xs font-black text-blue-600">{reviewItems.length} mục</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 min-h-0">
          <ToeicReviewManager 
            initialItems={reviewItems} 
            courseId={courseId} 
            filterType={filter} 
          />
      </div>
    </div>
  );
}
