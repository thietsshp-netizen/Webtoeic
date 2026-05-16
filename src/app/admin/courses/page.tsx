"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Layout, 
  Settings, 
  Eye, 
  BookOpen, 
  MoreVertical, 
  Search, 
  Layers, 
  ChevronRight,
  Loader2,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Globe,
  Lock
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  isPublic: boolean;
  createdAt: string;
  totalSections: number;
  totalLessons: number;
}

export default function AdminDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    const title = prompt("Nhập tên khóa học mới:");
    if (!title) return;

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: "Mô tả khóa học mới...", isPublic: false }),
      });
      const data = await res.json();
      if (data.success) {
        // Sau khi tạo xong, nhảy thẳng vào Builder của khóa đó
        window.location.href = `/admin/courses/${data.courseId}/builder`;
      }
    } catch (err) {
      alert("Lỗi khi tạo khóa học!");
    }
  };

  const toggleSelectCourse = (id: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedCourseIds.length === 0) return;
    
    const confirmMsg = `Bạn có chắc chắn muốn xóa ${selectedCourseIds.length} khóa học đã chọn? Hành động này không thể hoàn tác!`;
    if (!confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedCourseIds }),
      });
      const data = await res.json();
      if (data.success) {
        setCourses(prev => prev.filter(c => !selectedCourseIds.includes(c.id)));
        setSelectedCourseIds([]);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert(data.error || "Lỗi khi xóa khóa học");
      }
    } catch (err) {
      alert("Lỗi kết nối khi xóa!");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublic = async (courseId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isPublic: !currentStatus } : c));
      }
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái!");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang nạp quản trị...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Top Header Section */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/courses" className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all border border-slate-100 shadow-sm mr-2 group">
              <ArrowLeft size={20} className="stroke-[3] group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
               <Layers className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">ADMIN DASHBOARD</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hệ thống quản lý LMS Pro</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Tìm tên khóa học..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-6 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 border rounded-2xl w-64 outline-none transition-all text-sm font-medium"
              />
            </div>
            
            <button 
              onClick={handleDeleteSelected}
              disabled={selectedCourseIds.length === 0 || isDeleting}
              className={`px-6 py-2.5 rounded-2xl flex items-center gap-2 transition-all font-bold text-sm active:scale-95 border ${
                selectedCourseIds.length > 0 
                ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-100" 
                : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
              }`}
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {selectedCourseIds.length > 0 ? `XÓA ${selectedCourseIds.length} MỤC` : "XÓA MỤC CHỌN"}
            </button>

            <button 
              onClick={handleCreateCourse}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-100 transition-all font-bold text-sm active:scale-95"
            >
              <Plus size={20} className="stroke-[3]" /> TẠO KHÓA HỌC
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard title="Tổng Khóa Học" value={courses.length} icon={<BookOpen size={20} />} color="blue" />
          <StatCard title="Đang Công Khai" value={courses.filter(c => c.isPublic).length} icon={<Eye size={20} />} color="emerald" />
          <StatCard title="Bản Nháp" value={courses.filter(c => !c.isPublic).length} icon={<Settings size={20} />} color="orange" />
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-between">
             <div className="flex justify-between items-start">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Hướng dẫn nhanh</p>
               <Settings size={20} className="opacity-50" />
             </div>
             <p className="text-sm font-bold leading-snug">Nhấn vào "Xây dựng" để biên tập bài giảng cho khóa học.</p>
          </div>
        </div>

        {/* Course List Grid */}
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 pl-2">Danh sách các bài đã tạo</h2>
        
        {filteredCourses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-24 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={40} className="text-slate-300" />
             </div>
             <p className="text-slate-400 font-bold mb-6">Bạn chưa có khóa học nào hoặc không tìm thấy bài đã tạo.</p>
             <button onClick={handleCreateCourse} className="text-blue-600 font-black text-sm uppercase tracking-widest hover:underline decoration-4 underline-offset-8">Tạo ngay khóa đầu tiên &rarr;</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div key={course.id} className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 border border-slate-100 overflow-hidden flex flex-col h-full">
                {/* Thumbnail Area */}
                <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                   {course.coverImage ? (
                     <img src={course.coverImage} className="w-full h-full object-cover" alt={course.title} />
                   ) : (
                     <div className="text-slate-200 flex flex-col items-center gap-2">
                        <Layout size={40} className="opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">NO THUMBNAIL</span>
                     </div>
                   )}
                   <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-white/50 text-[10px] font-black text-slate-900 flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${course.isPublic ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                      {course.isPublic ? 'PUBLIC' : 'DRAFT'}
                   </div>

                   {/* Selection Checkbox */}
                   <button 
                     onClick={(e) => {
                       e.preventDefault();
                       toggleSelectCourse(course.id);
                     }}
                     className={`absolute top-4 left-4 p-2 rounded-xl border transition-all duration-300 ${
                       selectedCourseIds.includes(course.id)
                       ? "bg-blue-600 border-blue-600 text-white shadow-lg translate-y-0 opacity-100"
                       : "bg-white/80 backdrop-blur-sm border-white/50 text-slate-300 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-white hover:text-blue-600"
                     }`}
                   >
                     <CheckCircle2 size={16} />
                   </button>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  {/* Category / Date */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                       {course.totalSections > 0 && (
                         <>
                           <span>{course.totalSections} Chương</span>
                           <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                         </>
                       )}
                       <span className="text-slate-500">{course.totalLessons} Bài học</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 capitalize">{new Date(course.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-black text-slate-800 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{course.title}</h3>
                <p className="text-slate-400 text-xs font-medium line-clamp-4 mb-8 leading-relaxed italic">
                  {course.description || "Khóa học này đang trong quá trình xây dựng nội dung chi tiết cho học viên."}
                </p>

                  <div className="mt-auto space-y-3">
                     <button 
                       onClick={(e) => {
                         e.preventDefault();
                         handleTogglePublic(course.id, course.isPublic);
                       }}
                       className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all font-black text-xs uppercase tracking-widest border shadow-sm active:scale-[0.98] ${
                         course.isPublic 
                         ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white" 
                         : "bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white"
                       }`}
                     >
                        <div className="flex items-center gap-2">
                           {course.isPublic ? <Globe size={16} /> : <Lock size={16} />}
                           <span>{course.isPublic ? "ĐANG CÔNG KHAI" : "ĐANG LÀ BẢN NHÁP"}</span>
                        </div>
                        <span className="text-[10px] opacity-70">{course.isPublic ? "HẠ XUỐNG" : "CÔNG KHAI NGAY"}</span>
                     </button>

                     <Link 
                       href={`/admin/courses/${course.id}/builder`}
                       className="w-full flex items-center justify-between bg-slate-900 hover:bg-blue-600 text-white p-4 rounded-3xl transition-all group/btn shadow-lg active:scale-[0.98]"
                     >
                       <span className="font-black text-xs uppercase tracking-widest">🛠️ Xây dựng bài học</span>
                       <ChevronRight size={18} className="transform group-hover/btn:translate-x-1 transition-transform" />
                     </Link>

                     <Link 
                       href={`/learn/${course.id}`}
                       target="_blank"
                       className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 p-4 rounded-3xl transition-all font-black text-xs uppercase tracking-widest border border-transparent hover:border-blue-100"
                     >
                       <Eye size={18} /> Xem như học viên
                     </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success Notification Toast */}
      {showSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-500 z-[100]">
          <div className="bg-emerald-500 p-1.5 rounded-full">
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm uppercase tracking-widest">Dữ liệu đã được dọn dẹp sạch sẽ!</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    orange: "text-orange-600 bg-orange-50"
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
