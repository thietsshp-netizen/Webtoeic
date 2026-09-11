/* src/lib/recorder/CameraProcessorService.ts */

import { CameraSettings, getCameraSettings, saveCameraSettings, getVirtualBgImage } from "./CameraStorage";

export class CameraProcessorService {
  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private selfieSegmentation: any = null;
  private isModelLoading: boolean = false;
  private animationFrameId: number | null = null;
  
  // Virtual Background Image
  private bgImageElement: HTMLImageElement | null = null;
  
  // Render Target Canvas
  private targetCanvas: HTMLCanvasElement | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  
  private currentSettings: CameraSettings | null = null;

  public async init(canvas: HTMLCanvasElement, onSettingsLoaded?: (s: CameraSettings) => void): Promise<boolean> {
    this.targetCanvas = canvas;
    this.currentSettings = await getCameraSettings();
    if (onSettingsLoaded) onSettingsLoaded(this.currentSettings);

    // Tạo hidden video element
    if (!this.videoElement) {
      this.videoElement = document.createElement("video");
      this.videoElement.setAttribute("autoplay", "true");
      this.videoElement.setAttribute("playsinline", "true");
      this.videoElement.setAttribute("muted", "true");
      this.videoElement.style.display = "none";
      document.body.appendChild(this.videoElement);
    }

    // Tải ảnh nền ảo nếu có
    await this.loadSavedBgImage();

    // Khởi động luồng camera
    return this.startStream(this.currentSettings.deviceId);
  }

