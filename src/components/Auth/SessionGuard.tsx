"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function SessionGuard() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    // 1. Gửi Heartbeat định kỳ mỗi 5 phút (300 giây) để tối ưu hóa CPU Vercel
    // Chỉ gửi khi tab trình duyệt đang hoạt động (visible)
    const heartbeatInterval = setInterval(async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      try {
        const res = await fetch("/api/me/heartbeat", { method: "POST" });
        if (!res.ok) {
          console.warn("Heartbeat failed");
        }
      } catch (e) {
        console.error("Heartbeat network error");
      }
    }, 300000);

    // 2. Kiểm tra xem session có bị chiếm quyền không mỗi 60 giây
    // Chỉ gửi khi tab trình duyệt đang hoạt động (visible)
    const sessionCheckInterval = setInterval(async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
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
      } catch (e) {
        console.error("Session check error", e);
      }
    }, 60000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(sessionCheckInterval);
    };
  }, [status]);

  return null;
}
