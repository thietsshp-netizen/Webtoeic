import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  try {
    const { userId, days } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Thiếu ID người dùng" }, { status: 400 });
    }

    // Chuyển đổi an toàn: nếu không có days hoặc days rỗng thì set null (vĩnh viễn)
    const daysInt = days !== "" && days !== undefined ? parseInt(days) : null;
    
    let expiresAt = null;
    if (daysInt !== null && !isNaN(daysInt)) {
       expiresAt = new Date(Date.now() + daysInt * 24 * 60 * 60 * 1000);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountExpiresAt: expiresAt
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("[UPDATE_EXPIRATION_POST]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: 500 });
  }
}
