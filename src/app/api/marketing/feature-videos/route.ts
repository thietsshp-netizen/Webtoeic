import { NextResponse } from "next/server";
import { getDefaultFeatureVideos } from "@/data/featureVideos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = getDefaultFeatureVideos();

    return NextResponse.json({
      success: true,
      total: items.length,
      videos: items,
    });
  } catch (err: any) {
    console.error("Lỗi API Feature Videos:", err);
    return NextResponse.json({
      success: true,
      total: 4,
      videos: getDefaultFeatureVideos(),
    });
  }
}
