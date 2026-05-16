import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Clock, PlayCircle, Lock, ArrowRight, Star } from "lucide-react";
import CourseContentRenderer from "@/components/Course/CourseContentRenderer";
import FloatingMessenger from "@/components/UI/FloatingMessenger";


export default async function CourseSyllabusPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await getServerSession(authOptions) as any;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      books: {
        orderBy: { order: "asc" },
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
              },
            },
          },
        }
      }
    },
  });

  if (!course) return notFound();
  
  const books = (course as any).books || [];
  const totalBooks = books.length;
  const totalSections = books.reduce((acc: number, b: any) => acc + b.sections.length, 0);
  const totalLessons = books.reduce((acc: number, b: any) => 
    acc + b.sections.reduce((sAcc: number, s: any) => sAcc + s.lessons.length, 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Banner */}
      <div className="bg-slate-900 text-white py-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{course.title}</h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-8">{course.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm font-medium">
             {totalSections > 0 && (
               <span className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700 shadow-sm">
                 <BookOpen size={16} className="text-blue-400" /> {totalSections} Chương học
               </span>
             )}
             <span className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700 shadow-sm">
               <PlayCircle size={16} className="text-emerald-400" /> {totalLessons} Bài học
             </span>
             <span className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700 shadow-sm">
               <Clock size={16} className="text-yellow-400" /> Truy cập trọn đời
             </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-gray-100 p-8 md:p-12 transition-all">
          
          {/* NỘI DUNG BIÊN TẬP TỪ TIPTAP (CHỨA IFRAME, VIDEO) */}
          {course.content ? (
            <div className="mb-12">
              <CourseContentRenderer content={course.content} />
            </div>
          ) : (
             <div className="py-20 text-center text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed mb-12">
               Nội dung chi tiết đang được đội ngũ biên soạn cập nhật...
             </div>
          )}

          {/* SYLLABUS SECTION */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6">
               <div>
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight">Lộ trình học tập</h2>
                 <p className="text-gray-500 text-sm mt-1">Chi tiết các chương và bài học trong khóa học này.</p>
               </div>
               <Link href={`/learn/${course.id}`} className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-blue-200 hover:-translate-y-0.5 items-center gap-2 scale-95 md:scale-100">
                 Vào học ngay <ArrowRight size={18} />
               </Link>
            </div>

            <div className="space-y-12">
              {books.length > 0 ? (
                books.map((book: any, bIdx: number) => (
                  <div key={book.id} className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                          <Star size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Sách {bIdx + 1}</p>
                          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{book.title}</h3>
                       </div>
                    </div>

                    <div className="space-y-6 ml-4 border-l-2 border-slate-100 pl-8">
                      {book.sections.map((section: any, idx: number) => (
                        <div key={section.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                          <div className="bg-gray-50/50 p-5 font-bold text-gray-800 flex justify-between items-center border-b border-gray-100">
                             <span className="flex items-center gap-3">
                               <span className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-xs shadow-sm border border-gray-200">{idx + 1}</span>
                               {section.title}
                             </span>
                             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                               {(section.lessons || []).length} bài học
                             </span>
                          </div>
                          <div className="divide-y divide-gray-100 bg-white">
                            {(section.lessons || []).map((lesson: any) => (
                              <Link 
                                 href={`/learn/${course.id}/lesson/${lesson.id}`} 
                                 key={lesson.id} 
                                 className="flex items-center justify-between p-5 hover:bg-blue-50/30 transition-colors group/lesson cursor-pointer"
                              >
                                 <div className="flex items-center gap-4">
                                   <div className="p-2 bg-gray-50 rounded-xl group-hover/lesson:bg-white group-hover/lesson:shadow-sm transition-all text-gray-400 group-hover/lesson:text-blue-500">
                                     {lesson.contentType === 'VIDEO' ? <PlayCircle size={18} /> : <BookOpen size={18} />}
                                   </div>
                                   <span className="font-semibold text-gray-700 group-hover/lesson:text-gray-900">{lesson.title}</span>
                                 </div>
                                 {lesson.isPreview ? (
                                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded tracking-wider">XEM THỬ</span>
                                 ) : (
                                    <Lock size={16} className="text-gray-300" />
                                 )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-4">
                     <BookOpen size={30} className="text-slate-300" />
                   </div>
                   <p className="text-gray-500 font-medium">Hiện tại chưa có lộ trình chi tiết. Vui lòng quay lại sau.</p>
                </div>
              )}
            </div>
            
            <div className="mt-10 sm:hidden">
              <Link href={`/learn/${course.id}`} className="flex w-full bg-blue-600 text-white justify-center py-4 rounded-2xl font-bold shadow-lg">
                Vào học ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
      <FloatingMessenger />
    </div>
  );
}

// Dummy Icon cho Iframe
function Layout(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
}
