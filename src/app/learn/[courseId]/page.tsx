import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { BarChart, CheckCircle2, Target, BarChart2, Flag, XCircle } from "lucide-react";

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getServerSession(authOptions) as any;
  const userId = session?.user?.id;


  // Lấy chi tiết khóa học và cấu trúc bài học
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        include: { lessons: true }
      }
    }
  });

  if (!course) return <div>Không tìm thấy khoá học</div>;

  const lessons = course.sections.flatMap(s => s.lessons);
  const lessonIds = lessons.map(l => l.id);

  if (!userId) {
    const firstPreviewLesson = lessons.find(l => l.isPreview);
    if (firstPreviewLesson) {
      redirect(`/learn/${courseId}/lesson/${firstPreviewLesson.id}`);
    } else {
      redirect("/auth/signin");
    }
  }



  // Lấy tất cả QuestionAttempt của khoá học này (thông qua lessonIds)
  const attempts = await prisma.questionAttempt.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds }
    },
    include: {
      question: {
        include: {
          group: {
            include: {
              part: true
            }
          }
        }
      }
    }
  });

  const totalQuestionsDone = attempts.length;
  const correctQuestions = attempts.filter((a: any) => a.isCorrect).length;
  const incorrectQuestions = totalQuestionsDone - correctQuestions;
  const flaggedQuestions = attempts.filter((a: any) => a.isFlagged).length;

  const correctRate = totalQuestionsDone > 0 ? Math.round((correctQuestions / totalQuestionsDone) * 100) : 0;

  // Analytics per part
  const partStats: Record<number, { total: number, correct: number }> = {};
  for (let i = 1; i <= 7; i++) {
    partStats[i] = { total: 0, correct: 0 };
  }

  attempts.forEach((a: any) => {
    const partNumber = a.question?.group?.part?.partNumber;
    if (partNumber && partStats[partNumber]) {
      partStats[partNumber].total++;
      if (a.isCorrect) partStats[partNumber].correct++;
    }
  });

  // Lấy tiến độ bài học mới nhất của học viên trong khoá này
  const lastProgress = userId && lessonIds.length > 0
    ? await prisma.lessonProgress.findFirst({
        where: {
          userId,
          lessonId: { in: lessonIds }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          lesson: true
        }
      })
    : null;

  const firstLessonId = lessons.length > 0 ? lessons[0].id : null;
  const activeLessonId = lastProgress ? lastProgress.lessonId : firstLessonId;
  const activeLessonTitle = lastProgress ? lastProgress.lesson.title : null;

  return (
    <div className="w-full min-h-full bg-[#f8fafc]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 pt-10 pb-12 px-10 text-white shadow-md relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <BarChart2 size={300} className="translate-x-10 -translate-y-10" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-3xl font-black mb-2 tracking-tight">PHÂN TÍCH TIẾN ĐỘ HỌC TẬP</h1>
          <p className="text-slate-100 font-medium text-lg leading-relaxed max-w-2xl mb-8">
            Theo dõi báo cáo điểm số, đánh giá các kỹ năng mạnh/yếu, và dễ dàng tiếp tục quá trình ôn thi TOEIC của bạn.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl max-w-2xl border border-white/10 animate-fade-in shadow-xl">
            <div className="flex-1">
              {lastProgress ? (
                <p className="text-sm font-semibold text-blue-100 leading-normal">
                  Bạn đang học dở bài: <span className="text-white font-black block text-base mt-1">{activeLessonTitle}</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-blue-100 leading-normal">
                  Bạn chưa có bài học dang dở nào trong khoá học này.
                </p>
              )}
            </div>

            {activeLessonId && (
              <Link
                href={`/learn/${courseId}/lesson/${activeLessonId}`}
                className="bg-white text-blue-700 px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-blue-50 transition-all shadow-md flex items-center justify-center gap-2 self-start sm:self-auto hover:-translate-y-0.5"
              >
                <Target size={14} />
                {lastProgress ? "Học Tiếp Ngay" : "Học Bài Đầu Tiên Ngay"}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-8 mt-6 space-y-8 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Tỷ lệ đúng</span>
            <span className="text-3xl font-black text-slate-800">{correctRate}%</span>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
              <Target size={24} />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Đã trả lời</span>
            <span className="text-3xl font-black text-slate-800">{totalQuestionsDone} <span className="text-sm">câu</span></span>
          </div>

          <Link href={`/learn/${courseId}/review?filter=incorrect`} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center hover:bg-red-50 cursor-pointer transition-colors group">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-100">
              <XCircle size={24} />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Câu sai</span>
            <span className="text-3xl font-black text-slate-800">{incorrectQuestions}</span>
          </Link>

          <Link href={`/learn/${courseId}/review?filter=flagged`} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center hover:bg-orange-50 cursor-pointer transition-colors group">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-100">
              <Flag fill="currentColor" size={20} />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Đang gắn cờ</span>
            <span className="text-3xl font-black text-slate-800">{flaggedQuestions}</span>
          </Link>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <BarChart size={24} className="text-blue-500" /> PHÂN TÍCH TỪNG PART
          </h2>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6, 7].map(partNo => {
              const stats = partStats[partNo];
              const pRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
              return (
                <div key={partNo}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">Part {partNo}</span>
                    <span className="text-sm font-black text-slate-500">
                      {stats.total > 0 ? `${stats.correct} / ${stats.total} (${pRate}%)` : 'Chưa làm'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${pRate >= 80 ? 'bg-emerald-500' : pRate >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                      style={{ width: `${pRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
