import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  FeatureVideoItem,
  extractOrderFromFileName,
  getFeatureVideoMeta,
  FEATURE_VIDEOS_METADATA,
} from "@/data/featureVideos";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvbdcqoagtrzvnaeeznm.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const BUCKET_NAME = "Video_web_function";

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Lấy danh sách files trong bucket Video_web_function
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      console.warn("Storage list warning for Video_web_function:", error.message);
    }

    // 2. Lọc các file video .mp4, .webm, .mov hợp lệ
    const validFiles = (files || []).filter((f) => {
      if (!f.name || f.name.startsWith(".") || f.name === ".emptyKeep") return false;
      const lower = f.name.toLowerCase();
      return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov");
    });

    let items: FeatureVideoItem[] = [];

    if (validFiles.length > 0) {
      // Sắp xếp tự nhiên theo số thứ tự (1, 2, 3, 4, 10...)
      validFiles.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      );

      items = validFiles.map((f, idx) => {
        const order = extractOrderFromFileName(f.name, idx);
        const meta = getFeatureVideoMeta(order, f.name);
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${encodeURIComponent(
          f.name
        )}`;

        return {
          id: f.id || `video-${order}-${idx}`,
          order: order,
          fileName: f.name,
          videoUrl: publicUrl,
          title: meta.title || `Tính năng số ${order}`,
          subtitle: meta.subtitle || "",
          badge: meta.badge || `TÍNH NĂNG ${order}`,
          category: meta.category || "TÍNH NĂNG",
          description: meta.description || "",
          highlights: meta.highlights || [],
          thumbnail: meta.thumbnail,
          color: meta.color || "blue",
        };
      });
    } else {
      // Nếu bucket chưa kịp upload hoặc đang tải lên, cung cấp fallback danh sách chuẩn từ metadata
      items = Object.entries(FEATURE_VIDEOS_METADATA).map(([key, meta]) => {
        const order = parseInt(key, 10);
        return {
          id: `fallback-video-${order}`,
          order: order,
          fileName: `${order}-chuc-nang.mp4`,
          videoUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${order}-chuc-nang.mp4`,
          title: meta.title || `Tính năng số ${order}`,
          subtitle: meta.subtitle || "",
          badge: meta.badge || `TÍNH NĂNG ${order}`,
          category: meta.category || "TÍNH NĂNG",
          description: meta.description || "",
          highlights: meta.highlights || [],
          thumbnail: meta.thumbnail,
          color: meta.color || "blue",
        };
      });
    }

    return NextResponse.json({
      success: true,
      total: items.length,
      videos: items,
    });
  } catch (err: any) {
    console.error("Lỗi API Feature Videos:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Lỗi không xác định khi lấy danh sách video",
      },
      { status: 500 }
    );
  }
}
