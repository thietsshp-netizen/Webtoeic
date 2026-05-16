"use client";

import { useMemo, useEffect, useState } from "react";
import 'react-quill-new/dist/quill.snow.css'; // Quan trọng: Nạp CSS của Quill để hiển thị đúng định dạng

interface CourseContentRendererProps {
  content: any;
}

export default function CourseContentRenderer({ content }: CourseContentRendererProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const parsedContent = useMemo(() => {
    if (!content) return null;

    if (typeof content === 'string') {
      // Chỉ cảnh báo nếu là JSON cũ của TipTap (thường bắt đầu bằng {"type":"doc"...)
      // Còn nếu là dữ liệu Part 5 động thì chúng ta sẽ xử lý ở Component khác, không hiện ở đây.
      if (content.startsWith('{"type":"doc"')) {
        return "<p><em>⚠️ Nội dung này được tạo bởi trình soạn thảo cũ. Vui lòng cập nhật lại bài giảng.</em></p>";
      }

      if (content.startsWith('{')) {
        return null; // Không hiển thị JSON thô ra màn hình
      }
      
      // Gỡ bỏ hoàn toàn thuộc tính sandbox khỏi các thẻ iframe cũ lưu trong DB
      // Điều này bắt buộc để hàm window.print() (In PDF) bên trong iframe hoạt động được
      // Nếu có ngoặc kép hoặc ko ngoặc kép đều xóa sạch chữ sandbox
      return content.replace(/sandbox\s*=\s*['"]?[^'"\s>]*['"]?/gi, "");
    }
    return content;
  }, [content]);

  if (!mounted) {
    return (
      <div className="w-full h-[500px] bg-slate-50 animate-pulse rounded-[2.5rem] border border-slate-100 flex items-center justify-center">
        <span className="text-slate-300 font-bold uppercase tracking-widest text-xs">Đang nạp bài giảng...</span>
      </div>
    );
  }

  if (!parsedContent) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-300 italic border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
        Hiện bài giảng này chưa có nội dung chi tiết.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white p-8">
      {/* 
          Thay thế TipTap bằng React-Quill viewer.
          Dùng dangerouslySetInnerHTML kết hợp với ql-editor để kế thừa CSS của thư viện.
      */}
      <div className="ql-snow">
        <div
          suppressHydrationWarning
          className="ql-editor prose max-w-none text-slate-800"
          dangerouslySetInnerHTML={{ __html: parsedContent }}
        />
      </div>

      <style>{`
        /* Fix hiển thị iframe (HTML bài tập) ở chế độ xem */
        .ql-editor iframe[srcdoc] {
          width: 100%;
          min-height: 800px;
          border-radius: 1.5rem;
          margin-top: 1rem;
          margin-bottom: 2rem;
          display: block;
        }
        
        /* Video iframe */
        .ql-editor iframe:not([srcdoc]) {
          width: 100%;
          aspect-ratio: 16 / 9;
          height: auto;
          border-radius: 1.5rem;
          margin-top: 1rem;
          margin-bottom: 2rem;
          display: block;
        }
      `}</style>
    </div>
  );
}
