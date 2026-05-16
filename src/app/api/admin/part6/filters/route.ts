import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const groups = await prisma.toeicQuestionGroup.findMany({
      where: {
        part: { partNumber: 6 }
      },
      select: {
        metadata: true
      }
    });

    const daysSet = new Set<string>();
    const typesSet = new Set<string>();
    const booksSet = new Set<string>();

    groups.forEach(g => {
      if (g.metadata && typeof g.metadata === 'object' && !Array.isArray(g.metadata)) {
        const meta = g.metadata as any;
        if (meta.day) daysSet.add(meta.day.toString());
        if (meta.type) typesSet.add(meta.type.toString());
        if (meta.book) booksSet.add(meta.book.toString());
      }
    });

    // Sắp xếp
    const days = Array.from(daysSet).sort((a: any, b: any) => parseInt(a) - parseInt(b));
    const types = Array.from(typesSet).sort();
    const books = Array.from(booksSet).sort();

    return NextResponse.json({
      success: true,
      days,
      types,
      books
    });

  } catch (error: any) {
    console.error("Part 6 Filters Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
