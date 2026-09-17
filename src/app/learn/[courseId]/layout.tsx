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

  // Tự động thu gọn thanh nội dung khóa học (LearnSidebar) khi mở Sổ tay ngữ pháp
  useEffect(() => {
    const handleGrammarHandbookToggle = () => {
      setSidebarOpen(false);
      localStorage.setItem("toeic-sidebar-collapsed", "true");
    };
    window.addEventListener("toggle-grammar-handbook", handleGrammarHandbookToggle);
    return () => window.removeEventListener("toggle-grammar-handbook", handleGrammarHandbookToggle);
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
        <header className="h-[clamp(32px,5vh,52px)] max-lg:landscape:h-7 border-b flex items-center justify-between px-[clamp(8px,1.5vw,24px)] max-lg:landscape:px-2 bg-slate-900 text-white flex-shrink-0 relative z-[1000000005]" style={{ zIndex: 1000000005 }}>
          <div className="flex items-center gap-[clamp(4px,1vw,16px)]">
            {/* Nút Quay lại Dashboard */}
            <Link
              href="/?tab=dashboard"
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white flex items-center gap-1 group"
              title="Quay lại Dashboard"
            >
              <ChevronLeft className="group-hover:-translate-x-1 transition-transform w-[clamp(14px,2.2vh,20px)] h-[clamp(14px,2.2vh,20px)]" />
              <span className="text-[clamp(8px,1.3vh,11px)] font-black uppercase tracking-widest hidden sm:block">Dashboard</span>
            </Link>
            <div className="h-[clamp(12px,2vh,20px)] w-px bg-white/20 mx-0.5 sm:mx-1"></div>
            <h1 className="text-[clamp(10px,1.6vh,15px)] font-black tracking-tight flex items-center gap-[clamp(4px,1vw,12px)]">
              <span id="learn-course-title" data-course-title={courseTitle} className="max-w-[120px] xs:max-w-[150px] sm:max-w-sm landscape:max-w-[140px] truncate uppercase italic text-blue-400">{courseTitle}</span>
              <span className="text-[clamp(7px,1.2vh,10px)] bg-blue-600 px-1.5 py-0.5 rounded text-white font-black uppercase tracking-widest">PRO</span>
            </h1>
          </div>

          <div className="flex items-center gap-[clamp(4px,1vw,12px)]">
            {/* Nút bật/tắt công cụ vẽ viết - CHỈ HIỂN THỊ CHO ADMIN */}
            {session?.user && (session.user as any).role === "ADMIN" && (
              <button
                onClick={() => {
                  const nextActive = !isDrawingActive;
                  setIsDrawingActive(nextActive);
                  window.dispatchEvent(new CustomEvent("webtoeic-toggle-global-draw", { detail: { active: nextActive } }));
                }}
                style={{ zIndex: 1000000010, position: "relative" }}
                className={`cursor-pointer w-[clamp(22px,3.5vh,34px)] h-[clamp(22px,3.5vh,34px)] rounded-full transition-all flex items-center justify-center border ${
                  isDrawingActive 
                    ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20 scale-105" 
                    : "text-slate-300 border-white/20 hover:text-white hover:bg-white/10"
                }`}
                title={isDrawingActive ? "Tắt công cụ vẽ viết lên màn hình (Ctrl+Shift+B)" : "Bật công cụ vẽ viết lên màn hình (Ctrl+Shift+B)"}
              >
                {isDrawingActive ? <X className="w-[clamp(12px,2vh,18px)] h-[clamp(12px,2vh,18px)]" /> : <Pencil className="w-[clamp(12px,2vh,18px)] h-[clamp(12px,2vh,18px)]" />}
              </button>
            )}

            <a 
              href="https://m.me/101690955494114" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[clamp(8px,1.3vh,11px)] font-bold text-slate-300 hover:text-white border border-white/20 px-[clamp(8px,1vw,14px)] py-[clamp(2px,0.5vh,6px)] rounded-full hover:bg-white/10 transition-all"
            >
              <HelpCircle className="w-[clamp(12px,2vh,16px)] h-[clamp(12px,2vh,16px)]" /> Hỗ trợ
            </a>
            <div 
              className={`w-[clamp(22px,3.5vh,34px)] h-[clamp(22px,3.5vh,34px)] rounded-full ${avatarColor} flex items-center justify-center font-black text-[clamp(7px,1.3vh,10px)] shadow-lg shadow-blue-500/20`}
              title={session?.user?.email || "Người dùng"}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Main Learning Workspace */}
        <div id="learn-workspace-container" className="flex flex-1 overflow-hidden relative">
          {/* Sidebar Bên Trái (Collapsible & Resizable) */}
          <div 
            style={sidebarOpen ? { width: `min(${sidebarWidth}px, 82vw)` } : {}}
            className={`h-full bg-[#fbfcfd] flex-shrink-0 relative overflow-hidden flex flex-col ${
              isResizing ? "" : "transition-all duration-300 ease-in-out"
            } ${
              sidebarOpen ? "border-r border-slate-100" : "w-[clamp(9px,1.1vw,16px)] sm:w-[clamp(18px,2.2vw,32px)] border-r border-slate-100"
            }`}
          >
            {/* Collapsed State Indicator */}
            {!sidebarOpen && (
              <div className="absolute inset-0 flex flex-col items-center py-[clamp(2px,0.8vh,12px)] gap-[clamp(4px,1vh,16px)] animate-in fade-in duration-500 select-none">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[clamp(8px,1.2vh,12px)] sm:w-[clamp(14px,2.2vh,22px)] h-[clamp(8px,1.2vh,12px)] sm:h-[clamp(14px,2.2vh,22px)] rounded-[3px] sm:rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs border border-indigo-100">
                    <Menu className="w-[clamp(5px,0.8vh,8px)] sm:w-[clamp(8px,1.3vh,12px)] h-[clamp(5px,0.8vh,8px)] sm:h-[clamp(8px,1.3vh,12px)]" />
                  </div>
                </div>
                <div 
                  className="flex items-center gap-1 [writing-mode:vertical-lr] rotate-180 text-[clamp(4px,0.5vw,6.5px)] sm:text-[clamp(5.5px,0.8vw,8.5px)] font-black text-slate-400 uppercase tracking-[0.05em] sm:tracking-[0.1em] opacity-80 whitespace-nowrap"
                >
                  Nội dung khóa học
                </div>
                <div className="mt-auto mb-[clamp(2px,0.8vh,12px)] flex flex-col items-center gap-0.5">
                   <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-indigo-500 animate-pulse" />
                   <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-indigo-300" />
                   <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-indigo-100" />
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
            style={sidebarOpen ? { left: `min(${sidebarWidth}px, 82vw)` } : {}}
            className={`absolute top-1/2 -translate-y-1/2 z-[60] w-[clamp(7px,1vw,12px)] sm:w-[clamp(11px,1.6vw,18px)] h-[clamp(14px,2.5vh,26px)] sm:h-[clamp(20px,3.5vh,36px)] bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-r-md sm:rounded-r-lg ${
              isResizing ? "" : "transition-all duration-300 ease-in-out"
            } ${
              sidebarOpen ? "-ml-px" : "left-[clamp(9px,1.1vw,16px)] sm:left-[clamp(18px,2.2vw,32px)]"
            }`}
            title={sidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-[clamp(5px,0.9vh,9px)] sm:w-[clamp(8px,1.4vh,13px)] h-[clamp(5px,0.9vh,9px)] sm:h-[clamp(8px,1.4vh,13px)]" />
            ) : (
              <ChevronRight className="w-[clamp(5px,0.9vh,9px)] sm:w-[clamp(8px,1.4vh,13px)] h-[clamp(5px,0.9vh,9px)] sm:h-[clamp(8px,1.4vh,13px)]" />
            )}
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
