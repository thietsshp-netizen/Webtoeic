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
    const { userId, classCode } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Thiếu ID người dùng" }, { status: 400 });
    }

    // Nếu classCode rỗng hoặc rỗng dạng chuỗi thì gán null
    const finalClassCode = classCode && classCode.trim() !== "" ? classCode.trim() : null;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        classCode: finalClassCode
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("[UPDATE_CLASS_POST]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: 500 });
  }
}
