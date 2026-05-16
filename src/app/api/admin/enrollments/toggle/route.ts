import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // Bảo mật: chỉ ADMIN mới được thao tác
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
  }

  try {
    const { userId, courseId } = await req.json();

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 });
    }

    // Check xem đã có quyền chưa
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });

    let hasAccess = false;

    if (existing) {
      // Đã có → Thu hồi
      await prisma.enrollment.delete({ where: { id: existing.id } });
      hasAccess = false;
    } else {
      // Chưa có → Cấp quyền
      await prisma.enrollment.create({ data: { userId, courseId } });
      hasAccess = true;
    }

    return NextResponse.json({ success: true, hasAccess });
  } catch (error) {
    console.error('[ENROLLMENTS_TOGGLE]', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
