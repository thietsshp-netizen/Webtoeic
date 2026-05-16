"use client";

// Giao diện soạn thảo/chỉnh sửa dành riêng cho TOEIC Part 5 (Incomplete Sentences)
// Nhấn mạnh vào text và giải thích ngữ pháp

interface Part5Data {
  questionNo: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
}

interface Part5EditorProps {
  question: Part5Data;
  onChange: (data: Partial<Part5Data>) => void;
}

export default function Part5Editor({ question, onChange }: Part5EditorProps) {
  return (
    <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm my-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
          Part 5: Incomplete Sentences
        </h3>
        <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">
          Câu {question.questionNo}
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Question Text */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Câu hỏi (Dùng '___' cho chỗ trống)</label>
          <input 
            type="text" 
            className="w-full rounded-xl border-slate-200 shadow-sm p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border"
            placeholder="Ví dụ: The manager asked ___ to finish the report by Friday."
            value={question.questionText}
            onChange={(e) => onChange({ questionText: e.target.value })}
          />
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Option A</label>
            <input 
              type="text" 
              className="w-full border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={question.optionA}
              onChange={(e) => onChange({ optionA: e.target.value })}
            />
          </div>
          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Option B</label>
            <input 
              type="text" 
              className="w-full border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={question.optionB}
              onChange={(e) => onChange({ optionB: e.target.value })}
            />
          </div>
          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Option C</label>
            <input 
              type="text" 
              className="w-full border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={question.optionC}
              onChange={(e) => onChange({ optionC: e.target.value })}
            />
          </div>
          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Option D</label>
            <input 
              type="text" 
              className="w-full border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={question.optionD}
              onChange={(e) => onChange({ optionD: e.target.value })}
            />
          </div>
        </div>

        {/* Answer & Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Đáp án đúng</label>
              <select 
                className="w-full border-slate-200 rounded-xl shadow-sm p-3 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 border appearance-none cursor-pointer"
                value={question.correctAnswer}
                onChange={(e) => onChange({ correctAnswer: e.target.value })}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Giải thích (Explanation)</label>
                <textarea 
                  className="w-full rounded-xl border-slate-200 shadow-sm p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 border outline-none transition-all"
                  placeholder="Giải thích lý do chọn đáp án này..."
                  rows={2}
                  value={question.explanation}
                  onChange={(e) => onChange({ explanation: e.target.value })}
                ></textarea>
            </div>
        </div>
      </div>
    </div>
  );
}
