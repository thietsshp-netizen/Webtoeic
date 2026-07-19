"use client";

import { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCenter, 
  closestCorners,
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, ChevronRight, ChevronDown, Video, FileText, Layout, ListTree, Loader2, Trash2, CheckCircle2, Eye, EyeOff, Pencil, Check, Star, ChevronsUp, ChevronsUpDown, BookOpen, Layers } from "lucide-react";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { showToast } from "@/components/UI/Toast";

interface Lesson {
  id: string;
  title: string;
  contentType: string;
  order: number;
  isPreview?: boolean;
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

interface AdminSyllabusSidebarProps {
  courseId: string;
  onSelectLesson: (lessonId: string) => void;
  selectedLessonId?: string;
  draftLessons?: Record<string, any>;
  draftSections?: Record<string, any>;
  draftBooks?: Record<string, any>;
  onBookDraftUpdate?: (id: string, data: any) => void;
  onSectionDraftUpdate?: (id: string, data: any) => void;
  onLessonDraftUpdate?: (id: string, data: any) => void;
  onDeletionsUpdate?: (type: 'books' | 'sections' | 'lessons', id: string) => void;
  refreshTrigger?: number;
}

export default function AdminSyllabusSidebar({ 
  courseId, 
  onSelectLesson,
  selectedLessonId,
  draftLessons = {},
  draftSections = {},
  draftBooks = {},
  onBookDraftUpdate,
  onSectionDraftUpdate,
  onLessonDraftUpdate,
  onDeletionsUpdate,
  refreshTrigger = 0
}: AdminSyllabusSidebarProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    isPrompt?: boolean;
    isAlert?: boolean;
    onConfirm: (val?: string) => void;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!courseId || courseId === "undefined") {
      console.warn("DEBUG: Waiting for courseId...");
      return;
    }
    
    async function fetchSyllabus() {
      const syllabusUrl = `/api/courses/${courseId}/syllabus`;
      console.log('Fetching Syllabus from:', syllabusUrl);
      
      try {
        const res = await fetch(syllabusUrl, {
          headers: { "Accept": "application/json" }
        });
        
        const responseText = await res.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseErr) {
          console.error("DEBUG: Failed to parse Syllabus JSON", responseText);
          throw new Error(`Syllabus API returned HTML: ${responseText.substring(0, 50)}...`);
        }

        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setBooks(data.books || []);
      } catch (err: any) {
        console.error("DEBUG: fetchSyllabus failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSyllabus();
  }, [courseId, refreshTrigger]);

  const handleAddBook = () => {
    const tempId = `temp-book-${Date.now()}`;
    const title = "Sách mới";
    setBooks(prev => [
      ...prev,
      { id: tempId, title, order: prev.length, sections: [] }
    ]);
    onBookDraftUpdate?.(tempId, { title, order: books.length });
    setEditingId(tempId);
  };

