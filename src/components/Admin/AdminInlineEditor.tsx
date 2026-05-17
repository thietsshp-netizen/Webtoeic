"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAdminEdit } from "./AdminEditProvider";
import { Check, X, Loader2, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { showToast } from "../UI/Toast";

const toast = {
  success: (msg: string) => showToast(msg, 'success'),
  error: (msg: string) => showToast(msg, 'error')
};

interface AdminInlineEditorProps {
  children: React.ReactNode;
  target: "question" | "group";
  id: string;
  field: string;
  sid?: string;
  value: string;
  className?: string;
  multiline?: boolean;
}

export function AdminInlineEditor({ 
  children, 
  target, 
  id, 
  field, 
  sid, 
  value: initialValue,
  className = "",
  multiline = false
}: AdminInlineEditorProps) {
  const router = useRouter();
  const { isAdminMode } = useAdminEdit();
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const [syncLogs, setSyncLogs] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number, y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const initialCoords = {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 300)
      };
      setCoords(initialCoords);
      // Reset drag position when starting a new edit
      setDragPos(null);
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - (dragPos?.x || coords.left);
    const startY = e.clientY - (dragPos?.y || coords.top);
    setDragStart({ x: startX, y: startY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setDragPos({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentValue === initialValue) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const res = await fetch("/api/admin/update-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, id, field, value: currentValue, sid }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncLogs(data.logs || ["Đã cập nhật thành công!"]);
        // Trigger background refresh to update UI props
        router.refresh();
      } else {
        throw new Error(data.error || "Lỗi không xác định từ Server");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentValue(initialValue);
    setIsEditing(false);
    setSyncLogs(null);
    setError(null);
  };

  if (!isAdminMode) {
    return <>{children}</>;
  }

  const editorUI = (
    <div 
      className={`fixed z-[999999] bg-white border-2 border-indigo-500 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-5 ${isDragging ? "" : "transition-all duration-200 animate-in zoom-in-95"}`}
      style={{
        top: `${dragPos?.y ?? coords.top}px`,
        left: `${dragPos?.x ?? coords.left}px`,
        width: `${coords.width}px`,
        minWidth: '400px',
        maxWidth: '600px',
        maxHeight: '85vh',
        overflowY: 'auto',
        userSelect: isDragging ? 'none' : 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="flex items-center justify-between mb-4 cursor-move select-none group/header"
        onMouseDown={handleMouseDown}
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md w-fit group-hover/header:bg-indigo-100 transition-colors">
            ✥ BẢNG ĐIỀU KHIỂN CHỈNH SỬA
          </span>
          <h3 className="text-sm font-bold text-slate-800 mt-1">Trường: {field}</h3>
        </div>
        <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {!syncLogs ? (
        <>
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
                <X size={18} className="bg-red-100 rounded-full p-0.5" />
                Lỗi lưu dữ liệu!
              </div>
              <p className="text-[12px] text-red-600/80 leading-relaxed font-medium">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-700 underline uppercase tracking-widest"
              >
                Tôi đã đọc - Thử lại
              </button>
            </div>
          )}

          {multiline ? (
            <textarea
              autoFocus
              className={`w-full min-h-[150px] p-4 text-[15px] border-2 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-700 leading-relaxed scrollbar-thin transition-all ${error ? 'border-red-200' : 'border-slate-100'}`}
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          ) : (
            <input
              autoFocus
              className={`w-full p-4 text-[15px] border-2 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-700 font-medium transition-all ${error ? 'border-red-200' : 'border-slate-100'}`}
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          )}
          
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 text-[13px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Lưu & Đồng bộ dữ liệu
            </button>
          </div>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
              <Check size={18} />
              Lưu thành công!
            </div>
            <p className="text-[12px] text-emerald-600/80">Hệ thống đã thực hiện các bước đồng bộ sau:</p>
          </div>
          
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
            {syncLogs.map((log, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-medium text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                {log}
              </div>
            ))}
          </div>

          <button
            onClick={handleCancel}
            className="w-full mt-5 py-3 bg-slate-800 text-white font-bold text-[13px] rounded-xl hover:bg-slate-900 transition-all shadow-lg active:scale-95"
          >
            Đóng thông báo
          </button>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 italic flex justify-between items-center">
        <span className="font-mono">ID: {id}</span>
        {!syncLogs && <span className="bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Admin Mode</span>}
      </div>
    </div>
  );

  const tooltipUI = !isEditing && isHovered && typeof document !== 'undefined' && (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed transition-all duration-200 z-[10000] scale-90 -translate-x-full -translate-y-full"
      style={{
        top: mousePos.y - 10,
        left: mousePos.x - 10,
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white text-[9px] py-2 px-3 rounded-xl shadow-2xl border border-white/10 whitespace-nowrap font-mono flex flex-col gap-1 ring-4 ring-indigo-500/10 pointer-events-auto cursor-default">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-black uppercase tracking-tighter">TABLE:</span>
          <span className="font-bold">{target === 'question' ? 'ToeicQuestion' : target === 'group' ? 'ToeicQuestionGroup' : target}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-black uppercase tracking-tighter">FIELD:</span>
          <span className="font-bold text-emerald-50">{field}</span>
        </div>
        {sid && (
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-black uppercase tracking-tighter">SID:</span>
            <span className="font-bold text-amber-50">{sid}</span>
          </div>
        )}
        <div className="mt-1 pt-1 border-t border-white/10 flex items-center gap-1.5 text-indigo-300 font-bold">
          <Edit2 size={8} /> CLICK TO EDIT
        </div>
      </div>
      <div className="absolute top-full right-4 -mt-1 border-[5px] border-transparent border-t-slate-900/95"></div>
    </div>
  );

  return (
    <span 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`relative inline ${
        isEditing ? "" : `hover:bg-indigo-50/40 rounded px-0.5 -mx-0.5 cursor-help`
      } ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!isEditing) setIsEditing(true);
      }}
    >
      {children}
      {isHovered && !isEditing && createPortal(tooltipUI, document.body)}
      {isEditing && typeof document !== 'undefined' && createPortal(editorUI, document.body)}
    </span>
  );
}
