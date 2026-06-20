"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { X, Minimize2, Maximize2, Move, Tv, Play, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

// ─── Kiểu kích thước ────────────────────────────────────────────────────────
type SizeMode = "pip" | "modal-1" | "modal-2" | "modal-3" | "collapsed";

/** Kích thước cố định mỗi mức (modal-2 ≈ modal-1 × 1.5, modal-3 ≈ modal-2 × 1.5 capped) */
const SIZES: Record<string, { width: number; height: number }> = {
  "pip":     { width: 440, height: 380 },
  "modal-1": { width: 660, height: 520 },
  "modal-2": { width: 990, height: 780 },
  "modal-3": { width: 1200, height: 900 },
};

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Timestamp {
  label: string;
  time: number;
  targetIndex?: number | null;
}

interface FlatTimestamp {
  videoIndex: number;
  stampIndex: number;
  label: string;
  time: number;
  targetIndex?: number | null;
}

interface VideoExplanation {
  title?: string;
  videoUrl: string;
  videoType: "youtube" | "google-drive" | "direct";
  timestamps?: Timestamp[];
}

interface FloatingVideoExplanationPlayerProps {
  videoExplanation: VideoExplanation | VideoExplanation[];
  onClose: () => void;
  onQuestionSync?: (targetIndex: number) => void;
  currentIndex?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function FloatingVideoExplanationPlayer({
  videoExplanation,
  onClose,
  onQuestionSync,
  currentIndex,
}: FloatingVideoExplanationPlayerProps) {
  // Chuẩn hóa thành mảng các video để hỗ trợ tương thích ngược
  const videos: VideoExplanation[] = Array.isArray(videoExplanation)
    ? videoExplanation
    : videoExplanation?.videoUrl
    ? [videoExplanation]
    : [];

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Trích xuất video đang hoạt động
  const currentVideo = videos[activeVideoIndex] || null;
  const videoUrl = currentVideo?.videoUrl || "";
  const videoType = currentVideo?.videoType || "youtube";
  const timestamps = currentVideo?.timestamps || [];

  const [mode, setMode] = useState<SizeMode>("pip");
  const [activeStampIndex, setActiveStampIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [driveTimeParam, setDriveTimeParam] = useState("");
  const [ytStartParam, setYtStartParam] = useState("");
  const pendingDirectSeekRef = useRef<number | null>(null);
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
  const [isResizingActive, setIsResizingActive] = useState(false);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Gộp tất cả timestamps từ tất cả video và sắp xếp theo targetIndex
  const allTimestamps: FlatTimestamp[] = [];
  videos.forEach((video, videoIndex) => {
    (video.timestamps || []).forEach((stamp, stampIndex) => {
      allTimestamps.push({
        videoIndex,
        stampIndex,
        label: stamp.label,
        time: stamp.time,
        targetIndex: stamp.targetIndex,
      });
    });
  });

  allTimestamps.sort((a, b) => {
    const aVal = a.targetIndex ?? 0;
    const bVal = b.targetIndex ?? 0;
    return aVal - bVal;
  });

  // Reset toạ độ kéo khi thay đổi zoom mode hoặc kích thước tùy chỉnh để trở về mặc định
  useEffect(() => {
    dragX.set(0);
    dragY.set(0);
  }, [mode, customSize, dragX, dragY]);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleVideoEnded = () => {
    if (activeVideoIndex < videos.length - 1) {
      setActiveVideoIndex(prev => prev + 1);
      setActiveStampIndex(null);
    }
  };

  // Lắng nghe sự kiện kết thúc từ YouTube embed để tự động chuyển sang video tiếp theo
  useEffect(() => {
    const handleYouTubeMessage = (event: MessageEvent) => {
      if (event.origin.includes("youtube.com")) {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "infoDelivery" && data.info) {
            if (data.info.playerState === 0) {
              handleVideoEnded();
            }
          }
        } catch (e) {}
      }
    };
    window.addEventListener("message", handleYouTubeMessage);
    return () => window.removeEventListener("message", handleYouTubeMessage);
  }, [activeVideoIndex, videos.length]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

  // Nhận diện thiết bị di động
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Resize bằng kéo góc ──
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isResizingRef.current) return;
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const dy = e.clientY - resizeStartRef.current.mouseY;
      setCustomSize({
        width: Math.max(320, resizeStartRef.current.width + dx),
        height: Math.max(260, resizeStartRef.current.height + dy),
      });
    };

    const handlePointerUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsResizingActive(false);
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn framer-motion drag
    const sk = mode === "collapsed" ? "pip" : mode;
    const currentW = customSize?.width ?? (SIZES[sk] || SIZES["pip"]).width;
    const currentH = customSize?.height ?? (SIZES[sk] || SIZES["pip"]).height;
    isResizingRef.current = true;
    setIsResizingActive(true);
    resizeStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, width: currentW, height: currentH };
  };

  // ── Scroll timestamps ──
  const scrollDesktop = (dir: "left" | "right") =>
    desktopScrollRef.current?.scrollBy({ left: dir === "left" ? -150 : 150, behavior: "smooth" });

  const scrollMobile = (dir: "left" | "right") =>
    mobileScrollRef.current?.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getYouTubeId = (url: string) => {
    let videoId = "";
    try {
      if (url.includes("embed/")) videoId = url.split("embed/")[1]?.split("?")[0];
      else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0];
      else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } catch (e) {}
    return videoId;
  };

  const getDriveId = (url: string) => {
    let fileId = "";
    try {
      if (url.includes("/d/")) fileId = url.split("/d/")[1]?.split("/")[0];
      else if (url.includes("id=")) fileId = url.split("id=")[1]?.split("&")[0];
    } catch (e) {}
    return fileId;
  };

  const handleSeek = (seconds: number, stampIndex: number, targetVideoIndex: number, targetIdx?: number | null) => {
    const isSameVideo = targetVideoIndex === activeVideoIndex;
    setActiveStampIndex(stampIndex);

    if (!isSameVideo) {
      setActiveVideoIndex(targetVideoIndex);
      
      const targetVideo = videos[targetVideoIndex];
      const targetVideoType = targetVideo?.videoType || "youtube";
      
      if (targetVideoType === "youtube") {
        setYtStartParam(`&start=${seconds}`);
      } else if (targetVideoType === "google-drive") {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        setDriveTimeParam(`&t=${m}m${s}s`);
      } else if (targetVideoType === "direct") {
        pendingDirectSeekRef.current = seconds;
      }
    } else {
      if (videoType === "youtube") {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }), "*"
          );
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*"
          );
        }
      } else if (videoType === "google-drive") {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        setDriveTimeParam(`&t=${m}m${s}s`);
      } else if (videoType === "direct" && videoRef.current) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play().catch(() => {});
      }
    }

    if (targetIdx !== undefined && targetIdx !== null && onQuestionSync) {
      onQuestionSync(targetIdx);
    }
  };

  // Hỗ trợ tự động tua đối với direct video khi đổi video
  useEffect(() => {
    if (videoType === "direct" && videoRef.current && pendingDirectSeekRef.current !== null) {
      const targetTime = pendingDirectSeekRef.current;
      pendingDirectSeekRef.current = null;
      
      const handleCanPlay = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = targetTime;
          videoRef.current.play().catch(() => {});
          videoRef.current.removeEventListener("canplay", handleCanPlay);
        }
      };
      
      videoRef.current.addEventListener("canplay", handleCanPlay);
    }
  }, [videoUrl, videoType]);

  // Tự động chuyển video và mốc thời gian phù hợp khi câu hỏi hiện tại thay đổi
  useEffect(() => {
    if (currentIndex !== undefined && videos.length > 0) {
      const targetSeqNum = currentIndex + 1;
      for (let vIdx = 0; vIdx < videos.length; vIdx++) {
        const stamps = videos[vIdx].timestamps || [];
        const matchedIdx = stamps.findIndex(stamp => stamp.targetIndex === targetSeqNum);
        if (matchedIdx !== -1) {
          setActiveVideoIndex(vIdx);
          setActiveStampIndex(matchedIdx);
          break;
        }
      }
    }
  }, [currentIndex, videos]);

  // ── Zoom handlers ──
  const handleZoomIn = () => {
    setCustomSize(null);
    if (mode === "pip") setMode("modal-1");
    else if (mode === "modal-1") setMode("modal-2");
    else if (mode === "modal-2") setMode("modal-3");
  };

  const handleZoomOut = () => {
    setCustomSize(null);
    if (mode === "modal-3") setMode("modal-2");
    else if (mode === "modal-2") setMode("modal-1");
    else if (mode === "modal-1") setMode("pip");
  };

  // ── Tính kích thước hiện tại ──
  const isModal = mode === "modal-1" || mode === "modal-2" || mode === "modal-3";
  const modalLevel = mode === "modal-1" ? 1 : mode === "modal-2" ? 2 : mode === "modal-3" ? 3 : 0;
  const sizeKey = mode === "collapsed" ? "pip" : mode;
  const { width, height } = customSize ?? (SIZES[sizeKey] || SIZES["pip"]);
  const canZoomIn = mode !== "modal-3";
  const canZoomOut = mode !== "pip";

  const animateProps = { width, height, opacity: 1 };

  const ytId = videoType === "youtube" ? getYouTubeId(videoUrl) : "";
  const driveId = videoType === "google-drive" ? getDriveId(videoUrl) : "";
  const ytEmbedUrl = `https://www.youtube.com/embed/${ytId}?enablejsapi=1&version=3&autoplay=1${ytStartParam}`;
  const driveEmbedUrl = `https://drive.google.com/file/d/${driveId}/preview?autoplay=1${driveTimeParam}`;

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. COLLAPSED BANNER
  // ═══════════════════════════════════════════════════════════════════════════
  if (mode === "collapsed") {
    return (
      <AnimatePresence>
        <motion.button
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={() => setMode("pip")}
          className="fixed bottom-24 right-6 sm:bottom-28 sm:right-10 z-[9999] px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20 animate-pulse"
        >
          <Tv size={14} /> VIDEO GIẢI THÍCH ĐANG MỞ
        </motion.button>
      </AnimatePresence>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. MOBILE: Bottom sheet cố định
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[9999] bg-white border-t border-slate-200 rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[75vh] animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="h-10 flex items-center justify-between px-6 bg-slate-50 border-b border-slate-100 rounded-t-[2.5rem] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            {videos.length > 1 ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 transition-all font-black text-slate-700 text-[10px] uppercase tracking-wider select-none shrink-0"
                >
                  <span className="max-w-[150px] truncate">{currentVideo?.title || `Video ${activeVideoIndex + 1}`}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 overflow-hidden">
                      {videos.map((vid, idx) => {
                        const isActive = activeVideoIndex === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveVideoIndex(idx);
                              setActiveStampIndex(null);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[10px] font-bold transition-all flex items-center justify-between hover:bg-slate-50 ${
                              isActive ? "text-blue-600 bg-blue-50/50" : "text-slate-600"
                            }`}
                          >
                            <span className="truncate pr-2">{vid.title || `Video ${idx + 1}`}</span>
                            {isActive && <span className="w-1 h-1 rounded-full bg-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{currentVideo?.title || "Video Giải Thích Chi Tiết"}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Video */}
        <div className="aspect-video w-full bg-slate-950 shrink-0 border-b border-slate-100">
          {videoType === "youtube" && ytId && (
            <iframe ref={iframeRef} src={ytEmbedUrl} className="w-full h-full" allowFullScreen allow="autoplay" title="YouTube Explanations"></iframe>
          )}
          {videoType === "google-drive" && driveId && (
            <div className="relative w-full h-full">
              <iframe src={driveEmbedUrl} className="w-full h-full" allow="autoplay" allowFullScreen title="Google Drive Explanations"></iframe>
              {/* Overlay che nút pop-out của Google Drive (góc trên-phải) */}
              <div className="absolute top-0 right-0 w-20 h-14 z-10 cursor-default" style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.01)", pointerEvents: "auto" }} />
            </div>
          )}
          {videoType === "direct" && (
            <video ref={videoRef} src={videoUrl} className="w-full h-full" controls autoPlay onEnded={handleVideoEnded}></video>
          )}
        </div>

        {/* Timestamps */}
        <div className="p-4 bg-slate-50 overflow-y-auto pb-8 flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Danh sách mốc thời gian</p>
          <div className="relative flex items-center">
            <button onClick={() => scrollMobile("left")} className="absolute left-0 z-10 p-1 bg-white border border-slate-200 rounded-full shadow-md text-slate-500 active:scale-90 transition-all pointer-events-auto">
              <ChevronLeft size={14} />
            </button>
            <div ref={mobileScrollRef} className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full scroll-smooth px-6">
              {allTimestamps.map((stamp) => {
                const isActive = activeVideoIndex === stamp.videoIndex && activeStampIndex === stamp.stampIndex;
                return (
                  <button
                    key={`${stamp.videoIndex}-${stamp.stampIndex}`}
                    onClick={() => handleSeek(stamp.time, stamp.stampIndex, stamp.videoIndex, stamp.targetIndex)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap active:scale-95 flex items-center gap-1.5 shrink-0 ${
                      isActive ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" : "bg-white border-slate-100 text-slate-700 active:bg-blue-50"
                    }`}
                  >
                    <Play size={10} className={isActive ? "fill-white text-white" : "text-slate-400"} />
                    {stamp.label}
                  </button>
                );
              })}
            </div>
            <button onClick={() => scrollMobile("right")} className="absolute right-0 z-10 p-1 bg-white border border-slate-200 rounded-full shadow-md text-slate-500 active:scale-90 transition-all pointer-events-auto">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. DESKTOP: Cửa sổ nổi kéo thả + 3 mức zoom + resize handle
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]" ref={constraintsRef}>
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={constraintsRef}
        dragElastic={0}
        initial={{ width: 440, height: 380, opacity: 0 }}
        animate={animateProps}
        transition={isResizingActive ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 220 }}
        className="fixed pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
        style={{
          boxShadow: "0 30px 60px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)",
          x: dragX,
          y: dragY,
          right: isModal ? undefined : 40,
          bottom: isModal ? undefined : 80,
          left: isModal ? "50%" : undefined,
          top: isModal ? "50%" : undefined,
          marginLeft: isModal ? -width/2 : undefined,
          marginTop: isModal ? -height/2 : undefined,
          position: "fixed",
        }}
      >
        {/* ── Header / Drag Handle ── */}
        <div className="h-12 bg-slate-50/80 border-b border-slate-100/50 flex items-center justify-between px-6 shrink-0 cursor-move select-none">
          <div className="flex items-center gap-2">
            <Move size={14} className="text-slate-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            {videos.length > 1 ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/50 transition-all font-black text-slate-700 text-[10px] uppercase tracking-wider select-none shrink-0"
                >
                  <span className="max-w-[160px] truncate">{currentVideo?.title || `Video ${activeVideoIndex + 1}`}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); }} />
                    <div className="absolute left-0 mt-1.5 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
                      <p className="px-4 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Chọn Video Giải Thích</p>
                      {videos.map((vid, idx) => {
                        const isActive = activeVideoIndex === idx;
                        return (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveVideoIndex(idx);
                              setActiveStampIndex(null);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-[11px] font-bold transition-all flex items-center justify-between hover:bg-slate-50 ${
                              isActive ? "text-blue-600 bg-blue-50/50" : "text-slate-600"
                            }`}
                          >
                            <span className="truncate pr-2">{vid.title || `Video ${idx + 1}`}</span>
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {currentVideo?.title || "Video Giải Thích Chữa Đề"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Zoom controls: x1 (pip), x1.5 (modal-1), x2 (modal-2), x2.7 (modal-3) */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-xl border border-slate-200">
              {(["pip", "modal-1", "modal-2", "modal-3"] as const).map((m, idx) => {
                const labels = ["x1", "x1.5", "x2.2", "x2.7"];
                const isActive = mode === m && !customSize;
                return (
                  <button
                    key={m}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMode(m);
                      setCustomSize(null);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider transition-all select-none ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                    }`}
                    title={`Kích thước ${labels[idx]} (${SIZES[m].width}x${SIZES[m].height})`}
                  >
                    {labels[idx]}
                  </button>
                );
              })}
            </div>

            {/* Collapse */}
            <button
              onClick={(e) => { e.stopPropagation(); setMode("collapsed"); }}
              className="p-1.5 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400 hover:text-slate-700"
              title="Thu gọn hoàn toàn"
            >
              <ChevronDown size={16} />
            </button>

            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
              title="Tắt video"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Khung Video ── */}
        <div className="flex-1 bg-slate-950 min-h-0 relative">
          {videoType === "youtube" && ytId && (
            <iframe
              ref={iframeRef}
              src={ytEmbedUrl}
              className="w-full h-full border-none"
              allowFullScreen
              allow="autoplay"
              title="YouTube Explanations"
            ></iframe>
          )}
          {videoType === "google-drive" && driveId && (
            <div className="relative w-full h-full">
              <iframe
                src={driveEmbedUrl}
                className="w-full h-full border-none"
                allow="autoplay"
                allowFullScreen
                title="Google Drive Explanations"
              ></iframe>
              {/* Overlay che nút pop-out của Google Drive (góc trên-phải) */}
              <div className="absolute top-0 right-0 w-20 h-14 z-10 cursor-default" style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.01)", pointerEvents: "auto" }} />
            </div>
          )}
          {videoType === "direct" && (
            <video ref={videoRef} src={videoUrl} className="w-full h-full" controls autoPlay onEnded={handleVideoEnded}></video>
          )}
        </div>

        {/* ── Timestamps ── */}
        <div className="py-2 px-4 bg-slate-50/50 border-t border-slate-100/50 shrink-0">
          <div className="relative flex items-center group/scroller">
            <button
              onClick={() => scrollDesktop("left")}
              className="absolute left-0 z-10 p-1.5 bg-white/95 border border-slate-200 rounded-full shadow-md text-slate-500 hover:text-blue-600 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/scroller:opacity-100 focus:opacity-100 pointer-events-auto"
              title="Mốc trước"
            >
              <ChevronLeft size={14} />
            </button>

            <div ref={desktopScrollRef} className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none max-w-full scroll-smooth px-8">
              {allTimestamps.map((stamp) => {
                const isActive = activeVideoIndex === stamp.videoIndex && activeStampIndex === stamp.stampIndex;
                return (
                  <button
                    key={`${stamp.videoIndex}-${stamp.stampIndex}`}
                    onClick={() => handleSeek(stamp.time, stamp.stampIndex, stamp.videoIndex, stamp.targetIndex)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap active:scale-95 flex items-center gap-1.5 shadow-sm shrink-0 ${
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                        : "bg-white border-slate-200/80 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    }`}
                  >
                    <Play size={9} className={isActive ? "fill-white text-white" : "text-slate-400"} />
                    {stamp.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollDesktop("right")}
              className="absolute right-0 z-10 p-1.5 bg-white/95 border border-slate-200 rounded-full shadow-md text-slate-500 hover:text-blue-600 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/scroller:opacity-100 focus:opacity-100 pointer-events-auto"
              title="Mốc sau"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Resize Handle (kéo góc phải-dưới) ── */}
        <div
          className="absolute bottom-2 right-2 w-6 h-6 z-20 cursor-se-resize pointer-events-auto flex items-end justify-end opacity-30 hover:opacity-80 transition-opacity"
          onPointerDown={handleResizeStart}
          title="Kéo để thay đổi kích thước"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-slate-500">
            <path d="M 13 1 L 1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 13 6 L 6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 13 11 L 11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
