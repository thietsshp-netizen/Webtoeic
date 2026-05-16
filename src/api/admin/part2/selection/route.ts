import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const summary = searchParams.get('summary') === 'true';
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  const filtersStr = searchParams.get('filters') || '{}';
  
  try {
    const filters = JSON.parse(filtersStr);
    const session = await getServerSession(authOptions) as any;

    // 1. Fetch ALL matching groups first (to get total count and list of IDs)
    const allGroups = await prisma.toeicQuestionGroup.findMany({
      where: { part: { partNumber: 2 } },
      include: {
        questions: {
          orderBy: { questionNo: 'asc' }
        }
      }
    });

    const filteredGroups = allGroups.filter((g: any) => {
      const gMeta = g.metadata as any || {};
      const questions = g.questions || [];
      
      if (filters.type) {
        const filterType = String(filters.type).trim().toLowerCase();
        const gType = String(gMeta.Type || gMeta.type || gMeta.Question_Type || "").trim().toLowerCase();
        const qType = questions.length > 0 ? String(questions[0].metadata?.type || questions[0].metadata?.Type || questions[0].metadata?.Question_Type || "").trim().toLowerCase() : "";
        if (gType !== filterType && qType !== filterType) return false;
      }

      const gBook = String(gMeta.Book || gMeta.book || "").trim().toLowerCase();
      const gTest = String(gMeta.Test || gMeta.test || "").trim().toLowerCase();
      if (filters.book && gBook !== String(filters.book).trim().toLowerCase()) return false;
      if (filters.test && gTest !== String(filters.test).trim().toLowerCase()) return false;

      return true;
    });

    const total = filteredGroups.length;

    if (summary) {
      return NextResponse.json({
        total,
        groups: filteredGroups.map((g: any) => ({
          id: g.id,
          questionIds: g.questions.map((q: any) => q.id)
        }))
      });
    }

    // 2. Slice for chunked loading
    const chunk = filteredGroups.slice(offset, offset + limit);

    // 3. Fetch progress if logged in
    let progress = {};
    if (session?.user?.id && chunk.length > 0) {
      const questionIds = chunk.flatMap((g: any) => g.questions.map((q: any) => q.id));
      const attempts = await prisma.questionAttempt.findMany({
        where: {
          userId: session.user.id,
          questionId: { in: questionIds }
        }
      });

      progress = attempts.reduce((acc: any, curr) => {
        acc[curr.questionId] = {
          isCorrect: curr.isCorrect,
          userAnswer: curr.userAnswer,
          isFlagged: curr.isFlagged,
          flagColor: curr.flagColor,
          flagNote: curr.flagNote
        };
        return acc;
      }, {});
    }

    return NextResponse.json({
      total,
      groups: chunk,
      progress
    });

  } catch (error) {
    console.error("Part 2 Selection Error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
