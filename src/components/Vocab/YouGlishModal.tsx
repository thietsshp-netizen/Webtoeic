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
  refreshKey
}: {
  word: string;
  accent: Accent;
  refreshKey: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container || !word) return;

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
            components: 255, // Full components including Subtitles/Captions (bit 8) with yellow highlight, Controls (bit 16), Speed (bit 32)
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
          widget.fetch(word.trim(), "english", accent === "all" ? undefined : accent);
        }
      } catch (e) {
        console.error("Failed to load YouGlish widget", e);
        if (isMounted && container) {
          container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #64748b;">
              <p style="font-weight: bold; margin-bottom: 0.5rem;">Không thể tải video YouGlish</p>
              <a href="https://youglish.com/pronounce/${encodeURIComponent(word)}/english/${accent}/cptc=1" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-size: 0.875rem;">
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
      widgetRef.current = null;
      if (container) {
        container.innerHTML = "";
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

  if (!isOpen || !word) return null;

  const accentPath = accent === "all" ? "all" : accent;
  const youglishExternalUrl = `https://youglish.com/pronounce/${encodeURIComponent(word.trim())}/english/${accentPath}/cptc=1`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop (Clear, no blur) */}
      <div
        className="absolute inset-0 bg-slate-900/20 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative bg-white w-full max-w-2xl max-h-[95vh] rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 shadow-sm border border-red-100/60">
              <Video size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                  {word}
                </h3>
                <button
                  onClick={() => speakVocab(word, "us")}
                  className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 size={16} />
                </button>
                {ipa && (
                  <span className="text-orange-500 font-bold text-xs sm:text-sm italic">
                    /{ipa.replace(/\//g, "")}/
                  </span>
                )}
              </div>
              {mean && (
                <p className="text-slate-500 text-xs truncate max-w-xs sm:max-w-md font-medium">
                  {mean}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={youglishExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all text-xs font-bold flex items-center gap-1"
              title="Mở trên YouGlish.com"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">YouGlish</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-xl transition-all"
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Accent Selector Bar */}
        <div className="px-3.5 sm:px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200/60 shadow-sm text-xs">
            <button
              onClick={() => setAccent("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                accent === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setAccent("us")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                accent === "us"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇺🇸 Mỹ (US)
            </button>
            <button
              onClick={() => setAccent("uk")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                accent === "uk"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇬🇧 Anh (UK)
            </button>
            <button
              onClick={() => setAccent("aus")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                accent === "aus"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇦🇺 Úc (AUS)
            </button>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 font-bold transition-colors"
            title="Tải lại video"
          >
            <RefreshCw size={11} />
            <span>Tải lại</span>
          </button>
        </div>

        {/* Video Area (Isolated YouGlish Widget) */}
        <div className="w-full flex-1 min-h-[380px] sm:min-h-[440px] flex items-center justify-center bg-slate-50">
          <YouGlishPlayer
            word={word}
            accent={accent}
            refreshKey={refreshKey}
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 text-center text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            💡 <span>Dùng các nút trên video để tua câu tiếp theo / trước đó</span>
          </span>
          <span className="font-semibold text-slate-300">Powered by YouGlish</span>
        </div>
      </div>
    </div>
  );
}
