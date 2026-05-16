import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    // TODO: Connect to Cloudinary Node SDK using process.env.CLOUDINARY_API_KEY
    // Example:
    // const result = await cloudinary.uploader.upload(bufferData, { folder: "toeic_admin" });
    
    // Giả lập trả về cấu trúc mảng HTTPS giả của Cloudinary để TipTap có thể chạy tiếp
    return NextResponse.json({
      success: true,
      url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" 
    });
  } catch (error) {
    console.error('[UPLOAD_POST]', error);
    return NextResponse.json({ error: "Lỗi hệ thống hoặc Thiếu API Keys" }, { status: 500 });
  }
}
