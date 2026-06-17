import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Email không xác định" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, classCode: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy thông tin tài khoản" }, { status: 404 });
    }

    if (!user.classCode) {
      return NextResponse.json({
        total: 0,
        present: 0,
        absent: 0,
        activeSession: null,
        history: [],
        noClass: true
      });
    }

    // Lấy danh sách các buổi học đã tạo cho lớp của học viên
    const classSessions = await (prisma as any).classSession.findMany({
      where: { classCode: user.classCode },
      orderBy: { createdAt: "desc" },
      include: {
        attendances: {
          where: { userId: user.id }
        }
      }
    });

    // Tìm xem hiện tại có buổi học nào đang mở điểm danh hay không
    const activeSession = classSessions.find((s: any) => s.isActive);

    const history = classSessions.map((s: any) => {
      const attendance = s.attendances[0];
      return {
        id: s.id,
        title: s.title,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
        checkedIn: !!attendance,
        checkedInAt: attendance ? attendance.checkedInAt.toISOString() : null
      };
    });

    const total = classSessions.length;
    const present = history.filter((h: any) => h.checkedIn).length;
    const absent = total - present;

    // Trả về thống kê
    return NextResponse.json({
      total,
      present,
      absent,
      activeSession: activeSession ? {
        id: activeSession.id,
        title: activeSession.title,
        isActive: activeSession.isActive,
        checkedIn: !!activeSession.attendances.find((a: any) => a.userId === user.id),
        isMuted: !!activeSession.attendances.find((a: any) => a.userId === user.id)?.isMuted
      } : null,
      history
    });
  } catch (error: any) {
    console.error("[ATTENDANCE_STATS_GET]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: 500 });
  }
}
