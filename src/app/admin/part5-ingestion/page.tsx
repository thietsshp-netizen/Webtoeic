"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { 
  FileUp, Play, CheckCircle2, AlertCircle, 
  Loader2, Filter, Trash2, Eye, Database,
  ArrowRight, BookOpen
} from "lucide-react";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";

interface RawExcelRow {
  Book?: string;
  Test?: any;
  Part?: any;
  Question_No?: any;
  Question_EN?: string;
  Correct_Answer?: string;
  Question_Type?: string;
  Day?: string;
  AI_JSON?: string;
  AI_Result?: string;
  AI_Analysis?: string;
}

interface ProcessedQuestion {
  id: string;
  questionNo: number;
  questionText: string;
  correctAnswer: string;
  metadata: any;
  explanation: any;
  [key: string]: any; // Allow dynamic access for optionA, optionB, etc.
}

export default function Part5IngestionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<RawExcelRow[]>([]);
  const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "COMPLETED" | "ERROR">("IDLE");
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [processedQuestions, setProcessedQuestions] = useState<ProcessedQuestion[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState<ProcessedQuestion | null>(null);
  const [isBypassAI, setIsBypassAI] = useState(true); // Mặc định bật Bypass AI theo yêu cầu user
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tryRepairJson = (str: string): { data: any; error?: string } => {
    if (!str) return { data: null, error: "Dữ liệu trống." };
    let cleaned = str.trim();
    
    // 1. Remove Markdown code blocks
    cleaned = cleaned.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    
    try {
      return { data: JSON.parse(cleaned) };
    } catch (e: any) {
      // 2. Attempt to fix missing trailing braces
      try {
        let fixed = cleaned;
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
          fixed += "}".repeat(openBraces - closeBraces);
        }
        return { data: JSON.parse(fixed) };
      } catch (e2) {
        // 3. Simple regex cleanup for common trailing garbage
        try {
            let fixed = cleaned.replace(/,(\s*[\]\}])/g, "$1"); // remove trailing commas
            return { data: JSON.parse(fixed) };
        } catch (e3: any) {
            return { 
              data: null, 
              error: `Lỗi cú pháp JSON: ${e3.message}. Hãy kiểm tra dấu ngoặc hoặc dấu nháy.` 
            };
        }
      }
    }
  };

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await fetch("/api/admin/part5/list");
        const result = await res.json();
        if (result.success) {
          setProcessedQuestions(result.questions);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu cũ:", err);
      }
    };
    fetchExisting();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      readExcel(e.target.files[0]);
    }
  };

  const handleClearData = async () => {
    if (!confirm("Bạn có chắc muốn xóa sạch toàn bộ dữ liệu Part 5 hiện có? Hành động này không thể hoàn tác.")) return;
    try {
      const res = await fetch("/api/admin/part5/clear", { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setProcessedQuestions([]);
        setLog(prev => [...prev, "✨ Đã dọn dẹp sạch kho dữ liệu Part 5."]);
        alert("Đã xóa sạch dữ liệu cũ thành công!");
      }
    } catch (err) {
      console.error("Lỗi xóa dữ liệu:", err);
    }
  };

  const readExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws) as RawExcelRow[];
      setData(rawData);
      
      const headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
      setLog(prev => [...prev, `📂 Đã đọc file: ${rawData.length} hàng dữ liệu.`]);
      setLog(prev => [...prev, `🔍 Tìm thấy các cột: ${headers.join(", ")}`]);
    };
    reader.readAsBinaryString(file);
  };

  const speak = (text: string, type: 'uk' | 'us' = 'us') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => {
      if (type === 'uk') return v.lang === 'en-GB';
      return v.lang === 'en-US' || v.lang === 'en_US';
    }) || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const isValidData = (val: string | null | undefined) => {
    if (!val) return false;
    const clean = val.trim().toLowerCase();
    return clean !== '' && clean !== 'null' && clean !== 'none' && clean !== 'n/a';
  };

  const startProcessing = async () => {
    if (data.length === 0) return;

    setStatus("PROCESSING");
    setLog(prev => [...prev, "Bắt đầu xử lý Safe Ingestion (Gói miễn phí)..."]);
    
    // Xử lý từng câu một để đảm bảo an toàn tuyệt đối cho RPM
    const BATCH_SIZE = 1;
    let currentProcessed = 0;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const row = data[i] as any;
      const excelRow = i + 2; 
      const book = row.Book || row.book || "N/A";
      const test = row.Test || row.test || "N/A";
      const qNo = row.Question_No || row.questionNo || "N/A";
      const rowId = `[Dòng ${excelRow}] - ${book} | ${test} | Part 5 | Câu ${qNo}`;
      
      // --- AUTO-DETECT JSON COLUMN (Fuzzy matching) ---
      let localJsonStr = row.AI_JSON || row.AI_Result || row.AI_Analysis;
      if (!localJsonStr) {
        const fuzzyKey = Object.keys(row).find(k => {
           const lower = k.toLowerCase().replace(/[\s_-]/g, "");
           return lower.includes("aijson") || lower.includes("airesult") || lower.includes("aianalysis");
        });
        if (fuzzyKey) localJsonStr = row[fuzzyKey];
      }

      let preAnalyzedData = null;
      let wasRepaired = false;
      let jsonError = null;

      if (localJsonStr) {
        const repairResult = tryRepairJson(typeof localJsonStr === 'string' ? localJsonStr : JSON.stringify(localJsonStr));
        preAnalyzedData = repairResult.data;
        jsonError = repairResult.error;

        if (preAnalyzedData && typeof localJsonStr === 'string' && localJsonStr.includes('```')) {
            wasRepaired = true;
        }
      }

      // --- 1. KIỂM TRA TRÙNG LẶP & ĐÈ (OVERWRITE) ---
      const isDuplicate = processedQuestions.some(pq => 
        pq.questionNo === Number(row.Question_No) && 
        pq.metadata?.day === row.Day &&
        pq.metadata?.type === row.Question_Type &&
        pq.metadata?.book === row.Book &&
        pq.metadata?.test === row.Test
      );

      if (isDuplicate) {
        if (!preAnalyzedData) {
          // Hiện tại đã nạp rồi và file Excel không có nội dung mới -> Bỏ qua
          setLog(prev => [...prev, `⏩ ${rowId}: Đã tồn tại (Skip).`]);
          currentProcessed += 1;
          setProgress(Math.round((currentProcessed / data.length) * 100));
          continue;
        } else {
          // Có JSON mới trong Excel -> Tiến hành Ghi đè (Overwrite)
          setLog(prev => [...prev, `🔄 ${rowId}: Cập nhật nội dung (Overwrite)...`]);
        }
      }

      // --- 2. QUYẾT ĐỊNH CÁCH NẠP ---
      if (preAnalyzedData) {
        setLog(prev => [...prev, `✨ ${rowId}: ${wasRepaired ? '🔧 Tự sửa JSON & ' : ''}Đang nạp...`]);
      } else if (isBypassAI) {
        const availableKeys = Object.keys(row).join(", ");
        setLog(prev => [...prev, `⏩ ${rowId}: Thiếu JSON (Cột: ${availableKeys}). Skip do Bypass AI.`]);
        currentProcessed += 1;
        setProgress(Math.round((currentProcessed / data.length) * 100));
        continue;
      } else {
        setLog(prev => [...prev, `⏳ ${rowId}: Đang nạp...`]);
      }

      try {
        const payload = [{
          questionNo: row.Question_No,
          rawText: row.Question_EN,
          correctKey: row.Correct_Answer,
          day: row.Day,
          type: row.Question_Type,
          book: row.Book,
          test: row.Test,
          preAnalyzedData // Gửi kèm dữ liệu đã phân tích
        }];

        const res = await fetch("/api/admin/part5/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: payload })
        });

        const result = await res.json();

        if (res.status === 429) {
          setLog(prev => [...prev, `🛑 DỪNG XỬ LÝ (429): Chạm hạn mức chi tiêu Gemini.`]);
          setLog(prev => [...prev, `💡 Hãy kiểm tra Billing/Spend Cap tại AI Studio.`]);
          setStatus("ERROR");
          break; // Thoát vòng lặp ngay khi hết quota
        }

        if (result.success) {
          // Cập nhật danh sách hiển thị: Loại bỏ ID cũ (nếu có) và đưa câu mới lên đầu
          setProcessedQuestions(prev => {
            const newQs = result.questions || [];
            const newIds = new Set(newQs.map((q: any) => q.id));
            return [...newQs, ...prev.filter(q => !newIds.has(q.id))];
          });
          currentProcessed += 1;
          setProgress(Math.round((currentProcessed / data.length) * 100));
        } else {
          throw new Error(result.error);
        }

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err: any) {
        let displayError = err.message;
        
        // Bắt lỗi cụ thể của Prisma JSON/Metadata structure
        if (displayError.includes("prisma") || displayError.includes("invocation")) {
          displayError = "Lỗi cấu trúc Database: Ô đáp án (A-D) đang chứa Object thay vì Chữ. Hãy kiểm tra lại dòng này trong Excel.";
        }

        const excelRow = i + 2; // +1 cho 1-indexed, +1 cho header row
        const book = row.Book || row.book || "N/A";
        const test = row.Test || row.test || "N/A";
        const qNo = row.Question_No || row.questionNo || "N/A";

        setLog(prev => [...prev, `❌ [Dòng ${excelRow}] - ${book} | ${test} | Part 5 | Câu ${qNo}: ${displayError}`]);
        setErrorCount(prev => prev + 1);
        
        // Nếu lỗi quá nhiều liên tiếp (ví dụ 3 câu), cũng nên dừng
        if (errorCount > 10) {
           setLog(prev => [...prev, `🛑 Quá nhiều lỗi liên tiếp. Tạm dừng để kiểm tra.`]);
           setStatus("ERROR");
           break;
        }
      }
    }

    setStatus("COMPLETED");
    setLog(prev => [...prev, "Hoàn tất xử lý toàn bộ file!"]);
  };

  const checkGaps = () => {
    if (data.length === 0) return;
    
    setLog(prev => [...prev, "🔍 Bắt đầu kiểm tra dữ liệu (Dry Run)..."]);
    
    let existsCount = 0;
    let missingRows: number[] = [];
    
    data.forEach((row, i) => {
      const isDuplicate = processedQuestions.some(pq => 
        pq.questionNo === Number(row.Question_No) && 
        pq.metadata?.day === row.Day &&
        pq.metadata?.type === row.Question_Type &&
        pq.metadata?.book === row.Book &&
        pq.metadata?.test === row.Test
      );
      
      if (isDuplicate) {
        existsCount++;
      } else {
        missingRows.push(i + 1);
      }
    });
    
    const missingCount = missingRows.length;
    setLog(prev => [...prev, `📊 KẾT QUẢ KIỂM TRA:`]);
    setLog(prev => [...prev, `✅ Đã có: ${existsCount} câu.`]);
    setLog(prev => [...prev, `❌ Còn thiếu: ${missingCount} câu.`]);
    
    if (missingCount > 0) {
      if (missingCount <= 100) {
         setLog(prev => [...prev, `📍 Các dòng còn thiếu trong Excel: ${missingRows.join(", ")}`]);
      } else {
         setLog(prev => [...prev, `📍 Có ${missingCount} câu thiếu. Hãy nhấn "Bắt đầu xử lý" để nạp.`]);
      }
    } else {
      setLog(prev => [...prev, `✨ Tuyệt vời! Toàn bộ ${data.length} câu trong file đã có trong database.`]);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto pb-40">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Part 5 AI Ingestion</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Safe Ingestion Mode (Optimized for Gemini Free Tier)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileUp size={14} className="text-blue-500" /> Upload File
            </h2>
            
            <div className="space-y-4">
              {mounted && (
                <label className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl cursor-pointer hover:bg-amber-100 transition-all">
                  <input 
                    type="checkbox" 
                    checked={isBypassAI} 
                    onChange={(e) => setIsBypassAI(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <p className="text-[11px] font-black text-amber-800 uppercase tracking-tight">Chế độ Bypass AI</p>
                    <p className="text-[10px] font-bold text-amber-600 leading-tight">Chỉ dùng JSON từ Excel, không gọi Gemini API.</p>
                  </div>
                </label>
              )}

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500">{file ? file.name : "Chọn file Excel (.xlsx)"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx" onChange={handleFileChange} disabled={status === "PROCESSING"} />
              </label>

              {data.length > 0 && (
                <div className="space-y-3">
                  <button 
                    onClick={startProcessing}
                    disabled={status === "PROCESSING"}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {status === "PROCESSING" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Play size={18} />
                    )}
                    Bắt đầu xử lý ({data.length} câu)
                  </button>

                  <button 
                    onClick={checkGaps}
                    disabled={status === "PROCESSING"}
                    className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition-all disabled:opacity-50"
                  >
                    <Filter size={14} /> Kiểm tra dữ liệu (Check)
                  </button>
                </div>
              )}

              <button 
                onClick={handleClearData}
                disabled={status === "PROCESSING"}
                className="w-full py-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <Trash2 size={14} /> Xóa sạch dữ liệu cũ
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl text-slate-300 shadow-xl overflow-hidden">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Nhật ký xử lý (Logs)</h2>
            <div className="h-64 overflow-y-auto space-y-2 font-mono text-[10px]">
              {log.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600">[{i+1}]</span>
                  <span>{line}</span>
                </div>
              ))}
              {status === "PROCESSING" && (
                <div className="animate-pulse text-blue-400">Đang chờ AI trả lời (Nghỉ 4.5s giữa các câu)...</div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {status !== "IDLE" && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tiến độ tổng thể</span>
                <span className="text-xl font-black text-blue-600">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                  <CheckCircle2 size={12} /> {processedQuestions.length} thành công
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500">
                    <AlertCircle size={12} /> {errorCount} lỗi
                  </div>
                )}
              </div>
            </div>
          )}

            <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
              {processedQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
                  {q.questionNo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700 text-sm line-clamp-2 mb-2">{q.questionText}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-md uppercase">Key: {q.correctAnswer}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md uppercase">{q.metadata?.type}</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-black rounded-md uppercase">{q.metadata?.day}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => setSelectedQuestion(q)}
                    className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                   >
                      <Eye size={14} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {selectedQuestion && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
             <div className="p-8 pb-10">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-black text-slate-800">Review: Question {selectedQuestion.questionNo}</h3>
                   <button onClick={() => setSelectedQuestion(null)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 font-bold">✕</button>
                </div>

                <div className="space-y-8">
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sentence & Key</p>
                      <p className="font-bold text-slate-700 mb-4">{selectedQuestion.questionText}</p>
                      <div className="flex items-center gap-4">
                         <span className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl">KEY: {selectedQuestion.correctAnswer}</span>
                         <button onClick={() => speak(selectedQuestion.questionText.replace(/_+/g, selectedQuestion.explanation ? JSON.parse(selectedQuestion.explanation as any).options_breakdown?.[selectedQuestion.correctAnswer]?.meaning : ''))} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-blue-50 hover:text-blue-600">
                             <SpeakerWaveIcon className="w-4 h-4" />
                         </button>
                      </div>
                   </div>

                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Translation</p>
                      <p className="font-medium text-slate-600 italic bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
                        "{selectedQuestion.metadata?.translation}"
                      </p>
                   </div>

                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detailed Analysis (Preview)</p>
                      <div className="space-y-4">
                         {['A', 'B', 'C', 'D'].map((opt) => {
                               const explainJson = typeof selectedQuestion.explanation === 'string' ? JSON.parse(selectedQuestion.explanation) : selectedQuestion.explanation;
                               const optData = explainJson.options_breakdown?.[opt];
                               const isCorrect = opt === selectedQuestion.correctAnswer;
                               
                               return (
                                  <div key={opt} className={`p-4 rounded-2xl border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                                     <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                           <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{opt}</span>
                                           <h4 className="font-bold text-slate-800">{selectedQuestion[`option${opt}` as any]}</h4>
                                        </div>
                                        <div className="flex gap-2">
                                           {isValidData(optData?.ipa_uk) && <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 rounded">UK: {optData.ipa_uk}</span>}
                                           {isValidData(optData?.ipa_us) && <span className="text-[9px] font-mono text-blue-400 bg-blue-50 px-2 rounded">US: {optData.ipa_us}</span>}
                                        </div>
                                     </div>
                                     <p className="text-[11px] font-bold text-slate-600 mb-1">→ {optData?.meaning}</p>
                                     <p className="text-[10px] text-slate-400 leading-relaxed">{optData?.reason}</p>
                                  </div>
                               );
                         })}
                      </div>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Phrasal Verbs & Collocations (Expansion)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {(() => {
                            const explainJson = typeof selectedQuestion.explanation === 'string' ? JSON.parse(selectedQuestion.explanation) : selectedQuestion.explanation;
                            return explainJson.expansion?.map((item: any, i: number) => (
                               <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                     <h4 className="font-black text-slate-800 text-sm">{item.phrase}</h4>
                                     <button onClick={() => speak(item.phrase)} className="p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-blue-50 hover:text-blue-600">
                                        <SpeakerWaveIcon className="w-3 h-3" />
                                     </button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                     {isValidData(item.ipa_uk) && <span className="text-[9px] font-mono text-slate-400 uppercase">UK: {item.ipa_uk}</span>}
                                     {isValidData(item.ipa_us) && <span className="text-[9px] font-mono text-blue-400 uppercase">US: {item.ipa_us}</span>}
                                  </div>
                                  <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">{item.meaning}</p>
                               </div>
                            ));
                         })()}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
