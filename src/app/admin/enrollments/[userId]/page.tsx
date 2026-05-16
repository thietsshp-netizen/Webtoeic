import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Target, XCircle, Flag, BookOpen, Clock } from "lucide-react";

export default async function AdminStudentProgressPage({
  params
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params;
  const session = await getServerSession(authOptions) as any;
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  // Lấy thông tin user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
         include: { course: true }
      }
    }
  });

  if (!user) return <div>Học viên không tồn tại</div>;

  // Lấy toàn bộ QuestionAttempt của học viên để tính toán tiến độ (Trigger Rebuild)
  const attempts = await prisma.questionAttempt.findMany({
    where: { userId },
    include: {
      question: {
        include: {
          group: { include: { part: true } }
        }
      },
      lesson: { 
        include: { 
          section: {
            include: { course: true }
          }
        }
      }
    }
  });

  const totalQuestionsDone = attempts.length;
  const correctQuestions = attempts.filter(a => a.isCorrect).length;
  const incorrectQuestions = totalQuestionsDone - correctQuestions;
  const flaggedQuestions = attempts.filter(a => a.isFlagged).length;
  const correctRate = totalQuestionsDone > 0 ? Math.round((correctQuestions / totalQuestionsDone) * 100) : 0;

  // Thống kê theo từng khóa học
  const courseStats: Record<string, { title: string, total: number, correct: number }> = {};
  
  attempts.forEach(a => {
     if (a.lesson?.section?.course) {
        const cId = a.lesson.section.course.id;
        if (!courseStats[cId]) {
           courseStats[cId] = { title: a.lesson.section.course.title, total: 0, correct: 0 };
        }
        courseStats[cId].total++;
        if (a.isCorrect) courseStats[cId].correct++;
     }
  });

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <Link href="/admin/enrollments" className="text-blue-600 flex items-center gap-2 text-sm font-bold mb-6 hover:underline">
         <ArrowLeft size={16} /> Quay lại danh sách
      </Link>
      
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
         <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            {(user.name || user.email || "?")[0].toUpperCase()}
         </div>
         <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
               Tiến độ học tập: {user.name || "Học viên"}
            </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-4">
              <span>{user.email}</span>
              <span className="flex items-center gap-1 text-slate-400"><Clock size={14} /> Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
            <span className="text-3xl font-black text-slate-800">{totalQuestionsDone}</span>
         </div>
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-red-500">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
              <XCircle size={24} />
            </div>
            <span className="text-sm font-bold text-red-400 uppercase tracking-widest mb-1">Câu sai</span>
            <span className="text-3xl font-black">{incorrectQuestions}</span>
         </div>
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-orange-500">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-3">
              <Flag fill="currentColor" size={20} />
            </div>
            <span className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-1">Đã gắn cờ</span>
            <span className="text-3xl font-black">{flaggedQuestions}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
               <BookOpen size={18} className="text-blue-500" /> THỐNG KÊ THEO KHÓA HỌC
            </h2>
            <div className="space-y-4">
               {Object.values(courseStats).map((stat, i) => {
                  const rate = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                  return (
                     <div key={i} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-slate-700">{stat.title}</span>
                           <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded">
                             {stat.correct} / {stat.total}
                           </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full transition-all duration-1000 ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                        </div>
                     </div>
                  );
               })}
               {Object.keys(courseStats).length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">Chưa có dữ liệu làm bài thi từ khóa học nào.</p>
               )}
            </div>
         </div>

         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
               <Target size={18} className="text-violet-500" /> CÁC KHÓA ĐÃ CẤP QUYỀN
            </h2>
            <ul className="space-y-3">
               {user.enrollments.map(enrol => (
                  <li key={enrol.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <CheckCircle2 size={16} className="text-emerald-500" />
                     <span className="text-sm font-bold text-slate-700">{enrol.course.title}</span>
                  </li>
               ))}
               {user.enrollments.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">Học viên chưa được cấp quyền khóa học nào.</p>
               )}
            </ul>
         </div>
      </div>
    </div>
  );
}
