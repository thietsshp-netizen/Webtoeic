"use client";

import { useState, useEffect } from "react";
import { Filter, Search, BookOpen, Loader2, List, FileText, Layout, Image as ImageIcon, MessageSquare, Headphones } from "lucide-react";

interface SmartPartSelectorProps {
  onSelect: (data: any) => void;
  initialData?: any;
}

export default function SmartPartSelector({ onSelect, initialData }: SmartPartSelectorProps) {
  const [selectedPart, setSelectedPart] = useState<number>(initialData?.part || 1);
  const [filters, setFilters] = useState<any>(initialData?.filters || {});

  // Sync internal state when initialData changes (e.g. after lesson data is fetched)
  useEffect(() => {
    if (initialData?.part) {
      setSelectedPart(initialData.part);
    }
    if (initialData?.filters) {
      setFilters(initialData.filters);
    }
  }, [JSON.stringify(initialData)]);
  const [availableFilters, setAvailableFilters] = useState<any>(null);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Notify parent immediately when internal state changes
  useEffect(() => {
    onSelect({ part: selectedPart, filters });
  }, [selectedPart, filters]);

  const parts = [
    { id: 1, name: "Part 1", icon: <ImageIcon size={14} /> },
    { id: 2, name: "Part 2", icon: <MessageSquare size={14} /> },
    { id: 3, name: "Part 3", icon: <Headphones size={14} /> },
    { id: 4, name: "Part 4", icon: <Headphones size={14} /> },
    { id: 5, name: "Part 5", icon: <Layout size={14} /> },
    { id: 6, name: "Part 6", icon: <FileText size={14} /> },
    { id: 7, name: "Part 7", icon: <BookOpen size={14} /> },
  ];

  // Load filters for the selected part
  useEffect(() => {
    async function fetchFilters() {
      setLoadingFilters(true);
      try {
        const res = await fetch(`/api/admin/parts/${selectedPart}/filters`);
        const data = await res.json();
        if (data.success) {
          setAvailableFilters(data.filters);
        }
      } catch (err) {
        console.error("Failed to fetch filters", err);
      } finally {
        setLoadingFilters(false);
      }
    }
    fetchFilters();
  }, [selectedPart]);

  // Fetch preview when filters change
  useEffect(() => {
    async function fetchPreview() {
      if (!selectedPart) return;
      setLoadingPreview(true);
      try {
        const res = await fetch(`/api/admin/parts/${selectedPart}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters })
        });
        const data = await res.json();
        if (data.success) {
          setPreviewData(data.items);
        }
      } catch (err) {
        console.error("Failed to fetch preview", err);
      } finally {
        setLoadingPreview(false);
      }
    }

    const timer = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timer);
  }, [selectedPart, filters]);

  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => {
      const newFilters = { ...prev };
      if (value === "" || value === null || value === undefined) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      return newFilters;
    });
  };

  return (
    <div className="space-y-8">
      {/* Bước 1: Chọn Part */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Layout size={12} className="text-blue-500" /> Bước 1: Chọn Part muốn luyện tập
        </label>
        <div className="flex flex-wrap gap-2">
          {parts.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPart(p.id);
                setFilters({}); // Reset filters when part changes
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${selectedPart === p.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50'}`}
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bước 2: Bộ lọc thông minh */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={12} className="text-blue-500" /> Bước 2: Cấu hình bộ lọc (Part {selectedPart})
          </h3>
          {loadingFilters && <Loader2 size={14} className="animate-spin text-blue-500" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bộ lọc Book & Test - Chung cho các Part */}
          {(availableFilters?.books?.length > 0) && (
            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Bộ đề (Book)</label>
              <select
                value={filters.book || ""}
                onChange={(e) => updateFilter("book", e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm transition-all"
              >
                <option value="">-- Tất cả bộ đề --</option>
                {filters.book && !availableFilters?.books?.includes(filters.book) && (
                  <option value={filters.book}>{filters.book}</option>
                )}
                {availableFilters?.books?.map((b: string) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {(availableFilters?.tests?.length > 0) && (
            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Đề số (Test)</label>
              <select
                value={filters.test || ""}
                onChange={(e) => updateFilter("test", e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm transition-all"
              >
                <option value="">-- Tất cả đề --</option>
                {filters.test && !availableFilters?.tests?.includes(filters.test) && (
                  <option value={filters.test}>Test {filters.test}</option>
                )}
                {availableFilters?.tests?.map((t: string) => (
                  <option key={t} value={t}>Test {t}</option>
                ))}
              </select>
            </div>
          )}

          {selectedPart === 1 && (
            <div className="space-y-2 col-span-2">
              <label className="text-xs font-bold text-slate-600 ml-1">Dạng tranh (PicType)</label>
              <select
                value={filters.picType || ""}
                onChange={(e) => updateFilter("picType", e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm"
              >
                <option value="">-- Tất cả các dạng tranh --</option>
                {filters.picType && !availableFilters?.picTypes?.includes(filters.picType) && (
                  <option value={filters.picType}>{filters.picType}</option>
                )}
                {availableFilters?.picTypes?.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {selectedPart === 2 && (
            <div className="space-y-2 col-span-2">
              <label className="text-xs font-bold text-slate-600 ml-1">Loại câu hỏi (Question Type)</label>
              <select
                value={filters.type || ""}
                onChange={(e) => updateFilter("type", e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm"
              >
                <option value="">-- Tất cả các loại --</option>
                {filters.type && !availableFilters?.types?.includes(filters.type) && (
                  <option value={filters.type}>{filters.type}</option>
                )}
                {availableFilters?.types?.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {(selectedPart === 3 || selectedPart === 4) && (
            <div className="space-y-4 col-span-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 ml-1">Yêu cầu đồ họa (Graphic)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateFilter("hasGraphic", null);
                      updateFilter("passageType", "");
                    }}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${filters.hasGraphic === undefined || filters.hasGraphic === null ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => {
                      updateFilter("hasGraphic", "yes");
                      updateFilter("passageType", "");
                    }}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${filters.hasGraphic === "yes" ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                  >
                    Có hình minh họa
                  </button>
                  <button
                    onClick={() => {
                      updateFilter("hasGraphic", "no");
                      updateFilter("passageType", "");
                    }}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${filters.hasGraphic === "no" ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                  >
                    Không có hình
                  </button>
                </div>
              </div>

              {(availableFilters?.passageTypes?.length > 0) && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn gói câu hỏi (Gói 30 đoạn)</label>
                  <select
                    value={filters.passageType || ""}
                    onChange={(e) => updateFilter("passageType", e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm transition-all shadow-inner"
                  >
                    <option value="">-- Tất cả các gói --</option>
                    {availableFilters.passageTypes
                      .filter((p: string) => {
                        if (filters.hasGraphic === 'yes') return p.startsWith("Có hình");
                        if (filters.hasGraphic === 'no') return p.startsWith("Không có hình");
                        return true;
                      })
                      .map((p: string) => (
                        <option key={p} value={p}>{p}</option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>
          )}

          {selectedPart === 5 && (
            <div className="space-y-2 col-span-2">
              <label className="text-xs font-bold text-slate-600 ml-1">Dạng ngữ pháp / từ vựng</label>
              <select
                value={filters.type || ""}
                onChange={(e) => updateFilter("type", e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm"
              >
                <option value="">-- Tất cả các dạng --</option>
                {filters.type && !availableFilters?.types?.includes(filters.type) && (
                  <option value={filters.type}>{filters.type}</option>
                )}
                {availableFilters?.types?.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {selectedPart === 6 && (
            <div className="space-y-2 col-span-2">
              <label className="text-xs font-bold text-slate-600 ml-1">Loại đoạn văn (Passage Type)</label>
              <select
                value={filters.passageType || ""}
                onChange={(e) => updateFilter("passageType", e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm"
              >
                <option value="">-- Tất cả các loại --</option>
                {filters.passageType && !availableFilters?.passageTypes?.includes(filters.passageType) && (
                  <option value={filters.passageType}>{filters.passageType}</option>
                )}
                {availableFilters?.passageTypes?.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {selectedPart === 7 && (
            <>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold text-slate-600 ml-1">Số lượng đoạn văn (Passage Count)</label>
                <div className="flex flex-wrap gap-2">
                  <div className="flex p-1 bg-slate-100 rounded-2xl w-fit mr-4">
                    <button
                      onClick={() => {
                        updateFilter("selectionMode", "passage");
                        updateFilter("questionType", null);
                      }}
                      className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${(!filters.selectionMode || filters.selectionMode === 'passage') ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Theo Bài Đọc
                    </button>
                    <button
                      onClick={() => {
                        updateFilter("selectionMode", "question");
                        updateFilter("complexity", null);
                        updateFilter("passageType", null);
                      }}
                      className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${filters.selectionMode === 'question' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Theo Câu Hỏi
                    </button>
                  </div>

                  {(!filters.selectionMode || filters.selectionMode === 'passage') && (
                    <div className="flex gap-2">
                      {["single", "double", "triple"].map(c => (
                        <button
                          key={c}
                          onClick={() => {
                            updateFilter("complexity", c);
                            updateFilter("passageType", "");
                          }}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filters.complexity === c ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}
                        >
                          {c === "single" ? "Đơn" : c === "double" ? "Đôi" : "Ba"}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          updateFilter("complexity", null);
                          updateFilter("passageType", "");
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!filters.complexity ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100'}`}
                      >
                        Tất cả
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {(filters.selectionMode === 'passage' || !filters.selectionMode) ? (
                <div className="space-y-3 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thể loại bài đọc cụ thể</label>
                  <select 
                    value={filters.passageType || ""}
                    onChange={(e) => updateFilter("passageType", e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm transition-all"
                  >
                  <option value="">-- Tất cả các thể loại --</option>
                  {filters.passageType && !((filters.complexity ? (availableFilters?.categoriesByComplexity?.[filters.complexity.toLowerCase()] || []) : Array.from(new Set(Object.values(availableFilters?.categoriesByComplexity || {}).flat() as string[])))).includes(filters.passageType) && (
                    <option value={filters.passageType}>{filters.passageType}</option>
                  )}
                  {filters.complexity ? (
                    (availableFilters?.categoriesByComplexity?.[filters.complexity.toLowerCase()] || []).map((cat: string) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))
                  ) : (
                    Array.from(new Set(Object.values(availableFilters?.categoriesByComplexity || {}).flat() as string[])).sort().map((cat: string) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))
                  )}
                  </select>
                </div>
              ) : (
                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mục tiêu dạng câu hỏi</label>
                  <select 
                    value={filters.questionType || ""}
                    onChange={(e) => updateFilter("questionType", e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm transition-all"
                  >
                    <option value="">-- Tất cả các dạng câu hỏi --</option>
                    {filters.questionType && !availableFilters?.questionTypes?.includes(filters.questionType) && (
                      <option value={filters.questionType}>{filters.questionType}</option>
                    )}
                    {(availableFilters?.questionTypes || []).map((type: string) => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        <div className="pt-6 border-t border-slate-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <List size={12} /> Số câu/nhóm tìm thấy: {previewData.length}
            </span>
            {loadingPreview && <Loader2 size={14} className="animate-spin text-blue-500" />}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {previewData.map((item, i) => {
              const isSelected = filters.targetQuestionId ? item.targetQuestionId === filters.targetQuestionId : filters.id === item.id;
              
              return (
                <div 
                  key={item.targetQuestionId || item.id} 
                  onClick={() => {
                    if (filters.selectionMode === 'question') {
                      updateFilter("targetQuestionId", item.targetQuestionId);
                      updateFilter("id", item.id); // Also store group ID
                    } else {
                      updateFilter("id", item.id);
                      updateFilter("targetQuestionId", null);
                    }
                  }}
                  className={`p-3 cursor-pointer transition-all rounded-2xl border flex items-start gap-4 ${isSelected ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-50 hover:bg-blue-50/30 border-slate-100'}`}
                >
                  <div className={`w-12 h-8 rounded-xl shadow-sm border flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                    {item.questionRange || (i + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.book} - Test {item.test}
                      </span>
                      {item.metadata?.PicType && (
                        <span className="bg-blue-100 text-blue-700 font-bold text-[8px] uppercase px-1.5 py-0.5 rounded">
                          {item.metadata.PicType}
                        </span>
                      )}
                      {item.metadata?.complexity && (
                        <span className="bg-orange-100 text-orange-700 font-bold text-[8px] uppercase px-1.5 py-0.5 rounded">
                          {item.metadata.complexity}
                        </span>
                      )}
                      {(item.metadata?.has_graphic?.toLowerCase() === "yes" || item.metadata?.pic_id) && (
                        <span className="bg-emerald-100 text-emerald-700 font-bold text-[8px] uppercase px-1.5 py-0.5 rounded">
                          Có hình ảnh
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] font-medium line-clamp-1 italic ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                      {item.previewText || item.questionText || "Dữ liệu âm thanh/hình ảnh"}
                    </p>
                  </div>
                </div>
              );
            })}
            {previewData.length === 0 && !loadingPreview && (
              <div className="py-12 text-center text-slate-300 text-xs italic">
                <Search size={20} className="mx-auto mb-2 opacity-20" />
                Không tìm thấy kết quả phù hợp.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
