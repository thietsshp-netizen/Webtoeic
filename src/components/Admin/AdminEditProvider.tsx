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
      
      {/* Floating Admin Toggle Button */}
      {canEdit && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`group pointer-events-auto w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 active:scale-95 ${
              isAdminMode 
                ? "bg-indigo-600 text-white ring-4 ring-indigo-100" 
                : "bg-white text-slate-400 border border-slate-100 hover:text-indigo-600"
            }`}
          >
            {isAdminMode ? <Eye size={24} /> : <Edit3 size={24} />}
            
            {/* Badge Indicator */}
            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
               isAdminMode ? "bg-emerald-500" : "bg-slate-200"
            }`}>
               {isAdminMode ? <Edit3 size={10} className="text-white" /> : <Lock size={10} className="text-slate-400" />}
            </div>

            {/* Custom Premium Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 border border-white/10 translate-x-2 group-hover:translate-x-0 flex items-center gap-2">
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
