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
    const { userId, name } = await req.json();

    if (!userId || !name || name.trim() === "") {
      return NextResponse.json({ error: "Thiếu ID người dùng hoặc Tên học viên trống" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim()
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("[UPDATE_NAME_POST]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: 500 });
  }
}
