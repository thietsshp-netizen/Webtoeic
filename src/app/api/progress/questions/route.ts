import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("[API_PROGRESS] REQUEST BODY:", JSON.stringify(body));
    const { mode, questionId, isFlagged, flagColor, flagNote } = body;

    // Đảm bảo lessonId và courseId là null nếu không hợp lệ, và luôn là kiểu string
    let lessonId = (body.lessonId === 'null' || body.lessonId === 'undefined' || !body.lessonId) ? null : body.lessonId;
    let courseId = (body.courseId === 'null' || body.courseId === 'undefined' || !body.courseId) ? null : body.courseId;

    if (lessonId && typeof lessonId !== 'string') lessonId = String(lessonId);
    if (courseId && typeof courseId !== 'string') courseId = String(courseId);

    // Mode 1: Cập nhật trạng thái gắn cờ (Flag/Unflag)
    if (mode === "flag") {
      console.log(`[API_PROGRESS] Entering flag mode for questionId: ${questionId}`);
      if (!questionId) {
        return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
      }

      const flagStatus = Boolean(isFlagged);

      const updateData: any = {
        isFlagged: flagStatus,
        updatedAt: new Date()
      };

      if (flagStatus) {
        updateData.flagColor = flagColor || "RED";
      } else {
        updateData.flagColor = null;
      }

      if (flagNote !== undefined) updateData.flagNote = flagNote;
      if (courseId !== undefined) updateData.courseId = courseId;

      try {
        console.log(`[API_PROGRESS] Querying for existing attempt: userId=${session.user.id}, questionId=${questionId}, lessonId=${lessonId}`);

        // --- XỬ LÝ FALLBACK CHO ID ẢO (VIRTUAL ID) ---
        let finalQuestionId = questionId;
        if (questionId.startsWith('q-json') || questionId.includes('_') || !questionId.startsWith('c')) {
          const { testId, questionNo } = body;
          if (testId && questionNo) {
            try {
              console.log(`[API_PROGRESS] Virtual ID detected (${questionId}). Searching for real ID: Test=${testId}, No=${questionNo}`);

              // Tìm đề thi - Chuẩn hóa tên để tìm kiếm chính xác hơn
              const searchTitle = String(testId).replace(/[\s\-_]/g, '').toLowerCase();
              const allTests = await prisma.toeicTest.findMany({
                select: { id: true, title: true }
              });

              const dbTestMatch = allTests.find(t => {
                if (!t.title) return false;
                const cleanTitle = t.title.replace(/[\s\-_]/g, '').toLowerCase();
                return cleanTitle.includes(searchTitle) || searchTitle.includes(cleanTitle);
              });

              if (dbTestMatch) {
                console.log(`[API_PROGRESS] Found matching test: ${dbTestMatch.title} (${dbTestMatch.id})`);
                const fullTest = await prisma.toeicTest.findUnique({
                  where: { id: dbTestMatch.id },
                  include: { parts: { include: { groups: { include: { questions: true } } } } }
                });

                if (fullTest) {
                  for (const part of fullTest.parts) {
                    for (const group of part.groups) {
                      const realQ = group.questions.find(q => q.questionNo === Number(questionNo));
                      if (realQ) {
                        finalQuestionId = realQ.id;
                        console.log(`[API_PROGRESS] Found real question ID: ${finalQuestionId}`);
                        break;
                      }
                    }
                    if (finalQuestionId !== questionId) break;
                  }
                }
              } else {
                console.warn(`[API_PROGRESS] Could not find test matching: ${testId}`);
              }
            } catch (fallbackError) {
              console.error("[API_PROGRESS] Fallback lookup failed:", fallbackError);
            }
          }
        }

        // Nếu vẫn là ID ảo, Database sẽ báo lỗi 500. Ta nên chặn lại và báo lỗi rõ ràng.
        if (finalQuestionId.startsWith('q-json') || finalQuestionId.includes('_')) {
          console.error(`[API_PROGRESS] Failed to map virtual ID ${questionId} to a real database ID.`);
          return NextResponse.json({ error: "Câu hỏi này hiện chỉ có trong JSON, chưa có bản ghi thực trong Database nên không thể lưu cờ/ghi chú." }, { status: 404 });
        }

        // Tìm bản ghi hiện có với finalQuestionId
        console.log(`[API_PROGRESS] FINAL QUESTION ID TO SAVE: ${finalQuestionId}`);
        const existing = await (prisma.questionAttempt as any).findFirst({
          where: {
            userId: session.user.id,
            questionId: finalQuestionId,
            lessonId: lessonId || null,
          },
        });
        console.log(`[API_PROGRESS] Existing record found: ${!!existing}`);

        let attempt;
        if (existing) {
          // Nếu đã có, cập nhật
          attempt = await (prisma.questionAttempt as any).update({
            where: { id: existing.id },
            data: updateData,
          });
        } else {
          // Nếu chưa có, tạo mới
          attempt = await (prisma.questionAttempt as any).create({
            data: {
              userId: session.user.id,
              questionId: finalQuestionId,
              lessonId: lessonId || null,
              courseId: courseId || null,
              isCorrect: false,
              userAnswer: "",
              isFlagged: flagStatus,
              flagColor: flagStatus ? (flagColor || "RED") : null,
              flagNote: flagNote || null,
            },
          });
        }

        console.log(`[${new Date().toISOString()}] Flag Saved: ${finalQuestionId}`);
        return NextResponse.json({ success: true, attempt });
      } catch (upsertError: any) {
        console.error(`[API Flag Error] Save failed:`, upsertError.message);
        return NextResponse.json({ error: upsertError.message || "Database error" }, { status: 500 });
      }
    }

    // Mode 2: Ghi nhận kết quả làm bài hàng loạt
    if (mode === "batch") {
      const { attempts } = body;

      if (!Array.isArray(attempts)) {
        return NextResponse.json({ error: "attempts parameter must be an array" }, { status: 400 });
      }

      try {
        const transactions = attempts.map((atm: any) => {
          if (String(atm.questionId).includes('_')) {
            return null;
          }

          return (prisma.questionAttempt as any).upsert({
            where: {
              userId_questionId_lessonId: {
                userId: session.user.id,
                questionId: atm.questionId,
                lessonId: atm.lessonId || null,
              },
            },
            update: {
              isCorrect: atm.isCorrect,
              userAnswer: atm.userAnswer,
              courseId: atm.courseId || atm.courseId === null ? atm.courseId : undefined,
              isFlagged: atm.isFlagged !== undefined ? atm.isFlagged : undefined,
              flagColor: atm.flagColor !== undefined ? atm.flagColor : undefined,
              flagNote: atm.flagNote !== undefined ? atm.flagNote : undefined,
              updatedAt: new Date(),
            },
            create: {
              userId: session.user.id,
              questionId: atm.questionId,
              lessonId: atm.lessonId || null,
              courseId: atm.courseId || null,
              isCorrect: atm.isCorrect,
              userAnswer: atm.userAnswer,
              isFlagged: atm.isFlagged || false,
              flagColor: atm.flagColor || null,
              flagNote: atm.flagNote || null,
            },
          });
        }).filter(Boolean);

        if (transactions.length > 0) {
          await prisma.$transaction(transactions);
        }

        return NextResponse.json({ success: true, processed: transactions.length });
      } catch (batchError: any) {
        console.error("[API Batch Error]", batchError.message);
        return NextResponse.json({ error: "Batch update failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error: any) {
    console.error("[API Question Progress Global Error]", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
