"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function SessionGuard() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    // 1. Gửi Heartbeat định kỳ mỗi 45 giây
    const heartbeatInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/me/heartbeat", { method: "POST" });
        if (!res.ok) {
          // Nếu API lỗi (có thể do bị logout hoặc server error)
          console.warn("Heartbeat failed");
        }
      } catch (e) {
        console.error("Heartbeat network error");
      }
    }, 45000);

    // 2. Kiểm tra xem session có bị chiếm quyền không
    // NextAuth sẽ tự động gọi API /api/auth/session định kỳ. 
    // Nếu callback JWT trả về null, session sẽ bị mất.
    const sessionCheckInterval = setInterval(async () => {
      const res = await fetch("/api/auth/session");
      const currentSession = await res.json();
      
      // Nếu session bị mất (do logic sessionId không khớp trong auth.ts)
      if (!currentSession || Object.keys(currentSession).length === 0) {
        toast.error("Tài khoản của bạn vừa đăng nhập ở thiết bị khác. Bạn sẽ được đăng xuất.", {
          duration: 10000,
          icon: '⚠️'
        });
        setTimeout(() => {
          signOut({ callbackUrl: "/auth/signin?error=SessionConflict" });
        }, 3000);
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(sessionCheckInterval);
    };
  }, [status]);

  return null;
}
