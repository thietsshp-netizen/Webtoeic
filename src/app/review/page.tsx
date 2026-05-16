import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import ToeicReviewManager from "@/components/Toeic/ToeicReviewManager";
import { AdminEditProvider } from "@/components/Admin/AdminEditProvider";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GlobalReviewPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: 'all' | 'incorrect' | 'flagged' | 'note', active?: string }>;
}) {
  const { filter = 'all' } = await searchParams;
  const session = await getServerSession(authOptions) as any;
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  // Lấy kết quả MỚI NHẤT của mỗi câu hỏi (distinct by questionId, lấy updatedAt lớn nhất)
  // Bước 1: Lấy toàn bộ attempts của user, sắp xếp mới nhất trước
  const allAttempts = await prisma.questionAttempt.findMany({
    where: { userId },
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
       lesson: {
         include: {
           section: {
             include: {
               course: true
             }
           }
         }
       }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // Bước 2: Dedup – giữ lại chỉ 1 record mới nhất cho mỗi questionId
  const seenQuestions = new Set<string>();
  const latestAttempts = allAttempts.filter(a => {
    if (seenQuestions.has(a.questionId)) return false;
    seenQuestions.add(a.questionId);
    return true;
  });

  // Bước 3: Chỉ giữ câu sai (đã trả lời) HOẶC câu gắn cờ HOẶC câu có ghi chú
  const attempts = latestAttempts.filter(a => {
    const hasAnswer = a.userAnswer && a.userAnswer.trim() !== "";
    const isIncorrect = a.isCorrect === false && hasAnswer;
    const isFlagged = a.isFlagged;
    const hasNote = a.flagNote && a.flagNote.trim() !== "";
    return isIncorrect || isFlagged || hasNote;
  });

  // Chuyển đổi sang format mà ReviewManager cần
  const reviewItems = attempts.map(a => ({
    attemptId: a.id,
    questionId: a.questionId,
    lessonId: a.lessonId || '',
    courseId: a.lesson?.section?.course?.id || '',
    courseTitle: a.lesson?.section?.course?.title || 'Khóa học học viên',
    lessonTitle: a.lesson?.title || 'Bài học',
    partNumber: a.question.group.part?.partNumber || 1,
    isCorrect: a.isCorrect,
    isFlagged: a.isFlagged,
    flagColor: a.flagColor as any,
    flagNote: a.flagNote || (a.question as any).flagNote || (a.question as any).note || '',
    userAnswer: a.userAnswer || '',
    updatedAt: a.updatedAt.toISOString(),
    question: a.question
  }));

  return (
    <div className="flex flex-col h-screen bg-slate-50 p-4 lg:p-8">
      {/* Breadcrumb / Header */}
      <div className="mb-6 flex items-center justify-between px-4">
         <div>
            <Link href="/?tab=dashboard" className="text-slate-400 group flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-blue-600 transition-colors">
               <ArrowLeft size={16} /> Quay lại Dashboard
            </Link>
            <h1 className="text-xl font-black text-slate-800 mt-2 italic uppercase tracking-tight">Trung Tâm Ôn Tập Tổng Hợp</h1>
         </div>
         <div className="hidden md:block">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-8">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Trạng thái</span>
                  <span className="text-xs font-bold text-slate-700">Tất cả bài học</span>
               </div>
               <div className="w-px h-8 bg-slate-100" />
               <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cần ôn tập</span>
                  <span className="text-xs font-black text-orange-600">{reviewItems.length} mục</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 min-h-0">
        <AdminEditProvider>
          <ToeicReviewManager 
            initialItems={reviewItems} 
            courseId="global"
            filterType={filter} 
          />
        </AdminEditProvider>
      </div>
    </div>
  );
}
