import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Tính năng tự đăng ký đã bị vô hiệu hóa. Vui lòng liên hệ Admin để nhận tài khoản." },
    { status: 403 }
  );
}
