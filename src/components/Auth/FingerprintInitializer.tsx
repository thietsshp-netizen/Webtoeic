"use client";

import { useEffect } from "react";
import { getBrowserFingerprint } from "@/lib/fingerprint";

export default function FingerprintInitializer() {
  useEffect(() => {
    async function init() {
      try {
        const fp = await getBrowserFingerprint();
        // Lưu vào cookie với thời hạn 1 năm
        document.cookie = `device_fingerprint=${fp}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      } catch (e) {
        console.error("Fingerprint error:", e);
      }
    }
    init();
  }, []);

  return null;
}
