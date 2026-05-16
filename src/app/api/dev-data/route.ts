import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const group = await prisma.toeicQuestionGroup.findFirst({
      where: {
        part: { partNumber: 7 } // Part 7
      },
      include: {
        questions: true
      }
    });
    return NextResponse.json(group);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
