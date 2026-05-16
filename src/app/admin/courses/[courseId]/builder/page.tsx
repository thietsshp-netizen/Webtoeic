"use client";

import { useState, use, useEffect, useRef } from "react";
import AdminSyllabusSidebar from "@/components/Builder/AdminSyllabusSidebar";
import LessonEditor from "@/components/Builder/LessonEditor";
import { ChevronLeft, Layout, Settings, Eye, Share2, Loader2, X, Save, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
}

interface BuilderPageProps {
  params: Promise<{ courseId: string }>;
}

export default function CourseBuilderPage({ params }: BuilderPageProps) {
  const { courseId } = use(params);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  // --- STATE QUẢN LÝ BẢN NHÁP (DRAFT) ---
  const [draftLessons, setDraftLessons] = useState<Record<string, any>>({});
  const [draftSections, setDraftSections] = useState<Record<string, any>>({});
  const [draftBooks, setDraftBooks] = useState<Record<string, any>>({});
  const [draftDeletions, setDraftDeletions] = useState<{
    books: string[],
    sections: string[],
    lessons: string[]
  }>({ books: [], sections: [], lessons: [] });
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // --- RESIZABLE SIDEBAR ---
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  // --- COURSE SETTINGS ---
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    title: "",
    description: "",
    coverImage: ""
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      const sidebarLeft = sidebarRef.current.getBoundingClientRect().left;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= 250 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        const data = await res.json();
        if (data.success) {
          setCourse(data.course);
          setSettingsForm({
            title: data.course.title || "",
            description: data.course.description || "",
            coverImage: data.course.coverImage || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch course", err);
      } finally {
        setLoadingCourse(false);
      }
    }
    fetchCourse();
  }, [courseId]);

  const handleLessonDraftUpdate = (id: string, data: any) => {
    setDraftLessons(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...data }
    }));
  };

  const handleSectionDraftUpdate = (id: string, data: any) => {
    setDraftSections(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...data }
    }));
  };

  const handleBookDraftUpdate = (id: string, data: any) => {
    setDraftBooks(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...data }
    }));
  };

  const handleDeletionsUpdate = (type: 'books' | 'sections' | 'lessons', id: string) => {
    setDraftDeletions(prev => ({
      ...prev,
      [type]: [...prev[type], id]
    }));
  };

  const handleSaveAll = async () => {
    const hasChanges = Object.keys(draftLessons).length > 0 || 
                       Object.keys(draftSections).length > 0 || 
                       Object.keys(draftBooks).length > 0 ||
                       draftDeletions.books.length > 0 ||
                       draftDeletions.sections.length > 0 ||
                       draftDeletions.lessons.length > 0;
    if (!hasChanges) {
       alert("Không có thay đổi nào cần lưu!");
       return;
    }

    setIsSavingAll(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/batch-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessons: draftLessons,
          sections: draftSections,
          books: draftBooks,
          deletions: draftDeletions
        })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      // Xóa draft sau khi lưu thành công
      setDraftLessons({});
      setDraftSections({});
      setDraftBooks({});
      setDraftDeletions({ books: [], sections: [], lessons: [] });
      alert("Đã lưu toàn bộ thay đổi thành công!");
      
      // Có thể reload lại dữ liệu syllabus nếu cần
      window.location.reload(); 
    } catch (err: any) {
      alert("Lỗi khi lưu: " + err.message);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsForm.title.trim()) return alert("Tiêu đề không được để trống!");
    
    setIsSavingSettings(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (data.success) {
        setCourse(prev => prev ? { ...prev, ...settingsForm } : prev);
        setIsEditingSettings(false);
        // Không cần alert vì UI sẽ update ngay tiêu đề
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert("Lỗi khi lưu cấu hình: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
        return alert("Vui lòng chỉ chọn tệp tin hình ảnh!");
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/admin/upload-cover", {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        if (data.success) {
            setSettingsForm(prev => ({ ...prev, coverImage: data.url }));
        } else {
            throw new Error(data.error);
        }
    } catch (err: any) {
        alert("Lỗi khi tải ảnh: " + err.message);
    } finally {
        setIsUploadingImage(false);
    }
  };

  const pendingCount = Object.keys(draftLessons).length + 
                       Object.keys(draftSections).length + 
                       Object.keys(draftBooks).length +
                       draftDeletions.books.length +
                       draftDeletions.sections.length +
                       draftDeletions.lessons.length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* SIDEBAR TRÁI (SYLLABUS TREE) */}
      <div 
        ref={sidebarRef}
        className={`transition-all ${isResizing ? "" : "duration-500"} ease-in-out border-r border-slate-200 bg-white shadow-xl flex flex-col flex-shrink-0 z-40 relative`}
        style={{ width: sidebarOpen ? sidebarWidth : 0 }}
      >
        {/* RESIZER HANDLE */}
        {sidebarOpen && (
          <div 
            onMouseDown={startResizing}
            className={`absolute -right-1 top-0 w-2 h-full cursor-col-resize z-50 hover:bg-blue-500/20 active:bg-blue-600/30 transition-colors`}
            title="Kéo để thay đổi chiều rộng"
          />
        )}
         <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
            <Link href="/admin/courses" className="text-slate-400 hover:text-blue-600 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div className="text-right">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang xây dựng</span>
              {loadingCourse ? (
                <Loader2 size={14} className="animate-spin text-slate-400 ml-auto" />
              ) : (
                <span className="block text-sm font-bold text-slate-800 truncate max-w-[200px]">{course?.title || "Chưa có tên"}</span>
              )}
            </div>
         </div>
         
         <div className="flex-1 overflow-hidden">
            <AdminSyllabusSidebar 
              courseId={courseId} 
              onSelectLesson={(id) => setSelectedLessonId(id)}
              selectedLessonId={selectedLessonId || undefined}
              draftLessons={draftLessons}
              draftSections={draftSections}
              draftBooks={draftBooks}
              onBookDraftUpdate={handleBookDraftUpdate}
              onSectionDraftUpdate={handleSectionDraftUpdate}
              onLessonDraftUpdate={handleLessonDraftUpdate}
              onDeletionsUpdate={handleDeletionsUpdate}
            />
         </div>
      </div>

      {/* VÙNG LÀM VIỆC CHÍNH (MAIN WORKSPACE) */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Nút Toggle Sidebar */}
        <button 
           onClick={() => setSidebarOpen(!sidebarOpen)}
           className={`absolute top-1/2 -translate-y-1/2 z-50 p-2 bg-white border border-slate-200 rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all text-slate-400 ${isResizing ? "opacity-0" : "opacity-100"}`}
           style={{ 
             left: sidebarOpen ? -16 : 16,
             transition: isResizing ? 'none' : 'all 0.5s ease'
           }}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <div className="p-1"><Layout size={16} /></div>}
        </button>

        {/* Top Navbar */}
        <div className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 shadow-sm z-30">
           <div className="flex items-center gap-6">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <p className="text-sm font-bold text-slate-600 tracking-tight">Admin Mode / Live Editing</p>
           </div>
                      <div className="flex items-center gap-4">
              {isMounted && (
                <>
                  <button 
                    onClick={handleSaveAll}
                    disabled={isSavingAll || pendingCount === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl ${
                      pendingCount > 0 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-100" 
                      : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                    }`}
                  >
                     {isSavingAll ? <Loader2 className="animate-spin" size={18} /> : (
                       <div className="flex items-center gap-2">
                         <Share2 size={18} /> 
                         <span>LƯU TẤT CẢ {pendingCount > 0 ? `(${pendingCount})` : ""}</span>
                       </div>
                     )}
                  </button>
                  
                  <Link 
                    href={selectedLessonId ? `/learn/${courseId}/lesson/${selectedLessonId}` : `/learn/${courseId}`} 
                    target="_blank"
                    className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-blue-600 transition-colors bg-slate-100 px-5 py-3 rounded-2xl"
                  >
                    <Eye size={18} /> XEM TRƯỚC
                  </Link>
                </>
              )}
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-white">
          {selectedLessonId ? (
            <LessonEditor 
              key={selectedLessonId}
              lessonId={selectedLessonId} 
              draftData={draftLessons[selectedLessonId]}
              onDraftUpdate={(data) => handleLessonDraftUpdate(selectedLessonId, data)}
              onSaveSuccess={() => {
                // Khi lưu cục bộ thành công, xóa khỏi draft
                setDraftLessons(prev => {
                  const newDraft = { ...prev };
                  delete newDraft[selectedLessonId];
                  return newDraft;
                });
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20">
               <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center mb-10 shadow-inner border border-slate-100">
                  <Layout size={60} className="text-slate-200" />
               </div>
               <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Chào mừng bạn tới LMS Builder</h2>
               <p className="text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                  Chọn một bài học từ danh sách bên trái để bắt đầu soạn thảo nội dung hoặc thêm một Chương mới để mở rộng khóa học của bạn.
               </p>
                              <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-lg">
                  <div 
                    onClick={() => setIsEditingSettings(true)}
                    className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-left group hover:bg-blue-600 transition-all cursor-pointer"
                  >
                     <Settings size={24} className="text-blue-600 group-hover:text-white mb-3" />
                     <h3 className="font-bold text-slate-800 group-hover:text-white">Cấu hình chung</h3>
                     <p className="text-xs text-slate-500 group-hover:text-blue-100 mt-1">Sửa tên khóa học, ảnh bìa và mô tả tổng quan.</p>
                  </div>
                  <div 
                    onClick={() => {
                        // Chọn bài học đầu tiên nếu có để xem Syllabus
                        const firstLesson = document.querySelector('[role="button"]') as HTMLElement;
                        if (firstLesson) firstLesson.click();
                    }}
                    className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left group hover:bg-slate-900 transition-all cursor-pointer"
                  >
                     <Eye size={24} className="text-slate-600 group-hover:text-white mb-3" />
                     <h3 className="font-bold text-slate-800 group-hover:text-white">Xem Syllabus</h3>
                     <p className="text-xs text-slate-500 group-hover:text-slate-400 mt-1">Kiểm tra lộ trình hiển thị cho học viên.</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL CẤU HÌNH CHUNG */}
      {isEditingSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
                       <Settings className="text-white" size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900 uppercase">Cấu hình khóa học</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cập nhật thông tin hiển thị cho học viên</p>
                    </div>
                 </div>
                 <button onClick={() => setIsEditingSettings(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                    <X size={24} />
                 </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Tiêu đề khóa học</label>
                    <input 
                       className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 transition-all shadow-inner"
                       placeholder="Ví dụ: Chuyên đề TOEIC Part 1..."
                       value={settingsForm.title}
                       onChange={(e) => setSettingsForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mô tả tổng quan</label>
                    <textarea 
                       rows={4}
                       className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-medium text-slate-600 transition-all shadow-inner resize-none leading-relaxed"
                       placeholder="Nhập mô tả hấp dẫn để thu hút học viên..."
                       value={settingsForm.description}
                       onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                 </div>

                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Ảnh bìa (Cover Image)</label>
                       <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md italic">Lý tưởng: 1200 x 675 pixels (Tỉ lệ 16:9)</span>
                    </div>
                    <div className="flex flex-col gap-4">
                       <div className="flex gap-4 items-center">
                          <div className="flex-1 relative">
                             <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                             <input 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-medium text-slate-500 transition-all shadow-inner text-sm"
                                placeholder="Dán link ảnh tại đây hoặc chọn từ máy..."
                                value={settingsForm.coverImage}
                                onChange={(e) => setSettingsForm(prev => ({ ...prev, coverImage: e.target.value }))}
                             />
                          </div>
                          
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden" 
                          />
                          
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="shrink-0 flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                          >
                             {isUploadingImage ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                             CHỌN ẢNH TỪ MÁY
                          </button>
                       </div>
                    </div>
                    {settingsForm.coverImage && (
                       <div className="mt-4 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm h-48 w-full group relative">
                          <img src={settingsForm.coverImage} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-bold text-xs">ẢNH HIỆN TẠI</span>
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              <div className="p-8 bg-slate-50 border-t flex items-center justify-end gap-3">
                 <button 
                    onClick={() => setIsEditingSettings(false)}
                    className="px-6 py-3 rounded-2xl font-bold text-slate-400 hover:bg-slate-200 transition-all"
                 >
                    HỦY BỎ
                 </button>
                 <button 
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl shadow-xl shadow-blue-100 font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                 >
                    {isSavingSettings ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>LƯU CẤU HÌNH</span>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
