"use client";

import React, { useCallback, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { UploadCloud, Video } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import 'react-quill-new/dist/quill.snow.css';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    const { Quill } = await import('react-quill-new');
    const BlockEmbed = Quill.import('blots/block/embed') as any;

    class UniversalIframe extends BlockEmbed {
      static create(value: any) {
        let node = super.create();

        if (value.src) {
          // --- CHO VIDEO (YOUTUBE/DRIVE) ---
          node.setAttribute('src', value.src);
          // KHÓA CHẾT TỶ LỆ 16/9 VÀ BẮT CHIỀU CAO PHẢI CHẠY THEO CHIỀU NGANG (height: auto)
          node.setAttribute('style', 'width: 100% !important; aspect-ratio: 16/9 !important; height: auto !important; display: block; margin: 1.5rem 0; border-radius: 1rem; overflow: hidden;');
        }
        else if (value.srcdoc) {
          // --- CHO BÀI TẬP HTML ---
          node.setAttribute('srcdoc', value.srcdoc);
          // Bài tập HTML thì nên dùng vh (view-height) hoặc cố định để có chỗ cuộn code bên trong
          node.setAttribute('style', 'width: 100% !important; height: 80vh !important; min-height: 500px; border: 2px dashed #3b82f6; display: block; border-radius: 1rem;');
        }

        node.setAttribute('frameborder', '0');
        node.setAttribute('allowfullscreen', 'true');
        // Xóa hoàn toàn thuộc tính sandbox để hàm window.print() của File HTML có thể hoạt động được
        return node;
      }

      static value(node: HTMLElement) {
        return { src: node.getAttribute('src'), srcdoc: node.getAttribute('srcdoc') };
      }
    }

    UniversalIframe.blotName = 'universal-iframe';
    UniversalIframe.tagName = 'iframe';
    Quill.register(UniversalIframe);

    const Wrapper = ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
    return Wrapper;
  },
  { ssr: false, loading: () => <div className="p-8 text-center animate-pulse">Đang tải trình soạn thảo...</div> }
);

export default function QuillEditor({ initialContent, onChange, editable = true }: any) {
  const [uploading, setUploading] = useState(false);
  const quillRef = useRef<any>(null);

  const handleInsertVideo = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    let url = prompt("Dán link Youtube hoặc Drive:");
    if (!url) return;

    if (url.includes("youtube.com/watch?v=")) {
      url = "https://www.youtube.com/embed/" + url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      url = "https://www.youtube.com/embed/" + url.split("/").pop();
    }
    if (url.includes("drive.google.com/file/d/")) {
      url = url.replace(/\/view.*$/, "") + "/preview";
    }

    const range = editor.getSelection();
    const index = range ? range.index : editor.getLength();
    editor.insertEmbed(index, 'universal-iframe', { src: url });
    editor.setSelection(index + 1);
  }, []);

  const handleUploadFile = useCallback(async () => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const htmlContent = event.target?.result as string;
          const range = editor.getSelection();
          const index = range ? range.index : editor.getLength();
          editor.insertEmbed(index, 'universal-iframe', { srcdoc: htmlContent });
          await supabase.storage.from('lessons').upload(`lesson-${Date.now()}-${file.name}`, file, { contentType: 'text/html' });
        };
        reader.readAsText(file);
      } catch (err: any) { alert(err.message); } finally { setUploading(false); }
    };
    input.click();
  }, []);

  if (!editable) {
    return (
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: initialContent || "" }} />
        {/* CSS ĐÈ BẸP MỌI CHIỀU CAO CỐ ĐỊNH PHÍA HỌC VIÊN */}
        <style>{`
          iframe:not([srcdoc]) {
            width: 100% !important;
            aspect-ratio: 16 / 9 !important;
            height: auto !important;
          }
          iframe[srcdoc] {
            width: 100% !important;
            height: 70vh !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="w-full relative flex flex-col bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button onClick={handleInsertVideo} className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl font-bold transition-all active:scale-95">
            <Video size={18} /> VIDEO
          </button>
          <button onClick={handleUploadFile} disabled={uploading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold transition-all active:scale-95">
            <UploadCloud size={18} /> HTML
          </button>
        </div>
      </div>

      <div className="bg-white">
        <ReactQuill
          forwardedRef={quillRef}
          theme="snow"
          value={initialContent || ''}
          onChange={onChange}
          modules={{ toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link', 'image'], ['clean']] }}
          className="min-h-[500px]"
        />
      </div>
    </div>
  );
}