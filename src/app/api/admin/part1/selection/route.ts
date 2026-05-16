import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get('book');
    const test = searchParams.get('test');
    const picType = searchParams.get('picType');

    if (!book && !test && !picType) {
      return NextResponse.json({ success: false, error: "Thiếu tiêu chí lọc." }, { status: 400 });
    }

    const where: any = {
      part: {
        partNumber: 1
      }
    };

    let groups = await prisma.toeicQuestionGroup.findMany({
      where,
      include: {
        questions: {
          orderBy: {
            questionNo: 'asc'
          }
        }
      }
    });

    // Lọc ở tầng ứng dụng cho linh hoạt
    groups = groups.filter((g: any) => {
      const meta = g.metadata as any;
      if (!meta) return false;
      let match = true;
      
      if (book) {
        const dbBook = String(meta.Book || meta.book || "").trim().toLowerCase();
        if (dbBook !== String(book).trim().toLowerCase()) match = false;
      }
      
      if (test) {
        const dbTest = String(meta.Test || meta.test || "").trim().toLowerCase();
        if (dbTest !== String(test).trim().toLowerCase()) match = false;
      }

      if (picType) {
        const dbPicType = String(meta.PicType || meta.picType || "").trim().toLowerCase();
        if (dbPicType !== String(picType).trim().toLowerCase()) match = false;
      }
      
      return match;
    }).sort((a, b) => {
      const aNo = a.questions?.[0]?.questionNo || 0;
      const bNo = b.questions?.[0]?.questionNo || 0;
      return aNo - bNo;
    });

    const isSummaryOnly = searchParams.get('summary') === 'true';
    const limit = parseInt(searchParams.get('limit') || '0');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (isSummaryOnly) {
      return NextResponse.json({
        success: true,
        groups: groups.map(g => ({ id: g.id, questionNo: g.questions?.[0]?.questionNo }))
      });
    }

    if (limit > 0) {
      const totalCount = groups.length;
      const batch = groups.slice(offset, offset + limit);
      const summary = groups.map(g => ({ id: g.id, questionNo: g.questions?.[0]?.questionNo }));
      
      return NextResponse.json({
        success: true,
        groups: batch,
        summary: summary,
        totalCount
      });
    }

    return NextResponse.json({
      success: true,
      groups
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
