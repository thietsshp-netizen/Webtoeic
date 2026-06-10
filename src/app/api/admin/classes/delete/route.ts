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
    const { code } = await req.json();

    if (!code || code.trim() === "") {
      return NextResponse.json({ error: "Thiếu mã lớp cần xóa" }, { status: 400 });
    }

    const trimmedCode = code.trim();

    // Dùng transaction để vừa xóa mã lớp khỏi bảng Class, vừa reset classCode của học viên đang có lớp này về null
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { classCode: trimmedCode },
        data: { classCode: null }
      }),
      prisma.class.delete({
        where: { code: trimmedCode }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CLASS_DELETE_POST]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: 500 });
  }
}
