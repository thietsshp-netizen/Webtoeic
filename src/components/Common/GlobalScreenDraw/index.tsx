/* src/components/Common/GlobalScreenDraw/index.tsx */
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { ScreenDrawOverlay } from "../ScreenDrawOverlay";
import styles from "./styles.module.css";

export const GlobalScreenDraw: React.FC = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);

  // Chỉ hiển thị và cho phép chạy nếu người dùng đăng nhập là ADMIN
  const isAdmin = session?.user && (session.user as any).role === "ADMIN";

  // Phát sự kiện đồng bộ trạng thái cọ vẽ ra toàn hệ thống mỗi khi isActive thay đổi
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("webtoeic-toggle-global-draw-state", { detail: { active: isActive } }));
  }, [isActive]);

  // Lắng nghe sự kiện đồng bộ từ nút Pencil trong trang bài giảng (Learn layout)
  useEffect(() => {
    const handleToggleDraw = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsActive(customEvent.detail.active);
    };
    window.addEventListener("webtoeic-toggle-global-draw", handleToggleDraw);
    return () => {
      window.removeEventListener("webtoeic-toggle-global-draw", handleToggleDraw);
    };
  }, []);

  if (!isAdmin) return null;

  // Nếu đang ở trang học tập ([courseId]/lesson), chúng ta đã có nút bút chì tích hợp trên thanh header rồi
  // Do đó, ta sẽ ẩn nút nổi ở trang học tập này để tránh bị trùng lặp 2 nút bút chì gây rối mắt
  const isLearnPage = pathname?.includes("/learn/");

  return (
    <>
      {!isLearnPage && (
        <button
          onClick={() => setIsActive(!isActive)}
          className={`${styles.floatingBtn} ${isActive ? styles.floatingBtnActive : ""}`}
          title={isActive ? "Tắt bảng vẽ viết nháp (Ctrl+Shift+B)" : "Bật bảng vẽ viết nháp toàn website (Ctrl+Shift+B)"}
        >
          {isActive ? <X size={18} /> : <Pencil size={18} />}
        </button>
      )}

      {/* Lớp phủ Canvas vẽ viết Glassmorphism toàn hệ thống */}
      <ScreenDrawOverlay isActive={isActive} setIsActive={setIsActive} />
    </>
  );
};
