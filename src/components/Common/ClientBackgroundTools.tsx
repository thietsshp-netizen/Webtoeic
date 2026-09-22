"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { Shield, Video, CalendarCheck, Pencil, X, Sparkles } from "lucide-react";
import { clsx } from "clsx";

import { usePathname } from "next/navigation";

const GlobalScreenDraw = dynamic(
  () => import("@/components/Common/GlobalScreenDraw").then((m) => m.GlobalScreenDraw),
  { ssr: false }
);

const GlobalClassCalling = dynamic(
  () => import("@/components/Common/GlobalClassCalling").then((m) => m.GlobalClassCalling),
  { ssr: false }
);

const AdminScreenRecorder = dynamic(
  () => import("@/components/Admin/AdminScreenRecorder").then((m) => m.AdminScreenRecorder),
  { ssr: false }
);

export function UnifiedAdminToolbar({ embedded = false }: { embedded?: boolean }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isClickedOpen, setIsClickedOpen] = useState(false);

  // States theo dõi xem chức năng nào đang BẬT
  const [isDrawActive, setIsDrawActive] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("webtoeic_screendraw_active") === "true";
    }
    return false;
  });
  const [isCallingActive, setIsCallingActive] = useState(false);
  const [isRecorderActive, setIsRecorderActive] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // Theo dõi sự kiện thay đổi trạng thái của từng công cụ
  useEffect(() => {
    const handleDrawState = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsDrawActive(!!customEvent.detail?.active);
    };
    const handleCallingState = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsCallingActive(!!customEvent.detail?.active);
    };
    const handleRecorderState = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsRecorderActive(!!customEvent.detail?.active);
    };

    window.addEventListener("webtoeic-toggle-global-draw-state", handleDrawState);
    window.addEventListener("webtoeic-toggle-global-calling-state", handleCallingState);
    window.addEventListener("webtoeic-toggle-global-recorder-state", handleRecorderState);

    return () => {
      window.removeEventListener("webtoeic-toggle-global-draw-state", handleDrawState);
      window.removeEventListener("webtoeic-toggle-global-calling-state", handleCallingState);
      window.removeEventListener("webtoeic-toggle-global-recorder-state", handleRecorderState);
    };
  }, []);

  if (!isAdmin) return null;

  // Nếu là toolbar cố định toàn cục và đang ở trang /learn (đã có embedded toolbar trong header) thì ẩn bản fixed
  if (!embedded && pathname?.startsWith("/learn")) return null;

  const isAnyActive = isDrawActive || isCallingActive || isRecorderActive;
  const isExpanded = isHovered || isClickedOpen;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  return (
    <div
      className={clsx(
        "select-none transition-all duration-300",
        embedded
          ? "relative z-[1000000010] flex items-center"
          : "fixed top-2.5 right-14 sm:right-20 z-[1000000010]"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={clsx(
          "flex items-center transition-all duration-300 shadow-xl backdrop-blur-xl rounded-full border",
          isExpanded
            ? "bg-slate-900/95 border-amber-400/50 p-1 gap-1.5"
            : isAnyActive
            ? "bg-slate-900/90 border-red-500/70 text-white animate-pulse p-1"
            : "bg-slate-900/80 hover:bg-slate-900 text-amber-400 border-white/15 hover:border-amber-400/40 p-1"
        )}
      >
        {/* Nút thu gọn / khiên nhận diện dạng chấm tròn nhỏ */}
        <button
          type="button"
          onClick={() => setIsClickedOpen(!isClickedOpen)}
          className="relative flex items-center justify-center w-[clamp(20px,3vh,28px)] h-[clamp(20px,3vh,28px)] rounded-full transition-colors cursor-pointer shrink-0"
          title={isExpanded ? "Đóng thanh Admin" : "Công cụ Admin (Quay video, Điểm danh, Viết nháp)"}
        >
          <Shield className={clsx("w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0", isAnyActive ? "text-red-400 animate-bounce" : "text-amber-400")} />
          {isAnyActive && !isExpanded && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        {/* Các nút công cụ mở rộng khi Rê chuột hoặc Click */}
        {isExpanded && (
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-700/60 animate-in fade-in slide-in-from-right-2 duration-200">
            {/* 1. Nút Quay Video */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("webtoeic-toggle-global-recorder"));
              }}
              className={clsx(
                "relative p-2 rounded-full transition-all cursor-pointer flex items-center justify-center",
                isRecorderActive
                  ? "bg-red-600 text-white shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                  : "bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white"
              )}
              title={isRecorderActive ? "TẮT Quay video bài giảng (Đang mở)" : "MỞ Quay video bài giảng"}
            >
              <Video size={15} />
              {isRecorderActive && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping" />
              )}
            </button>

            {/* 2. Nút Điểm Danh */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("webtoeic-toggle-global-calling"));
              }}
              className={clsx(
                "relative p-2 rounded-full transition-all cursor-pointer flex items-center justify-center",
                isCallingActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-400"
                  : "bg-slate-800 hover:bg-blue-600/80 text-slate-300 hover:text-white"
              )}
              title={isCallingActive ? "TẮT Điểm danh & gọi học viên (Đang mở)" : "MỞ Điểm danh & gọi học viên"}
            >
              <CalendarCheck size={15} />
              {isCallingActive && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping" />
              )}
            </button>

            {/* 3. Nút Viết Nháp */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("webtoeic-toggle-global-draw"));
              }}
              className={clsx(
                "relative p-2 rounded-full transition-all cursor-pointer flex items-center justify-center",
                isDrawActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400"
                  : "bg-slate-800 hover:bg-emerald-600/80 text-slate-300 hover:text-white"
              )}
              title={isDrawActive ? "TẮT Bảng vẽ nháp (Đang mở)" : "MỞ Bảng vẽ nháp toàn màn hình"}
            >
              <Pencil size={15} />
              {isDrawActive && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientBackgroundTools() {
  return (
    <>
      <GlobalScreenDraw />
      <GlobalClassCalling />
      <AdminScreenRecorder />
      <UnifiedAdminToolbar />
    </>
  );
}
