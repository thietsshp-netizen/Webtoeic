import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Email không xác định" }, { status: 400 });
    }

    // Lấy thông tin user hiện tại để tìm mã lớp
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, classCode: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy thông tin tài khoản" }, { status: 404 });
    }

    if (!user.classCode) {
      return NextResponse.json({ error: "Tài khoản của bạn chưa được xếp vào lớp nào" }, { status: 400 });
    }

    // Tìm buổi học đang mở điểm danh (isActive = true) của lớp này
    const activeSession = await (prisma as any).classSession.findFirst({
      where: {
        classCode: user.classCode,
        isActive: true
      }
    });

    if (!activeSession) {
      return NextResponse.json({ error: "Hiện tại lớp học này chưa mở điểm danh hoặc đã bị khóa" }, { status: 400 });
    }

    // Kiểm tra xem đã điểm danh trước đó chưa
    const existingAttendance = await (prisma as any).attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId: activeSession.id,
          userId: user.id
        }
      }
    });

    if (existingAttendance) {
      return NextResponse.json({ success: true, message: "Đã điểm danh trước đó" });
    }

    // Lưu thông tin điểm danh (mặc định isMuted: false)
    await (prisma as any).attendance.create({
      data: {
        sessionId: activeSession.id,
        userId: user.id,
        isMuted: false
      }
    });

    return NextResponse.json({ success: true, message: "Điểm danh thành công!" });
  } catch (error: any) {
    console.error("[ATTENDANCE_CHECKIN_POST]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // Chỉ có admin mới được thay đổi trạng thái mic của học viên qua API admin, học viên không thể tự thay đổi.
  return NextResponse.json({ error: "Không có quyền thực hiện hành động này" }, { status: 403 });
}

