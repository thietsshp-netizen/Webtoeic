import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('name');

    if (!fileName) {
      return NextResponse.json({ error: "Thiếu tham số 'name'" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase chưa được cấu hình" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from('lessons')
      .download(fileName);

    if (error) throw error;

    let htmlContent = await data.text();
    const cleanFileName = fileName.replace(/\.[^/.]+$/, "").replace(/-/g, " ").replace(/_/g, " ").toUpperCase();

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
          setTimeout(fixTitle, 100);
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
      htmlContent
    });
  } catch (error: any) {
    console.error('[GET_LESSON_CONTENT_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
