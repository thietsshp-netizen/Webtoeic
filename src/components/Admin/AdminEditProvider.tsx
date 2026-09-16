"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Edit3, Eye, Lock } from "lucide-react";

interface AdminEditContextType {
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  canEdit: boolean;
}

const AdminEditContext = createContext<AdminEditContextType | undefined>(undefined);

export function AdminEditProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    // Chỉ Admin mới có quyền bật chế độ chỉnh sửa
    if (session?.user && (session.user as any).role === "ADMIN") {
      setCanEdit(true);
    } else {
      setCanEdit(false);
      setIsAdminMode(false);
    }
  }, [session]);

  return (
    <AdminEditContext.Provider value={{ isAdminMode, setIsAdminMode, canEdit }}>
      {children}
      
      {/* Floating Admin Toggle Button - Dynamically scalable per screen size */}
      {canEdit && (
        <div 
          className="fixed z-[9999] flex flex-col items-end gap-3 pointer-events-none"
          style={{
            bottom: 'clamp(52px, 7.5vh, 80px)',
            right: 'clamp(10px, 1.8vw, 24px)'
          }}
        >
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            style={{
              width: 'clamp(30px, 3.8vw, 44px)',
              height: 'clamp(30px, 3.8vw, 44px)'
            }}
            className={`group pointer-events-auto rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isAdminMode 
                ? "bg-indigo-600 text-white ring-2 sm:ring-4 ring-indigo-100" 
                : "bg-white/90 backdrop-blur-xs text-slate-500 border border-slate-200/80 hover:text-indigo-600 hover:bg-white"
            }`}
          >
            {isAdminMode ? (
              <Eye style={{ width: 'clamp(14px, 1.8vw, 20px)', height: 'clamp(14px, 1.8vw, 20px)' }} />
            ) : (
              <Edit3 style={{ width: 'clamp(14px, 1.8vw, 20px)', height: 'clamp(14px, 1.8vw, 20px)' }} />
            )}
            
            {/* Badge Indicator */}
            <div 
              style={{
                width: 'clamp(12px, 1.4vw, 16px)',
                height: 'clamp(12px, 1.4vw, 16px)'
              }}
              className={`absolute -top-1 -right-1 rounded-full border border-white flex items-center justify-center shadow-xs ${
               isAdminMode ? "bg-emerald-500" : "bg-slate-300"
            }`}>
               {isAdminMode ? (
                 <Edit3 style={{ width: 'clamp(7px, 0.9vw, 9px)', height: 'clamp(7px, 0.9vw, 9px)' }} className="text-white" />
               ) : (
                 <Lock style={{ width: 'clamp(7px, 0.9vw, 9px)', height: 'clamp(7px, 0.9vw, 9px)' }} className="text-slate-600" />
               )}
            </div>

            {/* Custom Premium Tooltip */}
            <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 border border-white/10 translate-x-2 group-hover:translate-x-0 flex items-center gap-1.5 whitespace-nowrap">
              {isAdminMode && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              <span>{isAdminMode ? "Live Editing Active" : "Bật chế độ chỉnh sửa"}</span>
            </div>
          </button>
        </div>
      )}
    </AdminEditContext.Provider>
  );
}

export function useAdminEdit() {
  const context = useContext(AdminEditContext);
  if (context === undefined) {
    throw new Error("useAdminEdit must be used within an AdminEditProvider");
  }
  return context;
}
