"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Flag, 
  ChevronRight, 
  ChevronLeft,
  X,
  ArrowLeft,
  Layout,
  BookOpen,
  Filter,
  Clock,
  ArrowDownUp,
  ListOrdered,
  PenLine
} from 'lucide-react';
import Link from 'next/link';
import ToeicPart1Player from './ToeicPart1Player';
import ToeicPart2Player from './ToeicPart2Player';
import ToeicPart34Player from './ToeicPart34Player';
import ToeicPart5Player from './ToeicPart5Player';
import ToeicPart6Player from './Part6/ToeicPart6Player';
import ToeicPart7Player from './Part7/ToeicPart7Player';

export interface ReviewItem {
  attemptId: string;
  questionId: string;
  lessonId: string;
  courseId: string;
  courseTitle?: string;
  lessonTitle: string;
  partNumber: number;
  isCorrect: boolean;
  isFlagged: boolean;
  flagColor?: 'RED' | 'PURPLE' | 'BLUE' | 'YELLOW' | null;
  flagNote?: string | null;
  userAnswer: string;
  updatedAt: string;
  question: any; // Dữ liệu đầy đủ của câu hỏi
}

export default function ToeicReviewManager({ 
  initialItems, 
  courseId,
  filterType = 'all'
}: { 
  initialItems: ReviewItem[], 
  courseId: string,
  filterType?: 'all' | 'incorrect' | 'flagged' | 'note'
}) {
  const [items, setItems] = useState<ReviewItem[]>(initialItems);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    initialItems.length > 0 ? initialItems[0].questionId : null
  );
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState(filterType);
  const [activeColorFilter, setActiveColorFilter] = useState<'ALL' | 'RED' | 'PURPLE' | 'BLUE' | 'YELLOW'>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'byPart'>('newest');
  const [jumpTo, setJumpTo] = useState<{ id: string; ts: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tính toán danh sách đã lọc + sắp xếp
  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      // 1. Lọc theo danh mục chính
      const isNotAnswered = !item.userAnswer || item.userAnswer.trim() === '';
      let matchCategory = true;
      if (activeFilter === 'incorrect') matchCategory = !item.isCorrect && !isNotAnswered;
      else if (activeFilter === 'flagged') matchCategory = item.isFlagged;
      else if (activeFilter === 'note') matchCategory = !!item.flagNote && item.flagNote.trim() !== '';
      else matchCategory = (!item.isCorrect && !isNotAnswered) || item.isFlagged || (!!item.flagNote && item.flagNote.trim() !== '');

      if (!matchCategory) return false;

      // 2. Lọc theo màu cờ (Nếu đang chọn màu cụ thể)
      if (activeColorFilter !== 'ALL') {
        if (!item.isFlagged) return false;
        // Fallback về RED nếu chưa có màu (dữ liệu cũ)
        const itemColor = (item.flagColor || 'RED').toUpperCase();
        return itemColor === activeColorFilter.toUpperCase();
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      // byPart: sắp xếp theo Part rồi đến số câu
      if (a.partNumber !== b.partNumber) return a.partNumber - b.partNumber;
      return (a.question.questionNo ?? 0) - (b.question.questionNo ?? 0);
    });
  }, [items, activeFilter, activeColorFilter, sortOrder]);

  const activeItem = items.find(it => it.questionId === activeQuestionId);

  const currentIndex = useMemo(() => {
    return filteredItems.findIndex(it => it.questionId === activeQuestionId);
  }, [filteredItems, activeQuestionId]);

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setActiveQuestionId(filteredItems[currentIndex - 1].questionId);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex !== -1 && currentIndex + 1 < filteredItems.length) {
      setActiveQuestionId(filteredItems[currentIndex + 1].questionId);
    }
  };

  // Tự động chọn câu đầu tiên khi chuyển filter nếu câu cũ không còn trong list
  useEffect(() => {
    if (filteredItems.length > 0) {
      const isCurrentInFiltered = filteredItems.some(it => it.questionId === activeQuestionId);
      if (!isCurrentInFiltered) {
        setActiveQuestionId(filteredItems[0].questionId);
      }
    } else {
      setActiveQuestionId(null);
    }
  }, [activeFilter, activeColorFilter, sortOrder]);

  useEffect(() => {
    if (activeQuestionId) {
      const item = items.find(it => it.questionId === activeQuestionId);
      if (item) {
        setJumpTo({ id: String(item.question.questionNo), ts: Date.now() });
      }
    }
  }, [activeQuestionId]);

  // Cập nhật trạng thái câu hỏi khi người dùng làm lại đúng hoặc gỡ cờ
  const handleStateChange = (questionId: string, updates: Partial<ReviewItem>) => {
    setItems(prev => prev.map(item => 
      item.questionId === questionId ? { ...item, ...updates } : item
    ));

    // Nếu người dùng làm đúng câu sai, đánh dấu "Resolved"
    if (updates.isCorrect === true) {
      setResolvedIds(prev => new Set(prev).add(questionId));
      
      // Tự động chuyển câu sau 1.5 giây
      setTimeout(() => {
        const currentIndex = filteredItems.findIndex(it => it.questionId === questionId);
        if (currentIndex !== -1 && currentIndex + 1 < filteredItems.length) {
           setActiveQuestionId(filteredItems[currentIndex + 1].questionId);
        }
      }, 1500);
    }
  };

  // Xử lý dọn dẹp siêu tốc câu hỏi khỏi danh sách review
  const handleQuickResolve = async (item: ReviewItem) => {
    const qKey = item.questionId;
    const corrAns = item.question?.correctAnswer || item.userAnswer || 'A';

    // 1. Chuyển sang câu tiếp theo NGAY LẬP TỨC để tạo cảm giác siêu nhanh (snappy)
    const currentIndex = filteredItems.findIndex(it => it.questionId === qKey);
    let nextActiveId: string | null = null;
    if (currentIndex !== -1) {
      if (currentIndex + 1 < filteredItems.length) {
        nextActiveId = filteredItems[currentIndex + 1].questionId;
      } else if (currentIndex > 0) {
        nextActiveId = filteredItems[currentIndex - 1].questionId;
      }
    }
    setActiveQuestionId(nextActiveId);

    // 2. Gọi API cập nhật database chạy ngầm
    try {
      fetch('/api/progress/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'batch',
          attempts: [{
            questionId: item.questionId,
            lessonId: item.lessonId,
            courseId: item.courseId,
            isCorrect: true,
            userAnswer: corrAns,
            isFlagged: false,
            flagColor: null,
            flagNote: null
          }]
        })
      });
    } catch (e) {
      console.error("Lỗi khi xoá khỏi danh sách review:", e);
    }

    // 3. Cập nhật local state để biến mất khỏi list ngay lập tức
    setItems(prev => prev.map(it => 
      it.questionId === qKey 
        ? { ...it, isCorrect: true, isFlagged: false, flagColor: null, flagNote: null }
        : it
    ));
    setResolvedIds(prev => new Set(prev).add(qKey));
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-10 bg-white rounded-3xl border border-dashed border-slate-200">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">CHƯA CÓ CÂU HỎI NÀO</h2>
        <p className="text-slate-500 max-w-sm">Danh sách ôn tập hiện đang trống. Hãy tiếp tục học các bài mới để rèn luyện nhé!</p>
        <Link href={`/learn/${courseId}`} className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
          Quay lại khóa học
        </Link>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
        <div className="w-80 border-r border-slate-100 bg-slate-50/30"></div>
        <div className="flex-1 bg-white"></div>
      </div>
    );
  }

  const renderSidebarContent = (isMobileDrawer = false) => (
    <div className="flex flex-col h-full">
      <div className="p-4 lg:p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm lg:text-lg font-black text-slate-800 flex items-center gap-2">
            <Layout size={18} className="text-blue-600" /> DANH SÁCH ÔN TẬP
          </h2>
          {isMobileDrawer && (
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 mt-3 sm:mt-4">
          <button
            onClick={() => { setActiveFilter('all'); if (isMobileDrawer) setIsMobileDrawerOpen(false); }}
            className={`flex-1 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black rounded-lg border transition ${activeFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
          >
            TẤT CẢ
          </button>
          <button
            onClick={() => { setActiveFilter('incorrect'); if (isMobileDrawer) setIsMobileDrawerOpen(false); }}
            className={`flex-1 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black rounded-lg border transition ${activeFilter === 'incorrect' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
          >
            CÂU SAI
          </button>
          <button
            onClick={() => { setActiveFilter('flagged'); if (isMobileDrawer) setIsMobileDrawerOpen(false); }}
            className={`flex-1 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black rounded-lg border transition ${activeFilter === 'flagged' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
          >
            GẮN CỜ
          </button>
          <button
            onClick={() => { setActiveFilter('note'); if (isMobileDrawer) setIsMobileDrawerOpen(false); }}
            className={`flex-1 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black rounded-lg border transition ${activeFilter === 'note' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-md shadow-indigo-50' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
          >
            GHI CHÚ
          </button>
        </div>

        {/* Bộ lọc màu cờ */}
        <div className="flex gap-1.5 mt-2.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setActiveColorFilter('ALL'); if (isMobileDrawer) setIsMobileDrawerOpen(false); }}
            className={`flex-1 py-1 rounded-lg text-[9px] font-black transition ${activeColorFilter === 'ALL' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
          >
            ALL
          </button>
          {(['RED', 'PURPLE', 'BLUE', 'YELLOW'] as const).map(color => (
            <button
              key={color}
              onClick={() => { setActiveColorFilter(color); if (isMobileDrawer) setIsMobileDrawerOpen(false); }}
              className={`w-7 sm:w-8 h-5 sm:h-6 rounded-lg flex items-center justify-center transition-all ${
                activeColorFilter === color ? 'bg-white shadow-md scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'
              }`}
            >
              <Flag size={11} className={`fill-current ${
                color === 'RED' ? 'text-red-500' :
                color === 'PURPLE' ? 'text-purple-500' :
                color === 'BLUE' ? 'text-blue-500' :
                'text-yellow-500'
              }`} />
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <div className="mt-2.5 flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setSortOrder('newest')}
            title="Mới nhất trước"
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[8px] sm:text-[9px] font-black transition-all ${
              sortOrder === 'newest' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock size={10} /> MỚI NHẤT
          </button>
          <button
            onClick={() => setSortOrder('oldest')}
            title="Cũ nhất trước"
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[8px] sm:text-[9px] font-black transition-all ${
              sortOrder === 'oldest' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ArrowDownUp size={10} /> CŨ NHẤT
          </button>
          <button
            onClick={() => setSortOrder('byPart')}
            title="Theo Part & số câu"
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[8px] sm:text-[9px] font-black transition-all ${
              sortOrder === 'byPart' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ListOrdered size={10} /> THEO PART
          </button>
        </div>
      </div>

      {/* Danh sách các câu hỏi */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 no-scrollbar">
        {filteredItems.map((item, idx) => {
          const isSelected = activeQuestionId === item.questionId;
          const isResolved = resolvedIds.has(item.questionId);

          let badgeColor = "bg-slate-100 text-slate-400";
          if (isSelected) {
            if (activeFilter === 'flagged') badgeColor = 'bg-orange-500 text-white';
            else if (activeFilter === 'note') badgeColor = 'bg-blue-500 text-white';
            else if (activeFilter === 'incorrect') badgeColor = 'bg-red-500 text-white';
            else badgeColor = 'bg-indigo-600 text-white';
          } else if (isResolved) {
            badgeColor = 'bg-emerald-50 text-emerald-500';
          }

          let titleColor = "text-slate-700";
          if (isSelected) {
            if (activeFilter === 'flagged') titleColor = 'text-orange-900';
            else if (activeFilter === 'note') titleColor = 'text-blue-900';
            else if (activeFilter === 'incorrect') titleColor = 'text-red-900';
            else titleColor = 'text-indigo-900';
          }

          return (
            <div
              key={item.attemptId}
              onClick={() => {
                setActiveQuestionId(item.questionId);
                if (isMobileDrawer) setIsMobileDrawerOpen(false);
              }}
              className={`w-full text-left p-3 sm:p-4 rounded-xl lg:rounded-2xl border transition-all flex items-center justify-between group cursor-pointer relative ${
                isSelected 
                  ? activeFilter === 'flagged' ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm ring-2 ring-orange-50/50' :
                    activeFilter === 'note' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-2 ring-blue-50/50' :
                    activeFilter === 'incorrect' ? 'bg-red-50 border-red-200 text-red-700 shadow-sm ring-2 ring-red-50/50' :
                    'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-2 ring-indigo-50/50'
                  : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-sm'
              }`}
            >
              {/* Nút tích tròn nhỏ dọn dẹp siêu tốc ở góc phải trên cùng */}
              <div 
                className="absolute top-2 right-2 z-10" 
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleQuickResolve(item)}
                  className={`p-1 rounded-md border transition-all active:scale-95 flex items-center justify-center shadow-sm ${
                    isSelected
                      ? 'bg-white/20 border-white/20 hover:bg-white text-emerald-500 hover:text-emerald-600'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                  }`}
                  title="Xoá khỏi danh sách review"
                >
                  <CheckCircle size={10} />
                </button>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${badgeColor}`}>
                  {isResolved ? '✓' : idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[10px] sm:text-[11px] font-black uppercase tracking-tight flex items-center gap-1.5 truncate ${titleColor}`}>
                    Part {item.partNumber} · Câu {item.question.questionNo}
                    {item.flagNote && (
                      <div className={`p-0.5 rounded ${isSelected ? 'bg-blue-200 text-blue-800' : 'bg-blue-50 text-blue-600'}`}>
                        <PenLine size={9} />
                      </div>
                    )}
                  </div>
                  <div className={`text-[8px] sm:text-[9px] font-bold ${isSelected ? 'text-blue-600/70' : 'text-slate-400'}`}>
                     <div className="flex items-center gap-1 opacity-80 truncate">
                       <Clock size={8} />
                       {new Date(item.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                       {item.courseTitle && <span> · [{item.courseTitle}]</span>}
                     </div>
                  </div>
                </div>
              </div>
              <ChevronRight size={14} className={isSelected ? 'text-indigo-600' : 'text-slate-300 group-hover:text-blue-400'} />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-0">
      
      {/* MOBILE DRAWER (XUẤT HIỆN KHI BẤM NÚT TRÊN ĐIỆN THOẠI) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-[99999] md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG NHANH CHO MOBILE & TABLET (NẰM TRỰC TIẾP DƯỚI HEADER TRUNG TÂM ÔN TẬP) */}
      <div className="flex md:hidden items-center justify-between gap-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm mb-3 shrink-0 z-30">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-blue-500/20"
        >
          <Layout size={14} />
          <span>Danh sách ({filteredItems.length})</span>
        </button>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={handlePrevQuestion}
            disabled={currentIndex <= 0}
            className="p-1.5 bg-white disabled:opacity-30 text-slate-700 rounded-lg text-xs font-bold active:scale-95 transition-all shadow-sm"
            title="Câu trước"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-black text-slate-800 px-2 min-w-[45px] text-center">
            {currentIndex !== -1 ? currentIndex + 1 : 0} / {filteredItems.length}
          </span>
          <button
            onClick={handleNextQuestion}
            disabled={currentIndex === -1 || currentIndex >= filteredItems.length - 1}
            className="p-1.5 bg-blue-600 disabled:opacity-30 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-md shadow-blue-500/20"
            title="Câu tiếp theo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* KHỐI NỘI DUNG CHÍNH (SIDEBAR + PLAYER) */}
      <div className="flex-1 flex bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative min-h-0">
        {/* SIDEBAR BÊN TRÁI: CHỈ HIỂN THỊ TRÊN DESKTOP (md:) */}
        <div className="hidden md:flex md:w-72 lg:w-80 border-r bg-slate-50/50 flex-col shrink-0">
          {renderSidebarContent(false)}
        </div>

        {/* PLAYER BÊN PHẢI: CHI TIẾT CÂU HỎI */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-6 lg:p-8 no-scrollbar relative w-full">
           <div className="max-w-4xl mx-auto space-y-4">
              
              <div className="flex items-center justify-between mb-4 sm:mb-8">
              <Link href="/?tab=dashboard" className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
                <ArrowLeft size={16} /> <span className="hidden sm:inline">Thoát chế độ ôn tập</span> (Dashboard)
              </Link>
              <div className="flex items-center gap-4">
                 <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-white border border-slate-200 rounded-full text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Chế độ: {activeFilter === 'all' ? 'Tổng hợp' : activeFilter === 'incorrect' ? 'Sửa câu sai' : activeFilter === 'flagged' ? 'Xem câu gắn cờ' : 'Xem câu có ghi chú'}
                 </span>
              </div>
            </div>

            {activeItem ? (
              <div key={activeItem.questionId} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Ở đây chúng ta bọc Component Player và truyền prop isReviewMode=true */}
                {activeItem.partNumber === 1 ? (
                   <ToeicPart1Player 
                     data={[activeItem.question.group]} // Mock 1 group duy nhất
                     lessonId={activeItem.lessonId}
                     courseId={courseId}
                     initialProgress={{
                        [activeItem.questionId]: {
                          isCorrect: activeItem.isCorrect,
                          userAnswer: activeItem.userAnswer,
                          isFlagged: activeItem.isFlagged,
                          flagColor: activeItem.flagColor,
                          flagNote: activeItem.flagNote
                        }
                     }}
                     isReviewMode={true}
                     onResolved={() => handleStateChange(activeItem.questionId, { isCorrect: true })}
                     onToggleFlag={(qId: string, flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
                     jumpTo={jumpTo}
                   />
                ) : activeItem.partNumber === 2 ? (
                   <ToeicPart2Player 
                     data={[activeItem.question.group]}
                     lessonId={activeItem.lessonId}
                     courseId={courseId}
                     initialProgress={{
                        [activeItem.questionId]: {
                          isCorrect: activeItem.isCorrect,
                          userAnswer: activeItem.userAnswer,
                          isFlagged: activeItem.isFlagged,
                          flagColor: activeItem.flagColor,
                          flagNote: activeItem.flagNote
                        }
                     }}
                     isReviewMode={true}
                     onResolved={() => handleStateChange(activeItem.questionId, { isCorrect: true })}
                     onToggleFlag={(qId: string, flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
                      jumpTo={jumpTo}
                   />
                ) : (activeItem.partNumber === 3 || activeItem.partNumber === 4) ? (
                   <ToeicPart34Player 
                     data={[activeItem.question.group]}
                     lessonId={activeItem.lessonId}
                     courseId={courseId}
                     initialProgress={{
                        [activeItem.questionId]: {
                          isCorrect: activeItem.isCorrect,
                          userAnswer: activeItem.userAnswer,
                          isFlagged: activeItem.isFlagged,
                          flagColor: activeItem.flagColor,
                          flagNote: activeItem.flagNote
                        }
                     }}
                     isReviewMode={true}
                     onResolved={() => handleStateChange(activeItem.questionId, { isCorrect: true })}
                     onToggleFlag={(qId: string, flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
                      jumpTo={jumpTo}
                   />
                ) : activeItem.partNumber === 5 ? (
                   <ToeicPart5Player 
                     data={[activeItem.question]}
                     lessonId={activeItem.lessonId}
                     courseId={courseId}
                     initialProgress={{
                        [activeItem.questionId]: {
                          isCorrect: activeItem.isCorrect,
                          userAnswer: activeItem.userAnswer,
                          isFlagged: activeItem.isFlagged,
                          flagColor: activeItem.flagColor,
                          flagNote: activeItem.flagNote
                        }
                     }}
                     isReviewMode={true}
                     onResolved={() => handleStateChange(activeItem.questionId, { isCorrect: true })}
                     onToggleFlag={(qId: string, flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
                      jumpTo={jumpTo}
                   />
                ) : activeItem.partNumber === 6 ? (
                   <ToeicPart6Player 
                     data={[activeItem.question.group]}
                     lessonId={activeItem.lessonId}
                     courseId={courseId}
                     initialProgress={{
                        [activeItem.questionId]: {
                          isCorrect: activeItem.isCorrect,
                          userAnswer: activeItem.userAnswer,
                          isFlagged: activeItem.isFlagged,
                          flagColor: activeItem.flagColor,
                          flagNote: activeItem.flagNote
                        }
                     }}
                     isReviewMode={true}
                     onResolved={() => handleStateChange(activeItem.questionId, { isCorrect: true })}
                     onToggleFlag={(qId: string, flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
                     jumpTo={jumpTo}
                   />
                ) : activeItem.partNumber === 7 ? (
                  (() => {
                    // Chuẩn hóa dữ liệu questions của Part 7 để sử dụng ID thật
                    const group = activeItem.question.group;
                    const dbQuestions = group.questions || [];
                    
                    // Nếu passageText là JSON, nó chứa nội dung câu hỏi
                    let questionsFromMeta = [];
                    if (typeof group.passageText === 'string' && group.passageText.trim().startsWith('{')) {
                      try {
                        const parsed = JSON.parse(group.passageText);
                        questionsFromMeta = parsed.questions || [];
                      } catch (e) {}
                    }

                     const sourceQuestions = questionsFromMeta.length > 0 ? questionsFromMeta : dbQuestions;
                     const mappedQuestions = sourceQuestions.map((q: any, idx: number) => {
                       const qNo = q.questionNo || q.question_no || q.number;
                       const dbMatch = dbQuestions.find((dq: any) => String(dq.questionNo) === String(qNo));
                       
                       // CƯỠNG ÉP ID: Nếu số câu khớp với câu đang active, dùng luôn ID thật từ activeItem
                       let finalId = dbMatch?.id || q.id;
                       if (String(qNo) === String(activeItem.question.questionNo)) {
                         finalId = activeItem.questionId;
                       }

                       if (!dbMatch && finalId === q.id) {
                         console.log(`🔴🔴🔴 [ReviewManager] No DB match for Q#${qNo}. DB Qs:`, dbQuestions.map((dq:any) => dq.questionNo));
                       } else {
                         console.log(`🟢🟢🟢 [ReviewManager] Matched Q#${qNo} -> ID: ${finalId}`);
                       }
 
                       return { 
                         ...q, 
                         dbId: dbMatch?.id || (finalId.length > 20 ? finalId : undefined), 
                         id: finalId 
                       };
                     });

                    const normalizedGroup = { ...group, questions: mappedQuestions };
                    console.log(`🔵🔵🔵 [ReviewManager] Passing initialProgress for question: ${activeItem.questionId}`, { 
                      isFlagged: activeItem.isFlagged, 
                      flagColor: activeItem.flagColor 
                    });

                    return (
                      <ToeicPart7Player 
                        key={activeItem.questionId} // Thêm key để re-mount khi đổi câu
                        data={[normalizedGroup]}
                        lessonId={activeItem.lessonId}
                        courseId={courseId}
                        initialProgress={{
                           [activeItem.questionId]: {
                             isCorrect: activeItem.isCorrect,
                             userAnswer: activeItem.userAnswer,
                             isFlagged: activeItem.isFlagged,
                             flagColor: activeItem.flagColor,
                             flagNote: activeItem.flagNote
                           }
                        }}
                        isReviewMode={true}
                        onResolved={() => handleStateChange(activeItem.questionId, { isCorrect: true })}
                        onToggleFlag={(qId: string, flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
                        jumpTo={jumpTo}
                      />
                    );
                  })()
                ) : (
                  <div className="p-10 bg-white rounded-3xl border border-slate-100 text-center text-slate-400 font-bold italic">
                     Hỗ trợ Part {activeItem.partNumber} đang được phát triển...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-20 text-slate-300 italic opacity-50">
                <BookOpen size={64} className="mb-4" />
                <p className="text-xl font-black">CHỌN CÂU HỎI ĐỂ BẮT ĐẦU</p>
              </div>
            )}
          </div>
       </div>
     </div>
    </div>
  );
}
