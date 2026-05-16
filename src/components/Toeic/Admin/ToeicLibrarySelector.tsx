"use client";

import { useState, useEffect } from "react";
import { 
  Search, Filter, X, Image as ImageIcon, 
  Music, ChevronRight, Loader2, Check,
  Layers, Calendar, Hash
} from "lucide-react";

interface LibraryGroup {
  id: string;
  audioUrl: string;
  imageUrl: string;
  transcript: string;
  metadata: any;
  questions: any[];
  part: {
    partNumber: number;
    test: {
      title: string;
    }
  }
}

interface ToeicLibrarySelectorProps {
  onSelect: (group: LibraryGroup) => void;
  onClose: () => void;
}

export default function ToeicLibrarySelector({ onSelect, onClose }: ToeicLibrarySelectorProps) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<LibraryGroup[]>([]);
  const [filters, setFilters] = useState({
    day: "",
    part: "7", // Default to Part 7 since the user is working on it
    complexity: "",
    category: "",
    hasImage: "",
    search: ""
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchGroups();
  }, [filters, page]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        day: filters.day,
        part: filters.part,
        complexity: filters.complexity,
        category: filters.category,
        hasImage: filters.hasImage,
        search: filters.search,
        page: page.toString(),
        limit: "12"
      });
      const res = await fetch(`/api/admin/toeic-library/groups?${query}`);
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Fetch library error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="shrink-0 p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Layers size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Kho Thư Viện Câu Hỏi</h2>
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.15em] ml-13">Chọn từ {groups.length * totalPages}+ bộ câu hỏi đã chuẩn hóa</p>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="shrink-0 p-6 bg-white border-b border-slate-50 flex flex-wrap items-center gap-4">
          <div className="relative group flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Tìm kiếm theo tên bài, đề thi..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-600 placeholder:text-slate-300 transition-all"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
               <Calendar size={14} className="text-slate-400" />
               <select 
                 className="bg-transparent font-bold text-xs text-slate-600 outline-none uppercase tracking-wider cursor-pointer"
                 value={filters.day}
                 onChange={(e) => setFilters(prev => ({ ...prev, day: e.target.value }))}
               >
                 <option value="">TẤT CẢ DAY</option>
                 {Array.from({ length: 30 }).map((_, i) => (
                   <option key={i+1} value={i+1}>DAY {i+1}</option>
                 ))}
               </select>
             </div>

             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
               <Hash size={14} className="text-slate-400" />
               <select 
                 className="bg-transparent font-bold text-xs text-slate-600 outline-none uppercase tracking-wider cursor-pointer"
                 value={filters.part}
                 onChange={(e) => setFilters(prev => ({ ...prev, part: e.target.value }))}
               >
                 <option value="1">PART 1</option>
                 <option value="2">PART 2</option>
                 <option value="3">PART 3</option>
                 <option value="4">PART 4</option>
                 <option value="5">PART 5</option>
                 <option value="6">PART 6</option>
                 <option value="7">PART 7</option>
               </select>
             </div>

             {filters.part === "7" && (
               <>
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                   <Layers size={14} className="text-slate-400" />
                   <select 
                     className="bg-transparent font-bold text-xs text-slate-600 outline-none uppercase tracking-wider cursor-pointer"
                     value={filters.complexity}
                     onChange={(e) => setFilters(prev => ({ ...prev, complexity: e.target.value }))}
                   >
                     <option value="">DẠNG BÀI (ALL)</option>
                     <option value="single">SINGLE (ĐOẠN ĐƠN)</option>
                     <option value="double">DOUBLE (ĐOẠN ĐÔI)</option>
                     <option value="triple">TRIPLE (ĐOẠN BA)</option>
                   </select>
                 </div>

                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                   <Filter size={14} className="text-slate-400" />
                   <select 
                     className="bg-transparent font-bold text-xs text-slate-600 outline-none uppercase tracking-wider cursor-pointer"
                     value={filters.category}
                     onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                   >
                     <option value="">THỂ LOẠI (ALL)</option>
                     <option value="email">EMAIL</option>
                     <option value="article">ARTICLE</option>
                     <option value="advertisement">ADVERTISEMENT</option>
                     <option value="flyer">FLYER</option>
                     <option value="memo">MEMO</option>
                     <option value="text-message">TEXT MESSAGE</option>
                     <option value="chat-discussion">CHAT DISCUSSION</option>
                   </select>
                 </div>
               </>
             )}

             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
               <ImageIcon size={14} className="text-slate-400" />
               <select 
                 className="bg-transparent font-bold text-xs text-slate-600 outline-none uppercase tracking-wider cursor-pointer"
                 value={filters.hasImage}
                 onChange={(e) => setFilters(prev => ({ ...prev, hasImage: e.target.value }))}
               >
                 <option value="">HÌNH ẢNH (ALL)</option>
                 <option value="true">CÓ ẢNH</option>
                 <option value="false">KHÔNG ẢNH</option>
               </select>
             </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <Loader2 size={48} className="animate-spin text-blue-500" />
              <p className="font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu thư viện...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
              <Search size={64} strokeWidth={1} />
              <p className="font-bold">Không tìm thấy bộ câu hỏi nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div 
                  key={group.id}
                  className="group bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col gap-4 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden relative"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-full w-fit">
                        Part {group.part?.partNumber || group.metadata?.part || 7}
                        {group.metadata?.complexity && ` • ${group.metadata.complexity}`}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1 leading-tight mt-1">
                        {group.part?.test?.title} {group.metadata?.questionRange && `[${group.metadata.questionRange}]`}
                      </h4>
                      {group.metadata?.category && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{group.metadata.category}</span>
                      )}
                    </div>
                    {group.imageUrl && <ImageIcon size={16} className="text-emerald-500" />}
                  </div>

                  {/* Preview Content */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                      <Music size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-blue-500 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-normal">03 Ques</span>
                  </div>

                  <div className="mt-2 space-y-1.5 opacity-60">
                    {group.questions.slice(0, 2).map((q: any) => (
                      <p key={q.id} className="text-[11px] font-bold text-slate-500 line-clamp-1">• {q.questionText}</p>
                    ))}
                    {group.questions.length > 2 && <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">+{group.questions.length - 2} câu hỏi khác</p>}
                  </div>

                  {/* Add Button Area */}
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                       Day {group.metadata?.day || "?"}
                     </span>
                     <button 
                       onClick={() => onSelect(group)}
                       className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-slate-100"
                     >
                       Chọn <ChevronRight size={14} />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Pagination) */}
        <div className="shrink-0 p-6 bg-white border-t border-slate-100 flex items-center justify-center gap-4">
           <button 
             disabled={page === 1}
             onClick={() => setPage(p => p - 1)}
             className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
           >
             Trang Trước
           </button>
           <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Trang {page} / {totalPages}</span>
           <button 
             disabled={page === totalPages}
             onClick={() => setPage(p => p + 1)}
             className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
           >
             Trang Sau
           </button>
        </div>
      </div>
    </div>
  );
}
