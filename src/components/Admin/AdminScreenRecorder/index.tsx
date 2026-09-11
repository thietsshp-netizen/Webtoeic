/* src/components/Admin/AdminScreenRecorder/index.tsx */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
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
  Film
} from "lucide-react";
import { screenRecorderService, RecorderState, SaveResult } from "@/lib/recorder/ScreenRecorderService";
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

export const AdminScreenRecorder: React.FC = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user && (session.user as any).role === "ADMIN";

  // UI States
  const [activeTab, setActiveTab] = useState<"general" | "camera">("general");
  const [isOpenPanel, setIsOpenPanel] = useState(false);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [savedCompactResult, setSavedCompactResult] = useState<SaveResult | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const compactTimerRef = useRef<any>(null);

  // Settings States
  const [folderName, setFolderName] = useState<string | null>(null);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [enableMic, setEnableMic] = useState<boolean>(true);
  const [enableFanFilter, setEnableFanFilter] = useState<boolean>(true);
  const [cropMode, setCropMode] = useState<"video" | "custom" | "full">("video");
  const [customCropRect, setCustomCropRect] = useState<CropRect | null>(null);
  const [isSelectingCrop, setIsSelectingCrop] = useState<boolean>(false);
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
      alert(`[Lỗi ghi hình]: ${errorMsg}`);
    };

    return () => {
      screenRecorderService.cleanup();
    };
  }, [isAdmin]);

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
    
    await screenRecorderService.start({
      micDeviceId: enableMic ? selectedMicId : undefined,
      enableMic,
      tabVolume: 1.0, // 100% chuẩn âm thanh thực tế
      micVolume: 1.0,
      enableFanFilter,
      cropMode,
      targetElementId,
      customCropRect: cropMode === "custom" && customCropRect ? customCropRect : undefined,
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
        const fileName = `HocToeic_Lesson_${dateStr}${ext}`;
        
        const res = await screenRecorderService.autoSaveToDisk(blob, fileName);
        setSavedCompactResult(res);
        if (res.folderName) {
          setFolderName(res.folderName);
        }

        // Tự động biến mất sau 7 giây, không bắt người dùng phải bấm tắt thủ công
        if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
        compactTimerRef.current = setTimeout(() => {
          setSavedCompactResult(null);
        }, 7000);
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

  // Mở thư mục lưu file trên máy Mac
  const handleOpenFolder = async () => {
    try {
      const dirHandle = await getSavedDirectoryHandle();
      if (dirHandle && typeof (window as any).showDirectoryPicker === "function") {
        await (window as any).showDirectoryPicker({
          mode: "readwrite",
          startIn: dirHandle,
        });
      } else if (typeof (window as any).showDirectoryPicker === "function") {
        await (window as any).showDirectoryPicker({
          mode: "readwrite",
          startIn: "downloads",
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

      {/* 1. Nút nổi mở bảng cài đặt quay khi ở trạng thái Idle */}
      {recorderState === "idle" && (
        <button
          onClick={() => setIsOpenPanel(!isOpenPanel)}
          className={styles.floatingTrigger}
          title="Mở công cụ quay bài giảng (Admin Only)"
        >
          <div className={`${styles.redDot} ${styles.pulsingDot}`} />
          <span>Quay Video</span>
          <Settings size={14} className="opacity-70" />
        </button>
      )}

      {/* 2. Bảng cài đặt trước khi quay (Settings Modal) */}
      {isOpenPanel && recorderState === "idle" && (
        <div className={styles.panelOverlay}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <Video size={18} className="text-red-500" />
              <span>Quay Video Bài Giảng</span>
            </div>
            <button onClick={() => setIsOpenPanel(false)} className={styles.closeBtn}>
              <X size={16} />
            </button>
          </div>

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

              {/* Cài đặt Khung hình (3 Chế độ: Khóa Video / Tự vẽ khung / Toàn bộ Tab) */}
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span>Khu vực quay</span>
                  <span className="text-blue-400 font-normal">
                    {cropMode === "video" ? "Khóa video & sub" : cropMode === "custom" ? "Tự vẽ khung" : "Toàn bộ Tab"}
                  </span>
                </div>
                <div className={styles.cropModeSelector}>
                  <button
                    type="button"
                    onClick={() => setCropMode("video")}
                    className={`${styles.cropModeCard} ${cropMode === "video" ? styles.cropModeCardActive : ""}`}
                    title="Tự động khóa theo khung video bài giảng và thẻ từ vựng"
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
                    title="Tự kéo chuột vẽ khung chữ nhật vùng quay tùy ý"
                  >
                    <span className="text-sm">📐</span>
                    <span>Tự vẽ khung</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropMode("full")}
                    className={`${styles.cropModeCard} ${cropMode === "full" ? styles.cropModeCardActive : ""}`}
                    title="Quay toàn bộ giao diện tab trình duyệt"
                  >
                    <span className="text-sm">🖥️</span>
                    <span>Toàn Tab</span>
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

      {/* 3. Thanh điều khiển nổi khi ĐANG QUAY / TẠM DỪNG */}
      {(recorderState === "recording" || recorderState === "paused") && (
        <div className={`${styles.activeRecordingBar} ${recorderState === "paused" ? styles.activeRecordingBarPaused : ""}`}>
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
              <Pause size={16} />
            </button>
          ) : (
            <button onClick={handleResume} className={`${styles.barBtn} ${styles.resumeBtn}`} title="Tiếp tục quay">
              <Play size={16} />
            </button>
          )}

          {/* Nút Dừng & Tự động lưu */}
          <button 
            onClick={handleStopAndSave} 
            disabled={isSaving}
            className={`${styles.stopBtn} ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`} 
            title="Dừng và lưu video"
          >
            <Square size={13} fill="currentColor" />
            <span>{isSaving ? "Đang lưu..." : "Dừng & Lưu"}</span>
          </button>
        </div>
      )}

      {/* 4. Thông báo Lưu video nhỏ gọn (Capsule) ở góc phải dưới (Không che màn hình xem phim) */}
      {savedCompactResult && (
        <div className={styles.compactSavedBar}>
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <div className={styles.compactTextContainer}>
            <div className={styles.compactTitle}>
              <span>✓ Đã lưu video</span>
              {savedCompactResult.fileSize && (
                <span className={styles.compactSizeTag}>({savedCompactResult.fileSize})</span>
              )}
            </div>
            {/* Tên file */}
            <div className={styles.compactFileName} title={savedCompactResult.fileName}>
              <FileVideo size={12} className="text-blue-400 shrink-0" />
              <span>{savedCompactResult.fileName}</span>
            </div>
            {/* Tên thư mục */}
            <div className={styles.compactSub} title={savedCompactResult.folderName ? `Thư mục "${savedCompactResult.folderName}"` : "Thư mục Downloads"}>
              <FolderCheck size={12} className="text-emerald-400 shrink-0" />
              <span>{savedCompactResult.folderName ? `Thư mục "${savedCompactResult.folderName}"` : `Thư mục Downloads`}</span>
            </div>
          </div>

          <div className={styles.compactActions}>
            {savedCompactResult.blobUrl && (
              <button
                type="button"
                onClick={() => setPreviewVideoUrl(savedCompactResult.blobUrl || null)}
                className={styles.compactActionBtn}
                title="Xem lại video vừa quay"
              >
                <Film size={12} />
                <span>Xem video</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenFolder}
              className={styles.compactActionBtn}
              title="Mở thư mục lưu file trên máy"
            >
              <FolderOpen size={12} />
              <span>Mở thư mục</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
                setSavedCompactResult(null);
              }}
              className={styles.compactCloseBtn}
              title="Đóng thông báo"
            >
              <X size={13} />
            </button>
          </div>
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
    </>
  );
};
