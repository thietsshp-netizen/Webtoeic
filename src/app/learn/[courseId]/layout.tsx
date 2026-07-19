"use client";

import { useState, useEffect } from "react";
import LearnSidebar from "@/components/Player/LearnSidebar";
import GrammarHandbook from "@/components/Player/GrammarHandbook";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft, Share2, HelpCircle, ChevronRight, Menu, Pencil, X } from "lucide-react";
import { AdminEditProvider } from "@/components/Admin/AdminEditProvider";
import { ScreenDrawOverlay } from "@/components/Common/ScreenDrawOverlay";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [courseTitle, setCourseTitle] = useState("Đang tải...");
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

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

  // Lắng nghe sự kiện đồng bộ trạng thái vẽ viết từ cọ vẽ toàn cục
  useEffect(() => {
    const handleGlobalDrawState = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsDrawingActive(customEvent.detail.active);
    };
    window.addEventListener("webtoeic-toggle-global-draw-state", handleGlobalDrawState);
    return () => window.removeEventListener("webtoeic-toggle-global-draw-state", handleGlobalDrawState);
  }, []);

  // Tự động ẩn sidebar khi màn hình nhỏ (< 1280px) và ghi nhớ lựa chọn ẩn của học viên
  useEffect(() => {
    const handleResize = () => {
      const isCollapsed = localStorage.getItem("toeic-sidebar-collapsed") === "true";
      if (window.innerWidth < 1280) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(!isCollapsed);
      }
    };
    
    // Kiểm tra lần đầu khi mount
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Khôi phục kích thước sidebar đã lưu từ localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem("toeic-sidebar-width");
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (parsed >= 240 && parsed <= 600) {
        setSidebarWidth(parsed);
      }
    }
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= 240 && newWidth <= 600) {
        setSidebarWidth(newWidth);
        localStorage.setItem("toeic-sidebar-width", String(newWidth));
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
        <header className="h-14 border-b flex items-center justify-between px-6 bg-slate-900 text-white flex-shrink-0 z-[999999999]">
          <div className="flex items-center gap-4">
            {/* Nút Quay lại Dashboard */}
            <Link
              href="/?tab=dashboard"
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white flex items-center gap-1 group"
              title="Quay lại Dashboard"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-white/20 mx-1"></div>
            <h1 className="text-sm font-black tracking-tight flex items-center gap-3">
              <span className="max-w-[150px] sm:max-w-sm truncate uppercase italic text-blue-400">{courseTitle}</span>
              <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded text-white font-black uppercase tracking-widest">PRO</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Nút bật/tắt công cụ vẽ viết - CHỈ HIỂN THỊ CHO ADMIN */}
            {session?.user && (session.user as any).role === "ADMIN" && (
              <button
                onClick={() => {
                  const nextActive = !isDrawingActive;
                  setIsDrawingActive(nextActive);
                  window.dispatchEvent(new CustomEvent("webtoeic-toggle-global-draw", { detail: { active: nextActive } }));
                }}
                style={{ zIndex: 1000000010, position: "relative" }}
                className={`cursor-pointer w-[38px] h-[38px] rounded-full transition-all flex items-center justify-center border ${
                  isDrawingActive 
                    ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20 scale-105" 
                    : "text-slate-300 border-white/20 hover:text-white hover:bg-white/10"
                }`}
                title={isDrawingActive ? "Tắt công cụ vẽ viết lên màn hình (Ctrl+Shift+B)" : "Bật công cụ vẽ viết lên màn hình (Ctrl+Shift+B)"}
              >
                {isDrawingActive ? <X size={18} /> : <Pencil size={18} />}
              </button>
            )}

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
          {/* Sidebar Bên Trái (Collapsible & Resizable) */}
          <div 
            style={sidebarOpen ? { width: `${sidebarWidth}px` } : {}}
            className={`h-full bg-[#fbfcfd] flex-shrink-0 relative overflow-hidden flex flex-col ${
              isResizing ? "" : "transition-all duration-300 ease-in-out"
            } ${
              sidebarOpen ? "border-r border-slate-100" : "w-0 sm:w-14 sm:border-r border-slate-100"
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
            <div className={`w-full h-full transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}> 
              <LearnSidebar />
            </div>

            {/* Drag handle line */}
            {sidebarOpen && (
              <div
                onMouseDown={startResizing}
                className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/20 active:bg-indigo-500/40 z-50 transition-colors ${
                  isResizing ? "bg-indigo-500/30" : ""
                }`}
              />
            )}
          </div>

          {/* Nút Toggle Sidebar (Floating at the edge) - Standardized White & Middle */}
          <button
            onClick={() => {
              const nextState = !sidebarOpen;
              setSidebarOpen(nextState);
              localStorage.setItem("toeic-sidebar-collapsed", String(!nextState));
            }}
            style={sidebarOpen ? { left: `${sidebarWidth}px` } : {}}
            className={`absolute top-1/2 -translate-y-1/2 z-[60] w-6 h-14 bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-r-xl ${
              isResizing ? "" : "transition-all duration-300 ease-in-out"
            } ${
              sidebarOpen ? "-ml-px" : "left-0 sm:left-14"
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
        
        {/* Sổ tay Ngữ pháp nổi */}
        <GrammarHandbook />

      </div>
    </AdminEditProvider>
  );
}
