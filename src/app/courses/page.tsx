import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import CourseCard from "@/components/Course/CourseCard";
import { Star } from "lucide-react";
import FloatingMessenger from "@/components/UI/FloatingMessenger";


// Luôn render động để lấy dữ liệu mới nhất từ DB
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const session = await getServerSession(authOptions) as any;
  const isAdmin = session?.user?.role === "ADMIN";

  let courses: any[] = [];
  try {
    courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sections: true, enrollments: true }
        },
        sections: {
          select: {
            id: true,
            _count: {
              select: { lessons: true }
            },
            lessons: {
              select: { id: true, isPreview: true }
            }
          }
        }
      }
    });

    const progresses = session?.user?.id 
      ? await prisma.lessonProgress.findMany({
          where: { userId: session.user.id, isCompleted: true },
          select: { lessonId: true }
        })
      : [];
    const completedSet = new Set(progresses.map(p => p.lessonId));

    const processedCourses = (courses || []).map(course => {
      let totalLessons = 0;
      let completedLessons = 0;
      let previewCount = 0;

      const sections = course.sections || [];
      sections.forEach((sec: any) => {
        const lessonCount = sec.lessons?.length || 0;
        totalLessons += lessonCount;
        
        if (sec.lessons) {
          sec.lessons.forEach((les: any) => {
            if (completedSet.has(les.id)) completedLessons++;
            if (les.isPreview) previewCount++;
          });
        }
      });

      const totalSections = sections.length;
      const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

      return { 
        ...course, 
        totalLessons, 
        totalSections,
        completedLessons, 
        progressPercent,
        previewCount
      };
    });
    courses = processedCourses;
  } catch (error) {
    console.error('[COURSES_FETCH_ERROR]', error);
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-[#fcfdfe] pt-20 py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
               <Star size={14} fill="currentColor" /> HỆ THỐNG KHÓA HỌC CHUẨN TOEIC
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-6 italic">Chinh Phục TOEIC Theo Cách Của Bạn</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
              Hệ thống bài giảng được thiết kế cá nhân hóa, giúp bạn nắm vững kiến thức và bứt phá điểm số trong thời gian ngắn nhất.
            </p>
          </div>

          {courses.length === 0 ? (
             <div className="text-center py-24 bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-slate-100 text-slate-400 font-bold">
                Hiện các chuyên gia đang cập nhật khóa học mới. Vui lòng quay lại sau!
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {courses.map((course: any) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  isAdmin={isAdmin} 
                  showProgress={true} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <FloatingMessenger />
    </>
  );
}
