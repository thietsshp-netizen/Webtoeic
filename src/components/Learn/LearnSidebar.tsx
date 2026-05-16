"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  PlayCircle, 
  BookOpen, 
  Layout as LayoutIcon, 
  CheckCircle,
  Menu,
  X,
  BookMarked,
  Search,
  Flag,
  PenLine,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Lesson {
  id: string;
  title: string;
  contentType: string;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface LearnSidebarProps {
  courseId: string;
  courseTitle: string;
  sections: Section[];
}

export default function LearnSidebar({ courseId, courseTitle, sections }: LearnSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'syllabus' | 'notebook'>('syllabus');
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Kiểm tra bài học đang active để highlight
  const isActive = (lessonId: string) => pathname.includes(lessonId);

  // Load notes when switching to notebook tab
  useEffect(() => {
    if (activeTab === 'notebook') {
      fetchNotes();
    }
  }, [activeTab]);

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

  const filteredNotes = notes.filter(n => {
    const content = `${n.flagNote || ''} ${n.question?.questionText || ''} ${n.lesson?.title || ''}`.toLowerCase();
    return content.includes(searchQuery.toLowerCase());
  });

  const getFlagColorClass = (color: string) => {
    switch (color) {
      case 'RED': return 'bg-red-500';
      case 'PURPLE': return 'bg-purple-500';
      case 'BLUE': return 'bg-blue-500';
      case 'YELLOW': return 'bg-yellow-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <>
      {/* Nút Toggle Mobile & Desktop (Khi đóng) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-20 z-50 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white transition-all text-slate-500"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar chính */}
      <aside className={`transition-all duration-500 ease-in-out border-r border-slate-100 bg-white shadow-2xl flex flex-col z-40 ${isOpen ? "w-[340px]" : "w-0 overflow-hidden border-none"}`}>
        {/* Header Sidebar */}
        <div className="p-6 border-b bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between mb-4">
             <Link
               href={`/courses/${courseId}`}
               className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest group"
             >
               <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
               Quay về lộ trình
             </Link>
             <button 
               onClick={() => setIsOpen(false)}
               className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
             >
               <X size={18} />
             </button>
          </div>
          <h2 className="font-black text-xl text-slate-800 leading-tight line-clamp-2 mb-4">{courseTitle}</h2>
          
          {/* Tabs Switcher */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl relative">
            <button 
              onClick={() => setActiveTab('syllabus')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all z-10 ${activeTab === 'syllabus' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutIcon size={14} /> Danh mục
            </button>
            <button 
              onClick={() => setActiveTab('notebook')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all z-10 ${activeTab === 'notebook' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <BookMarked size={14} /> Sổ tay
            </button>
            <motion.div 
              layoutId="activeTab"
              className="absolute inset-y-1 bg-white rounded-lg shadow-sm w-[calc(50%-4px)]"
              animate={{ x: activeTab === 'syllabus' ? 0 : '100%' }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'syllabus' ? (
              <motion.div 
                key="syllabus"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-y-auto p-4 space-y-8 pb-20 scrollbar-hide"
              >
                {sections.map((section, idx) => (
                  <div key={section.id} className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <span className="text-[10px] font-black bg-blue-100 text-blue-700 w-6 h-6 rounded-lg flex items-center justify-center shadow-sm">
                        {idx + 1}
                      </span>
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        {section.title}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      {section.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/learn/${courseId}/lesson/${lesson.id}`}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm group ${
                            isActive(lesson.id)
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50 scale-[1.02]"
                            : "text-slate-600 hover:bg-slate-50 hover:shadow-md border border-white"
                          }`}
                        >
                          <div className={`transition-colors ${isActive(lesson.id) ? "text-blue-200" : "text-slate-400 group-hover:text-blue-500"}`}>
                            {lesson.contentType === "VIDEO" ? <PlayCircle size={18} /> : 
                             lesson.contentType === "TEXT" ? <BookOpen size={18} /> : 
                             <LayoutIcon size={18} />}
                          </div>
                          <span className="flex-1 line-clamp-2 leading-snug">{lesson.title}</span>
                          <CheckCircle 
                            size={18} 
                            className={isActive(lesson.id) ? "text-blue-300" : "text-slate-200 group-hover:text-blue-200"} 
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="notebook"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col overflow-hidden"
              >
                {/* Search Header */}
                <div className="p-4 border-b shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm ghi chú..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 scrollbar-hide">
                  {loadingNotes ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold uppercase tracking-widest">Đang tìm ghi chép...</span>
                    </div>
                  ) : filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => (
                      <div 
                        key={note.id}
                        onClick={() => router.push(`/learn/${courseId}/lesson/${note.lesson?.id}?q=${note.question?.id}`)}
                        className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-4 rounded-full ${getFlagColorClass(note.flagColor)}`} />
                            <span className="text-[11px] font-black text-slate-800 uppercase">Câu {note.question?.questionNo}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 group-hover:text-blue-500 transition-colors flex items-center gap-1">
                            {note.lesson?.title} <ExternalLink size={10} />
                          </span>
                        </div>
                        
                        {note.question?.questionText && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 italic mb-2">
                            "{note.question.questionText.replace(/^\d+[\.\s]*/, '')}"
                          </p>
                        )}
                        
                        {note.flagNote ? (
                          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/30">
                            <p className="text-xs font-bold text-slate-700 leading-relaxed">
                              {note.flagNote}
                            </p>
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-slate-300 italic">Đã gắn cờ (Chưa có ghi chú)</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 px-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                        <BookMarked size={32} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-600 mb-1">Không tìm thấy ghi chú nào</h3>
                      <p className="text-xs text-slate-400">Hãy gắn cờ và viết ghi chú cho các câu hỏi khó để ôn tập lại sau nhé!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </>
  );
}
