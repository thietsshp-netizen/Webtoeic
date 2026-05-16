import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Lấy tất cả các câu đã gắn cờ hoặc có ghi chú trong khóa học này
    const flags = await prisma.questionAttempt.findMany({
      where: {
        userId: session.user.id,
        courseId: courseId,
        OR: [
          { isFlagged: true },
          { NOT: { flagNote: null } },
          { NOT: { flagNote: "" } }
        ]
      },
      include: {
        question: {
          select: {
            id: true,
            questionNo: true,
            questionText: true,
            correctAnswer: true,
            group: {
              select: {
                id: true,
                passageText: true,
                imageUrl: true,
              }
            }
          }
        },
        lesson: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                id: true,
                title: true,
                book: {
                  select: {
                    id: true,
                    title: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, flags });
  } catch (error: any) {
    console.error("Error fetching notebook:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
