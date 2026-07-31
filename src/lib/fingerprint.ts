"use client";

/**
 * Tạo dấu vân tay trình duyệt (Fingerprint) dựa trên phần cứng và Canvas
 * Đảm bảo tính duy nhất tương đối cao cho mỗi thiết bị
 */
export async function getBrowserFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "";

  const ua = navigator.userAgent;
  
  // 1. Nhận diện Hệ điều hành
  let os = "unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh")) os = "Mac";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  // 2. Nhận diện Trình duyệt chính (Định danh loại trình duyệt)
  let browser = "unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";

  // 3. Múi giờ hệ thống (Rất ổn định, không đổi)
  let timezone = "unknown";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {}

  // 4. Các chỉ số phần cứng bất biến (Không đổi khi zoom/thay màn hình)
  const hardwareInfo = {
    os,
    browser,
    timezone,
    colorDepth: window.screen.colorDepth,
    cpu: navigator.hardwareConcurrency || "unknown",
    memory: (navigator as any).deviceMemory || "unknown",
  };

  const rawString = JSON.stringify(hardwareInfo);
  
  // Tạo hash 32-bit từ chuỗi thông số bất biến
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
