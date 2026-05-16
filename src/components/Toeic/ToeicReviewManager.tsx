"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Flag, 
  ChevronRight, 
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

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
      
      {/* SIDEBAR BÊN TRÁI: DANH SÁCH CÂU HỎI */}
      <div className="w-80 border-r bg-slate-50/50 flex flex-col shrink-0">
        <div className="p-6 border-b bg-white">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Layout size={20} className="text-blue-600" /> DANH SÁCH ÔN TẬP
          </h2>
          <div className="flex gap-2 mt-4">
             <button 
               onClick={() => setActiveFilter('all')}
               className={`flex-1 py-2 text-[10px] font-black rounded-lg border transition ${activeFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
             >
               TẤT CẢ
             </button>
             <button 
               onClick={() => setActiveFilter('incorrect')}
               className={`flex-1 py-2 text-[10px] font-black rounded-lg border transition ${activeFilter === 'incorrect' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
             >
               CÂU SAI
             </button>
             <button 
               onClick={() => setActiveFilter('flagged')}
               className={`flex-1 py-2 text-[10px] font-black rounded-lg border transition ${activeFilter === 'flagged' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
             >
               GẮN CỜ
             </button>
             <button 
               onClick={() => setActiveFilter('note')}
               className={`flex-1 py-2 text-[10px] font-black rounded-lg border transition ${activeFilter === 'note' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-md shadow-indigo-50' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
             >
               GHI CHÚ
             </button>
           </div>

           {/* Bộ lọc màu cờ (Hiện ở mọi mode để lọc nhanh) */}
           <div className="flex gap-1.5 mt-3 p-1.5 bg-slate-100 rounded-xl">
               <button
                 onClick={() => setActiveColorFilter('ALL')}
                 className={`flex-1 py-1 rounded-lg text-[9px] font-black transition ${activeColorFilter === 'ALL' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
               >
                 ALL
               </button>
               {(['RED', 'PURPLE', 'BLUE', 'YELLOW'] as const).map(color => (
                 <button
                   key={color}
                   onClick={() => setActiveColorFilter(color)}
                   className={`w-8 h-6 rounded-lg flex items-center justify-center transition-all ${
                     activeColorFilter === color ? 'bg-white shadow-md scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'
                   }`}
                 >
                   <Flag size={12} className={`fill-current ${
                     color === 'RED' ? 'text-red-500' :
                     color === 'PURPLE' ? 'text-purple-500' :
                     color === 'BLUE' ? 'text-blue-500' :
                     'text-yellow-500'
                   }`} />
                 </button>
               ))}
             </div>

           {/* Sort toggle */}
           <div className="mt-3 flex items-center gap-1 bg-slate-100 rounded-lg p-1">
             <button
               onClick={() => setSortOrder('newest')}
               title="Mới nhất trước"
               className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[9px] font-black transition-all ${
                 sortOrder === 'newest' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <Clock size={10} /> MỚI NHẤT
             </button>
             <button
               onClick={() => setSortOrder('oldest')}
               title="Cũ nhất trước"
               className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[9px] font-black transition-all ${
                 sortOrder === 'oldest' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <ArrowDownUp size={10} /> CŨ NHẤT
             </button>
             <button
               onClick={() => setSortOrder('byPart')}
               title="Theo Part & số câu"
               className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[9px] font-black transition-all ${
                 sortOrder === 'byPart' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <ListOrdered size={10} /> THEO PART
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {filteredItems.map((item, idx) => {
            const isSelected = activeQuestionId === item.questionId;
            const fColor = item.flagColor?.toUpperCase();
            
            return (
              <button
                key={item.attemptId}
                onClick={() => setActiveQuestionId(item.questionId)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                  isSelected 
                    ? activeFilter === 'flagged' ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm ring-4 ring-orange-50/50' :
                      activeFilter === 'note' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-4 ring-blue-50/50' :
                      activeFilter === 'incorrect' ? 'bg-red-50 border-red-200 text-red-700 shadow-sm ring-4 ring-red-50/50' :
                      'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-4 ring-indigo-50/50'
                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                    isSelected 
                       ? activeFilter === 'flagged' ? 'bg-orange-500 text-white' :
                         activeFilter === 'note' ? 'bg-blue-500 text-white' :
                         activeFilter === 'incorrect' ? 'bg-red-500 text-white' :
                         'bg-indigo-600 text-white'
                       : resolvedIds.has(item.questionId) ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {resolvedIds.has(item.questionId) ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div className={`text-[11px] font-black uppercase tracking-tight flex items-center gap-2 ${
                        isSelected 
                          ? activeFilter === 'flagged' ? 'text-orange-900' :
                            activeFilter === 'note' ? 'text-blue-900' :
                            activeFilter === 'incorrect' ? 'text-red-900' :
                            'text-indigo-900'
                          : 'text-slate-700'
                     }`}>
                      Part {item.partNumber} · Câu {item.question.questionNo}
                      {item.flagNote && (
                        <div className={`p-1 rounded-md ${isSelected ? 'bg-blue-200 text-blue-800' : 'bg-blue-50 text-blue-600'}`}>
                          <PenLine size={10} />
                        </div>
                      )}
                    </div>
                    <div className={`text-[9px] font-bold ${isSelected ? 'text-blue-600/70' : 'text-slate-400'}`}>
                       <div className="flex items-center gap-1.5 mb-1 opacity-80">
                         <Clock size={8} />
                         {new Date(item.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} {new Date(item.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                         {item.courseTitle && <span> · [{item.courseTitle}]</span>}
                       </div>
                       <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                       {item.isFlagged && (
                         <div className="relative group/note">
                           <span className="inline-flex items-center gap-1 cursor-help">
                             <Flag size={8} className={`fill-current ${
                               fColor === 'PURPLE' ? 'text-purple-500' : 
                               fColor === 'BLUE' ? 'text-blue-500' : 
                               fColor === 'YELLOW' ? 'text-yellow-500' : 
                               'text-red-500'
                             }`} /> 
                             Gắn cờ
                           </span>
                           {item.flagNote && (
                             <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/note:opacity-100 transition-all duration-200 pointer-events-none z-[1000] min-w-[200px]">
                               <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10">
                                 <div className="flex items-center gap-1.5 mb-1.5">
                                   <PenLine size={10} className="text-blue-400" />
                                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ghi chú học tập</span>
                                 </div>
                                 <p className="text-[11px] leading-relaxed font-medium italic text-slate-100">
                                   "{item.flagNote}"
                                 </p>
                                 <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/10" />
                               </div>
                             </div>
                           )}
                         </div>
                       )}
                        {item.isFlagged && !item.isCorrect && ' · '}
                        {!item.isCorrect && item.userAnswer && item.userAnswer.trim() !== '' && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-red-500">❌</span> Câu sai
                          </span>
                        )}
                        {(!item.userAnswer || item.userAnswer.trim() === '') && !item.isCorrect && (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                             <span className="text-slate-400">⚪</span> Chưa trả lời
                          </span>
                        )}
                        {item.flagNote && item.flagNote.trim() !== '' && (
                          <>
                            {(item.isFlagged || !item.isCorrect || !item.userAnswer) && ' · '}
                            <span className={`inline-flex items-center gap-1 font-black px-1.5 py-0.5 rounded ${
                              isSelected 
                                ? activeFilter === 'flagged' ? 'bg-orange-500 text-white' :
                                  activeFilter === 'note' ? 'bg-blue-500 text-white' :
                                  activeFilter === 'incorrect' ? 'bg-red-500 text-white' :
                                  'bg-indigo-600 text-white'
                                : 'bg-blue-50 text-blue-600'
                            }`}>
                              <PenLine size={10} /> GHI CHÚ
                            </span>
                          </>
                        )}
                        {resolvedIds.has(item.questionId) && ' · ✨ Đã xong'}
                       </div>
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-slate-300 group-hover:text-blue-400'} />
              </button>
            );
          })}
        </div>
      </div>

      {/* PLAYER BÊN PHẢI: CHI TIẾT CÂU HỎI */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8 no-scrollbar relative">
         <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Link href="/?tab=dashboard" className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
                <ArrowLeft size={16} /> Thoát chế độ ôn tập (Dashboard)
              </Link>
              <div className="flex items-center gap-4">
                 <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
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
                     onToggleFlag={(flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
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
                     onToggleFlag={(flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
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
                     onToggleFlag={(flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
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
                     onToggleFlag={(flag: boolean, color?: ReviewItem['flagColor'], note?: string) => handleStateChange(activeItem.questionId, { isFlagged: flag, flagColor: color, flagNote: note })}
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
  );
}
