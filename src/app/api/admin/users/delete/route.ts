import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // Bảo mật: chỉ ADMIN mới được truy cập
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
  }

  try {
    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Payload không hợp lệ' }, { status: 400 });
    }

    // 1. Xóa các bảng liên quan thủ công để đảm bảo tuyệt đối (dù đã có Cascade)
    await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.questionAttempt.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userVocabulary.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.lessonProgress.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.fullTestAttempt.deleteMany({ where: { userId: { in: userIds } } });

    // 2. Xoá danh sách users
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
        role: 'USER', // Tránh admin tự xóa nhầm chính mình hoặc admin khác
      }
    });

    console.log(`[USERS_DELETE] Deleted ${result.count} users from request of ${userIds.length}`);

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      requestedCount: userIds.length
    });
  } catch (error) {
    console.error('[USERS_DELETE_POST]', error);
    return NextResponse.json({ error: 'Lỗi Server khi xóa dữ liệu' }, { status: 500 });
  }
}
