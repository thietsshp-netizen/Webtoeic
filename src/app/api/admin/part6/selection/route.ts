import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day');
    const type = searchParams.get('type');
    const book = searchParams.get('book');
    const all = searchParams.get('all') === 'true';

    let metadataFilter: any = {};
    if (all) {
      metadataFilter = {}; 
    } else if (day) {
      metadataFilter = { path: ['day'], equals: day };
    } else if (type) {
      metadataFilter = { path: ['type'], equals: type };
    } else if (book) {
      metadataFilter = { path: ['book'], equals: book };
    }

    // Lấy các Question Group (đại diện cho một đoạn passage Part 6) khớp với bộ lọc
    const groups = await prisma.toeicQuestionGroup.findMany({
      where: {
        part: { partNumber: 6 },
        metadata: (all || Object.keys(metadataFilter).length > 0) ? metadataFilter : { equals: {} }
      },
      include: {
        questions: {
          select: { id: true, questionNo: true }
        }
      }
    });

    // Parse đoạn passageText để lấy câu đầu tiên làm preview
    const previewGroups = groups.map(g => {
      let previewText = "No text available";
      if (g.passageText) {
         try {
            const p = JSON.parse(g.passageText);
            if (p.english && p.english.length > 0) {
               previewText = p.english.map((e: any) => e.text).join(' ').substring(0, 150) + "...";
            }
         } catch(e) {}
      }

      return {
        id: g.id,
        previewText: previewText.replace(/<\/?sup[^>]*>/g, '').replace(/\*\*/g, ''),
        questionCount: g.questions.length,
        book: (g.metadata as any)?.book || "Unknown Book",
        test: (g.metadata as any)?.test || "Unknown Test"
      };
    });

    return NextResponse.json({
      success: true,
      groups: previewGroups
    });

  } catch (error: any) {
    console.error("Part 6 Selection Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
