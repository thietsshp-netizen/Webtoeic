"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Award, ZoomIn, X, ShieldCheck } from "lucide-react";

interface StudentScoreImage {
  id: string;
  url: string;
}

interface StudentScoreShowcaseProps {
  images: StudentScoreImage[];
}

export default function StudentScoreShowcase({ images }: StudentScoreShowcaseProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = images.length;
  const currentImg = images[activeIdx] || images[0];

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % total);
    }, 5000);
  }, [total]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const handleSelect = (idx: number) => {
    setActiveIdx(idx);
    resetTimer();
  };

  // Close modal on ESC & Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isZoomOpen) return;
      if (e.key === "Escape") setIsZoomOpen(false);
      if (e.key === "ArrowLeft") handleSelect((activeIdx - 1 + total) % total);
      if (e.key === "ArrowRight") handleSelect((activeIdx + 1) % total);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen, activeIdx, total]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[1.8/1] sm:aspect-[1.95/1] bg-slate-100 animate-pulse rounded-2xl sm:rounded-3xl flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
          <Award size={24} className="animate-spin text-emerald-500" />
          <span>Đang tải bảng điểm học viên...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 select-none">
      {/* Main Showcase Frame (Khung viền vàng kim bo tròn chuẩn mẫu) */}
      <div
        className="relative group max-w-3xl sm:max-w-4xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-2 border-amber-400 bg-white p-1.5 sm:p-2.5 shadow-sm cursor-zoom-in"
        onClick={() => setIsZoomOpen(true)}
        onMouseEnter={() => {
          if (timerRef.current) clearInterval(timerRef.current);
        }}
        onMouseLeave={() => resetTimer()}
      >
        <div className="relative w-full aspect-[1.35/1] sm:aspect-[1.55/1] md:aspect-[1.65/1] bg-white rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center overflow-hidden">
          {images.map((img, idx) => {
            const isCurrent = idx === activeIdx;
            const isLoaded = loadedImages[idx];

            return (
              <div
                key={img.id || idx}
                className={`absolute inset-0 w-full h-full p-1 sm:p-2.5 flex items-center justify-center transition-all duration-700 ${
                  isCurrent ? "opacity-100 scale-100 z-10 pointer-events-auto" : "opacity-0 scale-98 z-0 pointer-events-none"
                }`}
              >
                {/* Loading skeleton */}
                {!isLoaded && (
                  <div className="absolute inset-2 bg-slate-200 animate-pulse rounded-2xl flex items-center justify-center">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                      <Award size={20} className="animate-spin text-emerald-500" />
                      <span>Đang tải bảng điểm {idx + 1}...</span>
                    </div>
                  </div>
                )}

                {/* Real Certificate / Feedback Image */}
                <img
                  src={img.url}
                  alt={`Bảng điểm học viên ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  onLoad={() => setLoadedImages((prev) => ({ ...prev, [idx]: true }))}
                  className={`w-full h-full object-contain rounded-xl sm:rounded-2xl transition-transform duration-500 group-hover:scale-[1.015] shadow-sm ${
                    isLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            );
          })}

          {/* Navigation Arrows */}
          {total > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect((activeIdx - 1 + total) % total);
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 text-white hover:bg-black/75 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-lg cursor-pointer"
                title="Xem ảnh trước"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect((activeIdx + 1) % total);
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 text-white hover:bg-black/75 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-lg cursor-pointer"
                title="Xem ảnh tiếp theo"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Hover Hint Overlay (Nền trong suốt không che chữ) */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
            <span className="px-3.5 py-1.5 bg-black/30 backdrop-blur-md text-white/95 text-xs font-bold rounded-full border border-white/20 shadow-md flex items-center gap-1.5">
              <ZoomIn size={14} /> Click để phóng to xem chi tiết
            </span>
          </div>

          {/* Bottom Counter Badge */}
          {total > 1 && (
            <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-[11px] font-bold tracking-wider flex items-center gap-1.5">
              <span>{activeIdx + 1}</span>
              <span className="text-white/50">/</span>
              <span>{total}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Zoom Lightbox Modal */}
      {isZoomOpen && currentImg && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Top Bar of Modal */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <ShieldCheck size={20} className="text-emerald-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Bảng Vàng Học Viên hoctoeic.com ({activeIdx + 1}/{total})</h3>
                <p className="text-[10px] sm:text-xs text-slate-400">Kết quả & Feedback thực tế từ học viên</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {total > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSelect((activeIdx - 1 + total) % total)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                    title="Trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => handleSelect((activeIdx + 1) % total)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                    title="Sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsZoomOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2 cursor-pointer"
                title="Đóng (ESC)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* High Resolution Image Container */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImg.url}
              alt={`Bảng điểm học viên phóng to ${activeIdx + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />

            {/* Navigation Arrows inside Fullscreen Lightbox Modal */}
            {total > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect((activeIdx - 1 + total) % total);
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-emerald-600 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-95 shadow-lg border border-white/20 hover:border-white/40 cursor-pointer"
                  title="Xem bảng điểm trước (Mũi tên trái)"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect((activeIdx + 1) % total);
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-emerald-600 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-95 shadow-lg border border-white/20 hover:border-white/40 cursor-pointer"
                  title="Xem bảng điểm tiếp theo (Mũi tên phải)"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
