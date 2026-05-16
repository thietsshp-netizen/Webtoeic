"use client";

import { useState, useEffect } from "react";
import { Filter, Search, Book, CheckCircle2, Loader2, List } from "lucide-react";

interface Part5SmartSelectorProps {
  onSelect: (filters: { day?: string; type?: string }) => void;
  initialFilters?: { day?: string; type?: string };
}

export default function Part5SmartSelector({ onSelect, initialFilters }: Part5SmartSelectorProps) {
  const [days, setDays] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  
  // Single state to manage the unified selection (format: "day:xxx" or "type:xxx")
  const [selectedValue, setSelectedValue] = useState(() => {
    if (initialFilters?.day) return `day:${initialFilters.day}`;
    if (initialFilters?.type) return `type:${initialFilters.type}`;
    return "";
  });

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load available filters
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/admin/part5/filters");
        const data = await res.json();
        if (data.success) {
          setDays(data.days);
          setTypes(data.types);
        }
      } catch (err) {
        console.error("Lỗi nạp bộ lọc:", err);
      } finally {
        setLoadingFilters(false);
      }
    }
    fetchFilters();
  }, []);

  // Fetch preview when filters change
  useEffect(() => {
    if (!selectedValue) {
      setPreviewQuestions([]);
      return;
    }

    async function fetchPreview() {
      setLoadingPreview(true);
      try {
        const [mode, value] = selectedValue.split(":");
        const params = new URLSearchParams();
        if (mode === "day") params.append("day", value);
        if (mode === "type") params.append("type", value);

        const res = await fetch(`/api/admin/part5/selection?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setPreviewQuestions(data.questions);
          onSelect(mode === "day" ? { day: value } : { type: value });
        }
      } catch (err) {
        console.error("Lỗi nạp preview:", err);
      } finally {
        setLoadingPreview(false);
      }
    }

    const timer = setTimeout(fetchPreview, 300);
    return () => clearTimeout(timer);
  }, [selectedValue]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Filter size={12} className="text-blue-500" /> Cấu hình bộ câu hỏi động
        </h3>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 ml-1">Chọn Nhóm câu hỏi muốn nạp (theo Day hoặc Loại)</label>
          <select
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-700 transition-all cursor-pointer text-sm"
          >
            <option value="">-- Vui lòng chọn một nhóm để nạp --</option>
            
            {days.length > 0 && (
              <optgroup label="📂 PHÂN LOẠI THEO BUỔI HỌC (DAY)">
                {days.map(day => (
                  <option key={`day:${day}`} value={`day:${day}`}>Buổi học: {day}</option>
                ))}
              </optgroup>
            )}

            {types.length > 0 && (
              <optgroup label="🏷️ PHÂN LOẠI THEO NGỮ PHÁP (TYPE)">
                {types.map(type => (
                  <option key={`type:${type}`} value={`type:${type}`}>Loại: {type}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {selectedValue ? (
          <div className="pt-4 border-t border-slate-50">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <List size={12} /> Số câu sẽ nạp vào bài: {previewQuestions.length}
                </span>
                {loadingPreview && <Loader2 size={14} className="animate-spin text-blue-500" />}
             </div>

             <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {previewQuestions.map((q, i) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                     <span className="text-[10px] font-black text-slate-300 mt-0.5">{(i+1).toString().padStart(2, '0')}</span>
                     <p className="text-xs font-medium text-slate-600 line-clamp-2">{q.questionText}</p>
                  </div>
                ))}
                {previewQuestions.length === 0 && !loadingPreview && (
                  <div className="py-10 text-center text-slate-300 text-xs italic">
                    Không tìm thấy câu hỏi nào phù quả với bộ lọc này.
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="py-10 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
            <Search size={24} className="mx-auto text-slate-200 mb-2" />
            <p className="text-xs font-bold text-slate-400">Vui lòng chọn Day hoặc Loại để xem trước dữ liệu.</p>
          </div>
        )}
      </div>
    </div>
  );
}
