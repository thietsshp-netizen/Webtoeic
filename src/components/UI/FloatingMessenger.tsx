"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function FloatingMessenger() {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  
  // Ẩn nút khi đang ở trang học/thi (tránh xao nhãng)
  if (pathname.includes('/learn/')) return null;

  // Link m.me với ID của bạn
  const messengerUrl = "https://m.me/101690955494114";

  return (
    <div 
      className="fixed bottom-2.5 right-2.5 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end gap-2 sm:gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip / Chào mừng */}
      <div className={`
        hidden sm:block bg-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-100 
        transition-all duration-300 transform origin-right
        ${isHovered ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-90 pointer-events-none'}
      `}>
        <p className="text-xs font-black text-slate-800 whitespace-nowrap uppercase tracking-wider">
          Chat với giảng viên 👋
        </p>
      </div>

      {/* Nút chính */}
      <a 
        href={messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group opacity-85 hover:opacity-100 active:scale-95 transition-opacity"
        title="Chat với giảng viên qua Messenger"
      >
        {/* Hiệu ứng sóng lan tỏa (Pulse) - chỉ hiện trên desktop */}
        <span className="hidden sm:block absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20 group-hover:hidden"></span>
        
        {/* Bong bóng Messenger */}
        <div className="w-9 h-9 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md sm:shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-110 sm:hover:-translate-y-1 active:scale-90 ring-1 sm:ring-4 ring-white/30">
          <svg 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-4.5 h-4.5 sm:w-7 sm:h-7 drop-shadow-sm"
          >
            <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.18 5.48 3.08 7.28.16.14.26.35.26.57l-.02 2.1c-.01.47.46.82.91.68l2.36-.74c.2-.06.42-.05.62.04 1.1.48 2.32.75 3.6.75 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.31 12.9l-2.61-2.79-5.11 2.79 5.62-5.96 2.61 2.79 5.11-2.79-5.62 5.96z" />
          </svg>
        </div>

        {/* Badge thông báo nhỏ */}
        <div className="absolute top-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-red-500 border-2 border-white rounded-full animate-bounce"></div>
      </a>
    </div>
  );
}
