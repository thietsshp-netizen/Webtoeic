import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { word, definition, isCorrect } = await req.json();

    if (!word || !definition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userId = session.user.id;
    const cleanWord = word.trim();
    const cleanDef = definition.trim();

    // 1. Tìm hoặc Tạo mới bản ghi UserVocabulary ngầm
    let userVocab = await prisma.userVocabulary.findFirst({
      where: {
        userId,
        word: { equals: cleanWord, mode: 'insensitive' },
        definition: { equals: cleanDef, mode: 'insensitive' }
      }
    });

    if (!userVocab) {
      // Nếu chưa có (ví dụ từ trong khóa học mà chưa Star), tạo mới với isStarred=false
      userVocab = await prisma.userVocabulary.create({
        data: {
          userId,
          word: cleanWord,
          definition: cleanDef,
          translation: "", // Mặc định trống
          isStarred: false,
          isUnlearned: true,
          srsBox: 1,
          nextReviewDate: new Date(),
        }
      });
    }

    const now = new Date();
    let newBox = userVocab.srsBox;
    let nextDate = new Date();

    if (!isCorrect) {
      // PHẠT: Về thẳng Hộp 1
      newBox = 1;
      nextDate.setDate(now.getDate() + 1);
    } else {
      // THƯỞNG: Lên 1 hộp (nếu hôm nay chưa lên)
      const lastReviewed = userVocab.lastReviewedAt ? new Date(userVocab.lastReviewedAt) : null;
      const isAlreadyReviewedToday = lastReviewed && 
        lastReviewed.getDate() === now.getDate() && 
        lastReviewed.getMonth() === now.getMonth() &&
        lastReviewed.getFullYear() === now.getFullYear();

      if (!isAlreadyReviewedToday) {
        newBox = Math.min(newBox + 1, 5);
      }

      // Tính ngày ôn tập tiếp theo dựa trên Hộp mới
      const intervals = [0, 1, 2, 7, 14, 30]; // Index 1 tương ứng Hộp 1
      const daysToAdd = intervals[newBox] || 1;
      nextDate.setDate(now.getDate() + daysToAdd);
    }

    const updated = await prisma.userVocabulary.update({
      where: { id: userVocab.id },
      data: {
        srsBox: newBox,
        nextReviewDate: nextDate,
        lastReviewedAt: now
      }
    });

    return NextResponse.json({ 
      success: true, 
      newBox: updated.srsBox, 
      nextReviewDate: updated.nextReviewDate 
    });

  } catch (error) {
    console.error("SRS Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
