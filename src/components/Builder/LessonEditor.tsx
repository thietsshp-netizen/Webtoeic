"use client";

import { useState, useEffect } from "react";
import QuillEditor from "@/components/Editor/QuillEditor";
import { Save, Trash2, FileText } from "lucide-react";
import SmartToeicSelector from "./SmartToeicSelector";
import SmartPartSelector from "./SmartPartSelector";
import ToeicPlayerClient from "@/components/Toeic/ToeicPlayerClient";

interface LessonEditorProps {
  lessonId: string;
  draftData?: any;
  onDraftUpdate: (data: any) => void;
  onSaveSuccess: () => void;
}

// Helper to parse MM:SS string to seconds
const parseMMSS = (str: string): number => {
  if (!str) return 0;
  const parts = str.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  return parseInt(str, 10) || 0;
};

// Helper to format seconds to MM:SS string
const formatMMSS = (secs: number): string => {
  if (typeof secs !== 'number' || isNaN(secs)) return '00:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

interface TimeInputProps {
  value: number;
  onChange: (val: number) => void;
}

function TimeInput({ value, onChange }: TimeInputProps) {
  const initialMins = Math.floor(value / 60);
  const initialSecs = value % 60;

  const [mins, setMins] = useState(String(initialMins));
  const [secs, setSecs] = useState(String(initialSecs).padStart(2, '0'));

  useEffect(() => {
    const m = Math.floor(value / 60);
    const s = value % 60;
    setMins(String(m));
    setSecs(String(s).padStart(2, '0'));
  }, [value]);

  const handleMinsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMins(val);
    const m = parseInt(val, 10) || 0;
    const s = parseInt(secs, 10) || 0;
    onChange(m * 60 + s);
  };

  const handleSecsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSecs(val);
    const m = parseInt(mins, 10) || 0;
    const s = parseInt(val, 10) || 0;
    onChange(m * 60 + s);
  };

  const handleSecsBlur = () => {
    let s = parseInt(secs, 10) || 0;
    let m = parseInt(mins, 10) || 0;
    
    if (s >= 60) {
      m += Math.floor(s / 60);
      s = s % 60;
    }
    
    setMins(String(m));
    setSecs(String(s).padStart(2, '0'));
    onChange(m * 60 + s);
  };

  return (
    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all max-w-[140px] mx-auto">
      <input
        type="number"
        min="0"
        value={mins}
        onChange={handleMinsChange}
        className="w-10 bg-transparent text-center text-xs font-bold text-slate-800 outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder="MM"
      />
      <span className="text-[10px] text-slate-400 font-bold">m</span>
      <span className="text-slate-300 font-medium px-0.5">:</span>
      <input
        type="number"
        min="0"
        max="59"
        value={secs}
        onChange={handleSecsChange}
        onBlur={handleSecsBlur}
        className="w-10 bg-transparent text-center text-xs font-bold text-slate-800 outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder="SS"
      />
      <span className="text-[10px] text-slate-400 font-bold">s</span>
    </div>
  );
}


