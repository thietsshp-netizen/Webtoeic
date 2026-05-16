import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "Không nhận được tệp tin." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Xác định đường dẫn lưu trữ: public/uploads/courses
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'courses');
    
    // Tạo thư mục nếu chưa tồn tại
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Tạo tên tệp tin duy nhất
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `cover-${uniqueSuffix}-${file.name.replace(/\s+/g, '_')}`;
    const path = join(uploadDir, filename);

    // Lưu tệp tin
    await writeFile(path, buffer);
    
    // Trả về URL công khai
    const publicUrl = `/uploads/courses/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl 
    });
  } catch (error: any) {
    console.error('[UPLOAD_COVER_ERROR]', error);
    return NextResponse.json({ error: "Lỗi máy chủ khi tải ảnh lên: " + error.message }, { status: 500 });
  }
}
