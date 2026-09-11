"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Tv,
  Gamepad2,
  Headphones,
  BarChart3,
  Zap,
  FastForward,
} from "lucide-react";
import { FeatureVideoItem, getDefaultFeatureVideos } from "@/data/featureVideos";

const COLOR_MAP: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    glow: string;
    badgeBg: string;
    gradient: string;
  }
> = {
  blue: {
    bg: "bg-blue-600",
    text: "text-blue-600",
    border: "border-blue-500",
    glow: "rgba(37, 99, 235, 0.25)",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    gradient: "from-blue-600 to-indigo-600",
  },
  emerald: {
    bg: "bg-emerald-600",
    text: "text-emerald-600",
    border: "border-emerald-500",
    glow: "rgba(16, 185, 129, 0.25)",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-600 to-teal-600",
  },
  purple: {
    bg: "bg-purple-600",
    text: "text-purple-600",
    border: "border-purple-500",
    glow: "rgba(147, 51, 234, 0.25)",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    gradient: "from-purple-600 to-pink-600",
  },
  amber: {
    bg: "bg-amber-600",
    text: "text-amber-600",
    border: "border-amber-500",
    glow: "rgba(245, 158, 11, 0.25)",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    gradient: "from-amber-500 to-orange-600",
  },
};

const getIconForIndex = (order: number) => {
  switch (order) {
    case 1:
      return <Gamepad2 className="w-4 h-4" />;
    case 2:
      return <Headphones className="w-4 h-4" />;
    case 3:
      return <BarChart3 className="w-4 h-4" />;
    case 4:
      return <Zap className="w-4 h-4" />;
    default:
      return <Tv className="w-4 h-4" />;
  }
};

const getShortTitleForIndex = (order: number) => {
  switch (order) {
    case 1:
      return "Từ điển & Game";
    case 2:
      return "Nghe từng câu";
    case 3:
      return "Thống kê lỗi sai";
    case 4:
      return "Bí quyết từ vựng";
    default:
      return `Tính năng ${order}`;
  }
};

