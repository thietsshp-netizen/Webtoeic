/* src/components/Admin/AdminScreenRecorder/index.tsx */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { 
  Video, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  Square, 
  Settings, 
  FolderCheck, 
  FolderPlus, 
  FolderOpen,
  FileVideo,
  X, 
  CheckCircle2, 
  Sparkles,
  Camera,
  Image as ImageIcon,
  Trash2,
  FlipHorizontal,
  Sliders,
  Download,
  RotateCcw,
  Film,
  GripVertical,
  AlertTriangle
} from "lucide-react";
import { screenRecorderService, RecorderState, SaveResult, sanitizeFileName } from "@/lib/recorder/ScreenRecorderService";
import { getSavedDirectoryHandle } from "@/lib/recorder/DirectoryStorage";
import { 
  CameraSettings, 
  getCameraSettings, 
  saveCameraSettings, 
  saveVirtualBgImage, 
  getVirtualBgImage 
} from "@/lib/recorder/CameraStorage";
import { cameraProcessorService } from "@/lib/recorder/CameraProcessorService";
import { FloatingWebcamBubble } from "../FloatingWebcamBubble";
import { CropAreaSelectorOverlay, CropRect } from "../CropAreaSelectorOverlay";
import styles from "./styles.module.css";

// Helper lấy tên khóa học và bài học thực tế từ giao diện
function getCurrentLessonTitle(): string {
  if (typeof document === "undefined") return "BaiHoc";

  const isInvalid = (str: string | null | undefined): boolean => {
    if (!str) return true;
    const s = str.trim().toLowerCase();
    return (
      s === "" ||
      s.includes("nội dung khóa học") ||
      s.includes("đang tải") ||
      s.includes("dashboard") ||
      s.includes("hỗ trợ") ||
      s.includes("phân tích tiến độ") ||
      s.includes("bài trước") ||
      s.includes("bài tiếp")
    );
  };

  // 1. Lấy trực tiếp từ các element có gắn ID / data attribute chuyên dụng
  const lessonEl = document.getElementById("learn-lesson-title") || 
                   document.querySelector("[data-lesson-title]") ||
                   document.querySelector("[data-active-lesson-title]");
  const courseEl = document.getElementById("learn-course-title") || 
                   document.querySelector("[data-course-title]");

  const lessonName = lessonEl?.getAttribute("data-lesson-title") || 
                     lessonEl?.getAttribute("data-active-lesson-title") || 
                     lessonEl?.textContent?.trim() || "";

  const courseName = courseEl?.getAttribute("data-course-title") || 
                     courseEl?.textContent?.trim() || "";

  const validLesson = isInvalid(lessonName) ? "" : lessonName.trim();
  const validCourse = isInvalid(courseName) ? "" : courseName.trim();

  if (validCourse && validLesson) {
    if (validLesson.toLowerCase().includes(validCourse.toLowerCase())) {
      return validLesson;
    }
    return `${validCourse}_${validLesson}`;
  }
  if (validLesson) return validLesson;
  if (validCourse) return validCourse;

  // 2. Tìm kiếm trong khu vực nội dung bài học chính (#learn-workspace-container hoặc main), loại bỏ hoàn toàn Sidebar
  const workspaceEl = document.getElementById("learn-workspace-container") || document.querySelector("main");
  if (workspaceEl) {
    const headings = workspaceEl.querySelectorAll("h1, h2, h3, [class*='title']");
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      if (h.closest("aside") || h.closest("[class*='sidebar']") || h.closest("[class*='Sidebar']")) {
        continue;
      }
      const txt = h.textContent?.trim();
      if (txt && !isInvalid(txt) && txt.length > 2 && txt.length < 100) {
        return txt;
      }
    }
  }

  // 3. Tiêu đề từ document.title
  if (document.title && document.title.trim()) {
    const cleanDocTitle = document.title.split("|")[0].split("-")[0].trim();
    if (cleanDocTitle && !isInvalid(cleanDocTitle)) return cleanDocTitle;
  }

  return "BaiHoc";
}

