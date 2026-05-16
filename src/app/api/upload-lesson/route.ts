import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  console.log("[API] Nhận yêu cầu Upload Lesson...");
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      console.error("[API] supabaseAdmin đang bị NULL. Kiểm tra lại .env URL/Key.");
      return NextResponse.json({ 
        error: "Cấu hình Supabase (URL/Key) không hợp lệ hoặc thiếu trong .env" 
      }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy file để upload" }, { status: 400 });
    }

    const bucketName = 'lessons';
    // 1. Kiểm tra và đồng bộ cấu hình Bucket (Gỡ bỏ giới hạn MIME để tránh xung đột)
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: null // Cho phép tất cả để tránh lỗi metadata
      });
    } else {
      await supabaseAdmin.storage.updateBucket(bucketName, {
        public: true,
        allowedMimeTypes: null
      });
    }

    // 2. Chuẩn bị file bằng đối tượng File (Chuẩn nhất cho môi trường hiện đại)
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const arrayBuffer = await file.arrayBuffer();
    const finalFile = new File([arrayBuffer], fileName, { type: 'text/html' });

    // 3. Thực hiện Upload với Content-Type ép buộc
    console.log(`[Storage] Đang đẩy file ${fileName} lên...`);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, finalFile, {
        contentType: 'text/html',
        cacheControl: '0',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 4. Lấy Public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // 5. Đọc và Sửa lỗi tiêu đề "SRCDOC" bằng Script Injection (Giải pháp dứt điểm)
    let htmlContent = await file.text();
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/-/g, " ").replace(/_/g, " ").toUpperCase();
    
    const correctionScript = `
      <script>
        (function() {
          const fixTitle = () => {
            const titleEl = document.getElementById('file-title');
            if (titleEl && (titleEl.innerText.trim() === 'SRCDOC' || titleEl.innerText.trim() === '')) {
              titleEl.innerText = "${cleanFileName}";
            }
          };
          window.addEventListener('load', fixTitle);
          setTimeout(fixTitle, 100); // Sửa thêm lần nữa sau 100ms để chắc chắn
        })();
      </script>
    `;

    // Chèn script vào cuối body hoặc cuối file
    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${correctionScript}</body>`);
    } else {
      htmlContent += correctionScript;
    }

    return NextResponse.json({
      success: true,
      message: "Tải bài học lên thành công!",
      path: uploadData.path,
      url: urlData.publicUrl,
      htmlContent: htmlContent // Trả về nội dung thô
    });

  } catch (error: any) {
    console.error('[UPLOAD_LESSON_API_ERROR]', error);
    return NextResponse.json({ 
      error: error.message || "Lỗi xử lý upload bài học" 
    }, { status: 500 });
  }
}
