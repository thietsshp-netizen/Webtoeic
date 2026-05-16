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

export default function LessonEditor({ lessonId, draftData, onDraftUpdate, onSaveSuccess }: LessonEditorProps) {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toeicTests, setToeicTests] = useState<any[]>([]);
  const [vocabDays, setVocabDays] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

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
      setLoading(true);
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        const data = await res.json();

        if (data && typeof data.content === 'string' && data.content.startsWith('{') && !['DYNAMIC_PART', 'VOCAB_GAME'].includes(data.contentType)) {
          // data.content = "<p><em>⚠️ Nội dung này được tạo bởi trình soạn thảo cũ. Vui lòng soạn thảo lại.</em></p>";
        }

        // Merge với bản nháp hiện có nếu có
        const mergedData = { ...data, ...(draftData || {}) };
        setLesson(mergedData);
      } catch (err) {
        console.error("Failed to fetch lesson", err);
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
            onChange={(e) => updateDraft({ contentType: e.target.value })}
            className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50"
          >
            <option value="TEXT">Văn bản / Đa phương tiện tự do (Quill)</option>
            <option value="TOEIC_TEST">Làm đề Full Test (7 Part)</option>
            <option value="DYNAMIC_PART">Luyện tập theo từng Part (Smart Filter)</option>
            <option value="VOCAB_GAME">Học từ vựng (Vocabulary Game)</option>
          </select>
        </div>

        {lesson.contentType === "DYNAMIC_PART" ? (
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
                   <div className="rounded-[2.5rem] border border-blue-100 shadow-2xl shadow-blue-50 overflow-hidden bg-white min-h-[500px]">
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
                                                    <span className="text-slate-500 truncate max-w-[300px]">{g.passageText?.substring(0, 50) || "(Không có nội dung)"}...</span>
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
      </div>
    </div>
  );
}