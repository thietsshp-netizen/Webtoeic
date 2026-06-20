import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// Transporter dùng chung Google Workspace / Gmail
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
    
    // Kiểm tra quyền Admin
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Không có quyền thực hiện" }, { status: 403 });
    }

    const { name, email, password, days, role, classCode } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ Tên, Email và Mật khẩu" },
        { status: 400 }
      );
    }

    // Mặc định là +7 ngày nếu không truyền lên số ngày cụ thể
    const daysNum = days !== undefined ? parseInt(days) : 7;
    const expiresAt = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000);

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email này đã tồn tại trên hệ thống" },
        { status: 400 }
      );
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
        accountExpiresAt: expiresAt,
        classCode: classCode || null
      },
    });

    const { password: _, ...userWithoutPassword } = newUser as any;

    // --- Gửi email chào mừng cho học viên ---
    const appUrl = process.env.NEXTAUTH_URL || "https://hoctoeic.com";
    const loginUrl = `${appUrl}/auth/signin`;

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        await transporter.sendMail({
          from: `"Mr. Thiệt - hoctoeic" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: `🎓 Tài khoản hoctoeic của bạn đã sẵn sàng!`,
          html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1e40af;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="width:60px;height:60px;background:white;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:32px;">🎓</span>
            </div>
            <h1 style="color:white;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">CHÀO MỪNG ĐẾN VỚI<br/>hoctoeic!</h1>
            <p style="color:#93c5fd;margin:8px 0 0;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">E-Learning System</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:white;padding:40px;">
            <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 8px;">Xin chào <strong>${name}</strong>! 👋</p>
            <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">
              Mr. Thiệt vừa tạo tài khoản cho bạn tại <strong>hoctoeic.com</strong>. Bạn có thể bắt đầu hành trình chinh phục TOEIC ngay hôm nay!
            </p>

            <!-- Login Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;">
                  <p style="color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">🔐 Thông tin đăng nhập</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                        <span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Email</span>
                        <br/>
                        <span style="color:#1e293b;font-size:15px;font-weight:800;">${email}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">
                        <span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Mật khẩu</span>
                        <br/>
                        <span style="color:#1e40af;font-size:18px;font-weight:900;letter-spacing:2px;">${password}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${loginUrl}" style="display:inline-block;background:#1e40af;color:white;text-decoration:none;padding:16px 48px;border-radius:50px;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 8px 24px rgba(30,64,175,0.3);">
                    Đăng nhập ngay →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Tip Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #1e40af;border-radius:0 8px 8px 0;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="color:#1e40af;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">💡 Mẹo hay</p>
                  <p style="color:#475569;font-size:13px;line-height:1.6;margin:0;">
                    Sau khi đăng nhập, bạn có thể <strong>đổi mật khẩu và tên hiển thị</strong> theo ý muốn bằng cách:<br/>
                    Vào <strong>Dashboard</strong> → Bấm nút <strong>"Cài đặt tài khoản" ⚙️</strong>
                  </p>
                </td>
              </tr>
            </table>

            <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
              Nếu bạn cần hỗ trợ, liên hệ Mr. Thiệt qua
              <a href="https://www.facebook.com/ToeicMrThiet990" style="color:#1e40af;">Fanpage</a> hoặc
              <a href="https://www.facebook.com/" style="color:#1e40af;">Facebook cá nhân</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:11px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
              © 2026 hoctoeic.com · Được gửi bởi Mr. Thiệt
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
          `,
        });
        console.log(`✅ Đã gửi email chào mừng đến: ${email}`);
      } catch (emailError) {
        // Không fail nếu email lỗi, chỉ log để debug
        console.error("⚠️ Lỗi gửi email chào mừng:", emailError);
      }
    }

    return NextResponse.json(
      { 
        message: "Tạo tài khoản thành công",
        emailSent: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi tạo user:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi trên server" },
      { status: 500 }
    );
  }
}
