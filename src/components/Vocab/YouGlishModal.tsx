"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Volume2, Video, ExternalLink, RefreshCw } from "lucide-react";
import { speakVocab } from "@/lib/vocab-audio";

interface YouGlishModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  ipa?: string;
  mean?: string;
  embedded?: boolean;
}

type Accent = "all" | "us" | "uk" | "aus";

declare global {
  interface Window {
    YG?: any;
  }
}

// Unmanaged Leaf Component to prevent any React reconciliation conflicts with YouGlish DOM
const YouGlishPlayer = React.memo(function YouGlishPlayer({
  word,
  accent,
  refreshKey,
  isOpen
}: {
  word: string;
  accent: Accent;
  refreshKey: number;
  isOpen: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  // Pause when modal closes
  useEffect(() => {
    if (!isOpen && widgetRef.current && typeof widgetRef.current.pause === "function") {
      try {
        widgetRef.current.pause();
      } catch (e) {}
    }
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container || !word) return;

    const cleanWord = word.replace(/<[^>]*>/g, "").replace(/[()\[\]]/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanWord) return;

    const uniqueId = `yg-widget-${Date.now()}`;
    container.innerHTML = `<div id="${uniqueId}"></div>`;

    const loadScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.YG && window.YG.Widget) {
          resolve();
          return;
        }
        const existing = document.getElementById("youglish-widget-script");
        if (existing) {
          if (window.YG && window.YG.Widget) {
            resolve();
          } else {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", reject);
          }
          return;
        }
        const script = document.createElement("script");
        script.id = "youglish-widget-script";
        script.src = "https://youglish.com/public/emb/widget.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const init = async () => {
      try {
        await loadScript();
        if (!isMounted) return;

        if (window.YG && window.YG.Widget) {
          // Tính toán kích thước theo 3 chế độ: Điện thoại dọc, Điện thoại xoay ngang, và Máy tính
          const winWidth = typeof window !== "undefined" ? window.innerWidth : 800;
          const winHeight = typeof window !== "undefined" ? window.innerHeight : 600;
          const isLandscape = winWidth > winHeight;

          let calcWidth: number;
          let captionSize: number;

          if (winWidth < 640 && !isLandscape) {
            // 1. Điện thoại màn hình dọc: bề ngang hẹp, co giãn sát mép viền
            calcWidth = Math.max(280, Math.min(360, winWidth - 20));
            captionSize = 17;
          } else if (winHeight < 520 && isLandscape) {
            // 2. Điện thoại màn hình ngang: chiều cao thấp (~375-414px), đặt width ~420px để video 16:9 cao ~236px vừa khít khung
            calcWidth = Math.min(420, Math.max(300, winWidth - 40));
            captionSize = 16;
          } else {
            // 3. Máy tính / Màn hình lớn: kích thước chuẩn vàng 600px, cao ~338px vừa vặn hoàn hảo trong modal
            calcWidth = Math.min(600, Math.max(400, winWidth - 60));
            captionSize = 20;
          }

          const widget = new window.YG.Widget(uniqueId, {
            width: calcWidth,
            components: 255, // Bật lại đầy đủ tính năng: Video + Phụ đề + Nút tua/phát + Thanh tìm kiếm YouGlish
            autoStart: 1,
            backgroundColor: "#ffffff",
            markerColor: "#fde047",
            captionColor: "#1e293b",
            captionSize: captionSize,
            events: {
              onError: (event: any) => {
                console.warn("YouGlish error code:", event);
              }
            }
          });
          widgetRef.current = widget;
          widget.fetch(cleanWord, "english", accent === "all" ? undefined : accent);
        }
      } catch (e) {
        console.error("Failed to load YouGlish widget", e);
        if (isMounted && container) {
          container.innerHTML = `
            <div style="padding: 1.5rem; text-align: center; color: #64748b;">
              <p style="font-weight: bold; margin-bottom: 0.5rem; color: #e11d48; font-size: 0.85rem;">Không thể tải video YouGlish</p>
              <a href="https://youglish.com/pronounce/${encodeURIComponent(cleanWord)}/english/${accent}/cptc=1" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-size: 0.75rem;">
                Mở xem trực tiếp trên YouGlish.com &rarr;
              </a>
            </div>
          `;
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      if (widgetRef.current && typeof widgetRef.current.pause === "function") {
        try {
          widgetRef.current.pause();
        } catch (e) {}
      }
    };
  }, [word, accent, refreshKey]);

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center justify-center p-0 sm:p-1 overflow-x-hidden"
    />
  );
});

