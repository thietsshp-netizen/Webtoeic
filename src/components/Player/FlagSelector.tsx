"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Flag, PenLine, Check, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type FlagColor = 'RED' | 'PURPLE' | 'BLUE' | 'YELLOW';

interface FlagSelectorProps {
  isFlagged: boolean;
  flagColor?: FlagColor;
  flagNote?: string;
  onToggle: (color: FlagColor, note?: string) => void;
  onUnflag: (deleteNote: boolean) => void;
  compact?: boolean;
}

const COLORS: { name: FlagColor; class: string; bg: string }[] = [
  { name: 'RED', class: 'text-red-500 fill-red-500', bg: 'bg-red-500' },
  { name: 'PURPLE', class: 'text-purple-500 fill-purple-500', bg: 'bg-purple-500' },
  { name: 'BLUE', class: 'text-blue-500 fill-blue-500', bg: 'bg-blue-500' },
  { name: 'YELLOW', class: 'text-yellow-500 fill-yellow-500', bg: 'bg-yellow-500' },
];

export default function FlagSelector({ 
  isFlagged, 
  flagColor = 'RED', 
  flagNote = "",
  onToggle, 
  onUnflag,
  compact = false
}: FlagSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(flagNote);
  const [showConfirmUnflag, setShowConfirmUnflag] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [vAlign, setVAlign] = useState<'top' | 'bottom'>('top');
  const [hAlign, setHAlign] = useState<'left' | 'right' | 'center'>('center');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setTempNote(flagNote);
  }, [flagNote]);

  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (showPicker) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      if (rect.left < windowWidth * 0.65) {
        setHAlign('left');
      } else if (rect.right > windowWidth * 0.85) {
        setHAlign('right');
      } else {
        setHAlign('center');
      }

      if (rect.top < windowHeight * 0.4) {
        setVAlign('bottom');
      } else {
        setVAlign('top');
      }
    }
  };

  const activeColor = COLORS.find(c => c.name === flagColor) || COLORS[0];

  const handleMainClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updatePosition();
    if (!isFlagged) {
      onToggle('RED', flagNote);
      setShowPicker(true);
    } else {
      setShowPicker(!showPicker);
    }
  };

  const handleSaveNote = () => {
    onToggle(flagColor, tempNote);
    setIsEditingNote(false);
    setShowPicker(false);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      {/* Main Flag Button */}
      <div className="relative group">
        <button
          ref={buttonRef}
          onClick={handleMainClick}
          onMouseEnter={() => {
            updatePosition();
            setIsHovering(true);
          }}
          onMouseLeave={() => setIsHovering(false)}
          className={`${compact ? 'p-1.5' : 'p-2.5 px-4'} rounded-xl transition-all flex items-center gap-2 relative border ${
            isFlagged 
              ? 'bg-slate-50 border-slate-200 shadow-sm' 
              : 'text-slate-400 hover:text-red-500 hover:bg-red-50 border-transparent'
          }`}
          title={isFlagged ? "Sửa cờ/ghi chú" : "Gắn cờ và Ghi chú"}
        >
          <Flag 
            size={compact ? 16 : 18} 
            className={`transition-colors ${isFlagged ? activeColor.class : ''}`} 
          />
          {!compact && (
            <span className={`text-[10px] font-black uppercase tracking-widest ${isFlagged ? 'text-slate-700' : 'text-slate-400'}`}>
              {isFlagged ? 'Đã gắn cờ' : 'Gắn cờ'}
            </span>
          )}
          {isFlagged && flagNote && (
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse ml-1" />
          )}
        </button>

        {/* Hover Tooltip for Note */}
        <AnimatePresence>
          {isHovering && isFlagged && flagNote && !showPicker && !isEditingNote && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute w-64 z-[100] pointer-events-none top-full mt-2 left-0"
            >
              <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 relative">
                <div className="flex items-center gap-1.5 mb-2">
                  <PenLine size={12} className="text-blue-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ghi chú của bạn</span>
                </div>
                <p className="text-[12px] leading-relaxed font-medium line-clamp-6 italic text-slate-100">
                  "{flagNote}"
                </p>
                <div className="absolute w-2 h-2 bg-slate-900/90 rotate-45 border-white/10 -top-1 border-l border-t left-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Color Picker Popover - MINIMAL SIZE */}
        <AnimatePresence>
          {(showPicker || showConfirmUnflag) && (
            <motion.div 
              initial={{ opacity: 0, y: vAlign === 'top' ? -5 : 5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: vAlign === 'top' ? -5 : 5, scale: 0.9 }}
              className={`absolute z-[110] ${
                vAlign === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'
              } ${
                hAlign === 'left' ? 'left-0' : hAlign === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-slate-100 rounded-full p-0.5 flex flex-col items-center gap-1">
                {showConfirmUnflag ? (
                  <div className="w-24 p-2 space-y-1.5">
                    <p className="text-[8px] font-black text-slate-500 text-center uppercase tracking-tighter">Xoá?</p>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => { onUnflag(true); setShowConfirmUnflag(false); setShowPicker(false); }}
                        className="w-full py-1 bg-red-50 text-red-600 rounded-md text-[8px] font-black hover:bg-red-100 uppercase"
                      >
                        Hết
                      </button>
                      <button 
                        onClick={() => { onUnflag(false); setShowConfirmUnflag(false); setShowPicker(false); }}
                        className="w-full py-1 bg-slate-50 text-slate-600 rounded-md text-[8px] font-black hover:bg-slate-100 uppercase"
                      >
                        Cờ
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(c.name, flagNote);
                        }}
                        className={`w-4 h-4 rounded-full border-[1px] transition-all hover:scale-110 active:scale-90 ${
                          isFlagged && flagColor === c.name 
                            ? 'border-slate-800 scale-105 shadow-md' 
                            : 'border-white shadow-sm'
                        } ${c.bg}`}
                      />
                    ))}
                    <div className="w-2.5 h-[1px] bg-slate-100 my-0.5" />
                    <button 
                      onClick={() => { setIsEditingNote(true); setShowPicker(false); }}
                      className={`w-5 h-5 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90 ${flagNote ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:text-blue-600'}`}
                    >
                      <PenLine size={10} />
                    </button>
                    <div className="w-2.5 h-[1px] bg-slate-100 my-0.5" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (flagNote && flagNote.trim().length > 0) setShowConfirmUnflag(true);
                        else { onUnflag(true); setShowPicker(false); }
                      }}
                      className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={10} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Draggable Note Editor (Portal) */}
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
            <button 
              onClick={() => setIsEditingNote(false)} 
              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
          <div className="relative group">
            <textarea
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
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-1.5xl text-[12px] font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
            >
              <Check size={16} /> Lưu ghi chú
            </button>
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}
