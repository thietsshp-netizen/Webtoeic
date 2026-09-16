"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Award, ZoomIn, X, ShieldCheck } from "lucide-react";

const CERTIFICATES = [
  {
    id: "cert-2023",
    year: "2023",
    score: "990/990",
    listening: "495",
    reading: "495",
    title: "Chứng chỉ TOEIC 990/990 - Năm 2023",
    date: "03/03/2023",
    badge: "Official ETS 2023",
    accentColor: "from-blue-600 to-indigo-600",
    url: "https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/marketing/teacher-info/teacher2.webp",
    alt: "Chứng chỉ TOEIC 990/990 Phạm Văn Thiệt - Năm 2023",
  },
  {
    id: "cert-2018",
    year: "2018",
    score: "990/990",
    listening: "495",
    reading: "495",
    title: "Chứng chỉ TOEIC 990/990 - Năm 2018",
    date: "2018",
    badge: "Official ETS 2018",
    accentColor: "from-emerald-600 to-teal-600",
    url: "https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/marketing/teacher-info/teacher1.webp",
    alt: "Chứng chỉ TOEIC 990/990 Phạm Văn Thiệt - Năm 2018",
  },
];

export default function TeacherCertificateShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentCert = CERTIFICATES[activeIdx];

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % CERTIFICATES.length);
    }, 6000);
  }, []);

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
      if (e.key === "ArrowLeft") handleSelect((activeIdx - 1 + CERTIFICATES.length) % CERTIFICATES.length);
      if (e.key === "ArrowRight") handleSelect((activeIdx + 1) % CERTIFICATES.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen, activeIdx]);

  return (
    <div className="w-full space-y-4 select-none">
      {/* Main Certificate Frame (Khung viền vàng kim bo tròn chuẩn mẫu) */}
      <div
        className="relative group max-w-3xl sm:max-w-4xl mx-auto rounded-[1.8rem] sm:rounded-[2.2rem] overflow-hidden border-2 border-amber-400 bg-white p-1 sm:p-1.5 shadow-sm cursor-zoom-in"
        onClick={() => setIsZoomOpen(true)}
        onMouseEnter={() => {
          if (timerRef.current) clearInterval(timerRef.current);
        }}
        onMouseLeave={() => resetTimer()}
      >
        <div className="relative w-full aspect-[1.45/1] bg-white rounded-[1.4rem] sm:rounded-[1.8rem] flex items-center justify-center overflow-hidden">
          {CERTIFICATES.map((cert, idx) => {
            const isCurrent = idx === activeIdx;
            const isLoaded = loadedImages[idx];

            return (
              <div
                key={cert.id}
                className={`absolute inset-0 w-full h-full p-0.5 sm:p-1 flex items-center justify-center transition-all duration-700 ${
                  isCurrent ? "opacity-100 scale-100 z-10 pointer-events-auto" : "opacity-0 scale-98 z-0 pointer-events-none"
                }`}
              >
                {/* Loading skeleton */}
                {!isLoaded && (
                  <div className="absolute inset-2 bg-slate-200 animate-pulse rounded-2xl flex items-center justify-center">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                      <Award size={20} className="animate-spin text-blue-500" />
                      <span>Đang tải chứng chỉ gốc {cert.year}...</span>
                    </div>
                  </div>
                )}

                {/* Real Certificate Image */}
                <img
                  src={cert.url}
                  alt={cert.alt}
                  loading="eager"
                  decoding="async"
                  onLoad={() => setLoadedImages((prev) => ({ ...prev, [idx]: true }))}
                  className={`w-full h-full object-contain rounded-lg sm:rounded-xl transition-transform duration-500 group-hover:scale-[1.015] shadow-sm ${
                    isLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            );
          })}

          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelect((activeIdx - 1 + CERTIFICATES.length) % CERTIFICATES.length);
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 text-white hover:bg-black/75 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-lg cursor-pointer"
            title="Xem bằng trước"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelect((activeIdx + 1) % CERTIFICATES.length);
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 text-white hover:bg-black/75 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-lg cursor-pointer"
            title="Xem bằng tiếp theo"
          >
            <ChevronRight size={20} />
          </button>

          {/* Hover Hint Overlay (Nền trong suốt không che chữ) */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
            <span className="px-3.5 py-1.5 bg-black/30 backdrop-blur-md text-white/95 text-xs font-bold rounded-full border border-white/20 shadow-md flex items-center gap-1.5">
              <ZoomIn size={14} /> Click để phóng to toàn màn hình
            </span>
          </div>
        </div>
      </div>

      {/* 3. Fullscreen Zoom Lightbox Modal */}
      {isZoomOpen && (
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
                <h3 className="text-sm sm:text-base font-bold text-white">{currentCert.title}</h3>
                <p className="text-[10px] sm:text-xs text-slate-400">Khảo thí bởi IIG Vietnam • Đại diện ETS Hoa Kỳ</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                {CERTIFICATES.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(i)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      i === activeIdx ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {c.year}
                  </button>
                ))}
              </div>

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
              src={currentCert.url}
              alt={currentCert.alt}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />

            {/* Navigation Arrows inside Fullscreen Lightbox Modal */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelect((activeIdx - 1 + CERTIFICATES.length) % CERTIFICATES.length);
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-blue-600 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-95 shadow-lg border border-white/20 hover:border-white/40 cursor-pointer"
              title="Xem bằng trước (Mũi tên trái)"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelect((activeIdx + 1) % CERTIFICATES.length);
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-blue-600 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-95 shadow-lg border border-white/20 hover:border-white/40 cursor-pointer"
              title="Xem bằng tiếp theo (Mũi tên phải)"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

