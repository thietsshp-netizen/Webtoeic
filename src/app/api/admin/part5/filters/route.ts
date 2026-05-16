import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Lấy tất cả metadata của các câu hỏi Part 5
    const questions = await prisma.toeicQuestion.findMany({
      where: {
        group: {
          part: {
            partNumber: 5
          }
        }
      },
      select: {
        metadata: true
      }
    });

    const books = new Set<string>();
    const tests = new Set<string>();
    const types = new Set<string>();

    questions.forEach((q: any) => {
      const meta = q.metadata as any;
      if (meta?.book) books.add(meta.book);
      if (meta?.test) tests.add(meta.test);
      if (meta?.Question_Type) types.add(meta.Question_Type);
      // Giữ lại fallback cho 'type' nếu có dữ liệu cũ
      if (meta?.type) types.add(meta.type);
    });

    return NextResponse.json({
      success: true,
      books: Array.from(books).sort(),
      tests: Array.from(tests).sort(),
      types: Array.from(types).sort()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
