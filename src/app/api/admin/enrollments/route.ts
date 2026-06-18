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

    // Thống kê số buổi học đã tạo theo từng lớp
    const sessionCounts = await (prisma as any).classSession.groupBy({
      by: ['classCode'],
      _count: { id: true }
    });

    // Thống kê số buổi đã điểm danh của từng học viên
    const attendanceCounts = await (prisma as any).attendance.groupBy({
      by: ['userId'],
      _count: { id: true }
    });

    const sessionCountMap = new Map<string, number>(sessionCounts.map((item: any) => [item.classCode, item._count.id]));
    const attendanceCountMap = new Map<string, number>(attendanceCounts.map((item: any) => [item.userId, item._count.id]));

    // Tìm mã lớp có buổi học đang hoạt động (isActive = true) gần nhất
    const activeSession = await (prisma as any).classSession.findFirst({
      where: { isActive: true },
      select: { classCode: true },
      orderBy: { createdAt: 'desc' }
    });
    const activeClassCode = activeSession?.classCode || null;

    const data = {
      users: users.map(user => {
        const totalSessions = user.classCode ? (sessionCountMap.get(user.classCode) || 0) : 0;
        const presentSessions = attendanceCountMap.get(user.id) || 0;
        const absentSessions = Math.max(0, totalSessions - presentSessions);

        return {
          id: user.id,
          name: user.name || 'Chưa đặt tên',
          email: user.email,
          role: user.role,
          classCode: user.classCode || null,
          lastIp: user.ipHistories[0]?.ipAddress || 'N/A',
          enrollments: user.enrollments.map(e => e.courseId),
          createdAt: user.createdAt.toISOString(),
          accountExpiresAt: user.accountExpiresAt ? user.accountExpiresAt.toISOString() : null,
          attendanceStats: {
            total: totalSessions,
            present: presentSessions,
            absent: absentSessions
          }
        };
      }),
      courses,
      classes: classes.map(c => ({
        code: c.code,
        sessionCount: sessionCountMap.get(c.code) || 0
      })),
      activeClassCode
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('[ENROLLMENTS_GET]', error);
    return NextResponse.json({ error: 'Lỗi Server' }, { status: 500 });
  }
}
