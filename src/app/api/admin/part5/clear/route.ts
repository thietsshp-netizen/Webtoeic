import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Tìm Test Bank Part 5
    const test = await prisma.toeicTest.findFirst({
      where: { title: "QUESTION_BANK_PART5" }
    });

    if (test) {
      const part5 = await prisma.toeicPart.findFirst({
        where: { testId: test.id, partNumber: 5 }
      });

      if (part5) {
        // Xóa tất cả question groups (cascade xóa questions)
        await prisma.toeicQuestionGroup.deleteMany({
          where: { partId: part5.id }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Đã dọn dẹp sạch kho Part 5" });

  } catch (error: any) {
    console.error("Clear Part 5 Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
