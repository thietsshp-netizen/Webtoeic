"use client";

import { useEffect } from "react";
import { getBrowserFingerprint } from "@/lib/fingerprint";

export default function FingerprintInitializer() {
  useEffect(() => {
    async function init() {
      try {
        const getCookie = (name: string) => {
          return document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="))
            ?.split("=")[1];
        };

        const cookieFp = getCookie("device_fingerprint");
        const localFp = localStorage.getItem("device_fingerprint");

        // 1. Khôi phục từ Cookie sang LocalStorage nếu bị mất
        if (cookieFp && !localFp) {
          localStorage.setItem("device_fingerprint", cookieFp);
          return;
        }

        // 2. Khôi phục từ LocalStorage sang Cookie nếu bị mất
        if (!cookieFp && localFp) {
          document.cookie = `device_fingerprint=${localFp}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
          return;
        }

        // 3. Nếu đã tồn tại ở cả 2 nơi -> Giữ nguyên, KHÔNG ghi đè để tránh bị lệch mã băm khi zoom màn hình
        if (cookieFp && localFp) {
          return;
        }

        // 4. Chỉ băm mã mới khi mất sạch ở cả 2 nơi (hoặc vào lần đầu tiên)
        const fp = await getBrowserFingerprint();
        document.cookie = `device_fingerprint=${fp}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
        localStorage.setItem("device_fingerprint", fp);
      } catch (e) {
        console.error("Fingerprint error:", e);
      }
    }
    init();
  }, []);

  return null;
}
