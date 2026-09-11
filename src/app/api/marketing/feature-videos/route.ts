import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  FeatureVideoItem,
  extractOrderFromFileName,
  getFeatureVideoMeta,
  getDefaultFeatureVideos,
  SUPABASE_STORAGE_BASE,
} from "@/data/featureVideos";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lvbdcqoagtrzvnaeeznm.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YmRjcW9hZ3RyenZuYWVlem5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM4NTAzOCwiZXhwIjoyMDkwOTYxMDM4fQ.k2hshbZxEgAanCWKNsxEpw9pHQ2bsMlEvbUqmu9L38M";

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

    // 2. Lọc các file ảnh thumbnail trong cùng bucket
    const imageFiles = (files || []).filter((f) => {
      if (!f.name || f.name.startsWith(".") || f.name === ".emptyKeep") return false;
      const lower = f.name.toLowerCase();
      return (
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp")
      );
    });

    // 3. Lọc các file video .mp4, .webm, .mov hợp lệ
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
        const publicUrl = `${SUPABASE_STORAGE_BASE}/${encodeURIComponent(f.name)}`;

        // Tự động tìm ảnh thumbnail tương ứng trong cùng bucket
        const baseName = f.name.replace(/\.[^/.]+$/, "").toLowerCase();
        const matchedImg = imageFiles.find((img) => {
          const imgBase = img.name.replace(/\.[^/.]+$/, "").toLowerCase();
          if (imgBase === baseName) return true;
          return extractOrderFromFileName(img.name, -1) === order;
        });

        const bucketThumbUrl = matchedImg
          ? `${SUPABASE_STORAGE_BASE}/${encodeURIComponent(matchedImg.name)}`
          : undefined;

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
          thumbnail: bucketThumbUrl || meta.thumbnail,
          color: meta.color || "blue",
        };
      });
    } else {
      // Fallback danh sách video chuẩn xác 100%
      items = getDefaultFeatureVideos();
    }

    return NextResponse.json({
      success: true,
      total: items.length,
      videos: items,
    });
  } catch (err: any) {
    console.error("Lỗi API Feature Videos:", err);
    // Vẫn trả về danh sách fallback chuẩn xác để web không bao giờ bị đơ hay đen màn hình
    return NextResponse.json({
      success: true,
      total: 4,
      videos: getDefaultFeatureVideos(),
    });
  }
}
