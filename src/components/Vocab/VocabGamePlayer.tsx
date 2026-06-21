"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "mobile-drag-drop/default.css";
import { Star, Volume2, RotateCcw, ChevronRight, ChevronLeft, BookOpen, Shuffle, PenLine, Link2, Lightbulb, Replace, Layers, HelpCircle, Compass } from "lucide-react";
import confetti from "canvas-confetti";
import { AnimatePresence } from "framer-motion";
import VocabDeckSelector from "./VocabDeckSelector";
import VocabGuideModal from "@/components/Vocab/VocabGuideModal";
import { startVocabTour } from "@/components/Toeic/toeicTour";
import { speakVocab } from "@/lib/vocab-audio";

export interface VocabWord {
  id: number | string;
  word: string;
  ipa: string;
  mean: string;
  ex: string;
  exVi: string;
  syns: string[];
  synonyms?: string;
  antonyms?: string;
  collocations?: string;
  wordFamily?: string;
  isUnlearned?: boolean;
  source?: 'dictionary' | 'course';
  dbId?: string; // Original ID in DB
  vocabDayId?: string; // Original VocabDay ID for course words
  wordId?: number; // Original word index in JSON data
}

interface VocabGamePlayerProps {
  vocabDayId: string;
  dayNumber: number;
  title: string;
  data: VocabWord[];
  userId?: string;
}

type Tab = "library" | "scramble" | "fill" | "match" | "synonym";
type FilterMode = "all" | "starred";

