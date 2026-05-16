import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const test = await prisma.toeicTest.findUnique({
      where: { id },
      include: {
        parts: {
          include: {
            groups: {
              include: { questions: { orderBy: { questionNo: 'asc' } } },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { partNumber: 'asc' }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ success: false, error: "Test not found" }, { status: 404 });
    }

    // --- LOGIC GHÉP CHÍNH XÁC DỰA TRÊN METADATA ---
    // Nếu bộ đề hiện tại chưa có Part hoặc người dùng muốn ghép thêm
    const title = test.title.toUpperCase();
    const bookMatch = title.match(/(ETS\s*\d+|NEW\s*ECONOMY|HACKERS)/i);
    const testMatch = title.match(/TEST\s*(\d+)/i);

    if (bookMatch || testMatch) {
      const targetBook = bookMatch ? bookMatch[0].toUpperCase().replace(/[\s\-_]/g, "") : "";
      const targetTestNum = testMatch ? testMatch[1] : "";
      const targetTestNumInt = parseInt(targetTestNum || "0");

      // Tìm kiếm tất cả các Group có metadata khớp
      const allGroups = await prisma.toeicQuestionGroup.findMany({
        include: {
          questions: { orderBy: { questionNo: 'asc' } },
          part: true
        }
      });

      const matchedGroups: any[] = [];
      allGroups.forEach((g: any) => {
        const m = g.metadata;
        if (!m) return;

        let gBook = "";
        let gTest = "";
        
        try {
          const mObj = typeof m === 'string' ? JSON.parse(m) : m;
          // Kiểm tra cả hai trường hợp viết hoa và viết thường để đảm bảo không sót dữ liệu
          gBook = String(mObj.Book || mObj.book || "");
          gTest = String(mObj.Test || mObj.test || "");
        } catch (e) {}

        const cleanGBook = gBook.toUpperCase().replace(/[\s\-_]/g, "");
        const cleanGTestNum = gTest.toUpperCase().match(/\d+/)?.[0] || "0";
        const gTestNumInt = parseInt(cleanGTestNum);

        // So sánh không quan tâm khoảng trống
        const isBookMatch = targetBook !== "" && (cleanGBook.includes(targetBook) || targetBook.includes(cleanGBook));
        const isTestMatch = targetTestNumInt > 0 && gTestNumInt === targetTestNumInt;

        if (isBookMatch && isTestMatch) {
          // Xử lý đặc biệt cho Part 7: Nếu questions trống, thử nạp từ passageText (Đóng gói)
          if ((!g.questions || g.questions.length === 0) && g.passageText && g.passageText.trim().startsWith('{')) {
            try {
              const jsonData = JSON.parse(g.passageText);
              const jsonQuestions = jsonData.questions || (jsonData.question ? (Array.isArray(jsonData.question) ? jsonData.question : [jsonData.question]) : []);
              g.questions = jsonQuestions.map((jq: any, idx: number) => ({
                ...jq,
                id: jq.id || `q-json-${g.id}-${idx}`,
                questionNo: jq.questionNo || jq.question_no || jq.number || (idx + 1)
              }));
            } catch (e) {}
          }
          matchedGroups.push(g);
        }
      });

      // Nếu tìm thấy nhóm khớp qua Metadata, hãy gộp chúng vào cấu trúc test
      if (matchedGroups.length > 0) {
        const partsMap: Record<number, any> = {};
        
        // Khởi tạo 7 Part
        [1, 2, 3, 4, 5, 6, 7].forEach(n => {
          partsMap[n] = { partNumber: n, groups: [] };
        });

        // Đưa các nhóm vào đúng Part
        matchedGroups.forEach(g => {
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
            partsMap[pNum].groups.push(g);
          }
        });

        // Sắp xếp các nhóm trong mỗi Part
        [1, 2, 3, 4, 5, 6, 7].forEach(n => {
          partsMap[n].groups.sort((a: any, b: any) => 
            (a.questions?.[0]?.questionNo || 0) - (b.questions?.[0]?.questionNo || 0)
          );
        });

        (test as any).parts = Object.values(partsMap);
      }
    }

    return NextResponse.json({ success: true, test });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