export default function LessonEditor({ lessonId, draftData, onDraftUpdate, onSaveSuccess }: LessonEditorProps) {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toeicTests, setToeicTests] = useState<any[]>([]);
  const [vocabDays, setVocabDays] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [isProcessingSub, setIsProcessingSub] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");

  const handleAutoFetchSubtitles = async () => {
    if (!lesson?.videoUrl) {
      alert("Vui lòng nhập đường dẫn video YouTube trước!");
      return;
    }
    setIsProcessingSub(true);
    setGeneratedPrompt("");
    try {
      const res = await fetch("/api/admin/youtube/auto-subtitle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: lesson.videoUrl }),
      });
      const data = await res.json();
      if (data.success && data.subtitles) {
        const promptTemplate = `You are an expert English teacher. I will provide you with a JSON array of raw English subtitle segments with timestamps from YouTube.
Because YouTube automatically cuts lines in the middle of sentences based on length constraints, the segments are often fragmented (e.g. ending in the middle of a phrase).

YOUR TASKS:
1. Merge adjacent segments that belong to the same grammatical sentence or complete thought into one single subtitle object.
2. For merged sentences:
   - "start" must be the start time of the first segment you merged.
   - "end" must be the end time of the last segment you merged.
   - "text" must be the combined clean sentence text.
3. For each final merged sentence object:
   - Add "ipa" (phonetic transcription in US English).
   - Add "vietnamese" (natural and friendly Vietnamese translation).
   - Add "note" (If the sentence contains any idioms, slangs, phrasal verbs, or US cultural names/references, explain them briefly in Vietnamese. Start the note with a * symbol. Example: "* 'spill the beans': tiết lộ bí mật". If there are none, return null or empty string "").
4. Return ONLY a valid JSON array of the processed objects. Do not write any markdown formatting (do not wrap in \`\`\`json blocks) or explanations.

Example of merging:
Raw:
[
  {"start": 36.88, "end": 41.36, "text": "Hey. Hey. Ho ho. Hello. See a guy who"},
  {"start": 40.0, "end": 42.0, "text": "doesn't want to know standing right"},
  {"start": 41.36, "end": 46.0, "text": "here."}
]
Merged result:
[
  {
    "start": 36.88,
    "end": 46.0,
    "text": "Hey. Hey. Ho ho. Hello. See a guy who doesn't want to know standing right here.",
    "ipa": "/heɪ. heɪ. hoʊ hoʊ. həˈloʊ. si ə ɡaɪ hu ˈdʌznt wɑnt tu noʊ ˈstændɪŋ raɪt hɪr./",
    "vietnamese": "Này, này. Hô hô. Xin chào. Có một anh chàng không muốn biết giới tính con mình đang đứng ngay đây này.",
    "note": "* 'standing right here': Đang đứng ngay tại đây (cách nhấn mạnh vị trí hiện tại)."
  }
]

Subtitles to process:
${JSON.stringify(data.subtitles, null, 2)}`;
        setGeneratedPrompt(promptTemplate);
        alert("Tải phụ đề thô thành công! Vui lòng copy prompt bên dưới dán vào Gemini để nhờ dịch.");
      } else {
        throw new Error(data.error || "Không thể xử lý phụ đề");
      }
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setIsProcessingSub(false);
    }
  };

  // Tự động tải danh sách câu hỏi thực tế của bài học này từ database
  useEffect(() => {
    let isMounted = true;
    async function loadQuestions() {
      if (!lessonId) return;
      try {
        const res = await fetch(`/api/admin/lessons/${lessonId}/questions`);
        const data = await res.json();
        if (isMounted && data.success) {
          setQuestionsList(data.questions || []);
        }
      } catch (err) {
        console.warn("Failed to load questions list dynamically:", err);
      }
    }
    loadQuestions();
    return () => { isMounted = false; };
  }, [lessonId, lesson?.toeicTestId, lesson?.content, lesson?.contentType]);


  useEffect(() => {
    async function fetchToeicTests() {
      try {
        const res = await fetch('/api/admin/toeic-tests');
        const data = await res.json();
        if (data.success) {
          setToeicTests(data.tests);
        }
      } catch (err) {
        console.error("Failed to fetch toeic tests", err);
      }
    }
    fetchToeicTests();

    async function fetchVocabDays() {
      try {
        const res = await fetch('/api/admin/vocab-days');
        const data = await res.json();
        if (data.success) setVocabDays(data.days);
      } catch (err) { console.error(err); }
    }
    fetchVocabDays();
  }, []);

  // Tự động nạp dữ liệu Preview khi chọn/thay đổi bộ đề TOEIC
  useEffect(() => {
    let isMounted = true;
    
    async function fetchPreview() {
      const testId = lesson?.toeicTestId;
      if (!testId) {
        setPreviewData(null);
        return;
      }
      
      setLoadingPreview(true);
      try {
        const res = await fetch(`/api/admin/toeic-tests/${testId}`);
        const data = await res.json();
        if (isMounted) {
          if (data.success && data.test) {
            setPreviewData(data.test);
          } else {
            // Chỉ log nếu thực sự có lỗi từ server, không log nếu chỉ là chưa có dữ liệu
            if (data.error) console.warn("Preview info:", data.error);
            setPreviewData(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch preview data", err);
          setPreviewData(null);
        }
      } finally {
        if (isMounted) setLoadingPreview(false);
      }
    }

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [lesson?.toeicTestId]);

  useEffect(() => {
    async function fetchLesson() {
      if (lessonId.startsWith("temp")) {
        const defaultNewLesson = {
          id: lessonId,
          title: draftData?.title || "Bài học mới",
          contentType: draftData?.contentType || "TEXT",
          content: draftData?.content || "",
          videoUrl: draftData?.videoUrl || "",
          videoExplanation: draftData?.videoExplanation || "",
          isPreview: draftData?.isPreview || false,
          order: draftData?.order || 0,
          sectionId: draftData?.sectionId || ""
        };
        setLesson(defaultNewLesson);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        const data = await res.json();

        if (!res.ok || data.success === false) {
          throw new Error(data.error || "Failed to load lesson");
        }

        if (data && typeof data.content === 'string' && data.content.startsWith('{') && !['DYNAMIC_PART', 'VOCAB_GAME'].includes(data.contentType)) {
          // data.content = "<p><em>⚠️ Nội dung này được tạo bởi trình soạn thảo cũ. Vui lòng soạn thảo lại.</em></p>";
        }

        // Merge với bản nháp hiện có nếu có
        const mergedData = { ...data, ...(draftData || {}) };
        setLesson(mergedData);
      } catch (err) {
        console.error("Failed to fetch lesson", err);
        setLesson(null);
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [lessonId]);

  // Cập nhật lesson state khi draft thay đổi (từ sidebar chẳng hạn)
  useEffect(() => {
    if (draftData && lesson) {
       setLesson((prev: any) => ({ ...prev, ...draftData }));
    }
  }, [draftData]);

  const updateDraft = (updates: any) => {
    const newLesson = { ...lesson, ...updates };
    setLesson(newLesson);
    onDraftUpdate(updates);
  };

  const handleSave = async () => {
    if (lessonId.startsWith("temp")) {
      alert("Bài học mới chưa được tạo chính thức. Vui lòng bấm nút 'LƯU TẤT CẢ' ở thanh công cụ phía trên trước để lưu cấu trúc bài học!");
      return;
    }

    if (lesson.contentType === "TOEIC_TEST" && !lesson.toeicTestId) {
      alert("Vui lòng chọn một đề thi TOEIC!");
      return;
    }
    if (lesson.contentType === "VOCAB_GAME" && !lesson.vocabDayId) {
      alert("Vui lòng chọn một ngày từ vựng!");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...lesson,
        contentType: lesson.contentType || "TEXT",
        content: lesson.content,
        toeicTestId: lesson.contentType === "TOEIC_TEST" && lesson.toeicTestId ? lesson.toeicTestId : null,
        vocabDayId: lesson.contentType === "VOCAB_GAME" && lesson.vocabDayId ? lesson.vocabDayId : null,
      };

      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Lưu thất bại");

      onSaveSuccess();
      alert("Đã lưu bài học thành công!");
    } catch (err) {
      alert("Lỗi khi lưu bài học!");
    } finally {
      setSaving(false);
    }
  };



  const fallbackLength = (() => {
    if (!lesson) return 50;
    const isFullTest = lesson.toeicTestId?.startsWith('full-test-') || 
                       (lesson.contentType === "TOEIC_TEST" && lesson.toeicTestId?.startsWith('full-test-')) ||
                       lesson.title?.toLowerCase().includes("full test") ||
                       lesson.title?.toLowerCase().includes("đề thi");
    if (isFullTest) return 200;
    
    // Đối với tất cả bài tập phân dạng, bài học dynamic hoặc riêng lẻ khác, hỗ trợ tối đa 350 câu hỏi
    return 350;
  })();

  if (loading) return <div className="p-20 text-center text-slate-400 italic">Đang nạp nội dung bài giảng...</div>;
  if (!lesson) return <div className="p-20 text-center text-red-400">Không tìm thấy bài giảng.</div>;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText size={24} />
          </div>
          <div>
            <input
              type="text"
              value={lesson.title || ""}
              onChange={(e) => updateDraft({ title: e.target.value })}
              className="text-2xl font-black text-slate-800 focus:outline-none border-none p-0 w-[400px] bg-transparent"
              placeholder="Tiêu đề bài học..."
            />
            <p className="text-xs text-slate-400 font-medium mt-1">Hệ thống soạn thảo bài giảng trực quan.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-colors" title="Xóa bài học">
            <Trash2 size={20} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-0.5 active:scale-95 disabled:bg-slate-300"
          >
            {saving ? "Đang lưu..." : <><Save size={18} /> Lưu thay đổi</>}
          </button>
        </div>
      </div>

      {/* Editor Space */}
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-10 pb-32 scrollbar-hide">

        {/* CẤU HÌNH LOẠI BÀI HỌC */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">Loại bài học</label>
          <select 
            value={lesson.contentType || "TEXT"}
            onChange={(e) => {
              const newType = e.target.value;
              const updates: any = { contentType: newType };
              if (newType === "YOUTUBE_DICTATION" && (lesson.content === "<p></p>" || !lesson.content)) {
                updates.content = "";
              }
              updateDraft(updates);
            }}
            className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50"
          >
            <option value="TEXT">Văn bản / Đa phương tiện tự do (Quill)</option>
            <option value="TOEIC_TEST">Làm đề Full Test (7 Part)</option>
            <option value="DYNAMIC_PART">Luyện tập theo từng Part (Smart Filter)</option>
            <option value="VOCAB_GAME">Học từ vựng (Vocabulary Game)</option>
            <option value="YOUTUBE_DICTATION">Luyện nghe & Chép chính tả YouTube (JSON Subtitle)</option>
          </select>
        </div>

        {lesson.contentType === "YOUTUBE_DICTATION" ? (
          <div className="space-y-6 p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100 shadow-sm">
            <label className="text-[11px] font-black text-indigo-600 uppercase ml-2 tracking-widest">Cấu hình Luyện nghe YouTube</label>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-slate-600 ml-1">Đường dẫn Video YouTube</label>
                  <input
                    type="text"
                    value={lesson.videoUrl || ""}
                    onChange={(e) => updateDraft({ videoUrl: e.target.value })}
                    className="w-full mt-1.5 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium bg-white transition-all"
                    placeholder="Dán link YouTube (ví dụ: https://www.youtube.com/watch?v=...) hoặc link nhúng..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAutoFetchSubtitles}
                  disabled={isProcessingSub}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest px-6 rounded-2xl active:scale-95 transition-all shadow-md shadow-indigo-150 disabled:bg-slate-350 shrink-0 h-[52px] flex items-center justify-center"
                >
                  {isProcessingSub ? "Đang xử lý..." : "⚡ Tải phụ đề & Tạo Prompt"}
                </button>
              </div>

              {generatedPrompt && (
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-amber-800 uppercase tracking-widest">Prompt cho Gemini (Copy cái này):</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPrompt);
                        alert("Đã copy Prompt thành công!");
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      📋 Copy Prompt
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={generatedPrompt}
                    rows={6}
                    className="w-full mt-1.5 p-3 rounded-xl border border-amber-100 outline-none text-xs font-mono bg-white/80 text-slate-700"
                  />
                  <p className="text-[11px] text-amber-800 italic">
                    💡 Hãy copy đoạn trên dán vào Gemini Web (Miễn phí) rồi copy kết quả JSON dán vào ô bên dưới.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 ml-1">Dữ liệu JSON phụ đề (Với IPA và Dịch Việt)</label>
                <textarea
                  value={lesson.content || ""}
                  onChange={(e) => updateDraft({ content: e.target.value })}
                  rows={10}
                  className="w-full mt-1.5 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono bg-white transition-all"
                  placeholder='Ví dụ:
[
  {
    "start": 0.5,
    "end": 3.5,
    "text": "Welcome back to the show.",
    "ipa": "/ˈwɛlkəm bæk tu ðə ʃoʊ/",
    "vietnamese": "Chào mừng trở lại chương trình."
  }
]'
                />
              </div>

              {/* Preview parsed JSON */}
              {(() => {
                try {
                  const parsed = JSON.parse(lesson.content || "[]");
                  if (!Array.isArray(parsed)) throw new Error();
                  return (
                    <div className="mt-4 p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                      <p className="text-xs font-bold text-slate-700">Xem trước danh sách phụ đề ({parsed.length} câu):</p>
                      <div className="max-h-[300px] overflow-y-auto space-y-3 divide-y divide-slate-100 text-xs pr-2">
                        {parsed.map((item: any, idx: number) => (
                          <div key={idx} className={`${idx > 0 ? "pt-3" : ""} flex flex-col gap-1`}>
                            <div className="flex justify-between font-mono text-[10px] text-slate-400">
                              <span className="font-bold">Dòng {idx + 1}</span>
                              <span>{item.start}s - {item.end}s</span>
                            </div>
                            <p className="font-bold text-slate-800">{item.text}</p>
                            {item.ipa && <p className="text-indigo-600 font-mono font-bold">{item.ipa}</p>}
                            {item.vietnamese && <p className="text-slate-500">{item.vietnamese}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch (e) {
                  if (lesson.content) {
                    return (
                      <p className="text-xs text-red-500 font-semibold italic mt-2">
                        ⚠️ Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp (ngoặc kép, dấu phẩy).
                      </p>
                    );
                  }
                  return null;
                }
              })()}
            </div>
          </div>
        ) : lesson.contentType === "DYNAMIC_PART" ? (
          <div className="space-y-4 p-8 bg-blue-50/50 rounded-3xl border border-blue-100">
             <label className="text-[11px] font-black text-blue-500 uppercase ml-2 tracking-widest">Cấu hình Luyện tập theo Part</label>
             <SmartPartSelector 
                key={lessonId}
                initialData={(() => {
                  try {
                    const content = lesson.content;
                    if (!content || typeof content !== 'string') return {};
                    if (content.startsWith('{') || content.startsWith('[')) {
                      return JSON.parse(content);
                    }
                    return {};
                  } catch (e) {
                    return {};
                  }
                })()}
                onSelect={(data) => updateDraft({ content: JSON.stringify(data) })}
             />
             <p className="text-xs text-blue-600 font-medium ml-2 mt-2 italic">
               * Học viên sẽ được luyện tập với các câu hỏi được lọc thông minh từ ngân hàng dữ liệu.
             </p>
          </div>
        ) : lesson.contentType === "VOCAB_GAME" ? (
          <div className="space-y-4 p-8 bg-amber-50/50 rounded-3xl border border-amber-100">
            <label className="text-[11px] font-black text-amber-600 uppercase ml-2 tracking-widest">Chọn ngày từ vựng</label>
            <select
              value={lesson.vocabDayId || ""}
              onChange={(e) => updateDraft({ vocabDayId: e.target.value })}
              className="w-full p-4 rounded-2xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-400 font-bold text-amber-900 bg-white"
            >
              <option value="">-- Vui lòng chọn một ngày --</option>
              {vocabDays.map((d: any) => (
                <option key={d.id} value={d.id}>Ngày {d.dayNumber}: {d.title}</option>
              ))}
            </select>
            <p className="text-xs text-amber-600 font-medium ml-2 mt-2">
              Học viên sẽ có 5 chế độ game tương tác: Thư viện, Xếp chữ, Điền từ, Ghép từ và Đồng nghĩa.
            </p>
          </div>
        ) : lesson.contentType === "TOEIC_TEST" ? (
           <div className="space-y-4 p-8 bg-blue-50/50 rounded-3xl border border-blue-100">
             <label className="text-[11px] font-black text-blue-500 uppercase ml-2 tracking-widest">Chọn bộ đề TOEIC</label>
             <SmartToeicSelector 
               tests={toeicTests}
               selectedId={lesson.toeicTestId || ""}
               onSelect={(id) => updateDraft({ toeicTestId: id })}
             />
             <p className="text-xs text-blue-600 font-medium ml-2 mt-2">Học viên sẽ được sử dụng trình Player tương tác cao khi chọn loại bài này.</p>

             {/* KHU VỰC XEM TRƯỚC TỰ ĐỘNG */}
             <div className="mt-10 pt-10 border-t border-blue-100/50">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    <label className="text-[12px] font-black text-blue-900 uppercase tracking-widest">Bản xem trước học viên (Dữ liệu thực tế)</label>
                </div>

                {loadingPreview ? (
                   <div className="p-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center text-slate-400 italic">
                      Đang nạp bản xem trước dữ liệu bài tập...
                   </div>
                ) : previewData ? (
                   <div className="rounded-[2.5rem] border border-blue-100 shadow-2xl shadow-blue-50 overflow-hidden bg-white min-h-[400px] max-h-[650px] overflow-y-auto scrollbar-thin">
                      <div className="bg-blue-600 p-3 text-center text-[10px] font-black text-white uppercase tracking-[0.2em]">
                        Chế độ xem trước: Admin Preview Mode {lesson.toeicTestId?.startsWith('full-test-') ? '(Full 7 Parts)' : ''}
                      </div>
                      <div className="p-0">
                        {/* Render Player Client with actual data */}
                        {lesson.toeicTestId?.startsWith('full-test-') ? (
                          <div className="p-8 bg-slate-50">
                             <div className="flex items-center justify-between mb-6">
                                <div>
                                  <p className="text-sm font-black text-slate-800">CẤU TRÚC BỘ ĐỀ THỰC TẾ</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">Dữ liệu được nạp trực tiếp từ Database</p>
                                </div>
                                <div className="px-4 py-2 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-200">
                                  TỔNG: {
                                    previewData.parts?.reduce((acc: number, p: any) => 
                                      acc + p.groups.reduce((sum: number, g: any) => sum + (g.questions?.length || 0), 0), 0
                                    ) || 0
                                  } CÂU
                                </div>
                             </div>

                             <div className="grid grid-cols-1 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7].map(pNum => {
                                  const part = previewData.parts?.find((p: any) => p.partNumber === pNum);
                                  const qCount = part?.groups?.reduce((sum: number, g: any) => sum + (g.questions?.length || 0), 0) || 0;
                                  
                                  return (
                                    <div key={pNum} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black">P{pNum}</span>
                                          <span className="text-xs font-black text-slate-700">PART {pNum}</span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${qCount === 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                          {qCount} CÂU HỎI
                                        </span>
                                      </div>
                                      <div className="p-4">
                                        {part?.groups?.length > 0 ? (
                                          <div className="space-y-2">
                                            {part.groups.map((g: any, idx: number) => {
                                              const nos = (g.questions || []).map((q: any) => q.questionNo);
                                              const range = nos.length > 0 ? `${Math.min(...nos)}-${Math.max(...nos)}` : "N/A";
                                              return (
                                                <div key={g.id} className="flex items-center justify-between text-[10px] p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                                                  <div className="flex items-center gap-3">
                                                    <span className="text-slate-400 font-mono w-4 italic">{idx + 1}.</span>
                                                    <span className="font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">Câu {range}</span>
                                                    {(() => {
                                                      const gMeta = g.metadata as any || {};
                                                      const bookName = gMeta.Book || gMeta.book || "";
                                                      const testName = gMeta.Test || gMeta.test || "";
                                                      if (!bookName && !testName) return null;
                                                      return (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tight shrink-0 select-none">
                                                          {bookName} {testName ? `Test ${testName}` : ""}
                                                        </span>
                                                      );
                                                    })()}
                                                    <span className="text-slate-500 truncate max-w-[200px]">{g.passageText?.substring(0, 50) || "(Không có nội dung)"}...</span>
                                                  </div>
                                                  <span className="text-slate-300 font-mono text-[9px]">{g.id}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <p className="text-[10px] text-red-400 italic text-center py-2">Chưa có dữ liệu cho Part này.</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                             </div>
                          </div>
                        ) : (
                          <ToeicPlayerClient 
                            targetPart={previewData.parts?.[0]?.partNumber || 1}
                            data={previewData.parts?.[0]?.groups || []}
                            lessonId={lessonId}
                            initialProgress={{}} // Admin xem trước không cần tiến độ
                            isReviewMode={true} // Bật chế độ review để hiện luôn đáp án/giải thích nếu muốn
                          />
                        )}
                      </div>
                   </div>
                ) : (
                   <div className="p-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center text-slate-400">
                      <p className="font-bold text-slate-500 mb-1">Chưa có dữ liệu xem trước.</p>
                      <p className="text-xs italic">Vui lòng chọn một bộ đề TOEIC ở trên để kiểm tra nội dung.</p>
                   </div>
                )}
             </div>
           </div>
        ) : (
          <>
            {/* KHUNG SOẠN THẢO CHÍNH */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nội dung bài học (Chèn Ảnh/Video/Iframe tại đây)</label>
              <div className="rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100 overflow-hidden bg-white">
                <QuillEditor
                  initialContent={lesson.content}
                  onChange={(newContent: any) => updateDraft({ content: newContent })}
                />
              </div>
            </div>
          </>
        )}

        {/* KHU VỰC CẤU HÌNH VIDEO GIẢI THÍCH ĐỘC LẬP (NON-DESTRUCTIVE ADD-ON) */}
        {["TOEIC_TEST", "DYNAMIC_PART", "PART5_DYNAMIC", "PART6_DYNAMIC", "PART7_DYNAMIC"].includes(lesson.contentType) && (() => {
          // Trích xuất danh sách video (tự động chuẩn hóa để tương thích ngược)
          const rawExplanation = lesson.videoExplanation;
          const videosListRaw: any[] = Array.isArray(rawExplanation)
            ? rawExplanation
            : rawExplanation?.videoUrl
            ? [rawExplanation]
            : [];

          // Luôn đảm bảo có ít nhất 1 video
          const videosList = videosListRaw.length > 0
            ? videosListRaw
            : [{ title: "Video chính", videoUrl: "", videoType: "direct", timestamps: [] }];

          const activeVideo = videosList[activeVideoIndex] || videosList[0] || {};
          const timestamps = activeVideo.timestamps || [];

          // Hàm cập nhật các thuộc tính của video đang chọn
          const updateActiveVideo = (updatedProps: any) => {
            const updatedVideos = [...videosList];
            updatedVideos[activeVideoIndex] = {
              ...updatedVideos[activeVideoIndex],
              ...updatedProps
            };
            updateDraft({ videoExplanation: updatedVideos });
          };

          // Thêm video mới
          const handleAddVideo = () => {
            const updatedVideos = [
              ...videosList,
              {
                title: `Video ${videosList.length + 1}`,
                videoUrl: "",
                videoType: "direct",
                timestamps: []
              }
            ];
            updateDraft({ videoExplanation: updatedVideos });
            setActiveVideoIndex(updatedVideos.length - 1);
          };

          // Xóa video
          const handleDeleteVideo = (idxToDelete: number) => {
            if (videosList.length <= 1) {
              updateDraft({
                videoExplanation: [{ title: "Video chính", videoUrl: "", videoType: "direct", timestamps: [] }]
              });
              setActiveVideoIndex(0);
              return;
            }
            const updatedVideos = videosList.filter((_, idx) => idx !== idxToDelete);
            updateDraft({ videoExplanation: updatedVideos });
            setActiveVideoIndex(Math.max(0, activeVideoIndex - 1));
          };

          return (
            <div className="space-y-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100 relative overflow-hidden transition-all duration-300">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    🎬
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Cấu hình Video Giải Thích & Lý Thuyết</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Thêm nhiều video chữa bài nổi và các mốc thời gian tua câu hỏi riêng cho từng video.</p>
                  </div>
                </div>
              </div>

              {/* Thanh quản lý các video (Tabs) */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
                {videosList.map((vid, idx) => {
                  const isActive = activeVideoIndex === idx;
                  return (
                    <div key={idx} className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-sm border border-slate-150">
                      <button
                        type="button"
                        onClick={() => setActiveVideoIndex(idx)}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                            : "text-slate-600 hover:text-blue-600"
                        }`}
                      >
                        🎥 {vid.title || `Video ${idx + 1}`}
                      </button>
                      {videosList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs"
                          title="Xóa video này"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  );
                })}
                
                <button
                  type="button"
                  onClick={handleAddVideo}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs border border-slate-200 border-dashed transition-all ml-auto"
                >
                  ➕ Thêm Video Mới
                </button>
              </div>

              {/* DÒNG TRÊN: INPUTS (TRÁI) & XEM TRƯỚC VIDEO (PHẢI) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                {/* CỘT TRÁI: THÔNG TIN VIDEO */}
                <div className="space-y-4 flex flex-col justify-center">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề Video (Hiển thị ở Tab học viên)</label>
                    <input
                      type="text"
                      value={activeVideo.title || ""}
                      onChange={(e) => updateActiveVideo({ title: e.target.value })}
                      className="w-full mt-1.5 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-800 bg-white transition-all"
                      placeholder="Ví dụ: Video Chữa Part 5 (Câu 101-110)..."
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Đường dẫn Video Chữa Đề</label>
                    <input
                      type="text"
                      value={activeVideo.videoUrl || ""}
                      onChange={(e) => {
                        const url = e.target.value;
                        let type = "direct";
                        if (url.includes("youtube.com") || url.includes("youtu.be")) type = "youtube";
                        else if (url.includes("drive.google.com")) type = "google-drive";
                        
                        updateActiveVideo({
                          videoUrl: url,
                          videoType: type
                        });
                      }}
                      className="w-full mt-1.5 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-white transition-all"
                      placeholder="Dán link YouTube, Google Drive hoặc file MP4..."
                    />
                  </div>
                </div>

                {/* CỘT PHẢI: KHUNG XEM TRƯỚC VIDEO (PREVIEW PLAYER) */}
                <div>
                  {activeVideo.videoUrl ? (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md bg-slate-950 border border-slate-200 relative">
                      {(() => {
                        const url = activeVideo.videoUrl;
                        const type = activeVideo.videoType || "direct";

                        if (type === "youtube") {
                          let videoId = "";
                          try {
                            if (url.includes("embed/")) {
                              videoId = url.split("embed/")[1]?.split("?")[0];
                            } else if (url.includes("v=")) {
                              videoId = url.split("v=")[1]?.split("&")[0];
                            } else if (url.includes("youtu.be/")) {
                              videoId = url.split("youtu.be/")[1]?.split("?")[0];
                            }
                          } catch (e) {}

                          if (videoId) {
                            return (
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                className="w-full h-full"
                                allowFullScreen
                                title="YouTube Preview"
                              ></iframe>
                            );
                          }
                        }

                        if (type === "google-drive") {
                          let fileId = "";
                          try {
                            if (url.includes("/d/")) {
                              fileId = url.split("/d/")[1]?.split("/")[0];
                            } else if (url.includes("id=")) {
                              fileId = url.split("id=")[1]?.split("&")[0];
                            }
                          } catch (e) {}

                          if (fileId) {
                            return (
                              <iframe
                                src={`https://drive.google.com/file/d/${fileId}/preview`}
                                className="w-full h-full"
                                allow="autoplay"
                                title="Google Drive Preview"
                              ></iframe>
                            );
                          }
                        }

                        return (
                          <video src={url} className="w-full h-full" controls></video>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <p className="text-sm font-bold">Chưa có video nhúng.</p>
                      <p className="text-xs italic mt-1">Dán liên kết video ở trên để xem thử trình phát nhúng.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* DÒNG DƯỚI: BẢNG QUẢN LÝ MỐC THỜI GIAN TIMESTAMPS (FULL WIDTH) */}
              <div className="space-y-4 pt-6 border-t border-slate-200/60 mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bảng mốc thời gian (Timestamps)</label>
                  <div className="flex gap-2">
                    {questionsList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const autoStamps = questionsList.map((q: any, idx: number) => ({
                            label: `Câu ${q.questionNo || (idx + 1)}`,
                            time: 0,
                            targetIndex: idx + 1
                          }));
                          updateActiveVideo({ timestamps: autoStamps });
                        }}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-all"
                        title="Tự động sinh mốc theo đề bài"
                      >
                        ⚡ Tự động tạo mốc
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => updateActiveVideo({ timestamps: [] })}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-[450px] overflow-y-auto scrollbar-thin">
                  <table className="min-w-full divide-y divide-slate-200 border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-left">Nhãn (Label)</th>
                        <th className="px-4 py-3 text-left w-64">Liên kết câu</th>
                        <th className="px-4 py-3 text-left w-48">Thời gian (MM:SS)</th>
                        <th className="px-4 py-3 text-center w-24">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                      {(!timestamps || timestamps.length === 0) ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic">
                            Chưa có mốc thời gian nào. Hãy bấm "Thêm mốc mới" hoặc "Tự động tạo mốc" ở trên.
                          </td>
                        </tr>
                      ) : (
                        timestamps.map((stamp: any, idx: number) => {
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={stamp.label || ""}
                                  onChange={(e) => {
                                    const newStamps = [...timestamps];
                                    newStamps[idx] = { ...stamp, label: e.target.value };
                                    updateActiveVideo({ timestamps: newStamps });
                                  }}
                                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 text-xs font-bold text-slate-700"
                                  placeholder="Ví dụ: Câu 101"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={stamp.targetIndex !== undefined && stamp.targetIndex !== null ? stamp.targetIndex : ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const newStamps = [...timestamps];
                                    newStamps[idx] = { 
                                      ...stamp, 
                                      targetIndex: val === "" ? null : parseInt(val, 10) 
                                    };
                                    updateActiveVideo({ newStamps });
                                    updateActiveVideo({ timestamps: newStamps });
                                  }}
                                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 text-xs font-bold text-slate-700 bg-white"
                                >
                                  <option value="">Không liên kết</option>
                                  {(() => {
                                    const totalQ = questionsList.length > 0 ? questionsList.length : fallbackLength;
                                    return Array.from({ length: totalQ }).map((_, i) => {
                                      const idx = i + 1;
                                      return (
                                        <option key={idx} value={idx}>
                                          Câu {idx}/{totalQ}
                                        </option>
                                      );
                                    });
                                  })()}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <TimeInput
                                  value={stamp.time}
                                  onChange={(newTime) => {
                                    const newStamps = [...timestamps];
                                    newStamps[idx] = { ...stamp, time: newTime };
                                    updateActiveVideo({ timestamps: newStamps });
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newStamps = timestamps.filter((_: any, i: number) => i !== idx);
                                    updateActiveVideo({ timestamps: newStamps });
                                  }}
                                  className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                  ❌
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newStamps = [
                      ...timestamps,
                      { label: `Mốc mới ${(timestamps?.length || 0) + 1}`, time: 0, targetIndex: null }
                    ];
                    updateActiveVideo({ timestamps: newStamps });
                  }}
                  className="w-full py-4 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl border border-slate-200 border-dashed transition-all hover:border-slate-400 text-xs shadow-sm"
                >
                  ➕ Thêm mốc thời gian mới
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}