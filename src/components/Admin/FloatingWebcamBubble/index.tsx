/* src/components/Admin/FloatingWebcamBubble/index.tsx */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { FlipHorizontal, X, Settings2, Scaling } from "lucide-react";
import { cameraProcessorService } from "@/lib/recorder/CameraProcessorService";
import { CameraSettings, getCameraSettings, saveCameraSettings } from "@/lib/recorder/CameraStorage";
import styles from "./styles.module.css";

interface FloatingWebcamBubbleProps {
  onOpenSettings?: () => void;
  isRecording?: boolean;
  isPreviewing?: boolean;
}

export const FloatingWebcamBubble: React.FC<FloatingWebcamBubbleProps> = ({ 
  onOpenSettings,
  isRecording = false,
  isPreviewing = false,
}) => {
  const { data: session } = useSession();
  const isAdmin = session?.user && (session.user as any).role === "ADMIN";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  const [settings, setSettings] = useState<CameraSettings | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Chỉ kích hoạt camera khi Admin bật VÀ đang quay hoặc đang mở bảng cài đặt (preview)
  const shouldActive = isAdmin && Boolean(settings?.enabled) && (isRecording || isPreviewing);

  // Dragging refs
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 30,
    initialY: 120,
  });

  // Resizing refs
  const resizeStartRef = useRef<{ mouseX: number; initialSize: number }>({
    mouseX: 0,
    initialSize: 190,
  });

  // 1. Tải cài đặt & Lắng nghe sự kiện bật/tắt camera
  useEffect(() => {
    if (!isAdmin) return;

    const loadSettings = async () => {
      const s = await getCameraSettings();
      setSettings(s);
    };
    loadSettings();

    const handleCameraToggle = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const updated = await getCameraSettings();
      if (customEvent.detail) {
        setSettings({ ...updated, ...customEvent.detail });
      } else {
        setSettings({ ...updated });
      }
    };

    window.addEventListener("webtoeic-camera-settings-updated", handleCameraToggle);
    return () => {
      window.removeEventListener("webtoeic-camera-settings-updated", handleCameraToggle);
    };
  }, [isAdmin]);

  // 2. Khởi tạo Camera Stream & Canvas Processor khi shouldActive
  useEffect(() => {
    if (!shouldActive || !canvasRef.current) {
      cameraProcessorService.cleanup();
      return;
    }

    cameraProcessorService.init(canvasRef.current, (loaded) => {
      setSettings(loaded);
    });

    return () => {
      cameraProcessorService.cleanup();
    };
  }, [shouldActive, settings?.deviceId]);

  // 3. Cập nhật Processor khi thay đổi blur / image / mirror
  useEffect(() => {
    if (settings && settings.enabled) {
      cameraProcessorService.updateSettings(settings);
    }
  }, [settings?.bgMode, settings?.blurPercent, settings?.isMirrored]);

  // 4. Xử lý Drag & Drop
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    if (isResizing || (e.target as HTMLElement).closest(`.${styles.quickToolbar}`) || (e.target as HTMLElement).closest(`.${styles.resizeHandle}`)) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: settings?.posX ?? 30,
      initialY: settings?.posY ?? 120,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent) => {
    if (isDragging && settings) {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const size = settings.size || 190;
      const maxX = window.innerWidth - size - 10;
      const maxY = window.innerHeight - size - 10;

      const newX = Math.max(10, Math.min(maxX, dragStartRef.current.initialX + deltaX));
      const newY = Math.max(10, Math.min(maxY, dragStartRef.current.initialY + deltaY));

      setSettings((prev) => (prev ? { ...prev, posX: newX, posY: newY } : null));
    } else if (isResizing && settings) {
      const delta = e.clientX - resizeStartRef.current.mouseX;
      const newSize = Math.max(80, Math.min(500, Math.round(resizeStartRef.current.initialSize + delta)));
      setSettings((prev) => (prev ? { ...prev, size: newSize } : null));
    }
  };

  const handlePointerUpDrag = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      if (settings) {
        saveCameraSettings({ posX: settings.posX, posY: settings.posY });
      }
    } else if (isResizing) {
      setIsResizing(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      if (settings) {
        saveCameraSettings({ size: settings.size });
      }
    }
  };

  // 5. Xử lý Resize Handle
  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      initialSize: settings?.size || 190,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Toggle Mirror
  const handleToggleMirror = () => {
    if (!settings) return;
    const next = !settings.isMirrored;
    setSettings({ ...settings, isMirrored: next });
    saveCameraSettings({ isMirrored: next });
  };

  // Tắt Camera
  const handleCloseCamera = () => {
    if (!settings) return;
    setSettings({ ...settings, enabled: false });
    saveCameraSettings({ enabled: false });
    cameraProcessorService.cleanup();
    window.dispatchEvent(new CustomEvent("webtoeic-camera-settings-updated", { detail: { enabled: false } }));
  };

  if (!shouldActive || !settings) {
    return null;
  }

  const currentSize = settings.size || 190;

  return (
    <div
      ref={bubbleRef}
      className={styles.bubbleWrapper}
      style={{
        width: `${currentSize}px`,
        height: `${currentSize}px`,
        left: `${settings.posX}px`,
        top: `${settings.posY}px`,
      }}
      onPointerDown={handlePointerDownDrag}
      onPointerMove={handlePointerMoveDrag}
      onPointerUp={handlePointerUpDrag}
    >
      {/* Quick Toolbar on Hover */}
      <div className={styles.quickToolbar}>
        <button onClick={handleToggleMirror} className={styles.toolBtn} title="Lật gương (Mirror)">
          <FlipHorizontal size={13} />
        </button>
        {onOpenSettings && (
          <button onClick={onOpenSettings} className={styles.toolBtn} title="Cài đặt camera & nền">
            <Settings2 size={13} />
          </button>
        )}
        <button onClick={handleCloseCamera} className={`${styles.toolBtn} ${styles.closeToolBtn}`} title="Tắt camera">
          <X size={13} />
        </button>
      </div>

      {/* Circular Camera Canvas Container */}
      <div 
        className={styles.bubbleContainer}
        style={{
          borderWidth: `${settings.borderWidth ?? 2}px`,
          borderColor: settings.borderColor || "#ffffff",
          borderStyle: (settings.borderWidth ?? 2) > 0 ? "solid" : "none",
        }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className={styles.bubbleCanvas}
        />
      </div>

      {/* Resize Handle at Bottom-Right */}
      <div
        className={styles.resizeHandle}
        onPointerDown={handlePointerDownResize}
        title="Kéo chuột để phóng to / thu nhỏ khung camera"
      >
        <Scaling size={11} />
      </div>
    </div>
  );
};
