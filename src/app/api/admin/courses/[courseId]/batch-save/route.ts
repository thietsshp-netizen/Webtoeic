import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface DraftData {
  title?: string;
  order?: number;
  [key: string]: any;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const session = await getServerSession(authOptions) as any;

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { lessons, sections, books, deletions } = await req.json();

    await prisma.$transaction(async (tx) => {
      // --- PHẦN 1: XỬ LÝ XÓA ---
      if (deletions) {
        if (deletions.lessons?.length > 0) {
          await tx.lesson.deleteMany({ where: { id: { in: deletions.lessons } } });
        }
        if (deletions.sections?.length > 0) {
          await tx.section.deleteMany({ where: { id: { in: deletions.sections } } });
        }
        if (deletions.books?.length > 0) {
          await (tx as any).book.deleteMany({ where: { id: { in: deletions.books } } });
        }
      }

      // --- PHẦN 2: XỬ LÝ SÁCH (BOOKS) ---
      const bookMapping: Record<string, string> = {};
      if (books && typeof books === "object") {
        for (const [id, data] of Object.entries(books as Record<string, DraftData>)) {
          if (deletions?.books?.includes(id)) continue;
          if (id.startsWith("temp")) {
            const newBook = await (tx as any).book.create({
              data: {
                title: data.title || "Sách mới",
                order: data.order || 0,
                courseId: courseId
              }
            });
            bookMapping[id] = newBook.id;
          } else {
            await (tx as any).book.updateMany({
              where: { id },
              data: {
                title: data.title,
                order: data.order
              }
            });
          }
        }
      }

      // --- PHẦN 3: XỬ LÝ CHƯƠNG (SECTIONS) ---
      const sectionMapping: Record<string, string> = {};
      if (sections && typeof sections === "object") {
        for (const [id, data] of Object.entries(sections as Record<string, DraftData>)) {
          if (deletions?.sections?.includes(id)) continue;
          // Resolve bookId nếu nó là temp
          const finalBookId = data.bookId?.startsWith("temp") 
            ? bookMapping[data.bookId] 
            : data.bookId;

          if (id.startsWith("temp")) {
            const newSection = await tx.section.create({
              data: {
                title: data.title || "Chương mới",
                order: data.order || 0,
                courseId: courseId,
                bookId: finalBookId
              }
            });
            sectionMapping[id] = newSection.id;
          } else {
            await tx.section.updateMany({
              where: { id },
              data: {
                title: data.title,
                order: data.order,
                bookId: finalBookId
              }
            });
          }
        }
      }

      // --- PHẦN 4: XỬ LÝ BÀI HỌC (LESSONS) ---
      if (lessons && typeof lessons === "object") {
        for (const [id, data] of Object.entries(lessons as Record<string, DraftData>)) {
          if (deletions?.lessons?.includes(id)) continue;

          // Resolve sectionId nếu nó là temp
          const finalSectionId = data.sectionId?.startsWith("temp") 
            ? sectionMapping[data.sectionId] 
            : data.sectionId;

          if (id.startsWith("temp")) {
            await tx.lesson.create({
              data: {
                title: data.title || "Bài học mới",
                order: data.order || 0,
                sectionId: finalSectionId,
                contentType: data.contentType || "TEXT",
                content: data.content || "",
                videoUrl: data.videoUrl,
                videoExplanation: data.videoExplanation,
                toeicTestId: data.toeicTestId === "" ? null : (data.toeicTestId || undefined),
                vocabDayId: data.vocabDayId === "" ? null : (data.vocabDayId || undefined),
                isPreview: data.isPreview || false
              }
            });
          } else {
            await tx.lesson.update({
              where: { id },
              data: {
                title: data.title,
                sectionId: finalSectionId,
                contentType: data.contentType,
                content: data.content,
                videoUrl: data.videoUrl,
                videoExplanation: data.videoExplanation,
                toeicTestId: data.toeicTestId === "" ? null : (data.toeicTestId || undefined),
                vocabDayId: data.vocabDayId === "" ? null : (data.vocabDayId || undefined),
                isPreview: data.isPreview,
                order: data.order
              }
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Batch save error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
