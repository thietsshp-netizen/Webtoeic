/**
 * src/lib/video-token.ts
 * Tiện ích mã hóa và tạo URL video qua Cloudflare Worker proxy.
 * Giúp che giấu hoàn toàn Google Drive ID thật, chống học viên F12 lấy link gốc.
 */

const SECRET_KEY = "HocToeic2026_SecureKey_Cloudflare";

/**
 * Mã hóa Google Drive File ID thành token an toàn (Hex XOR cipher)
 */
export function encodeDriveId(fileId: string): string {
  if (!fileId) return "";
  const keyChars = Array.from(SECRET_KEY);
  const encoded = Array.from(fileId)
    .map((ch, i) => {
      const code = ch.charCodeAt(0) ^ keyChars[i % keyChars.length].charCodeAt(0);
      return code.toString(16).padStart(2, "0");
    })
    .join("");
  return `v1_${encoded}`;
}

/**
 * Giải mã token thành Google Drive File ID gốc
 */
export function decodeDriveId(token: string): string {
  if (!token) return "";
  if (!token.startsWith("v1_")) return token; // Fallback nếu là id gốc
  const hex = token.slice(3);
  const keyChars = Array.from(SECRET_KEY);
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    const original = code ^ keyChars[(i / 2) % keyChars.length].charCodeAt(0);
    result += String.fromCharCode(original);
  }
  return result;
}

/**
 * Trích xuất Google Drive File ID từ bất kỳ định dạng link nào
 */
export function extractDriveFileId(url: string): string {
  if (!url) return "";
  let fileId = "";
  const dMatch = url.match(/\/d\/([^/&?]+)/);
  const idMatch = url.match(/[?&]id=([^/&?]+)/);
  if (dMatch) fileId = dMatch[1];
  else if (idMatch) fileId = idMatch[1];
  return fileId;
}

/**
 * Chuyển đổi link Google Drive sang URL stream Cloudflare Worker có mã hóa token
 */
export function buildSecureStreamUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  const workerBase = process.env.NEXT_PUBLIC_CLOUDFLARE_VIDEO_PROXY || "https://toeic-video-proxy.thietsshp.workers.dev";

  // Nếu đã là link proxy dạng token
  if (rawUrl.includes("workers.dev") && rawUrl.includes("token=")) {
    return rawUrl;
  }

  // Nếu là link /api/video-proxy?id=xxx cũ
  if (rawUrl.startsWith("/api/video-proxy?id=")) {
    const id = rawUrl.split("id=")[1]?.split("&")[0] || "";
    const token = encodeDriveId(id);
    return `${workerBase}?token=${token}`;
  }

  // Nếu là link Google Drive
  if (rawUrl.includes("drive.google.com") || rawUrl.includes("drive.usercontent.google.com")) {
    const fileId = extractDriveFileId(rawUrl);
    if (fileId) {
      const token = encodeDriveId(fileId);
      return `${workerBase}?token=${token}`;
    }
  }

  return rawUrl;
}