export const AdminScreenRecorder: React.FC = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user && (session.user as any).role === "ADMIN";
  const pathname = usePathname();
  const isLearnPage = pathname?.startsWith("/learn/");

  // UI States
  const [activeTab, setActiveTab] = useState<"general" | "camera">("general");
  const [isOpenPanel, setIsOpenPanel] = useState(false);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [savedCompactResult, setSavedCompactResult] = useState<SaveResult | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [fatalErrorModal, setFatalErrorModal] = useState<string | null>(null);

  // Vị trí thanh điều khiển khi đang quay (Mặc định ở Header, có thể kéo thả tùy ý)
  const [barPos, setBarPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingBar = useRef(false);
  const dragBarStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const handlePointerDownBar = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) {
      return;
    }
    isDraggingBar.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    dragBarStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: barPos ? barPos.x : rect.left,
      startY: barPos ? barPos.y : rect.top,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveBar = (e: React.PointerEvent) => {
    if (!isDraggingBar.current) return;
    const deltaX = e.clientX - dragBarStart.current.mouseX;
    const deltaY = e.clientY - dragBarStart.current.mouseY;
    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 50;
    setBarPos({
      x: Math.max(10, Math.min(maxX, dragBarStart.current.startX + deltaX)),
      y: Math.max(5, Math.min(maxY, dragBarStart.current.startY + deltaY)),
    });
  };

  const handlePointerUpBar = (e: React.PointerEvent) => {
    if (isDraggingBar.current) {
      isDraggingBar.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Settings States
  const [folderName, setFolderName] = useState<string | null>(null);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [enableMic, setEnableMic] = useState<boolean>(true);
  const [enableFanFilter, setEnableFanFilter] = useState<boolean>(true);
  const [cropMode, setCropMode] = useState<"video" | "custom" | "full">("video");
  const [customCropRect, setCustomCropRect] = useState<CropRect | null>(null);
  const [isSelectingCrop, setIsSelectingCrop] = useState<boolean>(false);
  const [activeRecordingRect, setActiveRecordingRect] = useState<CropRect | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTabMuted, setIsTabMuted] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);

  // Camera States
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    enabled: false,
    size: 190,
    posX: 30,
    posY: 120,
    deviceId: "",
    isMirrored: true,
    bgMode: "normal",
    blurPercent: 60,
    borderWidth: 2,
    borderColor: "#ffffff",
  });
  const [virtualBgData, setVirtualBgData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Level Meters
  const [tabAudioLevel, setTabAudioLevel] = useState<number>(0);
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);

  // 1. Kiểm tra thư mục lưu & Cài đặt Camera từ IndexedDB
  useEffect(() => {
    if (!isAdmin) return;
    const checkSavedData = async () => {
      const handle = await getSavedDirectoryHandle();
      if (handle) setFolderName(handle.name);

      const camSet = await getCameraSettings();
      setCameraSettings(camSet);

      const bgImg = await getVirtualBgImage();
      setVirtualBgData(bgImg);
    };
    checkSavedData();
  }, [isAdmin]);

  // 2. Lấy danh sách Micro & Camera
  useEffect(() => {
    if (!isAdmin) return;
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === "audioinput");
        setMicDevices(mics);
        if (mics.length > 0 && !selectedMicId) {
          setSelectedMicId(mics[0].deviceId);
        }

        const cams = devices.filter((d) => d.kind === "videoinput");
        setCameraDevices(cams);
        if (cams.length > 0 && !cameraSettings.deviceId) {
          setCameraSettings((prev) => ({ ...prev, deviceId: cams[0].deviceId }));
        }
      } catch (err) {
        console.warn("[AdminScreenRecorder] enumerateDevices error:", err);
      }
    };
    loadDevices();
  }, [isAdmin, selectedMicId, cameraSettings.deviceId]);

  // 3. Đăng ký callbacks của ScreenRecorderService
  useEffect(() => {
    if (!isAdmin) return;

    screenRecorderService.onStateChange = (state) => {
      setRecorderState(state);
      if (state === "recording") {
        setIsOpenPanel(false);
      }
    };

    screenRecorderService.onTimeUpdate = (seconds) => {
      setRecordedSeconds(seconds);
    };

    let lastTab = -1;
    let lastMic = -1;
    screenRecorderService.onAudioLevels = (tabLvl, micLvl) => {
      if (
        Math.abs(tabLvl - lastTab) >= 3 || 
        Math.abs(micLvl - lastMic) >= 3 || 
        (tabLvl === 0 && lastTab !== 0) || 
        (micLvl === 0 && lastMic !== 0)
      ) {
        lastTab = tabLvl;
        lastMic = micLvl;
        setTabAudioLevel(tabLvl);
        setMicAudioLevel(micLvl);
      }
    };

    screenRecorderService.onError = (errorMsg) => {
      setFatalErrorModal(errorMsg);
      setRecorderState("idle");
      setRecordedSeconds(0);
      setActiveRecordingRect(null);
    };

    return () => {
      screenRecorderService.cleanup();
    };
  }, [isAdmin]);

  // Tự động cập nhật Khung Viền Chỉ Báo Vùng Quay Thực Tế khi đang quay
  useEffect(() => {
    if (recorderState !== "recording" && recorderState !== "paused") {
      setActiveRecordingRect(null);
      return;
    }

    const updateActiveRect = () => {
      if (cropMode === "custom" && customCropRect) {
        setActiveRecordingRect(customCropRect);
        return;
      }

      if (cropMode === "video") {
        const videoEl = document.getElementById("youtube-dictation-video-container") ||
                        document.querySelector("[data-crop-target='main-player']");
        if (videoEl) {
          const b = videoEl.getBoundingClientRect();
          if (b.width > 0 && b.height > 0) {
            setActiveRecordingRect({
              x: Math.round(b.left),
              y: Math.round(b.top),
              width: Math.round(b.width),
              height: Math.round(b.height),
            });
            return;
          }
        }
      }

      // Bài học không phải phim hoặc chế độ Toàn bài học
      const mainEl = document.getElementById("lesson-main-content") ||
                     document.querySelector("[data-crop-target='lesson-content']") ||
                     document.getElementById("learn-workspace-container") ||
                     document.querySelector("main");
      if (mainEl) {
        const b = mainEl.getBoundingClientRect();
        if (b.width > 0 && b.height > 0) {
          setActiveRecordingRect({
            x: Math.round(b.left),
            y: Math.round(b.top),
            width: Math.round(b.width),
            height: Math.round(b.height),
          });
          return;
        }
      }

      const headerEl = document.querySelector("header");
      const subHeaderEl = document.getElementById("lesson-sub-header");
      const topOffset = (headerEl ? headerEl.getBoundingClientRect().height : 56) +
                        (subHeaderEl ? subHeaderEl.getBoundingClientRect().height : 60);
      setActiveRecordingRect({
        x: 0,
        y: Math.round(topOffset),
        width: window.innerWidth,
        height: Math.max(100, window.innerHeight - Math.round(topOffset)),
      });
    };

    updateActiveRect();
    const interval = setInterval(updateActiveRect, 1000);
    window.addEventListener("resize", updateActiveRect);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateActiveRect);
    };
  }, [recorderState, cropMode, customCropRect]);

  if (!isAdmin) return null;

  // Format giây thành MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // Chọn hoặc đổi thư mục lưu trên máy tính
  const handleChangeSaveDirectory = async () => {
    try {
      const newName = await screenRecorderService.promptChangeSaveDirectory();
      if (newName) {
        setFolderName(newName);
      }
    } catch (err: any) {
      if (err?.message === "NOT_SUPPORTED") {
        alert(
          "⚠️ Trình duyệt của bạn không hỗ trợ tính năng chọn thư mục trực tiếp qua Web API (hoặc bạn đang truy cập qua địa chỉ HTTP thay vì localhost/https).\n\nVideo quay xong sẽ được tự động tải về thư mục Downloads mặc định trên máy tính của bạn."
        );
      } else {
        alert(`Không thể chọn thư mục: ${err?.message || "Lỗi không xác định"}`);
      }
    }
  };

  // Đặt lại về mặc định Downloads
  const handleResetSaveDirectory = async () => {
    await screenRecorderService.resetSaveDirectory();
    setFolderName(null);
  };

  // Cập nhật cài đặt camera
  const handleUpdateCamera = async (partial: Partial<CameraSettings>) => {
    const updated = { ...cameraSettings, ...partial };
    setCameraSettings(updated);
    await saveCameraSettings(partial);
    window.dispatchEvent(new CustomEvent("webtoeic-camera-settings-updated", { detail: partial }));
  };

  // Tải ảnh nền ảo lên
  const handleUploadBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setVirtualBgData(dataUrl);
        await saveVirtualBgImage(dataUrl);
        await cameraProcessorService.loadSavedBgImage();
        handleUpdateCamera({ bgMode: "image" });
      }
    };
    reader.readAsDataURL(file);
  };

  // Xóa ảnh nền ảo
  const handleClearBgImage = async () => {
    setVirtualBgData(null);
    await saveVirtualBgImage("");
    await cameraProcessorService.loadSavedBgImage();
    handleUpdateCamera({ bgMode: "normal" });
  };

  // Bắt đầu quay
  const handleStartRecording = async () => {
    setRecordedSeconds(0);
    setIsTabMuted(false);
    setIsMicMuted(false);
    const targetElementId = cropMode === "video" ? "youtube-dictation-video-container" : undefined;
    const currentLessonTitle = getCurrentLessonTitle();
    
    await screenRecorderService.start({
      micDeviceId: enableMic ? selectedMicId : undefined,
      enableMic,
      tabVolume: 1.0, // 100% chuẩn âm thanh thực tế
      micVolume: 1.0,
      enableFanFilter,
      cropMode,
      targetElementId,
      customCropRect: cropMode === "custom" && customCropRect ? customCropRect : undefined,
      lessonTitle: currentLessonTitle,
    });
  };

  // Tạm dừng
  const handlePause = () => {
    screenRecorderService.pause();
  };

  // Quay tiếp
  const handleResume = () => {
    screenRecorderService.resume();
  };

  // Bật/Tắt âm thanh Hệ thống/Bài giảng trực tiếp
  const handleToggleTabMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isTabMuted;
    setIsTabMuted(next);
    screenRecorderService.setTabMute(next);
  };

  // Bật/Tắt Micro Admin trực tiếp
  const handleToggleMicMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isMicMuted;
    setIsMicMuted(next);
    screenRecorderService.setMicMute(next);
  };

  // Dừng & Tự động lưu vào thư mục máy tính
  const handleStopAndSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const blob = await screenRecorderService.stop();
      if (blob) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
        const ext = blob.type.includes("mp4") ? ".mp4" : ".webm";
        const cleanTitle = sanitizeFileName(getCurrentLessonTitle());
        const fileName = `${cleanTitle}_${dateStr}${ext}`;
        
        const res = await screenRecorderService.autoSaveToDisk(blob, fileName);
        setSavedCompactResult(res);
        if (res.folderName) {
          setFolderName(res.folderName);
        }

        // Tự động mở bảng Cài đặt & Quản lý Video để Admin thấy ngay các nút phát sáng
        setIsOpenPanel(true);
      }
    } catch (err) {
      console.error("[AdminScreenRecorder] Error during stop & save:", err);
    } finally {
      setIsSaving(false);
      setRecorderState("idle");
    }
  };

  // Tải lại video về Downloads khi người dùng bấm nút
  const handleDownloadVideoCopy = () => {
    if (savedCompactResult?.blob && savedCompactResult?.fileName) {
      screenRecorderService.downloadBlob(savedCompactResult.blob, savedCompactResult.fileName);
    }
  };

  // Mở thư mục lưu file trực tiếp trong ứng dụng Finder của macOS
  const handleOpenFolder = async () => {
    try {
      const folderToOpen = savedCompactResult?.folderName || folderName || "Movies";
      const fileToReveal = savedCompactResult?.fileName || undefined;

      const res = await fetch("/api/admin/open-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderName: folderToOpen,
          fileName: fileToReveal,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (data && data.success) {
        return; // Đã mở thành công cửa sổ Finder gốc trên macOS!
      }
    } catch (apiErr) {
      console.warn("[AdminScreenRecorder] Native open-folder API error:", apiErr);
    }

    // Fallback nếu môi trường cloud
    try {
      const dirHandle = await getSavedDirectoryHandle();
      if (dirHandle && typeof (window as any).showDirectoryPicker === "function") {
        await (window as any).showDirectoryPicker({
          mode: "readwrite",
          startIn: dirHandle,
        });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("[AdminScreenRecorder] showDirectoryPicker error:", err);
      }
    }
  };

  return (
    <>
      {/* Khung Camera Tròn Nổi Draggable */}
      <FloatingWebcamBubble 
        isRecording={recorderState === "recording" || recorderState === "paused"}
        isPreviewing={isOpenPanel}
        onOpenSettings={() => { setIsOpenPanel(true); setActiveTab("camera"); }} 
      />

      {/* 1. Nút máy quay trên thanh Header (cạnh nút điểm danh) */}
      {recorderState === "idle" && (
        <button
          onClick={(e) => {
            setIsOpenPanel(!isOpenPanel);
            e.currentTarget.blur();
          }}
          style={{
            position: "fixed",
            top: isLearnPage ? "9px" : "14px",
            right: isLearnPage ? "262px" : "108px",
            zIndex: 1000000005,
          }}
          className={`${styles.headerTriggerBtn} ${isOpenPanel ? styles.headerTriggerBtnActive : ""}`}
          title="Quay video bài giảng (Admin Only)"
        >
          <Video size={18} />
          {savedCompactResult && <div className={styles.greenSavedDot} />}
          <span className={styles.btnTooltip}>Quay video</span>
        </button>
      )}

      {/* 2. Bảng cài đặt & Quản lý video (Settings Dropdown) */}
      {isOpenPanel && recorderState === "idle" && (
        <div 
          className={styles.panelOverlay}
          style={{
            top: isLearnPage ? "56px" : "60px",
            right: isLearnPage ? "140px" : "24px",
          }}
        >
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <Video size={18} className="text-red-500" />
              <span>Quay Video Bài Giảng</span>
            </div>
            <button onClick={() => setIsOpenPanel(false)} className={styles.closeBtn}>
              <X size={16} />
            </button>
          </div>

          {/* Video vừa lưu phát sáng nổi bật ngay trong thanh công cụ */}
          {savedCompactResult && (
            <div className={styles.savedVideoGlowCard}>
              <div className={styles.savedVideoHeader}>
                <div className={styles.savedVideoBadge}>
                  <CheckCircle2 size={15} />
                  <span>Đã lưu video thành công</span>
                  {savedCompactResult.fileSize && (
                    <span className="text-[10px] text-emerald-300 font-mono font-medium">({savedCompactResult.fileSize})</span>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => setSavedCompactResult(null)} 
                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title="Ẩn thông tin video này"
                >
                  <X size={13} />
                </button>
              </div>

              <div className={styles.savedVideoDetails}>
                <div className={styles.savedVideoFileName} title={savedCompactResult.fileName}>
                  <FileVideo size={13} className="text-blue-400 shrink-0" />
                  <span className="truncate">{savedCompactResult.fileName}</span>
                </div>
                <div className={styles.savedVideoFolder} title={savedCompactResult.folderName ? `Thư mục "${savedCompactResult.folderName}"` : "Thư mục Downloads"}>
                  <FolderCheck size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {savedCompactResult.folderName ? `Thư mục "${savedCompactResult.folderName}"` : "Thư mục Downloads"}
                  </span>
                </div>
              </div>

              <div className={styles.savedVideoActions}>
                <button
                  type="button"
                  onClick={handleOpenFolder}
                  className={styles.openFolderHighlightBtn}
                  title="Mở thư mục lưu các video trên máy Mac"
                >
                  <FolderOpen size={14} />
                  <span>Mở thư mục lưu</span>
                </button>

                {savedCompactResult.blobUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewVideoUrl(savedCompactResult.blobUrl || null)}
                    className={styles.previewVideoBtn}
                    title="Xem lại video vừa quay"
                  >
                    <Film size={13} />
                    <span>Xem video</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadVideoCopy}
                  className={styles.downloadCopyBtn}
                  title="Tải thêm 1 bản về Downloads"
                >
                  <Download size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className={styles.tabNav}>
            <button
              onClick={() => setActiveTab("general")}
              className={`${styles.tabBtn} ${activeTab === "general" ? styles.tabBtnActive : ""}`}
            >
              <Sliders size={13} />
              <span>Quay & Âm thanh</span>
            </button>
            <button
              onClick={() => setActiveTab("camera")}
              className={`${styles.tabBtn} ${activeTab === "camera" ? styles.tabBtnActive : ""}`}
            >
              <Camera size={13} />
              <span>Camera Giảng Viên</span>
            </button>
          </div>

          {/* TAB 1: Cài đặt Quay & Âm thanh */}
          {activeTab === "general" && (
            <div className={styles.settingSection}>
              {/* Cài đặt thư mục lưu */}
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span>Thư mục lưu trên máy tính</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Tự động lưu</span>
                </div>
                <div className={styles.folderBox}>
                  <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    {folderName ? <FolderCheck size={16} className="text-emerald-400 shrink-0" /> : <Download size={16} className="text-blue-400 shrink-0" />}
                    <span className={styles.folderName} title={folderName ? `Thư mục: ${folderName}` : "Mặc định (Tải về Downloads)"}>
                      {folderName || "Mặc định (Downloads)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={handleChangeSaveDirectory} className={styles.changeFolderBtn}>
                      {folderName ? "Đổi" : "Chọn thư mục"}
                    </button>
                    {folderName && (
                      <button 
                        onClick={handleResetSaveDirectory} 
                        className="p-1 text-slate-400 hover:text-red-300 hover:bg-slate-700/60 rounded transition-colors"
                        title="Đặt lại về mặc định (Downloads)"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {folderName 
                    ? `💡 Video sẽ tự động lưu thẳng vào thư mục "${folderName}" trên máy Mac của bạn.` 
                    : "💡 Video sẽ được tự động tải về thư mục Downloads mặc định của máy tính sau khi quay xong."}
                </div>
              </div>

              {/* Cài đặt Khung hình (3 Chế độ: Khóa Video / Tự vẽ khung / Toàn bài học - Bỏ Header) */}
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span>Khu vực quay</span>
                  <span className="text-blue-400 font-normal">
                    {cropMode === "video" ? "Khóa video & sub" : cropMode === "custom" ? "Tự vẽ khung" : "Toàn bài học (Bỏ Header)"}
                  </span>
                </div>
                <div className={styles.cropModeSelector}>
                  <button
                    type="button"
                    onClick={() => setCropMode("video")}
                    className={`${styles.cropModeCard} ${cropMode === "video" ? styles.cropModeCardActive : ""}`}
                    title="Tự động khóa theo khung video bài giảng và phụ đề (nếu không có video sẽ quay toàn bài học bỏ Header)"
                  >
                    <span className="text-sm">🎯</span>
                    <span>Khóa Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCropMode("custom");
                      if (!customCropRect) {
                        setIsSelectingCrop(true);
                      }
                    }}
                    className={`${styles.cropModeCard} ${cropMode === "custom" ? styles.cropModeCardActive : ""}`}
                    title="Tự kéo chuột vẽ khung chữ nhật vùng quay tùy ý (Loại bỏ Header và thanh công cụ)"
                  >
                    <span className="text-sm">📐</span>
                    <span>Tự vẽ khung</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropMode("full")}
                    className={`${styles.cropModeCard} ${cropMode === "full" ? styles.cropModeCardActive : ""}`}
                    title="Quay toàn bộ không gian bài học (Tự động cắt bỏ thanh Header và thanh điều khiển quay)"
                  >
                    <span className="text-sm">🖥️</span>
                    <span>Toàn bài học</span>
                  </button>
                </div>

                {/* Chi tiết khung vẽ nếu chọn Tự vẽ khung */}
                {cropMode === "custom" && (
                  <div className={styles.customCropBox}>
                    {customCropRect ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Đã chọn:</span>
                          <span className="font-mono text-blue-400 font-bold">
                            {Math.round(customCropRect.width)} × {Math.round(customCropRect.height)} px
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsSelectingCrop(true)}
                          className={styles.changeFolderBtn}
                        >
                          Vẽ lại
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSelectingCrop(true)}
                        className="w-full py-2 px-3 border border-dashed border-blue-500/50 hover:border-blue-400 rounded-lg text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5 bg-blue-950/20 transition-all"
                      >
                        <span>✏️</span>
                        <span>Bấm vào đây để kéo chuột vẽ khung</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Cài đặt Micro */}
              <div className={styles.settingRow}>
                <label className={styles.toggleRow}>
                  <span className="flex items-center gap-1.5">
                    {enableMic ? <Mic size={14} className="text-emerald-400" /> : <MicOff size={14} className="text-slate-400" />}
                    Thu âm giọng nói qua Micro
                  </span>
                  <input
                    type="checkbox"
                    checked={enableMic}
                    onChange={(e) => setEnableMic(e.target.checked)}
                    className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                </label>

                {enableMic && (
                  <>
                    <select
                      value={selectedMicId}
                      onChange={(e) => setSelectedMicId(e.target.value)}
                      className={styles.selectInput}
                    >
                      {micDevices.map((mic) => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                          {mic.label || `Microphone (${mic.deviceId.slice(0, 5)}...)`}
                        </option>
                      ))}
                    </select>

                    {/* Lọc tiếng quạt iMac */}
                    <label className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 cursor-pointer">
                      <span className="flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-400" />
                        Lọc tiếng quạt iMac & tạp âm nền
                      </span>
                      <input
                        type="checkbox"
                        checked={enableFanFilter}
                        onChange={(e) => setEnableFanFilter(e.target.checked)}
                        className="rounded accent-amber-500 w-3.5 h-3.5"
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Âm lượng hệ thống / bài giảng 100% chuẩn */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Volume2 size={13} className="text-blue-400" />
                  Âm thanh bài giảng:
                </span>
                <span className="font-semibold text-slate-200">100% (Chuẩn máy tính)</span>
              </div>
            </div>
          )}

          {/* TAB 2: Cài đặt Camera Giảng Viên */}
          {activeTab === "camera" && (
            <div className={styles.settingSection}>
              {/* Bật/Tắt Camera */}
              <div className={styles.settingRow}>
                <label className={styles.toggleRow}>
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Camera size={15} className="text-blue-400" />
                    Hiển thị Camera tròn nổi
                  </span>
                  <input
                    type="checkbox"
                    checked={cameraSettings.enabled}
                    onChange={(e) => handleUpdateCamera({ enabled: e.target.checked })}
                    className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {cameraSettings.enabled && (
                <>
                  {/* Chọn thiết bị Camera */}
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>Chọn Camera</div>
                    <select
                      value={cameraSettings.deviceId}
                      onChange={(e) => handleUpdateCamera({ deviceId: e.target.value })}
                      className={styles.selectInput}
                    >
                      {cameraDevices.map((cam) => (
                        <option key={cam.deviceId} value={cam.deviceId}>
                          {cam.label || `Camera (${cam.deviceId.slice(0, 5)}...)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kích thước hình tròn (80px - 500px) */}
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Kích thước khung camera</span>
                      <span className="text-blue-400 font-mono">{cameraSettings.size}px</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={450}
                      step={10}
                      value={cameraSettings.size}
                      onChange={(e) => handleUpdateCamera({ size: Number(e.target.value) })}
                      className={styles.rangeSlider}
                    />
                  </div>

                  {/* Chế độ Nền (Normal / Blur / Image) */}
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>Chế độ Nền (Virtual Background)</div>
                    <div className={styles.bgModeSelector}>
                      <button
                        onClick={() => handleUpdateCamera({ bgMode: "normal" })}
                        className={`${styles.bgModeCard} ${cameraSettings.bgMode === "normal" ? styles.bgModeCardActive : ""}`}
                      >
                        <span>🌿</span>
                        <span>Nền gốc</span>
                      </button>
                      <button
                        onClick={() => handleUpdateCamera({ bgMode: "blur" })}
                        className={`${styles.bgModeCard} ${cameraSettings.bgMode === "blur" ? styles.bgModeCardActive : ""}`}
                      >
                        <span>🌫️</span>
                        <span>Mờ nền</span>
                      </button>
                      <button
                        onClick={() => handleUpdateCamera({ bgMode: "image" })}
                        className={`${styles.bgModeCard} ${cameraSettings.bgMode === "image" ? styles.bgModeCardActive : ""}`}
                      >
                        <span>🖼️</span>
                        <span>Ảnh nền ảo</span>
                      </button>
                    </div>
                  </div>

                  {/* Thanh trượt Độ mờ % khi chọn Mờ nền */}
                  {cameraSettings.bgMode === "blur" && (
                    <div className={styles.settingRow}>
                      <div className={styles.settingLabel}>
                        <span>Mức độ mờ nền</span>
                        <span className="text-amber-400 font-mono">{cameraSettings.blurPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={cameraSettings.blurPercent}
                        onChange={(e) => handleUpdateCamera({ blurPercent: Number(e.target.value) })}
                        className={styles.rangeSlider}
                      />
                    </div>
                  )}

                  {/* Tải & Xem trước ảnh nền ảo */}
                  {cameraSettings.bgMode === "image" && (
                    <div className={styles.settingRow}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadBgImage}
                        className="hidden"
                      />
                      {virtualBgData ? (
                        <div className={styles.bgPreviewBox}>
                          <div className="flex items-center gap-2">
                            <img src={virtualBgData} alt="Ảnh nền ảo" className={styles.bgThumb} />
                            <span className="text-[11px] text-slate-300 truncate max-w-[140px]">Ảnh nền đã lưu</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className={styles.changeFolderBtn}
                            >
                              Đổi ảnh
                            </button>
                            <button
                              onClick={handleClearBgImage}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded"
                              title="Xóa ảnh nền"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2.5 px-3 border border-dashed border-blue-500/50 hover:border-blue-400 rounded-lg text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5 bg-blue-950/20 transition-all"
                        >
                          <ImageIcon size={14} />
                          <span>Tải ảnh nền lên (Lưu vĩnh viễn)</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tùy chỉnh Viền Camera (Độ dày & Màu sắc) */}
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Độ dày viền camera</span>
                      <span className="text-white font-mono">{cameraSettings.borderWidth ?? 2}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={6}
                      step={0.5}
                      value={cameraSettings.borderWidth ?? 2}
                      onChange={(e) => handleUpdateCamera({ borderWidth: Number(e.target.value) })}
                      className={styles.rangeSlider}
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">Màu viền:</span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { color: "#ffffff", title: "Trắng (Mặc định)" },
                          { color: "#3b82f6", title: "Xanh dương" },
                          { color: "#10b981", title: "Xanh ngọc" },
                          { color: "#f59e0b", title: "Vàng cam" },
                          { color: "#a855f7", title: "Tím" },
                          { color: "#ef4444", title: "Đỏ" },
                        ].map((c) => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => handleUpdateCamera({ borderColor: c.color })}
                            title={c.title}
                            className={`w-4 h-4 rounded-full border transition-transform ${
                              (cameraSettings.borderColor || "#ffffff").toLowerCase() === c.color.toLowerCase()
                                ? "scale-125 border-white ring-2 ring-blue-500/60"
                                : "border-slate-500/50 hover:scale-110"
                            }`}
                            style={{ backgroundColor: c.color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={cameraSettings.borderColor || "#ffffff"}
                          onChange={(e) => handleUpdateCamera({ borderColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                          title="Tự chọn màu tùy ý"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lật gương Mirror */}
                  <label className="flex items-center justify-between text-[11px] text-slate-300 pt-1 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <FlipHorizontal size={13} className="text-blue-400" />
                      Lật gương (Mirror mode)
                    </span>
                    <input
                      type="checkbox"
                      checked={cameraSettings.isMirrored}
                      onChange={(e) => handleUpdateCamera({ isMirrored: e.target.checked })}
                      className="rounded accent-blue-600 w-3.5 h-3.5"
                    />
                  </label>
                </>
              )}
            </div>
          )}

          <button onClick={handleStartRecording} className={styles.recordActionBtn}>
            <div className={styles.redDot} />
            <span>Bắt Đầu Quay</span>
          </button>
        </div>
      )}

      {/* 3. Thanh điều khiển nổi khi ĐANG QUAY / TẠM DỪNG (Mặc định ở Header, Draggable) */}
      {(recorderState === "recording" || recorderState === "paused") && (
        <div 
          onPointerDown={handlePointerDownBar}
          onPointerMove={handlePointerMoveBar}
          onPointerUp={handlePointerUpBar}
          style={
            barPos
              ? {
                  position: "fixed",
                  left: `${barPos.x}px`,
                  top: `${barPos.y}px`,
                  bottom: "auto",
                  right: "auto",
                  zIndex: 1000000010,
                }
              : {
                  position: "fixed",
                  top: isLearnPage ? "8px" : "12px",
                  right: isLearnPage ? "312px" : "156px",
                  bottom: "auto",
                  left: "auto",
                  zIndex: 1000000010,
                }
          }
          className={`${styles.activeRecordingBar} ${recorderState === "paused" ? styles.activeRecordingBarPaused : ""}`}
          title="Kéo chuột để di chuyển thanh công cụ"
        >
          <GripVertical size={14} className="text-slate-400 opacity-60 hover:opacity-100 shrink-0 cursor-grab" />

          <div className="flex items-center gap-2">
            <div className={`${styles.redDot} ${recorderState === "recording" ? styles.pulsingDot : "bg-amber-400 shadow-amber-400"}`} />
            <span className={styles.timerText}>{formatTime(recordedSeconds)}</span>
          </div>

          {/* Âm lượng Hệ thống & Mic kèm Icon Loa/Mic Bật/Tắt nhanh 1-Click */}
          <div className="hidden sm:flex flex-col gap-1.5">
            {/* Dải 1: Âm thanh hệ thống / bài giảng */}
            <div className="flex items-center gap-1.5" title={isTabMuted ? "Âm thanh bài giảng đang tắt (Bấm để bật)" : "Âm thanh bài giảng đang bật (Bấm để tắt)"}>
              <button
                type="button"
                onClick={handleToggleTabMute}
                className="p-0.5 hover:bg-slate-700/60 rounded text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                title={isTabMuted ? "Bật âm thanh bài giảng" : "Tắt âm thanh bài giảng"}
              >
                {isTabMuted ? (
                  <VolumeX size={13} className="text-red-400 hover:text-red-300" />
                ) : (
                  <Volume2 size={13} className="text-blue-400 hover:text-blue-300" />
                )}
              </button>
              <div className={styles.meterContainer}>
                <div className={styles.meterFill} style={{ width: isTabMuted ? "0%" : `${tabAudioLevel}%` }} />
              </div>
            </div>

            {/* Dải 2: Micro Admin */}
            {enableMic && (
              <div className="flex items-center gap-1.5" title={isMicMuted ? "Micro Admin đang tắt (Bấm để bật)" : "Micro Admin đang bật (Bấm để tắt)"}>
                <button
                  type="button"
                  onClick={handleToggleMicMute}
                  className="p-0.5 hover:bg-slate-700/60 rounded text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                  title={isMicMuted ? "Bật Micro Admin" : "Tắt Micro Admin"}
                >
                  {isMicMuted ? (
                    <MicOff size={13} className="text-red-400 hover:text-red-300" />
                  ) : (
                    <Mic size={13} className="text-emerald-400 hover:text-emerald-300" />
                  )}
                </button>
                <div className={styles.meterContainer}>
                  <div className={styles.meterFill} style={{ width: isMicMuted ? "0%" : `${micAudioLevel}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Nút Tạm dừng / Tiếp tục */}
          {recorderState === "recording" ? (
            <button onClick={handlePause} className={`${styles.barBtn} ${styles.pauseBtn}`} title="Tạm dừng quay">
              <Pause size={15} />
            </button>
          ) : (
            <button onClick={handleResume} className={`${styles.barBtn} ${styles.resumeBtn}`} title="Tiếp tục quay">
              <Play size={15} />
            </button>
          )}

          {/* Nút Dừng & Tự động lưu */}
          <button 
            onClick={handleStopAndSave} 
            disabled={isSaving}
            className={`${styles.stopBtn} ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`} 
            title="Dừng và lưu video"
          >
            <Square size={12} fill="currentColor" />
            <span>{isSaving ? "Đang lưu..." : "Dừng & Lưu"}</span>
          </button>
        </div>
      )}

      {/* 5. Modal Xem trước Video vừa quay */}
      {previewVideoUrl && (
        <div className={styles.videoPreviewOverlay} onClick={() => setPreviewVideoUrl(null)}>
          <div className={styles.videoPreviewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.videoPreviewHeader}>
              <div className="flex items-center gap-2">
                <Film size={18} className="text-blue-400" />
                <span>Xem lại video bài giảng vừa quay</span>
              </div>
              <button onClick={() => setPreviewVideoUrl(null)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <video
              src={previewVideoUrl}
              controls
              autoPlay
              className={styles.videoPlayer}
            />

            <div className={styles.videoPreviewFooter}>
              <button
                onClick={handleDownloadVideoCopy}
                className={styles.primaryActionBtn}
                style={{ width: "auto" }}
              >
                <Download size={15} />
                <span>Tải về máy (Downloads)</span>
              </button>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className={styles.secondaryActionBtn}
                style={{ width: "auto" }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Khung viền chỉ báo trực quan VÙNG ĐANG THU HÌNH THỰC TẾ (Nằm chính xác ngoài mép vùng quay) */}
      {(recorderState === "recording" || recorderState === "paused") && activeRecordingRect && (
        <div
          style={{
            position: "fixed",
            left: `${Math.max(0, activeRecordingRect.x - 2)}px`,
            top: `${Math.max(0, activeRecordingRect.y - 2)}px`,
            width: `${activeRecordingRect.width + 4}px`,
            height: `${activeRecordingRect.height + 4}px`,
            border: "2px solid #ef4444",
            boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 0 8px rgba(239, 68, 68, 0.15)",
            borderRadius: "6px",
            pointerEvents: "none",
            zIndex: 999999999,
            transition: "all 0.15s ease",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-20px",
              left: "4px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "9px",
              fontWeight: 900,
              padding: "1px 6px",
              borderRadius: "3px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.4)",
            }}
          >
            REC • KHUNG HÌNH VIDEO
          </div>
        </div>
      )}

      {/* 6. Khung kéo chuột chọn vùng quay tùy chỉnh */}
      <CropAreaSelectorOverlay
        isActive={isSelectingCrop}
        onConfirm={(rect) => {
          setCustomCropRect(rect);
          setIsSelectingCrop(false);
        }}
        onCancel={() => {
          setIsSelectingCrop(false);
        }}
      />

      {/* 7. Modal Cảnh Báo Lỗi Khẩn Cấp - Dừng quay ngay lập tức để Admin không giảng bài uổng công */}
      {fatalErrorModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000000020,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setFatalErrorModal(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "linear-gradient(135deg, rgba(30, 20, 20, 0.98), rgba(20, 10, 10, 0.98))",
              border: "2px solid #ef4444",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.4), 0 0 30px rgba(239, 68, 68, 0.25)",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#f87171", margin: 0, lineHeight: 1.3 }}>
                  ĐÃ DỪNG GHI HÌNH VÌ GẶP LỖI!
                </h3>
                <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "4px 0 0 0" }}>
                  Hệ thống đã tự động ngắt để bảo vệ công sức giảng bài của bạn.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.55)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "13px",
                color: "#fca5a5",
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              <strong style={{ color: "#f87171" }}>Chi tiết lỗi:</strong>
              <div style={{ marginTop: "4px", fontFamily: "monospace", fontSize: "12px", color: "#fecaca" }}>
                {fatalErrorModal}
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.4 }}>
              💡 <strong>Lưu ý:</strong> Vui lòng không tiếp tục giảng bài cho đến khi đã khắc phục hoặc bắt đầu lại phiên quay thành công.
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={() => {
                  setFatalErrorModal(null);
                  setIsOpenPanel(true);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                }}
              >
                Mở Cài Đặt & Thử Lại
              </button>
              <button
                onClick={() => setFatalErrorModal(null)}
                style={{
                  padding: "10px 16px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#e2e8f0",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
