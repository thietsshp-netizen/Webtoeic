"use client";

import { signIn } from "next-auth/react";
import { Lock, ShieldCheck, X, ArrowRight, Star } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Decorative background circle */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200">
             <Lock className="text-white" size={32} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
             <Star size={12} fill="currentColor" /> NỘI DUNG DÀNH CHO HỘI VIÊN
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-none uppercase italic">BÀI HỌC ĐANG <br/> BỊ KHÓA</h2>
          
          <div className="space-y-6 mb-10 text-slate-500 font-medium leading-relaxed">
            <p className="text-sm">
              Rất tiếc! Nội dung này yêu cầu tài khoản học viên chính thức của <span className="text-slate-900 font-bold italic uppercase">hoctoeic</span>.
            </p>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-[11px] text-left space-y-3">
              <p className="text-center font-black text-slate-400 uppercase tracking-widest mb-2">Liên hệ Mr. Thiệt để đăng ký:</p>
              <a href="https://www.facebook.com/" target="_blank" className="flex items-center gap-3 hover:text-blue-600 transition-colors">
                <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">👤</span>
                <span className="font-bold">Facebook cá nhân</span>
              </a>
              <a href="https://www.facebook.com/ToeicMrThiet990" target="_blank" className="flex items-center gap-3 hover:text-blue-600 transition-colors">
                <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">🏢</span>
                <span className="font-bold">Fanpage: Toeic Mr. Thiệt 990</span>
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={onClose}
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowRight size={20} className="rotate-180" /> QUAY LẠI XEM TIẾP
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-center gap-2 italic">
             <ShieldCheck size={16} className="text-emerald-500" />
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bảo mật bởi hoctoeic Pro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
