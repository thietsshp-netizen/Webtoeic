"use client";

import { Music, Image as ImageIcon, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Part34Group {
  audioUrl: string;
  imageUrl?: string;
  transcript: string;
  questions: {
    questionNo: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation?: string;
  }[];
}

interface ToeicPart34EditorProps {
  data: Part34Group;
  onChange: (data: Part34Group) => void;
  onRemove: () => void;
}

export default function ToeicPart34Editor({ data, onChange, onRemove }: ToeicPart34EditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Cập nhật câu hỏi lẻ trong nhóm
  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...data.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    onChange({ ...data, questions: newQuestions });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-100">
      {/* Group Header */}
      <div className="p-6 bg-slate-50/50 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-white hover:text-blue-500 transition-all shadow-sm"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
               <span className="px-3 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                 NHÓM CÂU {data.questions[0]?.questionNo} - {data.questions[data.questions.length - 1]?.questionNo}
               </span>
               <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Part 3 / 4</span>
            </div>
            <p className="text-slate-800 font-black text-sm tracking-tight line-clamp-1 max-w-md">
              {data.questions[0]?.questionText || "Cụm câu hỏi nghe hiểu"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={onRemove}
             className="w-10 h-10 rounded-2xl bg-white border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
           >
             <Trash2 size={18} />
           </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-300">
          {/* Media Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Music size={14} className="text-blue-500" /> FILE ÂM THANH (URL)
              </label>
              <input 
                type="text"
                placeholder="https://..."
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-600 transition-all"
                value={data.audioUrl}
                onChange={(e) => onChange({ ...data, audioUrl: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-emerald-500" /> HÌNH ẢNH (URL - Tùy chọn)
              </label>
              <input 
                type="text"
                placeholder="https://..."
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-600 transition-all"
                value={data.imageUrl || ""}
                onChange={(e) => onChange({ ...data, imageUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TRANSCRIPT (Bản gốc - Dùng Markdown $^{}$ và ** **)</label>
            <textarea 
              rows={4}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-[2rem] outline-none font-medium text-slate-600 whitespace-pre-wrap transition-all resize-none"
              value={data.transcript}
              onChange={(e) => onChange({ ...data, transcript: e.target.value })}
            />
          </div>

          {/* Questions Grid */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2">Danh sách 3 câu hỏi</label>
            <div className="grid grid-cols-1 gap-8">
              {data.questions.map((q, idx) => (
                <div key={idx} className="p-6 bg-slate-50/30 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                     <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                       {q.questionNo}
                     </span>
                     <input 
                       type="text"
                       placeholder="Nhập câu hỏi..."
                       className="flex-1 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 py-1 outline-none font-bold text-slate-800 transition-all"
                       value={q.questionText}
                       onChange={(e) => updateQuestion(idx, "questionText", e.target.value)}
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
                     {["A", "B", "C", "D"].map(opt => (
                       <div key={opt} className="relative group">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xs text-slate-300 group-focus-within:text-blue-500">{opt}</span>
                         <input 
                           type="text"
                           placeholder={`Lựa chọn ${opt}...`}
                           className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 focus:border-blue-200 rounded-xl outline-none text-sm font-bold text-slate-600 transition-all"
                           value={(q as any)[`option${opt}`]}
                           onChange={(e) => updateQuestion(idx, `option${opt}`, e.target.value)}
                         />
                       </div>
                     ))}
                  </div>

                  <div className="ml-12 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ĐÁP ÁN ĐÚNG:</span>
                       <div className="flex gap-2">
                         {["A", "B", "C", "D"].map(opt => (
                           <button 
                             key={opt}
                             onClick={() => updateQuestion(idx, "correctAnswer", opt)}
                             className={`w-8 h-8 rounded-lg font-black text-xs transition-all ${q.correctAnswer === opt ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50"}`}
                           >
                             {opt}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
