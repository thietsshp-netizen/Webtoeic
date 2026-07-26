import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error("[Supabase] supabaseAdmin bị NULL. Vui lòng kiểm tra lại cấu hình env.");
      return NextResponse.json({ error: "Chưa cấu hình Supabase Client trên máy chủ." }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "Không nhận được tệp tin." }, { status: 400 });
    }

    const bucketName = 'ielts-reading-pic';

    // 1. Đảm bảo bucket tồn tại và ở chế độ Public
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: null
      });
    } else {
      await supabaseAdmin.storage.updateBucket(bucketName, {
        public: true,
        allowedMimeTypes: null
      });
    }

    // 2. Upload file lên Supabase Storage
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `ielts-${uniqueSuffix}-${file.name.replace(/\s+/g, '_')}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileObject = new File([arrayBuffer], fileName, { type: file.type });

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, fileObject, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // 3. Lấy Public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl 
    });
  } catch (error: any) {
    console.error('[UPLOAD_IELTS_PIC_ERROR]', error);
    return NextResponse.json({ error: "Lỗi tải ảnh lên Supabase: " + error.message }, { status: 500 });
  }
}
