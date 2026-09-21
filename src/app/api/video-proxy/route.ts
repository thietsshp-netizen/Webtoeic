import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Thiếu mã file id", { status: 400 });
  }

  const workerBase = process.env.NEXT_PUBLIC_CLOUDFLARE_VIDEO_PROXY || "https://toeic-video-proxy.thietsshp.workers.dev";
  const redirectUrl = `${workerBase}?id=${encodeURIComponent(id)}`;

  // Chuyển hướng 307 sang Cloudflare Worker để Vercel không tải video và không tốn băng thông Origin Transfer
  return NextResponse.redirect(redirectUrl, {
    status: 307,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
