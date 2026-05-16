import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 1. Bài học gần nhất đang học dở
    const lastLesson = await (prisma as any).lessonProgress.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        lesson: {
          include: {
            section: {
              include: { course: { select: { id: true, title: true } } }
            }
          }
        }
      }
    });

    // 2. Thống kê QuestionAttempt theo Part (Deduplicated by questionId)
    const allAttempts = await (prisma as any).questionAttempt.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        question: {
          include: {
            group: {
              include: {
                part: { select: { partNumber: true, title: true } }
              }
            }
          }
        }
      }
    });

    // Dedup - chỉ giữ kết quả mới nhất cho mỗi câu hỏi
    const seenQuestions = new Set<string>();
    const latestAttempts = allAttempts.filter((a: any) => {
      if (seenQuestions.has(a.questionId)) return false;
      seenQuestions.add(a.questionId);
      return true;
    });

    const partMap: Record<number, { 
      partNumber: number; 
      title: string; 
      correct: number; 
      total: number;
      categories: Record<string, { correct: number; total: number }> 
    }> = {};
    const globalWrongCategories: Record<string, number> = {};

    for (const a of latestAttempts) {
      // 1. Thống kê theo Part
      const part = a.question?.group?.part;
      const group = a.question?.group;
      if (part) {
        const pn = part.partNumber;
        if (!partMap[pn]) {
          partMap[pn] = { partNumber: pn, title: part.title || `Part ${pn}`, correct: 0, total: 0, categories: {} };
        }
        partMap[pn].total++;
        if (a.isCorrect) partMap[pn].correct++;

        // 2. Thống kê Dạng bài (Category) cho từng Part
        const qMeta = a.question?.metadata as any;
        const gMeta = group?.metadata as any;
        
        let category = qMeta?.QuestionType || qMeta?.Question_Type || qMeta?.type || qMeta?.category || qMeta?.PicType ||
                       gMeta?.QuestionType || gMeta?.Question_Type || gMeta?.type || gMeta?.category || gMeta?.PicType ||
                       gMeta?.PassageType || group?.type || a.question?.type;

        // Chuẩn hóa category: Viết hoa chữ cái đầu, không phân biệt hoa thường
        if (category && typeof category === 'string') {
          category = category.trim();
          category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        }

        // Xử lý fallback theo yêu cầu người dùng
        if (!category) {
          if (pn === 3 || pn === 4) {
            category = group?.imageUrl ? "Đoạn văn có hình ảnh" : "Đoạn văn không hình ảnh";
          } else if (pn === 6 || pn === 7) {
            category = "Dạng bài đọc tổng hợp"; // Thay vì "Không phân dạng"
          } else {
            category = "Chưa phân loại";
          }
        }

        if (!partMap[pn].categories[category]) {
          partMap[pn].categories[category] = { correct: 0, total: 0 };
        }
        partMap[pn].categories[category].total++;
        if (a.isCorrect) partMap[pn].categories[category].correct++;

        // Global wrong categories (cho bảng điểm yếu chung)
        if (!a.isCorrect) {
          globalWrongCategories[category] = (globalWrongCategories[category] || 0) + 1;
        }
      }
    }

    // Sắp xếp dạng bài sai nhiều nhất toàn cục
    const sortedWrongCategories = Object.entries(globalWrongCategories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Câu sai/gắn cờ để review (Deduplicated by questionId)
    const allReviewItems = await (prisma as any).questionAttempt.findMany({
      where: {
        userId,
        OR: [{ isCorrect: false }, { isFlagged: true }]
      },
      orderBy: { updatedAt: "desc" },
      include: {
        lesson: { 
          include: { 
            section: { 
              include: { course: { select: { id: true } } } 
            } 
          } 
        },
        question: {
          include: {
            group: {
              include: {
                part: { select: { partNumber: true } }
              }
            }
          }
        }
      }
    });

    const seenReviewQuestions = new Set<string>();
    const reviewItems = allReviewItems.filter((r: any) => {
      if (seenReviewQuestions.has(r.questionId)) return false;
      seenReviewQuestions.add(r.questionId);
      return true;
    }).slice(0, 20); // Chỉ lấy 20 câu mới nhất sau khi dedup

    // 4. Lịch sử làm đề Full Test
    const fullTestHistory = await (prisma as any).fullTestAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    const incorrectCount = latestAttempts.filter((a: any) => !a.isCorrect && a.userAnswer && a.userAnswer.trim() !== "").length;
    const flaggedCount = latestAttempts.filter((a: any) => a.isFlagged).length;
    const totalUniqueQuestions = latestAttempts.length;

    const responseData = {
      success: true,
      lastLesson: lastLesson ? {
        lessonId: lastLesson.lessonId,
        lessonTitle: lastLesson.lesson?.title,
        courseId: lastLesson.lesson?.section?.course?.id,
        courseTitle: lastLesson.lesson?.section?.course?.title,
        updatedAt: lastLesson.updatedAt
      } : null,
      partStats: Object.values(partMap).sort((a, b) => a.partNumber - b.partNumber).map(p => {
        // Lấy tất cả dạng bài của Part này
        const allCategories = Object.entries(p.categories)
          .map(([name, stats]) => ({ 
            name, 
            ...stats, 
            incorrect: stats.total - stats.correct,
            accuracy: Math.round((stats.correct / Math.max(stats.total, 1)) * 100)
          }))
          .sort((a, b) => b.incorrect - a.incorrect); // Sắp xếp theo số câu sai giảm dần
        
        return {
          partNumber: p.partNumber,
          title: p.title,
          correct: p.correct,
          total: p.total,
          allCategories
        };
      }),
      reviewItems: reviewItems.map((r: any) => ({
        attemptId: r.id,
        questionId: r.questionId,
        lessonId: r.lessonId,
        courseId: r.lesson?.section?.course?.id,
        lessonTitle: r.lesson?.title,
        partNumber: r.question?.group?.part?.partNumber,
        isCorrect: r.isCorrect,
        isFlagged: r.isFlagged,
        userAnswer: r.userAnswer,
        updatedAt: r.updatedAt
      })),
      incorrectCount,
      flaggedCount,
      totalAttempts: totalUniqueQuestions,
      wrongCategories: sortedWrongCategories,
      fullTestHistory,
      averageScore: fullTestHistory.length > 0
        ? Math.round(fullTestHistory.reduce((sum: number, h: any) => sum + h.totalScore, 0) / fullTestHistory.length)
        : 0
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Lỗi lấy stats:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
