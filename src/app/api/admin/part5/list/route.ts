import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Tìm lấy 50 câu gần đây nhất đang ở trạng thái DRAFT
    const questions = await prisma.toeicQuestion.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5000 // Tăng giới hạn để hỗ trợ kiểm tra (Gap check) tốt hơn cho bộ dữ liệu lớn
    });

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
