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
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Bạn cần đăng nhập và tham gia khóa học này để xem các nội dung chi tiết." },
        { status: 401 }
      );
    }

    // Lấy thông tin user trực tiếp từ DB để tránh stale session (hết hạn ảo)
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, accountExpiresAt: true, classCode: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Người dùng không tồn tại trong hệ thống." },
        { status: 401 }
      );
    }

    if (dbUser.role !== "ADMIN") {
      const isExpired = dbUser.accountExpiresAt && new Date(dbUser.accountExpiresAt) < new Date();
      if (isExpired) {
        return NextResponse.json(
          { success: false, error: "EXPIRED", message: "Tài khoản của bạn đã hết hạn sử dụng. Vui lòng liên hệ Admin để đăng ký khóa học chính thức và tiếp tục học tập!" },
          { status: 403 }
        );
      }

      // Sổ tay ngữ pháp là tài nguyên chung. Học viên có quyền truy cập nếu:
      // - Có lượt đăng ký khóa học (enrollment) tương ứng với courseId được yêu cầu
      // - Hoặc có ít nhất một enrollment bất kỳ trong hệ thống
      // - Hoặc đã được xếp vào lớp (classCode không phải null)
      let hasAccess = false;

      // 1. Kiểm tra enrollment cụ thể trước
      if (courseId) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: courseId,
            },
          },
        });
        if (enrollment) hasAccess = true;
      }

      // 2. Nếu chưa có, kiểm tra lớp học hoặc enrollment bất kỳ
      if (!hasAccess) {
        const hasClassOrAnyEnrollment = dbUser.classCode || await prisma.enrollment.findFirst({
          where: { userId: session.user.id }
        });
        if (hasClassOrAnyEnrollment) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "FORBIDDEN", message: "Tài khoản của bạn chưa được cấp quyền truy cập. Vui lòng liên hệ Admin để được hỗ trợ mở khóa!" },
          { status: 403 }
        );
      }
    }

    // Tính số buổi điểm danh thực tế của học viên:
    let attendedSessions = 0;
    const isSpecialRole = dbUser.role === "ADMIN";

    if (isSpecialRole) {
      attendedSessions = 999; // Mở khóa toàn bộ cho Admin
    } else if (dbUser.classCode) {
      attendedSessions = await prisma.attendance.count({
        where: {
          userId: session.user.id,
          session: { classCode: dbUser.classCode }
        }
      });
    } else {
      attendedSessions = 0; // Học viên tự do (không có classCode): xem được bài 0 và bài 1
    }

    const lessonIdParam = searchParams.get("lessonId");

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

    // Helper tính toán metadata bài học
    const getLessonMeta = (filename: string) => {
      const lowerName = filename.toLowerCase();
      const isNoiAm = lowerName.includes("noi am") || lowerName.includes("nối âm");
      let index: number;
      let requiredSessions: number;

      if (isNoiAm) {
        index = 10;
        requiredSessions = 1;
      } else {
        const match = filename.match(/\d+/);
        index = match ? parseInt(match[0], 10) : 999;
        requiredSessions = index <= 1 ? 0 : index - 1;
      }

      const isLocked = !isSpecialRole && (attendedSessions < requiredSessions);
      return { index, isNoiAm, requiredSessions, isLocked };
    };

    // TRƯỜNG HỢP 1: Yêu cầu nội dung của một bài học cụ thể (On-Demand Loading)
    if (lessonIdParam !== null) {
      const requestedId = parseInt(lessonIdParam, 10);
      const targetFile = files.find(f => getLessonMeta(f).index === requestedId);

      if (!targetFile) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy bài học." },
          { status: 404 }
        );
      }

      const { isNoiAm, requiredSessions, isLocked } = getLessonMeta(targetFile);

      if (isLocked) {
        return NextResponse.json(
          { success: false, error: "Bài học đang bị khóa.", isLocked: true, requiredSessions },
          { status: 403 }
        );
      }

      const filePath = path.join(dirPath, targetFile);
      const contentRaw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(contentRaw);

      // Nếu có file .html kèm theo (ưu tiên đọc từ .html)
      const htmlFilePath = filePath.replace(/\.json$/, ".html");
      let htmlContent = data.theory?.htmlContent || "";
      if (fs.existsSync(htmlFilePath)) {
        htmlContent = fs.readFileSync(htmlFilePath, "utf-8");
      }

      const pdfFile = isNoiAm
        ? pdfFiles.find(f => f.toLowerCase().includes("noi am") || f.toLowerCase().includes("nối âm"))
        : pdfFiles.find(f => {
            const fMatch = f.match(/\d+/);
            return fMatch && parseInt(fMatch[0], 10) === requestedId;
          });
      const pdfUrl = pdfFile ? `/grammar/${encodeURIComponent(pdfFile)}` : null;

      return NextResponse.json({
        success: true,
        lesson: {
          id: requestedId,
          title: data.theory?.title || targetFile.replace(".json", ""),
          htmlContent,
          pdfUrl,
          filename: targetFile,
          practice: data.practice || null,
          hasPractice: Boolean(data.practice?.parts && data.practice.parts.length > 0),
          isLocked: false,
          requiredSessions
        }
      });
    }

    // TRƯỜNG HỢP 2: Lấy danh sách tổng quan các bài học (Siêu nhẹ, không chứa chuỗi HTML khổng lồ)
    const lessons = files.map(filename => {
      const { index, isNoiAm, requiredSessions, isLocked } = getLessonMeta(filename);

      const filePath = path.join(dirPath, filename);
      const contentRaw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(contentRaw);

      const pdfFile = isNoiAm
        ? pdfFiles.find(f => f.toLowerCase().includes("noi am") || f.toLowerCase().includes("nối âm"))
        : pdfFiles.find(f => {
            const fMatch = f.match(/\d+/);
            return fMatch && parseInt(fMatch[0], 10) === index;
          });
      const pdfUrl = (!isLocked && pdfFile) ? `/grammar/${encodeURIComponent(pdfFile)}` : null;

      return {
        id: index,
        title: data.theory?.title || filename.replace(".json", ""),
        pdfUrl: pdfUrl,
        filename: filename,
        hasPractice: Boolean(data.practice?.parts && data.practice.parts.length > 0),
        isLocked,
        requiredSessions
      };
    });

    // Sắp xếp các bài học tăng dần theo số thứ tự của bài (Bài 0, Bài 1, ..., Bài 9, Nối âm - Nuốt âm)
    lessons.sort((a, b) => a.id - b.id);

    return NextResponse.json({
      success: true,
      lessons,
      attendedSessions,
      hasNoClass: !dbUser.classCode && !isSpecialRole
    });
  } catch (error: any) {
    console.error("[GET_GRAMMAR_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
