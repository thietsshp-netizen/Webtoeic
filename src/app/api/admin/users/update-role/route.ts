import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    // Kiểm tra quyền Admin
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Không có quyền thực hiện" }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { message: "Thiếu thông tin User hoặc Role" },
        { status: 400 }
      );
    }

    // Không cho phép tự hạ quyền của chính mình (để tránh mất quyền admin)
    if (userId === session.user.id) {
      return NextResponse.json(
        { message: "Bạn không thể tự thay đổi quyền của chính mình" },
        { status: 400 }
      );
    }

    // Cập nhật Role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    return NextResponse.json({
      message: "Cập nhật quyền thành công",
      user: updatedUser
    });
  } catch (error) {
    console.error("Lỗi cập nhật role:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi trên server" },
      { status: 500 }
    );
  }
}
