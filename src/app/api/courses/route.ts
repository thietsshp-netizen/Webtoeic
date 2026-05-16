import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// [GET] Lấy danh sách khóa học cho Dashboard
export async function GET() {
  try {
    const rawCourses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sections: {
          include: {
            lessons: {
              select: { id: true, isPreview: true, title: true }
            }
          }
        }
      }
    });

    const courses = rawCourses.map(course => {
      const sections = course.sections || [];
      const allLessons = sections.flatMap(s => s.lessons || []);
      const totalLessons = allLessons.length;
      const totalSections = sections.length;
      const previewLessons = allLessons.filter(l => l.isPreview);
      const previewCount = previewLessons.length;
      const { sections: _, ...data } = course;
      
      return {
        ...data,
        totalLessons,
        totalSections,
        previewCount,
        previewLessons
      };
    });

    return NextResponse.json({ success: true, courses });
  } catch (error: any) {
    console.error('[COURSES_GET_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// [POST] Tạo khóa học mới
export async function POST(req: Request) {
  try {
    const { title, description, isPublic, coverImage } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Tiêu đề là bắt buộc" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || "",
        isPublic: isPublic || false,
        coverImage: coverImage || null,
      }
    });

    return NextResponse.json({ 
      success: true, 
      courseId: course.id 
    });
  } catch (error: any) {
    console.error('[COURSES_POST_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// [DELETE] Xóa một hoặc nhiều khóa học
/* 
  LƯU Ý QUAN TRỌNG: TUYỆT ĐỐI KHÔNG xóa các file vật lý (.html, .pdf, .mp4, ...) khi xóa khóa học.
  Giữ lại file để tránh ảnh hưởng đến các khóa học khác có thể đang dùng chung tài liệu này. 
  Chỉ xóa liên kết trong Database (Reference).
*/
export async function DELETE(req: Request) {
  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Tham số 'ids' không hợp lệ" }, { status: 400 });
    }

    // Thực hiện xóa bản ghi (Cascade sẽ lo phần Sections/Lessons)
    await prisma.course.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({ success: true, message: "Đã xóa khóa học thành công (Giữ nguyên file gốc)" });
  } catch (error: any) {
    console.error('[COURSES_DELETE_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




