import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const groups = await prisma.toeicQuestionGroup.findMany({
      where: {
        part: { partNumber: 7 }
      },
      select: {
        metadata: true
      }
    });

    const daysSet = new Set<string>();
    const typesSet = new Set<string>();
    const booksSet = new Set<string>();
    const testsSet = new Set<string>();

    groups.forEach(g => {
      if (g.metadata && typeof g.metadata === 'object' && !Array.isArray(g.metadata)) {
        const meta = g.metadata as any;
        if (meta.day) daysSet.add(meta.day.toString());
        if (meta.type) typesSet.add(meta.type.toString());
        
        // Check both 'book' and 'de' for compatibility
        const bookValue = meta.book || meta.de;
        if (bookValue) {
          booksSet.add(bookValue.toString());
          if (meta.test) {
            testsSet.add(`${bookValue} - ${meta.test}`);
          }
        }
      }
    });

    // Sắp xếp
    const days = Array.from(daysSet).sort((a: any, b: any) => parseInt(a) - parseInt(b));
    const types = Array.from(typesSet).sort();
    const books = Array.from(booksSet).sort();
    const tests = Array.from(testsSet).sort();

    return NextResponse.json({
      success: true,
      days,
      types,
      books,
      tests
    });

  } catch (error: any) {
    console.error("Part 7 Filters Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
