"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Trophy, ChevronLeft, ChevronRight, Award } from "lucide-react";

const CERTIFICATES = [
  {
    id: "cert-2023",
    year: "2023",
    score: "990/990",
    badge: "CERTIFICATE: 2023",
    badgeColor: "bg-emerald-600",
    url: "https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/marketing/teacher-info/teacher2.jpg",
    alt: "Chứng chỉ TOEIC 990/990 Mr. Thiệt - Năm 2023",
  },
  {
    id: "cert-2018",
    year: "2018",
    score: "990/990",
    badge: "CERTIFICATE: 2018",
    badgeColor: "bg-blue-600",
    url: "https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/marketing/teacher-info/teacher1.jpg",
    alt: "Chứng chỉ TOEIC 990/990 Mr. Thiệt - Năm 2018",
  },
];

export default function TeacherCertificateShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch Swipe support without blocking vertical page scroll
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % CERTIFICATES.length);
    }, 4500);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diffX = touchStartX.current - touchEndX.current;
    if (diffX > 40) {
      // Swipe left -> Next
      setActiveIdx((prev) => (prev + 1) % CERTIFICATES.length);
      resetTimer();
    } else if (diffX < -40) {
      // Swipe right -> Prev
      setActiveIdx((prev) => (prev - 1 + CERTIFICATES.length) % CERTIFICATES.length);
      resetTimer();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="relative group select-none touch-pan-y"
      onMouseEnter={() => {
        if (timerRef.current) clearInterval(timerRef.current);
      }}
      onMouseLeave={() => resetTimer()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Glow */}
      <div className="absolute -inset-2 sm:-inset-4 bg-yellow-400/15 rounded-[2rem] sm:rounded-[3rem] blur-2xl group-hover:opacity-100 transition duration-1000 pointer-events-none" />

      {/* Main Cinema Box */}
      <div className="relative w-full aspect-video rounded-2xl sm:rounded-[2.5rem] overflow-hidden border-2 sm:border-4 border-white shadow-2xl bg-slate-100 flex items-center justify-center">
        {CERTIFICATES.map((cert, idx) => {
          const isCurrent = idx === activeIdx;
          const isLoaded = loadedImages[idx];

          return (
            <div
              key={cert.id}
              className={`absolute inset-0 w-full h-full p-2 sm:p-4 md:p-6 flex items-center justify-center transition-opacity duration-700 ${
                isCurrent ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Image Loading Skeleton / Placeholder */}
              {!isLoaded && (
                <div className="absolute inset-2 sm:inset-6 bg-slate-200 animate-pulse rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                    <Award size={18} className="animate-spin text-blue-500" />
                    <span>Đang tải chứng chỉ TOEIC 990...</span>
                  </div>
                </div>
              )}

              {/* Certificate Image */}
              <img
                src={cert.url}
                alt={cert.alt}
                loading="eager"
                decoding="async"
                onLoad={() => setLoadedImages((prev) => ({ ...prev, [idx]: true }))}
                className={`w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 ${
                  isLoaded ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Badge Year on Image */}
              <div
                className={`absolute bottom-3 left-3 sm:bottom-4 sm:left-6 ${cert.badgeColor} text-white text-[9px] sm:text-[10px] font-bold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-lg border border-white/20 z-10 flex items-center gap-1.5`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                {cert.badge}
              </div>
            </div>
          );
        })}

        {/* Trophy Floating Icon */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-yellow-400 text-white w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 sm:border-4 border-white shadow-xl rotate-12 group-hover:rotate-0 transition-all duration-500">
          <Trophy size={18} className="sm:w-6 sm:h-6" fill="currentColor" />
        </div>

        {/* Prev / Next Arrows on Hover */}
        <button
          onClick={() => handleSelect((activeIdx - 1 + CERTIFICATES.length) % CERTIFICATES.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 hidden sm:flex items-center justify-center backdrop-blur-sm transition-all active:scale-95"
          title="Bằng trước đó"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => handleSelect((activeIdx + 1) % CERTIFICATES.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 hidden sm:flex items-center justify-center backdrop-blur-sm transition-all active:scale-95"
          title="Bằng tiếp theo"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Pagination Indicator Pills under image */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {CERTIFICATES.map((cert, idx) => {
          const isCurrent = idx === activeIdx;
          return (
            <button
              key={cert.id}
              onClick={() => handleSelect(idx)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
                isCurrent
                  ? "bg-slate-900 text-white shadow-md scale-105"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isCurrent ? "bg-emerald-400" : "bg-slate-400"}`} />
              <span>Năm {cert.year}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
