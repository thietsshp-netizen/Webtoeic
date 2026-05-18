"use client";

import { useState, useEffect } from "react";
import LearnSidebar from "@/components/Player/LearnSidebar";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, Share2, HelpCircle, ChevronRight, Menu } from "lucide-react";
import { AdminEditProvider } from "@/components/Admin/AdminEditProvider";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [courseTitle, setCourseTitle] = useState("Đang tải...");

  useEffect(() => {
    if (params?.courseId) {
      fetch(`/api/courses/${params.courseId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.course) {
            setCourseTitle(data.course.title);
          }
        });
    }
  }, [params?.courseId]);

  // Lắng nghe sự kiện mở/đóng Sidebar bên trái trong kịch bản Tour
  useEffect(() => {
    const handleTourCourseSidebar = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSidebarOpen(customEvent.detail.open);
    };
    window.addEventListener("toeic-tour-course-sidebar", handleTourCourseSidebar);
    return () => window.removeEventListener("toeic-tour-course-sidebar", handleTourCourseSidebar);
  }, []);

  // Tự động ẩn sidebar khi màn hình nhỏ (< 1280px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Kiểm tra lần đầu khi mount
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: session } = useSession();

  // Hàm tạo màu từ string (email) để mỗi user có 1 màu riêng
  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 
      'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
    ];
    if (!email) return colors[0];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return "??";
  };

  const userInitials = getInitials(session?.user?.name || "", session?.user?.email || "");
  const avatarColor = getAvatarColor(session?.user?.email || "");

  return (
    <AdminEditProvider>
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        {/* Top Navbar Học tập */}
        <header className="h-14 border-b flex items-center justify-between px-6 bg-slate-900 text-white flex-shrink-0 z-50">
          <div className="flex items-center gap-4">
            {/* Nút Quay lại Dashboard */}
            <button
              onClick={() => router.push("/?tab=dashboard")}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white flex items-center gap-1 group"
              title="Quay lại Dashboard"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Dashboard</span>
            </button>
            <div className="h-4 w-px bg-white/20 mx-1"></div>
            <h1 className="text-sm font-black tracking-tight flex items-center gap-3">
              <span className="max-w-[150px] sm:max-w-sm truncate uppercase italic text-blue-400">{courseTitle}</span>
              <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded text-white font-black uppercase tracking-widest">PRO</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://m.me/101690955494114" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors border border-white/20 px-4 py-1.5 rounded-full hover:bg-white/10 transition-all"
            >
              <HelpCircle size={16} /> Hỗ trợ
            </a>
            <div 
              className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center font-black text-[10px] shadow-lg shadow-blue-500/20`}
              title={session?.user?.email || "Người dùng"}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Main Learning Workspace */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar Bên Trái (Collapsible) */}
          <div 
            className={`h-full transition-all duration-300 ease-in-out border-r bg-[#fbfcfd] flex-shrink-0 relative overflow-hidden flex flex-col ${
              sidebarOpen ? "w-[340px]" : "w-14"
            }`}
          >
            {/* Collapsed State Indicator */}
            {!sidebarOpen && (
              <div className="absolute inset-0 flex flex-col items-center py-8 gap-10 animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <Menu size={16} />
                  </div>
                </div>
                <div 
                  className="flex items-center gap-2 [writing-mode:vertical-lr] rotate-180 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-80"
                >
                  Nội dung khóa học
                </div>
                <div className="mt-auto mb-10 flex flex-col items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
                </div>
              </div>
            )}

            {/* Actual Sidebar Content */}
            <div className={`w-[340px] h-full transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}> 
              <LearnSidebar />
            </div>
          </div>

          {/* Nút Toggle Sidebar (Floating at the edge) - Standardized White & Middle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-[60] w-6 h-14 bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all duration-500 rounded-r-xl ${
              sidebarOpen ? "left-[340px] -ml-px" : "left-14"
            }`}
            title={sidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Nội dung bài học Bên Phải */}
          <main className="flex-1 bg-white overflow-y-auto relative scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </AdminEditProvider>
  );
}
