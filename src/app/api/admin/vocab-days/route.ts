import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const days = await prisma.vocabDay.findMany({
      orderBy: { dayNumber: "asc" },
      select: { id: true, dayNumber: true, title: true }
    });
    return NextResponse.json({ success: true, days });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
