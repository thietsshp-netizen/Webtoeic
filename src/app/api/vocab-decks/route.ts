import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: Lấy danh sách bộ thẻ của người dùng kèm số lượng từ
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

        // Lấy các bộ thẻ kèm số lượng từ trong bộ
    const decks = await (prisma as any).vocabDeck.findMany({
      where: { userId },
      include: {
        _count: {
          select: { vocabItems: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Lấy số lượng từ chưa phân loại (danh sách chung)
    const uncategorizedCount = await (prisma as any).userVocabulary.count({
      where: {
        userId,
        isStarred: true,
        deckId: null
      }
    });

    return NextResponse.json({
      decks: decks.map((d: any) => ({
        id: d.id,
        name: d.name,
        count: d._count?.vocabItems || 0,
        createdAt: d.createdAt
      })),
      uncategorizedCount
    });
  } catch (error: any) {
    console.error('[VocabDecks API GET] Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Tạo bộ thẻ mới
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên bộ thẻ không được trống' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Kiểm tra xem bộ thẻ đã tồn tại chưa
    const existing = await (prisma as any).vocabDeck.findFirst({
      where: {
        userId,
        name: { equals: trimmedName, mode: 'insensitive' }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Bộ thẻ này đã tồn tại' }, { status: 400 });
    }

    const newDeck = await (prisma as any).vocabDeck.create({
      data: {
        userId,
        name: trimmedName
      }
    });

    return NextResponse.json(newDeck);
  } catch (error: any) {
    console.error('[VocabDecks API POST] Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE: Xóa bộ thẻ và xóa toàn bộ từ vựng bên trong khỏi sổ tay từ vựng
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID bộ thẻ' }, { status: 400 });
    }

    // Xác nhận bộ thẻ thuộc về user
    const deck = await (prisma as any).vocabDeck.findFirst({
      where: { id, userId }
    });

    if (!deck) {
      return NextResponse.json({ error: 'Bộ thẻ không tồn tại hoặc không thuộc về bạn' }, { status: 404 });
    }

    // Xóa tất cả từ vựng trong bộ thẻ này
    await (prisma as any).userVocabulary.deleteMany({
      where: { deckId: id, userId }
    });

    // Xóa bộ thẻ
    await (prisma as any).vocabDeck.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa bộ thẻ và các từ vựng bên trong thành công.' });
  } catch (error: any) {
    console.error('[VocabDecks API DELETE] Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

// PUT: Đổi tên bộ thẻ
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID bộ thẻ' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên bộ thẻ không được trống' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Xác nhận bộ thẻ thuộc về user
    const deck = await (prisma as any).vocabDeck.findFirst({
      where: { id, userId }
    });

    if (!deck) {
      return NextResponse.json({ error: 'Bộ thẻ không tồn tại hoặc không thuộc về bạn' }, { status: 404 });
    }

    // Kiểm tra xem trùng tên với bộ thẻ khác của user không
    const existing = await (prisma as any).vocabDeck.findFirst({
      where: {
        userId,
        name: { equals: trimmedName, mode: 'insensitive' },
        NOT: { id }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Tên bộ thẻ này đã tồn tại' }, { status: 400 });
    }

    const updated = await (prisma as any).vocabDeck.update({
      where: { id },
      data: { name: trimmedName }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[VocabDecks API PUT] Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
