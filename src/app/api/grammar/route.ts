import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin khóa học (courseId)." },
        { status: 400 }
      );
    }

    const session = (await getServerSession(authOptions)) as any;
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Bạn cần đăng nhập và tham gia khóa học này để xem các nội dung chi tiết." },
        { status: 401 }
      );
    }

    const isExpired = session.user?.role !== "ADMIN" && session.user?.expiresAt && new Date(session.user.expiresAt) < new Date();
    if (isExpired) {
      return NextResponse.json(
        { success: false, error: "EXPIRED", message: "Tài khoản của bạn đã hết hạn sử dụng. Vui lòng liên hệ Admin để đăng ký khóa học chính thức và tiếp tục học tập!" },
        { status: 403 }
      );
    }

    if (session.user?.role !== "ADMIN") {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: courseId,
          },
        },
      });

      if (!enrollment) {
        return NextResponse.json(
          { success: false, error: "FORBIDDEN", message: "Tài khoản của bạn chưa được cấp quyền truy cập. Vui lòng liên hệ Admin để được hỗ trợ mở khóa!" },
          { status: 403 }
        );
      }
    }

    const dirPath = path.join(process.cwd(), "10 gramma lesson");

    if (!fs.existsSync(dirPath)) {
      return NextResponse.json(
        { success: false, error: "Thư mục chứa bài học ngữ pháp không tồn tại." },
        { status: 404 }
      );
    }

    const files = fs.readdirSync(dirPath).filter(file => file.endsWith(".json"));

    // Đọc danh sách PDF đã được copy vào public
    const pdfDir = path.join(process.cwd(), "public/grammar");
    const pdfFiles = fs.existsSync(pdfDir) ? fs.readdirSync(pdfDir).filter(f => f.endsWith(".pdf")) : [];

    const lessons = files.map(filename => {
      const match = filename.match(/\d+/);
      const index = match ? parseInt(match[0], 10) : 999;

      const filePath = path.join(dirPath, filename);
      const contentRaw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(contentRaw);

      // Tìm file PDF có số thứ tự tương ứng
      const pdfFile = pdfFiles.find(f => {
        const fMatch = f.match(/\d+/);
        return fMatch && parseInt(fMatch[0], 10) === index;
      });
      const pdfUrl = pdfFile ? `/grammar/${encodeURIComponent(pdfFile)}` : null;

      return {
        id: index,
        title: data.theory?.title || filename.replace(".json", ""),
        htmlContent: data.theory?.htmlContent || "",
        pdfUrl: pdfUrl,
        filename: filename,
        practice: data.practice || null
      };
    });

    // Sắp xếp các bài học tăng dần theo số thứ tự của bài (Bài 0, Bài 1,...)
    lessons.sort((a, b) => a.id - b.id);

    return NextResponse.json({ success: true, lessons });
  } catch (error: any) {
    console.error("[GET_GRAMMAR_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
