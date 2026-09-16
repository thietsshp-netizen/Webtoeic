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
  Loader2,
} from "lucide-react";
import { FeatureVideoItem, getDefaultFeatureVideos, extractYoutubeId } from "@/data/featureVideos";

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
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
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
  const playlistScrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn tab video đang chọn vào giữa màn hình khi chuyển video
  useEffect(() => {
    if (!playlistScrollRef.current) return;
    const activeEl = playlistScrollRef.current.querySelector<HTMLElement>(`[data-video-idx="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeIndex]);

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
      setHasStartedPlayback(true);
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
    <section className="mt-10 sm:mt-16 md:mt-20 mb-8 sm:mb-16 md:mb-20 relative overflow-hidden lg:overflow-visible max-w-5xl mx-auto px-1 sm:px-4">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[650px] lg:w-[850px] h-[320px] sm:h-[450px] lg:h-[550px] blur-[110px] sm:blur-[140px] -z-10 rounded-full transition-colors duration-1000 opacity-40 sm:opacity-50 pointer-events-none"
        style={{ backgroundColor: currentTheme.glow }}
      />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 px-2">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4 border border-blue-100 shadow-sm">
          <Sparkles size={16} fill="currentColor" /> WEB LUYỆN THI TOEIC ĐỘC QUYỀN
        </div>
        <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-tight mb-3">
          Khám Phá Các Tính Năng Của Web Luyện Thi TOEIC{" "}
          <span className="text-blue-600">
            Thông Minh Hàng Đầu
          </span>
        </h2>
        <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full mb-4"></div>
        <p className="text-sm sm:text-lg md:text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
          Xem video giới thiệu các tính năng độc đáo, nổi bật được tích hợp trên web luyện thi TOEIC của Mr. Thiệt.
        </p>
      </div>

      {/* Single-Column Showcase Card */}
      <div className="bg-white rounded-3xl sm:rounded-[3rem] md:rounded-[4rem] p-3 sm:p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col gap-3 sm:gap-5 text-left">

        {/* 1. Main Cinema Video Player (Khung viền vàng kim ôm sát 100% video) */}
        <div
          className="relative aspect-[16/10] w-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-slate-950 border-2 border-amber-400 shadow-sm group select-none flex-shrink-0"
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
          {(() => {
            const ytId =
              currentVideo?.youtubeId ||
              (currentVideo?.videoUrl ? extractYoutubeId(currentVideo.videoUrl) : null);

            if (ytId) {
              if (!hasStartedPlayback) {
                const posterUrl =
                  currentVideo?.thumbnail ||
                  `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;

                return (
                  <div
                    className="relative w-full h-full cursor-pointer group/poster bg-slate-950"
                    onClick={() => setHasStartedPlayback(true)}
                  >
                    <img
                      src={posterUrl}
                      alt={currentVideo?.title || "Video tính năng"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-11 sm:w-18 sm:h-12 bg-[#ff0000] hover:bg-red-700 text-white rounded-2xl flex items-center justify-center shadow-2xl group-hover/poster:scale-110 transition-all duration-300">
                        <Play size={24} className="fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <iframe
                  key={`yt-${ytId}`}
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&vq=hd1080&hd=1`}
                  title={currentVideo?.title || "Video tính năng"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0 block"
                />
              );
            }

            return (
              <>
                {/* Video Element */}
                <video
                  ref={videoRef}
                  src={currentVideo?.videoUrl}
                  poster={currentVideo?.thumbnail || `/images/feature-videos/video-thumb-${currentVideo?.order}.jpg`}
                  playsInline
                  preload="auto"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover cursor-pointer"
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
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false);
                    setShowControls(true);
                  }}
                />

                {/* Big Center Play Button Overlay */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600/90 text-white flex items-center justify-center backdrop-blur-md shadow-2xl hover:scale-110 hover:bg-blue-600 transition-all duration-300 group/btn"
                    title="Phát video"
                  >
                    <Play size={30} className="fill-white ml-1 group-hover/btn:scale-105 transition-transform" />
                  </button>
                )}

                {/* Buffering Spinner */}
                {isBuffering && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <Loader2 size={36} className="text-white animate-spin" />
                  </div>
                )}

                {/* Custom Cinema Control Bar */}
                <div
                  className={`absolute bottom-0 left-0 right-0 pt-6 pb-1.5 sm:pb-2.5 px-2 sm:px-3.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent transition-opacity duration-300 ${
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
              </>
            );
          })()}
        </div>

        {/* 2. Feature Playlist / Horizontal Scroll Rail (Thước chọn video) */}
        <div className="bg-slate-50/80 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 border border-slate-200/80">
          <div className="flex items-center justify-between gap-2 mb-2 px-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700 truncate">
                Chọn video tính năng <span className="text-slate-400 font-normal">({videos.length})</span>:
              </span>
            </div>

            {/* Quick Prev / Next navigation buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleSelectVideo((activeIndex - 1 + videos.length) % videos.length)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-blue-600 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold border border-slate-200 shadow-sm transition-all active:scale-95"
                title="Xem video trước"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Trước</span>
              </button>

              <button
                onClick={() => handleSelectVideo((activeIndex + 1) % videos.length)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
                title="Xem video kế tiếp"
              >
                <span className="hidden sm:inline">Tiếp</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Rail */}
          <div
            ref={playlistScrollRef}
            className="flex items-stretch gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5 touch-pan-x"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {videos.map((vid, idx) => {
              const isActive = idx === activeIndex;
              const cardTheme = COLOR_MAP[vid.color || "blue"] || COLOR_MAP.blue;

              return (
                <button
                  key={vid.id || idx}
                  data-video-idx={idx}
                  onClick={() => handleSelectVideo(idx)}
                  className={`group relative flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-left transition-all duration-200 active:scale-[0.98] shrink-0 snap-start min-w-[185px] sm:min-w-[210px] md:min-w-[225px] ${
                    isActive
                      ? `bg-white text-slate-900 shadow-md shadow-blue-500/10 border-2 ${cardTheme.border} ring-2 ring-blue-500/20`
                      : "bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? `${cardTheme.bg} text-white shadow-xs`
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}
                  >
                    {getIconForIndex(vid.order)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[9px] sm:text-[10px] font-black tracking-wider uppercase ${
                        isActive ? cardTheme.text : "text-slate-400"
                      }`}>
                        Video 0{vid.order}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase text-red-500 bg-red-50 px-1 py-0.2 rounded border border-red-200 shrink-0">
                          <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                          Đang phát
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-bold truncate mt-0.5 ${
                      isActive ? "text-slate-900" : "text-slate-700"
                    }`}>
                      {getShortTitleForIndex(vid.order)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Điểm nhấn tính năng video đang xem (Gợi ý 2: Tinh gọn, rõ ràng, không cuộn) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVideo?.id || activeIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left"
          >
            <div className="flex items-center justify-center gap-2 mb-2.5 text-center">
              <Sparkles size={14} className="text-amber-500 fill-amber-500 shrink-0" />
              <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">
                Tóm tắt điểm nhấn trong video {currentVideo?.order}
              </span>
            </div>

            {currentVideo?.highlights && currentVideo.highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {currentVideo.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center sm:items-start justify-center sm:justify-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 text-center sm:text-left shadow-2xs"
                  >
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 sm:mt-0.5" />
                    <span className="text-xs sm:text-[13px] font-semibold text-slate-700 leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* 4 Con số thống kê thành tích */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mt-10 sm:mt-14 border-t border-slate-200/60 pt-8 sm:pt-10 px-2">
        {[
          { val: "2000+", label: "Học viên tham gia" },
          { val: "95%", label: "Tỉ lệ đạt mục tiêu" },
          { val: "13000+", label: "Bài tập thực hành" },
          { val: "24/7", label: "Hỗ trợ học tập" }
        ].map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">{stat.val}</div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