function speak(text: string) {
  speakVocab(text, 'us');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function limitMeanings(mean: string): string {
  if (!mean) return "";
  const parts = mean.split(/[;/]/).map(p => p.trim()).filter(Boolean);
  if (parts.length <= 2) return mean;
  return parts.slice(0, 2).join("; ");
}

function getWordFontSize(word: string): string {
  if (!word) return "text-2xl sm:text-3xl";
  if (word.length > 15) return "text-lg sm:text-xl break-all";
  if (word.length > 10) return "text-xl sm:text-2xl break-words";
  return "text-2xl sm:text-3xl break-words";
}

// ---- FLASHCARD COMPONENT ----
function FlashCard({
  word,
  isInNotebook,
  isUnlearned,
  currentDeckId,
  currentDeckName,
  onSelectDeck,
  onUnstar,
  onToggleUnlearned,
  index,
  globalFlip
}: {
  word: VocabWord;
  isInNotebook: boolean;
  isUnlearned: boolean;
  currentDeckId: string | null | undefined;
  currentDeckName?: string;
  onSelectDeck: (deckId: string | null) => Promise<void>;
  onUnstar: () => Promise<void>;
  onToggleUnlearned: () => void;
  index: number;
  globalFlip: "front" | "back" | null;
}) {
  const [flipped, setFlipped] = useState(false);
  const [showDeckSelector, setShowDeckSelector] = useState(false);

  useEffect(() => {
    if (globalFlip === "front") setFlipped(false);
    if (globalFlip === "back") setFlipped(true);
  }, [globalFlip]);

  return (
    <div
      className="relative h-[420px] sm:h-[480px] cursor-pointer group/card"
      style={{ perspective: "1000px" }}
      onClick={() => { setFlipped(!flipped); speak(word.word); }}
    >
      {/* Stationary Bookmark Button (Unlearned) - Left */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleUnlearned(); }}
        className={`absolute top-3 left-3 p-1.5 rounded-lg transition-all vocab-unlearned-toggle-btn z-[60] ${isUnlearned ? "text-rose-500 bg-rose-50 scale-105 shadow-sm ring-1 ring-rose-100" : "text-slate-200 hover:text-rose-400 hover:bg-slate-50"}`}
        title="Đánh dấu chưa thuộc"
      >
        <BookOpen size={16} fill={isUnlearned ? "currentColor" : "none"} />
      </button>

      {/* Index number - Center Top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-50 rounded-full text-[8px] text-slate-400 font-black tracking-widest border border-slate-100 shadow-sm z-[60] pointer-events-none">
        #{index + 1}
      </div>

      {/* Stationary Star Button (Notebook) - Right */}
      <div className="absolute top-3 right-3 z-[60]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowDeckSelector(!showDeckSelector)}
          className={`p-1.5 rounded-lg transition-all vocab-star-toggle-btn ${isInNotebook ? "text-amber-400 bg-amber-50 scale-105 shadow-sm ring-1 ring-amber-100" : "text-slate-200 hover:text-amber-300 hover:bg-slate-50"}`}
          title="Lưu/xoá từ khỏi từ vựng của bạn"
        >
          <Star size={16} fill={isInNotebook ? "currentColor" : "none"} />
        </button>
        <AnimatePresence>
          {showDeckSelector && (
            <VocabDeckSelector
              word={word.word}
              currentDeckId={currentDeckId}
              onSelectDeck={async (deckId) => {
                await onSelectDeck(deckId);
              }}
              onUnstar={async () => {
                await onUnstar();
                setShowDeckSelector(false);
              }}
              onClose={() => setShowDeckSelector(false)}
            />
          )}
        </AnimatePresence>
      </div>

      <div
        className="absolute inset-0 transition-transform duration-700 ease-in-out"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}
      >
        {/* Front */}
        <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-2 border-slate-200 p-5 sm:p-8 flex flex-col backface-hidden group-hover/card:shadow-xl transition-all overflow-hidden">
          <div className="mt-6 sm:mt-10 mb-2">
            <div className={`font-black text-blue-600 mb-2 flex items-center gap-3 flex-wrap ${getWordFontSize(word.word)}`}>
              <span>{word.word}</span>
              <button onClick={(e) => { e.stopPropagation(); speak(word.word); }} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0">
                <Volume2 size={20} className="text-blue-400 hover:text-blue-600" />
              </button>
            </div>
            <div className="text-orange-400 font-bold italic text-sm mb-4">
              /{word.ipa?.replace(/\//g, '')}/
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
            <div className="text-slate-600 text-sm sm:text-[15px] leading-relaxed font-medium break-words" dangerouslySetInnerHTML={{ __html: word.ex }} />
          </div>

          {word.syns.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-50 text-[10px] text-teal-600 font-black uppercase tracking-[0.1em] flex items-center gap-2 flex-wrap">
              <span className="opacity-50 italic lowercase font-bold flex-shrink-0">Hints:</span>
              <span className="bg-teal-50 px-2 py-0.5 rounded-lg flex gap-2 flex-wrap break-words">
                {word.syns
                  .filter(s => s && s.toString() !== '[object Object]')
                  .slice(0, 2)
                  .map(s => {
                    const text = typeof s === 'object' ? (s as any).word : s;
                    return text.replace(/\s*\(.*?\)/g, '').toLowerCase();
                  })
                  .join(", ")}
              </span>
            </div>
          )}
          {/* Deck Name */}
          <div className="mt-auto pt-4 text-center text-[10px] text-slate-400 font-bold tracking-wide italic">
            ({currentDeckName || "bộ thẻ tổng"})
          </div>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 bg-indigo-50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-4 border-indigo-200 p-5 sm:p-8 flex flex-col overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="mt-6 sm:mt-10 mb-4">
            <div className={`font-black text-blue-600 mb-2 ${getWordFontSize(word.word)}`}>{word.word}</div>
            <div className="text-red-500 font-black text-base sm:text-lg tracking-tight leading-tight break-words">{limitMeanings(word.mean)}</div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] flex-1 overflow-y-auto pr-2 scrollbar-hide">
            <div className="flex flex-col gap-2">
              <div className="text-slate-700 leading-relaxed font-medium bg-white/40 p-3 sm:p-4 rounded-2xl border border-white/60 shadow-sm break-words" dangerouslySetInnerHTML={{ __html: word.ex }} />
              {word.exVi && (
                <div className="text-slate-500 italic leading-relaxed pl-4 border-l-2 border-blue-200 py-1 bg-slate-50/50 rounded-r-xl pr-3 text-xs sm:text-[13px] break-words" dangerouslySetInnerHTML={{ __html: word.exVi }} />
              )}
            </div>

            <div className="pt-4 space-y-6 border-t border-slate-100 mt-6 pb-4">
              {/* SYNONYMS */}
              {(() => {
                const raw = word.synonyms?.includes('[object Object]') ? '' : (word.synonyms || (word.syns.length > 0 ? word.syns.filter(s => s && s.toString() !== '[object Object]').map(s => typeof s === 'object' ? (s as any).word : s).join(', ') : ''));
                if (!raw || raw === '---' || !raw.trim()) return null;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest">
                      <div className="w-5 h-5 rounded-lg bg-teal-50 flex items-center justify-center">
                        <Link2 size={12} strokeWidth={3} />
                      </div>
                      ĐỒNG NGHĨA
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {raw.split(',').slice(0, 2).map((s, i) => {
                        const parts = s.trim().split(/(\(.*?\))/);
                        return (
                          <div key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/80 shadow-sm text-[12px] font-bold flex items-center gap-1.5">
                            <span>{parts[0].trim()}</span>
                            {parts[1] && <span className="text-[10px] opacity-60 font-medium">{parts[1]}</span>}
                            <button onClick={(e) => { e.stopPropagation(); speak(parts[0].trim()); }} className="hover:text-emerald-900 opacity-60 hover:opacity-100 transition-all ml-0.5">
                              <Volume2 size={11} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ANTONYMS */}
              {(() => {
                const raw = word.antonyms;
                if (!raw || raw === '---' || !raw.trim()) return null;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                      <div className="w-5 h-5 rounded-lg bg-rose-50 flex items-center justify-center">
                        <Replace size={12} strokeWidth={3} />
                      </div>
                      TRÁI NGHĨA
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {raw.split(',').slice(0, 2).map((s, i) => {
                        const parts = s.trim().split(/(\(.*?\))/);
                        return (
                          <div key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100/80 shadow-sm text-[12px] font-bold flex items-center gap-1.5">
                            <span>{parts[0].trim()}</span>
                            {parts[1] && <span className="text-[10px] opacity-60 font-medium">{parts[1]}</span>}
                            <button onClick={(e) => { e.stopPropagation(); speak(parts[0].trim()); }} className="hover:text-rose-900 opacity-60 hover:opacity-100 transition-all ml-0.5">
                              <Volume2 size={11} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* COLLOCATIONS */}
              {(() => {
                const raw = word.collocations;
                if (!raw || raw === '---' || !raw.trim()) return null;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                      <div className="w-5 h-5 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Layers size={12} strokeWidth={3} />
                      </div>
                      CỤM TỪ ĐI KÈM
                    </div>
                    <div className="space-y-2">
                      {raw.split(',').slice(0, 3).map((s, i) => {
                        const parts = s.trim().split(/[:|-]/);
                        return (
                          <div key={i} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100/50 flex items-center gap-3 group/item hover:border-indigo-200 transition-all">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover/item:scale-150 transition-transform"></div>
                            <div className="flex flex-col">
                              <span className="text-[12px] font-black text-slate-800">{parts[0].trim()}</span>
                              {parts[1] && <span className="text-[10px] text-slate-500 font-medium italic">{parts[1].trim()}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* WORD FAMILY */}
              {word.wordFamily && word.wordFamily !== '---' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                    <div className="w-5 h-5 rounded-lg bg-orange-50 flex items-center justify-center">
                      <BookOpen size={12} strokeWidth={3} />
                    </div>
                    GIA ĐÌNH TỪ
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {word.wordFamily.split(',').slice(0, 4).map((s, i) => (
                      <div key={i} className="px-3 py-1.5 bg-orange-50/50 text-orange-700 rounded-xl border border-orange-100/50 text-[11px] font-bold italic shadow-sm">
                        {s.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Deck Name (Back) */}
          <div className="mt-auto pt-4 text-center text-[10px] text-slate-400/80 font-bold tracking-wide italic">
            ({currentDeckName || "bộ thẻ tổng"})
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- SCRAMBLE TAB ----
export function ScrambleGame({ words, onSRSUpdate }: { words: VocabWord[], onSRSUpdate?: (word: string, definition: string, isCorrect: boolean) => void }) {
  const [list] = useState(() => [...words].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [canNext, setCanNext] = useState(false);
  const [showAns, setShowAns] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<number | null>(null);

  const changeIdx = (newVal: number | ((prev: number) => number)) => {
    setIdx(prev => {
      const nextVal = typeof newVal === 'function' ? newVal(prev) : newVal;
      setDirection(nextVal > prev ? 'next' : 'prev');
      return nextVal;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEndClientX = e.changedTouches[0].clientX;
    const distance = touchStartRef.current - touchEndClientX;
    touchStartRef.current = null;

    const minSwipeDistance = 50;
    if (distance > minSwipeDistance && idx < list.length - 1) {
      changeIdx(i => i + 1);
    } else if (distance < -minSwipeDistance && idx > 0) {
      changeIdx(i => i - 1);
    }
  };

  const item = list[idx];
  const scrambled = useMemo(() => {
    if (!item) return "";
    return item.word.split("").sort(() => Math.random() - 0.5).join("").toUpperCase();
  }, [item?.word]);

  useEffect(() => {
    setInput(""); setMsg(null); setCanNext(false); setShowAns(false);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(focusTimer);
  }, [idx, item]);

  // Ensure focus when clicking anywhere in the game card
  const handleCardClick = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`") {
        e.preventDefault();
        if (item) speak(item.word);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item]);

  useEffect(() => {
    if (item && input.trim().toLowerCase() === item.word.toLowerCase() && !canNext) {
      if (onSRSUpdate) onSRSUpdate(item.word, item.mean, true);
      setMsg({ text: "✨ TUYỆT VỜI! CHÚC MỪNG BẠN! Nhấn Enter để tiếp tục", ok: true });
      speak(item.word);
      setCanNext(true);

      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
      });

      // Play success sound
      const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
      audio.play().catch(() => { });
    }
  }, [input, item, canNext]);

  if (!item) return <div className="text-center py-20 text-2xl font-black text-slate-400">🎉 Hoàn thành!</div>;

  const handleCheck = () => {
    if (canNext) {
      changeIdx(i => i + 1);
      return;
    }
    if (input.trim().toLowerCase() === item.word.toLowerCase()) {
      // Logic handled by useEffect now, but kept for button fallback
      changeIdx(i => i + 1);
    } else {
      setMsg({ text: "❌ Chưa đúng, hãy kiểm tra lại!", ok: false });
      // Shake animation is already handled visually by each character slot
    }
  };

  return (
    <div 
      key={idx}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`max-w-lg mx-auto text-center space-y-6 animate-in fade-in duration-300 ${
        direction === 'next' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'
      }`}
    >
      <div
        className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 sm:p-8 cursor-text"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <button onClick={() => speak(item.word)} className="p-2 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
            <Volume2 size={20} />
          </button>
          <span className="text-slate-400 text-sm font-medium">/{item.ipa}/</span>
          <span className="text-red-500 font-bold">{limitMeanings(item.mean)}</span>
        </div>
        <div className="text-2xl sm:text-4xl font-black tracking-[0.3em] text-slate-700 mb-4 sm:mb-8 bg-slate-50 rounded-2xl py-4 sm:py-6">{scrambled}</div>
        
        <div className="flex justify-center mb-4 sm:mb-8">
          <div 
            className="relative w-full max-w-sm h-16 sm:h-24 bg-white rounded-3xl border-2 border-slate-100 flex items-center justify-center shadow-sm group focus-within:border-blue-400 transition-all cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            {/* Centered Wrapper for both layers */}
            <div className="relative inline-flex items-center">
              {/* Visual Layer (Underneath Input, but selective pointer events) */}
              <div className="relative flex items-center font-mono text-xl sm:text-3xl font-black tracking-[0.4em] uppercase z-20 pointer-events-none pr-[0.4em]">
                {item.word.split("").map((char, i) => {
                  const typed = input[i];
                  if (!typed) return <span key={i} className="text-slate-100">.</span>;
                  const isCorrect = typed.toLowerCase() === char.toLowerCase();
                  return (
                    <span 
                      key={i} 
                      className={`${isCorrect ? "text-emerald-500" : "text-red-500"} ${!isCorrect ? "animate-shake inline-block" : ""} pointer-events-auto cursor-help`}
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.focus();
                      }}
                    >
                      {typed}
                    </span>
                  );
                })}
              </div>

              {/* Real Input Layer (Underneath Visual, but receives clicks) */}
              <input
                ref={inputRef}
                value={input}
                onChange={e => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9\s-]/gi, "");
                  if (val.length <= item.word.length) {
                    setInput(val);
                    setMsg(null);
                    setCanNext(false);
                  }
                }}
                onKeyDown={e => { 
                  if (e.key === "Enter") { 
                    e.preventDefault(); 
                    handleCheck(); 
                  } 
                }}
                style={{ WebkitTextFillColor: "transparent", color: "transparent" }}
                className="absolute inset-0 w-full h-full bg-transparent caret-blue-600 outline-none text-left text-xl sm:text-3xl font-mono font-black tracking-[0.4em] uppercase z-10 pr-[0.4em]"
                autoComplete="off"
                autoFocus
                inputMode="text"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 text-left px-2">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Gợi ý: {item.word.length} ký tự
          </span>
        </div>

        {msg && (
          <div className={`mt-3 font-bold text-sm ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</div>
        )}
        {showAns && <div className="mt-2 text-blue-600 font-black text-lg">👉 {item.word}</div>}
        <div className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden lg:flex items-center justify-center gap-2">
          <span>Mẹo: Nhấn phím</span>
          <kbd className="px-2 py-1 bg-slate-800 text-white rounded-lg border-b-2 border-slate-950 font-black shadow-md">`</kbd>
          <span className="ml-1 text-[#94a3b8] normal-case font-bold">(dấu huyền)</span>
          <span>để nghe âm thanh</span>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => { 
            setShowAns(true); 
            speak(item.word); 
            if (onSRSUpdate) onSRSUpdate(item.word, item.mean, false);
          }} 
          className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
        >
          Xem đáp án
        </button>
        <button onClick={() => changeIdx(i => i + 1)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors flex items-center gap-2">Tiếp theo <ChevronRight size={16} /></button>
      </div>
      <div className="text-sm text-slate-400">{idx + 1} / {list.length}</div>
    </div>
  );
}

// ---- FILL IN THE BLANK ----
export function FillGame({ words, allWords, onSRSUpdate }: { words: VocabWord[]; allWords: VocabWord[]; onSRSUpdate?: (word: string, definition: string, isCorrect: boolean) => void }) {
  const [list] = useState(() => [...words].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [revealed, setRevealed] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  const changeIdx = (newVal: number | ((prev: number) => number)) => {
    setIdx(prev => {
      const nextVal = typeof newVal === 'function' ? newVal(prev) : newVal;
      setDirection(nextVal > prev ? 'next' : 'prev');
      return nextVal;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEndClientX = e.changedTouches[0].clientX;
    const distance = touchStartRef.current - touchEndClientX;
    touchStartRef.current = null;

    const minSwipeDistance = 50;
    if (distance > minSwipeDistance && isCorrect && idx < list.length - 1) {
      changeIdx(i => i + 1);
    } else if (distance < -minSwipeDistance && idx > 0) {
      changeIdx(i => i - 1);
    }
  };

  const item = list[idx];

  const actualWord = useMemo(() => {
    if (!item) return "";
    const cleanEx = stripHtml(item.ex);
    const regex = new RegExp(`\\b${item.word}[a-z]*\\b`, "gi");
    const match = cleanEx.match(regex);
    return match ? match[0] : item.word;
  }, [item]);

  const sentenceParts = useMemo(() => {
    if (!item || !actualWord) return [];
    return stripHtml(item.ex).split(new RegExp(`(${actualWord})`, "gi"));
  }, [item, actualWord]);

  const distractors = useMemo(() => {
    if (!item) return [];
    const others = allWords
      .filter(w => w.word !== item.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.word);
    return [item.word, ...others].sort(() => Math.random() - 0.5);
  }, [item?.id, allWords]);

  useEffect(() => {
    setRevealed([]);
    setIsCorrect(false);
  }, [idx, item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`") {
        e.preventDefault();
        if (item) speak(item.word);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item]);

  if (!item) return <div className="text-center py-20 text-2xl font-black text-slate-400">🎉 Hoàn thành!</div>;

  const handleChoice = (d: string) => {
    if (isCorrect) return;
    if (d.toLowerCase() === item.word.toLowerCase()) {
      setIsCorrect(true);
      if (onSRSUpdate) onSRSUpdate(item.word, item.mean, true);
      speak(item.word);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
      });
      const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
      audio.play().catch(() => { });
    } else {
      if (onSRSUpdate) onSRSUpdate(item.word, item.mean, false);
      setRevealed(prev => [...new Set([...prev, d])]);
    }
  };

  return (
    <div 
      key={idx}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 ${
        direction === 'next' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'
      }`}
    >
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 sm:p-8 text-center">
        <div className="text-xl sm:text-2xl font-black text-red-500 mb-4 sm:mb-6">{limitMeanings(item.mean)}</div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-6 text-slate-700 text-lg sm:text-xl font-bold italic mb-4 sm:mb-8">
          &ldquo;
          {sentenceParts.map((p, i) => (
            p.toLowerCase() === actualWord.toLowerCase()
              ? (isCorrect ? <span key={i} className="text-emerald-600 border-b-2 border-emerald-500 font-black mx-1">{p}</span> : <span key={i} className="text-blue-400 font-black mx-1 tracking-widest">_______</span>)
              : <span key={i}>{p}</span>
          ))}
          &rdquo;
        </div>

        {isCorrect && (
          <div className="mb-6 py-2">
            <div className="text-emerald-600 font-black text-sm uppercase tracking-widest animate-bounce">✨ Chính xác! Tuyệt vời</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {distractors.map((d, i) => {
            const isRevealed = revealed.includes(d);
            const source = allWords.find(w => w.word === d);
            return (
              <button
                key={i}
                onClick={() => handleChoice(d)}
                className={`px-4 py-3 border font-bold rounded-2xl transition-all shadow-sm text-sm flex flex-col items-center justify-center min-h-[64px] ${
                  isRevealed
                    ? "bg-rose-50 border-rose-200 text-rose-600 shadow-inner"
                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:scale-[1.02]"
                }`}
              >
                <span className={`font-bold leading-tight text-center ${isRevealed ? "text-[10px] sm:text-[13px]" : (d.length > 12 ? "text-[11px] sm:text-base" : d.length > 10 ? "text-[12px] sm:text-base" : "text-sm sm:text-base")}`}>{d}</span>
                {isRevealed && (
                  <span className="text-[10px] font-medium opacity-80 mt-1 leading-tight text-center">
                    {limitMeanings(source?.mean || "---")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => changeIdx(i => i + 1)} disabled={!isCorrect} className={`px-10 py-4 font-black rounded-2xl transition-all flex items-center gap-2 ${isCorrect ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-slate-100 text-slate-400 opacity-50"}`}>
          Tiếp theo <ChevronRight size={18} />
        </button>
      </div>
      <div className="text-sm text-slate-400 text-center">{idx + 1} / {list.length}</div>
      <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden lg:flex items-center justify-center gap-2">
        <span>Mẹo: Nhấn phím</span>
        <kbd className="px-2 py-1 bg-slate-800 text-white rounded-lg border-b-2 border-slate-950 font-black shadow-md">`</kbd>
        <span className="ml-1 text-[#94a3b8] normal-case font-bold">(dấu huyền)</span>
        <span>để nghe âm thanh</span>
      </div>
    </div>
  );
}

// ---- MATCH (DRAG & DROP) ----
export function MatchGame({ words, onSRSUpdate }: { words: VocabWord[], onSRSUpdate?: (word: string, definition: string, isCorrect: boolean) => void }) {
  const getSet = useCallback(() => [...words].sort(() => Math.random() - 0.5).slice(0, 4), [words]);
  const [set, setSet] = useState(getSet);
  const [matched, setMatched] = useState<Record<string | number, boolean>>({});
  const [dragging, setDragging] = useState<string | number | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const viWords = useMemo(() => [...set].sort(() => Math.random() - 0.5), [set]);

  const handleDrop = (targetId: string | number, sourceId?: string | number) => {
    const finalSourceId = sourceId ?? dragging;
    if (finalSourceId === targetId) {
      const w = set.find(x => x.id === targetId);
      if (w && onSRSUpdate) {
        onSRSUpdate(w.word, w.mean, true);
      }
      setMatched(m => ({ ...m, [targetId]: true }));
      speak(w?.word || "");
    }
    setDragging(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-3 sm:p-8">
        <div className="space-y-3 mb-6">
          {set.map(w => (
            <div key={w.id} className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => speak(w.word)} className="w-[115px] sm:w-40 flex items-center gap-1 sm:gap-3 bg-blue-50 hover:bg-blue-100 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 transition-colors font-black text-blue-700 text-xs sm:text-base flex-shrink-0">
                <span className="truncate">{w.word}</span> <Volume2 size={12} className="text-blue-400 flex-shrink-0" />
              </button>
              <div
                onClick={() => {
                  if (selectedId !== null) {
                    handleDrop(w.id, selectedId);
                    setSelectedId(null);
                  }
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(w.id)}
                className={`flex-1 min-h-[2.5rem] sm:min-h-[3rem] p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-dashed flex items-center justify-center transition-all text-xs sm:text-sm leading-tight text-center cursor-pointer ${
                  selectedId !== null && !matched[w.id] ? "border-indigo-300 bg-indigo-50/10" : "border-blue-200 bg-white"
                } ${matched[w.id] ? "bg-emerald-50 border-emerald-300 text-emerald-600 font-bold" : ""}`}
              >
                {matched[w.id] ? limitMeanings(w.mean) : ""}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center p-3 sm:p-4 bg-slate-50 rounded-2xl">
          {viWords.filter(w => !matched[w.id]).map(w => (
            <div
              key={w.id}
              draggable
              onDragStart={() => setDragging(w.id)}
              onClick={() => {
                setSelectedId(prev => prev === w.id ? null : w.id);
              }}
              style={{ touchAction: "none" }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-white font-bold rounded-lg sm:rounded-xl cursor-grab active:cursor-grabbing shadow-sm hover:scale-105 transition-all text-xs sm:text-sm ${
                selectedId === w.id ? "bg-blue-600 scale-105 ring-4 ring-blue-300" : "bg-amber-400"
              }`}
            >{limitMeanings(w.mean)}</div>
          ))}
        </div>
      </div>
      {Object.keys(matched).length === set.length && (
        <div className="text-center">
          <button onClick={() => { setSet(getSet()); setMatched({}); setSelectedId(null); }} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
            <RotateCcw size={16} /> Bộ từ mới
          </button>
        </div>
      )}
    </div>
  );
}

// ---- SYNONYM ----
export function SynonymGame({ words, onSRSUpdate }: { words: VocabWord[], onSRSUpdate?: (word: string, definition: string, isCorrect: boolean) => void }) {
  const withSyns = words.filter(w => w.syns.length > 0);
  const [list] = useState(() => [...withSyns].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [dropped, setDropped] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  const changeIdx = (newVal: number | ((prev: number) => number)) => {
    setIdx(prev => {
      const nextVal = typeof newVal === 'function' ? newVal(prev) : newVal;
      setDirection(nextVal > prev ? 'next' : 'prev');
      return nextVal;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEndClientX = e.changedTouches[0].clientX;
    const distance = touchStartRef.current - touchEndClientX;
    touchStartRef.current = null;

    const minSwipeDistance = 50;
    if (distance > minSwipeDistance && isCompleted && idx < list.length - 1) {
      changeIdx(i => i + 1);
    } else if (distance < -minSwipeDistance && idx > 0) {
      changeIdx(i => i - 1);
    }
  };

  const item = list[idx];
  
  // Chỉ lấy tối đa 2 từ đồng nghĩa để tìm
  const synsToFind = useMemo(() => {
    if (!item) return [];
    return item.syns.slice(0, 2).map(s => {
      const text = typeof s === 'object' ? (s as any).word : s;
      return text.replace(/\s*\(.*?\)/g, '').trim();
    });
  }, [item?.id]);

  const pool = useMemo(() => {
    if (!item) return [];
    // Lấy đáp án đúng (tối đa 2) và làm sạch
    const correct = synsToFind;
    // Lấy từ gây nhiễu từ các từ khác trong bộ (lọc bỏ các từ đồng nghĩa của từ hiện tại) và làm sạch
    const allOtherSyns = words
      .filter(w => w.word !== item.word)
      .flatMap(w => [w.word, ...w.syns])
      .map(s => {
        const text = typeof s === 'object' ? (s as any).word : s;
        return text.replace(/\s*\(.*?\)/g, '').trim();
      })
      .filter(s => !synsToFind.includes(s));
    
    const distractorsNeeded = 4 - correct.length;
    const distractors = [...new Set(allOtherSyns)]
      .sort(() => Math.random() - 0.5)
      .slice(0, distractorsNeeded);

    return [...correct, ...distractors].sort(() => Math.random() - 0.5);
  }, [item?.id, words, synsToFind]);

  useEffect(() => {
    setDropped([]);
    setRevealed([]);
    setIsCompleted(false);
  }, [idx, item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`") {
        e.preventDefault();
        if (item) speak(item.word);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item]);

  useEffect(() => {
    if (item && dropped.length === synsToFind.length && !isCompleted) {
      setIsCompleted(true);
      if (onSRSUpdate) onSRSUpdate(item.word, item.mean, true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
      });
      const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
      audio.play().catch(() => { });
    }
  }, [dropped, item, isCompleted, synsToFind]);

  if (!item) return <div className="text-center py-20 text-2xl font-black text-slate-400">🎉 Hoàn thành!</div>;

  const handleWordClick = (p: string) => {
    if (isCompleted) return;
    if (synsToFind.includes(p)) {
      if (!dropped.includes(p)) {
        setDropped(prev => [...prev, p]);
        speak(p.split('(')[0]);
      }
    } else {
      // Tìm nghĩa của từ gây nhiễu để hiện hint
      if (onSRSUpdate) onSRSUpdate(item.word, item.mean, false);
      setRevealed(prev => [...new Set([...prev, p])]);
    }
  };

  return (
    <div 
      key={idx}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`max-w-lg mx-auto space-y-6 animate-in fade-in duration-300 ${
        direction === 'next' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'
      }`}
    >
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 sm:p-8 text-center">
        <div className="space-y-2 mb-4 sm:mb-8">
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-2xl sm:text-4xl font-black text-blue-600">{item.word}</h2>
            <button onClick={() => speak(item.word)} className="p-2 rounded-xl bg-blue-50 text-blue-500 transition-colors hover:bg-blue-100 group">
              <Volume2 size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
          <div className="text-lg sm:text-xl font-bold text-red-500">{limitMeanings(item.mean)}</div>
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest pt-2">
            HÃY CLICK CHỌN {synsToFind.length} TỪ ĐỒNG NGHĨA
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-4 sm:mb-10 min-h-[40px] sm:min-h-[50px]">
          {synsToFind.map((_, i) => (
            <div key={i} className={`min-w-[7rem] sm:min-w-32 px-3 sm:px-4 h-10 sm:h-14 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center text-[12px] sm:text-[13px] font-bold transition-all ${dropped[i] ? "bg-emerald-50 border-emerald-300 text-emerald-600 shadow-sm" : "border-slate-100 border-dashed bg-slate-50/50"}`}>
              {dropped[i] ? dropped[i] : ""}
            </div>
          ))}
        </div>

        {isCompleted && (
          <div className="mb-6 font-black text-emerald-600 text-sm py-2">
            ✨ TUYỆT VỜI! ĐÃ TÌM ĐỦ TỪ ĐỒNG NGHĨA
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-3xl">
          {pool.map((p, i) => {
            const isUsed = dropped.includes(p);
            const isRevealed = revealed.includes(p);
            const sourceWord = words.find(w => w.word === p || w.syns.includes(p));

            return (
              <button 
                key={i} 
                onClick={() => !isUsed && handleWordClick(p)}
                disabled={isUsed}
                className={`px-4 py-3 border font-bold rounded-2xl shadow-sm transition-all text-sm flex flex-col items-center justify-center min-h-[64px] ${
                  isUsed 
                    ? "bg-emerald-100 border-emerald-200 text-emerald-600 opacity-40 cursor-default" 
                    : isRevealed
                    ? "bg-rose-50 border-rose-200 text-rose-600 shadow-inner"
                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:scale-[1.02] active:scale-95"
                }`}
              >
                <span className={`font-black leading-tight text-center ${isRevealed ? "text-[10px] sm:text-[12px]" : (p.length > 12 ? "text-[11px] sm:text-base" : p.length > 10 ? "text-[12px] sm:text-base" : "text-sm sm:text-base")}`}>{p.split('(')[0].trim()}</span>
                {isRevealed && !isUsed && (
                  <span className="text-[10px] font-medium opacity-80 mt-1 leading-tight text-center">
                    {limitMeanings(sourceWord?.mean || "---")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => { 
            setDropped(synsToFind); 
            if (onSRSUpdate) onSRSUpdate(item.word, item.mean, false);
          }} 
          className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
        >
          Xem đáp án
        </button>
        <button onClick={() => changeIdx(i => i + 1)} className={`px-10 py-3 font-bold rounded-2xl transition-all flex items-center gap-2 ${isCompleted ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-slate-100 text-slate-400 pointer-events-none"}`}>
          Tiếp theo <ChevronRight size={16} />
        </button>
      </div>
      <div className="text-sm text-slate-400 text-center">{idx + 1} / {list.length}</div>
      <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
        <span>Mẹo: Nhấn phím</span>
        <kbd className="px-2 py-1 bg-slate-800 text-white rounded-lg border-b-2 border-slate-950 font-black shadow-md">`</kbd>
        <span className="ml-1 text-[#94a3b8] normal-case font-bold">(dấu huyền)</span>
        <span>để nghe âm thanh</span>
      </div>
    </div>
  );
}

const TOOLTIPS: Record<string, string> = {
  library: "Xem danh sách từ vựng dưới dạng Flashcards",
  scramble: "Trò chơi sắp xếp ký tự thành từ đúng",
  fill: "Trò chơi điền từ vào câu ví dụ",
  match: "Trò chơi nối từ với nghĩa tương ứng",
  synonym: "Trò chơi tìm cặp từ đồng nghĩa"
};

// ---- MAIN COMPONENT ----
export default function VocabGamePlayer({ vocabDayId, dayNumber, title, data, userId }: VocabGamePlayerProps) {
  const [tab, setTab] = useState<Tab>("library");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [notebookIds, setNotebookIds] = useState<Set<string | number>>(new Set());
  const [unlearnedIds, setUnlearnedIds] = useState<Set<string | number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [globalFlip, setGlobalFlip] = useState<"front" | "back" | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // Deck states
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null); // null means "Tất cả"
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [userVocabs, setUserVocabs] = useState<any[]>([]);

  const fetchDecks = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/vocab-decks");
      if (res.ok) {
        const d = await res.json();
        setDecks(d.decks || []);
        setUncategorizedCount(d.uncategorizedCount || 0);
      }
    } catch (e) {
      console.error("Failed to load decks", e);
    }
  }, [userId]);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== "undefined") {
      Promise.all([
        import("mobile-drag-drop"),
        import("mobile-drag-drop/scroll-behaviour")
      ]).then(([mod, scrollMod]) => {
        mod.polyfill({
          dragImageTranslateOverride: scrollMod.scrollBehaviourDragImageTranslateOverride
        });
      });

      // Dummy non-passive touchmove listener to allow polyfill to prevent default scroll on iOS 10+
      const dummyTouchMove = () => {};
      window.addEventListener("touchmove", dummyTouchMove, { passive: false });
      return () => {
        window.removeEventListener("touchmove", dummyTouchMove);
      };
    }
  }, []);

  // Load status từ DB
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const loadData = async () => {
      try {
        // Load Unified data (UserVocabulary)
        const res = await fetch("/api/user-vocabulary?all=true");
        const allData = await res.json();
        if (Array.isArray(allData)) {
          setUserVocabs(allData);
          // Notebook IDs: Những từ có isStarred = true
          const starred = new Set(allData.filter(v => v.isStarred).map(v => v.word.trim().toLowerCase() + "|" + v.definition.trim().toLowerCase()));
          setNotebookIds(starred);

          // Unlearned IDs: Những từ có isUnlearned = true
          const unlearned = new Set(allData.filter(v => v.isUnlearned).map(v => v.word.trim().toLowerCase() + "|" + v.definition.trim().toLowerCase()));
          setUnlearnedIds(unlearned);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    if (vocabDayId === "personal-vocab") {
      fetchDecks();
    }
  }, [vocabDayId, userId, fetchDecks]);

  const handleDeckSelect = async (word: VocabWord, deckId: string | null) => {
    if (!userId) return;
    const key = word.word.trim().toLowerCase() + "|" + word.mean.trim().toLowerCase();
    
    // Check if it already exists in userVocabs
    const existing = userVocabs.find(v => v.word.toLowerCase() === word.word.toLowerCase() && v.definition.trim() === word.mean.trim());

    const payload = {
      word: word.word,
      definition: word.mean,
      ipa: word.ipa,
      example: word.ex,
      exampleTranslation: word.exVi,
      synonyms: word.synonyms,
      antonyms: word.antonyms,
      collocations: word.collocations,
      wordFamily: word.wordFamily,
      deckId: deckId,
      action: existing ? 'update-deck' : 'save'
    };

    try {
      const res = await fetch("/api/user-vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        // Update userVocabs
        setUserVocabs(prev => {
          const next = prev.filter(v => !(v.word.toLowerCase() === word.word.toLowerCase() && v.definition === word.mean));
          return [...next, updated];
        });
        // Update notebookIds
        const newNotebook = new Set(notebookIds);
        newNotebook.add(key);
        setNotebookIds(newNotebook);
        
        // Dispatch global event
        window.dispatchEvent(new CustomEvent('vocab-updated'));
        
        // Reload deck counts
        await fetchDecks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnstar = async (word: VocabWord) => {
    if (!userId) return;
    const key = word.word.trim().toLowerCase() + "|" + word.mean.trim().toLowerCase();
    try {
      const res = await fetch("/api/user-vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: word.word,
          definition: word.mean,
          action: 'delete'
        })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.action === 'deleted') {
          setUserVocabs(prev => prev.filter(v => !(v.word.toLowerCase() === word.word.toLowerCase() && v.definition === word.mean)));
        } else {
          setUserVocabs(prev => prev.map(v => (v.word.toLowerCase() === word.word.toLowerCase() && v.definition === word.mean) ? { ...v, isStarred: false } : v));
        }
        
        const newNotebook = new Set(notebookIds);
        newNotebook.delete(key);
        setNotebookIds(newNotebook);
        
        // Dispatch global event
        window.dispatchEvent(new CustomEvent('vocab-updated'));
        
        await fetchDecks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleUnlearned = async (word: VocabWord) => {
    const key = word.word.trim().toLowerCase() + "|" + word.mean.trim().toLowerCase();
    const newSet = new Set(unlearnedIds);
    const isAdding = !newSet.has(key);

    if (isAdding) newSet.add(key);
    else newSet.delete(key);
    setUnlearnedIds(newSet);

    if (userId) {
      await fetch("/api/user-vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: 'toggle-unlearned',
          word: word.word,
          definition: word.mean,
          ipa: word.ipa,
          example: word.ex,
          exampleTranslation: word.exVi,
          synonyms: word.synonyms,
          antonyms: word.antonyms,
          collocations: word.collocations
        })
      });
      window.dispatchEvent(new CustomEvent('vocab-updated'));
    }
  };

  const onSRSUpdate = async (word: string, definition: string, isCorrect: boolean) => {
    if (!userId) return;
    try {
      await fetch("/api/user-vocabulary/srs-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, definition, isCorrect })
      });
    } catch (e) {
      console.error("SRS update failed", e);
    }
  };

  const filteredData = useMemo(() => {
    if (vocabDayId !== "personal-vocab" || !selectedDeckId) {
      return data;
    }
    return data.filter(w => {
      const entry = userVocabs.find(v => v.word.toLowerCase() === w.word.toLowerCase() && v.definition.trim() === w.mean.trim());
      if (selectedDeckId === "uncategorized") {
        return !entry || !entry.deckId;
      }
      return entry && entry.deckId === selectedDeckId;
    });
  }, [data, vocabDayId, selectedDeckId, userVocabs]);

  const unlearnedCount = useMemo(() => {
    return filteredData.filter(w => {
      const key = w.word.trim().toLowerCase() + "|" + w.mean.trim().toLowerCase();
      return unlearnedIds.has(key);
    }).length;
  }, [filteredData, unlearnedIds]);

  const activeWords = filterMode === "all" ? filteredData : filteredData.filter(w => {
    const key = w.word.trim().toLowerCase() + "|" + w.mean.trim().toLowerCase();
    return unlearnedIds.has(key);
  });

  const isEmpty = filterMode === "starred" && activeWords.length === 0;

  const TABS = [
    { id: "library", label: "Thư viện", icon: BookOpen },
    { id: "scramble", label: "Xếp chữ", icon: Shuffle },
    { id: "fill", label: "Điền từ", icon: PenLine },
    { id: "match", label: "Ghép từ", icon: Link2 },
    { id: "synonym", label: "Đồng nghĩa", icon: Lightbulb },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="relative lg:sticky lg:top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-4 w-full">
              <div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">Ngày {dayNumber}</div>
                <h1 className="text-base sm:text-xl font-black text-slate-800 flex items-center flex-wrap gap-2">
                  <span id={hasMounted ? "vocab-title-target" : undefined}>{title}</span>
                  <button
                    onClick={() => startVocabTour(true)}
                    id={hasMounted ? "vocab-guide-btn" : undefined}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-[8px] sm:text-[10px] uppercase tracking-wider transition-all shadow-sm"
                    title="Khởi động Tour hướng dẫn"
                  >
                    <Compass size={10} className="animate-pulse" />
                    Hướng dẫn nhanh
                  </button>
                </h1>
              </div>

              <div className="flex items-center gap-2" id={hasMounted ? "vocab-filters-target" : undefined}>
                <div className="flex bg-slate-100 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 gap-0.5 sm:gap-1">
                  <button
                    onClick={() => setFilterMode("all")}
                    id={hasMounted ? "vocab-filter-all-btn" : undefined}
                    title="Chơi game với tất cả các từ"
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all ${filterMode === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >TẤT CẢ ({data.length})</button>
                  <button
                    onClick={() => setFilterMode("starred")}
                    id={hasMounted ? "vocab-filter-unlearned-btn" : undefined}
                    title="Chơi game với các từ có nhãn chưa thuộc"
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-1 ${filterMode === "starred" ? "bg-white text-rose-500 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <BookOpen size={10} className={filterMode === "starred" ? "text-rose-500" : "text-slate-400"} fill={filterMode === "starred" ? "currentColor" : "none"} />
                    CHƯA THUỘC ({unlearnedCount})
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto scrollbar-hide items-center">
            {(() => {
              const libraryTab = TABS.find(t => t.id === "library");
              if (!libraryTab) return null;
              const Icon = libraryTab.icon;
              
              if (vocabDayId === "personal-vocab") {
                const isActive = tab === "library";
                return (
                  <select
                    value={selectedDeckId || ""}
                    title="Dữ liệu nạp vào các trò chơi sẽ lấy từ bộ thẻ mà bạn chọn ở đây"
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDeckId(val === "" ? null : val);
                      setTab("library");
                    }}
                    onClick={() => {
                      if (tab !== "library") {
                        setTab("library");
                      }
                    }}
                    className={`text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl border-none outline-none cursor-pointer transition-all duration-300 appearance-none bg-no-repeat pr-8 ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200 bg-slate-100"}`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='${isActive ? "%23ffffff" : "%2364748b"}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.25em 1.25em'
                    }}
                  >
                    <option value="" className="text-slate-800 bg-white">📚 Bộ từ vựng tổng ({data.length})</option>
                    <option value="uncategorized" className="text-slate-800 bg-white">📚 Bộ thẻ tổng (mặc định) ({uncategorizedCount})</option>
                    {decks.map(deck => (
                      <option key={deck.id} value={deck.id} className="text-slate-800 bg-white">
                        📚 {deck.name} ({deck.count})
                      </option>
                    ))}
                  </select>
                );
              }

              return (
                <button
                  key="library"
                  id={hasMounted ? "vocab-mode-library-btn" : undefined}
                  onClick={() => setTab("library")}
                  title={hasMounted ? TOOLTIPS.library : undefined}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${tab === "library" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  <Icon size={13} />{libraryTab.label}
                </button>
              );
            })()}

            <div className="flex gap-1" id={hasMounted ? "vocab-games-target" : undefined}>
              {TABS.filter(t => t.id !== "library").map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id as Tab)}
                    title={hasMounted ? TOOLTIPS[t.id] : undefined}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${tab === t.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    <Icon size={13} />{t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {isEmpty ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-black text-slate-400">Chưa có từ nào được đánh dấu!</h3>
            <p className="text-slate-400 text-sm mt-2">Bấm ⭐ vào các từ bạn chưa thuộc ở tab Thư viện.</p>
          </div>
        ) : tab === "library" ? (
          <>
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setGlobalFlip(prev => prev === "back" ? "front" : "back")}
                id={hasMounted ? "vocab-global-flip-target" : undefined}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
              >
                <Layers size={14} className="text-blue-500" />
                {globalFlip === "back" ? "Hiện mặt trước" : "Hiện mặt sau"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeWords.map((word, idx) => {
                const key = word.word.trim().toLowerCase() + "|" + word.mean.trim().toLowerCase();
                return (
                  <div key={word.id} className={idx === 0 ? "vocab-card-first animate-in zoom-in duration-300" : "animate-in zoom-in duration-300"}>
                    <FlashCard
                      word={word}
                      index={idx}
                      isInNotebook={notebookIds.has(key)}
                      isUnlearned={unlearnedIds.has(key)}
                      currentDeckId={userVocabs.find(v => v.word.toLowerCase() === word.word.toLowerCase() && v.definition.trim() === word.mean.trim())?.deckId}
                      currentDeckName={(() => {
                        const deckId = userVocabs.find(v => v.word.toLowerCase() === word.word.toLowerCase() && v.definition.trim() === word.mean.trim())?.deckId;
                        if (!deckId) return "bộ thẻ tổng";
                        return decks.find(d => d.id === deckId)?.name || "bộ thẻ tổng";
                      })()}
                      onSelectDeck={(deckId) => handleDeckSelect(word, deckId)}
                      onUnstar={() => handleUnstar(word)}
                      onToggleUnlearned={() => toggleUnlearned(word)}
                      globalFlip={globalFlip}
                    />
                  </div>
                );
              })}
            </div>
          </>
        ) : (tab === "scramble" && hasMounted) ? (
          <ScrambleGame words={activeWords} onSRSUpdate={onSRSUpdate} />
        ) : (tab === "fill" && hasMounted) ? (
          <FillGame words={activeWords} allWords={data} onSRSUpdate={onSRSUpdate} />
        ) : (tab === "match" && hasMounted) ? (
          <MatchGame words={activeWords} onSRSUpdate={onSRSUpdate} />
        ) : (tab === "synonym" && hasMounted) ? (
          <SynonymGame words={activeWords} onSRSUpdate={onSRSUpdate} />
        ) : null}
      </div>



      <style>{`
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
