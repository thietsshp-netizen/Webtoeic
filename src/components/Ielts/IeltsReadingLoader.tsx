import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import IeltsReadingPlayer from "./IeltsReadingPlayer";
import { notFound } from "next/navigation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface IeltsReadingLoaderProps {
  lessonId: string;
  courseId?: string;
  nextLessonId?: string;
}

export default async function IeltsReadingLoader({
  lessonId,
  courseId,
  nextLessonId
}: IeltsReadingLoaderProps) {
  // 1. Tải thông tin Lesson từ database
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId }
  });

  if (!lesson) {
    return notFound();
  }

  // 2. Parse dữ liệu JSON từ trường content
  let passagesData: any[] = [];
  try {
    if (lesson.content) {
      const parsed = JSON.parse(lesson.content);
      passagesData = Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (e) {
    console.error("Error parsing IELTS Reading JSON content:", e);
  }

  // 3. Lấy thông tin user session
  const session = await getServerSession(authOptions) as any;
  const userId = session?.user?.id || null;

  // 4. Tìm kiếm xem học viên đã từng có lượt nộp bài nào cho lesson này chưa
  let previousAttempts: any[] = [];
  if (userId) {
    previousAttempts = await prisma.fullTestAttempt.findMany({
      where: {
        userId,
        lessonId
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  return (
    <IeltsReadingPlayer
      passages={passagesData}
      lessonId={lessonId}
      courseId={courseId}
      nextLessonId={nextLessonId}
      previousAttempts={previousAttempts}
      userId={userId}
    />
  );
}
