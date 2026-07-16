"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Settings, Edit, Check, X, CheckCircle, ChevronLeft, ChevronRight, HelpCircle, Maximize2, Minimize2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useAdminEdit } from "@/components/Admin/AdminEditProvider";
import { showToast } from "@/components/UI/Toast";

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
  
  // Split by *, newlines, or numbered list indicators (e.g., "2. ", "3. ")
  const parts = noteText
    .split(/(?:\*|\r?\n|\s*\d+\.\s+)/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <p 
      style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
      className="mt-1 leading-relaxed text-slate-600"
    >
      {parts.map((part, pIdx) => {
        // Case 1: Category: 'Phrase' (meaning) or Category: 'Phrase' meaning
        // Example: "Collocation: 'stuffed animals' (thú nhồi bông)"
        // Transforms to: "stuffed animals (collocation): thú nhồi bông"
        const categoryQuotedRegex = /^([A-Za-z0-9\/\s\-]+)\s*:\s*['"](.*?)['"](?=\s*(?::|\(|\s+nghĩa\s+là|\s+là|$))\s*(.*)$/;
        const catMatch = part.match(categoryQuotedRegex);
        
        if (catMatch) {
          const category = catMatch[1].trim();
          const phrase = catMatch[2].trim();
          const rest = catMatch[3].trim();
          
          // Clean up surrounding parentheses from the translation if present (e.g. "(thú nhồi bông)" -> "thú nhồi bông")
          let cleanRest = rest;
          if (cleanRest.startsWith("(") && cleanRest.endsWith(")")) {
            cleanRest = cleanRest.substring(1, cleanRest.length - 1).trim();
          }
          // Strip trailing period if present
          if (cleanRest.endsWith(".")) {
            cleanRest = cleanRest.substring(0, cleanRest.length - 1).trim();
          }
          
          return (
            <span key={pIdx} className="inline mr-3.5">
              <span className="font-extrabold text-slate-400 mr-1 select-none">
                {pIdx + 1}.
              </span>
              <span className="font-extrabold text-purple-600 mr-1">
                {phrase}
              </span>
              <span className="text-slate-400 font-medium text-[11px] italic mr-1">
                ({category.toLowerCase()})
              </span>
              <span className="text-slate-400 font-bold mr-1.5">:</span>
              <span className="text-amber-700 font-medium">
                {cleanRest}
              </span>
            </span>
          );
        }

        // Case 2: 'Phrase': meaning
        // Example: "'check out': xem thử"
        const quotedRegex = /^['"](.*?)['"](?=\s*(?::|\(|\s+nghĩa\s+là|\s+là|$))\s*:\s*(.*)$/;
        const quotedMatch = part.match(quotedRegex);
        if (quotedMatch) {
          const phrase = quotedMatch[1].trim();
          const meaning = quotedMatch[2].trim();
          
          return (
            <span key={pIdx} className="inline mr-3.5">
              <span className="font-extrabold text-slate-400 mr-1 select-none">
                {pIdx + 1}.
              </span>
              <span className="font-extrabold text-purple-600 mr-1">
                {phrase}
              </span>
              <span className="text-slate-400 font-bold mr-1">:</span>
              <span className="text-amber-700 font-medium">
                {meaning}
              </span>
            </span>
          );
        }

        // Case 3: Standard term: definition fallback
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
            <span className="font-extrabold text-purple-600 mr-1">
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
  const [showSubOnVideo, setShowSubOnVideo] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(18);
  const [leftWidth, setLeftWidth] = useState<number>(60); // 60% left (video), 40% right (subtitles)
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // State for dictation input
  const [dictationInput, setDictationInput] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // States for live editing
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<{ text: string; ipa: string; vietnamese: string; note: string; start: string; end: string }>({ text: "", ipa: "", vietnamese: "", note: "", start: "", end: "" });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const [playerReady, setPlayerReady] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dictationTextareaRef = useRef<HTMLTextAreaElement>(null);
  const activeSubRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const hasRestoredRef = useRef<boolean>(false);

  // Refs for keydown hotkeys
  const editingIndexRef = useRef<number | null>(null);
  editingIndexRef.current = editingIndex;
  const isSavingEditRef = useRef<boolean>(false);
  isSavingEditRef.current = isSavingEdit;
  const saveLiveEditRef = useRef<((idx: number) => Promise<void>) | null>(null);

  // --- Detect video type ---
  const isDirectVideo = !!(videoUrl && !videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be"));

  // Convert Google Drive view link to direct stream link
  const getDirectVideoUrl = (url: string): string => {
    if (!url) return "";
    // Google Drive: https://drive.google.com/file/d/FILE_ID/view
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (driveMatch) {
      return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    return url; // Return as-is for Supabase, Cloudflare R2, etc.
  };
  const directVideoUrl = getDirectVideoUrl(videoUrl);

  // Handle fullscreen change events (e.g. user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === videoContainerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch((err) => {
        console.error("Lỗi khi mở toàn màn hình:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

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

  // Disable native subtitles (softsubs) in direct video files to avoid overlap with React overlay
  useEffect(() => {
    if (!isDirectVideo) return;
    const disableTracks = () => {
      if (videoRef.current) {
        const tracks = videoRef.current.textTracks;
        for (let i = 0; i < tracks.length; i++) {
          tracks[i].mode = "disabled";
        }
      }
    };
    
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener("loadedmetadata", disableTracks);
      disableTracks();
    }
    return () => {
      if (videoEl) {
        videoEl.removeEventListener("loadedmetadata", disableTracks);
      }
    };
  }, [videoUrl, isDirectVideo]);

  // Restore progress: works for both YouTube and HTML5 video
  useEffect(() => {
    if (subtitles.length === 0 || hasRestoredRef.current) return;

    if (isDirectVideo) {
      // For direct video: restore when video element is mounted and can seek
      hasRestoredRef.current = true;
      const saved = localStorage.getItem(`youtube-dictation-progress-${lessonId}`);
      if (saved) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < subtitles.length) {
          setCurrentIndex(idx);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = subtitles[idx].start;
            }
          }, 400);
        }
      }
      setPlayerReady(true);
      return;
    }

    // For YouTube: wait for playerReady
    if (playerReady && playerRef.current && typeof playerRef.current.seekTo === "function") {
      hasRestoredRef.current = true;
      const saved = localStorage.getItem(`youtube-dictation-progress-${lessonId}`);
      if (saved) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < subtitles.length) {
          setCurrentIndex(idx);
          setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.seekTo === "function") {
              playerRef.current.seekTo(subtitles[idx].start, true);
              playerRef.current.pauseVideo();
            }
          }, 600);
        }
      }
    } else if (playerReady && subtitles.length > 0 && !hasRestoredRef.current) {
      hasRestoredRef.current = true;
    }
  }, [playerReady, subtitles, lessonId, isDirectVideo]);

  // Save progress to localStorage when index changes
  useEffect(() => {
    if (subtitles.length > 0 && hasRestoredRef.current) {
      localStorage.setItem(`youtube-dictation-progress-${lessonId}`, currentIndex.toString());
    }
  }, [currentIndex, subtitles, lessonId]);

  // Poll current time from YouTube Player API (YouTube mode only)
  useEffect(() => {
    if (isDirectVideo) return; // HTML5 video uses onTimeUpdate events instead
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
    lastSeekTimeRef.current = Date.now();
    setCurrentIndex(index);
    const sub = subtitles[index];
    if (isDirectVideo) {
      if (videoRef.current) {
        videoRef.current.currentTime = sub.start;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(sub.start, true);
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  // Play/Pause video (both modes)
  const togglePlay = () => {
    if (isDirectVideo) {
      if (!videoRef.current) return;
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      if (!playerRef.current) return;
      if (isPlaying) {
        if (typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
        setIsPlaying(false);
      } else {
        if (typeof playerRef.current.playVideo === "function") {
          playerRef.current.playVideo();
        }
        setIsPlaying(true);
      }
    }
  };

  // Change Playback Speed (both modes)
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (isDirectVideo) {
      if (videoRef.current) videoRef.current.playbackRate = speed;
    } else {
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
        playerRef.current.setPlaybackRate(speed);
      }
    }
  };

  // Hotkeys handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save subtitle shortcut: Cmd+S / Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (editingIndexRef.current !== null && !isSavingEditRef.current) {
          e.preventDefault();
          saveLiveEditRef.current?.(editingIndexRef.current);
          return;
        }
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping = 
        (activeEl?.tagName === "INPUT" && 
         (activeEl as HTMLInputElement).type !== "checkbox" && 
         (activeEl as HTMLInputElement).type !== "radio") || 
        activeEl?.tagName === "TEXTAREA";
      
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
        } else if (e.key === " " || e.code === "Backquote") {
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
        } else if (e.code === "Backquote" || e.code === "Space") {
          e.preventDefault();
          togglePlay();
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
      start: formatTimeDetailed(sub.start),
      end: formatTimeDetailed(sub.end),
    });
  };

  const parseTimeToSeconds = (str: string | number): number => {
    if (str === undefined || str === null) return 0;
    if (typeof str === 'number') return str;
    const cleanStr = str.trim();
    if (!cleanStr.includes(':')) {
      return parseFloat(cleanStr) || 0;
    }
    const parts = cleanStr.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      const secs = parseFloat(parts[2]) || 0;
      return hours * 3600 + mins * 60 + secs;
    }
    return parseFloat(cleanStr) || 0;
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
        start: parseTimeToSeconds(editFields.start),
        end: parseTimeToSeconds(editFields.end),
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
      showToast("Đã cập nhật phụ đề thành công!", "success");
    } catch (e) {
      showToast("Lỗi khi cập nhật phụ đề!", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  saveLiveEditRef.current = saveLiveEdit;

  const adjustEditTime = (field: 'start' | 'end', offset: number) => {
    const currentVal = parseTimeToSeconds(editFields[field]);
    const newVal = Math.max(0, parseFloat((currentVal + offset).toFixed(2)));
    setEditFields((prev: any) => ({
      ...prev,
      [field]: formatTimeDetailed(newVal)
    }));
  };

  const shiftAllSubtitles = async (offset: number) => {
    if (subtitles.length === 0) return;
    const confirmMsg = `Bạn có chắc muốn dịch chuyển TOÀN BỘ phụ đề ${offset > 0 ? "muộn hơn" : "sớm hơn"} ${Math.abs(offset)} giây?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const updatedSubtitles = subtitles.map(sub => ({
        ...sub,
        start: Math.max(0, parseFloat((sub.start + offset).toFixed(2))),
        end: Math.max(0, parseFloat((sub.end + offset).toFixed(2))),
      }));

      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: JSON.stringify(updatedSubtitles),
        }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      setSubtitles(updatedSubtitles);
      showToast(`Đã dịch chuyển toàn bộ phụ đề ${offset > 0 ? "muộn hơn" : "sớm hơn"} ${Math.abs(offset)}s!`, "success");
    } catch (e) {
      showToast("Lỗi khi dịch chuyển phụ đề!", "error");
    }
  };

  const formatTime = (secs: number) => {
    if (typeof secs !== 'number' || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimeDetailed = (secs: number) => {
    if (typeof secs !== 'number' || isNaN(secs)) return '00:00.00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const ms = (secs % 1).toFixed(2).substring(2);
    
    const hStr = h > 0 ? `${h}:` : '';
    const mStr = h > 0 ? m.toString().padStart(2, '0') : m.toString();
    const sStr = s.toString().padStart(2, '0');
    
    return `${hStr}${mStr}:${sStr}.${ms}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (isDirectVideo) {
      if (videoRef.current) {
        videoRef.current.currentTime = val;
      }
    } else {
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        lastSeekTimeRef.current = Date.now();
        playerRef.current.seekTo(val, true);
      }
    }
  };

  return (
    <div ref={outerContainerRef} className="flex flex-col w-full bg-slate-50 pb-12">
      {/* TOP: Video Player (Centered, takes full-width with a max-width limit) */}
      <div className="w-full flex justify-center bg-slate-900 shadow-inner p-4 shrink-0">
        <div 
          ref={videoContainerRef}
          tabIndex={-1}
          onMouseLeave={() => videoContainerRef.current?.focus()}
          className={`w-full bg-black relative flex items-center justify-center group/video transition-all outline-none ${
            isFullscreen 
              ? "max-w-none h-full rounded-none border-0 shadow-none" 
              : "max-w-5xl aspect-video rounded-3xl border-4 border-slate-800 shadow-2xl"
          }`}
        >
          {isDirectVideo ? (
            <video
              ref={videoRef}
              src={directVideoUrl}
              className="w-full h-full object-contain bg-black"
              onError={(e) => {
                const vid = e.currentTarget;
                const errCode = vid.error?.code;
                const errMsg = vid.error?.message || "Unknown error";
                const codeMap: Record<number, string> = {
                  1: "MEDIA_ERR_ABORTED - Người dùng hủy tải",
                  2: "MEDIA_ERR_NETWORK - Lỗi mạng khi tải video",
                  3: "MEDIA_ERR_DECODE - Lỗi giải mã (codec không hỗ trợ?)",
                  4: "MEDIA_ERR_SRC_NOT_SUPPORTED - URL không hợp lệ hoặc bị chặn CORS",
                };
                const desc = errCode ? codeMap[errCode] : "Lỗi không xác định";
                console.error("[Video Error]", errCode, errMsg, directVideoUrl);
                alert(`❌ Lỗi tải video:\n${desc}\n\nURL: ${directVideoUrl}\n\nKiểm tra:\n• Bucket Supabase đã đặt Public chưa?\n• URL có dạng .../object/public/... không?\n• Có CORS Policy cho domain này chưa?`);
              }}
              onTimeUpdate={() => {
                if (!videoRef.current) return;
                const time = videoRef.current.currentTime;
                setCurrentTime(time);

                // Aggressively disable native text tracks
                const tracks = videoRef.current.textTracks;
                for (let i = 0; i < tracks.length; i++) {
                  tracks[i].mode = "disabled";
                }

                // Find and update active subtitle based on time (only in listen mode)
                if (mode === "listen" && subtitles.length > 0) {
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
              }}
              onDurationChange={() => {
                if (videoRef.current) setDuration(videoRef.current.duration);
              }}
              onPlay={() => {
                setIsPlaying(true);
                // Disable native text tracks on play
                if (videoRef.current) {
                  const tracks = videoRef.current.textTracks;
                  for (let i = 0; i < tracks.length; i++) {
                    tracks[i].mode = "disabled";
                  }
                }
              }}
              onPause={() => setIsPlaying(false)}
              controls
              preload="metadata"
            />
          ) : videoId ? (
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

          {/* Custom Fullscreen Toggle Button */}
          {videoUrl && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-30 p-2.5 rounded-xl bg-black/60 hover:bg-black/85 text-white/80 hover:text-white border border-white/10 hover:border-white/20 transition-all hover:scale-105 opacity-0 group-hover/video:opacity-100 focus:opacity-100 shadow-md backdrop-blur-sm pointer-events-auto"
              title={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          )}

          {/* Subtitle Overlay đè lên video */}
          {showSubOnVideo && mode === "listen" && subtitles[currentIndex] && (
            <div className="absolute bottom-10 left-0 right-0 pointer-events-none flex flex-col items-center justify-center px-4 text-center z-50 select-none">
              <div className="bg-black/70 px-5 py-2.5 rounded-2xl max-w-[85%] border border-white/10 shadow-2xl backdrop-blur-sm">
                <p 
                  style={{ 
                    fontSize: `${isFullscreen ? fontSize * 1.5 : fontSize + 2}px`,
                    color: '#ef4444'
                  }} 
                  className="font-extrabold leading-normal drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                >
                  {subtitles[currentIndex].text}
                </p>
                {showIpa && subtitles[currentIndex].ipa && (
                  <p 
                    style={{ fontSize: `${isFullscreen ? (fontSize - 1) * 1.5 : fontSize - 1}px` }} 
                    className="text-indigo-300 font-mono font-semibold mt-0.5"
                  >
                    {subtitles[currentIndex].ipa}
                  </p>
                )}
                {subtitles[currentIndex].vietnamese && (
                  <p 
                    style={{ fontSize: `${isFullscreen ? (fontSize - 1) * 1.5 : fontSize - 1}px` }} 
                    className="text-slate-200 mt-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-medium"
                  >
                    {subtitles[currentIndex].vietnamese}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: Workspace (Centered, matching video width) */}
      <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
          {/* Shared Header (Mode Switcher, Checkboxes, Font Controls, Tooltip) */}
          <div className="p-3 bg-slate-50 border-b text-xs font-black text-slate-400 tracking-wider uppercase shrink-0 flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-1.5 normal-case">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tốc độ:</span>
              <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-250">
                {[0.5, 0.7, 1, 1.2].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={(e) => {
                      handleSpeedChange(speed);
                      e.currentTarget.blur();
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                      playbackRate === speed
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Mode switch */}
              <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-250">
                <button
                  onClick={(e) => {
                    setMode("listen");
                    e.currentTarget.blur();
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all flex items-center gap-1 ${
                    mode === "listen" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="🔊 Luyện Nghe & Đọc Dịch"
                >
                  <Volume2 size={12} />
                  <span>Nghe & Dịch</span>
                </button>
                <button
                  onClick={() => {
                    setMode("dictation");
                    setTimeout(() => dictationTextareaRef.current?.focus(), 100);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all flex items-center gap-1 ${
                    mode === "dictation" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="✏️ Nghe Chép Chính Tả"
                >
                  <Edit size={12} />
                  <span>Chính tả</span>
                </button>
              </div>

              {/* Show options */}
              <div className="flex items-center gap-2.5">
                <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-500 hover:text-indigo-600 transition-colors normal-case">
                  <input
                    type="checkbox"
                    checked={showIpa}
                    onChange={(e) => {
                      setShowIpa(e.target.checked);
                      e.target.blur();
                    }}
                    className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>IPA</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-2.5 normal-case">
                  <input
                    type="checkbox"
                    checked={showNotes}
                    onChange={(e) => {
                      setShowNotes(e.target.checked);
                      e.target.blur();
                    }}
                    className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Giải nghĩa</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-2.5 normal-case">
                  <input
                    type="checkbox"
                    checked={showSubOnVideo}
                    onChange={(e) => {
                      setShowSubOnVideo(e.target.checked);
                      e.target.blur();
                    }}
                    className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Sub trên video</span>
                </label>
              </div>

              {/* FontSize */}
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    setFontSize(prev => Math.max(12, prev - 2));
                    e.currentTarget.blur();
                  }}
                  className="w-5.5 h-5.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-[9px] flex items-center justify-center transition-all active:scale-95"
                  title="Giảm cỡ chữ"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setFontSize(prev => Math.min(24, prev + 2));
                    e.currentTarget.blur();
                  }}
                  className="w-5.5 h-5.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-[9px] flex items-center justify-center transition-all active:scale-95"
                  title="Tăng cỡ chữ"
                >
                  A+
                </button>
              </div>

              {/* Timing shifter */}
              {mode === "listen" && (
                <div className="flex items-center gap-1 border-l border-slate-200 pl-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      shiftAllSubtitles(-0.25);
                      e.currentTarget.blur();
                    }}
                    className="px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-105 text-red-650 font-bold text-[9px] transition-all active:scale-95"
                    title="Toàn bộ sub xuất hiện sớm hơn 0.25s"
                  >
                    -0.25s
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      shiftAllSubtitles(0.25);
                      e.currentTarget.blur();
                    }}
                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-105 text-emerald-655 font-bold text-[9px] transition-all active:scale-95"
                    title="Toàn bộ sub xuất hiện muộn hơn 0.25s"
                  >
                    +0.25s
                  </button>
                </div>
              )}

              {/* Help Circle Tooltip */}
              <div className="relative group border-l border-slate-200 pl-2.5">
                <button 
                  type="button" 
                  className="flex items-center justify-center w-5.5 h-5.5 text-slate-400 hover:text-indigo-650 transition-colors bg-white rounded border border-slate-200 shadow-sm"
                  title="Hướng dẫn phím tắt"
                >
                  <HelpCircle size={12} />
                </button>
                
                <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-xs rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none normal-case">
                  <p className="font-bold mb-2 text-indigo-300">Mẹo học nhanh bằng phím tắt:</p>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-350">
                    <li>Nhấn phím <strong className="text-white">n</strong> để chuyển qua câu tiếp theo.</li>
                    <li>Nhấn phím <strong className="text-white">v</strong> để quay lại câu trước đó.</li>
                    <li>Nhấn phím <strong className="text-white">b</strong> để nghe lại câu hiện tại.</li>
                    <li>Nhấn phím <strong className="text-white">Space</strong> hoặc phím <strong className="text-white">~</strong> (nút nằm giữa Esc và Tab) để Tạm dừng/Phát video.</li>
                    <li><em className="text-slate-400">Khi đang gõ chính tả:</em> nhấn giữ thêm phím <strong className="text-white">Alt</strong> (Alt + n, Alt + v, Alt + b, Alt + Space / Alt + ~).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional content */}
          {mode === "listen" ? (
            <div 
              ref={containerRef} 
              onClick={() => videoContainerRef.current?.focus()}
              className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin relative"
            >
              {subtitles.map((sub, idx) => {
                const isActive = currentIndex === idx;
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={idx}
                    ref={isActive ? activeSubRef : null}
                    onClick={() => !isEditing && playSubtitleRow(idx)}
                    className={`p-2.5 px-3.5 rounded-2xl border transition-all cursor-pointer group ${
                      isActive
                        ? "bg-red-50/80 border-red-200 shadow-md ring-1 ring-red-300"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-12 gap-x-3 gap-y-2">
                          {/* Row 1: Start Time, End Time, IPA */}
                          <div className="col-span-6 md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Thời gian bắt đầu</label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={editFields.start}
                                onChange={(e) => setEditFields({ ...editFields, start: e.target.value })}
                                className="flex-1 p-1.5 px-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-700 min-w-0"
                                placeholder="Ví dụ: 8:27.67"
                              />
                              <div className="flex flex-col gap-0.5 justify-center shrink-0">
                                <button type="button" onClick={() => adjustEditTime('start', 0.25)} className="px-1 py-0.5 text-[8px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-655" title="Tăng 0.25s">+</button>
                                <button type="button" onClick={() => adjustEditTime('start', -0.25)} className="px-1 py-0.5 text-[8px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-655" title="Giảm 0.25s">-</button>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-6 md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Thời gian kết thúc</label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={editFields.end}
                                onChange={(e) => setEditFields({ ...editFields, end: e.target.value })}
                                className="flex-1 p-1.5 px-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-700 min-w-0"
                                placeholder="Ví dụ: 8:30.80"
                              />
                              <div className="flex flex-col gap-0.5 justify-center shrink-0">
                                <button type="button" onClick={() => adjustEditTime('end', 0.25)} className="px-1 py-0.5 text-[8px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-655" title="Tăng 0.25s">+</button>
                                <button type="button" onClick={() => adjustEditTime('end', -0.25)} className="px-1 py-0.5 text-[8px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-655" title="Giảm 0.25s">-</button>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Phiên âm IPA</label>
                            <input
                              type="text"
                              value={editFields.ipa}
                              onChange={(e) => setEditFields({ ...editFields, ipa: e.target.value })}
                              className="w-full p-1.5 px-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-indigo-600"
                            />
                          </div>

                          {/* Row 2: English Text, Vietnamese Text */}
                          <div className="col-span-12 md:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Text tiếng Anh</label>
                            <textarea
                              value={editFields.text}
                              onChange={(e) => setEditFields({ ...editFields, text: e.target.value })}
                              rows={1.5}
                              className="w-full p-1.5 px-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-slate-800 resize-y min-h-[38px]"
                            />
                          </div>

                          <div className="col-span-12 md:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Dịch tiếng Việt</label>
                            <textarea
                              value={editFields.vietnamese}
                              onChange={(e) => setEditFields({ ...editFields, vietnamese: e.target.value })}
                              rows={1.5}
                              className="w-full p-1.5 px-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-600 resize-y min-h-[38px]"
                            />
                          </div>

                          {/* Row 3: Vocabulary Notes, Actions */}
                          <div className="col-span-12 md:col-span-9 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Giải thích từ vựng (Ghi chú)</label>
                            <textarea
                              value={editFields.note}
                              onChange={(e) => setEditFields({ ...editFields, note: e.target.value })}
                              rows={1.5}
                              className="w-full p-1.5 px-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-amber-700 font-medium resize-y min-h-[38px]"
                              placeholder="Ví dụ: * 'phrase': giải thích"
                            />
                          </div>

                          <div className="col-span-12 md:col-span-3 flex items-end justify-end gap-2 pb-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingIndex(null)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => saveLiveEdit(idx)}
                              disabled={isSavingEdit}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-100"
                            >
                              {isSavingEdit ? "Lưu..." : <><Check size={12} /> Lưu</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5 relative">
                        {/* Time tag */}
                        <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                          <span>{formatTimeDetailed(sub.start)} - {formatTimeDetailed(sub.end)}</span>
                          {isAdminMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(idx, sub);
                              }}
                              className="text-slate-400 hover:text-indigo-650 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100"
                              title="Sửa nhanh phụ đề dòng này"
                            >
                              <Edit size={12} />
                            </button>
                          )}
                        </div>
                        <p 
                          style={{ fontSize: `${fontSize}px` }}
                          className={`font-bold leading-snug ${isActive ? "text-red-600 font-black" : "text-slate-800"}`}
                        >
                          {sub.text}
                        </p>
                        {sub.ipa && showIpa && (
                          <p 
                            style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                            className="font-mono text-indigo-650/80 font-semibold"
                          >
                            {sub.ipa}
                          </p>
                        )}
                        {sub.vietnamese && (
                          <p 
                            style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                            className={`font-medium leading-snug ${isActive ? "text-red-500/90 font-semibold" : "text-slate-500"}`}
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
          ) : (
            <div className="flex-1 p-5 flex flex-col justify-between gap-4 min-h-0 overflow-y-auto">
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
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-[10px] flex items-center justify-center transition-all active:scale-95"
                          title="Giảm cỡ chữ"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-[10px] flex items-center justify-center transition-all active:scale-95"
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
                      className="font-mono text-indigo-650 font-semibold"
                    >
                      {subtitles[currentIndex]?.ipa}
                    </p>
                  )}
                  {subtitles[currentIndex]?.vietnamese && (
                    <p 
                      style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                      className="text-slate-605 leading-relaxed font-semibold italic"
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
                          className={`${isCorrect ? "text-emerald-600" : "text-red-500 bg-red-105"} transition-colors`}
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
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-755 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs shadow-md shadow-indigo-100"
                >
                  Tiếp Theo (Alt+n) <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