export default function FeatureVideoShowcase() {
  const [videos, setVideos] = useState<FeatureVideoItem[]>(() => getDefaultFeatureVideos());
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Fetch danh sách video từ API
  useEffect(() => {
    let isMounted = true;
    fetch("/api/marketing/feature-videos")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.videos?.length > 0) {
          setVideos(data.videos);
        }
      })
      .catch((err) => console.error("Error fetching feature videos:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentVideo = videos[activeIndex] || null;
  const currentTheme =
    COLOR_MAP[currentVideo?.color || "blue"] || COLOR_MAP.blue;

  // Tự động ẩn controls sau 2.5s khi video đang chạy (hoạt động chuẩn xác trên cả PC và Mobile)
  const triggerControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlayingRef.current || (videoRef.current && !videoRef.current.paused)) {
        setShowControls(false);
      }
    }, 2500);
  }, []);

  // Xử lý Play / Pause an toàn trên mọi thiết bị
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      setIsBuffering(true);
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          isPlayingRef.current = true;
          setIsBuffering(false);
          triggerControlsTemporarily();
        })
        .catch((e) => {
          console.warn("Play interrupted or autoplay blocked:", e);
          setIsPlaying(false);
          isPlayingRef.current = false;
          setIsBuffering(false);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  }, [triggerControlsTemporarily]);

  // Chuyển video và TỰ ĐỘNG PHÁT NGAY LẬP TỨC
  const handleSelectVideo = useCallback(
    (index: number) => {
      if (index === activeIndex) {
        togglePlay();
        return;
      }
      setActiveIndex(index);
      setCurrentTime(0);
      setIsPlaying(true);
      isPlayingRef.current = true;
      setIsBuffering(true);
      triggerControlsTemporarily();

      if (videoRef.current) {
        const nextUrl = videos[index]?.videoUrl || "";
        videoRef.current.src = nextUrl;
        videoRef.current.load();

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              isPlayingRef.current = true;
              setIsBuffering(false);
              triggerControlsTemporarily();
            })
            .catch((err) => {
              console.log("Autoplay notice:", err);
              setIsPlaying(false);
              isPlayingRef.current = false;
              setIsBuffering(false);
              setShowControls(true);
            });
        }
      }
    },
    [activeIndex, togglePlay, triggerControlsTemporarily, videos]
  );

  // Tự động chuyển sang video kế tiếp khi xem hết
  const handleVideoEnded = useCallback(() => {
    if (videos.length === 0) return;
    const nextIndex = (activeIndex + 1) % videos.length;
    handleSelectVideo(nextIndex);
  }, [activeIndex, handleSelectVideo, videos.length]);

  // Touch Swipe handlers & Tap controls
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) {
      // Tap trên mobile
      if (!(e.target as HTMLElement).closest("button, input")) {
        if (showControls && (isPlayingRef.current || (videoRef.current && !videoRef.current.paused))) {
          setShowControls(false);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        } else {
          triggerControlsTemporarily();
        }
      }
      touchStartX.current = null;
      touchEndX.current = null;
      return;
    }

    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (diffX > minSwipeDistance) {
      // Vuốt sang trái -> Video tiếp theo
      handleSelectVideo((activeIndex + 1) % videos.length);
    } else if (diffX < -minSwipeDistance) {
      // Vuốt sang phải -> Video trước đó
      handleSelectVideo((activeIndex - 1 + videos.length) % videos.length);
    } else {
      // Chạm nhẹ
      if (!(e.target as HTMLElement).closest("button, input")) {
        if (showControls && (isPlayingRef.current || (videoRef.current && !videoRef.current.paused))) {
          setShowControls(false);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        } else {
          triggerControlsTemporarily();
        }
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Xử lý tua video
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Tắt/Mở tiếng
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Thay đổi tốc độ
  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextSpeed =
      speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  // Toàn màn hình
  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if ((videoRef.current as any).webkitRequestFullscreen) {
      (videoRef.current as any).webkitRequestFullscreen();
    }
  };

  // Format time (00:00)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto my-16 bg-slate-50/50 rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-full w-48 mx-auto mb-4"></div>
        <div className="h-10 bg-slate-200 rounded-2xl w-80 mx-auto mb-8"></div>
        <div className="aspect-video bg-slate-200 rounded-[2rem] max-w-4xl mx-auto mb-6"></div>
        <div className="h-14 bg-slate-200 rounded-2xl max-w-md mx-auto"></div>
      </div>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section className="my-6 sm:my-16 md:my-20 relative overflow-hidden lg:overflow-visible max-w-5xl mx-auto px-1 sm:px-4">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[650px] lg:w-[850px] h-[320px] sm:h-[450px] lg:h-[550px] blur-[110px] sm:blur-[140px] -z-10 rounded-full transition-colors duration-1000 opacity-40 sm:opacity-50 pointer-events-none"
        style={{ backgroundColor: currentTheme.glow }}
      />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 px-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 text-blue-700 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-3 sm:mb-4 border border-blue-100/70 shadow-sm">
          <Sparkles size={13} className="text-blue-600 flex-shrink-0" />
          <span>WEB LUYỆN THI TOEIC ĐỘC QUYỀN</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-snug sm:leading-normal uppercase italic mb-3 sm:mb-4">
          Khám Phá Các Tính Năng Của Web Luyện Thi TOEIC{" "}
          <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 pt-2.5 pb-2 pl-1 pr-6 leading-normal">
            Thông Minh Hàng Đầu
          </span>
        </h2>
        <p className="text-slate-500 font-medium text-xs sm:text-sm md:text-base leading-relaxed px-2">
          Xem video giới thiệu các tính năng độc đáo, nổi bật được tích hợp trên web luyện thi Toeic của Mr. Thiệt.
        </p>
      </div>

      {/* Single-Column Showcase Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] p-1.5 sm:p-6 md:p-8 border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)] flex flex-col gap-3 sm:gap-6">

        {/* 1. Main Cinema Video Player */}
        <div
          className="relative aspect-video rounded-xl sm:rounded-[2rem] md:rounded-[2.25rem] overflow-hidden bg-slate-950 border border-slate-900 sm:border-4 shadow-2xl group select-none flex-shrink-0 w-full"
          onMouseEnter={() => triggerControlsTemporarily()}
          onMouseMove={() => triggerControlsTemporarily()}
          onMouseLeave={() => {
            if (videoRef.current && !videoRef.current.paused) {
              setShowControls(false);
              if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={currentVideo?.videoUrl}
            poster={currentVideo?.thumbnail || `/images/feature-videos/video-thumb-${currentVideo?.order}.jpg`}
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                videoRef.current.playbackRate = playbackSpeed;
              }
            }}
            onWaiting={() => setIsBuffering(true)}
            onCanPlay={() => setIsBuffering(false)}
            onPlaying={() => {
              setIsBuffering(false);
              setIsPlaying(true);
              triggerControlsTemporarily();
            }}
            onPause={() => {
              setIsPlaying(false);
              setShowControls(true);
            }}
            onEnded={handleVideoEnded}
          />

          {/* Big Center Play / Pause Indicator on Hover / Paused */}
          <AnimatePresence>
            {(!isPlaying || isBuffering) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="absolute inset-0 flex items-center justify-center bg-transparent cursor-pointer"
                onClick={togglePlay}
              >
                {isBuffering ? (
                  <div className="w-10 sm:w-16 h-10 sm:h-16 border-3 sm:border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !isPlaying ? (
                  <div className="relative group/btn">
                    <div
                      className="absolute -inset-3 sm:-inset-4 rounded-full blur-xl opacity-75 group-hover/btn:opacity-100 transition duration-500"
                      style={{ backgroundColor: currentTheme.glow }}
                    />
                    <div className="relative w-12 h-12 sm:w-20 sm:h-20 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-2xl transform group-hover/btn:scale-110 active:scale-95 transition-all duration-300">
                      <Play size={20} className="ml-0.5 sm:ml-1 fill-slate-900 text-slate-900 sm:w-6 sm:h-6" />
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Bar Header on Video */}
          <div
            className={`absolute top-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-b from-black/70 via-black/20 to-transparent flex items-center justify-between text-white pointer-events-none transition-opacity duration-300 ${
              showControls || !isPlaying ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-200 truncate max-w-[170px] sm:max-w-none">
                Video #{currentVideo?.order} • {currentVideo?.category}
              </span>
            </div>
            <span className="text-[9px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/20 backdrop-blur-md rounded-md sm:rounded-lg text-white">
              {currentVideo?.badge}
            </span>
          </div>

          {/* Custom Control Bar (Bottom) - Sleek, Thin & Auto-hiding */}
          <div
            className={`absolute bottom-0 left-0 right-0 pt-6 pb-1 sm:pb-3 px-2 sm:px-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
              showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Scrubber Progress Bar */}
            <div className="relative mb-1 sm:mb-2.5 flex items-center group/progress">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 sm:h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 sm:hover:h-2.5 transition-all"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white text-[10px] sm:text-xs">
              {/* Left: Play/Pause, Replay, Time */}
              <div className="flex items-center gap-1 sm:gap-2.5">
                <button
                  onClick={togglePlay}
                  className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title={isPlaying ? "Tạm dừng" : "Phát video"}
                >
                  {isPlaying ? (
                    <Pause size={14} className="sm:w-[17px] sm:h-[17px]" />
                  ) : (
                    <Play size={14} className="sm:w-[17px] sm:h-[17px] fill-white" />
                  )}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      setCurrentTime(0);
                    }
                  }}
                  className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-colors text-slate-300 hover:text-white"
                  title="Xem lại từ đầu"
                >
                  <RotateCcw size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>

                <div className="font-mono text-[9px] sm:text-[11px] text-slate-300 select-none">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Right: Speed, Mute, Fullscreen */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={handleSpeedChange}
                  className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/10 hover:bg-white/20 rounded-md sm:rounded-lg transition-colors text-[9px] sm:text-[11px] font-bold text-slate-200"
                  title="Tốc độ phát"
                >
                  {playbackSpeed}x
                </button>

                <button
                  onClick={toggleMute}
                  className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-colors text-slate-200 hover:text-white"
                  title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {isMuted ? (
                    <VolumeX size={14} className="sm:w-[17px] sm:h-[17px]" />
                  ) : (
                    <Volume2 size={14} className="sm:w-[17px] sm:h-[17px]" />
                  )}
                </button>

                <button
                  onClick={handleFullscreen}
                  className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-colors text-slate-200 hover:text-white"
                  title="Toàn màn hình"
                >
                  <Maximize2 size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Compact Navigation Bar (Placed DIRECTLY under video) */}
        <div className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-slate-50/90 rounded-2xl sm:rounded-[1.75rem] border border-slate-100">

          {/* Nút Video Trước */}
          <button
            onClick={() => handleSelectVideo((activeIndex - 1 + videos.length) % videos.length)}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-white text-slate-700 hover:text-blue-600 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all active:scale-95 flex-shrink-0"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Video trước</span>
            <span className="sm:hidden">Trước</span>
          </button>

          {/* Quick Select Buttons / Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 px-1">
            {videos.map((vid, idx) => {
              const isActive = idx === activeIndex;
              const cardTheme = COLOR_MAP[vid.color || "blue"] || COLOR_MAP.blue;

              return (
                <button
                  key={vid.id || idx}
                  onClick={() => handleSelectVideo(idx)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${isActive
                      ? `${cardTheme.bg} text-white shadow-md shadow-blue-500/20`
                      : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                >
                  <span className="flex-shrink-0">{getIconForIndex(vid.order)}</span>
                  <span className="hidden md:inline">{getShortTitleForIndex(vid.order)}</span>
                  <span className="md:hidden">#{vid.order}</span>
                </button>
              );
            })}
          </div>

          {/* Nút Video Tiếp */}
          <button
            onClick={() => handleSelectVideo((activeIndex + 1) % videos.length)}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 flex-shrink-0"
          >
            <span className="hidden sm:inline">Video tiếp</span>
            <span className="sm:hidden">Tiếp</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 3. Detailed Feature Information Card */}
        <div className="bg-slate-50/90 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-slate-100">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${currentTheme.badgeBg}`}>
              {currentVideo?.badge}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Video {currentVideo?.order} / {videos.length} • Vuốt trên video để chuyển nhanh
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-1.5">
            {currentVideo?.title}
          </h3>

          {currentVideo?.subtitle && (
            <p className="text-xs sm:text-sm font-bold text-slate-600 mb-3 sm:mb-4 italic">
              {currentVideo.subtitle}
            </p>
          )}

          <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed mb-5 font-medium">
            {currentVideo?.description}
          </p>

          {/* Highlights Bullet List */}
          {currentVideo?.highlights && currentVideo.highlights.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3.5 pt-4 border-t border-slate-200/70">
              {currentVideo.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                  <CheckCircle2 size={16} className={`flex-shrink-0 mt-0.5 ${currentTheme.text}`} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
