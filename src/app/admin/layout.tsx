"use client";

import Link from 'next/link';
import { ReactNode, useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [adminSidebarWidth, setAdminSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

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
      if (newWidth >= 180 && newWidth <= 400) {
        setAdminSidebarWidth(newWidth);
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

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r shadow-sm flex flex-col flex-shrink-0 sticky top-0 h-screen z-40 ${isResizing ? "" : "transition-all duration-300"}`}
        style={{ width: adminSidebarWidth }}
      >
        <div className="flex items-center justify-center h-16 border-b flex-shrink-0">
          <span className="font-bold text-xl text-blue-600 truncate px-4">Admin Panel</span>
        </div>
        <nav className="p-4 space-y-2 overflow-y-auto flex-1">
          <Link href="/admin/courses" className="block p-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700 truncate">
            Khóa học (CMS)
          </Link>
          <Link href="/admin/toeic-tests" className="block p-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700 truncate">
            Đề thi TOEIC
          </Link>
          <Link href="/admin/enrollments" className="block p-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700 truncate">
            Học viên & Phân quyền
          </Link>
          <Link href="/admin/part5-ingestion" className="block p-3 rounded-lg hover:bg-gray-100 font-medium text-blue-600 truncate border-t border-slate-50 mt-4 pt-4">
            ✨ Nhập dữ liệu Part 5 (AI)
          </Link>
        </nav>

        {/* RESIZER HANDLE */}
        <div 
          onMouseDown={startResizing}
          className={`absolute -right-1 top-0 w-2 h-full cursor-col-resize z-50 hover:bg-blue-500/20 active:bg-blue-600/30 transition-colors`}
          title="Kéo để thay đổi chiều rộng"
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
}
