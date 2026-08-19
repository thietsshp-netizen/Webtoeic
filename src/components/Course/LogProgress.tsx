"use client";

import { useEffect, useRef } from "react";

export default function LogProgress({ lessonId }: { lessonId: string }) {
  const loggedRef = useRef(false);

  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;

    fetch(`/api/lessons/${lessonId}/progress`, {
      method: "POST",
      keepalive: true, // Đảm bảo request vẫn gửi thành công nếu học viên chuyển trang nhanh
    }).catch((err) => console.error("Lỗi ghi nhận tiến độ:", err));
  }, [lessonId]);

  return null;
}
