import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { v4 as uuidv4 } from 'uuid';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 15000, // Tăng timeout OAuth request lên 15s để tránh timeout chập chờn khi chạy local
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập đầy đủ Email và Mật khẩu.");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        if (!user) {
          throw new Error("Tài khoản (Email) này chưa được đăng ký trong hệ thống.");
        }

        if (!user.password) {
          throw new Error("Tài khoản này được tạo bằng nút Google (chưa có mật khẩu). Vui lòng bấm vào nút 'Đăng nhập bằng Google' ở trên.");
        }

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordMatch) {
          throw new Error("Mật khẩu không chính xác. Vui lòng kiểm tra lại.");
        }

        return user;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) {
        return false;
      }
      console.log("SignIn Callback - User:", user.email);
      const normalizedEmail = user.email.toLowerCase().trim();
      const dbUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, role: true, accountExpiresAt: true, createdAt: true }
      });
      console.log("SignIn Callback - dbUser found:", !!dbUser);

      // ĐẶC QUYỀN ADMIN: Tự động gán Role Admin và BỎ QUA tất cả các kiểm tra chặn
      const isAdmin = normalizedEmail === "thietsshp@gmail.com";
      if (isAdmin) {
        try {
          if (dbUser && dbUser.role !== "ADMIN") {
            await prisma.user.update({
              where: { email: normalizedEmail },
              data: { role: "ADMIN" }
            });
          }
        } catch (e) {
          console.error("Lỗi cập nhật quyền Admin:", e);
        }
        return true; // Admin luôn được phép đăng nhập
      }

      // 2. TỰ ĐỘNG THIẾT LẬP 7 NGÀY CHO NGƯỜI MỚI (GOOGLE)
      if (account?.provider === "google") {
        if (!dbUser) {
          // User mới hoàn toàn từ Google
          (user as any).accountExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        } else if (!dbUser.accountExpiresAt) {
          // User cũ chưa có ngày hết hạn -> tặng 7 ngày
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { accountExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
          });
        }
      }

      // 1. CHẶN ĐĂNG NHẬP NẾU TÀI KHOẢN ĐÃ HẾT HẠN (Chỉ áp dụng cho USER) - Đã bỏ chặn để học viên xem được thông tin cá nhân

      // 3. KIỂM TRA GIỚI HẠN THIẾT BỊ
      try {
        if (dbUser && dbUser.role !== "ADMIN") {
          const cookieStore = await cookies();
          const fingerprint = cookieStore.get("device_fingerprint")?.value;
          const userAgent = (await headers()).get("user-agent") || "";

          console.log("SignIn Callback - Device Check - Fingerprint:", fingerprint);

          if (!fingerprint) {
            // Nếu không có fingerprint, cho qua tạm thời hoặc chặn tùy cấu hình
          } else {
            // Xác định loại thiết bị từ User-Agent
            const isMobile = /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle/i.test(userAgent);
            const deviceType = isMobile ? "MOBILE" : "PC";
            const deviceModel = isMobile ? "Mobile Device" : "PC/Laptop";

            // Tìm thiết bị này trong DB
            const existingDevice = await (prisma as any).userDevice.findUnique({
              where: {
                userId_deviceId: {
                  userId: dbUser.id,
                  deviceId: fingerprint
                }
              }
            });

            if (!existingDevice) {
              // Thiết bị mới! Kiểm tra xem đã hết slot cho loại này chưa
              const devicesOfSameType = await (prisma as any).userDevice.findMany({
                where: { userId: dbUser.id, type: deviceType }
              });

              if (devicesOfSameType.length >= 1) {
                // Đã hết slot! Kiểm tra xem tài khoản có còn trong 30 ngày đầu không
                const userCreatedAt = dbUser.createdAt ? new Date(dbUser.createdAt) : new Date();
                const accountAgeInDays = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);

                if (accountAgeInDays > 30) {
                  return `/auth/signin?error=DeviceLimitLocked&type=${deviceType}`;
                } else {
                  return `/auth/signin?error=DeviceLimitTrial&type=${deviceType}`;
                }
              } else {
                // Còn slot, tự động đăng ký máy mới
                await (prisma as any).userDevice.create({
                  data: {
                    userId: dbUser.id,
                    deviceId: fingerprint,
                    type: deviceType,
                    model: deviceModel
                  }
                });
              }
            }
          }
        }
      } catch (deviceError: any) {
        console.error("SignIn Callback - Device Check Error:", deviceError);
        // Nếu catch được chuỗi URL redirect từ logic trong try
        if (typeof deviceError === 'string' && deviceError.includes("/auth/signin")) {
          return deviceError;
        }
      }

      console.log("SignIn Callback - Success");
      return true;
    },
    async session({ session, token }) {
      if (!token || token.error) {
        return {
          ...session,
          user: null,
          error: token?.error || "InvalidToken"
        } as any;
      }
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).daysLeft = token.daysLeft;
        (session.user as any).expiresAt = token.expiresAt;
        (session.user as any).createdAt = token.createdAt;

        session.user.email = (token.email as string) || session.user.email;
        session.user.name = (token.displayName as string) || (token.name as string) || (session.user.email?.split('@')[0]);

        if (token.picture) {
          session.user.image = token.picture;
        }
      }
      return session;
    },
    async jwt({ token, user, trigger, session: updatedSession }) {
      // ========== LẦN ĐẦU ĐĂNG NHẬP (user object tồn tại) ==========
      if (user) {
        console.log("JWT Callback - Initial Sign In - User ID:", user.id, "Email:", user.email);
        token.sub = user.id;

        // Lấy thông tin đầy đủ từ DB một lần duy nhất khi đăng nhập
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id as string },
            select: { id: true, email: true, role: true, accountExpiresAt: true, displayName: true, name: true, createdAt: true } as any
          });

          if (dbUser) {
            const userObj = dbUser as any;
            token.email = userObj.email;
            token.role = userObj.role;
            token.expiresAt = userObj.accountExpiresAt;
            token.createdAt = userObj.createdAt;
            token.displayName = userObj.displayName;
            token.name = userObj.name;

            if (dbUser.accountExpiresAt) {
              const now = new Date();
              const expiresAt = new Date(dbUser.accountExpiresAt as any);
              const diffTime = expiresAt.getTime() - now.getTime();
              token.daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } else {
              token.daysLeft = null;
            }
          } else {
            // Fallback nếu không tìm thấy trong DB
            token.role = user.email === "thietsshp@gmail.com" ? "ADMIN" : ((user as any).role || "USER");
            token.displayName = (user as any).displayName;
            token.expiresAt = (user as any).accountExpiresAt;
            token.createdAt = (user as any).createdAt;
          }
        } catch (e) {
          console.error("JWT Callback - Initial DB fetch error:", e);
          token.role = user.email === "thietsshp@gmail.com" ? "ADMIN" : ((user as any).role || "USER");
        }

        // Tạo session ID mới và cập nhật activeSessionId (chỉ lần đăng nhập)
        if (token.role !== "ADMIN") {
          try {
            const newSessionId = uuidv4();
            token.sessionId = newSessionId;
            await (prisma as any).user.update({
              where: { id: user.id },
              data: { activeSessionId: newSessionId }
            });
            console.log("JWT Callback - Registered new sessionId for user:", user.id);
          } catch (e) {
            console.error("JWT Callback - Session ID update error:", e);
          }
        }
      }

      // ========== CẬP NHẬT TOKEN KHI USER YÊU CẦU (trigger=update) ==========
      if (trigger === "update") {
        if (updatedSession?.name) {
          token.displayName = updatedSession.name;
        }
        // Khi update được trigger, đồng bộ lại dữ liệu từ DB (ít xảy ra)
        if (token.sub) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.sub as string },
              select: { email: true, role: true, accountExpiresAt: true, displayName: true, name: true, createdAt: true, activeSessionId: true } as any
            });
            if (dbUser) {
              const userObj = dbUser as any;
              token.email = userObj.email;
              token.role = userObj.role;
              token.expiresAt = userObj.accountExpiresAt;
              token.createdAt = userObj.createdAt;
              token.displayName = userObj.displayName || updatedSession?.name || token.displayName;
              token.name = userObj.name;
              if (dbUser.accountExpiresAt) {
                const now = new Date();
                const expiresAt = new Date(dbUser.accountExpiresAt as any);
                token.daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              }
            }
          } catch (e) {
            console.error("JWT Callback - Update DB sync error:", e);
          }
        }
      }

      // ========== CÁC LẦN GỌI SESSION TIẾP THEO ==========
      // Không query DB nữa! Token JWT đã chứa đầy đủ thông tin.
      // Chỉ kiểm tra session conflict nếu có sessionId (chống học song song)
      // Việc kiểm tra này được thực hiện ở API level thay vì mỗi lần refresh token.

      return token;
    }
  },
  session: {
    strategy: "jwt" // Dùng JWT để linh hoạt hơn trong môi trường Serverless
  },
  pages: {
    signIn: "/auth/signin", // Chuyển hướng đến trang Đăng nhập chuyên nghiệp
    error: "/auth/signin",  // Mọi lỗi xác thực đều đưa về trang Đăng nhập custom
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
};
