"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Save, Layout, ListMusic, FileText, 
  ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Library, Headphones
} from "lucide-react";
import Part1Editor from "@/components/Toeic/Part1/Part1Editor";
import Part5Editor from "@/components/Toeic/Part5/Part5Editor";
import ToeicPart34Editor from "@/components/Toeic/Admin/ToeicPart34Editor";
import ToeicLibrarySelector from "@/components/Toeic/Admin/ToeicLibrarySelector";

interface QuestionItem {
  id: string;
  type: "PART1" | "PART5" | "PART3_4";
  data: any;
}

export default function ToeicTestBuilder() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Thêm câu hỏi mới
  const addQuestion = (type: "PART1" | "PART5" | "PART3_4") => {
    const nextNo = questions.length + 1;
    let newItem: QuestionItem;

    if (type === "PART3_4") {
      newItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: "PART3_4",
        data: {
          audioUrl: "",
          imageUrl: "",
          transcript: "",
          questions: [
            { questionNo: nextNo, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" },
            { questionNo: nextNo + 1, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" },
            { questionNo: nextNo + 2, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" },
          ]
        }
      };
    } else {
      newItem = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        data: type === "PART1" 
          ? { questionNo: nextNo, imageUrl: "", audioUrl: "", correctAnswer: "A", transcript: "" }
          : { questionNo: nextNo, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", explanation: "" }
      };
    }
    setQuestions([...questions, newItem]);
  };

  // Chọn từ thư viện
  const handleLibrarySelect = (group: any) => {
    const newItem: QuestionItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: "PART3_4", // Tạm thời thư viện chủ yếu hỗ trợ Part 3/4
      data: {
        audioUrl: group.audioUrl,
        imageUrl: group.imageUrl,
        transcript: group.transcript,
        questions: group.questions.map((q: any) => ({
          questionNo: q.questionNo,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }))
      }
    };
    setQuestions([...questions, newItem]);
    setShowLibrary(false);
  };

  // Cập nhật dữ liệu cho từng câu hỏi
  const updateQuestionData = (id: string, newData: any) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, data: { ...q.data, ...newData } } : q));
  };

  // Xóa câu hỏi
  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Xử lý lưu đề thi
  const handleSave = async () => {
    if (!title) {
       setMsg({ type: 'error', text: "Vui lòng nhập tiêu đề đề thi!" });
       return;
    }
    if (questions.length === 0) {
       setMsg({ type: 'error', text: "Đề thi phải có ít nhất 1 câu hỏi!" });
       return;
    }

    setIsSaving(true);
    setMsg(null);

    try {
      // Chuẩn hóa dữ liệu cho API (Group theo Part)
      const partsMap: Record<number, any> = {};

      questions.forEach(q => {
        let pNum = 1;
        if (q.type === "PART5") pNum = 5;
        if (q.type === "PART3_4") pNum = 3; // Mặc định Part 3 nếu từ builder chung

        if (!partsMap[pNum]) {
          partsMap[pNum] = { partNumber: pNum, title: `Part ${pNum}`, groups: [] };
        }

        if (q.type === "PART1") {
          partsMap[pNum].groups.push({
            audioUrl: q.data.audioUrl,
            imageUrl: q.data.imageUrl,
            questions: [{
              questionNo: q.data.questionNo,
              optionA: "Option A",
              optionB: "Option B",
              optionC: "Option C",
              optionD: "Option D",
              correctAnswer: q.data.correctAnswer,
              explanation: q.data.transcript
            }]
          });
        } else if (q.type === "PART5") {
          partsMap[pNum].groups.push({
            questions: [{
              questionNo: q.data.questionNo,
              questionText: q.data.questionText,
              optionA: q.data.optionA,
              optionB: q.data.optionB,
              optionC: q.data.optionC,
              optionD: q.data.optionD,
              correctAnswer: q.data.correctAnswer,
              explanation: q.data.explanation
            }]
          });
        } else if (q.type === "PART3_4") {
          partsMap[pNum].groups.push({
            audioUrl: q.data.audioUrl,
            imageUrl: q.data.imageUrl,
            transcript: q.data.transcript,
            questions: q.data.questions
          });
        }
      });

      const payload = {
        title,
        description,
        parts: Object.values(partsMap)
      };

      const res = await fetch("/api/admin/toeic-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Lỗi khi lưu đề thi");
      
      setMsg({ type: 'success', text: "Đề thi đã được lưu thành công!" });
      setTimeout(() => router.push("/admin/enrollments"), 2000); 
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 pb-40 max-w-5xl mx-auto">
      {/* Header Điều hướng */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">TOEIC Test Builder</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Hệ thống tạo đề thi theo chuẩn IIG</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2.5 px-6 py-3 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Lưu Đề Thi
        </button>
      </div>

      {msg && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm uppercase tracking-wider">{msg.text}</span>
        </div>
      )}

      {/* Thông tin cơ bản */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-12 space-y-6">
        <h2 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          <Layout size={14} className="text-blue-500" /> THÔNG TIN CƠ BẢN
        </h2>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Tên đề thi (ví dụ: ETS 2024 - Test 01)"
            className="w-full text-2xl font-black border-b-2 border-slate-100 focus:border-blue-500 p-2 outline-none transition-all placeholder:text-slate-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea 
            placeholder="Mô tả ngắn gọn về đề thi..."
            className="w-full border-none p-2 outline-none text-slate-500 font-medium resize-none placeholder:text-slate-200"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="space-y-6 mb-12">
        <div className="flex items-center justify-between mb-6 ml-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            CẤU TRÚC ĐỀ THI ({questions.length} CÂU/NHÓM)
          </h2>
          <button 
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
          >
            <Library size={14} /> Thư viện câu hỏi
          </button>
        </div>
        
        {questions.map((q) => (
          <div key={q.id}>
            {q.type === "PART1" && (
              <Part1Editor 
                question={q.data} 
                onChange={(data) => updateQuestionData(q.id, data)} 
              />
            )}
            {q.type === "PART5" && (
              <Part5Editor 
                question={q.data} 
                onChange={(data) => updateQuestionData(q.id, data)} 
              />
            )}
            {q.type === "PART3_4" && (
              <ToeicPart34Editor 
                data={q.data} 
                onChange={(data) => updateQuestionData(q.id, data)} 
                onRemove={() => removeQuestion(q.id)}
              />
            )}
          </div>
        ))}

        {questions.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl opacity-40">
            <Layout size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="font-bold text-slate-400">Chưa có câu hỏi nào. Hãy chọn loại câu hỏi bên dưới.</p>
          </div>
        )}
      </div>

      {/* Library Selector Modal */}
      {showLibrary && (
        <ToeicLibrarySelector 
          onClose={() => setShowLibrary(false)}
          onSelect={handleLibrarySelect}
        />
      )}

      {/* Nút thêm câu hỏi (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-center gap-4 z-50">
        <button 
          onClick={() => addQuestion("PART1")}
          className="flex items-center gap-2.5 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-slate-100 border border-slate-200"
        >
          <ListMusic size={18} /> + Part 1
        </button>
        <button 
          onClick={() => addQuestion("PART3_4")}
          className="flex items-center gap-2.5 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-200"
        >
          <Headphones size={18} /> + Part 3 / 4
        </button>
        <button 
          onClick={() => addQuestion("PART5")}
          className="flex items-center gap-2.5 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-200"
        >
          <FileText size={18} /> + Part 5
        </button>
      </div>
    </div>
  );
}