export default function YouGlishModal({ 
  isOpen, 
  onClose, 
  word, 
  ipa, 
  mean,
  embedded = false 
}: YouGlishModalProps) {
  const [accent, setAccent] = useState<Accent>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasOpenedEver, setHasOpenedEver] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasOpenedEver(true);
      setAccent("all");
    }
  }, [isOpen]);

  if (!hasOpenedEver && !isOpen) return null;

  const accentPath = accent === "all" ? "all" : accent;
  const cleanWord = (word || "").replace(/<[^>]*>/g, "").replace(/[()\[\]]/g, " ").replace(/\s+/g, " ").trim();
  const youglishExternalUrl = `https://youglish.com/pronounce/${encodeURIComponent(cleanWord)}/english/${accentPath}/cptc=1`;

  // Nếu là embedded mode: nằm trọn trong khung video bằng absolute inset-0
  // Nếu là global mode: nằm phủ toàn màn hình bằng fixed inset-0
  const wrapperClass = embedded
    ? `absolute inset-0 w-full h-full transition-all duration-200 z-50 ${
        isOpen ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"
      }`
    : `fixed inset-0 w-full h-full flex items-center justify-center p-2 sm:p-4 transition-all duration-200 ${
        isOpen ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"
      }`;

  const dialogClass = embedded
    ? "bg-white rounded-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-300 animate-in zoom-in-95 duration-150 z-10"
    : "relative bg-white w-full max-w-[760px] max-h-[96%] rounded-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-300 animate-in zoom-in-95 duration-150 z-10 my-auto";

  return (
    <div 
      className={wrapperClass}
      style={!embedded ? { zIndex: 2147483640 } : undefined}
    >
      {/* Backdrop (Nhấp để đóng) */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog (Khớp chuẩn kích thước video YouGlish, vừa khít khung video không thò ra ngoài) */}
      <div
        className={dialogClass}
        style={
          embedded
            ? {
                position: "absolute",
                top: "6px",
                bottom: "6px",
                left: "8px",
                right: "8px",
                margin: "auto",
                maxWidth: "880px",
                width: "calc(100% - 16px)",
                height: "calc(100% - 12px)",
              }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Từ vựng, IPA, Nghĩa, YouGlish, Nút đóng */}
        <div className="px-2.5 sm:px-4 py-1 sm:py-1.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 shadow-xs border border-red-100/60">
              <Video size={13} className="sm:w-3.5 sm:h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight truncate max-w-[130px] sm:max-w-xs">
                  {cleanWord}
                </h3>
                <button
                  onClick={() => speakVocab(cleanWord, "us")}
                  className="p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors shrink-0"
                  title="Nghe phát âm"
                >
                  <Volume2 size={13} className="sm:w-3.5 sm:h-3.5" />
                </button>
                {ipa && (
                  <span className="text-orange-500 font-bold text-[10px] sm:text-xs italic shrink-0">
                    /{ipa.replace(/\//g, "")}/
                  </span>
                )}
              </div>
              {mean && (
                <p className="text-slate-500 text-[9px] sm:text-[11px] truncate max-w-[160px] sm:max-w-md font-medium">
                  {mean}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <a
              href={youglishExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 sm:px-2.5 sm:py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md sm:rounded-lg transition-all text-[10px] sm:text-xs font-bold flex items-center gap-1"
              title="Mở trên YouGlish.com"
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">YouGlish</span>
            </a>
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 hover:bg-rose-500 hover:text-white active:bg-rose-600 text-slate-600 rounded-md sm:rounded-lg flex items-center justify-center transition-all shadow-xs cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={15} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Accent Selector Bar: Nút chọn giọng Mỹ, Anh, Úc */}
        <div className="px-2 sm:px-4 py-0.5 sm:py-1 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-1 flex-wrap shrink-0">
          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200/60 shadow-xs text-[9.5px] sm:text-xs">
            <button
              onClick={() => setAccent("all")}
              className={`px-1.5 sm:px-2 py-0.5 rounded font-bold transition-all ${
                accent === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setAccent("us")}
              className={`px-1.5 sm:px-2 py-0.5 rounded font-bold transition-all ${
                accent === "us"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇺🇸 Mỹ
            </button>
            <button
              onClick={() => setAccent("uk")}
              className={`px-1.5 sm:px-2 py-0.5 rounded font-bold transition-all ${
                accent === "uk"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇬🇧 Anh
            </button>
            <button
              onClick={() => setAccent("aus")}
              className={`px-1.5 sm:px-2 py-0.5 rounded font-bold transition-all ${
                accent === "aus"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇦🇺 Úc
            </button>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-[9.5px] sm:text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 font-bold transition-colors px-1"
            title="Tải lại video"
          >
            <RefreshCw size={10} />
            <span>Tải lại</span>
          </button>
        </div>

        {/* Video Area (Chiếm trọn chiều cao còn lại, cuộn mượt khi màn hình nhỏ) */}
        <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-start bg-slate-50 overflow-y-auto no-scrollbar">
          <YouGlishPlayer
            word={cleanWord}
            accent={accent}
            refreshKey={refreshKey}
            isOpen={isOpen}
          />
        </div>

        {/* Footer Info */}
        <div className="px-2.5 sm:px-4 py-0.5 sm:py-1 bg-white border-t border-slate-100 text-center text-[9px] sm:text-[10px] text-slate-400 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1 truncate text-slate-500">
            💡 <span className="truncate">Dùng các nút trên video để tua câu</span>
          </span>
          <button
            onClick={onClose}
            className="sm:hidden px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[9px] active:bg-slate-200"
          >
            Đóng ✕
          </button>
          <span className="hidden sm:inline font-semibold text-slate-300">Powered by YouGlish</span>
        </div>
      </div>
    </div>
  );
}
