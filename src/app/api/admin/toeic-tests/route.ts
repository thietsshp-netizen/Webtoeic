import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Sử dụng include thay vì select để đảm bảo nạp đầy đủ cấu trúc quan hệ
    const tests = await prisma.toeicTest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        parts: {
          include: {
            groups: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    });

    // 1. Lấy toàn bộ nhóm câu hỏi và metadata của chúng một lần duy nhất để tối ưu
    const allGroups = await prisma.toeicQuestionGroup.findMany({
      select: {
        metadata: true,
        _count: { select: { questions: true } }
      }
    });

    const processedTests = tests.map(test => {
      const title = test.title.toUpperCase();
      const bookMatch = title.match(/(ETS\s*\d+|NEW\s*ECONOMY|HACKERS)/i);
      const testMatch = title.match(/TEST\s*(\d+)/i);
      
      let qCount = 0;
      let gCount = 0;

      if (bookMatch || testMatch) {
        const targetBook = bookMatch ? bookMatch[0].toUpperCase().replace(/[\s\-_]/g, "") : "";
        const targetTestNum = parseInt(testMatch ? testMatch[1] : "0");

        allGroups.forEach((g: any) => {
          try {
            const m = g.metadata;
            const mObj = typeof m === 'string' ? JSON.parse(m) : m;
            const gBook = String(mObj.book || "").toUpperCase().replace(/[\s\-_]/g, "");
            const gTestNum = parseInt(String(mObj.test || "").match(/\d+/)?.[0] || "0");

            if (targetBook !== "" && (gBook.includes(targetBook) || targetBook.includes(gBook)) && gTestNum === targetTestNum) {
              gCount++;
              qCount += g._count.questions;
            }
          } catch (e) {}
        });
      }

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        isPublished: test.isPublished,
        questionCount: qCount,
        groupCount: gCount,
        parts: test.parts?.map((p: any) => ({ partNumber: p.partNumber })) || [],
        _count: { parts: test.parts?.length || 0 }
      };
    });

    return NextResponse.json({ success: true, tests: processedTests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
