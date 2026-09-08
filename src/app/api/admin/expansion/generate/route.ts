import { NextResponse } from "next/server";
import { generateMovieExpansionForSub } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Chưa cấu hình GEMINI_API_KEY trong file .env. Vui lòng thêm API Key hoặc sử dụng tính năng Copy Prompt/Dán JSON thủ công."
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { text, vietnamese } = body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp nội dung câu thoại (text)." },
        { status: 400 }
      );
    }

    const expansionData = await generateMovieExpansionForSub(text.trim(), (vietnamese || "").trim());

    return NextResponse.json({
      success: true,
      data: expansionData
    });
  } catch (error: any) {
    console.error("[GEMINI_EXPANSION_API_ERROR]", error);

    const errorMsg = error?.message || "";
    let friendlyError = "Không thể tạo dữ liệu từ Gemini. Vui lòng thử lại!";

    if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
      friendlyError = "Đã chạm giới hạn tần suất gọi Gemini (15 lượt/phút hoặc hết quota ngày). Vui lòng đợi vài giây hoặc sang ngày hôm sau!";
    } else if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key not valid")) {
      friendlyError = "API Key của Gemini không hợp lệ. Vui lòng kiểm tra lại GEMINI_API_KEY!";
    } else if (errorMsg) {
      friendlyError = `Lỗi từ Gemini: ${errorMsg}`;
    }

    return NextResponse.json(
      {
        success: false,
        error: friendlyError
      },
      { status: 500 }
    );
  }
}
