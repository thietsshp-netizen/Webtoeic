"use client";

import MediaUploader from "@/components/Common/MediaUploader";

// Giao diện soạn thảo/chỉnh sửa dành riêng cho TOEIC Part 1 (Photographs)
// Mỗi câu Part 1 gồm 1 Ảnh + 1 Audio + Đáp án A/B/C/D

interface Part1Data {
  questionNo: number;
  imageUrl: string;
  audioUrl: string;
  correctAnswer: string;
  transcript: string;
}

interface Part1EditorProps {
  question: Part1Data;
  onChange: (data: Partial<Part1Data>) => void;
}

export default function Part1Editor({ question, onChange }: Part1EditorProps) {
  return (
    <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm my-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
          Part 1: Photographs
        </h3>
        <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">
          Câu {question.questionNo}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Media Side */}
        <div className="space-y-6">
          <MediaUploader 
            type="image" 
            label="Hình ảnh bài thi (Photographs)"
            initialUrl={question.imageUrl}
            onUploadComplete={(url) => onChange({ imageUrl: url })}
          />
          <MediaUploader 
            type="audio" 
            label="Audio bài nghe (MP3)"
            initialUrl={question.audioUrl}
            onUploadComplete={(url) => onChange({ audioUrl: url })}
          />
        </div>

        {/* Info Side */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Đáp án đúng</label>
            <div className="grid grid-cols-4 gap-2">
              {['A', 'B', 'C', 'D'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => onChange({ correctAnswer: opt })}
                  className={`
                    py-3 rounded-xl font-black text-sm transition-all border-2
                    ${question.correctAnswer === opt 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'}
                  `}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Transcript (Tùy chọn)</label>
             <textarea 
              className="w-full rounded-xl border-slate-200 shadow-sm p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 border outline-none transition-all placeholder:text-slate-300" 
              rows={5}
              placeholder="Nhập nội dung bài nghe để học viên đối chiếu..."
              value={question.transcript}
              onChange={(e) => onChange({ transcript: e.target.value })}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
