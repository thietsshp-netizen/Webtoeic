import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export const revalidate = 0;
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link"; // Cần thêm dòng này
import { prisma } from "@/lib/prisma";
import CourseContentRenderer from "@/components/Course/CourseContentRenderer";
import { PlayCircle, FileText, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import ToeicTestLoader from "@/components/Toeic/ToeicTestLoader";
import VocabGameLoader from "@/components/Vocab/VocabGameLoader";
import ToeicPart1Loader from "@/components/Toeic/ToeicPart1Loader";
import ToeicPart2Loader from "@/components/Toeic/ToeicPart2Loader";
import ToeicPart34Loader from "@/components/Toeic/ToeicPart34Loader";
import ToeicPart5Loader from "@/components/Toeic/ToeicPart5Loader";
import ToeicPart6Loader from "@/components/Toeic/Part6/ToeicPart6Loader";
import ToeicPart7LoaderV2 from "@/components/Toeic/Part7/ToeicPart7Loader";
import ToeicFullTestLoader from "@/components/Toeic/ToeicFullTestLoader";
import { AdminEditProvider } from "@/components/Admin/AdminEditProvider";

export default async function LessonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { courseId, lessonId } = await params;
  const { q } = await searchParams;
  const session = await getServerSession(authOptions) as any;
  
  console.log("Rebuilding page.tsx to inject tour targets");
  // Lấy dữ liệu bài học từ Prisma
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId }
  });

  if (!lesson) return notFound();

  // 1. KIỂM TRA QUYỀN TRUY CẬP
  let hasAccess = false;
  if (session?.user?.role === "ADMIN" || lesson.isPreview) {
    hasAccess = true;
  } else if (session) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });
    if (enrollment) hasAccess = true;
  }

  // 1.1 GHI NHẬN TIẾN ĐỘ BÀI HỌC (START/VIEW)
  if (hasAccess && session?.user?.id) {
    try {
      await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: session.user.id,
            lessonId: lessonId,
          },
        },
        update: {
          // Chỉ cập nhật updatedAt để lưu vết lần học cuối
        },
        create: {
          userId: session.user.id,
          lessonId: lessonId,
          isCompleted: false,
        },
      });
    } catch (e) {
      console.error("Lỗi khi ghi nhận tiến độ bài học:", e);
    }
  }

  // 2. Fetch Syllabus to determine Next/Prev logic
  const sections = await prisma.section.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        select: { id: true }
      }
    }
  });
  const allLessons = sections.flatMap(s => s.lessons);
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex !== -1 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* HEADER BÀI HỌC (LUÔN HIỂN THỊ) */}
      <div className={`p-6 bg-white border-b flex justify-between items-center shadow-sm relative z-[100] ${["TOEIC_TEST", "DYNAMIC_PART", "PART5_DYNAMIC", "PART6_DYNAMIC", "PART7_DYNAMIC"].includes(lesson.contentType as string) ? "pr-24" : ""}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            {lesson.contentType === "VIDEO" ? <PlayCircle size={24} /> : <FileText size={24} />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {lesson.title}
            </h2>
          </div>

          {/* Portal for extra content in header (like TOEIC timer) */}
          <div id="header-extra-portal" className="flex-1 flex justify-center"></div>
        </div>

        <div id="tour-lesson-nav-target" className="flex gap-1.5">
          {prevLesson ? (
            <Link
              href={`/learn/${courseId}/lesson/${prevLesson.id}`}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <ChevronLeft size={13} /> BÀI TRƯỚC
            </Link>
          ) : (
            <button disabled className="px-3 py-1.5 bg-slate-50 text-slate-300 font-bold text-[10px] rounded-full flex items-center gap-1.5 whitespace-nowrap cursor-not-allowed">
              <ChevronLeft size={13} /> BÀI TRƯỚC
            </button>
          )}

          {nextLesson ? (
            <Link
              href={`/learn/${courseId}/lesson/${nextLesson.id}`}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-600/20"
            >
              BÀI TIẾP <ChevronRight size={13} />
            </Link>
          ) : (
            <button disabled className="px-3 py-1.5 bg-blue-300 text-white font-bold text-[10px] rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-300/20 cursor-not-allowed">
              BÀI TIẾP <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* VÙNG NỘI DUNG BÀI GIẢNG */}
      <div className={`flex-1 ${lesson.contentType === "TOEIC_TEST" || lesson.contentType === "PART6_DYNAMIC" || lesson.contentType === "PART7_DYNAMIC" || lesson.contentType === "DYNAMIC_PART" ? "overflow-hidden pb-0 lg:pb-0" : "overflow-y-auto pb-4 lg:pb-10"} pt-4 px-4 lg:pt-0 lg:px-10 relative`}>
        <div className={`mx-auto ${lesson.contentType === "TOEIC_TEST" || lesson.contentType === "PART6_DYNAMIC" || lesson.contentType === "PART7_DYNAMIC" || lesson.contentType === "DYNAMIC_PART" ? "h-full flex flex-col max-w-[1700px] overflow-hidden" : "max-w-[1200px]"}`}>

          {hasAccess ? (
            /* --- NẾU CÓ QUYỀN: HIỆN NỘI DUNG THẬT --- */
            <>
              <>
                {lesson.contentType === "VIDEO" && lesson.videoUrl && (
                  <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 border-8 border-white mb-8 transition-all hover:scale-[1.01]">
                    <iframe src={lesson.videoUrl} className="w-full h-full" allowFullScreen title="Video"></iframe>
                  </div>
                )}

                {lesson.contentType === "VOCAB_GAME" && lesson.vocabDayId ? (
                  <VocabGameLoader vocabDayId={lesson.vocabDayId} />
                ) : lesson.contentType === "TOEIC_TEST" ? (
                  lesson.toeicTestId?.startsWith("full-test-") ? (
                    <ToeicFullTestLoader
                      toeicTestId={lesson.toeicTestId}
                      lessonId={lesson.id}
                      courseId={courseId}
                      nextLessonId={nextLesson?.id}
                      jumpToQ={q}
                    />
                  ) : (
                    <ToeicTestLoader
                      toeicTestId={lesson.toeicTestId}
                      lessonId={lesson.id}
                      courseId={courseId}
                      nextLessonId={nextLesson?.id}
                      jumpToQ={q}
                    />
                  )
                ) : lesson.contentType === "DYNAMIC_PART" ? (
                  (() => {
                    try {
                      let dynamicConfig: any = {};
                      try {
                        dynamicConfig = typeof lesson.content === 'string' ? JSON.parse(lesson.content || "{}") : (lesson.content || {});
                        if (Array.isArray(dynamicConfig)) dynamicConfig = dynamicConfig[0] || {};
                      } catch (e) {
                        console.error("Failed to parse lesson content", e);
                      }

                      const partNum = dynamicConfig.part;
                      const filtersObj = dynamicConfig.filters || {};
                      const filtersStr = JSON.stringify(filtersObj);


                      if (partNum === 5) return <ToeicPart5Loader content={filtersStr} lessonId={lesson.id} courseId={courseId} nextLessonId={nextLesson?.id} jumpToQ={q} />;
                      if (partNum === 6) return <ToeicPart6Loader content={filtersStr} lessonId={lesson.id} courseId={courseId} nextLessonId={nextLesson?.id} jumpToQ={q} />;
                      if (partNum === 7) return <ToeicPart7LoaderV2 content={filtersStr} lessonId={lesson.id} courseId={courseId} nextLessonId={nextLesson?.id} jumpToQ={q} />;

                      if (partNum === 1) return <ToeicPart1Loader content={filtersStr} lessonId={lesson.id} courseId={courseId} nextLessonId={nextLesson?.id} jumpToQ={q} />;
                      if (partNum === 2) return <ToeicPart2Loader content={filtersStr} lessonId={lesson.id} courseId={courseId} nextLessonId={nextLesson?.id} jumpToQ={q} />;
                      if (partNum === 3 || partNum === 4) return <ToeicPart34Loader content={filtersStr} lessonId={lesson.id} courseId={courseId} nextLessonId={nextLesson?.id} partNumber={partNum} jumpToQ={q} />;

                      return <div className="p-8 text-center text-slate-400 font-bold italic">Giao diện học cho Part {partNum} đang được hoàn thiện.</div>;
                    } catch (e) {
                      return <div className="p-8 text-center text-red-500">Cấu hình bài tập không hợp lệ.</div>;
                    }
                  })()
                ) : lesson.contentType === "PART5_DYNAMIC" ? (
                  <ToeicPart5Loader
                    content={lesson.content || "{}"}
                    lessonId={lesson.id}
                    courseId={courseId}
                    nextLessonId={nextLesson?.id}
                    jumpToQ={q}
                  />
                ) : lesson.contentType === "PART6_DYNAMIC" ? (
                  <ToeicPart6Loader
                    content={lesson.content || "{}"}
                    lessonId={lesson.id}
                    courseId={courseId}
                    nextLessonId={nextLesson?.id}
                    jumpToQ={q}
                  />
                ) : lesson.contentType === "PART7_DYNAMIC" ? (
                  <ToeicPart7LoaderV2
                    content={lesson.content || "{}"}
                    lessonId={lesson.id}
                    courseId={courseId}
                    nextLessonId={nextLesson?.id}
                    jumpToQ={q}
                  />
                ) : (
                  <CourseContentRenderer content={lesson.content} />
                )}
              </>
            </>
          ) : (
            /* --- NẾU CHƯA CÓ QUYỀN: HIỆN LỚP PHỦ THÔNG BÁO --- */
            <div className="relative mt-10">
              <div className="opacity-20 blur-md pointer-events-none select-none">
                <div className="aspect-video w-full bg-slate-200 rounded-[2.5rem] mb-8"></div>
                <div className="h-6 w-full bg-slate-200 rounded mb-4"></div>
                <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 text-center max-w-md scale-110">
                  <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
                    <Lock size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-normal">NỘI DUNG ĐANG KHÓA</h3>
                  <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                    {session
                      ? "Tài khoản của bạn chưa được cấp quyền truy cập. Vui lòng liên hệ Admin để được hỗ trợ mở khóa!"
                      : "Bạn cần đăng nhập và tham gia khóa học này để xem các nội dung chi tiết."}
                  </p>
                  <div className="flex flex-col gap-3">
                    {!session ? (
                      <Link href="/?tab=dashboard" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">
                        ĐĂNG NHẬP NGAY
                      </Link>
                    ) : (
                      <button className="px-8 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/30">
                        LIÊN HỆ MỞ KHÓA
                      </button>
                    )}
                    <Link href={`/courses/${courseId}`} className="px-8 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                      XEM LỘ TRÌNH KHÓA HỌC
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}