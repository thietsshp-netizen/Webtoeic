/* src/lib/recorder/CameraStorage.ts */

export interface CameraSettings {
  enabled: boolean;
  size: number; // 80 - 500 px
  posX: number; // px from left
  posY: number; // px from top
  deviceId: string;
  isMirrored: boolean;
  bgMode: "normal" | "blur" | "image";
  blurPercent: number; // 0 - 100%
  borderWidth: number; // 0 - 6px
  borderColor: string; // hex or rgb
}

const DEFAULT_SETTINGS: CameraSettings = {
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
};

const DB_NAME = "WebtoeicCameraDB";
const STORE_NAME = "cameraData";
const SETTINGS_KEY = "cameraSettings";
const BG_IMAGE_KEY = "virtualBgImage";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported"));
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Lưu cài đặt Camera vào IndexedDB
 */
export async function saveCameraSettings(settings: Partial<CameraSettings>): Promise<void> {
  try {
    const current = await getCameraSettings();
    const updated = { ...current, ...settings };
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(updated, SETTINGS_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[CameraStorage] saveCameraSettings error:", err);
  }
}

/**
 * Lấy cài đặt Camera đã lưu
 */
export async function getCameraSettings(): Promise<CameraSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SETTINGS_KEY);
      req.onsuccess = () => {
        resolve(req.result ? { ...DEFAULT_SETTINGS, ...req.result } : DEFAULT_SETTINGS);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Lưu ảnh nền ảo (Virtual Background)
 */
export async function saveVirtualBgImage(dataUrl: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, BG_IMAGE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[CameraStorage] saveVirtualBgImage error:", err);
  }
}

/**
 * Lấy ảnh nền ảo đã lưu
 */
export async function getVirtualBgImage(): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(BG_IMAGE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}