  public async loadSavedBgImage(): Promise<void> {
    const dataUrl = await getVirtualBgImage();
    if (dataUrl) {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = () => {
          this.bgImageElement = img;
          resolve(true);
        };
        img.onerror = () => resolve(false);
      });
    } else {
      this.bgImageElement = null;
    }
  }

  public async startStream(deviceId?: string): Promise<boolean> {
    try {
      this.stopStream();

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60, max: 60 },
        },
        audio: false,
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElement) {
        this.videoElement.srcObject = this.mediaStream;
        await this.videoElement.play();
      }

      this.startRenderLoop();
      return true;
    } catch (err) {
      console.warn("[CameraProcessorService] startStream error:", err);
      return false;
    }
  }

  public stopStream(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }

  public updateSettings(newSettings: Partial<CameraSettings>): void {
    if (!this.currentSettings) return;
    this.currentSettings = { ...this.currentSettings, ...newSettings };
    saveCameraSettings(this.currentSettings);

    // Nếu chuyển sang chế độ blur/image, nạp model AI nếu chưa có
    if (this.currentSettings.bgMode !== "normal" && !this.selfieSegmentation && !this.isModelLoading) {
      this.loadMediaPipeSelfieSegmentation();
    }
  }

  private async loadMediaPipeSelfieSegmentation(): Promise<void> {
    if (this.selfieSegmentation || this.isModelLoading) return;
    this.isModelLoading = true;

    try {
      // Nạp script MediaPipe động từ CDN nếu chưa có trong window
      if (!(window as any).SelfieSegmentation) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
          script.crossOrigin = "anonymous";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const SelfieSegmentationClass = (window as any).SelfieSegmentation;
      if (SelfieSegmentationClass) {
        this.selfieSegmentation = new SelfieSegmentationClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        this.selfieSegmentation.setOptions({
          modelSelection: 1, // 1: Landscape (nét hơn), 0: General
          selfieMode: false,
        });

        this.selfieSegmentation.onResults((results: any) => {
          this.drawSegmentationResults(results);
        });
      }
    } catch (err) {
      console.warn("[CameraProcessorService] Failed to load MediaPipe, falling back to CSS blur:", err);
    } finally {
      this.isModelLoading = false;
    }
  }

  private startRenderLoop(): void {
    const render = async () => {
      if (!this.videoElement || this.videoElement.paused || this.videoElement.ended || !this.targetCanvas) {
        this.animationFrameId = requestAnimationFrame(render);
        return;
      }

      const mode = this.currentSettings?.bgMode || "normal";

      // Nếu đang ở chế độ bình thường hoặc model chưa tải xong
      if (mode === "normal" || !this.selfieSegmentation) {
        this.drawNormalFrame();
      } else {
        // Gửi frame sang MediaPipe AI segmentation
        try {
          await this.selfieSegmentation.send({ image: this.videoElement });
        } catch {
          this.drawNormalFrame();
        }
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private drawNormalFrame(): void {
    if (!this.targetCanvas || !this.videoElement) return;
    const ctx = this.targetCanvas.getContext("2d");
    if (!ctx) return;

    const vw = this.videoElement.videoWidth || 640;
    const vh = this.videoElement.videoHeight || 480;
    const minDim = Math.min(vw, vh);
    const sx = (vw - minDim) / 2;
    const sy = (vh - minDim) / 2;

    const cw = this.targetCanvas.width;
    const ch = this.targetCanvas.height;

    ctx.save();
    ctx.clearRect(0, 0, cw, ch);

    // Mirror nếu bật
    if (this.currentSettings?.isMirrored) {
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(this.videoElement, sx, sy, minDim, minDim, 0, 0, cw, ch);
    ctx.restore();
  }

  private drawSegmentationResults(results: any): void {
    if (!this.targetCanvas || !results.image) return;
    const ctx = this.targetCanvas.getContext("2d");
    if (!ctx) return;

    const cw = this.targetCanvas.width;
    const ch = this.targetCanvas.height;
    const mode = this.currentSettings?.bgMode || "normal";
    const blurPercent = this.currentSettings?.blurPercent ?? 60;

    // Tính toán center crop 1:1 để không bị méo hình khi camera là 16:9
    const vw = results.image.width || results.image.videoWidth || 640;
    const vh = results.image.height || results.image.videoHeight || 480;
    const minDim = Math.min(vw, vh);
    const sx = (vw - minDim) / 2;
    const sy = (vh - minDim) / 2;

    // Chuẩn bị offscreen canvas nếu chưa có
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement("canvas");
      this.offscreenCanvas.width = cw;
      this.offscreenCanvas.height = ch;
    }
    const offCtx = this.offscreenCanvas.getContext("2d");
    if (!offCtx) return;

    ctx.save();
    ctx.clearRect(0, 0, cw, ch);

    if (this.currentSettings?.isMirrored) {
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
    }

    // 1. Vẽ Background (Mờ hoặc Ảnh nền ảo với tỉ lệ chuẩn Center-Crop 1:1)
    if (mode === "image" && this.bgImageElement) {
      const bw = this.bgImageElement.naturalWidth || this.bgImageElement.width || 1;
      const bh = this.bgImageElement.naturalHeight || this.bgImageElement.height || 1;
      const bMin = Math.min(bw, bh);
      const bsx = (bw - bMin) / 2;
      const bsy = (bh - bMin) / 2;
      ctx.drawImage(this.bgImageElement, bsx, bsy, bMin, bMin, 0, 0, cw, ch);
    } else if (mode === "blur") {
      const blurPx = Math.round((blurPercent / 100) * 20); // 0px -> 20px
      ctx.filter = `blur(${blurPx}px)`;
      ctx.drawImage(results.image, sx, sy, minDim, minDim, 0, 0, cw, ch);
      ctx.filter = "none";
    } else {
      ctx.drawImage(results.image, sx, sy, minDim, minDim, 0, 0, cw, ch);
    }

    // 2. Tách người và vẽ Foreground (chuẩn tâm 1:1, khớp từng pixel với mask)
    offCtx.save();
    offCtx.clearRect(0, 0, cw, ch);
    // Vẽ mask người đã crop chuẩn 1:1
    offCtx.drawImage(results.segmentationMask, sx, sy, minDim, minDim, 0, 0, cw, ch);
    // Giữ lại vùng người trên video gốc đã crop chuẩn 1:1
    offCtx.globalCompositeOperation = "source-in";
    offCtx.drawImage(results.image, sx, sy, minDim, minDim, 0, 0, cw, ch);
    offCtx.restore();

    // 3. Phủ người lên trên nền
    ctx.drawImage(this.offscreenCanvas, 0, 0, cw, ch);

    ctx.restore();
  }

  public cleanup(): void {
    this.stopStream();
    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
    this.videoElement = null;
    this.targetCanvas = null;
    this.offscreenCanvas = null;
    this.selfieSegmentation = null;
  }
}

export const cameraProcessorService = new CameraProcessorService();
