import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// Tạo transporter - tương thích cả Gmail lẫn Google Workspace
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Vui lòng đăng nhập" }, { status: 401 });
    }

    const { displayName, password } = await req.json();

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Không có thông tin thay đổi" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    }) as any;

    // Gửi email thông báo cho Admin nếu có đổi mật khẩu
    if (password && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const adminEmail = process.env.ADMIN_EMAIL || "thietsshp@gmail.com";
      const studentName = updatedUser.displayName || updatedUser.name || session.user.email;
      const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

      try {
        await transporter.sendMail({
          from: `"hoctoeic System" <${process.env.GMAIL_USER}>`,
          to: adminEmail,
          subject: `[hoctoeic] Học viên vừa đổi mật khẩu`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 12px;">
              <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 22px;">🔔 Thông báo từ hoctoeic</h1>
              </div>
              <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
                <h2 style="color: #1e293b; margin-top: 0;">Học viên vừa đổi mật khẩu</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 140px;">👤 Học viên:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${studentName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">📧 Email:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${session.user.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">🕐 Thời gian:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${now}</td>
                  </tr>
                </table>
                <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ Nếu bạn không thực hiện yêu cầu này, vui lòng kiểm tra tài khoản ngay.</p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        // Không fail request nếu gửi email thất bại
        console.error("Lỗi gửi email thông báo:", emailError);
      }
    }

    return NextResponse.json({
      message: "Cập nhật thông tin thành công",
      changedPassword: !!password,
      user: {
        id: updatedUser.id,
        displayName: updatedUser.displayName,
        name: updatedUser.name
      }
    });
  } catch (error) {
    console.error("Lỗi cập nhật profile:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi trên server" },
      { status: 500 }
    );
  }
}
