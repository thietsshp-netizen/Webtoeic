import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get('book');
    const test = searchParams.get('test');
    const type = searchParams.get('type');

    if (!book && !test && !type) {
      return NextResponse.json({ success: false, error: "Thiếu tiêu chí lọc." }, { status: 400 });
    }

    const where: any = {
      group: {
        part: {
          partNumber: 5
        }
      }
    };

    let questions = await prisma.toeicQuestion.findMany({
      where,
      orderBy: {
        questionNo: 'asc'
      }
    });

    // Lọc ở tầng ứng dụng cho linh hoạt với JSON metadata
    questions = questions.filter((q: any) => {
      const meta = q.metadata as any;
      let match = true;
      if (book && meta.book !== book) match = false;
      if (test && meta.test !== test) match = false;
      if (type && (meta.Question_Type !== type && meta.type !== type)) match = false;
      return match;
    });

    const isSummaryOnly = searchParams.get('summary') === 'true';
    const limit = parseInt(searchParams.get('limit') || '0');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (isSummaryOnly) {
      return NextResponse.json({
        success: true,
        questions: questions.map(q => ({ id: q.id, questionNo: q.questionNo }))
      });
    }

    if (limit > 0) {
      const totalCount = questions.length;
      // Trả về batch + danh sách ID tóm tắt của phần còn lại để Player dựng UI
      const batch = questions.slice(offset, offset + limit);
      const summary = questions.map(q => ({ id: q.id, questionNo: q.questionNo }));
      
      return NextResponse.json({
        success: true,
        questions: batch,
        summary: summary,
        totalCount
      });
    }

    return NextResponse.json({
      success: true,
      questions
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
