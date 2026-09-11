/* src/app/api/admin/open-folder/route.ts */
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const homedir = os.homedir();
    const tempDir = os.tmpdir();

    let folderName: string | undefined;
    let fileName: string | undefined;
    let action: string | undefined;
    let fileBuffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      fileName = (formData.get("fileName") as string) || undefined;
      folderName = (formData.get("folderName") as string) || undefined;
      action = (formData.get("action") as string) || "convert";

      if (file) {
        fileBuffer = Buffer.from(await file.arrayBuffer());
      }
    } else {
      const body = await req.json().catch(() => ({}));
      folderName = body.folderName;
      fileName = body.fileName;
      action = body.action;
    }

    let targetDir = path.join(homedir, "Movies");

    if (folderName) {
      const lower = folderName.toLowerCase().trim();
      if (lower === "movies" || lower === "video" || lower === "phim") {
        targetDir = path.join(homedir, "Movies");
      } else if (lower === "documents" || lower === "tài liệu") {
        targetDir = path.join(homedir, "Documents");
      } else if (lower === "desktop" || lower === "màn hình" || lower === "desktop") {
        targetDir = path.join(homedir, "Desktop");
      } else if (lower === "downloads" || lower === "tải về") {
        targetDir = path.join(homedir, "Downloads");
      } else {
        // Kiểm tra các đường dẫn khả dĩ
        const candidates = [
          path.join(homedir, "Movies", folderName),
          path.join(homedir, folderName),
          path.join(homedir, "Downloads", folderName),
          path.join(homedir, "Documents", folderName),
        ];
        const matched = candidates.find((p) => fs.existsSync(p));
        if (matched) {
          targetDir = matched;
        } else {
          targetDir = path.join(homedir, "Movies");
        }
      }
    }

    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch {}
    }

    // XỬ LÝ CHUYỂN ĐỔI SANG .MP4 CHUẨN (H.264 / AAC / FASTSTART) QUA FFMPEG
    if (action === "convert" && fileBuffer) {
      const finalMp4Name = fileName 
        ? (fileName.endsWith(".mp4") ? fileName : `${fileName.replace(/\.[^/.]+$/, "")}.mp4`)
        : `BaiHoc_${Date.now()}.mp4`;

      const tempWebmPath = path.join(tempDir, `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.webm`);
      const tempMp4Path = path.join(tempDir, `out_${Date.now()}_${finalMp4Name}`);
      const finalMp4Path = path.join(targetDir, finalMp4Name);

      await fs.promises.writeFile(tempWebmPath, fileBuffer);

      let convertSuccess = false;
      try {
        const cmd = `ffmpeg -y -i "${tempWebmPath}" -c:v h264_videotoolbox -b:v 6M -c:a aac -b:a 192k -movflags +faststart "${tempMp4Path}"`;
        await execAsync(cmd);
        convertSuccess = true;
      } catch (vtErr) {
        console.warn("[API Convert] h264_videotoolbox failed, trying libx264...", vtErr);
        try {
          const fallbackCmd = `ffmpeg -y -i "${tempWebmPath}" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 192k -movflags +faststart "${tempMp4Path}"`;
          await execAsync(fallbackCmd);
          convertSuccess = true;
        } catch (x264Err) {
          console.error("[API Convert] libx264 fallback failed:", x264Err);
        }
      }

      if (convertSuccess && fs.existsSync(tempMp4Path)) {
        await fs.promises.copyFile(tempMp4Path, finalMp4Path);
        try { await fs.promises.unlink(tempMp4Path); } catch {}
        try { await fs.promises.unlink(tempWebmPath); } catch {}

        const stat = await fs.promises.stat(finalMp4Path);
        const sizeInMB = (stat.size / (1024 * 1024)).toFixed(1) + " MB";

        // Mở Finder trỏ thẳng vào file .mp4 vừa tạo
        if (process.platform === "darwin") {
          exec(`open -R "${finalMp4Path}"`);
        }

        return NextResponse.json({
          success: true,
          fileName: finalMp4Name,
          folderName: path.basename(targetDir),
          fullPath: finalMp4Path,
          fileSize: sizeInMB,
        });
      }
    }

    // Nếu có tên file cụ thể, kiểm tra và mở Finder trỏ thẳng vào file đó (Reveal in Finder)
    if (fileName) {
      const fullFilePath = path.join(targetDir, fileName);
      if (fs.existsSync(fullFilePath)) {
        if (process.platform === "darwin") {
          exec(`open -R "${fullFilePath}"`);
          return NextResponse.json({ success: true, opened: fullFilePath, revealed: true });
        } else if (process.platform === "win32") {
          exec(`explorer.exe /select,"${fullFilePath}"`);
          return NextResponse.json({ success: true, opened: fullFilePath, revealed: true });
        }
      }
    }

    // Mở thư mục bằng trình quản lý tệp tin gốc của Hệ điều hành (Finder trên macOS)
    if (process.platform === "darwin") {
      exec(`open "${targetDir}"`);
    } else if (process.platform === "win32") {
      exec(`explorer.exe "${targetDir}"`);
    } else {
      exec(`xdg-open "${targetDir}"`);
    }

    return NextResponse.json({ success: true, opened: targetDir });
  } catch (err: any) {
    console.error("[API OpenFolder] Error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
