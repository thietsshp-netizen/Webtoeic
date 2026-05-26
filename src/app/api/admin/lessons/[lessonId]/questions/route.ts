import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    let questions: any[] = [];

    // Case 1: TOEIC Test (Full Test or single Part Test)
    if (lesson.contentType === "TOEIC_TEST" && lesson.toeicTestId) {
      const testId = lesson.toeicTestId;
      const test = await prisma.toeicTest.findUnique({
        where: { id: testId },
        include: {
          parts: {
            include: {
              groups: {
                include: { questions: { orderBy: { questionNo: 'asc' } } }
              }
            }
          }
        }
      });

      // Kiểm tra ghép nhóm từ Metadata giống API chính
      const title = test?.title?.toUpperCase() || "";
      const bookMatch = title.match(/(ETS\s*\d+|NEW\s*ECONOMY|HACKERS)/i);
      const testMatch = title.match(/TEST\s*(\d+)/i);

      let matchedGroups: any[] = [];
      if (test && (bookMatch || testMatch)) {
        const targetBook = bookMatch ? bookMatch[0].toUpperCase().replace(/[\s\-_]/g, "") : "";
        const targetTestNum = testMatch ? testMatch[1] : "";
        const targetTestNumInt = parseInt(targetTestNum || "0");

        const allGroups = await prisma.toeicQuestionGroup.findMany({
          include: {
            questions: { orderBy: { questionNo: 'asc' } },
            part: true
          }
        });

        allGroups.forEach((g: any) => {
          const m = g.metadata;
          if (!m) return;
          let gBook = "";
          let gTest = "";
          try {
            const mObj = typeof m === 'string' ? JSON.parse(m) : m;
            gBook = String(mObj.Book || mObj.book || "");
            gTest = String(mObj.Test || mObj.test || "");
          } catch (e) {}
          const cleanGBook = gBook.toUpperCase().replace(/[\s\-_]/g, "");
          const cleanGTestNum = gTest.toUpperCase().match(/\d+/)?.[0] || "0";
          const gTestNumInt = parseInt(cleanGTestNum);

          const isBookMatch = targetBook !== "" && (cleanGBook.includes(targetBook) || targetBook.includes(cleanGBook));
          const isTestMatch = targetTestNumInt > 0 && gTestNumInt === targetTestNumInt;

          if (isBookMatch && isTestMatch) {
            matchedGroups.push(g);
          }
        });
      }

      if (matchedGroups.length > 0) {
        matchedGroups.sort((a, b) => 
          (a.questions?.[0]?.questionNo || 0) - (b.questions?.[0]?.questionNo || 0)
        ).forEach(g => {
          if (g.questions) {
            const gMeta = g.metadata as any || {};
            const bookName = gMeta.Book || gMeta.book || "";
            const testName = gMeta.Test || gMeta.test || "";
            g.questions.forEach((q: any) => {
              questions.push({
                id: q.id,
                questionNo: q.questionNo,
                book: bookName,
                test: testName
              });
            });
          }
        });
      } else if (test && test.parts) {
        // Sắp xếp các part và group
        const sortedParts = [...test.parts].sort((a, b) => a.partNumber - b.partNumber);
        sortedParts.forEach(part => {
          if (part.groups) {
            const sortedGroups = [...part.groups].sort((a, b) => 
              (a.questions?.[0]?.questionNo || 0) - (b.questions?.[0]?.questionNo || 0)
            );
            sortedGroups.forEach(group => {
              if (group.questions) {
                const gMeta = group.metadata as any || {};
                const bookName = gMeta.Book || gMeta.book || "";
                const testName = gMeta.Test || gMeta.test || "";
                group.questions.forEach((q: any) => {
                  questions.push({
                    id: q.id,
                    questionNo: q.questionNo,
                    book: bookName,
                    test: testName
                  });
                });
              }
            });
          }
        });
      }
    } 
    // Case 2: Dynamic / Categorized Practice
    else if (["DYNAMIC_PART", "PART5_DYNAMIC", "PART6_DYNAMIC", "PART7_DYNAMIC"].includes(lesson.contentType)) {
      let dynamicConfig: any = {};
      try {
        let contentStr = lesson.content || "{}";
        dynamicConfig = typeof contentStr === 'string' ? JSON.parse(contentStr) : contentStr;
        if (Array.isArray(dynamicConfig)) dynamicConfig = dynamicConfig[0] || {};
      } catch (e) {}

      let partNum = 5;
      if (lesson.contentType === "PART5_DYNAMIC") partNum = 5;
      else if (lesson.contentType === "PART6_DYNAMIC") partNum = 6;
      else if (lesson.contentType === "PART7_DYNAMIC") partNum = 7;
      else if (lesson.contentType === "DYNAMIC_PART") partNum = dynamicConfig.part || 5;

      const filters = dynamicConfig.filters || dynamicConfig || {};

      const allBankQuestions = await prisma.toeicQuestion.findMany({
        where: {
          group: {
            part: {
              partNumber: partNum
            }
          }
        },
        include: {
          group: true
        }
      });

      questions = allBankQuestions.filter((q: any) => {
        const qMeta = q.metadata as any || {};
        const gMeta = q.group.metadata as any || {};
        let match = true;
        
        if (filters.day && String(qMeta.day || "").toLowerCase() !== String(filters.day).toLowerCase()) match = false;
        if (filters.book && String(gMeta.book || gMeta.Book || "").trim().toLowerCase() !== String(filters.book).trim().toLowerCase()) match = false;
        if (filters.test && String(gMeta.test || gMeta.Test || "").trim().toString() !== String(filters.test).trim().toString()) match = false;
        
        if (filters.type) {
          const qType = String(qMeta.Question_Type || qMeta.type || "").trim().toLowerCase();
          if (qType !== String(filters.type).trim().toLowerCase()) match = false;
        }
        
        return match;
      }).map(q => {
        const gMeta = q.group?.metadata as any || {};
        const bookName = gMeta.Book || gMeta.book || "";
        const testName = gMeta.Test || gMeta.test || "";
        return {
          id: q.id,
          questionNo: q.questionNo,
          book: bookName,
          test: testName
        };
      }).sort((a, b) => (a.questionNo || 0) - (b.questionNo || 0));
    }

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
