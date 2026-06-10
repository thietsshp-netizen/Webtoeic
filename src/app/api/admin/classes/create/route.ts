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
      return NextResponse.json({ error: "Mã lớp không được để trống" }, { status: 400 });
    }

    const trimmedCode = code.trim();

    // Kiểm tra xem đã tồn tại chưa
    const existing = await prisma.class.findUnique({
      where: { code: trimmedCode }
    });

    if (existing) {
      return NextResponse.json({ error: "Mã lớp này đã tồn tại" }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: { code: trimmedCode }
    });

    return NextResponse.json({ success: true, class: newClass });
  } catch (error: any) {
    console.error("[CLASS_CREATE_POST]", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: 500 });
  }
}
