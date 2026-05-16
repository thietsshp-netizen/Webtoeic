import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { wordId, isCorrect } = await req.json();
    if (!wordId) return NextResponse.json({ error: "Missing wordId" }, { status: 400 });

    const vocab = await (prisma as any).userVocabulary.findUnique({
      where: { id: wordId }
    });

    if (!vocab || vocab.userId !== session.user.id) {
      return NextResponse.json({ error: "Vocab not found" }, { status: 404 });
    }

    const now = new Date();
    let nextBox = vocab.srsBox || 1;
    
    if (isCorrect) {
      // Logic: Chỉ cho phép thăng cấp nếu lần cuối ôn tập cách đây ít nhất 18 giờ (tránh spam)
      const lastReviewed = vocab.lastReviewedAt ? new Date(vocab.lastReviewedAt) : null;
      const hoursSinceLastReview = lastReviewed 
        ? (now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60)
        : 24;

      if (hoursSinceLastReview >= 18) {
        nextBox = Math.min(nextBox + 1, 5);
      }
    } else {
      // Sai là về Hộp 1 ngay lập tức
      nextBox = 1;
    }

    // Tính toán ngày ôn tập tiếp theo dựa trên Hộp hiện tại
    // Hộp 1: 1 ngày, Hộp 2: 2 ngày, Hộp 3: 7 ngày, Hộp 4: 14 ngày, Hộp 5: 30 ngày
    const intervals = [0, 1, 2, 7, 14, 30]; 
    const nextReviewDate = new Date();
    nextReviewDate.setDate(now.getDate() + (isCorrect ? intervals[nextBox] : 1));
    nextReviewDate.setHours(0, 0, 0, 0); // Đặt về đầu ngày

    const updated = await (prisma as any).userVocabulary.update({
      where: { id: wordId },
      data: {
        srsBox: nextBox,
        nextReviewDate,
        lastReviewedAt: now,
        isUnlearned: false // Đã chơi game thì không còn là "Chưa học"
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("[SRS API Error]:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
