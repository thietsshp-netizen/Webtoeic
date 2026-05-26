"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import AuthModal from "@/components/Auth/AuthModal";
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronRight, 
  PlayCircle, 
  FileText, 
  Layout, 
  Lock,
  Star,
  ChevronsUpDown,
  BookOpen,
  Layers,
  Flag,
  PenLine,
  Search,
  X,
  ExternalLink,
  ArrowUpDown,
  Filter,
  BookMarked
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Lesson {
  id: string;
  title: string;
  contentType: string;
  order: number;
  isPreview: boolean;
  videoUrl?: string;
  videoExplanation?: any;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Book {
  id: string;
  title: string;
  order: number;
  sections: Section[];
}

export default function LearnSidebar() {
  const { courseId, lessonId } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});

  // Review Center States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'NOTE' | 'FLAG_ONLY'>('ALL');
  const [expandedDrawerBooks, setExpandedDrawerBooks] = useState<Record<string, boolean>>({});
  const [expandedDrawerSections, setExpandedDrawerSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchSyllabus() {
      if (!courseId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}/syllabus`);
        const data = await res.json();
        if (data.success) {
          setBooks(data.books);
          setIsEnrolled(data.isEnrolled);
          if (data.progressMap) setProgressMap(data.progressMap);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu bài giảng:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSyllabus();
  }, [courseId]);

  // Handle auto-expanding when lessonId changes or books are loaded
  useEffect(() => {
    if (!lessonId || books.length === 0) return;

    let foundBookId = null;
    let foundSectionId = null;

    for (const book of books) {
      const section = book.sections.find((s: Section) => 
        s.lessons.some(l => l.id === lessonId)
      );
      if (section) {
        foundBookId = book.id;
        foundSectionId = section.id;
        break;
      }
    }

    if (foundBookId && foundSectionId) {
      setExpandedBooks(prev => ({ ...prev, [foundBookId!]: true }));
      setExpandedSections(prev => ({ ...prev, [foundSectionId!]: true }));
    }
  }, [lessonId, books]);

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/me/notebook?courseId=${courseId}`);
      const data = await res.json();
      if (data.success) {
        setNotes(data.flags);
      }
    } catch (e) {
      console.error("Lỗi tải ghi chú:", e);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (isDrawerOpen) {
      fetchNotes();
    }
  }, [isDrawerOpen]);

  // Lắng nghe sự kiện tự động mở/đóng Review Center trong kịch bản Tour
  useEffect(() => {
    const handleTourReviewCenter = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsDrawerOpen(customEvent.detail.open);
    };
    window.addEventListener("toeic-tour-review-center", handleTourReviewCenter);
    return () => window.removeEventListener("toeic-tour-review-center", handleTourReviewCenter);
  }, []);

  // Tự động mở rộng toàn bộ Sách và Chương trong Drawer khi danh sách ghi chú tải xong
  useEffect(() => {
    if (notes.length > 0) {
      const initialBooks: Record<string, boolean> = {};
      const initialSections: Record<string, boolean> = {};
      notes.forEach(note => {
        const bookTitle = note.lesson?.section?.book?.title || "Khác";
        const sectionTitle = note.lesson?.section?.title || "Chương khác";
        const sectionKey = `${bookTitle}-${sectionTitle}`;
        initialBooks[bookTitle] = true;
        initialSections[sectionKey] = true;
      });
      setExpandedDrawerBooks(initialBooks);
      setExpandedDrawerSections(initialSections);
    }
  }, [notes]);

  const toggleDrawerBook = (bookTitle: string) => {
    setExpandedDrawerBooks(prev => ({
      ...prev,
      [bookTitle]: prev[bookTitle] === false ? true : false
    }));
  };

  const toggleDrawerSection = (sectionKey: string) => {
    setExpandedDrawerSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey] === false ? true : false
    }));
  };

  const toggleAllDrawerItems = () => {
    const isAnyExpanded = Object.values(expandedDrawerBooks).some(v => v) || Object.values(expandedDrawerSections).some(v => v);
    if (isAnyExpanded) {
      setExpandedDrawerBooks({});
      setExpandedDrawerSections({});
    } else {
      const newBooks: Record<string, boolean> = {};
      const newSections: Record<string, boolean> = {};
      notes.forEach(note => {
        const bookTitle = note.lesson?.section?.book?.title || "Khác";
        const sectionTitle = note.lesson?.section?.title || "Chương khác";
        const sectionKey = `${bookTitle}-${sectionTitle}`;
        newBooks[bookTitle] = true;
        newSections[sectionKey] = true;
      });
      setExpandedDrawerBooks(newBooks);
      setExpandedDrawerSections(newSections);
    }
  };

  const toggleBook = (id: string) => {
    const book = books.find(b => b.id === id);
    const isExpanding = !expandedBooks[id];
    
    setExpandedBooks(prev => ({ ...prev, [id]: isExpanding }));
    
    // Nếu sách chỉ có 1 chương và đang mở ra, tự động mở chương đó luôn
    if (isExpanding && book && book.sections.length === 1) {
      const sectionId = book.sections[0].id;
      setExpandedSections(prev => ({ ...prev, [sectionId]: true }));
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleAll = () => {
    const isAnyExpanded = Object.values(expandedBooks).some(v => v) || Object.values(expandedSections).some(v => v);
    
    if (isAnyExpanded) {
      setExpandedBooks({});
      setExpandedSections({});
    } else {
      const newBooks: Record<string, boolean> = {};
      const newSections: Record<string, boolean> = {};
      books.forEach(b => {
        newBooks[b.id] = true;
        b.sections.forEach(s => newSections[s.id] = true);
      });
      setExpandedBooks(newBooks);
      setExpandedSections(newSections);
    }
  };

  const totalLessons = books.reduce((acc, book) => 
    acc + book.sections.reduce((sAcc, section) => sAcc + section.lessons.length, 0), 0
  );
  const completedLessons = Object.values(progressMap).filter(p => p.isCompleted).length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Xử lý lọc và sắp xếp ghi chú
  const filteredNotes = notes.filter(n => {
    const matchesSearch = `${n.flagNote || ''} ${n.question?.questionText || ''} ${n.lesson?.title || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = colorFilter ? n.flagColor === colorFilter : true;
    
    // Lọc theo loại
    let matchesType = true;
    if (typeFilter === 'NOTE') {
      matchesType = !!(n.flagNote && n.flagNote.trim() !== "");
    } else if (typeFilter === 'FLAG_ONLY') {
      matchesType = !(n.flagNote && n.flagNote.trim() !== "");
    }

    return matchesSearch && matchesColor && matchesType;
  }).sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Group ghi chú theo Sách và Chương
  const groupedNotes = filteredNotes.reduce((acc: any, note) => {
    const bookTitle = note.lesson?.section?.book?.title || "Khác";
    const sectionTitle = note.lesson?.section?.title || "Chương khác";
    
    if (!acc[bookTitle]) acc[bookTitle] = {};
    if (!acc[bookTitle][sectionTitle]) acc[bookTitle][sectionTitle] = [];
    
    acc[bookTitle][sectionTitle].push(note);
    return acc;
  }, {});

  const getFlagColorClass = (color: string) => {
    switch (color) {
      case 'RED': return 'bg-red-500';
      case 'PURPLE': return 'bg-purple-500';
      case 'BLUE': return 'bg-blue-500';
      case 'YELLOW': return 'bg-yellow-500';
      default: return 'bg-slate-300';
    }
  };

  const getFlagColorTextClass = (color: string) => {
    switch (color) {
      case 'RED': return 'text-red-500';
      case 'PURPLE': return 'text-purple-500';
      case 'BLUE': return 'text-blue-500';
      case 'YELLOW': return 'text-yellow-500';
      default: return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="w-80 border-r bg-white h-full p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/2"></div>
        <div className="space-y-2 pt-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-50 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      <div id="learn-course-sidebar" className="w-[340px] flex-shrink-0 border-r border-slate-100 bg-[#fbfcfd] flex flex-col h-full shadow-[1px_0_10px_rgba(0,0,0,0.02)] relative">
        {/* Target ảo luôn tồn tại trên DOM để Driver.js đục sáng khít khao bảng Review Center */}
        <div id="review-center-panel-target" className="absolute inset-0 pointer-events-none z-0" />
        
        {/* REVIEW CENTER DRAWER */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div 
              id="review-center-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 bg-white shadow-2xl flex flex-col border-r border-slate-100"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b bg-slate-50/50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                      <BookMarked size={16} />
                    </div>
                    Review Center
                  </h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={toggleAllDrawerItems}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
                      title="Thu/mở nhanh toàn bộ cờ & ghi chú"
                    >
                      <ChevronsUpDown size={16} />
                    </button>
                    <button 
                      onClick={() => setIsDrawerOpen(false)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Search & Sort & Filters */}
                <div className="space-y-3">
                  {/* Dòng 1: Ô Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Tìm ghi chú, câu hỏi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white rounded-xl text-xs border border-slate-100 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                  
                  {/* Dòng 2: Tabs chọn loại (Tất cả / Chỉ cờ / Có ghi chú) */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                    <button
                      onClick={() => setTypeFilter('ALL')}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                        typeFilter === 'ALL' 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setTypeFilter('FLAG_ONLY')}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                        typeFilter === 'FLAG_ONLY' 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Chỉ cờ
                    </button>
                    <button
                      onClick={() => setTypeFilter('NOTE')}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                        typeFilter === 'NOTE' 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Có ghi chú
                    </button>
                  </div>

                  {/* Dòng 3: Sắp xếp & Lọc theo màu cờ */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <ArrowUpDown size={12} /> {sortOrder === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
                    </button>
                    <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-100 shrink-0">
                      {['RED', 'PURPLE', 'BLUE', 'YELLOW'].map(color => (
                        <button
                          key={color}
                          onClick={() => setColorFilter(colorFilter === color ? null : color)}
                          className={`w-5 h-5 rounded-md transition-all ${getFlagColorClass(color)} ${colorFilter === color ? "ring-2 ring-offset-1 ring-slate-400 scale-110" : "opacity-40 hover:opacity-100"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24 bg-slate-50/30">
                {loadingNotes ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu...</span>
                  </div>
                ) : Object.keys(groupedNotes).length > 0 ? (
                  Object.entries(groupedNotes).map(([bookTitle, sections]: [string, any]) => {
                    // Thống kê tổng số cờ và ghi chú của Cuốn sách này
                    let bookTotalFlags = 0;
                    let bookTotalNotes = 0;
                    Object.values(sections).forEach((notesList: any) => {
                      bookTotalFlags += notesList.length;
                      bookTotalNotes += notesList.filter((n: any) => n.flagNote && n.flagNote.trim() !== "").length;
                    });

                    const isBookExpanded = expandedDrawerBooks[bookTitle] !== false; // Mặc định mở rộng

                    return (
                      <div key={bookTitle} className="bg-white rounded-3xl p-3.5 shadow-sm border border-slate-100 mb-4 transition-all duration-300">
                        {/* Book Header Toggle */}
                        <div 
                          onClick={() => toggleDrawerBook(bookTitle)}
                          className="flex items-center justify-between p-2 px-3 cursor-pointer select-none hover:bg-slate-50 rounded-2xl transition-all duration-200 group"
                        >
                          <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.12em] line-clamp-1 min-w-0 pr-2">{bookTitle}</h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/20">
                              {bookTotalFlags} cờ • {bookTotalNotes} ghi chú
                            </span>
                            {isBookExpanded ? (
                              <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            ) : (
                              <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            )}
                          </div>
                        </div>

                        {/* Sections list inside Book */}
                        {isBookExpanded && (
                          <div className="space-y-5 mt-4 ml-1 animate-in fade-in duration-200">
                            {Object.entries(sections).map(([sectionTitle, sectionNotes]: [string, any]) => {
                              const sectionKey = `${bookTitle}-${sectionTitle}`;
                              const isSectionExpanded = expandedDrawerSections[sectionKey] !== false; // Mặc định mở rộng

                              const sectionTotalFlags = sectionNotes.length;
                              const sectionTotalNotes = sectionNotes.filter((n: any) => n.flagNote && n.flagNote.trim() !== "").length;

                              return (
                                <div key={sectionTitle} className="space-y-3">
                                  {/* Section Header Toggle */}
                                  <div 
                                    onClick={() => toggleDrawerSection(sectionKey)}
                                    className="flex items-center justify-between p-1.5 px-2.5 cursor-pointer select-none hover:bg-slate-50/70 rounded-xl transition-all duration-200 group/sec"
                                  >
                                    <div className="flex items-center gap-2 opacity-80 min-w-0 pr-2">
                                      <Layers size={11} className="text-slate-400 shrink-0" />
                                      <span className="text-[11px] font-bold text-slate-500 truncate">{sectionTitle}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100/60 px-1.5 py-0.5 rounded-md">
                                        {sectionTotalFlags} cờ • {sectionTotalNotes} ghi chú
                                      </span>
                                      {isSectionExpanded ? (
                                        <ChevronDown size={12} className="text-slate-400 group-hover/sec:text-indigo-500 transition-colors" />
                                      ) : (
                                        <ChevronRight size={12} className="text-slate-400 group-hover/sec:text-indigo-500 transition-colors" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Section Notes Items */}
                                  {isSectionExpanded && (
                                    <div className="space-y-2 pl-2 border-l border-slate-100 animate-in fade-in duration-200">
                                      {sectionNotes.map((note: any) => (
                                        <div 
                                          key={note.id}
                                          onClick={() => {
                                            router.push(`/learn/${courseId}/lesson/${note.lesson?.id}?q=${note.question?.id}`);
                                          }}
                                          className="bg-slate-50/30 border border-slate-100/60 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-100/40 hover:bg-white transition-all group cursor-pointer active:scale-[0.98]"
                                        >
                                          <div className="flex items-start justify-between mb-1.5">
                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                              <div className={`w-1.5 h-3.5 rounded-full ${getFlagColorClass(note.flagColor)} shrink-0`} />
                                              <span className="text-[11px] font-black text-slate-800 uppercase shrink-0">Câu {note.question?.questionNo}</span>
                                              
                                              {/* Icon cờ màu tương ứng */}
                                              <Flag size={10} className={`${getFlagColorTextClass(note.flagColor)} shrink-0`} fill="currentColor" />
                                              
                                              {/* Icon cây bút (nếu có ghi chú) */}
                                              {note.flagNote && note.flagNote.trim() !== "" && (
                                                <PenLine size={10} className="text-indigo-500 shrink-0" />
                                              )}
                                            </div>
                                            <ExternalLink size={11} className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                                          </div>
                                          
                                          {note.question?.questionText && (
                                            <p className="text-[10px] text-slate-400 line-clamp-1 italic mb-2 leading-relaxed">
                                              "{note.question.questionText.replace(/^\d+[\.\s]*/, '')}"
                                            </p>
                                          )}
                                          
                                          {note.flagNote && note.flagNote.trim() !== "" ? (
                                            <div className="bg-white/80 p-3 rounded-xl border border-slate-100/60">
                                              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                                                {note.flagNote}
                                              </p>
                                            </div>
                                          ) : null}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 px-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <BookMarked size={32} />
                    </div>
                    <h3 className="text-[13px] font-black text-slate-600 mb-1">Trống trải quá...</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Hãy gắn cờ và viết ghi chú cho những câu khó để ôn tập tại đây nhé!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Header Content */}
        <div className="p-7 bg-white shrink-0 pb-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Layout size={16} />
              </div>
              Nội dung khóa học
            </h2>
            <div className="flex items-center gap-2">
              <button 
                id="review-center-toggle-btn"
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all active:scale-95 shadow-sm shadow-indigo-100"
                title="Xem các câu gắn cờ/ghi chú trong khoá"
              >
                <BookMarked size={16} />
              </button>
              <button 
                onClick={handleToggleAll}
                className="p-1.5 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all active:scale-95"
                title="Thu/mở toàn danh sách"
              >
                <ChevronsUpDown size={16} />
              </button>
            </div>
          </div>
          
          <div className="bg-indigo-50/30 p-3.5 px-4 rounded-2xl border border-indigo-100/30 mb-6 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2.5 relative z-10">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1 h-3 bg-indigo-400 rounded-full" />
                Tiến độ học tập
              </span>
              <span className="text-[10px] font-black text-indigo-600">{progressPercentage}%</span>
            </div>
            
            <div className="bg-white/60 h-1.5 rounded-full overflow-hidden relative z-10 p-0.5 border border-indigo-100/20">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.2)]" style={{ width: `${progressPercentage}%` }} />
            </div>
            
            <div className="text-[8px] font-bold text-indigo-400/70 mt-2.5 flex items-center gap-1.5 relative z-10 uppercase tracking-tighter">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              {isEnrolled ? "Chế độ học chính thức" : "Hội viên Pro"}
            </div>
          </div>
        </div>

        {/* Syllabus Tree */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 px-3">
          {books.map((book, bIdx) => {
            const isBookExpanded = expandedBooks[book.id];
            const freeCount = book.sections.reduce((acc, section) => 
              acc + section.lessons.filter(l => l.isPreview).length, 0
            );

            return (
              <div key={book.id} className="mb-4">
                {/* LEVEL 1: BOOK */}
                <button 
                  onClick={() => toggleBook(book.id)}
                  className={`w-full flex items-center justify-between p-4 px-5 rounded-2xl transition-all duration-300 border mb-2 ${
                    isBookExpanded ? "bg-white border-indigo-100 shadow-md ring-4 ring-indigo-50/30" : "bg-white border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      isBookExpanded ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 rotate-[360deg]" : "bg-indigo-50 text-indigo-400"
                    }`}>
                      <BookOpen size={20} className={isBookExpanded ? "animate-pulse" : ""} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Sách {bIdx + 1}</p>
                        {!isEnrolled && freeCount > 0 && (
                          <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm animate-pulse shrink-0">
                            Free {freeCount} bài
                          </span>
                        )}
                      </div>
                      <h3 className={`text-[14px] font-black uppercase tracking-tight leading-tight line-clamp-1 transition-colors ${
                        isBookExpanded ? "text-slate-900" : "text-slate-600"
                      }`}>
                        {book.title}
                      </h3>
                    </div>
                  </div>
                  {isBookExpanded ? (
                    <ChevronDown size={18} className="text-indigo-600" />
                  ) : (
                    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>

                {/* LEVEL 2: SECTIONS (CHAPTERS) */}
                {isBookExpanded && (
                  <div className="space-y-2 mt-2 ml-2 animate-in slide-in-from-top-4 duration-300">
                    {book.sections.map((section, sIdx) => {
                      const isExpanded = expandedSections[section.id];
                      return (
                        <div key={section.id} className="mb-1">
                          <button 
                            onClick={() => toggleSection(section.id)}
                            className={`w-full flex items-center justify-between p-3.5 px-4 rounded-xl transition-all duration-300 group ${
                              isExpanded ? "bg-slate-800/70 shadow-lg" : "bg-slate-50 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black transition-all duration-300 ${
                                isExpanded ? "bg-slate-600/50 text-white shadow-md shadow-slate-100" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                              }`}>
                                {sIdx + 1}
                              </span>
                              <h4 className={`text-[12px] font-black uppercase tracking-tight text-left leading-tight line-clamp-1 transition-colors ${
                                isExpanded ? "text-white" : "text-slate-500"
                              }`}>
                                {section.title}
                              </h4>
                            </div>
                            {isExpanded ? (
                              <ChevronDown size={14} className="text-slate-400" />
                            ) : (
                              <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                            )}
                          </button>

                          {/* LEVEL 3: LESSONS */}
                          {isExpanded && (
                            <div className="mt-1 ml-3 border-l-2 border-indigo-200/50 space-y-1 py-1 animate-in slide-in-from-left-2 duration-300">
                              {section.lessons.map((lesson: any) => {
                                const isActive = lesson.id === lessonId;
                                const isLocked = !isEnrolled && !lesson.isPreview;

                                return (
                                  <div 
                                    key={lesson.id}
                                    onClick={() => {
                                      if (isLocked) {
                                        setIsAuthModalOpen(true);
                                      } else {
                                        router.push(`/learn/${courseId}/lesson/${lesson.id}`);
                                      }
                                    }}
                                    className={`group/item relative flex items-center gap-4 py-3 px-4 ml-2 rounded-xl transition-all duration-200 cursor-pointer ${
                                      isActive 
                                        ? "bg-indigo-50/80 text-indigo-700 shadow-sm" 
                                        : "text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                                    } ${isLocked ? "opacity-60" : ""}`}
                                  >
                                    {isActive && (
                                      <div className="absolute left-0 w-1 h-4 bg-indigo-600 rounded-full -translate-x-[15px]" />
                                    )}
                                    
                                    <div className="shrink-0">
                                      {isLocked ? (
                                        <Lock size={12} className="text-slate-300" />
                                      ) : isActive ? (
                                        <div className="w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
                                           <PlayCircle size={12} className="text-white" />
                                        </div>
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 group-hover/item:border-slate-300 transition-colors" />
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <p className={`text-[11px] font-semibold leading-snug truncate ${
                                          isActive ? "text-indigo-800 font-bold" : isLocked ? "text-slate-300" : "text-slate-600"
                                        }`}>
                                          {lesson.title}
                                        </p>
                                        {(lesson.contentType === "VIDEO" || !!lesson.videoUrl || (lesson.videoExplanation && (Array.isArray(lesson.videoExplanation) ? lesson.videoExplanation.length > 0 : Object.keys(lesson.videoExplanation as object).length > 0))) && (
                                          <span 
                                            className="cursor-help text-xs shrink-0 select-none" 
                                            title="Bài học có video bài giảng/chữa bài"
                                          >
                                            🎬
                                          </span>
                                        )}
                                        {!isEnrolled && lesson.isPreview && (
                                          <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 shadow-sm border border-emerald-500/10">
                                            Free
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 scale-75 origin-right">
                                      {progressMap[lesson.id]?.isCompleted && (
                                         <CheckCircle2 size={14} className="text-emerald-500" />
                                      )}
                                      {progressMap[lesson.id]?.totalCount > 0 && !progressMap[lesson.id]?.isCompleted && (
                                         <div className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md">
                                            <span className="text-indigo-500">{progressMap[lesson.id].correctCount}</span>
                                            <span className="mx-0.5 text-slate-200">/</span>
                                            {progressMap[lesson.id].totalCount}
                                         </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        `}</style>
      </div>
    </>
  );
}
