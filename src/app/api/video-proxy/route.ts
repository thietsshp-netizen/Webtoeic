import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Thiếu mã file id", { status: 400 });
  }

  // URL tải trực tiếp kèm xác nhận bỏ qua cảnh báo file lớn (>100MB)
  const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`;

  const headers: HeadersInit = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  // Chuyển tiếp Range request để trình duyệt có thể tua (seek) video
  const range = req.headers.get("range");
  if (range) {
    headers["Range"] = range;
  }

  try {
    const upstreamRes = await fetch(driveUrl, {
      headers,
      redirect: "follow",
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new NextResponse(`Lỗi tải video từ Google Drive: ${upstreamRes.statusText}`, {
        status: upstreamRes.status,
      });
    }

    const resHeaders = new Headers();
    resHeaders.set("Content-Type", upstreamRes.headers.get("content-type") || "video/mp4");
    resHeaders.set("Accept-Ranges", "bytes");
    resHeaders.set("Content-Disposition", "inline");
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Cache-Control", "public, max-age=3600");

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) {
      resHeaders.set("Content-Range", contentRange);
    }
    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      resHeaders.set("Content-Length", contentLength);
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error("[video-proxy] Lỗi kết nối Google Drive:", err);
    return new NextResponse(`Lỗi Proxy: ${err.message}`, { status: 500 });
  }
}
