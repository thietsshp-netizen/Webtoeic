import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partParam = searchParams.get("part");
    const part = partParam ? parseInt(partParam, 10) : 5;

    const families = await prisma.wordFamily.findMany({
      where: { part },
      orderBy: { key: 'asc' }
    });
    return NextResponse.json({ success: true, data: families });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { key, part, words, originalValue } = await req.json();
    if (!key || !words || !originalValue) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const newFamily = await prisma.wordFamily.create({
      data: {
        key: key.trim(),
        part: part ? parseInt(part, 10) : 5,
        words: Array.isArray(words)
          ? words.map((w: string) => w.trim()).filter(Boolean)
          : words.split(",").map((w: string) => w.trim()).filter(Boolean),
        originalValue: originalValue.trim(),
      }
    });

    return NextResponse.json({ success: true, data: newFamily });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
