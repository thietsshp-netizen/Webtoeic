"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Settings, Edit, Check, X, CheckCircle, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useAdminEdit } from "@/components/Admin/AdminEditProvider";

interface Subtitle {
  start: number;
  end: number;
  text: string;
  ipa?: string;
  vietnamese?: string;
  note?: string;
}

interface YoutubeDictationPlayerProps {
  lessonId: string;
  videoUrl: string;
  content: string; // JSON string of Subtitle[]
  courseId?: string;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
    YT: any;
  }
}

const renderFormattedNote = (noteText: string, fontSize: number) => {
  if (!noteText) return null;
  const parts = noteText
    .split(/(?:\*|\r?\n)/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <p 
      style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
      className="mt-1 leading-relaxed text-slate-600"
    >
      {parts.map((part, pIdx) => {
        const colonIndex = part.indexOf(":");
        if (colonIndex === -1) {
          return (
            <span key={pIdx} className="text-amber-700 font-medium mr-2">
              {part}
            </span>
          );
        }

        const term = part.substring(0, colonIndex).trim();
        const definition = part.substring(colonIndex + 1).trim();
        const cleanTerm = term.replace(/^['"]|['"]$/g, "");

        return (
          <span key={pIdx} className="inline mr-3.5">
            <span className="font-extrabold text-slate-400 mr-1 select-none">
              {pIdx + 1}.
            </span>
            <span className="font-extrabold text-indigo-600 mr-1">
              {cleanTerm}
            </span>
            <span className="text-slate-400 font-bold mr-1">:</span>
            <span className="text-amber-700 font-medium">
              {definition}
            </span>
          </span>
        );
      })}
    </p>
  );
};

export default function YoutubeDictationPlayer({ lessonId, videoUrl, content, courseId }: YoutubeDictationPlayerProps) {
  const { isAdminMode } = useAdminEdit();
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [mode, setMode] = useState<"listen" | "dictation">("listen");
  const [showIpa, setShowIpa] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(14);
  const [leftWidth, setLeftWidth] = useState<number>(60); // 60% left (video), 40% right (subtitles)
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // State for dictation input
  const [dictationInput, setDictationInput] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // States for live editing
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<{ text: string; ipa: string; vietnamese: string; note: string; start: number; end: number }>({ text: "", ipa: "", vietnamese: "", note: "", start: 0, end: 0 });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const [playerReady, setPlayerReady] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dictationTextareaRef = useRef<HTMLTextAreaElement>(null);
  const activeSubRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const hasRestoredRef = useRef<boolean>(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // If mouse buttons is 0 (mouse released outside window), stop resizing immediately
      if (e.buttons === 0) {
        setIsResizing(false);
        return;
      }
      if (!isResizing || !outerContainerRef.current) return;
      const rect = outerContainerRef.current.getBoundingClientRect();
      const newWidthPx = e.clientX - rect.left;
      const newWidthPercent = (newWidthPx / rect.width) * 100;
      
      if (newWidthPercent >= 35 && newWidthPercent <= 80) {
        setLeftWidth(newWidthPercent);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Extract YouTube Video ID
  const getYouTubeId = (url: string) => {
    let videoId = "";
    try {
      if (url.includes("embed/")) videoId = url.split("embed/")[1]?.split("?")[0];
      else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0];
      else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } catch (e) {}
    return videoId;
  };
  const videoId = getYouTubeId(videoUrl);

  // Parse Subtitles JSON
  useEffect(() => {
    try {
      const parsed = JSON.parse(content || "[]");
      if (Array.isArray(parsed)) {
        setSubtitles(parsed);
      }
    } catch (e) {
      console.error("Failed to parse subtitles JSON:", e);
    }
  }, [content]);

  // Load YouTube Player API and Initialize Player
  useEffect(() => {
    if (!videoId) return;

    // Load API Script if not loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout;

    const setupPlayer = () => {
      if (!isMounted) return;
      const element = document.getElementById("youtube-dictation-iframe");
      if (!element) return;

      try {
        if (window.YT && window.YT.Player) {
          playerRef.current = new window.YT.Player("youtube-dictation-iframe", {
            playerVars: {
              controls: 1,
              cc_load_policy: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              enablejsapi: 1,
              origin: window.location.origin
            },
            events: {
              onReady: () => {
                if (!isMounted) return;
                setPlayerReady(true);
                try {
                  if (playerRef.current && typeof playerRef.current.unloadModule === "function") {
                    playerRef.current.unloadModule("captions");
                    playerRef.current.unloadModule("cc");
                  }
                } catch (e) {}
              },
              onStateChange: (event: any) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  try {
                    if (playerRef.current && typeof playerRef.current.unloadModule === "function") {
                      playerRef.current.unloadModule("captions");
                      playerRef.current.unloadModule("cc");
                    }
                  } catch (e) {}
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                }
              },
            },
          });
        }
      } catch (err) {
        console.error("Error binding YT Player:", err);
      }
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const checkAndInit = () => {
      if (window.YT && window.YT.Player && typeof window.YT.Player === "function") {
        setupPlayer();
      } else {
        pollInterval = setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();

    return () => {
      isMounted = false;
      if (pollInterval) clearTimeout(pollInterval);
      window.onYouTubeIframeAPIReady = undefined;
      setPlayerReady(false);
    };
  }, [videoId]);

  // Restore progress from localStorage once player and subtitles are ready
  useEffect(() => {
    if (playerReady && subtitles.length > 0 && playerRef.current && typeof playerRef.current.seekTo === "function" && !hasRestoredRef.current) {
      hasRestoredRef.current = true; // Mark restore attempt completed
      const saved = localStorage.getItem(`youtube-dictation-progress-${lessonId}`);
      if (saved) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < subtitles.length) {
          setCurrentIndex(idx);
          // Use a 600ms timeout to ensure the player finished initial load and accepts seek stably
          setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.seekTo === "function") {
              playerRef.current.seekTo(subtitles[idx].start, true);
              playerRef.current.pauseVideo();
            }
          }, 600);
        }
      }
    } else if (playerReady && subtitles.length > 0 && !hasRestoredRef.current) {
      // If there is no playerRef or seekTo capability yet but conditions are ready and no progress saved
      hasRestoredRef.current = true;
    }
  }, [playerReady, subtitles, lessonId]);

  // Save progress to localStorage when index changes
  useEffect(() => {
    if (subtitles.length > 0 && hasRestoredRef.current) {
      localStorage.setItem(`youtube-dictation-progress-${lessonId}`, currentIndex.toString());
    }
  }, [currentIndex, subtitles, lessonId]);

  // Poll current time from YouTube Player API
  useEffect(() => {
    const interval = setInterval(() => {
      // Skip automatic time tracking for 1.2 seconds after manual seek to allow YouTube player to stabilize
      if (Date.now() - lastSeekTimeRef.current < 1200) return;

      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);

          if (typeof playerRef.current.getDuration === "function") {
            const dur = playerRef.current.getDuration();
            if (dur && dur !== duration) {
              setDuration(dur);
            }
          }

          // Find and update active subtitle based on time (only in listening mode to prevent snapping during dictation typing)
          if (mode === "listen" && subtitles.length > 0) {
            // Scan backwards to find the latest matching subtitle (prioritizes newer segments when times overlap)
            let foundIndex = -1;
            for (let i = subtitles.length - 1; i >= 0; i--) {
              const sub = subtitles[i];
              if (time >= sub.start && time <= sub.end) {
                foundIndex = i;
                break;
              }
            }
            if (foundIndex !== -1 && foundIndex !== currentIndex) {
              setCurrentIndex(foundIndex);
            }
          }
        } catch (e) {}
      }
    }, 250);

    return () => clearInterval(interval);
  }, [subtitles, currentIndex, mode]);

  // Scroll active subtitle row steadily inside container
  useEffect(() => {
    if (activeSubRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeSubRef.current;
      
      const containerHeight = container.clientHeight;
      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;
      
      const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth"
      });
    }
  }, [currentIndex]);

  // Reset dictation status when active sentence changes
  useEffect(() => {
    setDictationInput("");
    setIsCompleted(false);
  }, [currentIndex]);

  // Dictation logic: Check input against target text
  const targetText = subtitles[currentIndex]?.text || "";
  useEffect(() => {
    if (mode !== "dictation" || isCompleted || !targetText) return;

    let match = true;
    let hasLetters = false;
    
    // We clean punctuation differences if needed, but here we do character-by-character check
    for (let i = 0; i < targetText.length; i++) {
      const c = targetText[i];
      if (/[a-zA-Z0-9]/.test(c)) {
        hasLetters = true;
        if (!dictationInput[i] || dictationInput[i].toLowerCase() !== c.toLowerCase()) {
          match = false;
          break;
        }
      }
    }

    if (match && hasLetters && dictationInput.length > 0) {
      setIsCompleted(true);
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
      const successAudio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
      successAudio.play().catch(() => {});
    }
  }, [dictationInput, targetText, isCompleted, mode]);

  // Handle seeking & playing a specific subtitle row
  const playSubtitleRow = (index: number) => {
    if (index < 0 || index >= subtitles.length) return;
    lastSeekTimeRef.current = Date.now(); // Mark manual seeking timestamp
    setCurrentIndex(index);
    const sub = subtitles[index];
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(sub.start, true);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  // Play/Pause YouTube video
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  // Change Playback Speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  // Hotkeys handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
      
      // Shortcuts without modifiers when NOT typing
      if (!isTyping) {
        if (e.code === "KeyN") {
          e.preventDefault();
          playSubtitleRow(currentIndex + 1);
        } else if (e.code === "KeyV") {
          e.preventDefault();
          playSubtitleRow(currentIndex - 1);
        } else if (e.code === "KeyB") {
          e.preventDefault();
          playSubtitleRow(currentIndex);
        } else if (e.key === " ") {
          e.preventDefault();
          togglePlay();
        }
      } 
      // Shortcuts with Alt modifier when user is inside the typing box
      else if (isTyping && e.altKey) {
        if (e.code === "KeyN") {
          e.preventDefault();
          playSubtitleRow(currentIndex + 1);
        } else if (e.code === "KeyV") {
          e.preventDefault();
          playSubtitleRow(currentIndex - 1);
        } else if (e.code === "KeyB") {
          e.preventDefault();
          playSubtitleRow(currentIndex);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, subtitles, isPlaying]);

  // Live Inline Editing Handlers
  const startEdit = (idx: number, sub: Subtitle) => {
    setEditingIndex(idx);
    setEditFields({
      text: sub.text,
      ipa: sub.ipa || "",
      vietnamese: sub.vietnamese || "",
      note: sub.note || "",
      start: sub.start,
      end: sub.end,
    });
  };

  const saveLiveEdit = async (idx: number) => {
    setIsSavingEdit(true);
    try {
      const updatedSubtitles = [...subtitles];
      updatedSubtitles[idx] = {
        ...updatedSubtitles[idx],
        text: editFields.text,
        ipa: editFields.ipa,
        vietnamese: editFields.vietnamese,
        note: editFields.note,
        start: editFields.start,
        end: editFields.end,
      };

      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: JSON.stringify(updatedSubtitles),
        }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      setSubtitles(updatedSubtitles);
      setEditingIndex(null);
      alert("Đã cập nhật phụ đề thành công!");
    } catch (e) {
      alert("Lỗi khi cập nhật phụ đề!");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatTime = (secs: number) => {
    if (typeof secs !== 'number' || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      lastSeekTimeRef.current = Date.now();
      playerRef.current.seekTo(val, true);
    }
  };

  return (
    <div ref={outerContainerRef} className={`flex flex-col lg:flex-row gap-0 h-[calc(100vh-140px)] min-h-[500px] w-full overflow-hidden ${isResizing ? "select-none" : ""}`}>
      {/* LEFT COLUMN: Video Player */}
      <div style={{ width: `${leftWidth}%` }} className="flex flex-col gap-4 h-full pr-3 min-w-[320px] shrink-0">
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-900 border-4 border-white shadow-xl">
          {videoId ? (
            <iframe
              id="youtube-dictation-iframe"
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&version=3&rel=0&controls=1&cc_load_policy=0&iv_load_policy=3&modestbranding=1`}
              className="w-full h-full border-none"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-bold">
              Chưa có video URL hợp lệ
            </div>
          )}
        </div>

        {/* Video Controls & Information */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
          {/* Custom Timeline Slider */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-xs font-mono font-bold text-slate-500 min-w-[40px] text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSliderChange}
              className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${duration ? (currentTime / duration) * 100 : 0}%, #f1f5f9 ${duration ? (currentTime / duration) * 100 : 0}%, #f1f5f9 100%)`
              }}
            />
            <span className="text-xs font-mono font-bold text-slate-500 min-w-[40px]">{formatTime(duration)}</span>
          </div>

          {/* Action buttons & Speed control row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className={`p-3.5 rounded-2xl text-white font-bold transition-all shadow-md active:scale-95 ${
                  isPlaying ? "bg-amber-500 shadow-amber-200" : "bg-blue-600 shadow-blue-200"
                }`}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={() => playSubtitleRow(currentIndex)}
                className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                title="Nghe lại dòng hiện tại (phím b)"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Tốc độ phát:</span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      playbackRate === speed
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Shortcuts Cheat Sheet */}
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
          <HelpCircle className="text-blue-500 w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 leading-relaxed font-medium">
            <p className="font-bold mb-1">Mẹo học nhanh bằng phím tắt:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Nhấn phím <strong>n</strong> để chuyển qua câu tiếp theo.</li>
              <li>Nhấn phím <strong>v</strong> để quay lại câu trước đó.</li>
              <li>Nhấn phím <strong>b</strong> để nghe lại câu hiện tại.</li>
              <li>Nhấn phím <strong>Space</strong> (Khoảng trắng) để Tạm dừng/Phát video.</li>
              <li><em>Lưu ý:</em> Khi đang gõ chính tả, vui lòng nhấn giữ thêm phím <strong>Alt</strong> (Alt + n, Alt + v, Alt + b) để dùng phím tắt.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* VERTICAL DRAG DIVIDER */}
      <div className="hidden lg:flex w-2 bg-slate-100 hover:bg-slate-200 h-full self-stretch flex-shrink-0 z-30 relative items-center justify-center mx-0.5">
        <button 
          type="button"
          onMouseDown={startResizing}
          className="w-6 h-6 rounded-full bg-white border-2 border-indigo-500 hover:border-indigo-600 text-indigo-500 shadow-md flex items-center justify-center cursor-col-resize z-40 transition-all hover:scale-110 active:scale-95"
          title="Nắm vào đây để kéo chỉnh chiều rộng"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-current" />
        </button>
      </div>

      {/* RIGHT COLUMN: Subtitles & Dictation Panel */}
      <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col gap-4 h-full pl-3 min-w-[280px] shrink-0">
        {/* Toggle Mode */}
        <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex shrink-0">
          <button
            onClick={() => setMode("listen")}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              mode === "listen" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🔊 Luyện Nghe & Đọc Dịch
          </button>
          <button
            onClick={() => {
              setMode("dictation");
              setTimeout(() => dictationTextareaRef.current?.focus(), 100);
            }}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              mode === "dictation" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            ✏️ Nghe Chép Chính Tả
          </button>
        </div>

        {/* Subtitles Area / Dictation Box */}
        {mode === "listen" ? (
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="p-4 bg-slate-50 border-b text-xs font-black text-slate-400 tracking-wider uppercase shrink-0 flex items-center justify-between">
              <span>Danh sách phụ đề ({subtitles.length} câu)</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer select-none normal-case font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={showIpa}
                    onChange={(e) => setShowIpa(e.target.checked)}
                    className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Hiện IPA</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none normal-case font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-3">
                  <input
                    type="checkbox"
                    checked={showNotes}
                    onChange={(e) => setShowNotes(e.target.checked)}
                    className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Giải nghĩa</span>
                </label>
                <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                  <button
                    type="button"
                    onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
                    title="Giảm cỡ chữ"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
                    title="Tăng cỡ chữ"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>
            
            <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {subtitles.map((sub, idx) => {
                const isActive = currentIndex === idx;
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={idx}
                    ref={isActive ? activeSubRef : null}
                    onClick={() => !isEditing && playSubtitleRow(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      isActive
                        ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Thời gian bắt đầu (s)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFields.start}
                              onChange={(e) => setEditFields({ ...editFields, start: parseFloat(e.target.value) || 0 })}
                              className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Thời gian kết thúc (s)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFields.end}
                              onChange={(e) => setEditFields({ ...editFields, end: parseFloat(e.target.value) || 0 })}
                              className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-700"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Text tiếng Anh</label>
                          <textarea
                            value={editFields.text}
                            onChange={(e) => setEditFields({ ...editFields, text: e.target.value })}
                            rows={2}
                            className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Phiên âm IPA</label>
                          <input
                            type="text"
                            value={editFields.ipa}
                            onChange={(e) => setEditFields({ ...editFields, ipa: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-indigo-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Dịch tiếng Việt</label>
                          <textarea
                            value={editFields.vietnamese}
                            onChange={(e) => setEditFields({ ...editFields, vietnamese: e.target.value })}
                            rows={2}
                            className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Giải thích từ vựng (Ghi chú)</label>
                          <textarea
                            value={editFields.note}
                            onChange={(e) => setEditFields({ ...editFields, note: e.target.value })}
                            rows={2}
                            className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-amber-700 font-medium"
                            placeholder="Ví dụ: * 'phrase': giải thích"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1 border-t">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => saveLiveEdit(idx)}
                            disabled={isSavingEdit}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            {isSavingEdit ? "Lưu..." : <><Check size={10} /> Lưu</>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 relative">
                        {/* Time tag */}
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                          <span>{sub.start}s - {sub.end}s</span>
                          {isAdminMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(idx, sub);
                              }}
                              className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100"
                              title="Sửa nhanh phụ đề dòng này"
                            >
                              <Edit size={12} />
                            </button>
                          )}
                        </div>
                        <p 
                          style={{ fontSize: `${fontSize}px` }}
                          className={`font-bold leading-relaxed ${isActive ? "text-indigo-900" : "text-slate-800"}`}
                        >
                          {sub.text}
                        </p>
                        {sub.ipa && showIpa && (
                          <p 
                            style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                            className="font-mono text-indigo-600/80 font-semibold"
                          >
                            {sub.ipa}
                          </p>
                        )}
                        {sub.vietnamese && (
                          <p 
                            style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                            className="text-slate-500 font-medium leading-relaxed"
                          >
                            {sub.vietnamese}
                          </p>
                        )}
                        {sub.note && showNotes && renderFormattedNote(sub.note, fontSize)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-6 min-h-0">
            {/* Target Sentence Display Layer & Typing Area */}
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3 relative overflow-hidden">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
                  <span>Câu thứ {currentIndex + 1} / {subtitles.length}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer select-none font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={showIpa}
                        onChange={(e) => setShowIpa(e.target.checked)}
                        className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span>IPA</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer select-none font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-3">
                      <input
                        type="checkbox"
                        checked={showNotes}
                        onChange={(e) => setShowNotes(e.target.checked)}
                        className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span>Note</span>
                    </label>
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3 normal-case">
                      <button
                        type="button"
                        onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center transition-all active:scale-95"
                        title="Giảm cỡ chữ"
                      >
                        A-
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center transition-all active:scale-95"
                        title="Tăng cỡ chữ"
                      >
                        A+
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Hints (IPA & Vietnamese) */}
                {subtitles[currentIndex]?.ipa && showIpa && (
                  <p 
                    style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                    className="font-mono text-indigo-600 font-semibold"
                  >
                    {subtitles[currentIndex]?.ipa}
                  </p>
                )}
                {subtitles[currentIndex]?.vietnamese && (
                  <p 
                    style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                    className="text-slate-600 leading-relaxed font-semibold italic"
                  >
                    {subtitles[currentIndex]?.vietnamese}
                  </p>
                )}
                {subtitles[currentIndex]?.note && showNotes && renderFormattedNote(subtitles[currentIndex]?.note, fontSize)}
              </div>

              {/* Dictation Match View */}
              <div className="relative w-full min-h-[100px] bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-start">
                {/* Visual Matching Layer */}
                <div 
                  style={{ fontSize: `${fontSize + 2}px`, width: "calc(100% - 40px)" }}
                  className="absolute inset-5 z-20 pointer-events-none break-words whitespace-pre-wrap select-text text-slate-300 font-mono font-bold leading-relaxed tracking-[0.02em] m-0 p-0 border-0"
                >
                  {targetText.split("").map((char, i) => {
                    const typed = dictationInput[i];
                    const isAlphaNumeric = /[a-zA-Z0-9]/.test(char);
                    if (!isAlphaNumeric) return <span key={i} className="text-slate-400">{char}</span>;
                    if (!typed) return <span key={i} className="text-slate-350">_</span>;
                    const isCorrect = typed.toLowerCase() === char.toLowerCase();
                    return (
                      <span
                        key={i}
                        className={`${isCorrect ? "text-emerald-600" : "text-red-500 bg-red-100"} transition-colors`}
                      >
                        {typed}
                      </span>
                    );
                  })}
                </div>

                {/* Secret textarea to capture keyboard focus */}
                <textarea
                  ref={dictationTextareaRef}
                  value={dictationInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= targetText.length) setDictationInput(val);
                  }}
                  style={{ WebkitTextFillColor: "transparent", color: "transparent", caretColor: "#3b82f6", fontSize: `${fontSize + 2}px` }}
                  className="w-full h-full bg-transparent outline-none resize-none absolute inset-5 z-10 m-0 p-0 border-0 font-mono font-bold leading-relaxed tracking-[0.02em] pointer-events-auto overflow-hidden"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  placeholder={isCompleted ? "" : "Hãy nhấn vào đây và gõ những gì bạn nghe thấy..."}
                />
                
                {isCompleted && (
                  <div className="absolute right-4 bottom-4 z-30 text-emerald-600 flex items-center gap-1.5 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm animate-bounce">
                    <CheckCircle className="w-4 h-4" /> Chính xác!
                  </div>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-4 border-t shrink-0">
              <button
                onClick={() => playSubtitleRow(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
              >
                <ChevronLeft size={16} /> Quay Lại (Alt+v)
              </button>
              <button
                onClick={() => playSubtitleRow(currentIndex + 1)}
                disabled={currentIndex === subtitles.length - 1}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs shadow-md shadow-indigo-100"
              >
                Tiếp Theo (Alt+n) <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
