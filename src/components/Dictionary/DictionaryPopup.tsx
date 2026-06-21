'use client';
// Force re-compile v3

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, X, ChevronRight, BookOpen, Layers, Hash, List, Star, Link2, Replace } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import VocabDeckSelector from '../Vocab/VocabDeckSelector';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DictionaryData {
  word: string;
  data: {
    word: string;
    meanings: Array<{
      index: number;
      part_of_speech: string;
      definition: string;
      ipa: string;
      example: string;
      translation: string;
      synonyms: Array<{ word: string; meaning: string }>;
      antonyms: Array<{ word: string; meaning: string }>;
      word_family?: Array<{ word: string; meaning: string }>;
      collocations?: Array<{ structure: string; meaning: string }>;
    }>;
    word_family?: Array<{ word: string; meaning: string }>; // Top level fallback
    common_structures?: Array<{ structure: string; meaning: string }>; // Top level fallback
  };
  similarWords: string[];
  error?: string;
  debugCount?: number;
  v?: number;
}

interface DictionaryPopupProps {
  word: string;
  onClose: () => void;
  initialPosition?: { x: number; y: number; top: number; bottom: number };
  dimensions: { width: number; height: number };
  onResize: (dim: { width: number; height: number }) => void;
}

// Helper to deduplicate items by a key
const deduplicate = <T,>(items: T[], keyGetter: (item: T) => string): T[] => {
  const map = new Map<string, T>();
  if (!items || !Array.isArray(items)) return [];
  items.forEach(item => {
    if (!item) return;
    const rawKey = keyGetter(item);
    if (typeof rawKey !== 'string') return;
    const key = rawKey.toLowerCase().trim();
    if (key && !map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
};

// Bộ nhớ đệm lưu cache các từ đã kiểm tra và tìm thấy URL thành công
const audioCache = new Map<string, string>();

export default function DictionaryPopup({ word, onClose, initialPosition, dimensions, onResize }: DictionaryPopupProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DictionaryData | null>(null);
  const [activeSection, setActiveSection] = useState<string>('meaning-1');
  const [userVocabs, setUserVocabs] = useState<any[]>([]);
  const [isStarring, setIsStarring] = useState<string | null>(null);
  const [activeDeckSelector, setActiveDeckSelector] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top?: number; left: number; bottom?: number } | null>(null);



  useEffect(() => {
    if (initialPosition) {
      const width = dimensions.width;
      const margin = 15;
      const popupHeight = dimensions.height;

      let left = initialPosition.x - width / 2;
      // Boundary checks
      if (left < 20) left = 20;
      if (left + width > window.innerWidth - 20) left = window.innerWidth - width - 20;

      // Check if there's enough space above the selection top
      if (initialPosition.top > popupHeight + 60) {
        // Enough space above: position BOTTOM relative to the word's top
        setCoords({
          bottom: window.innerHeight - initialPosition.top + margin,
          left
        });
      } else {
        // Not enough space above: position TOP relative to the word's bottom
        setCoords({
          top: initialPosition.bottom + margin,
          left
        });
      }
    } else {
      // Default position: top-right
      setCoords({ top: 64, left: window.innerWidth - dimensions.width - 32 });
    }
  }, [initialPosition, dimensions.width, dimensions.height]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(400, Math.min(window.innerWidth - 40, startWidth + (moveEvent.clientX - startX)));
      const newHeight = Math.max(300, Math.min(window.innerHeight - 100, startHeight + (moveEvent.clientY - startY)));
      onResize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleMouseUp, { capture: true });
    };

    document.addEventListener('mousemove', handleMouseMove, { capture: true });
    document.addEventListener('mouseup', handleMouseUp, { capture: true });
  };

  useEffect(() => {
    const fetchWord = async () => {
      setLoading(true);
      // Reset scroll position for new word
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      try {
        const [dictRes, vocabRes] = await Promise.all([
          fetch(`/api/dictionary/${encodeURIComponent(word)}`),
          fetch(`/api/user-vocabulary?t=${Date.now()}`, { cache: 'no-store' })
        ]);

        const [dictData, vocabData] = await Promise.all([
          dictRes.json(),
          vocabRes.ok ? vocabRes.json() : Promise.resolve([])
        ]);

        setData(dictData);
        if (Array.isArray(vocabData)) {
          setUserVocabs(vocabData);
        } else {
          setUserVocabs([]);
        }
      } catch (err) {
        console.error("Error fetching dictionary data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWord();
  }, [word]);

  const toggleStar = async (e: React.MouseEvent, meaning: any) => {
    e.stopPropagation();
    if (!data) return;

    const wordKey = data.word.toLowerCase().trim();
    const isStarred = userVocabs.some(v =>
      v.word.toLowerCase().trim() === wordKey &&
      v.definition.trim() === meaning.definition.trim()
    );

    // Optimistic UI update
    if (isStarred) {
      setUserVocabs(prev => prev.filter(v => !(v.word.toLowerCase().trim() === wordKey && v.definition.trim().toLowerCase() === meaning.definition.trim().toLowerCase())));
    } else {
      setUserVocabs(prev => [...prev, {
        word: data.word,
        definition: meaning.definition,
        partOfSpeech: meaning.part_of_speech,
        translation: meaning.definition, // Use definition as primary translation if needed
        example: meaning.example,
        exampleTranslation: meaning.translation
      }]);
    }

    const aggregatedCollocations = deduplicate(
      [
        ...(data.data?.meanings?.flatMap(m => m.collocations || []) || []),
        ...(data.data?.common_structures || [])
      ],
      item => item.structure
    ).map(c => `${c.structure}: ${c.meaning}`).join(', ');

    const aggregatedFamily = deduplicate(
      [
        ...(data.data?.meanings?.flatMap(m => m.word_family || []) || []),
        ...(data.data?.word_family || [])
      ],
      item => item.word
    ).map(f => `${f.word} (${f.meaning})`).join(', ');

    const vocabData = {
      word: word, 
      partOfSpeech: meaning.part_of_speech,
      definition: meaning.definition || meaning.meaning || meaning.translation || '',
      translation: meaning.definition || meaning.meaning || meaning.translation || '',
      ipa: meaning.ipa || (data.data as any)?.phonetic || (data.data?.meanings?.[0]?.ipa) || '',
      example: meaning.example,
      exampleTranslation: meaning.translation || meaning.translation_example || meaning.exampleTranslation,
      // Synonyms/Antonyms are specific to this meaning
      synonyms: Array.isArray(meaning.synonyms) 
        ? meaning.synonyms.map((s: any) => typeof s === 'object' ? `${s.word} (${s.meaning})` : s).join(', ') 
        : '',
      antonyms: Array.isArray(meaning.antonyms) 
        ? meaning.antonyms.map((a: any) => typeof a === 'object' ? `${a.word} (${a.meaning})` : a).join(', ') 
        : '',
      // Collocations and Family are global
      collocations: aggregatedCollocations || '',
      wordFamily: aggregatedFamily || '',
      action: isStarred ? 'delete' : 'save'
    };

    setIsStarring(meaning.definition);
    try {
      console.log("[Dictionary] Saving vocab:", vocabData);
      const res = await fetch('/api/user-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vocabData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[Dictionary] Save failed:", res.status, errorData);
        // Rollback on error
        const vocabRes = await fetch('/api/user-vocabulary');
        if (vocabRes.ok) {
          const vocabData = await vocabRes.json();
          if (Array.isArray(vocabData)) {
            setUserVocabs(vocabData);
          }
        }
      } else {
        const savedItem = await res.json();
        if (savedItem && savedItem.id) {
          setUserVocabs(prev => {
            const next = prev.filter(v => !(v.word.toLowerCase().trim() === wordKey && v.definition.trim().toLowerCase() === meaning.definition.trim().toLowerCase()));
            return [...next, savedItem];
          });
        }
        // Dispatch event to update other components (like Dashboard)
        window.dispatchEvent(new CustomEvent('vocab-updated'));
      }
    } catch (err) {
      console.error("Error toggling star:", err);
    } finally {
      setIsStarring(null);
    }
  };

  const handleDeckSelect = async (meaning: any, deckId: string | null) => {
    if (!data) return;
    const wordKey = data.word.toLowerCase().trim();
    const existingVocab = userVocabs.find(v =>
      v.word.toLowerCase().trim() === wordKey &&
      v.definition.trim() === meaning.definition.trim()
    );

    const aggregatedCollocations = deduplicate(
      [
        ...(data.data?.meanings?.flatMap(m => m.collocations || []) || []),
        ...(data.data?.common_structures || [])
      ],
      item => item.structure
    ).map(c => `${c.structure}: ${c.meaning}`).join(', ');

    const aggregatedFamily = deduplicate(
      [
        ...(data.data?.meanings?.flatMap(m => m.word_family || []) || []),
        ...(data.data?.word_family || [])
      ],
      item => item.word
    ).map(f => `${f.word} (${f.meaning})`).join(', ');

    const vocabData = {
      word: word, 
      partOfSpeech: meaning.part_of_speech,
      definition: meaning.definition || meaning.meaning || meaning.translation || '',
      translation: meaning.definition || meaning.meaning || meaning.translation || '',
      ipa: meaning.ipa || (data.data as any)?.phonetic || (data.data?.meanings?.[0]?.ipa) || '',
      example: meaning.example,
      exampleTranslation: meaning.translation || meaning.translation_example || meaning.exampleTranslation,
      synonyms: Array.isArray(meaning.synonyms) 
        ? meaning.synonyms.map((s: any) => typeof s === 'object' ? `${s.word} (${s.meaning})` : s).join(', ') 
         : '',
      antonyms: Array.isArray(meaning.antonyms) 
        ? meaning.antonyms.map((a: any) => typeof a === 'object' ? `${a.word} (${a.meaning})` : a).join(', ') 
        : '',
      collocations: aggregatedCollocations || '',
      wordFamily: aggregatedFamily || '',
      deckId: deckId,
      action: existingVocab ? 'update-deck' : 'save'
    };

    try {
      const res = await fetch('/api/user-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vocabData)
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setUserVocabs(prev => {
          const next = prev.filter(v => !(v.word.toLowerCase().trim() === wordKey && v.definition.trim().toLowerCase() === meaning.definition.trim().toLowerCase()));
          return [...next, updatedItem];
        });
        window.dispatchEvent(new CustomEvent('vocab-updated'));
      }
    } catch (err) {
      console.error("Error selecting deck:", err);
    }
  };

  const handleUnstar = async (meaning: any) => {
    if (!data) return;
    const wordKey = data.word.toLowerCase().trim();
    try {
      const res = await fetch('/api/user-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: data.word,
          definition: meaning.definition,
          action: 'delete'
        })
      });
      if (res.ok) {
        setUserVocabs(prev => prev.filter(v => !(v.word.toLowerCase().trim() === wordKey && v.definition.trim().toLowerCase() === meaning.definition.trim().toLowerCase())));
        window.dispatchEvent(new CustomEvent('vocab-updated'));
        setActiveDeckSelector(null);
      }
    } catch (err) {
      console.error("Error unstarring:", err);
    }
  };

  // Reset scroll and state when word changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setActiveSection('meaning-1');
  }, [word]);

  const speak = async (text: string, type: 'uk' | 'us' = 'us') => {
    if (typeof window === 'undefined') return;

    // Loại bỏ nhãn từ loại trong dấu ngoặc đơn ở cuối từ (ví dụ: "Bicyclist (n)" -> "Bicyclist")
    const cleanSpeechText = text.replace(/\s*\([^)]*\)/g, '').trim();

    const fallbackSpeak = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
      utterance.lang = type === 'uk' ? 'en-GB' : 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    };

    if (cleanSpeechText.includes(' ')) {
      fallbackSpeak();
      return;
    }

    const cleanWord = cleanSpeechText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cacheKey = `${cleanWord}_${type}`;

    // 1. Kiểm tra cache trước
    if (audioCache.has(cacheKey)) {
      const cachedUrl = audioCache.get(cacheKey)!;
      if (cachedUrl === 'tts') {
        fallbackSpeak();
      } else {
        const audio = new Audio(cachedUrl);
        audio.play().catch(() => fallbackSpeak());
      }
      return;
    }

    const folder = type === 'us' ? 'ame' : 'bre';
    const legacySuffix = type === 'us' ? '__us_1' : '__gb_1';

    const urls = [
      `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}.mp3`,
      `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}1.mp3`,
      `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}2.mp3`,
      `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}${legacySuffix}.mp3`
    ];

    // 2. Kiểm tra song song bằng HTTP HEAD
    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const checkPromises = urls.map(async (url, index) => {
        try {
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 1000)
          );
          const fetchPromise = fetch(url, { method: 'HEAD', signal });
          
          const response = await Promise.race([fetchPromise, timeoutPromise]);
          if (response && response.status === 200) {
            return { index, url, exists: true };
          }
          return { index, url, exists: false };
        } catch {
          return { index, url, exists: false };
        }
      });

      const results = await Promise.all(checkPromises);
      const validResults = results
        .filter(r => r.exists)
        .sort((a, b) => a.index - b.index);

      if (validResults.length > 0) {
        const bestUrl = validResults[0].url;
        audioCache.set(cacheKey, bestUrl);
        
        const audio = new Audio(bestUrl);
        audio.play().catch(() => fallbackSpeak());
      } else {
        audioCache.set(cacheKey, 'tts');
        fallbackSpeak();
      }
    } catch (err) {
      console.warn('[Dict Audio] Error in parallel check:', err);
      fallbackSpeak();
    } finally {
      controller.abort();
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const highlightText = (text: string, target: string) => {
    if (!target || !text) return text;
    try {
      // Tách văn bản dựa trên từ khóa (không phân biệt hoa thường)
      const parts = text.split(new RegExp(`(${target})`, 'gi'));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === target.toLowerCase()
              ? <strong key={i} className="font-black text-slate-900 underline decoration-blue-300/50 underline-offset-2">{part}</strong>
              : part
          )}
        </>
      );
    } catch (e) {
      return text;
    }
  };

  if (!coords) return null;

  if (loading && !data) {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 z-[10000] pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto absolute bg-white w-[300px] p-6 rounded-3xl shadow-2xl flex items-center gap-4 border border-slate-100"
          style={{
            top: coords.top,
            bottom: coords.bottom,
            left: coords.left + 100
          }}
        >
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
          <p className="text-slate-600 text-sm font-bold">Đang tra: <span className="text-blue-600">{word}</span></p>
        </motion.div>
      </div>,
      document.body
    );
  }

  if (!data) return null;

  // Collect and deduplicate synonyms/antonyms
  const allSynonyms = deduplicate(
    data.data?.meanings?.flatMap(m => m.synonyms || []) || [],
    item => item.word
  );

  const allAntonyms = deduplicate(
    data.data?.meanings?.flatMap(m => m.antonyms || []) || [],
    item => item.word
  );

  // Collect structures from both meanings and top-level data
  const allStructures = deduplicate(
    [
      ...(data.data?.meanings?.flatMap(m => m.collocations || []) || []),
      ...(data.data?.common_structures || [])
    ],
    item => item.structure
  );

  // Collect family from both meanings and top-level data
  const allFamily = deduplicate(
    [
      ...(data.data?.meanings?.flatMap(m => m.word_family || []) || []),
      ...(data.data?.word_family || [])
    ],
    item => item.word
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      <motion.div
        ref={popupRef}
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="pointer-events-auto absolute bg-white rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-slate-200/50 dictionary-popup-container"
        style={{
          cursor: 'default',
          top: coords.top,
          bottom: coords.bottom,
          left: coords.left,
          width: dimensions.width,
          height: dimensions.height
        }}
      >
        {/* Inner Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex items-center justify-center"
            >
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Layout Container */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar (Super Compact) */}
          <div className="w-[90px] bg-slate-50 border-r border-slate-100 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200/50 flex justify-center shrink-0">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <BookOpen size={12} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-5 custom-scrollbar flex flex-col">
              {/* Meaning Nav - Simple Links */}
              <div className="space-y-1 w-full px-2">
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest text-center mb-1">CHỈ MỤC</p>
                {data.data?.meanings?.map((m, idx) => (
                  <button
                    key={`nav-m-${idx}`}
                    onClick={() => scrollToSection(`meaning-${idx + 1}`)}
                    className={cn(
                      "w-full py-1 text-[10px] font-bold transition-all text-center rounded-md",
                      activeSection === `meaning-${idx + 1}` ? "text-blue-600 bg-blue-50/50" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Nghĩa {idx + 1}
                  </button>
                ))}

                {/* Dynamic Extra Nav */}
                <div className="pt-2 flex flex-col gap-1.5">
                  {allSynonyms.length > 0 && (
                    <button onClick={() => scrollToSection('sec-synonyms')} className="text-[9px] font-bold text-slate-400 hover:text-green-600 text-center">Đồng nghĩa</button>
                  )}
                  {allAntonyms.length > 0 && (
                    <button onClick={() => scrollToSection('sec-antonyms')} className="text-[9px] font-bold text-slate-400 hover:text-red-600 text-center">Trái nghĩa</button>
                  )}
                  {allStructures.length > 0 && (
                    <button onClick={() => scrollToSection('sec-structures')} className="text-[9px] font-bold text-slate-400 hover:text-blue-600 text-center">Từ/Cụm từ</button>
                  )}
                  {allFamily.length > 0 && (
                    <button onClick={() => scrollToSection('sec-family')} className="text-[9px] font-bold text-slate-400 hover:text-orange-600 text-center">Gia đình</button>
                  )}
                </div>
              </div>

              {/* Similar Words in Sidebar Box */}
              {data.similarWords && data.similarWords.length > 0 && (
                <div className="mt-auto p-2 border-t border-slate-100">
                  <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest text-center mb-2">TƯƠNG TỰ</p>
                  <div className="bg-white/50 rounded-lg p-1.5 border border-slate-200/50 space-y-1">
                    {data.similarWords.slice(0, 5).map((sw) => (
                      <button
                        key={sw}
                        onClick={() => {
                          setLoading(true);
                          window.dispatchEvent(new CustomEvent('dictionary-search', { detail: sw }));
                        }}
                        className="w-full text-[9px] font-medium text-blue-500 hover:underline transition-all truncate text-left"
                      >
                        • {sw}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Header - Draggable Area */}
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md cursor-grab active:cursor-grabbing shrink-0 z-10">
              <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 pr-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none shrink-0">{data.word}</h2>
                {data.data?.meanings?.[0]?.ipa && (
                  <p className="text-[11px] text-slate-400 font-mono italic truncate">[{data.data.meanings[0].ipa}]</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Nút loa giọng Anh (UK) */}
                <button 
                  onClick={() => speak(data.word, 'uk')} 
                  className="px-2 py-1 text-red-500 hover:bg-red-50 active:scale-95 rounded-lg flex items-center gap-1 transition-all border border-red-100/50 hover:border-red-200"
                  title="Phát âm giọng Anh (UK)"
                >
                  <Volume2 size={13} />
                  <span className="text-[9px] font-black uppercase tracking-wider">uk</span>
                </button>

                {/* Nút loa giọng Mỹ (US) */}
                <button 
                  onClick={() => speak(data.word, 'us')} 
                  className="px-2 py-1 text-blue-600 hover:bg-blue-50 active:scale-95 rounded-lg flex items-center gap-1 transition-all border border-blue-100/50 hover:border-blue-200"
                  title="Phát âm giọng Mỹ (US)"
                >
                  <Volume2 size={13} />
                  <span className="text-[9px] font-black uppercase tracking-wider">us</span>
                </button>

                <button onClick={onClose} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-300 transition-all"><X size={18} /></button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-8 custom-scrollbar">
              {data.error ? (
                <div className="py-10 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center">
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">Không tìm thấy từ</h3>
                    <p className="text-slate-400 text-xs font-medium mt-1">
                      Rất tiếc, hệ thống chưa có dữ liệu cho <span className="text-blue-500 font-bold">"{word}"</span>.
                    </p>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 w-full">
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-3">Bạn có thể muốn tìm:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {data.similarWords?.map((sw) => (
                        <button
                          key={sw}
                          onClick={() => {
                            setLoading(true);
                            window.dispatchEvent(new CustomEvent('dictionary-search', { detail: sw }));
                          }}
                          className="px-3 py-1.5 bg-white text-blue-500 rounded-xl text-[11px] font-bold shadow-sm border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          {sw}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                data.data?.meanings?.map((m, idx) => {
                  const matchingVocab = userVocabs.find(v => 
                    v.word.trim().toLowerCase() === data.word.trim().toLowerCase() && 
                    v.definition.trim().toLowerCase() === m.definition.trim().toLowerCase()
                  );
                  const isStarred = !!matchingVocab;
                  const deckName = matchingVocab?.deck ? matchingVocab.deck.name : "Bộ thẻ tổng (mặc định)";

                  return (
                    <section key={idx} id={`meaning-${idx + 1}`} className="space-y-2 group/section">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-500 text-[8px] font-black uppercase tracking-widest">{m.part_of_speech}</span>

                        {/* Star Button */}
                        <div className="relative group/star">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDeckSelector(prev => prev === m.definition ? null : m.definition);
                            }}
                            className={cn(
                              "p-1.5 rounded-lg transition-all tour-dict-star-btn",
                              isStarred ? "text-yellow-500 bg-yellow-50" : "text-slate-300 hover:bg-slate-50 hover:text-yellow-500"
                            )}
                          >
                            <Star size={14} fill={isStarred ? "currentColor" : "none"} className={isStarring === m.definition ? "animate-pulse" : ""} />
                          </button>

                          <AnimatePresence>
                            {activeDeckSelector === m.definition && (
                              <VocabDeckSelector
                                word={data.word}
                                currentDeckId={userVocabs.find(v => 
                                  v.word.trim().toLowerCase() === data.word.trim().toLowerCase() && 
                                  v.definition.trim().toLowerCase() === m.definition.trim().toLowerCase()
                                )?.deckId}
                                onSelectDeck={(deckId) => handleDeckSelect(m, deckId)}
                                onUnstar={() => handleUnstar(m)}
                                onClose={() => setActiveDeckSelector(null)}
                              />
                            )}
                          </AnimatePresence>

                          {/* Tooltip */}
                          {activeDeckSelector !== m.definition && (
                            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 opacity-0 group-hover/star:opacity-100 transition-all pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-xl z-50 translate-x-1 group-hover/star:translate-x-0">
                              {isStarred 
                                ? `Từ này đã được thêm vào bộ thẻ "${deckName}" của bạn`
                                : "Lưu từ này vào từ vựng để học qua game"
                              }
                              <div className="absolute left-full top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 -translate-x-1"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <span className="text-slate-300 font-black text-xs mt-0.5">{idx + 1}.</span>
                        <p className="text-sm text-slate-800 font-bold leading-relaxed">{m.definition}</p>
                      </div>

                      {m.example && (
                        <div className="ml-5 pl-3 border-l border-blue-100 py-0.5 space-y-1">
                          <div className="flex items-start gap-1.5">
                            <button onClick={() => speak(m.example)} className="mt-1 text-blue-300 hover:text-blue-500"><Volume2 size={10} /></button>
                            <p className="text-slate-500 italic font-medium leading-relaxed text-[12px]">"{highlightText(m.example, data.word)}"</p>
                          </div>
                          <p className="text-slate-400 text-[10px] ml-4">→ {m.translation}</p>
                        </div>
                      )}
                    </section>
                  );
                })
              )}

              {/* Extended Sections */}
              {/* Synonyms */}
              {allSynonyms.length > 0 && (
                <section id="sec-synonyms" className="pt-4 border-t border-slate-50 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Link2 size={10} className="text-emerald-500" /> Từ đồng nghĩa
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allSynonyms.slice(0, 3).map((s, i) => (
                      <div key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm animate-in zoom-in-95 duration-300">
                        <button onClick={() => speak(s.word)} className="text-emerald-400 hover:text-emerald-600"><Volume2 size={10} /></button>
                        <span className="text-[12px] font-bold">
                          {s.word} <span className="text-emerald-600 font-medium ml-1">({s.meaning})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Antonyms */}
              {allAntonyms.length > 0 && (
                <section id="sec-antonyms" className="pt-4 border-t border-slate-50 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Replace size={10} className="text-rose-500" /> Từ trái nghĩa
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allAntonyms.slice(0, 3).map((a, i) => (
                      <div key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 flex items-center gap-2 shadow-sm animate-in zoom-in-95 duration-300">
                        <button onClick={() => speak(a.word)} className="text-rose-400 hover:text-rose-600"><Volume2 size={10} /></button>
                        <span className="text-[12px] font-bold">
                          {a.word} <span className="text-rose-600 font-medium ml-1">({a.meaning})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Common Structures (Phần từ/cụm từ quan trọng) */}
              {allStructures.length > 0 && (
                <section id="sec-structures" className="pt-4 border-t border-slate-50 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={10} className="text-indigo-500" /> Từ/Cụm từ quan trọng
                  </p>
                  <div className="space-y-2">
                    {allStructures.slice(0, 4).map((c, i) => (
                      <div key={i} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3 group/item hover:border-indigo-200 transition-all">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover/item:scale-150 transition-transform"></div>
                        <button onClick={() => speak(c.structure)} className="text-indigo-300 hover:text-indigo-500 shrink-0"><Volume2 size={12} /></button>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-slate-800">{c.structure}</span>
                          <span className="text-[10px] text-slate-500 font-medium italic">{c.meaning}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Word Family */}
              {allFamily.length > 0 && (
                <section id="sec-family" className="pt-4 border-t border-slate-50 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gia đình từ</p>
                  <div className="grid grid-cols-2 gap-2">
                    {allFamily.map((f, i) => (
                      <div key={i} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                        <button onClick={() => speak(f.word)} className="mt-0.5 text-slate-300 hover:text-blue-500"><Volume2 size={10} /></button>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{f.word}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{f.meaning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0 relative">
          <span className="text-[8px] text-slate-300 font-mono">v{data.v} | {data.debugCount} words</span>
          <p className="text-[8px] text-slate-400 font-bold italic">Kéo thanh tiêu đề để di chuyển</p>

          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-50 flex items-end justify-end p-1.5 group"
          >
            <div className="w-3 h-3 border-r-2 border-b-2 border-slate-300 rounded-br-[2px] transition-colors group-hover:border-blue-500" />
          </div>
        </div>
      </motion.div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>,
    document.body
  );
}
