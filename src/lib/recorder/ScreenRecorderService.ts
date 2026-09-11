/* src/lib/recorder/ScreenRecorderService.ts */

import { AudioMixerService, AudioMixerOptions } from "./AudioMixerService";
import { getSavedDirectoryHandle, saveDirectoryHandle, clearSavedDirectoryHandle } from "./DirectoryStorage";

export type RecorderState = "idle" | "preparing" | "recording" | "paused" | "stopped";
export type CropMode = "video" | "custom" | "full";

export interface CustomCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StartRecorderOptions {
  micDeviceId?: string;
  enableMic?: boolean;
  tabVolume?: number;
  micVolume?: number;
  enableFanFilter?: boolean;
  cropMode?: CropMode;
  targetElementId?: string; // e.g. "youtube-dictation-video-container"
  customCropRect?: CustomCropRect;
  lessonTitle?: string;
}

export function sanitizeFileName(name: string): string {
  if (!name) return "BaiHoc";
  return name
    .trim()
    .replace(/[/\\?%*:|"<>#]/g, "-") // Thay các ký tự không hợp lệ trong file path
    .replace(/\s+/g, "_")           // Thay khoảng trắng thành gạch dưới
    .replace(/_+/g, "_")            // Rút gọn các dấu gạch dưới liên tiếp
    .replace(/^[-_.]+|[-_.]+$/g, "") // Bỏ dấu gạch ở đầu và cuối
    .slice(0, 60) || "BaiHoc";
}

export interface SaveResult {
  success: boolean;
  savedVia: "directory" | "download";
  folderName?: string;
  fileName: string;
  fileSize?: string;
  blob?: Blob;
  blobUrl?: string;
}

export class ScreenRecorderService {
  private state: RecorderState = "idle";
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  
  private displayStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private combinedStream: MediaStream | null = null;
  
  private audioMixer: AudioMixerService | null = null;

  // Custom Crop Pipeline elements
  private customCropVideo: HTMLVideoElement | null = null;
  private customCropCanvas: HTMLCanvasElement | null = null;
  private customCropAnimId: number | null = null;
  
  // Timer management
  private startTime: number = 0;
  private accumulatedTime: number = 0;
  private timerInterval: any = null;
  private meterInterval: any = null;

  // Direct-to-Disk Stream Writing (Chống tràn RAM cho buổi học dài 2-3 tiếng & chống mất video)
  private activeWritable: any = null;
  private activeFileName: string = "";
  private activeFolderName: string = "";
  private isDirectlySaved: boolean = false;

  // Listeners
  public onStateChange?: (state: RecorderState) => void;
  public onTimeUpdate?: (seconds: number) => void;
  public onAudioLevels?: (tabLevel: number, micLevel: number) => void;
  public onError?: (error: string) => void;

  public getState(): RecorderState {
    return this.state;
  }

  private setState(newState: RecorderState) {
    this.state = newState;
    if (this.onStateChange) this.onStateChange(newState);
  }

  /**
   * Bắt đầu phiên quay màn hình
   */
  public async start(options: StartRecorderOptions = {}): Promise<boolean> {
    try {
      this.setState("preparing");
      const cropMode = options.cropMode || "video";

      // 1. Thu hình ảnh tab & Âm thanh tab (Cho phép độ phân giải tối đa của màn hình Retina / 2K / 4K)
      const displayMediaOptions: any = {
        video: {
          displaySurface: "browser",
          frameRate: { ideal: 60, max: 60 },
          width: { ideal: 3840, max: 3840 },
          height: { ideal: 2160, max: 2160 },
          aspectRatio: { ideal: 1.7777777778 },
          resizeMode: "none",
        },
        audio: {
          suppressLocalAudioPlayback: false,
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
        preferCurrentTab: true,
        selfBrowserSurface: "include",
        systemAudio: "include",
        surfaceSwitching: "include",
      };

      this.displayStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      // Nếu người dùng tắt share tab bằng thanh banner của Chrome
      this.displayStream.getVideoTracks()[0].onended = () => {
        if (this.state === "recording" || this.state === "paused") {
          this.stop();
        }
      };

      let finalVideoTrack: MediaStreamTrack = this.displayStream.getVideoTracks()[0];

      // 2. Xử lý Crop theo chế độ (Tự động loại bỏ Header, Thanh Sub-header bài học và Thanh công cụ recording)
      // Sử dụng Canvas Pipeline 60fps Retina để đảm bảo độ phân giải luôn là SỐ CHẴN (Even dimensions),
      // ngăn chặn hoàn toàn lỗi "Encoder initialization failed" của bộ mã hóa H.264 phần cứng trên macOS/Chrome.
      const getElementRect = (el: HTMLElement | null): CustomCropRect | null => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        if (b.width <= 0 || b.height <= 0) return null;
        return {
          x: Math.max(0, Math.round(b.left)),
          y: Math.max(0, Math.round(b.top)),
          width: Math.max(100, Math.round(b.width)),
          height: Math.max(100, Math.round(b.height)),
        };
      };

      if (cropMode === "video") {
        // Chế độ 1: Khóa tự động vào khung video bài giảng (nếu là bài luyện phim/dictation) HOẶC toàn bộ khu vực bài tập (nếu không có phim)
        const videoTargetEl = (options.targetElementId ? document.getElementById(options.targetElementId) : null) || 
                              document.getElementById("youtube-dictation-video-container") ||
                              document.querySelector("[data-crop-target='main-player']");

        const videoRect = getElementRect(videoTargetEl as HTMLElement);
        if (videoRect) {
          finalVideoTrack = await this.setupCanvasCrop(videoRect);
        } else {
          // Nếu bài học không có video phim/dictation: Tự động quay toàn bộ vùng nội dung bài học (#lesson-main-content), BỎ CẢ Top Header VÀ Lesson Sub-header
          const mainContentEl = document.getElementById("lesson-main-content") || 
                                document.querySelector("[data-crop-target='lesson-content']") ||
                                document.getElementById("learn-workspace-container") || 
                                document.querySelector("main");
          const mainRect = getElementRect(mainContentEl as HTMLElement);
          if (mainRect) {
            finalVideoTrack = await this.setupCanvasCrop(mainRect);
          } else {
            const headerEl = document.querySelector("header");
            const subHeaderEl = document.getElementById("lesson-sub-header");
            const topOffset = (headerEl ? headerEl.getBoundingClientRect().height : 56) + 
                              (subHeaderEl ? subHeaderEl.getBoundingClientRect().height : 60);
            const fallbackRect: CustomCropRect = {
              x: 0,
              y: Math.round(topOffset),
              width: window.innerWidth,
              height: Math.max(100, window.innerHeight - Math.round(topOffset)),
            };
            finalVideoTrack = await this.setupCanvasCrop(fallbackRect);
          }
        }
      } else if (cropMode === "full") {
        // Chế độ 3: Quay toàn bộ không gian bài học - Tự động CẮT BỎ CẢ Top Header & Thanh Sub-header bài học
        const mainContentEl = document.getElementById("lesson-main-content") || 
                              document.querySelector("[data-crop-target='lesson-content']") ||
                              document.getElementById("learn-workspace-container") || 
                              document.querySelector("main");
        const mainRect = getElementRect(mainContentEl as HTMLElement);
        if (mainRect) {
          finalVideoTrack = await this.setupCanvasCrop(mainRect);
        } else {
          const headerEl = document.querySelector("header");
          const subHeaderEl = document.getElementById("lesson-sub-header");
          const topOffset = (headerEl ? headerEl.getBoundingClientRect().height : 56) + 
                            (subHeaderEl ? subHeaderEl.getBoundingClientRect().height : 60);
          const fallbackRect: CustomCropRect = {
            x: 0,
            y: Math.round(topOffset),
            width: window.innerWidth,
            height: Math.max(100, window.innerHeight - Math.round(topOffset)),
          };
          finalVideoTrack = await this.setupCanvasCrop(fallbackRect);
        }
      } else if (cropMode === "custom" && options.customCropRect) {
        // Chế độ 2: Tự vẽ khung tùy ý qua Canvas Pipeline 60fps Retina
        finalVideoTrack = await this.setupCanvasCrop(options.customCropRect);
      }

      // 3. Thu Micro nếu được bật
      if (options.enableMic !== false) {
        try {
          const micConstraints: MediaStreamConstraints = {
            audio: {
              deviceId: options.micDeviceId ? { exact: options.micDeviceId } : undefined,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          };
          this.micStream = await navigator.mediaDevices.getUserMedia(micConstraints);
        } catch (micErr) {
          console.warn("[ScreenRecorder] Could not access microphone:", micErr);
          this.micStream = null;
        }
      }

      // 4. Trộn âm thanh Phim (100%) + Micro (với bộ lọc tiếng quạt)
      this.audioMixer = new AudioMixerService();
      const mixedAudioTrack = this.audioMixer.init({
        tabStream: this.displayStream,
        micStream: this.micStream,
        tabVolume: options.tabVolume ?? 1.0,
        micVolume: options.micVolume ?? 1.0,
        enableFanFilter: options.enableFanFilter !== false,
      });

      // 5. Tạo combined stream gồm video track + mixed audio track
      const tracks: MediaStreamTrack[] = [finalVideoTrack];
      if (mixedAudioTrack) {
        tracks.push(mixedAudioTrack);
      }
      this.combinedStream = new MediaStream(tracks);

      // 6. Cấu hình MediaRecorder: Sử dụng codec siêu ổn định (VP9/VP8/Opus) cho luồng Canvas để không bao giờ bị lỗi phần cứng EncodingError
      const isCanvasCropped = (cropMode === "video" || cropMode === "full" || cropMode === "custom");
      const hasAudioTrack = this.combinedStream.getAudioTracks().length > 0;
      
      const rawMimeTypes = isCanvasCropped
        ? (hasAudioTrack
            ? [
                "video/webm;codecs=vp9,opus",
                "video/webm;codecs=vp8,opus",
                "video/webm;codecs=h264,opus",
                "video/webm",
                "video/mp4;codecs=avc1,mp4a.40.2",
                "video/mp4;codecs=avc1",
                "video/mp4",
              ]
            : [
                "video/webm;codecs=vp9",
                "video/webm;codecs=vp8",
                "video/webm;codecs=h264",
                "video/webm",
                "video/mp4;codecs=avc1",
                "video/mp4",
              ])
        : (hasAudioTrack
            ? [
                "video/mp4;codecs=avc1,mp4a.40.2",
                "video/mp4;codecs=avc1",
                "video/mp4",
                "video/webm;codecs=vp9,opus",
                "video/webm;codecs=vp8,opus",
                "video/webm;codecs=h264,opus",
                "video/webm",
              ]
            : [
                "video/mp4;codecs=avc1",
                "video/mp4",
                "video/webm;codecs=vp9",
                "video/webm;codecs=vp8",
                "video/webm;codecs=h264",
                "video/webm",
              ]);

      const mimeTypes = rawMimeTypes.filter((mime) => {
        try {
          return typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime);
        } catch {
          return false;
        }
      });
      if (mimeTypes.length === 0) {
        mimeTypes.push("");
      }

      const primaryMimeType = this.getBestMimeType(hasAudioTrack);

      // 7. Khởi tạo ghi trực tiếp xuống ổ đĩa (Direct-to-Disk Streaming) nếu đã có thư mục lưu
      this.activeWritable = null;
      this.activeFileName = "";
      this.activeFolderName = "";
      this.isDirectlySaved = false;

      try {
        const dirHandle = await getSavedDirectoryHandle();
        if (dirHandle && typeof (dirHandle as any).getFileHandle === "function") {
          const opts = { mode: "readwrite" };
          let permission = await (dirHandle as any).queryPermission?.(opts);
          if (permission !== "granted" && (dirHandle as any).requestPermission) {
            permission = await (dirHandle as any).requestPermission(opts);
          }
          if (permission === "granted" || permission === undefined) {
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
            const ext = isCanvasCropped ? ".webm" : (primaryMimeType.includes("mp4") ? ".mp4" : ".webm");
            const cleanTitle = sanitizeFileName(options.lessonTitle || "BaiHoc");
            const targetName = `${cleanTitle}_${dateStr}${ext}`;

            const fileHandle = await dirHandle.getFileHandle(targetName, { create: true });
            this.activeWritable = await (fileHandle as any).createWritable();
            this.activeFileName = targetName;
            this.activeFolderName = dirHandle.name;
            this.isDirectlySaved = true;
          }
        }
      } catch (streamInitErr) {
        console.warn("[ScreenRecorder] Direct-to-Disk init failed (falling back to RAM chunks):", streamInitErr);
        this.activeWritable = null;
        this.isDirectlySaved = false;
      }

      this.recordedChunks = [];
      let hasTriedFallback = false;

      const startRecorderWithCodec = (mimeIndex: number) => {
        const mime = mimeTypes[mimeIndex] || "";
        const recOpts: MediaRecorderOptions = {
          mimeType: mime || undefined,
          videoBitsPerSecond: isCanvasCropped ? 5_000_000 : 8_000_000,
        };
        if (hasAudioTrack) {
          recOpts.audioBitsPerSecond = 128_000;
        }

        if (!this.combinedStream) return;

        try {
          this.mediaRecorder = new MediaRecorder(this.combinedStream, mime ? recOpts : undefined);
        } catch (initErr) {
          console.warn(`[ScreenRecorder] Sync init failed for ${mime}, trying next format...`, initErr);
          if (mimeIndex < mimeTypes.length - 1) {
            startRecorderWithCodec(mimeIndex + 1);
            return;
          }
          try {
            this.mediaRecorder = new MediaRecorder(this.combinedStream);
          } catch (lastErr: any) {
            this.cleanup();
            this.setState("idle");
            if (this.onError) {
              this.onError(`Không thể khởi tạo bộ ghi hình (MediaRecorder): ${lastErr?.message || "Lỗi thiết bị"}`);
            }
            return;
          }
        }

        const currentRecorder = this.mediaRecorder;

        currentRecorder.onerror = (ev: any) => {
          console.error("[ScreenRecorder] MediaRecorder error event:", ev?.error || ev);
          const errStr = String(ev?.error?.name || ev?.error?.message || ev?.error || "");
          
          // Tự động chuyển đổi codec mượt mà nếu phần cứng gặp lỗi EncodingError khi bắt đầu
          if (!hasTriedFallback && (errStr.includes("EncodingError") || errStr.includes("Encoder") || errStr.includes("initialization"))) {
            hasTriedFallback = true;
            console.warn("[ScreenRecorder] EncodingError detected, auto-falling back to next available codec...");
            try {
              currentRecorder.stop();
            } catch {}
            if (mimeIndex + 1 < mimeTypes.length) {
              startRecorderWithCodec(mimeIndex + 1);
              return;
            }
          }

          // NẾU CÓ LỖI XẢY RA: DỪNG QUAY NGAY LẬP TỨC, HỦY TIMER, BÁO ĐỘNG ĐỂ ADMIN KHÔNG GIẢNG OAN!
          console.error("[ScreenRecorder] Fatal recorder error, immediately halting session!");
          this.cleanup();
          this.setState("idle");

          const errDetail = ev?.error?.name || ev?.error?.message || "Lỗi luồng ghi hình phần cứng";
          if (this.onError) {
            this.onError(`Quá trình quay bị dừng do lỗi: ${errDetail}. Hệ thống đã ngắt phiên quay để bạn không mất công giảng bài.`);
          }
        };

        currentRecorder.ondataavailable = async (event) => {
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
            if (this.activeWritable) {
              try {
                await this.activeWritable.write(event.data);
              } catch (wErr) {
                console.warn("[ScreenRecorder] Direct write error:", wErr);
              }
            }
          }
        };

        try {
          currentRecorder.start(1000);
        } catch (startErr: any) {
          console.warn(`[ScreenRecorder] start() failed with ${mime}, trying next...`, startErr);
          if (mimeIndex < mimeTypes.length - 1) {
            startRecorderWithCodec(mimeIndex + 1);
            return;
          }
          this.cleanup();
          this.setState("idle");
          if (this.onError) {
            this.onError(`Không thể bắt đầu ghi dữ liệu: ${startErr?.message || "Lỗi MediaRecorder.start"}`);
          }
        }
      };

      startRecorderWithCodec(0);

      this.startTime = Date.now();
      this.accumulatedTime = 0;
      this.setState("recording");

      // Bắt đầu timer
      this.startTimer();
      this.startMeter();

      // Giám sát tính toàn vẹn: nếu sau 3.5s chưa có frame/chunk và recorder bị lỗi/ngừng
      setTimeout(() => {
        if (this.state === "recording") {
          if (this.recordedChunks.length === 0 && (!this.mediaRecorder || this.mediaRecorder.state === "inactive")) {
            console.error("[ScreenRecorder] Healthcheck failed: No video chunks generated!");
            this.cleanup();
            this.setState("idle");
            if (this.onError) {
              this.onError("Cảnh báo: Trình duyệt không ghi nhận được khung hình video nào. Hệ thống đã tự động dừng để bạn không mất công giảng bài.");
            }
          }
        }
      }, 3500);

      return true;
    } catch (err: any) {
      this.cleanup();
      this.setState("idle");
      const errMsg = err?.message || "Không thể bắt đầu quay màn hình.";
      if (this.onError) this.onError(errMsg);
      return false;
    }
  }

  /**
   * Tạm dừng quay
   */
  public pause(): void {
    if (this.mediaRecorder && this.state === "recording") {
      try {
        this.mediaRecorder.pause();
        this.accumulatedTime += Date.now() - this.startTime;
        this.stopTimer();
        this.setState("paused");
      } catch (err) {
        console.warn("[ScreenRecorder] Pause failed:", err);
      }
    }
  }

  /**
   * Tiếp tục quay
   */
  public resume(): void {
    if (this.mediaRecorder && this.state === "paused") {
      try {
        this.mediaRecorder.resume();
        this.startTime = Date.now();
        this.startTimer();
        this.setState("recording");
      } catch (err) {
        console.warn("[ScreenRecorder] Resume failed:", err);
      }
    }
  }

  /**
   * Bật/Tắt âm thanh Hệ thống/Bài giảng trực tiếp trong khi quay
   */
  public setTabMute(muted: boolean): void {
    if (this.audioMixer) {
      this.audioMixer.setTabVolume(muted ? 0 : 1.0);
    }
  }

  /**
   * Bật/Tắt Micro Admin trực tiếp trong khi quay
   */
  public setMicMute(muted: boolean): void {
    if (this.audioMixer) {
      this.audioMixer.setMicVolume(muted ? 0 : 1.0);
    }
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Dừng quay và xuất Blob
   */
  public stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.state === "idle" || this.state === "stopped") {
        this.cleanup();
        this.setState("idle");
        resolve(null);
        return;
      }

      this.stopTimer();
      this.stopMeter();

      let isResolved = false;
      const mimeType = this.mediaRecorder?.mimeType || "video/mp4";

      const finishAndResolve = async () => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(safetyTimeout);

        const totalBytes = this.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0);

        if (this.activeWritable) {
          try {
            if (totalBytes > 0) {
              await this.activeWritable.close();
            } else {
              // Nếu không có dữ liệu, hủy file để không tạo file rỗng 0 bytes
              await this.activeWritable.abort();
              this.isDirectlySaved = false;
            }
          } catch (closeErr) {
            console.warn("[ScreenRecorder] Error finalizing activeWritable:", closeErr);
          }
          this.activeWritable = null;
        }

        const finalBlob = totalBytes > 0 
          ? new Blob(this.recordedChunks, { type: mimeType }) 
          : null;
        this.cleanup();
        this.setState("idle");
        resolve(finalBlob);
      };

      this.mediaRecorder.onstop = () => {
        finishAndResolve();
      };

      // Safety fallback: Nếu onstop bị treo do browser encoder, hoàn tất sau 1.2 giây
      const safetyTimeout = setTimeout(() => {
        console.warn("[ScreenRecorder] Stop timeout reached, resolving blob forcefully.");
        finishAndResolve();
      }, 1200);

      try {
        if (this.mediaRecorder.state !== "inactive") {
          try {
            this.mediaRecorder.requestData();
          } catch {}
          this.mediaRecorder.stop();
        } else {
          finishAndResolve();
        }
      } catch (err) {
        console.warn("[ScreenRecorder] Stop call error:", err);
        finishAndResolve();
      }
    });
  }

  /**
   * Tự động lưu video vào thư mục đã cài đặt sẵn trên máy tính hoặc tải về Downloads
   */
  public async autoSaveToDisk(blob: Blob, suggestedFileName?: string): Promise<SaveResult> {
    if (!blob || blob.size === 0) {
      return {
        success: false,
        savedVia: "download",
        fileName: suggestedFileName || "error.mp4",
        fileSize: "0 MB",
      };
    }

    const cleanSuggested = suggestedFileName || `HocToeic_Lesson_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
    const finalMp4Name = cleanSuggested.endsWith(".mp4") 
      ? cleanSuggested 
      : `${cleanSuggested.replace(/\.[^/.]+$/, "")}.mp4`;

    const blobUrl = URL.createObjectURL(blob);
    const sizeInMB = (blob.size / (1024 * 1024)).toFixed(1) + " MB";

    // 1. Tự động chuyển đổi sang chuẩn MP4 (H.264 / AAC) với FastStart bằng FFmpeg Server
    try {
      const formData = new FormData();
      formData.append("file", blob, finalMp4Name);
      formData.append("fileName", finalMp4Name);
      if (this.activeFolderName) {
        formData.append("folderName", this.activeFolderName);
      }

      const res = await fetch("/api/admin/convert-recording", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          return {
            success: true,
            savedVia: "directory",
            folderName: data.folderName || "Movies",
            fileName: data.fileName || finalMp4Name,
            fileSize: data.fileSize || sizeInMB,
            blob,
            blobUrl,
          };
        }
      }
    } catch (apiErr) {
      console.warn("[ScreenRecorder] Server-side FFmpeg MP4 convert failed, falling back to client save:", apiErr);
    }

    // 2. Fallback: Nếu không dùng được API FFmpeg server, lưu trực tiếp qua File System Access
    try {
      const dirHandle = await getSavedDirectoryHandle();
      if (dirHandle) {
        const opts = { mode: "readwrite" };
        let permission = await (dirHandle as any).queryPermission?.(opts);
        if (permission !== "granted" && (dirHandle as any).requestPermission) {
          permission = await (dirHandle as any).requestPermission(opts);
        }

        if (permission === "granted" || permission === undefined) {
          const fileHandle = await dirHandle.getFileHandle(finalMp4Name, { create: true });
          const writable = await (fileHandle as any).createWritable();
          await writable.write(blob);
          await writable.close();

          return {
            success: true,
            savedVia: "directory",
            folderName: dirHandle.name,
            fileName: finalMp4Name,
            fileSize: sizeInMB,
            blob,
            blobUrl,
          };
        }
      }
    } catch (fsErr) {
      console.warn("[ScreenRecorder] File System Access auto-save failed, falling back to download:", fsErr);
    }

    // 3. Fallback cuối cùng: Tải về trình duyệt tự động vào Downloads
    try {
      this.downloadBlob(blob, finalMp4Name);
      return {
        success: true,
        savedVia: "download",
        fileName: finalMp4Name,
        fileSize: sizeInMB,
        blob,
        blobUrl,
      };
    } catch (err: any) {
      return {
        success: false,
        savedVia: "download",
        fileName: finalMp4Name,
        fileSize: sizeInMB,
        blob,
        blobUrl,
      };
    }
  }

  /**
   * Tải blob về thư mục Downloads của máy
   */
  public downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  }

  /**
   * Đặt lại thư mục lưu về mặc định (Downloads)
   */
  public async resetSaveDirectory(): Promise<void> {
    await clearSavedDirectoryHandle();
  }

  /**
   * Thay đổi thư mục lưu mặc định
   */
  public async promptChangeSaveDirectory(): Promise<string | null> {
    if (typeof (window as any).showDirectoryPicker !== "function") {
      throw new Error("NOT_SUPPORTED");
    }
    try {
      let dirHandle: any = null;
      try {
        dirHandle = await (window as any).showDirectoryPicker({
          mode: "readwrite",
          startIn: "videos"
        });
      } catch (innerErr: any) {
        if (innerErr?.name === "AbortError") {
          return null; // Người dùng chủ động bấm Cancel
        }
        // Thử lại không kèm startIn
        dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      }

      if (dirHandle) {
        await saveDirectoryHandle(dirHandle);
        return dirHandle.name;
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return null;
      }
      console.error("[ScreenRecorder] showDirectoryPicker error:", err);
      throw err;
    }
    return null;
  }

  // --- Các hàm phụ trợ ---

  private getBestMimeType(hasAudio: boolean = true): string {
    const types = hasAudio
      ? [
          "video/mp4;codecs=avc1,mp4a.40.2",
          "video/mp4;codecs=avc1",
          "video/mp4",
          "video/webm;codecs=h264,opus",
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ]
      : [
          "video/mp4;codecs=avc1",
          "video/mp4",
          "video/webm;codecs=h264",
          "video/webm;codecs=vp9",
          "video/webm;codecs=vp8",
          "video/webm",
        ];
    for (const type of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      const currentElapsed = (Date.now() - this.startTime) + this.accumulatedTime;
      const seconds = Math.floor(currentElapsed / 1000);
      if (this.onTimeUpdate) {
        this.onTimeUpdate(seconds);
      }
    }, 500);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private startMeter() {
    this.stopMeter();
    this.meterInterval = setInterval(() => {
      if (this.audioMixer && this.onAudioLevels) {
        const tabLevel = this.audioMixer.getAudioLevel(this.audioMixer.tabAnalyser);
        const micLevel = this.audioMixer.getAudioLevel(this.audioMixer.micAnalyser);
        this.onAudioLevels(tabLevel, micLevel);
      }
    }, 100);
  }

  private stopMeter() {
    if (this.meterInterval) {
      clearInterval(this.meterInterval);
      this.meterInterval = null;
    }
  }

  private async setupCanvasCrop(rect: CustomCropRect): Promise<MediaStreamTrack> {
    if (!this.displayStream) {
      throw new Error("Display stream is not initialized");
    }

    this.customCropVideo = document.createElement("video");
    this.customCropVideo.autoplay = true;
    this.customCropVideo.playsInline = true;
    this.customCropVideo.muted = true;
    // Giữ video element có kích thước thực trên viewport với opacity cực nhỏ để Chromium không bao giờ đóng băng/throttle frame
    this.customCropVideo.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;opacity:0.001;pointer-events:none;z-index:-999999;";
    document.body.appendChild(this.customCropVideo);
    this.customCropVideo.srcObject = this.displayStream;
    await this.customCropVideo.play();

    // Đợi metadata video để lấy đúng độ phân giải vật lý của màn hình Retina (2x / 3x)
    await new Promise<void>((resolve) => {
      if (this.customCropVideo!.readyState >= 2 && this.customCropVideo!.videoWidth > 0) {
        resolve();
      } else {
        this.customCropVideo!.onloadedmetadata = () => resolve();
        setTimeout(resolve, 300);
      }
    });

    const winW = window.innerWidth || 1920;
    const winH = window.innerHeight || 1080;
    const vw = this.customCropVideo.videoWidth || (winW * (window.devicePixelRatio || 2));
    const vh = this.customCropVideo.videoHeight || (winH * (window.devicePixelRatio || 2));
    const scaleX = vw / winW;
    const scaleY = vh / winH;

    // Kích thước canvas thực tế (Native Retina Pixels) - Tránh bị mờ do nén về CSS pixels
    // Giới hạn an toàn tối đa 2560x1440 (2K) để tránh vượt quá năng lực Macroblock của bộ mã hóa phần cứng macOS/Chrome
    const MAX_CANVAS_WIDTH = 2560;
    const MAX_CANVAS_HEIGHT = 1440;
    let targetW = rect.width * scaleX;
    let targetH = rect.height * scaleY;

    if (targetW > MAX_CANVAS_WIDTH || targetH > MAX_CANVAS_HEIGHT) {
      const scaleDown = Math.min(MAX_CANVAS_WIDTH / targetW, MAX_CANVAS_HEIGHT / targetH);
      targetW *= scaleDown;
      targetH *= scaleDown;
    }

    let nativeCropW = Math.max(16, Math.round(targetW));
    let nativeCropH = Math.max(16, Math.round(targetH));

    // BẮT BUỘC: Chiều rộng và chiều cao phải là số CHẴN (Even) để encoder video H.264 không bị lỗi EncodingError
    if (nativeCropW % 2 !== 0) nativeCropW += 1;
    if (nativeCropH % 2 !== 0) nativeCropH += 1;

    this.customCropCanvas = document.createElement("canvas");
    this.customCropCanvas.width = nativeCropW;
    this.customCropCanvas.height = nativeCropH;
    const ctx = this.customCropCanvas.getContext("2d", { alpha: false, desynchronized: true });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // Vẽ ngay frame đầu tiên trước khi captureStream để track video có dữ liệu ngay lập tức
      try {
        ctx.drawImage(
          this.customCropVideo,
          rect.x * scaleX,
          rect.y * scaleY,
          rect.width * scaleX,
          rect.height * scaleY,
          0,
          0,
          nativeCropW,
          nativeCropH
        );
      } catch {}
    }

    const renderLoop = () => {
      if (!this.customCropVideo || !this.customCropCanvas || !ctx) return;
      const currentVw = this.customCropVideo.videoWidth || vw;
      const currentVh = this.customCropVideo.videoHeight || vh;
      const sX = currentVw / (window.innerWidth || winW);
      const sY = currentVh / (window.innerHeight || winH);

      const sx = Math.max(0, rect.x * sX);
      const sy = Math.max(0, rect.y * sY);
      const sw = Math.min(currentVw - sx, rect.width * sX);
      const sh = Math.min(currentVh - sy, rect.height * sY);

      try {
        ctx.drawImage(
          this.customCropVideo,
          sx,
          sy,
          sw,
          sh,
          0,
          0,
          nativeCropW,
          nativeCropH
        );
      } catch {}
      this.customCropAnimId = requestAnimationFrame(renderLoop);
    };
    this.customCropAnimId = requestAnimationFrame(renderLoop);

    const canvasStream = (this.customCropCanvas as any).captureStream(30);
    return canvasStream.getVideoTracks()[0];
  }

  public cleanup() {
    this.stopTimer();
    this.stopMeter();

    if (this.customCropAnimId) {
      cancelAnimationFrame(this.customCropAnimId);
      this.customCropAnimId = null;
    }

    if (this.customCropVideo) {
      try {
        this.customCropVideo.pause();
        this.customCropVideo.srcObject = null;
        if (this.customCropVideo.parentNode) {
          this.customCropVideo.parentNode.removeChild(this.customCropVideo);
        }
      } catch {}
      this.customCropVideo = null;
    }

    this.customCropCanvas = null;

    if (this.audioMixer) {
      this.audioMixer.cleanup();
      this.audioMixer = null;
    }

    if (this.displayStream) {
      this.displayStream.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
      this.displayStream = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
      this.micStream = null;
    }

    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
      this.combinedStream = null;
    }

    this.mediaRecorder = null;
  }
}

// Global Singleton Instance
export const screenRecorderService = new ScreenRecorderService();
