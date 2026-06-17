import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Bảo mật: chỉ Admin mới có quyền truy cập các API này
async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Không có quyền truy cập");
  }
  return session;
}

export async function GET(req: Request) {
  try {
    await verifyAdmin();

    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get("classCode");

    if (!classCode) {
      return NextResponse.json({ error: "Thiếu mã lớp học (classCode)" }, { status: 400 });
    }

    const sessions = await (prisma as any).classSession.findMany({
      where: { classCode },
      orderBy: { createdAt: "desc" },
      include: {
        attendances: {
          orderBy: {
            checkedInAt: "asc"
          },
          select: {
            userId: true,
            checkedInAt: true,
            speakCount: true,
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                email: true
              }
            }
          } as any
        }
      }
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("[ADMIN_SESSIONS_GET]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: error.message === "Không có quyền truy cập" ? 403 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    await verifyAdmin();

    const { classCode, title } = await req.json();

    if (!classCode || !title || title.trim() === "") {
      return NextResponse.json({ error: "Mã lớp và tên buổi học là bắt buộc" }, { status: 400 });
    }

    const trimmedTitle = title.trim();

    // Sử dụng Transaction để đóng tất cả các buổi học cũ của lớp này trước khi mở buổi mới
    const newSession = await prisma.$transaction(async (tx: any) => {
      await (tx as any).classSession.updateMany({
        where: { classCode, isActive: true },
        data: { isActive: false }
      });

      return await (tx as any).classSession.create({
        data: {
          classCode,
          title: trimmedTitle,
          isActive: true
        }
      });
    });

    return NextResponse.json({ success: true, session: newSession });
  } catch (error: any) {
    console.error("[ADMIN_SESSIONS_POST]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: error.message === "Không có quyền truy cập" ? 403 : 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await verifyAdmin();

    const { sessionId, isActive, callingStudentId, clearCalling } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Thiếu ID buổi học (sessionId)" }, { status: 400 });
    }

    const updateData: any = {};
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    if (callingStudentId !== undefined) {
      updateData.callingStudentId = callingStudentId;
    }
    if (clearCalling === true) {
      updateData.callingStudentId = null;
    }

    console.log("[PATCH SESSIONS] Request payload:", { sessionId, isActive, callingStudentId, clearCalling });

    const updatedSession = await prisma.$transaction(async (tx: any) => {
      if (callingStudentId) {
        const updateResult = await (tx as any).attendance.updateMany({
          where: { sessionId, userId: callingStudentId },
          data: {
            speakCount: {
              increment: 1
            }
          } as any
        });
        console.log("[PATCH SESSIONS] updateMany result:", updateResult);
      }

      return await (tx as any).classSession.update({
        where: { id: sessionId },
        data: updateData
      });
    });

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error: any) {
    console.error("[ADMIN_SESSIONS_PATCH]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: error.message === "Không có quyền truy cập" ? 403 : 500 });
  }
}
