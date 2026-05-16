"use client";

import { useState, useRef } from "react";
import { Upload, FileAudio, ImageIcon, X, Loader2, CheckCircle2 } from "lucide-react";
import { getSupabasePublic } from "@/lib/supabase";

interface MediaUploaderProps {
  onUploadComplete: (url: string) => void;
  type: "image" | "audio";
  initialUrl?: string;
  label?: string;
}

export default function MediaUploader({ onUploadComplete, type, initialUrl, label }: MediaUploaderProps) {
  const [url, setUrl] = useState(initialUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploading(true);

    try {
      const supabase = getSupabasePublic();
      if (!supabase) throw new Error("Supabase client not initialized");

      // Tạo tên file độc nhất để tránh trùng lặp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${type}s/${fileName}`; // e.g., images/123.jpg or audios/123.mp3

      // Upload lên bucket 'toeic-media'
      const { data, error: uploadError } = await supabase.storage
        .from('toeic-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Lấy Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('toeic-media')
        .getPublicUrl(filePath);

      setUrl(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Lỗi khi upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = () => {
    setUrl("");
    onUploadComplete("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-semibold text-slate-700">{label}</label>}
      
      <div className="relative group">
        {!url ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer
              ${isUploading ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'}
            `}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : type === "image" ? (
              <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-blue-400" />
            ) : (
              <FileAudio className="w-8 h-8 text-slate-300 group-hover:text-blue-400" />
            )}
            <div className="text-center">
              <p className="text-xs font-bold text-slate-600">
                {isUploading ? "Đang tải lên..." : `Tải ${type === "image" ? "ảnh" : "âm thanh"} lên`}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">
                {type === "image" ? "JPG, PNG (Max 5MB)" : "MP3 (Max 10MB)"}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            {type === "image" ? (
              <img src={url} alt="Uploaded" className="w-full h-32 object-cover" />
            ) : (
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audio Ready</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{url.split('/').pop()}</p>
                </div>
              </div>
            )}
            
            <button 
              onClick={removeMedia}
              className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white transition-all scale-90"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept={type === "image" ? "image/*" : "audio/mpeg,audio/mp3"}
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      {error && <p className="text-[10px] font-bold text-red-500 px-1">{error}</p>}
    </div>
  );
}
