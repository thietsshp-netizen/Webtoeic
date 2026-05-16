import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Lấy tất cả từ đã bookmark của user hiện tại (theo vocabDayId)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vocabDayId = searchParams.get("vocabDayId");

  const where: any = { userId: session.user.id };
  if (vocabDayId) where.vocabDayId = vocabDayId;

  const bookmarks = await prisma.vocabBookmark.findMany({ where });
  return NextResponse.json({ bookmarks });
}

// POST: Toggle bookmark (thêm hoặc xóa)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vocabDayId, wordId } = await req.json();

  const existing = await prisma.vocabBookmark.findUnique({
    where: { userId_vocabDayId_wordId: { userId: session.user.id, vocabDayId, wordId } }
  });

  if (existing) {
    await prisma.vocabBookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ starred: false });
  } else {
    await prisma.vocabBookmark.create({
      data: { userId: session.user.id, vocabDayId, wordId }
    });
    return NextResponse.json({ starred: true });
  }
}
