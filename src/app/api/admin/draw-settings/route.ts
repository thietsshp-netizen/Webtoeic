import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/admin/draw-settings - Lấy cấu hình phím tắt và bút clone của Admin đang đăng nhập
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    // Bảo mật nghiêm ngặt: Chỉ ADMIN có quyền truy cập
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Không có quyền thực hiện" }, { status: 403 });
    }

    // Truy vấn đúng hàng dữ liệu của chính Admin đó trong bảng User
    const user = await (prisma.user as any).findUnique({
      where: { id: session.user.id },
      select: { drawSettings: true }
    });

    return NextResponse.json({ drawSettings: user?.drawSettings || null });
  } catch (error) {
    console.error("Lỗi lấy cấu hình vẽ:", error);
    return NextResponse.json({ message: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}

// POST /api/admin/draw-settings - Lưu cấu hình phím tắt và bút clone cho Admin đang đăng nhập
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    // Bảo mật nghiêm ngặt: Chỉ ADMIN có quyền thực hiện
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Không có quyền thực hiện" }, { status: 403 });
    }

    const payload = await req.json();

    // Cập nhật duy nhất trường drawSettings của đúng 1 hàng User tương ứng.
    // Tuyệt đối không xóa, không sửa bất kỳ bảng hay trường dữ liệu nào khác.
    const updatedUser = await (prisma.user as any).update({
      where: { id: session.user.id },
      data: { drawSettings: payload },
      select: { id: true, drawSettings: true }
    });

    return NextResponse.json({ 
      message: "Lưu cấu hình vẽ thành công",
      drawSettings: updatedUser.drawSettings
    });
  } catch (error) {
    console.error("Lỗi cập nhật cấu hình vẽ:", error);
    return NextResponse.json({ message: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}
