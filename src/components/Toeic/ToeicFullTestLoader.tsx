import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToeicFullTestClientWrapper from "./ToeicFullTestClientWrapper";

export const revalidate = 0;

interface FullTestConfig {
  book: string;
  test: string;
}

export default async function ToeicFullTestLoader({
  content,
  lessonId,
  courseId,
  nextLessonId,
  toeicTestId, // ID đặc biệt full-test-ets2026-t1
  jumpToQ
}: {
  content?: string;
  lessonId: string;
  courseId?: string;
  nextLessonId?: string;
  toeicTestId?: string | null;
  jumpToQ?: string;
}) {
  let book = "";
  let test = "";

  // 1. Tìm kiếm chính xác ToeicTest record trước khi kiểm tra book/test
  let dbTest = null;
  if (toeicTestId) {
    dbTest = await prisma.toeicTest.findFirst({
      where: {
        OR: [
          { id: toeicTestId },
          { id: toeicTestId.replace("full-test-", "") }
        ]
      },
      include: {
        parts: {
          orderBy: { partNumber: 'asc' },
          include: {
            groups: {
              include: { questions: { orderBy: { questionNo: 'asc' } } }
            }
          }
        }
      }
    });
  }

  // 2. Phân tích cấu hình (Ưu tiên từ Slug hoặc Content, Fallback từ dbTest title)
  if (toeicTestId && toeicTestId.startsWith("full-test-")) {
    const parts = toeicTestId.split("-");
    book = parts[2]?.toUpperCase() || "";
    test = parts[3]?.replace("t", "") || "";
  } else if (content) {
    try {
      const config = JSON.parse(content) as FullTestConfig;
      book = config.book;
      test = config.test;
    } catch (e) { }
  }

  // Nếu vẫn chưa có book/test nhưng đã tìm thấy dbTest, lấy từ title của dbTest
  if (dbTest && (!book || !test)) {
    const title = dbTest.title;
    const testMatch = title.match(/Test\s*(\d+)/i);
    test = test || (testMatch ? testMatch[1] : "1");
    book = book || title.replace(/Test\s*\d+/i, "").replace(/[-–—]/g, "").trim() || "TOEIC";
  }

  // 3. FALLBACK: Nếu tìm theo ID nhưng dbTest không có dữ liệu (0 parts), hoặc chưa tìm thấy dbTest
  const dbTestIsEmpty = dbTest && dbTest.parts.length === 0;
  if (!dbTest || dbTestIsEmpty) {
    // Thử lấy thông tin từ tiêu đề bài học nếu book/test vẫn trống
    // Thường tên bài là "Đề 2020 - Test 3"
    const lessonMatch = (book && test) ? null : (toeicTestId || "").match(/(\d{4}).*?(\d+)/);
    const searchBook = book || (lessonMatch ? lessonMatch[1] : "");
    const searchTest = test || (lessonMatch ? lessonMatch[2] : "");

    if (searchBook && searchTest) {
      const tests = await prisma.toeicTest.findMany({
        where: {
          AND: [
            { title: { contains: searchBook, mode: 'insensitive' } },
            { title: { contains: searchTest, mode: 'insensitive' } }
          ]
        },
        include: {
          parts: {
            orderBy: { partNumber: 'asc' },
            include: {
              groups: {
                include: { questions: { orderBy: { questionNo: 'asc' } } }
              }
            }
          }
        }
      });

      if (tests.length > 0) {
        const exactTest = tests.find(t => {
          const title = t.title.toLowerCase();
          const regex = new RegExp(`test\\s*${searchTest}(\\D|$)`, 'i');
          return regex.test(title);
        });
        const foundTest = exactTest || tests[0];
        // Chỉ ghi đè nếu bản ghi mới có dữ liệu tốt hơn
        if (!dbTest || (foundTest.parts.length > (dbTest?.parts?.length || 0))) {
          dbTest = foundTest;
          book = book || searchBook;
          test = test || searchTest;
        }
      }
    }
  }

  // 4. Nếu cuối cùng vẫn không có dbTest mới báo lỗi
  if (!dbTest || (dbTest.parts.length === 0 && !book)) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-white rounded-3xl m-4 border border-dashed">
        Không tìm thấy bộ đề phù hợp hoặc bộ đề chưa có dữ liệu. (Book: {book}, Test: {test})
      </div>
    );
  }

  const aggregatedData: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  const seenGroupIds = new Set<string>();

  // --- LOGIC QUÉT DỮ LIỆU TỰ ĐỘNG THEO METADATA (BÊ NGUYÊN TỪ ADMIN) ---
  if (dbTest) {
    const title = dbTest.title.toUpperCase();
    const bookMatch = title.match(/(ETS\s*\d+|NEW\s*ECONOMY|HACKERS)/i);
    const testMatch = title.match(/TEST\s*(\d+)/i);

    if (bookMatch || testMatch) {
      const targetBook = bookMatch ? bookMatch[0].toUpperCase().replace(/[\s\-_]/g, "") : (book || "").toUpperCase().replace(/[\s\-_]/g, "");
      const targetTestNum = testMatch ? testMatch[1] : test;
      const targetTestNumInt = parseInt(targetTestNum || "0");

      // 1. TỐI ƯU: Tìm kiếm "lỏng" ở Database để lấy về các ứng viên tiềm năng
      // Lấy từ khóa chính (ví dụ: ETS, ECONOMY...) để database lọc nhanh
      const mainKeyword = targetBook.match(/[A-Z]{3,}/i)?.[0] || targetBook.substring(0, 3);

      const allGroups = await prisma.toeicQuestionGroup.findMany({
        where: {
          OR: [
            { metadata: { path: ['Book'], string_contains: mainKeyword } },
            { metadata: { path: ['book'], string_contains: mainKeyword } },
            { passageText: { contains: mainKeyword, mode: 'insensitive' } }
          ]
        },
        include: {
          questions: { orderBy: { questionNo: 'asc' } },
          part: true
        }
      });

      const normalizedTargetBook = targetBook.toUpperCase().replace(/[\s\-_]/g, "");

      // 1. Lấy tất cả câu hỏi thực tế của toàn bộ đề này trong 1 lần duy nhất để lấy ID THẬT
      const allDbQuestions = await prisma.toeicQuestion.findMany({
        where: {
          group: {
            part: { test: { id: dbTest.id } }
          }
        },
        select: { id: true, questionNo: true, groupId: true }
      });
      const idMap = new Map();
      allDbQuestions.forEach(dq => idMap.set(dq.questionNo, dq.id));

      console.log(`[LOADER] Found ${allDbQuestions.length} real questions in DB for test ${dbTest.title}`);
      if (allDbQuestions.length > 0) {
        console.log(`[LOADER] Sample mapping: Q172 -> ${idMap.get(172)}, Q178 -> ${idMap.get(178)}`);
      }

      allGroups.forEach((g: any) => {
        const m = g.metadata;
        if (!m) return;

        let gBook = "";
        let gTest = "";
        try {
          const mObj = typeof m === 'string' ? JSON.parse(m) : m;
          gBook = String(mObj.Book || mObj.book || "");
          gTest = String(mObj.Test || mObj.test || "");
        } catch (e) { }

        // CHUẨN HÓA: Xóa sạch dấu cách, gạch ngang, gạch dưới
        const cleanGBook = gBook.toUpperCase().replace(/[\s\-_]/g, "");
        const cleanGTestNum = gTest.toUpperCase().match(/\d+/)?.[0] || "0";
        const gTestNumInt = parseInt(cleanGTestNum);

        // So sánh chính xác sau khi đã chuẩn hóa
        const isBookMatch = normalizedTargetBook !== "" && (cleanGBook.includes(normalizedTargetBook) || normalizedTargetBook.includes(cleanGBook));
        const isTestMatch = targetTestNumInt > 0 && gTestNumInt === targetTestNumInt;

        if (isBookMatch && isTestMatch) {
          if (seenGroupIds.has(g.id)) return;
          seenGroupIds.add(g.id);

          // Xử lý nạp từ JSON nếu cần
          if ((!g.questions || g.questions.length === 0) && g.passageText && g.passageText.trim().startsWith('{')) {
            try {
              const jsonData = JSON.parse(g.passageText);
              const jsonQuestions = jsonData.questions || (jsonData.question ? (Array.isArray(jsonData.question) ? jsonData.question : [jsonData.question]) : []);
              g.questions = jsonQuestions.map((jq: any, idx: number) => ({
                ...jq,
                // Đảm bảo ID duy nhất bằng cách kết hợp ID group và index
                id: jq.id ? `${jq.id}_${g.id}_${idx}` : `q-json-${g.id}-${idx}`,
                questionNo: jq.questionNo || jq.question_no || jq.number || (idx + 1)
              }));
            } catch (e) { }
          }

          let pNum = g.part?.partNumber || 0;
          if (pNum === 0 && g.questions?.length > 0) {
            const qNo = g.questions[0].questionNo;
            if (qNo >= 1 && qNo <= 6) pNum = 1;
            else if (qNo >= 7 && qNo <= 31) pNum = 2;
            else if (qNo >= 32 && qNo <= 70) pNum = 3;
            else if (qNo >= 71 && qNo <= 100) pNum = 4;
            else if (qNo >= 101 && qNo <= 130) pNum = 5;
            else if (qNo >= 131 && qNo <= 146) pNum = 6;
            else if (qNo >= 147 && qNo <= 200) pNum = 7;
          }

          if (pNum >= 1 && pNum <= 7) {
            // Gán ID thật vào các câu hỏi nạp từ JSON dựa trên bản đồ idMap đã lấy ở trên
            g.questions.forEach((jq: any, idx: number) => {
              const realId = idMap.get(jq.questionNo);
              if (realId) {
                jq.id = realId;
                jq.dbId = realId;
              } else {
                jq.id = jq.id || `q-json-${g.id}-${idx}`;
              }

              jq.part = pNum;
              if ([1, 2, 5].includes(pNum)) {
                jq.audioUrl = jq.audioUrl || (g as any).audioUrl;
                jq.imageUrl = jq.imageUrl || (g as any).imageUrl;
              }
            });

            g.questions.sort((a: any, b: any) => (a.questionNo || 0) - (b.questionNo || 0));

            // LOG DEBUG SAU KHI ĐÃ PARSE JSON XONG
            const has172 = g.questions?.some((q: any) => q.questionNo === 172);
            const has174 = g.questions?.some((q: any) => q.questionNo === 174);
            if (has172 && !has174) {
              console.log("🔍 [SAU KHI PARSE] NHÓM THIẾU CÂU 174:", {
                groupId: g.id,
                questionsFound: g.questions.map((q: any) => q.questionNo),
                fullData: g.questions
              });
            }

            aggregatedData[pNum].push(g);
          }
        }
      });
    }

    // 2. Nạp thêm dữ liệu từ quan hệ Database truyền thống (nếu có và chưa được nạp)
    dbTest.parts.forEach(p => {
      const pNum = p.partNumber;
      if (pNum >= 1 && pNum <= 7) {
        p.groups.forEach(group => {
          if (seenGroupIds.has(group.id)) return;
          seenGroupIds.add(group.id);

          if (group.questions && Array.isArray(group.questions)) {
            group.questions.forEach((q: any) => {
              q.part = pNum;
              if ([1, 2, 5].includes(pNum)) {
                q.audioUrl = q.audioUrl || (group as any).audioUrl;
                q.imageUrl = q.imageUrl || (group as any).imageUrl;
              }
            });
            group.questions.sort((a: any, b: any) => (a.questionNo || 0) - (b.questionNo || 0));
            aggregatedData[pNum].push(group);
          }
        });
      }
    });
  }

  // 3. Sắp xếp các nhóm trong mỗi Part
  [1, 2, 3, 4, 5, 6, 7].forEach(pNum => {
    aggregatedData[pNum].sort((a: any, b: any) => {
      const aNo = a.questions?.[0]?.questionNo || 0;
      const bNo = b.questions?.[0]?.questionNo || 0;
      return aNo - bNo;
    });
  });

  // 4. Tải tiến độ làm bài của học viên
  const session = await getServerSession(authOptions) as any;
  let initialProgress = {};

  if (session?.user?.id && Object.keys(aggregatedData).length > 0) {
    const allQIds = Object.values(aggregatedData).flatMap(partData =>
      partData.flatMap(group => (group.questions || []).map((q: any) => q.id))
    ).filter(Boolean);

    const attempts = await prisma.questionAttempt.findMany({
      where: {
        userId: session.user.id,
        questionId: { in: allQIds }
      }
    });

    initialProgress = attempts.reduce((acc: any, curr) => {
      acc[curr.questionId] = {
        isCorrect: curr.isCorrect,
        userAnswer: curr.userAnswer,
        isFlagged: curr.isFlagged,
        flagColor: curr.flagColor,
        flagNote: curr.flagNote
      };
      return acc;
    }, {});
  }

  return (
    <ToeicFullTestClientWrapper
      book={book || "TOEIC"}
      test={test || "TEST"}
      data={aggregatedData}
      toeicTestId={dbTest?.id || toeicTestId}
      lessonId={lessonId}
      courseId={courseId}
      nextLessonId={nextLessonId}
      initialProgress={initialProgress}
      jumpTo={jumpToQ ? { id: jumpToQ } : undefined}
    />
  );
}
