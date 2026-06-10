import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Bảo mật: chỉ ADMIN mới được truy cập
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, // Sắp xếp mới nhất lên đầu
      include: {
        enrollments: true,
        ipHistories: {
          orderBy: { lastSeen: 'desc' },
          take: 1
        }
      }
    });

    const courses = await prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { createdAt: 'asc' }
    });

    const classes = await prisma.class.findMany({
      orderBy: { code: 'asc' }
    });

    const data = {
      users: users.map(user => ({
        id: user.id,
        name: user.name || 'Chưa đặt tên',
        email: user.email,
        role: user.role,
        classCode: user.classCode || null,
        lastIp: user.ipHistories[0]?.ipAddress || 'N/A',
        enrollments: user.enrollments.map(e => e.courseId),
        createdAt: user.createdAt.toISOString(),
        accountExpiresAt: user.accountExpiresAt ? user.accountExpiresAt.toISOString() : null,
      })),
      courses,
      classes: classes.map(c => c.code)
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('[ENROLLMENTS_GET]', error);
    return NextResponse.json({ error: 'Lỗi Server' }, { status: 500 });
  }
}
