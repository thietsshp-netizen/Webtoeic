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
          const calcWidth = typeof window !== "undefined" ? Math.min(600, window.innerWidth - 48) : 560;
          const widget = new window.YG.Widget(uniqueId, {
            width: calcWidth,
            components: 255, // Full components: Video + Captions + All Navigation Buttons (Prev, Next, Replay, -5s) + Speed
            autoStart: 1,
            backgroundColor: "#ffffff",
            markerColor: "#fde047", // Bright yellow highlight for target word
            captionColor: "#1e293b",
            captionSize: 26,
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
            <div style="padding: 2rem; text-align: center; color: #64748b;">
              <p style="font-weight: bold; margin-bottom: 0.5rem; color: #e11d48;">Không thể tải video YouGlish</p>
              <a href="https://youglish.com/pronounce/${encodeURIComponent(cleanWord)}/english/${accent}/cptc=1" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-size: 0.875rem;">
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
      className="w-full min-h-[420px] sm:min-h-[480px] bg-slate-50 flex items-center justify-center p-1 sm:p-2"
    />
  );
});

export default function YouGlishModal({ isOpen, onClose, word, ipa, mean }: YouGlishModalProps) {
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

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-2 sm:p-4 transition-all duration-200 ${
        isOpen ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"
      }`}
      style={{ zIndex: 2147483640 }}
    >
      {/* Backdrop (Clear, no blur, click to close) */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative bg-white w-full max-w-2xl max-h-[88vh] sm:max-h-[92vh] rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 z-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Luôn hiển thị trên cùng với z-index cao và nút X to rõ */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 shadow-sm border border-red-100/60">
              <Video size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-black text-slate-800 tracking-tight truncate max-w-[140px] sm:max-w-xs">
                  {cleanWord}
                </h3>
                <button
                  onClick={() => speakVocab(cleanWord, "us")}
                  className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                  title="Nghe phát âm"
                >
                  <Volume2 size={15} />
                </button>
                {ipa && (
                  <span className="text-orange-500 font-bold text-[11px] sm:text-sm italic shrink-0">
                    /{ipa.replace(/\//g, "")}/
                  </span>
                )}
              </div>
              {mean && (
                <p className="text-slate-500 text-[10.5px] sm:text-xs truncate max-w-[180px] sm:max-w-md font-medium">
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
              className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg sm:rounded-xl transition-all text-[11px] sm:text-xs font-bold flex items-center gap-1"
              title="Mở trên YouGlish.com"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">YouGlish</span>
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 hover:bg-rose-500 hover:text-white active:bg-rose-600 text-slate-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shadow-xs cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Accent Selector Bar */}
        <div className="px-2.5 sm:px-6 py-1.5 sm:py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white p-0.5 rounded-lg sm:rounded-xl border border-slate-200/60 shadow-xs text-[10.5px] sm:text-xs">
            <button
              onClick={() => setAccent("all")}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold transition-all ${
                accent === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setAccent("us")}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold transition-all ${
                accent === "us"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇺🇸 Mỹ
            </button>
            <button
              onClick={() => setAccent("uk")}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold transition-all ${
                accent === "uk"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇬🇧 Anh
            </button>
            <button
              onClick={() => setAccent("aus")}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold transition-all ${
                accent === "aus"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇦🇺 Úc
            </button>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-[10px] sm:text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 font-bold transition-colors"
            title="Tải lại video"
          >
            <RefreshCw size={11} />
            <span>Tải lại</span>
          </button>
        </div>

        {/* Video Area (Isolated YouGlish Widget) */}
        <div className="w-full flex-1 min-h-[300px] sm:min-h-[420px] flex items-center justify-center bg-slate-50 overflow-y-auto no-scrollbar">
          <YouGlishPlayer
            word={cleanWord}
            accent={accent}
            refreshKey={refreshKey}
            isOpen={isOpen}
          />
        </div>

        {/* Footer info */}
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border-t border-slate-100 text-center text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1 truncate text-slate-500">
            💡 <span>Dùng các nút trên video để tua câu</span>
          </span>
          <button
            onClick={onClose}
            className="sm:hidden px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] active:bg-slate-200"
          >
            Đóng ✕
          </button>
          <span className="hidden sm:inline font-semibold text-slate-300">Powered by YouGlish</span>
        </div>
      </div>
    </div>
  );
}
