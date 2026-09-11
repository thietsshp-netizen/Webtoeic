import React from "react";

export default function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] font-sans selection:bg-blue-100 selection:text-blue-900 animate-pulse">
      {/* 1. TOP NAVBAR SKELETON */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="h-5 w-24 bg-slate-900/80 rounded-md mb-1" />
              <div className="h-2 w-28 bg-blue-500/60 rounded" />
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <div className="flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-100">
            <div className="h-8 w-20 sm:w-24 bg-white rounded-xl shadow-xs" />
            <div className="h-8 w-20 sm:w-24 bg-transparent rounded-xl" />
            <div className="h-8 w-20 sm:w-24 bg-transparent rounded-xl" />
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <div className="h-10 w-28 bg-slate-100 rounded-xl" />
            <div className="h-10 w-32 bg-blue-600/80 rounded-xl" />
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION SKELETON */}
      <section className="pt-28 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <div className="h-3.5 w-48 bg-blue-300 rounded" />
          </div>

          {/* Heading Lines */}
          <div className="space-y-3 pt-2">
            <div className="h-9 sm:h-12 md:h-14 w-4/5 max-w-2xl bg-slate-800/90 rounded-2xl mx-auto" />
            <div className="h-9 sm:h-12 md:h-14 w-3/5 max-w-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 rounded-2xl mx-auto opacity-90" />
          </div>

          {/* Subtitle Description */}
          <div className="space-y-2 max-w-2xl mx-auto pt-2">
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded mx-auto" />
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <div className="h-14 w-full sm:w-56 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200" />
            <div className="h-14 w-full sm:w-56 bg-slate-100 border border-slate-200 rounded-2xl" />
          </div>
        </div>

        {/* 3. CINEMA VIDEO SHOWCASE SKELETON */}
        <div className="mt-14 max-w-5xl mx-auto">
          {/* Player Shell */}
          <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl bg-slate-900/95 overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
            {/* Ambient Lighting Glow */}
            <div className="absolute inset-0 bg-radial from-blue-600/20 via-indigo-500/10 to-transparent blur-2xl" />
            
            {/* Center Play Button Pulse */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* Bottom Progress Bar Simulation */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
              <div className="h-full w-1/3 bg-blue-500" />
            </div>
          </div>

          {/* Compact Navigation Bar Skeleton */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800">
            <div className="h-8 w-24 bg-slate-800 rounded-xl" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600/80 rounded-xl" />
              <div className="h-8 w-8 bg-slate-800 rounded-xl" />
              <div className="h-8 w-8 bg-slate-800 rounded-xl" />
              <div className="h-8 w-8 bg-slate-800 rounded-xl" />
            </div>
            <div className="h-8 w-24 bg-slate-800 rounded-xl" />
          </div>

          {/* Video Description Card Skeleton */}
          <div className="mt-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-28 bg-blue-100 rounded-lg" />
              <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="h-4 w-4/5 bg-slate-100 rounded" />
              <div className="h-4 w-4/5 bg-slate-100 rounded" />
            </div>
          </div>
        </div>

        {/* 4. FOUR STATS CARDS SKELETON */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-16 max-w-5xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <div className="h-8 w-24 bg-slate-800/80 rounded-lg" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
