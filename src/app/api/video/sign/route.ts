import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";

// Map public R2 bucket URLs → bucket names
const BUCKET_MAP: Record<string, string> = {
  "pub-d60184ec6eae4e6299cd4882b5d212dc.r2.dev": process.env.R2_BUCKET_FRIENDS || "friends-videos",
  "pub-b39190faa3bc46a79df52b7a4f47c377.r2.dev": process.env.R2_BUCKET_ETS2026 || "video-giai-de-upload-web-hoctoeic",
};

function parseR2Url(videoUrl: string): { bucket: string; key: string } | null {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname;
    const bucket = BUCKET_MAP[host];
    if (!bucket) return null;
    const key = decodeURIComponent(url.pathname.slice(1));
    return { bucket, key };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // 1. Kiểm tra đăng nhập
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Lấy video URL từ query param
  const videoUrl = request.nextUrl.searchParams.get("url");
  if (!videoUrl) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // 3. Parse bucket + key từ URL
  const parsed = parseR2Url(videoUrl);
  if (!parsed) {
    // URL không phải R2 → trả về nguyên bản
    return NextResponse.json({ signedUrl: videoUrl });
  }

  // 4. Kiểm tra biến môi trường R2, nếu thiếu thì fallback trả về videoUrl gốc
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.warn("[video/sign] Missing R2 credentials in environment variables. Falling back to original video URL.");
    return NextResponse.json({ signedUrl: videoUrl });
  }

  // 5. Tạo S3 client trỏ vào Cloudflare R2
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  // 6. Tạo Presigned URL hết hạn sau 6 giờ
  try {
    const command = new GetObjectCommand({
      Bucket: parsed.bucket,
      Key: parsed.key,
    });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 6 * 3600 });
    return NextResponse.json({ signedUrl });
  } catch (err) {
    console.error("[video/sign] Error generating presigned URL:", err);
    // Fallback trả về URL gốc thay vì văng 500
    return NextResponse.json({ signedUrl: videoUrl });
  }
}
