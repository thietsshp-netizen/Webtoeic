"use client";

/**
 * Tạo dấu vân tay trình duyệt (Fingerprint) dựa trên phần cứng và Canvas
 * Đảm bảo tính duy nhất tương đối cao cho mỗi thiết bị
 */
export async function getBrowserFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "";

  const ua = navigator.userAgent;
  let os = "unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh")) os = "Mac";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  const hardwareInfo = {
    os,
    screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    cpu: navigator.hardwareConcurrency || "unknown",
    memory: (navigator as any).deviceMemory || "unknown",
  };

  // Canvas Fingerprinting
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let canvasHash = "";
  if (ctx) {
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Hoctoeic-Fingerprint-1.0", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Hoctoeic-Fingerprint-1.0", 4, 17);
    canvasHash = canvas.toDataURL();
  }

  const rawString = JSON.stringify(hardwareInfo) + canvasHash;
  
  // Tạo hash đơn giản (MurmurHash hoặc SHA-256 giả lập)
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
}

/**
 * Xác định loại thiết bị: PC hoặc MOBILE
 */
export function getDeviceType(): "PC" | "MOBILE" {
  if (typeof window === "undefined") return "PC";
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk|(android(?!.*mobi))/i.test(ua)) {
    return "MOBILE";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(ua)) {
    return "MOBILE";
  }
  return "PC";
}

/**
 * Lấy tên thiết bị thân thiện để hiển thị
 */
export function getDeviceModel(): string {
  if (typeof window === "undefined") return "Unknown Device";
  const ua = navigator.userAgent;
  
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) {
    const match = ua.match(/Android.*?; (.*?) Build/);
    return match ? match[1] : "Android Device";
  }
  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("Macintosh")) return "MacBook/iMac";
  
  return "Desktop Device";
}
