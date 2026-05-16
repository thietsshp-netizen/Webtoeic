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
          <div className={`transition-all duration-300 transform ${isAdminMode ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
             <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-2xl mb-2 flex items-center gap-2 border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Editing Active
             </div>
          </div>
          
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`pointer-events-auto w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 active:scale-95 ${
              isAdminMode 
                ? "bg-indigo-600 text-white ring-4 ring-indigo-100" 
                : "bg-white text-slate-400 border border-slate-100 hover:text-indigo-600"
            }`}
            title={isAdminMode ? "Tắt chế độ chỉnh sửa" : "Bật chế độ chỉnh sửa"}
          >
            {isAdminMode ? <Eye size={24} /> : <Edit3 size={24} />}
            
            {/* Badge Indicator */}
            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
               isAdminMode ? "bg-emerald-500" : "bg-slate-200"
            }`}>
               {isAdminMode ? <Edit3 size={10} className="text-white" /> : <Lock size={10} className="text-slate-400" />}
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
