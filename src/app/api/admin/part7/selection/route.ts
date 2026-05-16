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
    const testFull = searchParams.get('testFull'); // Format: "ETS2026 - 9"
    const all = searchParams.get('all') === 'true';

    let metadataFilter: any = {};
    if (all) {
      metadataFilter = {};
    } else if (day) {
      metadataFilter = { path: ['day'], equals: day };
    } else if (type) {
      metadataFilter = { path: ['type'], equals: type };
    } else if (testFull) {
      const parts = testFull.split(' - ');
      const bookPart = parts[0];
      const testPart = parts[1];
      metadataFilter = {
        AND: [
          {
            OR: [
              { path: ['book'], equals: bookPart },
              { path: ['de'], equals: bookPart }
            ]
          },
          { path: ['test'], equals: testPart.toString() }
        ]
      };
    } else if (book) {
      metadataFilter = {
        OR: [
          { path: ['book'], equals: book },
          { path: ['de'], equals: book }
        ]
      };
    }

    const where: any = {
      part: { partNumber: 7 }
    };

    // Chỉ thêm metadata filter nếu có tiêu chí lọc cụ thể (tránh lỗi {} filter)
    if (!all && Object.keys(metadataFilter).length > 0) {
      where.metadata = metadataFilter;
    }

    // Lấy các Question Group (đại diện cho một đoạn passage Part 7) khớp với bộ lọc
    const groups = await prisma.toeicQuestionGroup.findMany({
      where,
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
          const parsed = JSON.parse(g.passageText as string);
          // Support both direct array and nested { passages: [] }
          const passages = Array.isArray(parsed) ? parsed : (parsed.passages || []);

          if (passages && passages.length > 0 && passages[0].html_content) {
            // strip html tags for preview
            previewText = passages[0].html_content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().substring(0, 150) + "...";
          }
        } catch (e) { }
      }

      const meta = g.metadata as any;
      return {
        id: g.id,
        previewText: previewText.replace(/<\/?sup[^>]*>/g, '').replace(/\*\*/g, ''),
        questionCount: g.questions.length,
        book: meta?.book || meta?.de || "Unknown Book",
        test: meta?.test || "Unknown Test"
      };
    });

    return NextResponse.json({
      success: true,
      groups: previewGroups
    });

  } catch (error: any) {
    console.error("Part 7 Selection Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
