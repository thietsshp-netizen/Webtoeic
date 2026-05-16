"use client";

import { useState, useMemo } from "react";
import { Search, Filter, BookOpen, CheckCircle2, ChevronRight } from "lucide-react";

interface SmartToeicSelectorProps {
  tests: any[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function SmartToeicSelector({ tests, selectedId, onSelect }: SmartToeicSelectorProps) {
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isOpen, setIsOpen] = useState(false);

  const partNames: Record<number, string> = {
    1: "Part 1: Photographs",
    2: "Part 2: Q&A",
    3: "Part 3: Conversations",
    4: "Part 4: Short Talks",
    5: "Part 5: Sentences",
    6: "Part 6: Text",
    7: "Part 7: Reading",
  };

  const filteredTests = useMemo(() => {
    return tests.filter((t: any) => {
      // Filter by Part
      if (selectedPart !== null) {
        const hasPart = t.parts?.some((p: any) => p.partNumber === selectedPart);
        if (!hasPart) return false;
      }
      
      // Filter by Search Query
      if (searchQuery.trim() === "") return true;
      const lowerQuery = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(lowerQuery);
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [tests, selectedPart, searchQuery]);

  const currentSelection = useMemo(() => tests.find(t => t.id === selectedId), [tests, selectedId]);

  return (
    <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
      {/* Header / Selected State */}
      <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <BookOpen size={16} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-blue-400 tracking-wider">Đang chọn bộ đề</p>
            <p className="text-sm font-bold text-blue-900 line-clamp-1">
              {currentSelection ? currentSelection.title : "-- Chưa chọn bài tập --"}
            </p>
          </div>
        </div>
        {currentSelection && (
          <CheckCircle2 className="text-emerald-500 w-5 h-5 ml-4 flex-shrink-0" />
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Step 1: Filter by Part */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={12} /> Bước 1: Lọc theo Part
          </label>
          <div className="flex flex-wrap gap-2">
            <button
               onClick={() => setSelectedPart(null)}
               className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedPart === null ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              TẤT CẢ
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map(num => (
              <button
                key={num}
                onClick={() => setSelectedPart(num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedPart === num ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Part {num}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Search and List */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Search size={12} /> Bước 2: Tìm và Chọn (Kết quả: {filteredTests.length})
          </label>
          <div className="relative">
            <input 
              type="text"
              placeholder="Gõ tên bài để tìm nhanh (VD: Day 10)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          </div>

          {isOpen && (
            <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
              {filteredTests.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs italic">
                  Không tìm thấy bài tập nào khớp với yêu cầu lọc.
                </div>
              ) : (
                filteredTests.map((t: any) => {
                  const isActive = t.id === selectedId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelect(t.id)}
                      className={`w-full text-left p-3 rounded-2xl transition-all group flex items-center justify-between ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-blue-50 border border-transparent hover:border-blue-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-blue-400'} flex-shrink-0`} />
                        <div>
                          <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-700'}`}>{t.title}</p>
                          <p className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-400'} font-bold`}>
                            {t.questionCount || 0} Câu hỏi • {t.groupCount || 0} Đoạn văn • {t._count?.parts || 0} Phần
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isActive ? 'text-blue-200' : 'text-slate-300'}`} />
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
