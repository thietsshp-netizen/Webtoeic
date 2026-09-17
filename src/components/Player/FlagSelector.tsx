"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Flag, PenLine, Check, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type FlagColor = 'RED' | 'PURPLE' | 'BLUE' | 'YELLOW';

interface FlagSelectorProps {
  isFlagged: boolean;
  flagColor?: FlagColor | null;
  flagNote?: string;
  onToggle: (color: FlagColor | null, note?: string) => void;
  onUnflag: (deleteNote: boolean) => void;
  compact?: boolean;
  layout?: 'vertical' | 'horizontal';
}

const COLORS: { name: FlagColor; bg: string; hex: string }[] = [
  { name: 'RED', bg: 'bg-red-500', hex: '#ef4444' },
  { name: 'PURPLE', bg: 'bg-purple-500', hex: '#a855f7' },
  { name: 'BLUE', bg: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'YELLOW', bg: 'bg-amber-500', hex: '#f59e0b' },
];

const COLOR_MAP: Record<FlagColor, string> = {
  RED: '#ef4444',
  PURPLE: '#a855f7',
  BLUE: '#3b82f6',
  YELLOW: '#f59e0b'
};

const FlagIcon = ({ color, size = 16 }: { color?: string | null; size?: number }) => {
  const fillColor = color || 'none';
  const strokeColor = color || 'currentColor';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={fillColor}
      stroke={strokeColor} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="transition-all duration-200 shrink-0"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill={fillColor} />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  );
};

