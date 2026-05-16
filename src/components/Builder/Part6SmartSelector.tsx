"use client";

import { useState, useEffect } from "react";
import { Filter, Search, Loader2, List, FileText } from "lucide-react";

interface Part6SmartSelectorProps {
  onSelect: (filters: { day?: string; type?: string; book?: string; all?: boolean }) => void;
  initialFilters?: { day?: string; type?: string; book?: string; all?: boolean };
}

export default function Part6SmartSelector({ onSelect, initialFilters }: Part6SmartSelectorProps) {
  const [days, setDays] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [books, setBooks] = useState<string[]>([]);
  
  // Single state to manage the unified selection (format: "day:xxx", "type:xxx", "book:xxx", or "all:true")
  const [selectedValue, setSelectedValue] = useState(() => {
    if (initialFilters?.all) return "all:true";
    if (initialFilters?.book) return `book:${initialFilters.book}`;
    if (initialFilters?.day) return `day:${initialFilters.day}`;
    if (initialFilters?.type) return `type:${initialFilters.type}`;
    return "";
  });

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [previewGroups, setPreviewGroups] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load available filters
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/admin/part6/filters");
        const data = await res.json();
        if (data.success) {
          setDays(data.days);
          setTypes(data.types);
          setBooks(data.books || []);
        }
      } catch (err) {
        console.error("Lỗi nạp bộ lọc Part 6:", err);
      } finally {
        setLoadingFilters(false);
      }
    }
    fetchFilters();
  }, []);

  // Fetch preview when filters change
  useEffect(() => {
    if (!selectedValue) {
      setPreviewGroups([]);
      return;
    }

    async function fetchPreview() {
      setLoadingPreview(true);
      try {
        const [mode, value] = selectedValue.split(":");
        const params = new URLSearchParams();
        if (mode === "all") params.append("all", "true");
        if (mode === "day") params.append("day", value);
        if (mode === "type") params.append("type", value);
        if (mode === "book") params.append("book", value);

        const res = await fetch(`/api/admin/part6/selection?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setPreviewGroups(data.groups);
          
          const filterObj: any = {};
          if (mode === "all") filterObj.all = true;
          else if (mode === "day") filterObj.day = value;
          else if (mode === "type") filterObj.type = value;
          else if (mode === "book") filterObj.book = value;
          
          onSelect(filterObj);
        }
      } catch (err) {
        console.error("Lỗi nạp preview Part 6:", err);
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
          <Filter size={12} className="text-emerald-500" /> Cấu hình Ngân hàng Part 6 động
        </h3>

        {/* Nối tắt lựa chọn nhanh */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nối tắt lựa chọn nhanh</label>
          <div className="flex flex-wrap gap-2">
            <button
               onClick={() => setSelectedValue("all:true")}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedValue === "all:true" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200" : "bg-white text-slate-600 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50"}`}
            >
              🚀 Toàn bộ Part 6
            </button>
            {books.includes("ETS2024") && (
              <button
                onClick={() => setSelectedValue("book:ETS2024")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedValue === "book:ETS2024" ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-white text-slate-600 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50"}`}
              >
                📚 Toàn bộ ETS 2024
              </button>
            )}
            {books.includes("ETS2026") && (
              <button
                onClick={() => setSelectedValue("book:ETS2026")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedValue === "book:ETS2026" ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200" : "bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50"}`}
              >
                📖 Toàn bộ ETS 2026
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Hoặc chọn chi tiết (theo Day, Loại, Sách)</label>
          <select
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-slate-700 transition-all cursor-pointer text-sm"
          >
            <option value="">-- Vui lòng chọn một nhóm để nạp --</option>
            <option value="all:true">Toàn bộ ngân hàng Part 6</option>
            
            {books.length > 0 && (
              <optgroup label="📚 PHÂN LOẠI THEO BỘ SÁCH (BOOK)">
                {books.map(book => (
                  <option key={`book:${book}`} value={`book:${book}`}>Sách: {book}</option>
                ))}
              </optgroup>
            )}

            {days.length > 0 && (
              <optgroup label="📂 PHÂN LOẠI THEO BUỔI HỌC (DAY)">
                {days.map(day => (
                  <option key={`day:${day}`} value={`day:${day}`}>Buổi học: {day}</option>
                ))}
              </optgroup>
            )}

            {types.length > 0 && (
              <optgroup label="🏷️ PHÂN LOẠI THEO LOẠI BÀI (PASSAGE TYPE)">
                {types.map(type => (
                  <option key={`type:${type}`} value={`type:${type}`}>Thể loại: {type}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {selectedValue ? (
          <div className="pt-4 border-t border-slate-50">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <List size={12} /> Số đoạn văn sẽ nạp: {previewGroups.length}
                </span>
                {loadingPreview && <Loader2 size={14} className="animate-spin text-emerald-500" />}
             </div>

             <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {previewGroups.map((g, i) => (
                  <div key={g.id} className="p-4 bg-slate-50 hover:bg-emerald-50/30 transition-colors rounded-2xl border border-slate-100 flex items-start gap-4">
                     <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                       <FileText size={20} className="text-slate-400" />
                     </div>
                     <div className="flex-1 space-y-1 mt-1 text-left">
                       <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-700 font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                            Đoạn {i + 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                             {g.book} - {g.test}
                          </span>
                       </div>
                       <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">"{g.previewText}"</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{g.questionCount} Câu hỏi đính kèm</p>
                     </div>
                  </div>
                ))}
                {previewGroups.length === 0 && !loadingPreview && (
                  <div className="py-10 text-center text-slate-300 text-xs italic">
                    Không tìm thấy bài đọc nào phù hợp với bộ lọc này.
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="py-10 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
            <Search size={24} className="mx-auto text-slate-200 mb-2" />
            <p className="text-xs font-bold text-slate-400">Vui lòng chọn Day hoặc Thể Loại để xem trước.</p>
          </div>
        )}
      </div>
    </div>
  );
}