  const handleAddSection = (bookId: string) => {
    const tempId = `temp-sec-${Date.now()}`;
    const title = "Chương mới";
    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        return {
          ...b,
          sections: [...b.sections, { id: tempId, title, order: b.sections.length, lessons: [] }]
        };
      }
      return b;
    }));
    
    const targetBook = books.find(b => b.id === bookId);
    const order = targetBook ? targetBook.sections.length : 0;
    onSectionDraftUpdate?.(tempId, { title, order, bookId });
    
    if (!expandedIds.includes(bookId)) {
      setExpandedIds(prev => [...prev, bookId]);
    }
    setEditingId(tempId);
  };

  const handleAddLesson = (sectionId: string) => {
    const targetSection = books.flatMap(b => b.sections).find(s => s.id === sectionId);
    const order = targetSection ? targetSection.lessons.length : 0;
    const tempId = `temp_les-${Date.now()}`;
    const title = "Bài học mới";

    setBooks(prev => prev.map(b => ({
      ...b,
      sections: b.sections.map(s => {
        if (s.id === sectionId) {
          const newLesson: Lesson = { id: tempId, title, contentType: "TEXT", order };
          return { ...s, lessons: [...s.lessons, newLesson] };
        }
        return s;
      })
    })));
    
    onLessonDraftUpdate?.(tempId, { sectionId, title, contentType: "TEXT", order });
    
    if (!expandedIds.includes(sectionId)) {
      setExpandedIds(prev => [...prev, sectionId]);
    }
    setEditingId(tempId);
  };

  const handleTogglePreview = (lessonId: string, currentStatus: boolean | undefined) => {
    const newStatus = !currentStatus;
    
    setBooks(prev => prev.map(book => ({
      ...book,
      sections: book.sections.map(s => ({
        ...s,
        lessons: s.lessons.map(l => l.id === lessonId ? { ...l, isPreview: newStatus } : l)
      }))
    })));

    onLessonDraftUpdate?.(lessonId, { isPreview: newStatus });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    setConfirmConfig({
      isOpen: true,
      title: "Xác nhận xóa tạm thời",
      message: `Bạn muốn đưa ${selectedIds.length} mục vào danh sách chờ xóa? (Sẽ chỉ xóa thực sự khi bấm Lưu Tất Cả)`,
      onConfirm: () => {
        setConfirmConfig(null);
        
        selectedIds.forEach(id => {
          if (id.startsWith("temp")) return;
          
          const isBook = books.some(b => b.id === id);
          if (isBook) return onDeletionsUpdate?.('books', id);
          
          const isSection = books.some(b => b.sections.some(s => s.id === id));
          if (isSection) return onDeletionsUpdate?.('sections', id);
          
          onDeletionsUpdate?.('lessons', id);
        });

        const bookIdsToDelete = books.filter(b => selectedIds.includes(b.id)).map(b => b.id);
        const sectionIdsToDelete: string[] = [];
        books.forEach(b => b.sections.forEach(s => { if (selectedIds.includes(s.id)) sectionIdsToDelete.push(s.id); }));
        const lessonIdsToDelete = selectedIds.filter(id => !bookIdsToDelete.includes(id) && !sectionIdsToDelete.includes(id));

        setBooks(prev => prev
          .filter(b => !bookIdsToDelete.includes(b.id))
          .map(b => ({
            ...b,
            sections: b.sections
              .filter(s => !sectionIdsToDelete.includes(s.id))
              .map(s => ({
                ...s,
                lessons: s.lessons.filter(l => !lessonIdsToDelete.includes(l.id))
              }))
          }))
        );
        setSelectedIds([]);
        showToast("Đã đưa vào danh sách chờ xóa!");
      }
    });
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let activeLesson = null;
    let activeSectionId = null;
    for (const b of books) {
      for (const s of b.sections) {
        const found = s.lessons.find(l => l.id === activeId);
        if (found) {
          activeLesson = found;
          activeSectionId = s.id;
          break;
        }
      }
      if (activeLesson) break;
    }

    if (activeLesson && activeSectionId) {
      let overSectionId = null;
      for (const b of books) {
        if (b.sections.some(s => s.id === overId)) {
          overSectionId = overId;
          break;
        }
        const foundS = b.sections.find(s => s.lessons.some(l => l.id === overId));
        if (foundS) {
          overSectionId = foundS.id;
          break;
        }
      }

      if (overSectionId && activeSectionId !== overSectionId) {
        setBooks(prev => prev.map(book => ({
          ...book,
          sections: book.sections.map(section => {
            if (section.id === activeSectionId) {
              return { ...section, lessons: section.lessons.filter(l => l.id !== activeId) };
            }
            if (section.id === overSectionId) {
              const overIdx = section.lessons.findIndex(l => l.id === overId);
              const newLessons = [...section.lessons];
              if (overIdx === -1) newLessons.push(activeLesson!);
              else newLessons.splice(overIdx, 0, activeLesson!);
              return { ...section, lessons: newLessons };
            }
            return section;
          })
        })));
      }
      return;
    }

    let activeSection = null;
    let activeBookId = null;
    for (const b of books) {
      const found = b.sections.find(s => s.id === activeId);
      if (found) {
        activeSection = found;
        activeBookId = b.id;
        break;
      }
    }

    if (activeSection && activeBookId) {
      let overBookId = null;
      if (books.some(b => b.id === overId)) {
        overBookId = overId;
      } else {
        const foundB = books.find(b => b.sections.some(s => s.id === overId));
        if (foundB) overBookId = foundB.id;
      }

      if (overBookId && activeBookId !== overBookId) {
        setBooks(prev => {
          const newActiveSections = prev.find(b => b.id === activeBookId)!.sections.filter(s => s.id !== activeId);
          const overBook = prev.find(b => b.id === overBookId)!;
          const overIdx = overBook.sections.findIndex(s => s.id === overId);
          
          let newOverSections = [...overBook.sections];
          if (overIdx === -1) newOverSections.push(activeSection!);
          else newOverSections.splice(overIdx, 0, activeSection!);

          return prev.map(b => {
            if (b.id === activeBookId) return { ...b, sections: newActiveSections };
            if (b.id === overBookId) return { ...b, sections: newOverSections };
            return b;
          });
        });
      }
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const isActiveBook = books.some(b => b.id === activeId);
    if (isActiveBook) {
      if (activeId !== overId) {
        const oldIdx = books.findIndex(b => b.id === activeId);
        const newIdx = books.findIndex(b => b.id === overId);
        if (newIdx !== -1) {
          const newBooks = arrayMove(books, oldIdx, newIdx);
          setBooks(newBooks);
          newBooks.forEach((b, idx) => {
            onBookDraftUpdate?.(b.id, { order: idx });
          });
        }
      }
      return;
    }

    let activeSection = null;
    let sourceBookId = null;
    for (const b of books) {
      const s = b.sections.find(sec => sec.id === activeId);
      if (s) {
        activeSection = s;
        sourceBookId = b.id;
        break;
      }
    }

    if (activeSection && sourceBookId) {
      const overBook = books.find(b => 
        b.id === overId || 
        b.sections.some(s => s.id === overId || s.lessons.some(l => l.id === overId))
      );
      if (!overBook) return;
      const targetBookId = overBook.id;

      if (activeId !== overId || sourceBookId !== targetBookId) {
        const sourceBook = books.find(b => b.id === sourceBookId);
        const targetBook = books.find(b => b.id === targetBookId);
        if (!sourceBook || !targetBook) return;

        const oldIdx = sourceBook.sections.findIndex(s => s.id === activeId);
        const newIdx = targetBook.sections.findIndex(s => s.id === overId);

        if (sourceBookId === targetBookId) {
          const newSections = arrayMove(sourceBook.sections, oldIdx, newIdx === -1 ? 0 : newIdx);
          setBooks(prev => prev.map(b => b.id === sourceBookId ? { ...b, sections: newSections } : b));
          newSections.forEach((s, idx) => onSectionDraftUpdate?.(s.id, { order: idx, bookId: sourceBookId }));
        } else {
          const newSourceSections = sourceBook.sections.filter(s => s.id !== activeId);
          const newTargetSections = [...targetBook.sections];
          if (newIdx === -1) newTargetSections.push(activeSection!);
          else newTargetSections.splice(newIdx, 0, activeSection!);

          setBooks(prev => prev.map(b => {
            if (b.id === sourceBookId) return { ...b, sections: newSourceSections };
            if (b.id === targetBookId) return { ...b, sections: newTargetSections };
            return b;
          }));

          newSourceSections.forEach((s, idx) => onSectionDraftUpdate?.(s.id, { order: idx, bookId: sourceBookId }));
          newTargetSections.forEach((s, idx) => onSectionDraftUpdate?.(s.id, { order: idx, bookId: targetBookId }));
        }
      }
      return;
    }

    let activeLesson = null;
    let sourceSectionId = null;
    for (const b of books) {
      for (const s of b.sections) {
        const l = s.lessons.find(les => les.id === activeId);
        if (l) {
          activeLesson = l;
          sourceSectionId = s.id;
          break;
        }
      }
      if (activeLesson) break;
    }

    if (activeLesson && sourceSectionId) {
      const overSection = books.flatMap(b => b.sections).find(s => s.id === overId || s.lessons.some(l => l.id === overId));
      if (!overSection) return;
      const targetSectionId = overSection.id;

      if (activeId !== overId || sourceSectionId !== targetSectionId) {
        let srcSec: any = null;
        let tgtSec: any = null;
        books.forEach(b => {
          b.sections.forEach(s => {
            if (s.id === sourceSectionId) srcSec = s;
            if (s.id === targetSectionId) tgtSec = s;
          });
        });

        if (!srcSec || !tgtSec) return;

        const oldIdx = srcSec.lessons.findIndex((l: any) => l.id === activeId);
        const newIdx = tgtSec.lessons.findIndex((l: any) => l.id === overId);

        if (sourceSectionId === targetSectionId) {
          const reordered = arrayMove(srcSec.lessons, oldIdx, newIdx === -1 ? 0 : newIdx) as Lesson[];
          setBooks(prev => prev.map(b => ({
            ...b,
            sections: b.sections.map(s => s.id === targetSectionId ? { ...s, lessons: reordered } : s)
          })));
          reordered.forEach((l: any, idx) => onLessonDraftUpdate?.(l.id, { order: idx, sectionId: targetSectionId }));
        } else {
          const newSrcLessons = srcSec.lessons.filter((l: any) => l.id !== activeId) as Lesson[];
          const newTgtLessons = [...tgtSec.lessons] as Lesson[];
          if (newIdx === -1) newTgtLessons.push(activeLesson!);
          else newTgtLessons.splice(newIdx, 0, activeLesson!);

          setBooks(prev => prev.map(b => ({
            ...b,
            sections: b.sections.map(s => {
              if (s.id === sourceSectionId) return { ...s, lessons: newSrcLessons };
              if (s.id === targetSectionId) return { ...s, lessons: newTgtLessons };
              return s;
            })
          })));

          newSrcLessons.forEach((l: any, idx: number) => onLessonDraftUpdate?.(l.id, { order: idx, sectionId: sourceSectionId }));
          newTgtLessons.forEach((l: any, idx: number) => onLessonDraftUpdate?.(l.id, { order: idx, sectionId: targetSectionId }));
        }
      }
    }
  };

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="animate-spin" size={32} />
      <span className="italic font-medium">Đang nạp cấu trúc...</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full shadow-inner">
      <div className="p-5 bg-white border-b flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2.5 font-black text-slate-800 uppercase text-[11px] tracking-widest">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-100">
            <ListTree size={16} className="text-white" />
          </div>
          Syllabus Tree
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (expandedIds.length > 0) {
                setExpandedIds([]);
              } else {
                // Mở rộng tất cả sách và chương
                const allIds: string[] = [];
                books.forEach(b => {
                  allIds.push(b.id);
                  b.sections.forEach(s => allIds.push(s.id));
                });
                setExpandedIds(allIds);
              }
            }}
            className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
            title="Thu/mở toàn danh sách"
          >
            <ChevronsUpDown size={18} />
          </button>
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
              title="Xóa mục đã chọn"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button 
            onClick={handleAddBook}
            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all hover:scale-110 active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide pb-24">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <SortableContext items={books.map(b => b.id).filter(id => !!id)} strategy={verticalListSortingStrategy}>
            {books.map((book, bIdx) => (
              <SortableBook 
                key={book.id}
                book={book}
                index={bIdx}
                onAddSection={() => handleAddSection(book.id)}
                onAddLesson={handleAddLesson}
                selectedLessonId={selectedLessonId}
                onSelectLesson={onSelectLesson}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                onTogglePreview={handleTogglePreview}
                draftBook={draftBooks?.[book.id]}
                draftSections={draftSections}
                draftLessons={draftLessons}
                onBookDraftUpdate={onBookDraftUpdate}
                onSectionDraftUpdate={onSectionDraftUpdate}
                onLessonDraftUpdate={onLessonDraftUpdate}
                onDeletionsUpdate={onDeletionsUpdate}
                isEditing={editingId === book.id}
                onEditingChange={(val: boolean) => setEditingId(val ? book.id : null)}
                isExpanded={expandedIds.includes(book.id)}
                onToggleExpand={() => {
                const isExpanding = !expandedIds.includes(book.id);
                if (isExpanding) {
                  const newIds = [...expandedIds, book.id];
                  // Nếu sách chỉ có 1 chương, tự động mở chương đó luôn
                  if (book.sections.length === 1) {
                    const sectionId = book.sections[0].id;
                    if (!newIds.includes(sectionId)) {
                      newIds.push(sectionId);
                    }
                  }
                  setExpandedIds(newIds);
                } else {
                  setExpandedIds(prev => prev.filter(id => id !== book.id));
                }
              }}
                editingId={editingId}
                setEditingId={setEditingId}
                expandedIds={expandedIds}
                setExpandedIds={setExpandedIds}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          isPrompt={confirmConfig.isPrompt}
          isAlert={confirmConfig.isAlert}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}

function SortableBook({ 
  book, index, onAddSection, onAddLesson, selectedLessonId, onSelectLesson, 
  selectedIds, toggleSelect, onTogglePreview, draftBook, draftSections, 
  draftLessons, onBookDraftUpdate, onSectionDraftUpdate, onLessonDraftUpdate,
  isEditing: controlledIsEditing, onEditingChange, isExpanded, onToggleExpand,
  editingId, setEditingId, expandedIds, setExpandedIds
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: book.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 40 : 1 };
  const [localIsEditing, setLocalIsEditing] = useState(false);

  const isEditing = controlledIsEditing || localIsEditing;
  const setIsEditing = (val: boolean) => {
    setLocalIsEditing(val);
    onEditingChange?.(val);
  };

  const displayTitle = draftBook?.title || book.title;

  return (
    <div ref={setNodeRef} style={style} className={`mb-4 last:mb-20 transition-all ${isDragging ? "opacity-50" : ""}`}>
      <div className={`bg-white border-2 transition-all duration-300 rounded-3xl p-5 ${isExpanded ? "border-indigo-100 shadow-lg shadow-indigo-50" : "border-slate-100 shadow-sm hover:shadow-md"}`}>
        <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-indigo-500 transition-colors">
            <GripVertical size={16} />
          </div>
          <button 
            onClick={onToggleExpand}
            className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            isDragging ? "bg-indigo-600 text-white" : "bg-indigo-600 text-white shadow-md shadow-indigo-100"
          }`}>
             <BookOpen size={16} />
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input 
                autoFocus
                className="text-lg font-black text-slate-800 uppercase tracking-tight bg-slate-50 border border-indigo-400 rounded-xl px-3 py-1 w-full outline-none"
                value={displayTitle}
                onChange={(e) => onBookDraftUpdate(book.id, { title: e.target.value })}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              />
              <button onClick={() => setIsEditing(false)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Check size={18} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Sách {index + 1}</span>
                 <h3 className="text-base font-black text-slate-800 uppercase tracking-tight truncate flex items-center gap-2">
                   {displayTitle}
                   {draftBook && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse" title="Thay đổi chưa lưu" />}
                 </h3>
              </div>
              <button 
                onClick={() => setIsEditing(true)} 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-indigo-600"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-2">
             <button 
              onClick={() => toggleSelect(book.id)}
              className={`p-2 rounded-xl border transition-all ${
                selectedIds.includes(book.id)
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-white border-slate-200 text-slate-200 hover:text-slate-400"
              }`}
            >
              <CheckCircle2 size={18} />
            </button>
            <button 
              onClick={onAddSection}
              className="p-2 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
            >
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-2 pt-1.5">
          <SortableContext items={book.sections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
            {book.sections.map((section: any, sIdx: number) => (
              <SortableSection 
                key={section.id}
                section={section}
                index={sIdx}
                onAddLesson={() => onAddLesson(section.id)}
                selectedLessonId={selectedLessonId}
                onSelectLesson={onSelectLesson}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                onTogglePreview={onTogglePreview}
                draftSection={draftSections?.[section.id]}
                draftLessons={draftLessons}
                onSectionDraftUpdate={onSectionDraftUpdate}
                onLessonDraftUpdate={onLessonDraftUpdate}
                isEditing={editingId === section.id}
                onEditingChange={(val: boolean) => setEditingId(val ? section.id : null)}
                isExpanded={expandedIds.includes(section.id)}
                onToggleExpand={() => setExpandedIds((prev: string[]) => prev.includes(section.id) ? prev.filter(id => id !== section.id) : [...prev, section.id])}
                editingId={editingId}
                setEditingId={setEditingId}
              />
            ))}
          </SortableContext>
        </div>
      )}
      </div>
    </div>
  );
}

function SortableSection({ 
  section, index, onAddLesson, selectedLessonId, onSelectLesson, 
  selectedIds, toggleSelect, onTogglePreview, draftSection, draftLessons, 
  onSectionDraftUpdate, onLessonDraftUpdate, isEditing: controlledIsEditing, 
  onEditingChange, isExpanded, onToggleExpand, editingId, setEditingId
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 30 : 1 };
  const [localIsEditing, setLocalIsEditing] = useState(controlledIsEditing || false);

  const isEditing = controlledIsEditing || localIsEditing;
  const setIsEditing = (val: boolean) => {
    setLocalIsEditing(val);
    onEditingChange?.(val);
  };

  const displayTitle = draftSection?.title || section.title;

  return (
    <div ref={setNodeRef} style={style} className={`mb-2 transition-all ${isDragging ? "opacity-50" : ""}`}>
      <div className={`rounded-xl p-2.5 border transition-all ${isExpanded ? "bg-slate-800 border-slate-700 shadow-md" : "bg-slate-100/80 border-transparent hover:bg-slate-200"}`}>
        <div className={`flex items-center justify-between group ${isExpanded ? "mb-2.5" : ""}`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div {...attributes} {...listeners} className={`cursor-grab transition-colors p-0.5 ${isExpanded ? 'text-slate-500 hover:text-white' : 'text-slate-300 hover:text-indigo-400'}`}>
            <GripVertical size={12} />
          </div>
          <button 
            onClick={onToggleExpand}
            className={`p-0.5 rounded-md transition-all ${isExpanded ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-white text-slate-400'}`}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-sm shrink-0 ${isExpanded ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-400'}`}>
            <Layers size={12} />
          </div>
          
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input 
                autoFocus
                className="text-sm font-bold text-slate-700 uppercase tracking-tight bg-white border border-blue-400 rounded-lg px-2 py-0.5 w-full outline-none"
                value={displayTitle}
                onChange={(e) => onSectionDraftUpdate(section.id, { title: e.target.value })}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              />
              <button onClick={() => setIsEditing(false)} className="text-emerald-500"><Check size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`text-[13px] font-black uppercase tracking-tight truncate flex items-center gap-2 ${isExpanded ? "text-white" : "text-slate-700"}`}>
                {displayTitle}
                {draftSection && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Thay đổi chưa lưu" />}
              </span>
              <button 
                onClick={() => setIsEditing(true)} 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-blue-500 shrink-0"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1 transition-all shrink-0">
            <button 
              onClick={() => toggleSelect(section.id)}
              className={`p-1.5 rounded-lg border transition-all ${
                selectedIds.includes(section.id)
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-slate-200 text-slate-200 hover:text-slate-400"
              }`}
            >
              <CheckCircle2 size={14} />
            </button>
            <button 
              onClick={onAddLesson}
              className={`p-1.5 rounded-lg transition-all shadow-sm ${isExpanded ? 'bg-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white' : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white'}`}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-1.5 ml-2 border-l-2 border-blue-100/80 pl-3 py-0.5">
          <SortableContext items={section.lessons.map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
            {section.lessons.map((lesson: any, lIdx: number) => (
              <SortableLessonRow 
                key={lesson.id}
                lesson={lesson}
                index={lIdx}
                selectedLessonId={selectedLessonId}
                onSelectLesson={onSelectLesson}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                onTogglePreview={onTogglePreview}
                draftLesson={draftLessons?.[lesson.id]}
                onLessonDraftUpdate={onLessonDraftUpdate}
                isEditing={editingId === lesson.id}
                onEditingChange={(val: boolean) => setEditingId(val ? lesson.id : null)}
              />
            ))}
          </SortableContext>
        </div>
      )}
      </div>
    </div>
  );
}

function SortableLessonRow({ 
  lesson, index, selectedLessonId, onSelectLesson, selectedIds, toggleSelect, 
  onTogglePreview, draftLesson, onLessonDraftUpdate, isEditing: controlledIsEditing, 
  onEditingChange 
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : 1 };
  const [localIsEditing, setLocalIsEditing] = useState(controlledIsEditing || false);

  const isEditing = controlledIsEditing || localIsEditing;
  const setIsEditing = (val: boolean) => {
    setLocalIsEditing(val);
    onEditingChange?.(val);
  };

  const displayTitle = draftLesson?.title || lesson.title;
  const isSelected = selectedLessonId === lesson.id;
  const isSelectedForDelete = selectedIds.includes(lesson.id);

  return (
    <div ref={setNodeRef} style={style} className={`relative group/item flex items-center gap-2 ${isDragging ? "opacity-50" : ""}`}>
      <div {...attributes} {...listeners} className="p-1 text-slate-300 hover:text-blue-400 cursor-grab transition-opacity shrink-0">
        <GripVertical size={14} />
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          toggleSelect(lesson.id);
        }}
        className={`shrink-0 p-1.5 rounded-lg border transition-all ${
          isSelectedForDelete
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white border-slate-200 text-slate-300 hover:text-slate-500"
        }`}
      >
        <CheckCircle2 size={14} />
      </button>
      <div
        onClick={() => onSelectLesson(lesson.id)}
        className={`flex-1 flex items-center gap-2 p-2 px-3 rounded-xl text-left text-sm font-semibold transition-all shadow-sm border cursor-pointer ${
          isSelected 
          ? "bg-blue-600 text-white border-blue-500 shadow-blue-200 scale-[1.01] z-10" 
          : "bg-white text-slate-600 border-white hover:border-blue-100 hover:text-blue-600"
        }`}
      >
        <div className={isSelected ? "text-blue-200" : "text-slate-400"}>
          {lesson.contentType === "VIDEO" ? <Video size={14} /> : lesson.contentType === "IFRAME" ? <Layout size={14} /> : <FileText size={14} />}
        </div>
        
        {isEditing ? (
          <input 
            autoFocus
            className="flex-1 bg-white border border-blue-300 rounded px-1 text-slate-800 outline-none"
            value={displayTitle}
            onChange={(e) => {
              e.stopPropagation();
              onLessonDraftUpdate(lesson.id, { title: e.target.value });
            }}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setIsEditing(false);
              }
            }}
          />
        ) : (
          <span className="flex-1 truncate leading-tight line-clamp-2 flex items-center gap-2">
            {displayTitle}
            {draftLesson && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="Thay đổi chưa lưu" />}
          </span>
        )}
        
        <div className="flex items-center gap-2">
           {!isEditing && (
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 setIsEditing(true);
               }}
               className="transition-opacity text-slate-300 hover:text-blue-500 shrink-0"
             >
                <Pencil size={12} />
             </button>
           )}
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onTogglePreview(lesson.id, lesson.isPreview);
             }}
             title={lesson.isPreview ? "Đang cho xem thử (Free)" : "Không cho xem thử (Khóa)"}
             className={`p-1.5 rounded-lg transition-all ${
               lesson.isPreview 
               ? "text-blue-500 bg-blue-100/50 hover:bg-blue-100" 
               : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
             }`}
           >
             {lesson.isPreview ? <Eye size={14} /> : <EyeOff size={14} />}
           </button>
           {isSelected && <ChevronRight size={14} className="text-blue-200" />}
        </div>
      </div>
    </div>
  );
}