export default function FlagSelector({ 
  isFlagged, 
  flagColor = null, 
  flagNote = "",
  onToggle, 
  onUnflag,
  compact = false,
  layout = 'vertical'
}: FlagSelectorProps) {
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [palettePos, setPalettePos] = useState<{ top: number; left: number; isTop: boolean } | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(flagNote);
  const [isHoveringNote, setIsHoveringNote] = useState(false);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const flagButtonRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setTempNote(flagNote);
  }, [flagNote]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tính toán vị trí hiển thị Portal của dải màu cờ
  const updatePalettePos = () => {
    if (flagButtonRef.current) {
      const rect = flagButtonRef.current.getBoundingClientRect();
      const isTopSpaceAvailable = rect.top > 45;
      setPalettePos({
        top: isTopSpaceAvailable ? rect.top - 34 : rect.bottom + 4,
        left: rect.left + rect.width / 2,
        isTop: isTopSpaceAvailable
      });
    }
  };

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    updatePalettePos();
    setShowColorPalette(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setShowColorPalette(false);
    }, 200);
  };

  useEffect(() => {
    if (showColorPalette) {
      updatePalettePos();
      window.addEventListener('resize', updatePalettePos);
      window.addEventListener('scroll', updatePalettePos, true);
    }
    return () => {
      window.removeEventListener('resize', updatePalettePos);
      window.removeEventListener('scroll', updatePalettePos, true);
    };
  }, [showColorPalette]);

  // Click outside listener kiểm tra chính xác cả flagButtonRef lẫn paletteRef
  useEffect(() => {
    if (!showColorPalette) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const targetNode = e.target as Node;
      const isInsideFlagBtn = flagButtonRef.current && flagButtonRef.current.contains(targetNode);
      const isInsidePalette = paletteRef.current && paletteRef.current.contains(targetNode);
      if (!isInsideFlagBtn && !isInsidePalette) {
        setShowColorPalette(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showColorPalette]);

  const currentColorHex = isFlagged && flagColor ? COLOR_MAP[flagColor] : null;
  const hasNote = flagNote && flagNote.trim().length > 0;

  // Toggle bật/tắt dải màu khi click/touch vào nút cờ
  const handleFlagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updatePalettePos();
    setShowColorPalette(prev => !prev);
  };

  const handleSaveNote = () => {
    onToggle(isFlagged ? (flagColor || 'RED') : null, tempNote);
    setIsEditingNote(false);
  };

  const isVertical = layout === 'vertical';

  return (
    <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-1.5`}>
      
      {/* 1. NÚT GẮN CỜ (FLAG) */}
      <div 
        ref={flagButtonRef}
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={handleFlagClick}
          className={`flag-selector-btn ${compact ? 'p-1.5' : 'p-2.5 px-4'} rounded-xl transition-all flex items-center gap-2 relative border ${
            isFlagged && flagColor
              ? 'bg-slate-50 border-slate-200 shadow-sm' 
              : 'text-slate-400 hover:text-red-500 hover:bg-red-50 border-transparent'
          }`}
          title="Gắn cờ (Click để chọn màu cờ)"
        >
          <FlagIcon 
            size={compact ? 16 : 18} 
            color={currentColorHex}
          />
          {!compact && (
            <span className={`text-[10px] font-black uppercase tracking-widest ${isFlagged ? 'text-slate-700' : 'text-slate-400'}`}>
              {isFlagged ? 'Đã gắn cờ' : 'Gắn cờ'}
            </span>
          )}
        </button>

        {/* Render Dải màu cờ bằng React Portal lên document.body - Tuyệt đối không bao giờ bị cắt bớt/che khuất */}
        {mounted && showColorPalette && palettePos && createPortal(
          <div
            ref={paletteRef}
            className="fixed z-[999999] -translate-x-1/2 pointer-events-auto"
            style={{ top: palettePos.top, left: palettePos.left }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ opacity: 0, y: palettePos.isTop ? 4 : -4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: palettePos.isTop ? 4 : -4, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="bg-slate-900/95 backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.25)] border border-slate-700/80 rounded-full px-1.5 py-1 flex flex-row items-center gap-1 sm:gap-1.5"
            >
              {COLORS.map((c) => {
                const isSelected = isFlagged && flagColor === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (isSelected) {
                        onToggle(null, flagNote); // Click lại đúng màu đang chọn -> gỡ cờ
                      } else {
                        onToggle(c.name, flagNote); // Chọn màu mới!
                      }
                      setShowColorPalette(false);
                    }}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 max-lg:landscape:w-3 max-lg:landscape:h-3 rounded-full border transition-all hover:scale-125 active:scale-90 cursor-pointer ${
                      isSelected 
                        ? 'border-white ring-2 ring-white scale-110 shadow-md' 
                        : 'border-white/80 shadow-xs opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={`Gắn cờ màu ${c.name}`}
                  />
                );
              })}
            </motion.div>
          </div>,
          document.body
        )}
      </div>

      {/* 2. NÚT GHI CHÚ (PEN) */}
      <div
        className="relative"
        onMouseEnter={() => setIsHoveringNote(true)}
        onMouseLeave={() => setIsHoveringNote(false)}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsEditingNote(true);
          }}
          className={`note-selector-btn ${compact ? 'p-1.5' : 'p-2.5 px-4'} rounded-xl transition-all flex items-center gap-2 relative border ${
            hasNote
              ? 'bg-blue-50 border-blue-100 text-blue-600 shadow-sm'
              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-transparent'
          }`}
          title="Ghi chú"
        >
          <PenLine size={compact ? 16 : 18} />
          {!compact && (
            <span className={`text-[10px] font-black uppercase tracking-widest ${hasNote ? 'text-blue-700' : 'text-slate-400'}`}>
              Ghi chú
            </span>
          )}
          {hasNote && (
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse ml-0.5" />
          )}
        </button>

        {/* Hover Tooltip/Xem nhanh ghi chú */}
        <AnimatePresence>
          {isHoveringNote && !isEditingNote && hasNote && (
            <motion.div
              initial={{ opacity: 0, y: isVertical ? -10 : -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isVertical ? -10 : -10, scale: 0.95 }}
              className={`absolute w-64 z-[100] pointer-events-none ${
                isVertical 
                  ? 'left-full top-0 ml-2' 
                  : 'top-full left-1/2 -translate-x-1/2 mt-2'
              }`}
            >
              <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 relative">
                <div className="flex items-center gap-1.5 mb-2">
                  <PenLine size={12} className="text-blue-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ghi chú của bạn</span>
                </div>
                <p className="text-[12px] leading-relaxed font-medium line-clamp-6 italic text-slate-100">
                  "{flagNote}"
                </p>
                <div className={`absolute w-2 h-2 bg-slate-900/90 rotate-45 border-white/10 ${
                  isVertical
                    ? '-left-1 top-4 border-l border-b'
                    : '-top-1 left-1/2 -translate-x-1/2 border-l border-t'
                }`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. BẢNG GHI CHÚ (DRAGGABLE PORTAL) */}
      {isEditingNote && mounted && createPortal(
        <motion.div 
          drag
          dragMomentum={false}
          className="fixed top-1/2 left-1/2 -ml-40 -mt-40 z-[999999] space-y-3 w-80 bg-white p-5 rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.25)] border border-slate-200 cursor-default"
          style={{ touchAction: 'none' }}
        >
          <div className="flex items-center justify-between cursor-move pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
              <div>
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none mb-0.5">Ghi chú học tập</h4>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Kéo để di chuyển</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Nút xóa ghi chú chuyên biệt trên góc */}
              {hasNote && (
                <button 
                  onClick={() => {
                    onToggle(isFlagged ? (flagColor || 'RED') : null, "");
                    setTempNote("");
                    setIsEditingNote(false);
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1"
                  title="Xóa ghi chú"
                >
                  <Trash2 size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Xóa</span>
                </button>
              )}
              <button 
                onClick={() => setIsEditingNote(false)} 
                className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="flag-note-textarea"
              ref={textareaRef}
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                  e.preventDefault();
                  handleSaveNote();
                }
              }}
              placeholder="Ghi lại lưu ý cho câu này..."
              className="w-full h-40 p-4 text-sm bg-slate-50/50 rounded-2xl border-none focus:ring-2 focus:ring-blue-50 resize-none placeholder:text-slate-300 font-medium leading-relaxed transition-all"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Đã đồng bộ</span>
            </div>
            <button 
              onClick={handleSaveNote}
              className="flex flex-col items-center justify-center bg-blue-600 text-white px-5 py-1.5 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-1 font-black text-[11px] tracking-widest uppercase">
                <Check size={13} /> LƯU
              </div>
              <span className="text-[8px] font-bold opacity-80 mt-0.5 normal-case tracking-normal">(shift + enter)</span>
            </button>
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}
