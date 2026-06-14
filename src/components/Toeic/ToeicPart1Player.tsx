"use client";

import React, { useEffect, useRef, useState, useMemo, Fragment } from 'react';
import { createPortal } from "react-dom";
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import {
  PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon,
  CheckCircleIcon, EyeIcon, ClockIcon, FlagIcon, TrophyIcon, ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { Send, LayoutDashboard, ChevronRight, Play, Pause, Volume2, HelpCircle, CheckCircle2, XCircle, Info, Lightbulb, Flag, ChevronsLeftRight } from "lucide-react";
import { AdminInlineEditor } from "@/components/Admin/AdminInlineEditor";
import { useAdminEdit } from "@/components/Admin/AdminEditProvider";
import confetti from 'canvas-confetti';
import Link from 'next/link';
import FlagSelector, { FlagColor } from '../Player/FlagSelector';
import { startToeicPartTour } from './toeicTour';
import FloatingVideoExplanationPlayer from '../Player/FloatingVideoExplanationPlayer';
import { useRouter } from 'next/navigation';
import part1WordFamiliesData from "@/data/part1_word_families.json";

function parseOptionsFromText(text: string) {
  if (!text) return [];
  const parts = text.split(/(?=\([A-D]\))/gi).map(s => s.trim()).filter(Boolean);
  return parts.map(p => {
    const match = p.match(/^\(([A-D])\)\s*(.*)/i);
    if (match) return { label: match[1].toUpperCase(), text: match[2] };
    return { label: '?', text: p };
  });
}
const audioCache = new Map<string, string>();

const speak = async (text: string, type: 'uk' | 'us' = 'us') => {
  if (typeof window === 'undefined') return;

  const fallbackSpeak = (t: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(t);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => {
      if (type === 'uk') return v.lang === 'en-GB';
      return v.lang === 'en-US' || v.lang === 'en_US';
    }) || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const cleanSpeechText = text.replace(/\s*\([^)]*\)/g, '').trim();
  if (cleanSpeechText.includes(' ')) {
    fallbackSpeak(cleanSpeechText);
    return;
  }

  const cleanWord = cleanSpeechText.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cacheKey = `${cleanWord}_${type}`;

  if (audioCache.has(cacheKey)) {
    const cachedUrl = audioCache.get(cacheKey)!;
    if (cachedUrl === 'tts') {
      fallbackSpeak(cleanSpeechText);
    } else {
      const audio = new Audio(cachedUrl);
      audio.play().catch(() => fallbackSpeak(cleanSpeechText));
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
      audio.play().catch(() => fallbackSpeak(cleanSpeechText));
    } else {
      audioCache.set(cacheKey, 'tts');
      fallbackSpeak(cleanSpeechText);
    }
  } catch (err) {
    fallbackSpeak(cleanSpeechText);
  } finally {
    controller.abort();
  }
};

const HintPhrase = ({ phrase, isReveal, questionIndex, hintIndex }: { phrase: string, isReveal: boolean, questionIndex: number, hintIndex?: number }) => {
  const [revealed, setRevealed] = useState(false);

  // Reset local revealed state when the question or phrase changes
  useEffect(() => {
    setRevealed(false);
  }, [questionIndex, phrase]);

  const isShow = revealed || isReveal;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        const newState = !revealed;
        setRevealed(newState);
        if (newState) speak(phrase);
      }}
      className="relative inline-block mx-0.5 transition-all duration-300 align-bottom group perspective-[1000px]"
      style={{ perspective: '1000px' }}
    >
      <span className="opacity-0 font-bold whitespace-pre text-[17px]">{phrase}</span>

      <div
        className="absolute inset-0 transition-all duration-700 preserve-3d"
        style={{
          transformStyle: 'preserve-3d',
          transform: isShow ? 'rotateX(0deg)' : 'rotateX(180deg)'
        }}
      >
        <div className={`absolute inset-0 flex items-center justify-center backface-hidden ${isShow ? 'opacity-100' : 'opacity-0'}`} style={{ backfaceVisibility: 'hidden' }}>
          <span className="font-bold text-indigo-700 bg-indigo-50/50 px-2 rounded border-b-2 border-dashed border-indigo-300/50 whitespace-nowrap text-[17px]">{phrase}</span>
        </div>
        <div
          className={`absolute inset-0 bg-indigo-600 rounded-sm border-b-2 border-indigo-700 shadow-sm flex items-center justify-center backface-hidden ${isShow ? 'opacity-0' : 'opacity-100 hover:bg-indigo-500 cursor-pointer'}`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
          <span className="text-[10px] text-white font-black select-none tracking-widest opacity-90 uppercase">HINT</span>
          {hintIndex && (
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white shadow-sm ring-2 ring-indigo-500/20">
              {hintIndex}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InteractiveWord = ({ word, isReveal }: { word: string, isReveal: boolean }) => {
  const [revealed, setRevealed] = useState(false);
  const isRevealed = revealed || isReveal;

  const match = word.match(/^(.*?)([.,!?;:"'()\[\]{}]*)$/);
  const letters = match ? match[1] : word;
  const punctuation = match ? match[2] : "";
  const maskedLetters = letters.replace(/[a-zA-Z]/g, '_');

  return (
    <span
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (!isRevealed) {
          e.stopPropagation();
          setRevealed(true);
          speak(word);
        }
      }}
      className="inline cursor-text select-text"
    >
      {isRevealed ? (
        <span className="select-text">{word}</span>
      ) : (
        <>
          <span className="text-slate-300 font-mono hover:text-blue-500 font-bold tracking-widest cursor-pointer">
            {maskedLetters}
          </span>
          {punctuation && <span className="text-slate-600 font-bold">{punctuation}</span>}
        </>
      )}
    </span>
  );
};

const FormattedInteractiveText = ({ text, revealed, currentIndex, initialBold = false, hintMode = false, wordsToMask = [], startHintIndex = 1, renderWordCloud }: { text: string; revealed: boolean, currentIndex: number, initialBold?: boolean, hintMode?: boolean, wordsToMask?: string[], startHintIndex?: number, renderWordCloud?: (text: string) => React.ReactNode }) => {
  if (!text) return { content: null, finalBold: initialBold };

  const parts = text.split(/(\*\*|\$\^\{.*?\}\$|\^\{.*?\}\$|\^\{.*?\}|\|\^\{.*?\}\$\|)/g);
  let isBold = initialBold;
  let hintCounter = 0;

  const content = parts.map((part, index) => {
    if (!part) return null;
    if (part === '**') { isBold = !isBold; return null; }

    if (
      (part.startsWith('$^') && part.endsWith('}$')) ||
      (part.startsWith('^{') && part.endsWith('}$')) ||
      (part.startsWith('^{') && part.endsWith('}')) ||
      (part.startsWith('|^') && part.endsWith('$|'))
    ) {
      let supContent = part.replace(/[\$\^\{\}\s\|]*/g, '');
      if (part.includes('|')) {
        const match = part.match(/\^{(.*?)\}/);
        if (match) supContent = match[1];
      }
      return (
        <sup key={index} className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1 rounded ml-1 inline-block -translate-y-1">
          {supContent}
        </sup>
      );
    }

    // Xử lý nội dung văn bản
    if (hintMode && wordsToMask.length > 0) {
      // Sort wordsToMask by length descending to match phrases first
      const sortedMasks = [...wordsToMask].sort((a, b) => b.length - a.length);
      const maskRegex = new RegExp(`(${sortedMasks.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

      const subParts = part.split(maskRegex).map((fragment, fIdx) => {
        if (!fragment) return null;
        const cleanFragment = fragment.toLowerCase().trim().replace(/[^\w\s]+$/g, '');
        const isMatched = sortedMasks.some(m => m.toLowerCase() === cleanFragment);

        if (isMatched) {
          const currentHintIdx = startHintIndex + hintCounter;
          hintCounter++;
          return <HintPhrase key={`hint-${currentIndex}-${index}-${fIdx}`} phrase={fragment} isReveal={revealed} questionIndex={currentIndex} hintIndex={currentHintIdx} />;
        }

        // Split remaining fragment into words for standard interactive behavior
        return fragment.split(' ').map((word, wIdx, fArr) => (
          <span key={`word-${currentIndex}-${index}-${fIdx}-${wIdx}`} className="inline">
            <InteractiveWord word={word} isReveal={true} />
            {wIdx < fArr.length - 1 && " "}
          </span>
        ));
      });

      return isBold ? (
        <strong key={index} className="font-bold text-slate-800 underline decoration-blue-200/50 decoration-2 underline-offset-2">{subParts}</strong>
      ) : (
        <span key={index}>{subParts}</span>
      );
    }

    if (revealed && renderWordCloud) {
      const cloudResult = renderWordCloud(part);
      return isBold ? (
        <strong key={index} className="font-bold text-slate-800 underline decoration-blue-200/50 decoration-2 underline-offset-2">
          {cloudResult}
        </strong>
      ) : (
        <span key={index}>{cloudResult}</span>
      );
    }

    const subParts = part.split(' ').map((word, wIdx, pArr) => (
      <span key={`std-${currentIndex}-${index}-${wIdx}`} className="inline">
        <InteractiveWord word={word} isReveal={revealed || hintMode} />
        {wIdx < pArr.length - 1 && " "}
      </span>
    ));

    if (isBold) {
      return (
        <strong key={index} className="font-bold text-slate-800 underline decoration-blue-200/50 decoration-2 underline-offset-2">
          {subParts}
        </strong>
      );
    }

    return <span key={index}>{subParts}</span>;
  });

  return { content, finalBold: isBold };
};

const StaticFormattedText = ({ text, initialBold = false }: { text: string; initialBold?: boolean }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*|\$\^\{.*?\}\$|\^\{.*?\}\$|\^\{.*?\}|\|\^\{.*?\}\$\|)/g);
  let isBold = initialBold;
  const content = parts.map((part, index) => {
    if (!part) return null;
    if (part === '**') { isBold = !isBold; return null; }
    if (part.startsWith('^') || part.startsWith('$^') || part.startsWith('|^')) {
      let supContent = part.replace(/[\$\^\{\}\s\|]*/g, '');
      if (part.includes('|')) {
        const match = part.match(/\^{(.*?)\}/);
        if (match) supContent = match[1];
      }
      return <sup key={index} className="text-[10px] font-bold text-blue-500 ml-0.5">{supContent}</sup>;
    }
    return isBold ? <strong key={index} className="font-bold">{part}</strong> : <span key={index}>{part}</span>;
  });
  return <>{content}</>;
};

// Wrapper for simple cases where we don't need to track state across components
const FormattedText = ({ text, revealed, currentIndex, initialBold = false, hintMode = false, wordsToMask = [], startHintIndex = 1, renderWordCloud }: { text: string; revealed: boolean, currentIndex: number, initialBold?: boolean, hintMode?: boolean, wordsToMask?: string[], startHintIndex?: number, renderWordCloud?: (text: string) => React.ReactNode }) => {
  const { content } = FormattedInteractiveText({ text, revealed, currentIndex, initialBold, hintMode, wordsToMask, startHintIndex, renderWordCloud });
  return <>{content}</>;
};

const AutoBoldEnglish = ({ text }: { text: string }) => {
  if (!text) return null;
  const parts = text.split(/("[^"]+"|\'[^\']+\'|\{[^\}]+\}|\[[^\]]+\]|\([^\)]+\))/g);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        const isEnclosed = (part.startsWith('"') && part.endsWith('"')) ||
          (part.startsWith("'") && part.endsWith("'")) ||
          (part.startsWith("{") && part.endsWith("}")) ||
          (part.startsWith("[") && part.endsWith("]")) ||
          (part.startsWith("(") && part.endsWith(")"));

        if (isEnclosed) {
          return <strong key={i} className="font-bold text-slate-900 mx-0.5">{part}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const DictationSentence = ({ targetText }: { targetText: string }) => {
  const [input, setInput] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when question changes
  useEffect(() => {
    setInput("");
    setIsCompleted(false);
  }, [targetText]);

  useEffect(() => {
    if (isCompleted || !targetText) return;
    let match = true; let hasLetters = false;
    for (let i = 0; i < targetText.length; i++) {
      const c = targetText[i];
      if (/[a-zA-Z]/.test(c)) {
        hasLetters = true;
        if (!input[i] || input[i].toLowerCase() !== c.toLowerCase()) { match = false; break; }
      }
    }
    if (match && hasLetters && input.length > 0) {
      setIsCompleted(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
      audio.play().catch(() => { });
    }
  }, [input, targetText, isCompleted]);

  return (
    <div
      className="relative w-full flex items-center cursor-text"
      onClick={() => textareaRef.current?.focus()}
    >
      {/* Visual Layer (On Top) */}
      <div className="relative z-20 pointer-events-none break-words whitespace-pre-wrap text-slate-400 font-mono font-bold text-[20px] leading-relaxed tracking-[0.02em] w-full p-0">
        {targetText.split('').map((char, i) => {
          const typed = input[i];
          const isLetter = /[a-zA-Z]/.test(char);
          if (!isLetter) return <span key={i} className="text-slate-300">{char}</span>;
          if (!typed) return <span key={i} className="text-slate-400">.</span>;
          const isCorrect = typed.toLowerCase() === char.toLowerCase();
          return (
            <span key={i} className={isCorrect ? "text-emerald-600" : "text-red-500 bg-red-50"}>
              {typed}
            </span>
          );
        })}
      </div>

      <textarea
        ref={textareaRef}
        value={input}
        data-dictation="true"
        onKeyDown={(e) => {
          if (e.key === '`') return;
          if (e.key === 'Enter') {
            e.preventDefault();
            const currentTarget = e.currentTarget;
            setTimeout(() => {
              const allTextareas = document.querySelectorAll('textarea');
              const currentIndex = Array.from(allTextareas).indexOf(currentTarget);
              if (currentIndex > -1 && currentIndex + 1 < allTextareas.length) allTextareas[currentIndex + 1].focus();
            }, 10);
          }
        }}
        onChange={(e) => { let val = e.target.value; if (val.length <= targetText.length) setInput(val); }}
        style={{ WebkitTextFillColor: "transparent", color: "transparent", caretColor: "#3b82f6" }}
        className="bg-transparent outline-none resize-none absolute inset-0 z-10 m-0 p-0 border-0 font-mono font-bold text-[20px] leading-relaxed tracking-[0.02em] overflow-hidden pointer-events-auto"
        spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
      />
      {isCompleted && (
        <div className="absolute right-0 top-[-25px] z-30 text-emerald-500 flex items-center gap-1 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm animate-bounce">
          <CheckCircleIcon className="w-3 h-3" /> Tuyệt vời!
        </div>
      )}
    </div>
  );
};

interface ProgressType {
  isCorrect: boolean;
  userAnswer: string;
  isFlagged: boolean;
  flagColor?: 'RED' | 'PURPLE' | 'BLUE' | 'YELLOW' | null;
}

export default function ToeicPart1Player({
  data: rawData,
  lessonId,
  initialProgress = {},
  courseId,
  nextLessonId,
  isReviewMode,
  onResolved,
  onToggleFlag,
  onProgressChange,
  isFullTest,
  onNextPart,
  onActiveQuestionChange,
  isSubmitted: externalIsSubmitted = false,
  jumpTo,
  globalOffset = 0,
  globalTotal,
  videoExplanation: videoExplanationRaw,
  onVideoQuestionSync,
  onToggleVideo,
  videoOpen
}: {
  data: any[];
  lessonId?: string;
  initialProgress?: Record<string, any>;
  courseId?: string;
  nextLessonId?: string;
  isReviewMode?: boolean;
  onResolved?: () => void;
  onToggleFlag?: (qId: string, flag: boolean, color?: FlagColor | null, note?: string) => void;
  onProgressChange?: (progress: Record<string, any>) => void;
  isFullTest?: boolean;
  onNextPart?: () => void;
  onActiveQuestionChange?: (questionNo: number) => void;
  isSubmitted?: boolean;
  jumpTo?: { id: string; ts: number } | null;
  globalOffset?: number;
  globalTotal?: number;
  videoExplanation?: any;
  onVideoQuestionSync?: (questionNo: number) => void;
  onToggleVideo?: () => void;
  videoOpen?: boolean;
}) {
  // Chuẩn hóa videoExplanation thành dạng vừa là Mảng vừa là Đối tượng đơn để tương thích ngược 100%
  const videoExplanation = (() => {
    if (!videoExplanationRaw) return null;
    const array = Array.isArray(videoExplanationRaw)
      ? videoExplanationRaw
      : [videoExplanationRaw];
    if (array.length === 0 || !array[0]?.videoUrl) return null;
    return Object.assign([...array], {
      videoUrl: array[0].videoUrl,
      videoType: array[0].videoType || "youtube",
      timestamps: array[0].timestamps || [],
    });
  })();

  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];

    return [...rawData].sort((a, b) => {
      const aNo = a.questions?.[0]?.questionNo || 999;
      const bNo = b.questions?.[0]?.questionNo || 999;
      return aNo - bNo;
    });
  }, [rawData]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [activeWordFamily, setActiveWordFamily] = useState<any[]>([]);
  const [popoverPos, setPopoverPos] = useState({ x: 100, y: 100 });

  useEffect(() => {
    setActiveWordFamily([]);
    setHoveredHotspotIndex(null);
    setSelectedHotspotIndex(null);
  }, [currentIndex]);

  const { isAdminMode } = useAdminEdit();
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <ClockIcon className="w-12 h-12 animate-pulse" />
        <p className="font-medium">Đang tải câu hỏi Part 1...</p>
      </div>
    );
  }
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [revealMode, setRevealMode] = useState(!!(externalIsSubmitted || isReviewMode));
  const [mode, setMode] = useState<'practice' | 'dictation'>('practice');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Tự động khởi chạy tour hướng dẫn học Part 1 lần đầu
    startToeicPartTour(1);
  }, []);

  const renderWordFamilyCloud = (text: string, children?: React.ReactNode) => {
    if (!revealMode) return children || text;

    const getMainKeys = (keyStr: string): string[] => {
      const clean = keyStr.replace(/\s*\([^)]*\)/g, '');
      return clean.split(/[,/]/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
    };

    const isWordMatch = (memberLower: string, wordLower: string): boolean => {
      if (memberLower === wordLower) return true;

      const endsWithE = memberLower.length > 2 && memberLower.endsWith('e');
      const stem = endsWithE ? memberLower.slice(0, -1) : memberLower;

      const lastChar = memberLower.slice(-1);
      const isConsonant = /^[bcdfghjklmnpqrstvwxyz]$/i.test(lastChar);
      
      if (wordLower.startsWith(stem)) {
        const suffix = wordLower.substring(stem.length);
        if (endsWithE) {
          if (/^(e|es|ed|ing|er|est|y|ely)$/.test(suffix)) return true;
        } else {
          if (/^(s|es|ed|ing|er|est|ly|y)?$/.test(suffix)) return true;
        }
      }

      if (isConsonant && !endsWithE) {
        const doubledStem = stem + lastChar;
        if (wordLower.startsWith(doubledStem)) {
          const suffix = wordLower.substring(doubledStem.length);
          if (/^(ed|ing|er|est)$/.test(suffix)) return true;
        }
      }

      return false;
    };

    const isRelatedWordMatch = (memberLower: string, wordLower: string): boolean => {
      if (memberLower === wordLower) return true;
      const endsWithE = memberLower.length > 2 && memberLower.endsWith('e');
      const stem = endsWithE ? memberLower.slice(0, -1) : memberLower;
      
      if (wordLower.startsWith(stem)) {
        const suffix = wordLower.substring(stem.length);
        return suffix.length <= 3 && /^(s|es|ed|ing|er|est|ly|y)?$/.test(suffix);
      }
      
      const lastChar = memberLower.slice(-1);
      const isConsonant = /^[bcdfghjklmnpqrstvwxyz]$/i.test(lastChar);
      if (isConsonant && !endsWithE) {
        const doubledStem = stem + lastChar;
        if (wordLower.startsWith(doubledStem)) {
          const suffix = wordLower.substring(doubledStem.length);
          return suffix.length <= 3 && /^(ed|ing|er|est)$/.test(suffix);
        }
      }

      return false;
    };

    if (children) {
      const cleanText = text.trim();
      let bestWordFams: any[] = [];

      for (let i = 0; i < part1WordFamiliesData.length; i++) {
        const fam = part1WordFamiliesData[i];
        if (!fam.words) continue;

        const foundMember = fam.words.find((member: string) => {
          const mLower = member.toLowerCase();
          const lower = cleanText.toLowerCase();
          if (mLower.includes(' ')) {
            return mLower === lower;
          } else {
            return isWordMatch(mLower, lower) || isRelatedWordMatch(mLower, lower);
          }
        });

        if (foundMember) {
          bestWordFams.push({ ...fam, matchedWord: cleanText });
        }
      }

      if (bestWordFams.length > 0) {
        const primaryFam = bestWordFams[0];
        return (
          <span className="relative inline-block group/cloud mx-0.5 select-text">
            {children}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (activeWordFamily.length > 0 && activeWordFamily[0].id === primaryFam.id) {
                  setActiveWordFamily([]);
                  return;
                }
                const rect = e.currentTarget.getBoundingClientRect();
                const parentRect = e.currentTarget.parentElement?.getBoundingClientRect() || rect;
                const popoverHeight = 360;
                const popoverWidth = 380;
                let x = parentRect.left;
                if (x + popoverWidth > window.innerWidth) {
                  x = Math.max(10, window.innerWidth - popoverWidth - 20);
                } else {
                  x = Math.max(10, x);
                }
                let y = parentRect.bottom + 8;
                if (y + popoverHeight > window.innerHeight && parentRect.top > popoverHeight + 20) {
                  y = parentRect.top - popoverHeight - 8;
                } else if (y + popoverHeight > window.innerHeight) {
                  y = Math.max(10, window.innerHeight - popoverHeight - 20);
                }
                setPopoverPos({ x, y });
                setActiveWordFamily(bestWordFams);
              }}
              className="absolute -top-[5px] -right-[6px] text-blue-400 hover:text-blue-600 transition-colors z-10 p-0 m-0 cursor-pointer"
              title={`Xem nhóm từ đồng nghĩa/trái nghĩa: ${primaryFam.key}`}
            >
              <svg className="w-2.5 h-2.5 fill-blue-100 stroke-blue-500 stroke-[1.5]" viewBox="0 0 24 24">
                <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z" />
              </svg>
            </button>
          </span>
        );
      }
      return children;
    }

    interface MatchCandidate {
      start: number;
      end: number;
      length: number;
      family: any;
      matchedWord: string;
      isPhrase: boolean;
      isColA: boolean;
      indexInDb: number;
      memberLength: number;
    }

    const candidates: MatchCandidate[] = [];

    part1WordFamiliesData.forEach((fam, dbIdx) => {
      if (!fam.words) return;
      fam.words.forEach((member: string) => {
        const isPhrase = member.includes(' ');
        const escaped = member.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        let regex: RegExp;

        if (isPhrase) {
          const parts = escaped.split('\\s+');
          const firstWord = parts[0];
          const rest = parts.slice(1).join('\\s+');
          const lastChar = member.split(' ')[0].slice(-1);
          const isConsonant = /^[bcdfghjklmnpqrstvwxyz]$/i.test(lastChar);
          
          if (isConsonant && parts.length > 0) {
            regex = new RegExp(`\\b${firstWord}(?:${lastChar})?(?:ing|ed|s)?\\s+${rest}\\b`, 'gi');
          } else {
            regex = new RegExp(`\\b${escaped}\\b`, 'gi');
          }
        } else {
          const lastChar = member.slice(-1);
          const isConsonant = /^[bcdfghjklmnpqrstvwxyz]$/i.test(lastChar);
          if (isConsonant && member.length >= 3) {
            regex = new RegExp(`\\b${escaped}(?:${lastChar})?(?:ing|ed|s|es|er|est|ly|y)?\\b`, 'gi');
          } else if (member.length >= 4) {
            regex = new RegExp(`\\b[a-zA-Z]*${escaped}[a-zA-Z]*\\b`, 'gi');
          } else {
            regex = new RegExp(`\\b${escaped}[a-zA-Z]{0,3}\\b`, 'gi');
          }
        }

        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(text)) !== null) {
          const matchedStr = match[0];
          if (!isPhrase) {
            const matches = isWordMatch(member.toLowerCase(), matchedStr.toLowerCase()) || isRelatedWordMatch(member.toLowerCase(), matchedStr.toLowerCase());
            if (!matches) continue;
          }
          const isColA = getMainKeys(fam.key).includes(member.toLowerCase());
          candidates.push({
            start: match.index,
            end: match.index + matchedStr.length,
            length: matchedStr.length,
            family: fam,
            matchedWord: matchedStr,
            isPhrase,
            isColA,
            indexInDb: dbIdx,
            memberLength: member.length
          });
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      });
    });

    candidates.sort((a, b) => {
      if (a.isPhrase !== b.isPhrase) return a.isPhrase ? -1 : 1;
      if (a.isColA !== b.isColA) return a.isColA ? -1 : 1;
      if (b.length !== a.length) return b.length - a.length;
      if (b.memberLength !== a.memberLength) return b.memberLength - a.memberLength;
      return a.indexInDb - b.indexInDb;
    });

    const selectedMatches: MatchCandidate[] = [];
    const isOccupied = new Array(text.length).fill(false);

    candidates.forEach(cand => {
      let occupied = false;
      for (let i = cand.start; i < cand.end; i++) {
        if (isOccupied[i]) {
          occupied = true;
          break;
        }
      }
      if (!occupied) {
        for (let i = cand.start; i < cand.end; i++) {
          isOccupied[i] = true;
        }
        selectedMatches.push(cand);
      }
    });

    selectedMatches.sort((a, b) => a.start - b.start);

    const resultElements: React.ReactNode[] = [];
    let lastIdx = 0;

    selectedMatches.forEach((match, idx) => {
      if (match.start > lastIdx) {
        resultElements.push(<React.Fragment key={`t-${idx}`}>{text.substring(lastIdx, match.start)}</React.Fragment>);
      }

      const wordLower = match.matchedWord.toLowerCase();
      const matchedFamsForWord: any[] = [];
      
      part1WordFamiliesData.forEach((fam: any) => {
        if (!fam.words) return;
        const hasWord = fam.words.some((m: string) => {
          const mLower = m.toLowerCase();
          if (mLower.includes(' ')) {
            return mLower === wordLower;
          } else {
            return isWordMatch(mLower, wordLower) || isRelatedWordMatch(mLower, wordLower);
          }
        });
        if (hasWord) {
          matchedFamsForWord.push({ ...fam, matchedWord: match.matchedWord });
        }
      });

      if (matchedFamsForWord.length === 0) {
        matchedFamsForWord.push({ ...match.family, matchedWord: match.matchedWord });
      }

      resultElements.push(
        <span key={`m-${idx}`} className="relative inline-block group/cloud mx-0.5 select-text">
          {text.substring(match.start, match.end)}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (activeWordFamily.length > 0 && activeWordFamily[0].id === matchedFamsForWord[0].id) {
                setActiveWordFamily([]);
                return;
              }
              const rect = e.currentTarget.getBoundingClientRect();
              const parentRect = e.currentTarget.parentElement?.getBoundingClientRect() || rect;
              const popoverHeight = 360;
              const popoverWidth = 380;
              let x = parentRect.left;
              if (x + popoverWidth > window.innerWidth) {
                x = Math.max(10, window.innerWidth - popoverWidth - 20);
              } else {
                x = Math.max(10, x);
              }
              let y = parentRect.bottom + 8;
              if (y + popoverHeight > window.innerHeight && parentRect.top > popoverHeight + 20) {
                y = parentRect.top - popoverHeight - 8;
              } else if (y + popoverHeight > window.innerHeight) {
                y = Math.max(10, window.innerHeight - popoverHeight - 20);
              }
              setPopoverPos({ x, y });
              setActiveWordFamily(matchedFamsForWord);
            }}
            className="absolute -top-[5px] -right-[6px] text-blue-400 hover:text-blue-600 transition-colors z-10 p-0 m-0 cursor-pointer"
            title={`Xem nhóm từ đồng nghĩa/trái nghĩa: ${matchedFamsForWord[0].key}`}
          >
            <svg className="w-2.5 h-2.5 fill-blue-100 stroke-blue-500 stroke-[1.5]" viewBox="0 0 24 24">
              <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z" />
            </svg>
          </button>
        </span>
      );
      lastIdx = match.end;
    });

    if (lastIdx < text.length) {
      resultElements.push(<React.Fragment key="t-end">{text.substring(lastIdx)}</React.Fragment>);
    }

    return resultElements;
  };

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    let acc: any = {};
    const safeProgress = initialProgress || {};
    Object.keys(safeProgress).forEach(k => {
      if (safeProgress[k]?.userAnswer) acc[k] = safeProgress[k].userAnswer;
    });
    return acc;
  });
  const [flags, setFlags] = useState<Record<string, FlagColor | null>>(() => {
    let acc: any = {};
    Object.keys(initialProgress).forEach(k => {
      acc[k] = initialProgress[k].isFlagged ? (initialProgress[k].flagColor || 'RED') : null;
    });
    return acc;
  });
  const [flagNotes, setFlagNotes] = useState<Record<string, string>>(() => {
    let acc: any = {};
    Object.keys(initialProgress).forEach(k => {
      if (initialProgress[k]?.flagNote) acc[k] = initialProgress[k].flagNote;
    });
    return acc;
  });

  useEffect(() => {
    if (onProgressChange) {
      const progress: Record<string, any> = {};
      const allIds = new Set([...Object.keys(answers), ...Object.keys(flags), ...Object.keys(flagNotes)]);
      allIds.forEach(id => {
        progress[id] = {
          userAnswer: answers[id] || null,
          isFlagged: !!flags[id],
          flagColor: flags[id] || null,
          flagNote: flagNotes[id] || null,
          isCorrect: false
        };
      });
      onProgressChange(progress);
    }
  }, [answers, flags, flagNotes, onProgressChange]);

  // Nhảy tới câu hỏi từ Full Test Sidebar
  useEffect(() => {
    if (jumpTo?.id && data.length > 0) {
      const targetNo = String(jumpTo.id);
      // Tìm vị trí của nhóm chứa câu hỏi có số thứ tự trùng với targetNo
      const idx = data.findIndex(g => String(g.questions?.[0]?.questionNo) === targetNo);

      if (idx !== -1) {
        console.log(`[Part 1] Jumping to group containing question ${targetNo} at index ${idx}`);
        setCurrentIndex(idx);
      }
    }
  }, [jumpTo, data]);

  // Sync revealMode with externalIsSubmitted
  useEffect(() => {
    if (externalIsSubmitted) {
      setRevealMode(true);
      setIsSubmitted(true);
    }
  }, [externalIsSubmitted]);

  useEffect(() => {
    const q = data[currentIndex]?.questions?.[0];
    if (onActiveQuestionChange && q?.questionNo) {
      onActiveQuestionChange(q.questionNo);
    }
  }, [currentIndex, data, onActiveQuestionChange]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(externalIsSubmitted);
  const [isHintMode, setIsHintMode] = useState(false);

  // Lắng nghe sự kiện từ Tour Hướng Dẫn để tự động bật tắt chế độ
  useEffect(() => {
    const handleDictationMode = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.open) {
        setMode('dictation');
      } else {
        setMode('practice');
      }
    };

    const handleHintMode = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsHintMode(customEvent.detail.open);
    };

    window.addEventListener("toeic-tour-dictation-mode", handleDictationMode);
    window.addEventListener("toeic-tour-hint-mode", handleHintMode);

    return () => {
      window.removeEventListener("toeic-tour-dictation-mode", handleDictationMode);
      window.removeEventListener("toeic-tour-hint-mode", handleHintMode);
    };
  }, []);
  const [testScore, setTestScore] = useState({ correct: 0, total: 0, incorrect: 0, unanswered: 0 });
  const [time, setTime] = useState(0);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [playingSegmentLabel, setPlayingSegmentLabel] = useState<string | null>(null);
  const [hoveredHotspotIndex, setHoveredHotspotIndex] = useState<number | null>(null);
  const [selectedHotspotIndex, setSelectedHotspotIndex] = useState<number | null>(null);

  const currentGroup = data[currentIndex] || {};
  const questionData = currentGroup?.questions?.[0] || {};
  const currentQuestionId = questionData.id;
  const currentQKey = questionData.id || `${currentGroup.id}_${questionData.questionNo}`;

  const router = useRouter();
  const [localHotspots, setLocalHotspots] = useState<any[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [synonymsInputVal, setSynonymsInputVal] = useState("");

  useEffect(() => {
    if (selectedHotspotIndex !== null && localHotspots[selectedHotspotIndex]) {
      const activeHs = localHotspots[selectedHotspotIndex];
      
      // Parse the current local state string to structural objects to compare
      const currentParsed = synonymsInputVal.split(',').map(item => {
        const clean = item.trim();
        if (!clean) return null;
        const match = clean.match(/^(.*?)\s*[\(\[](.*?)[\)\]]$/);
        if (match) {
          return { word: match[1].trim(), ipa: match[2].trim() };
        }
        return { word: clean, ipa: "" };
      }).filter((item): item is { word: string; ipa: string } => item !== null);

      const activeSyns = Array.isArray(activeHs.synonyms)
        ? activeHs.synonyms
        : typeof activeHs.synonyms === 'string'
          ? [{ word: activeHs.synonyms, ipa: "" }]
          : [];

      // Check structural equivalence to avoid overwriting synonymsInputVal while the user is typing
      const isEquivalent = currentParsed.length === activeSyns.length && currentParsed.every((val, i) => {
        const other = activeSyns[i];
        return other && val.word === other.word && val.ipa === other.ipa;
      });

      if (!isEquivalent) {
        const valText = Array.isArray(activeHs.synonyms)
          ? activeHs.synonyms.map((s: any) => `${s.word}${s.ipa ? ` (${s.ipa})` : ''}`).join(', ')
          : typeof activeHs.synonyms === 'string'
            ? activeHs.synonyms
            : "";
        setSynonymsInputVal(valText);
      }
    } else {
      setSynonymsInputVal("");
    }
  }, [selectedHotspotIndex, localHotspots]);
  const hotspotsContainerRef = useRef<HTMLDivElement>(null);
  const localHotspotsRef = useRef<any[]>([]);
  
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Đồng bộ localHotspots khi đổi question group
  useEffect(() => {
    let meta: any = null;
    if (currentGroup?.metadata) {
      if (typeof currentGroup.metadata === 'string') {
        try {
          meta = JSON.parse(currentGroup.metadata);
        } catch (e) {}
      } else if (typeof currentGroup.metadata === 'object') {
        meta = currentGroup.metadata;
      }
    }

    if (meta && Array.isArray(meta.hotspots)) {
      const hots = JSON.parse(JSON.stringify(meta.hotspots));
      setLocalHotspots(hots);
      localHotspotsRef.current = hots;
    } else {
      setLocalHotspots([]);
      localHotspotsRef.current = [];
    }
  }, [currentGroup]);

  // Luôn cập nhật ref bằng giá trị state mới nhất
  useEffect(() => {
    localHotspotsRef.current = localHotspots;
  }, [localHotspots]);

  // Xử lý kéo thả chấm tròn hotspot
  useEffect(() => {
    if (draggingIndex === null || !isAdminMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!hotspotsContainerRef.current) return;
      const rect = hotspotsContainerRef.current.getBoundingClientRect();
      
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      const updated = [...localHotspotsRef.current];
      if (updated[draggingIndex]) {
        updated[draggingIndex] = {
          ...updated[draggingIndex],
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100
        };
        localHotspotsRef.current = updated;
        setLocalHotspots(updated);
      }
    };

    const handleMouseUp = async () => {
      setDraggingIndex(null);
      
      // Tự động lưu tọa độ mới nhất của các hotspot từ ref vào database khi thả chuột
      try {
        const res = await fetch("/api/admin/update-content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target: "group",
            id: currentGroup.id,
            field: "metadata.hotspots",
            value: localHotspotsRef.current
          })
        });
        const data = await res.json();
        if (data.success) {
          // Cập nhật trực tiếp vào currentGroup.metadata để tránh bị đè dữ liệu cũ khi đổi câu hỏi
          if (currentGroup) {
            let meta: any = currentGroup.metadata;
            if (!meta) {
              currentGroup.metadata = {};
              meta = currentGroup.metadata;
            } else if (typeof meta === 'string') {
              try {
                currentGroup.metadata = JSON.parse(meta);
                meta = currentGroup.metadata;
              } catch (e) {
                currentGroup.metadata = {};
                meta = currentGroup.metadata;
              }
            }
            meta.hotspots = JSON.parse(JSON.stringify(localHotspotsRef.current));
          }

          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          setSaveStatus({ type: 'success', message: 'Đã lưu vị trí hotspot thành công!' });
          saveTimeoutRef.current = setTimeout(() => setSaveStatus(null), 2500);

          router.refresh();
        } else {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          setSaveStatus({ type: 'error', message: `Lỗi: ${data.error || 'Vui lòng kéo lại để lưu.'}` });
          saveTimeoutRef.current = setTimeout(() => setSaveStatus(null), 5000);
        }
      } catch (err: any) {
        console.error("Lỗi tự động lưu vị trí hotspot:", err);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaveStatus({ type: 'error', message: 'Lỗi kết nối. Vui lòng kéo lại để lưu.' });
        saveTimeoutRef.current = setTimeout(() => setSaveStatus(null), 5000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIndex, isAdminMode, currentGroup]);

  const handleUpdateActiveHsField = (fieldKey: string, val: any) => {
    const activeIdx = hoveredHotspotIndex !== null ? hoveredHotspotIndex : selectedHotspotIndex;
    if (activeIdx === null) return;
    
    setLocalHotspots(prev => {
      const next = [...prev];
      if (next[activeIdx]) {
        next[activeIdx] = {
          ...next[activeIdx],
          [fieldKey]: val
        };
      }
      return next;
    });
  };

  const handleSaveHotspotsData = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch("/api/admin/update-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "group",
          id: currentGroup.id,
          field: "metadata.hotspots",
          value: localHotspots
        })
      });
      const data = await res.json();
      if (data.success) {
        if (currentGroup) {
          let meta: any = currentGroup.metadata;
          if (!meta) {
            currentGroup.metadata = {};
            meta = currentGroup.metadata;
          } else if (typeof meta === 'string') {
            try {
              currentGroup.metadata = JSON.parse(meta);
              meta = currentGroup.metadata;
            } catch (e) {
              currentGroup.metadata = {};
              meta = currentGroup.metadata;
            }
          }
          meta.hotspots = JSON.parse(JSON.stringify(localHotspots));
        }
        router.refresh();
      } else {
        alert("Lỗi khi lưu: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteHotspot = async () => {
    const activeIdx = hoveredHotspotIndex !== null ? hoveredHotspotIndex : selectedHotspotIndex;
    if (activeIdx === null) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa Hotspot #${activeIdx + 1} (${localHotspots[activeIdx]?.en || ''})?`)) {
      return;
    }

    setSaveLoading(true);
    const updated = localHotspots.filter((_, idx) => idx !== activeIdx);
    
    try {
      const res = await fetch("/api/admin/update-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "group",
          id: currentGroup.id,
          field: "metadata.hotspots",
          value: updated
        })
      });
      const data = await res.json();
      if (data.success) {
        if (currentGroup) {
          let meta: any = currentGroup.metadata;
          if (!meta) {
            currentGroup.metadata = {};
            meta = currentGroup.metadata;
          } else if (typeof meta === 'string') {
            try {
              currentGroup.metadata = JSON.parse(meta);
              meta = currentGroup.metadata;
            } catch (e) {
              currentGroup.metadata = {};
              meta = currentGroup.metadata;
            }
          }
          meta.hotspots = JSON.parse(JSON.stringify(updated));
        }
        setSelectedHotspotIndex(null);
        setHoveredHotspotIndex(null);
        setLocalHotspots(updated);
        router.refresh();
      } else {
        alert("Lỗi khi xóa: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Lắng nghe sự kiện từ Tour để tự động mở bung Sidebar làm ví dụ
  useEffect(() => {
    const handleTourSidebar = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsSidebarHovered(customEvent.detail.open);
    };
    window.addEventListener("toeic-tour-sidebar", handleTourSidebar);
    return () => window.removeEventListener("toeic-tour-sidebar", handleTourSidebar);
  }, []);
  const playingSegmentRef = useRef<{ label: string, end: number } | null>(null);




  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const regionsPlugin = useRef<any>(null);

  const correctAnswer = questionData.correctAnswer?.toUpperCase();
  const selectedAnswer = answers[currentQKey] || null;
  const isFlagged = flags[currentQKey] || false;

  const richData = React.useMemo(() => {
    try {
      const meta = questionData.metadata as any;
      if (meta?.vietnamese && typeof meta.vietnamese === 'object') {
        const v = meta.vietnamese;
        return {
          question: { vi: v.question },
          options: v.options?.map((o: any) => ({ label: o.label, vi: o.text })),
          explanation: v.explanation || v,
          vocabulary: v.vocabulary || v.explanation?.vocabulary
        };
      }
      if (!questionData.explanation) return null;
      const parsed = typeof questionData.explanation === 'string'
        ? JSON.parse(questionData.explanation)
        : questionData.explanation;

      if (parsed.question || parsed.options || (parsed.explanation && (parsed.explanation.correct || parsed.explanation.why_correct))) {
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [questionData.explanation, questionData.metadata]);

  let explanationObj = { vietText: "" };
  if (!richData) {
    try { if (questionData.explanation) explanationObj = JSON.parse(questionData.explanation); } catch (e) { }
  }

  const engParts = parseOptionsFromText(currentGroup?.transcript || "");
  const vieParts = parseOptionsFromText(explanationObj.vietText || "");

  // --- HINT MODE LOGIC: Smart Constituent Masking (NP, VP) ---
  const hintMasksMap = useMemo(() => {
    const aux = new Set(['is', 'are', 'was', 'were', 'am', 'be', 'been', 'being', 'has', 'have', 'had']);
    const det = new Set(['a', 'an', 'the', 'some', 'any', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'last', 'next', 'each', 'every', 'all']);
    const prep = new Set(['in', 'on', 'at', 'by', 'with', 'for', 'from', 'to', 'of', 'about', 'over', 'under', 'across', 'through', 'into', 'along', 'behind', 'beside', 'near', 'past', 'up', 'down']);
    const adverbs = new Set(['downtown', 'upstairs', 'downstairs', 'nearby', 'outside', 'inside', 'away', 'here', 'there', 'soon', 'now', 'later', 'already', 'yet', 'still', 'everywhere', 'anywhere', 'somewhere', 'yesterday', 'today', 'tomorrow']);

    const maskedGlobal = new Set<string>();
    const map: Record<string, string[]> = {};

    ['A', 'B', 'C', 'D'].forEach(opt => {
      const text = engParts.find(p => p.label === opt)?.text || (questionData as any)[`option${opt}`] || "";
      if (!text) return;

      const tokens = text.split(' ');
      const candidates: string[] = [];

      const isProperNoun = (idx: number) => {
        const t = tokens[idx];
        if (!t) return false;
        const clean = t.replace(/[^\w]/g, '');
        if (!clean) return false;
        // Capitalized and not the very first word of the sentence
        return clean.charAt(0) === clean.charAt(0).toUpperCase() &&
          clean.charAt(0) !== clean.charAt(0).toLowerCase() &&
          idx > 0;
      };

      // Step 1: Identify Verb Phrases (VP)
      // Pattern: AUX? + VERB-ing/ed + PREP?
      for (let i = 0; i < tokens.length; i++) {
        if (isProperNoun(i)) continue;
        const word = tokens[i].toLowerCase().replace(/[^\w]/g, '');
        if (word.endsWith('ing') || word.endsWith('ed')) {
          let vpTokens = [tokens[i]];
          // Check for particle/prep after verb (e.g., leaning OVER)
          if (i + 1 < tokens.length) {
            const next = tokens[i + 1].toLowerCase().replace(/[^\w]/g, '');
            if (prep.has(next)) {
              vpTokens.push(tokens[i + 1]);
            }
          }
          candidates.push(vpTokens.join(' ').replace(/[^\w\s]+$/g, ''));
        }
      }

      // Step 2: Identify Noun Phrases (NP)
      // Pattern: DET? + NOUN/ADJ + NOUN
      for (let i = 0; i < tokens.length; i++) {
        if (isProperNoun(i)) continue;
        const word = tokens[i].toLowerCase().replace(/[^\w]/g, '');
        if (det.has(word)) {
          let npTokens = [];
          let j = i + 1;
          while (j < tokens.length && j < i + 4) {
            const nextWord = tokens[j].toLowerCase().replace(/[^\w]/g, '');
            if (aux.has(nextWord) || prep.has(nextWord) || det.has(nextWord)) break;

            // Stop if we hit a verb (ing/ed) - it belongs to a VP
            if (nextWord.endsWith('ing') || nextWord.endsWith('ed')) break;

            // If we already have a potential noun, don't include trailing adverbs in the same cluster
            if (npTokens.length >= 1 && adverbs.has(nextWord)) break;

            npTokens.push(tokens[j].replace(/[^\w\s]+$/g, ''));

            // Break IF the current token has punctuation (it should be the end of the cluster)
            if (/[.,;?!]/.test(tokens[j])) break;

            j++;
          }
          if (npTokens.length > 0) candidates.push(npTokens.join(' ').replace(/[^\w\s]+$/g, ''));
        }
      }

      // Final fallback: any single long word not handled
      tokens.forEach((t: string, idx: number) => {
        if (isProperNoun(idx)) return;
        const clean = t.toLowerCase().replace(/[^\w]/g, '');
        if (clean.length > 4 && !aux.has(clean) && !det.has(clean) && !prep.has(clean)) {
          if (!candidates.some(c => c.includes(t))) candidates.push(t.replace(/[^\w\s]+$/g, ''));
        }
      });

      // Sort: favor multi-word phrases, then length
      candidates.sort((a, b) => {
        const aCount = a.split(' ').length;
        const bCount = b.split(' ').length;
        if (aCount !== bCount) return bCount - aCount;
        return b.length - a.length;
      });

      const picked: string[] = [];
      for (const cand of candidates) {
        const candClean = cand.toLowerCase().replace(/[^\w\s]/g, '');
        // Avoid duplicates and overlapping masks
        if (![...maskedGlobal].some(m => candClean.includes(m) || m.includes(candClean))) {
          picked.push(cand);
          cand.split(' ').forEach(w => maskedGlobal.add(w.toLowerCase().replace(/[^\w]/g, '')));
          if (picked.length >= 2) break;
        }
      }
      map[opt] = picked;
    });
    return map;
  }, [questionData, engParts]);

  // -- Timer Logic --
  useEffect(() => {
    if (isSubmitted || showCompletion || isReviewMode) return;
    const interval = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, showCompletion, isReviewMode]);

  // -- Cảnh báo mất dữ liệu (Before Unload & Navigation Guard) --
  useEffect(() => {
    const hasUnsavedData = Object.keys(answers).length > 0 && !isSubmitted && !isReviewMode;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleInternalNavigation = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && hasUnsavedData) {
        const url = new URL(anchor.href);
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          if (!window.confirm("Dữ liệu bài làm chưa được nộp sẽ bị mất. Bạn có chắc muốn chuyển bài hông?")) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleInternalNavigation, { capture: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleInternalNavigation, { capture: true });
    };
  }, [isSubmitted, isReviewMode, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (opt: string) => {
    if (showCompletion || isSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentQKey]: opt }));
  };

  const handleRetake = () => {
    if (!window.confirm("Bạn có chắc muốn xóa hết kết quả để làm lại bài này từ đầu?")) return;
    setAnswers({});
    setTime(0);
    setIsSubmitted(false);
    setRevealMode(false);
    setShowCompletion(false);
  };

  const handleUpdateFlag = async (questionId: string, color: FlagColor | null, note?: string, deleteNote: boolean = false) => {
    setFlags(prev => ({ ...prev, [questionId]: color }));
    if (note !== undefined || deleteNote) {
      setFlagNotes(prev => {
        const next = { ...prev };
        if (deleteNote) delete next[questionId];
        else if (note !== undefined) next[questionId] = note;
        return next;
      });
    }

    try {
      await fetch('/api/progress/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'flag',
          questionId,
          lessonId,
          isFlagged: !!color,
          flagColor: color,
          flagNote: deleteNote ? "" : (note !== undefined ? note : flagNotes[questionId])
        })
      });
    } catch (err) {
      console.error("Lỗi khi gắn cờ:", err);
    }

    if (onToggleFlag) onToggleFlag(questionId, !!color, color, note !== undefined ? note : flagNotes[questionId]);
  };

  const handleFinishTest = async () => {
    const answeredCount = Object.keys(answers).length;
    const totalCount = data.length;

    if (answeredCount < totalCount) {
      if (!window.confirm(`Bạn còn ${totalCount - answeredCount} câu chưa trả lời. Nộp bài ngay?`)) return;
    } else {
      if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return;
    }

    let correctCount = 0; let unansweredCount = 0;
    const payload = data.map(group => {
      const q = group.questions[0];
      const qKey = q.id || `${group.id}_${q.questionNo}`;
      const ans = answers[qKey] || "";
      const isCorrect = ans === q.correctAnswer;
      if (!ans) {
        unansweredCount++;
        return null; // Trả về null cho câu chưa làm
      }
      if (isCorrect) correctCount++;
      return {
        questionId: q.id || qKey,
        lessonId,
        userAnswer: ans,
        isCorrect,
        isFlagged: !!flags[qKey],
        flagColor: flags[qKey] || null
      };
    }).filter(item => item !== null) as any[];

    setTestScore({ correct: correctCount, total: totalCount, incorrect: totalCount - correctCount - unansweredCount, unanswered: unansweredCount });

    if (lessonId) {
      setIsSubmitting(true);
      try {
        await fetch('/api/progress/questions', { method: 'POST', body: JSON.stringify({ mode: 'batch', attempts: payload }) });
        await fetch('/api/progress/lessons', { method: 'POST', body: JSON.stringify({ lessonId, isCompleted: true }) });
      } catch (e) { }
      setIsSubmitting(false);
    }
    setIsSubmitted(true); setShowCompletion(true);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.3 } });
  };

  // -- Tính toán điểm số cho Review Mode nếu có initialProgress --
  useEffect(() => {
    if (isReviewMode && Object.keys(initialProgress).length > 0) {
      let c = 0; let i = 0; let u = 0;
      data.forEach(group => {
        const q = group.questions[0];
        const prog = initialProgress[q.id];
        if (!prog?.userAnswer) u++;
        else if (prog.userAnswer === q.correctAnswer) c++;
        else i++;
      });
      setTestScore({ correct: c, total: data.length, incorrect: i, unanswered: u });
    }
  }, [isReviewMode, initialProgress, data]);

  useEffect(() => {
    if (!isSubmitted && !isReviewMode) {
      setRevealMode(false);
    } else {
      setRevealMode(true);
    }
  }, [currentIndex, isSubmitted, isReviewMode]);

  useEffect(() => {
    const nextGroup = data[currentIndex + 1];
    if (nextGroup) {
      if (nextGroup.audioUrl) { const audio = new Audio(); audio.src = nextGroup.audioUrl; }
      if (nextGroup.imageUrl) { const img = new Image(); img.src = nextGroup.imageUrl; }
    }
  }, [currentIndex, data]);

  useEffect(() => {
    if (!waveformRef.current || !currentGroup?.audioUrl) return;
    if (wavesurfer.current) wavesurfer.current.destroy();
    const wsRegions = RegionsPlugin.create();
    regionsPlugin.current = wsRegions;
    const ws = WaveSurfer.create({
      container: waveformRef.current, waveColor: '#cbd5e1', progressColor: '#3b82f6', cursorColor: '#1d4ed8',
      barWidth: 2, barGap: 2, barRadius: 2, height: 36, plugins: [wsRegions], fetchParams: { cache: "default" }
    });
    ws.load(currentGroup.audioUrl).catch(() => { });
    wavesurfer.current = ws;
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));
    ws.on('ready', () => ws.setPlaybackRate(playbackRate));
    wsRegions.enableDragSelection({ color: 'rgba(59, 130, 246, 0.2)' });

    // --- WAVEFORM INTERACTION LOGIC ---
    const isDragging = { current: false };
    const hasDragged = { current: false };
    let mouseDownX = 0;
    const DRAG_THRESHOLD = 5;

    waveformRef.current.addEventListener('mousedown', (e: MouseEvent) => {
      isDragging.current = true;
      hasDragged.current = false;
      mouseDownX = e.clientX;

      // Seek tới vị trí click NGAY LẬP TỨC để audio không chạy về phía cuối file
      // trong lúc kéo (tránh finish event → audio dừng trước khi mouseup)
      const rect = (waveformRef.current as HTMLElement).getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const dur = ws.getDuration();
      if (dur > 0) ws.seekTo(Math.max(0, Math.min(1, ratio)));
    });

    waveformRef.current.addEventListener('mousemove', (e: MouseEvent) => {
      if (isDragging.current && Math.abs(e.clientX - mouseDownX) > DRAG_THRESHOLD) {
        hasDragged.current = true;
      }
    });

    wsRegions.on('region-created', (region: any) => {
      if (!hasDragged.current) {
        // Click đơn: xóa region auto-created, không thay đổi vùng chọn cũ
        region.remove();
        return;
      }
      // Kéo thực sự: xóa region cũ
      wsRegions.getRegions().forEach((r: any) => { if (r.id !== region.id) r.remove(); });
    });

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const regions = wsRegions.getRegions();

      if (!hasDragged.current) {
        // Click đơn: nếu có region → luôn seek về đầu region và play loop
        if (regions.length > 0) {
          const dur = ws.getDuration();
          if (dur > 0) ws.seekTo(regions[0].start / dur);
          ws.play();
        }
        // Không có region: WaveSurfer đã seek theo click (từ mousedown), chơi tiếp
        return;
      }

      // Kéo xong: play từ đầu vùng chọn mới (audio đang ở gần đó nhờ seek on mousedown)
      if (regions.length > 0) {
        const start = regions[0].start;
        const dur = ws.getDuration();
        if (dur > 0) ws.seekTo(start / dur);
        ws.play();
      }
    };
    waveformRef.current.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handleMouseUp);

    // Double-click → xóa hết regions
    waveformRef.current.addEventListener('dblclick', () => {
      wsRegions.getRegions().forEach((r: any) => r.remove());
    });

    // Xử lý dừng audio segment và Loop trong vùng chọn
    ws.on('timeupdate', (currentTime: number) => {
      if (isDragging.current) return;

      // 1. Kiểm tra dừng segment (A, B, C, D)
      if (playingSegmentRef.current) {
        if (currentTime >= playingSegmentRef.current.end) {
          ws.pause();
          playingSegmentRef.current = null;
          setPlayingSegmentLabel(null);
        }
      }

      // 2. Loop trong vùng chọn thủ công
      const regions = wsRegions.getRegions();
      if (regions.length > 0) {
        const region = regions[0];
        if (currentTime >= region.end) ws.play(region.start);
      }
    });

    // Reset state nếu dừng thủ công hoặc kết thúc
    const clearPlayingState = () => {
      playingSegmentRef.current = null;
      setPlayingSegmentLabel(null);
    };
    ws.on('pause', clearPlayingState);
    ws.on('finish', clearPlayingState);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      ws.destroy();
    };
  }, [currentGroup?.audioUrl]);

  const playSegment = (label: string) => {
    const timestamps = (currentGroup?.metadata as any)?.timestamps;
    if (!wavesurfer.current || !timestamps?.[label]) return;

    const { start, end } = timestamps[label];
    const ws = wavesurfer.current;

    // Xóa vùng chọn thủ công
    regionsPlugin.current?.getRegions().forEach((r: any) => r.remove());

    // Cập nhật ref và nhảy thời gian ngay
    playingSegmentRef.current = { label, end };
    ws.setTime(start);

    // Đợi một chút để đảm bảo việc seek hoàn tất trước khi play và hiện highlight
    setTimeout(() => {
      ws.play().catch(() => ws.play());
      setPlayingSegmentLabel(label);
    }, 50);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        e.preventDefault();
        if (!wavesurfer.current) return;
        const ws = wavesurfer.current;
        const regions = regionsPlugin.current?.getRegions();
        if (regions && regions.length > 0) {
          const r = regions[0];
          if (ws.isPlaying()) ws.pause(); else ws.play(r.start);
        } else { ws.playPause(); }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex === data.length - 1) {
          if (isFullTest && onNextPart) onNextPart();
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const labels = ['A', 'B', 'C', 'D'];
        playSegment(labels[parseInt(e.key) - 1]);
      }

      // CTRL/CMD + SHIFT + S: Toggle Solution
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setRevealMode(prev => !prev);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, data.length, isFullTest, onNextPart]);

  const changeSpeed = (speed: number) => {
    setPlaybackRate(speed);
    if (wavesurfer.current) wavesurfer.current.setPlaybackRate(speed);
  };

  if (!data || data.length === 0) return <div>Không có dữ liệu bài tập!</div>;

  if (showCompletion) {
    return (
      <div className="absolute inset-0 w-full h-full bg-[#f8fafc] z-[200] overflow-y-auto flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-w-4xl bg-white rounded-[40px] p-8 md:p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100/50 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600"></div>

          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 mx-auto shadow-inner ring-8 ring-emerald-50/50">
            <TrophyIcon className="w-12 h-12 text-emerald-500" />
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-[#05b169] mb-4 tracking-tight uppercase">
            HOÀN THÀNH BÀI LÀM!
          </h2>
          <p className="text-slate-400 mb-12 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2">
            <ClockIcon className="w-4 h-4" /> Thời gian hoàn thành: {formatTime(time)}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full mb-12">
            <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100/50 flex flex-col items-center transition-transform hover:scale-105">
              <div className="text-blue-600 font-black text-4xl mb-1">{testScore.total}</div>
              <div className="text-blue-400 text-[10px] font-black uppercase tracking-wider">Tổng số câu</div>
            </div>
            <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100/50 flex flex-col items-center transition-transform hover:scale-105">
              <div className="text-emerald-600 font-black text-4xl mb-1">{testScore.correct}</div>
              <div className="text-emerald-500 text-[10px] font-black uppercase tracking-wider">Câu đúng</div>
            </div>
            <div className="bg-red-50/50 p-6 rounded-[32px] border border-red-100/50 flex flex-col items-center transition-transform hover:scale-105">
              <div className="text-red-600 font-black text-4xl mb-1">{testScore.incorrect}</div>
              <div className="text-red-400 text-[10px] font-black uppercase tracking-wider">Câu sai</div>
            </div>
            <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-200/50 flex flex-col items-center transition-transform hover:scale-105">
              <div className="text-slate-600 font-black text-4xl mb-1">{testScore.total > 0 ? Math.round((testScore.correct / testScore.total) * 100) : 0}%</div>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Tỷ lệ đúng</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setShowCompletion(false)}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-600 font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              👁️ Xem lại bài
            </button>

            <button
              onClick={handleRetake}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.2)] font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              🔄 Làm lại bài
            </button>

            {nextLessonId && (
              <Link
                href={`/learn/${courseId}/lesson/${nextLessonId}`}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-wide group"
              >
                Bài tiếp theo <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="absolute inset-0 flex flex-col font-sans bg-[#f8fafc] text-slate-800 overflow-hidden pr-20">
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-20 scrollbar-thin">



            <div className="flex flex-wrap justify-between items-center bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 mb-2 gap-2">
              <div className="flex items-center gap-2">
                <button id="dictation-mode-btn" onClick={() => setMode(mode === 'dictation' ? 'practice' : 'dictation')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${mode === 'dictation' ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>✏️ Chế độ Chép chính tả</button>
                <button id="hint-mode-btn" onClick={() => setIsHintMode(!isHintMode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${isHintMode ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-500 hover:border-slate-300'}`}>💡 Chế Độ Gợi Ý</button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto mb-4 relative z-[250]">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-3 py-2 flex items-center gap-3">
                {/* Play/Pause Button */}
                <div className="relative group shrink-0 pl-0.5">
                  <button
                    id="play-audio-btn"
                    onClick={() => wavesurfer.current?.playPause()}
                    className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-100 transition-all active:scale-95 ring-4 ring-indigo-50"
                  >
                    {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 pl-0.5" />}
                  </button>

                  {/* Tooltip on Hover */}
                  <div className="absolute left-0 top-full mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] -translate-y-2 group-hover:translate-y-0">
                    {isPlaying ? 'DỪNG' : 'PHÁT'} (PHÍM ` DƯỚI ESC)
                    <div className="absolute -top-1 left-5 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>

                {/* Waveform Container */}
                <div className="flex-1 overflow-hidden rounded-lg" style={{ height: 36 }}>
                  <div id="waveform-audio-container" ref={waveformRef} className="w-full h-full cursor-crosshair" />
                </div>

                {/* Speed Controls */}
                <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-0.5 shrink-0 mr-0.5">
                  {[0.5, 0.75, 1, 1.25, 1.5].map(speed => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`px-2 py-1 rounded-md text-[10px] font-black transition-all ${playbackRate === speed ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4 items-center max-w-full">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 relative h-fit flex-shrink-0 z-[300]">
                <div className="rounded-xl overflow-visible bg-slate-50 flex justify-center items-center relative">
                  {currentGroup.imageUrl ? (
                    <div className="relative w-full max-h-[600px] flex justify-center items-center">
                      <img src={currentGroup.imageUrl} alt={`Câu ${currentIndex + 1}`} className="w-full max-h-[600px] object-contain select-none" draggable="false" />
                      
                      {/* Floating Save Status Toast */}
                      {saveStatus && (
                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-xl shadow-xl backdrop-blur-md border flex items-center gap-2 text-xs font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                          saveStatus.type === 'success' 
                            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20' 
                            : 'bg-red-950/90 border-red-500/30 text-red-300 shadow-red-950/20'
                        }`}>
                          <span className="text-sm">{saveStatus.type === 'success' ? '✅' : '⚠️'}</span>
                          <span>{saveStatus.message}</span>
                        </div>
                      )}
                      
                      {/* Hotspots Layer */}
                      {localHotspots.length > 0 && (
                        <div ref={hotspotsContainerRef} className="absolute inset-0 pointer-events-none select-none z-20">
                          {/* Lớp phủ click trong suốt để khi click ra ngoài các chấm số sẽ tắt bubble */}
                          {selectedHotspotIndex !== null && (
                            <div 
                              className="absolute inset-0 pointer-events-auto z-10 cursor-default"
                              onClick={() => setSelectedHotspotIndex(null)}
                            />
                          )}

                          {/* SVG vẽ đường chỉ nối động từ số ra bubble bên ngoài ảnh ở lề bên phải */}
                          {(() => {
                            const activeIdx = hoveredHotspotIndex !== null ? hoveredHotspotIndex : selectedHotspotIndex;
                            if (activeIdx === null || !localHotspots[activeIdx]) return null;
                            
                            const activeHs = localHotspots[activeIdx];
                            const startX = `${activeHs.x}%`;
                            const startY = `${activeHs.y}%`;
                            const endX = "103%";
                            const endY = `${activeHs.y}%`;

                            return (
                              <>
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                                  <g className="animate-in fade-in duration-300">
                                    <line 
                                      x1={startX} 
                                      y1={startY} 
                                      x2={endX} 
                                      y2={endY} 
                                      stroke={hoveredHotspotIndex !== null ? "#f59e0b" : "#10b981"} 
                                      strokeWidth="1.5" 
                                      strokeDasharray="4 3"
                                      className="animate-[dash_10s_linear_infinite]"
                                    />
                                    <circle 
                                      cx={endX} 
                                      cy={endY} 
                                      r="3" 
                                      fill={hoveredHotspotIndex !== null ? "#f59e0b" : "#10b981"}
                                    />
                                  </g>
                                </svg>

                                <div 
                                  className={`absolute left-[105%] w-max max-w-[460px] z-[99999] transition-all duration-200 ease-out animate-in fade-in zoom-in-95 pointer-events-auto ${
                                    activeHs.y < 20 ? "translate-y-0" : activeHs.y > 80 ? "translate-y-0" : "-translate-y-1/2"
                                  }`}
                                  style={activeHs.y < 20 ? { top: "5px" } : activeHs.y > 80 ? { bottom: "5px" } : { top: `${activeHs.y}%` }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className={`bg-slate-950/95 border p-4 rounded-2xl shadow-2xl backdrop-blur-md text-left relative ring-1 ${
                                    hoveredHotspotIndex !== null 
                                      ? 'border-amber-500/50 ring-amber-500/20' 
                                      : 'border-emerald-500/50 ring-emerald-500/20'
                                  }`}>
                                    {isAdminMode ? (
                                      <div className="space-y-2.5 text-slate-200 min-w-[280px]">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                            ✏️ SỬA HOTSPOT #{activeIdx + 1}
                                          </span>
                                          <button 
                                            onClick={() => setSelectedHotspotIndex(null)}
                                            className="text-slate-400 hover:text-white"
                                          >
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                                          <div>
                                            <span className="text-slate-450 block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Tọa độ gốc</span>
                                            <code className="text-indigo-300 font-black bg-indigo-950/60 border border-indigo-900/30 px-1.5 py-0.5 rounded">
                                              X: {((currentGroup.metadata as any)?.hotspots?.[activeIdx]?.x ?? 0).toFixed(1)}%, Y: {((currentGroup.metadata as any)?.hotspots?.[activeIdx]?.y ?? 0).toFixed(1)}%
                                            </code>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-slate-450 block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Tọa độ mới</span>
                                            <code className="text-amber-300 font-black bg-amber-950/60 border border-amber-900/30 px-1.5 py-0.5 rounded animate-pulse">
                                              X: {activeHs.x?.toFixed(1)}%, Y: {activeHs.y?.toFixed(1)}%
                                            </code>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-400 mb-0.5 uppercase">Từ vựng (EN)</label>
                                            <input 
                                              type="text"
                                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
                                              value={activeHs.en || ""}
                                              onChange={(e) => handleUpdateActiveHsField("en", e.target.value)}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-400 mb-0.5 uppercase">Phiên âm (IPA)</label>
                                            <input 
                                              type="text"
                                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
                                              value={activeHs.ipa || ""}
                                              onChange={(e) => handleUpdateActiveHsField("ipa", e.target.value)}
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-400 mb-0.5 uppercase">Nghĩa tiếng Việt</label>
                                          <input 
                                            type="text"
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
                                            value={activeHs.vi || ""}
                                            onChange={(e) => handleUpdateActiveHsField("vi", e.target.value)}
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-400 mb-0.5 uppercase">Ví dụ (Example)</label>
                                          <textarea 
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 min-h-[45px] resize-y"
                                            value={activeHs.example || ""}
                                            onChange={(e) => handleUpdateActiveHsField("example", e.target.value)}
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-400 mb-0.5 uppercase">Dịch câu ví dụ</label>
                                          <textarea 
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 min-h-[35px] resize-y"
                                            value={activeHs.example_vi || ""}
                                            onChange={(e) => handleUpdateActiveHsField("example_vi", e.target.value)}
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-400 mb-0.5 uppercase">Từ đồng nghĩa (Synonyms)</label>
                                          <input 
                                            type="text"
                                            placeholder="word (ipa), word2 (ipa2)"
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
                                            value={synonymsInputVal}
                                            onChange={(e) => {
                                              const raw = e.target.value;
                                              setSynonymsInputVal(raw);
                                              const parsed = raw.split(',').map(item => {
                                                const clean = item.trim();
                                                if (!clean) return null;
                                                const match = clean.match(/^(.*?)\s*[\(\[](.*?)[\)\]]$/);
                                                if (match) {
                                                  return { word: match[1].trim(), ipa: match[2].trim() };
                                                }
                                                return { word: clean, ipa: "" };
                                              }).filter(Boolean);
                                              handleUpdateActiveHsField("synonyms", parsed);
                                            }}
                                          />
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t border-slate-900 gap-2">
                                          <button
                                            type="button"
                                            onClick={handleDeleteHotspot}
                                            disabled={saveLoading}
                                            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg shadow-red-500/15 active:scale-95 transition-all cursor-pointer"
                                          >
                                            Xóa Hotspot
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleSaveHotspotsData}
                                            disabled={saveLoading}
                                            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                                          >
                                            {saveLoading ? 'Đang lưu...' : 'Lưu thông tin'}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        {hoveredHotspotIndex === null && selectedHotspotIndex !== null && (
                                          <button 
                                            onClick={() => setSelectedHotspotIndex(null)}
                                            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg cursor-pointer animate-in fade-in"
                                            title="Tắt bubble giải thích"
                                          >
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                          </button>
                                        )}

                                        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2 mb-2 pr-6 text-sm">
                                          <span className={`text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                            hoveredHotspotIndex !== null ? 'bg-amber-500' : 'bg-emerald-500'
                                          }`}>{activeIdx + 1}</span>
                                          <span className="font-black text-white">{activeHs.en}</span>
                                          {activeHs.ipa && <span className="text-[10px] text-slate-400 font-mono">{activeHs.ipa}</span>}
                                          <span className="text-indigo-400 font-bold ml-1">— {activeHs.vi}</span>
                                        </div>
                                        
                                        {activeHs.example && (
                                          <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                                            <p className="italic leading-relaxed">
                                              "{(() => {
                                                const phrase = activeHs.en.toLowerCase();
                                                const sentence = activeHs.example;
                                                const matchIdx = sentence.toLowerCase().indexOf(phrase);
                                                if (matchIdx !== -1) {
                                                  const start = sentence.substring(0, matchIdx);
                                                  const matchedWord = sentence.substring(matchIdx, matchIdx + phrase.length);
                                                  const end = sentence.substring(matchIdx + phrase.length);
                                                  return (
                                                    <>
                                                      {start}
                                                      <strong className="font-bold text-amber-400 not-italic">{matchedWord}</strong>
                                                      {end}
                                                    </>
                                                  );
                                                }
                                                // Fallback nếu so khớp không chính xác 100% thì in đậm các từ đơn lẻ
                                                return sentence;
                                              })()}"
                                            </p>
                                            {activeHs.example_vi && <p className="text-slate-400 mt-0.5 leading-snug">{activeHs.example_vi}</p>}
                                          </div>
                                        )}

                                        {activeHs.synonyms && activeHs.synonyms.length > 0 && (
                                          <p className="text-[10px] text-slate-300 mt-2.5 pt-2 border-t border-slate-800/60 italic">
                                            <span className="text-indigo-400/80 font-bold not-italic">Synonyms:</span> {activeHs.synonyms.map((s: any) => `${s.word} (${s.ipa})`).join(', ')}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </>
                            );
                          })()}

                          {localHotspots.map((hs, hidx) => {
                            const isHovered = hoveredHotspotIndex === hidx;
                            const isSelected = selectedHotspotIndex === hidx;
                            const isNextHotspot = (hoveredHotspotIndex !== null && hoveredHotspotIndex + 1 === hidx) || 
                                                  (hoveredHotspotIndex === null && selectedHotspotIndex !== null && selectedHotspotIndex + 1 === hidx);

                            // Tự động chuyển nhãn xuống dưới nếu nằm sát mép trên hoặc có hotspot khác ngay phía trên
                            const isNearTop = hs.y < 15;
                            const hasHotspotAbove = localHotspots.some((otherHs, oidx) => {
                              if (oidx === hidx) return false;
                              const xDiff = Math.abs(hs.x - otherHs.x);
                              const yDiff = hs.y - otherHs.y; // > 0 nghĩa là otherHs nằm trên hs
                              return xDiff < 8 && yDiff > 0 && yDiff < 20;
                            });
                            const showBelow = isNearTop || hasHotspotAbove;
                            const labelTranslateX = hs.x < 20 ? '0%' : hs.x > 80 ? '-100%' : '-50%';

                            return (
                              <div
                                key={hidx}
                                className={`absolute pointer-events-none select-none ${
                                  isHovered || isSelected ? 'z-50' : 'z-30'
                                }`}
                                style={{
                                  left: `${hs.x}%`,
                                  top: `${hs.y}%`,
                                }}
                              >
                                {/* Tag từ vựng + phiên âm IPA nhỏ gọn, tự động hiển thị phía trên hoặc phía dưới chấm số */}
                                <div 
                                  className={`absolute px-2 py-1.5 rounded-lg border text-[9px] font-bold shadow-lg pointer-events-none transition-all duration-200 backdrop-blur-md flex flex-col items-center text-center min-w-[125px] max-w-[200px] gap-0.5 ${
                                    showBelow ? 'top-[16px]' : 'bottom-[16px]'
                                  } ${
                                    isHovered || isSelected
                                      ? 'bg-slate-900/95 text-slate-100 border-slate-700/80 scale-105 opacity-100 visible'
                                      : 'opacity-0 invisible h-0 py-0 overflow-hidden'
                                  }`}
                                  style={{ transform: `translateX(${labelTranslateX})` }}
                                >
                                  <div className="font-extrabold text-[10.5px] text-amber-400 leading-tight">{hs.en}</div>
                                  {hs.ipa && <div className="text-slate-400 font-medium text-[8px] font-mono leading-none">[{hs.ipa}]</div>}
                                  {hs.vi && <div className="text-slate-300 font-normal border-t border-slate-800 pt-0.5 w-full text-[8.5px] leading-snug">{hs.vi}</div>}
                                </div>

                                <div 
                                  onMouseEnter={() => setHoveredHotspotIndex(hidx)}
                                  onMouseLeave={() => setHoveredHotspotIndex(null)}
                                  onMouseDown={(e) => {
                                    if (isAdminMode) {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setDraggingIndex(hidx);
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Click lại chấm số đang chọn để tắt bubble, hoặc chọn số mới
                                    setSelectedHotspotIndex(isSelected ? null : hidx);
                                  }}
                                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-[16px] h-[16px] flex items-center justify-center rounded-full border border-white shadow-md shrink-0 pointer-events-auto cursor-pointer ${
                                    draggingIndex === hidx ? '' : 'transition-all duration-200'
                                  } ${
                                    isHovered 
                                      ? 'bg-amber-400 text-slate-950 border-slate-950 scale-125 shadow-lg shadow-amber-500/30' 
                                      : isSelected
                                        ? 'bg-amber-500 text-slate-950 scale-110 shadow-md ring-2 ring-emerald-400'
                                        : isNextHotspot
                                          ? 'bg-emerald-500 text-white ring-4 ring-amber-400/80 animate-pulse scale-110 shadow-lg shadow-amber-400/20'
                                          : 'bg-emerald-500 text-white'
                                  }`}
                                >
                                  <span className="text-[8px] font-black select-none leading-none">{hidx + 1}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 font-bold py-20">Image Missing</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 py-1 justify-center w-full max-w-full overflow-visible tour-question-options-target">
                {/* Số câu — hiển thị ngay trên các phương án */}
                <div className="flex items-center gap-2 mb-1 pl-1">
                  <div className="bg-blue-600 text-white font-bold text-base rounded-lg px-3 py-1 shadow-md leading-none">{questionData?.questionNo}</div>
                  <FlagSelector
                    isFlagged={!!flags[currentQKey]}
                    flagColor={flags[currentQKey] || 'RED'}
                    flagNote={flagNotes[currentQKey]}
                    onToggle={(color, note) => handleUpdateFlag(currentQKey, color, note)}
                    onUnflag={(deleteNote) => handleUpdateFlag(currentQKey, null, undefined, deleteNote)}
                    compact={true}
                    layout="horizontal"
                  />
                  {/* Eye / reveal icon button */}
                  <button
                    id="reveal-btn"
                    onClick={() => setRevealMode(!revealMode)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border-2 transition-all ${revealMode ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50'
                      }`}
                    title={`${revealMode ? 'Ẩn lời giải' : 'Hiện lời giải'} (Phím tắt: ctrl/cmd + shift + s)`}
                  >
                    <span className="text-sm leading-none">{revealMode ? '👁️' : '👁️'}</span>
                  </button>
                  {mode === 'dictation' && <div className="text-xs font-bold text-pink-600 uppercase tracking-widest border-l-2 border-pink-500 pl-2">Thử thách điền từ: Gõ thay thế các dấu chấm</div>}
                </div>
                {['A', 'B', 'C', 'D'].map(opt => {
                  const engPartFromParsed = engParts.find(p => p.label === opt);
                  const targetEngText = engPartFromParsed?.text || (questionData as any)[`option${opt}`] || "";
                  const viPart = vieParts.find(p => p.label === opt);
                  const isCorrectTarget = correctAnswer === opt;
                  const isSelected = selectedAnswer === opt;

                  const boxClasses = [
                    "border py-0.5 px-2 rounded-xl flex gap-2 transition-all duration-300 outline-none text-left w-full relative cursor-pointer group",
                    revealMode
                      ? (isCorrectTarget ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : isSelected ? "border-red-500 bg-red-50/50 shadow-sm" : "border-slate-200 bg-white shadow-none")
                      : (isSelected ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100 ring-1 ring-blue-500" : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md")
                  ].join(" ");

                  let circleBorder = ""; let circleFill = "";
                  if (revealMode) {
                    if (isCorrectTarget) { circleBorder = "border-emerald-500"; circleFill = "bg-emerald-500"; }
                    else if (isSelected) { circleBorder = "border-red-500"; circleFill = "bg-red-500"; }
                    else { circleBorder = "border-slate-200"; }
                  } else {
                    if (isSelected) { circleBorder = "border-blue-500"; circleFill = "bg-blue-500"; }
                    else { circleBorder = "border-slate-300"; }
                  }

                  const incorrectRationale = richData?.explanation?.incorrect?.find((i: any) => i.label === opt);
                  const correctRationale = isCorrectTarget ? (richData?.explanation?.correct || richData?.explanation) : null;

                  return (
                    <div
                      key={opt}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`${boxClasses.replace('cursor-pointer', 'cursor-default')} ${mode === 'dictation' ? 'select-none' : 'select-text'}`}
                    >
                      <div className="shrink-0 pt-0.5">
                        <div
                          onClick={() => handleSelectAnswer(opt)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-black border transition-all duration-300 cursor-pointer group/opt ${revealMode
                            ? (isCorrectTarget ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' : isSelected ? 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-500/20' : 'bg-slate-50 text-slate-400 border-slate-200')
                            : isSelected ? 'bg-blue-600 text-white border-blue-700 scale-105 shadow-sm shadow-blue-200' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-500 hover:scale-110'
                            }`}
                        >
                          {opt}
                        </div>
                      </div>
                      <div className="flex-1 w-full text-left">
                        <div className={`font-bold text-[16px] leading-relaxed flex items-center gap-3 ${revealMode && isCorrectTarget ? 'text-emerald-700' : 'text-slate-900'}`}>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(currentGroup?.metadata as any)?.timestamps?.[opt] && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playSegment(opt);
                                }}
                                className={`part1-option-audio-btn p-1 rounded-md transition-all duration-300 ${playingSegmentLabel === opt
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 animate-pulse'
                                  : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'
                                  }`}
                                title={`Nghe phương án ${opt} (Phím tắt: phím số ${['A', 'B', 'C', 'D'].indexOf(opt) + 1})`}
                              >
                                <Volume2 size={14} fill={playingSegmentLabel === opt ? "currentColor" : "none"} />
                              </button>
                            )}
                          </div>
                          <div className="flex-1">
                            {mode === 'dictation' ? (<DictationSentence targetText={targetEngText} />) : (revealMode || isHintMode) ? (
                              <div className="space-y-2">
                                <div className="font-semibold text-slate-800">
                                  <AdminInlineEditor
                                    target="question"
                                    id={questionData.id}
                                    field={`option${opt}`}
                                    value={targetEngText}
                                  >
                                    <FormattedText
                                      text={targetEngText}
                                      revealed={revealMode}
                                      currentIndex={currentIndex}
                                      hintMode={isHintMode}
                                      wordsToMask={hintMasksMap[opt]}
                                      startHintIndex={1 + (['A', 'B', 'C', 'D'].indexOf(opt) * 2)}
                                      renderWordCloud={renderWordFamilyCloud}
                                    />
                                  </AdminInlineEditor>
                                </div>
                                {viPart?.text && revealMode && (
                                  <div className={`text-[15px] italic mt-1 ${isCorrectTarget ? 'text-emerald-700/80 font-medium' : 'text-slate-500'}`}>
                                    <AdminInlineEditor
                                      target="question"
                                      id={questionData.id}
                                      field="explanation.vietText"
                                      value={viPart.text}
                                      multiline
                                    >
                                      <StaticFormattedText text={viPart.text} />
                                    </AdminInlineEditor>
                                  </div>
                                )}
                                {revealMode && (incorrectRationale || (isCorrectTarget && correctRationale?.why)) && (
                                  <div className={`mt-3 p-3.5 rounded-xl text-sm border ${isCorrectTarget ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                    <div className="font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                      {isCorrectTarget ? (
                                        <><CheckCircleIcon className="w-4 h-4" /> Tại sao đúng?</>
                                      ) : (
                                        <><FlagIcon className="w-4 h-4" /> Tại sao sai (Bẫy)?</>
                                      )}
                                    </div>
                                    <div className="leading-relaxed opacity-90">
                                      <AdminInlineEditor
                                        target="question"
                                        id={questionData.id}
                                        field={isCorrectTarget ? "explanation.why_correct" : `explanation.wrong_options.${opt}.why`}
                                        value={incorrectRationale?.why || correctRationale?.why || correctRationale?.why_correct || ""}
                                        multiline
                                      >
                                        <AutoBoldEnglish text={incorrectRationale?.why || correctRationale?.why || correctRationale?.why_correct || ""} />
                                      </AdminInlineEditor>
                                    </div>

                                    {incorrectRationale?.suggested_question && (
                                      <div className="mt-2.5 pt-2.5 border-t border-red-200/50 italic opacity-80">
                                        <p className="font-medium text-[11px] mb-1.5">{incorrectRationale.context_intro || "Câu này sẽ ĐÚNG nếu nội dung ảnh là:"}</p>
                                        <p>• <strong className="font-bold text-slate-900 tracking-wide"><AutoBoldEnglish text={incorrectRationale.suggested_question.en} /></strong></p>
                                        <p>→ {incorrectRationale.suggested_question.vi}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 opacity-20 font-medium tracking-widest italic text-sm">Vui lòng nghe và chọn đáp án...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>



            {isReviewMode && selectedAnswer && !revealMode && (
              <div className="mt-8 flex justify-center">
                <button onClick={async () => {
                  setRevealMode(true);
                  const isCorrect = selectedAnswer === correctAnswer;
                  if (isCorrect) {
                    const qKey = questionData.id || `${currentGroup.id}_${questionData.questionNo}`;
                    if (lessonId && qKey) {
                      await fetch('/api/progress/questions', {
                        method: 'POST',
                        body: JSON.stringify({
                          mode: 'batch',
                          attempts: [{
                            questionId: questionData.id || qKey,
                            lessonId,
                            userAnswer: selectedAnswer,
                            isCorrect: true,
                            isFlagged: flags[qKey] || false
                          }]
                        })
                      });
                    }
                    if (onResolved) onResolved();
                  }
                }} className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all animate-in zoom-in-90">Kiểm Tra Đáp Án</button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Bảng điều hướng câu hỏi (Bên phải) - Hover để mở rộng */}
        {!isFullTest && mounted && createPortal(
          <div
            className={`questions-sidebar-portal
              fixed right-0 top-14 bottom-0 z-[999] transition-all duration-300 ease-out border-l border-white/10 shadow-2xl flex flex-col
            ${isSidebarHovered ? "w-72 bg-slate-900/90 backdrop-blur-xl" : "w-14 bg-white/50 backdrop-blur-sm hover:bg-white/60 cursor-pointer"}
          `}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
            onClick={() => !isSidebarHovered && setIsSidebarHovered(true)}
          >
            <div className={`p-4 border-b border-white/10 flex items-center shrink-0 ${isSidebarHovered ? 'h-auto' : 'h-16 justify-center'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                  <LayoutDashboard size={18} />
                </div>
                {isSidebarHovered && (
                  <div className="animate-in fade-in zoom-in duration-300 whitespace-nowrap overflow-hidden">
                    <h3 className="font-black text-white mb-0.5">BẢNG CÂU HỎI</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Click để di chuyển nhanh</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {isSidebarHovered ? (
                <div className="grid grid-cols-4 gap-2 animate-in fade-in duration-500">
                  {data.map((group, idx) => {
                    const q = group.questions[0];
                    const qKey = q.id || `${group.id}_${q.questionNo}`;
                    const isDone = !!answers[qKey];
                    const isCurr = idx === currentIndex;
                    const isFlaged = flags[qKey];
                    const showResult = isSubmitted || isReviewMode;
                    const resultCorrect = showResult && answers[qKey] === q.correctAnswer;

                    let btnClass = "";
                    if (showResult) {
                      if (!answers[qKey]) btnClass = "bg-slate-800 text-slate-500 border border-slate-700";
                      else if (resultCorrect) btnClass = "bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400";
                      else btnClass = "bg-red-500 text-white shadow-sm ring-1 ring-red-400";
                    } else {
                      btnClass = isDone
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-10 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center relative 
                            ${isCurr ? 'ring-2 ring-white z-20 scale-110 shadow-lg' : ''} 
                            ${btnClass}`}
                      >
                        {idx + 1}
                        {isFlaged && <Flag size={10} className="absolute top-1 right-1 text-red-500 fill-red-500 shadow-sm" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 py-4 animate-in fade-in duration-300">
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-[10px] font-black text-blue-500">{Math.round((Object.keys(answers).length / data.length) * 100)}%</div>
                    <div className="w-1 h-12 bg-slate-200 rounded-full overflow-hidden flex flex-col justify-end">
                      <div className="bg-blue-500 w-full transition-all duration-500" style={{ height: `${(Object.keys(answers).length / data.length) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {data.slice(0, 10).map((g, idx) => {
                      const isDone = !!answers[g.questions[0].id];
                      return (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={`p-4 border-t border-white/10 bg-black/20 shrink-0 ${!isSidebarHovered && 'flex justify-center'}`}>
              {isSidebarHovered ? (
                !isSubmitted ? (
                  <button
                    onClick={handleFinishTest}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-[13px] shadow-lg shadow-blue-900/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> {isSubmitting ? 'ĐANG NỘP...' : 'NỘP BÀI NGAY'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-500/10 rounded-xl p-2 border border-emerald-500/20 text-center">
                        <div className="text-[14px] font-black text-emerald-400">{testScore.correct}</div>
                        <div className="text-[8px] font-bold text-emerald-500/60 uppercase">Đúng</div>
                      </div>
                      <div className="bg-red-500/10 rounded-xl p-2 border border-red-500/20 text-center">
                        <div className="text-[14px] font-black text-red-400">{testScore.incorrect}</div>
                        <div className="text-[8px] font-bold text-red-500/60 uppercase">Sai</div>
                      </div>
                    </div>
                    <button
                      onClick={handleRetake}
                      className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs shadow-sm hover:bg-slate-700 transition active:scale-95 uppercase tracking-wide"
                    >
                      🔄 Làm lại bài
                    </button>
                  </div>
                )
              ) : (
                <button onClick={handleFinishTest} className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20">
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
          , document.body)}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      {(() => {
        const navContent = (
          <div id="toeic-navigation-container" className="flex items-center bg-white rounded-full p-1.5 border border-slate-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.06)] min-w-[320px] justify-between pointer-events-auto">
            <div className="relative group">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-8 py-3 rounded-full font-bold text-[13px] transition-all disabled:opacity-20 hover:bg-slate-50 text-slate-400 uppercase tracking-widest"
              >
                Lùi
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] translate-y-2 group-hover:translate-y-0">
                Phím tắt: Mũi tên trái
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
              </div>
            </div>

            <div className="px-8 font-black text-slate-600 text-sm border-x border-slate-100">
              {isFullTest ? (
                <>
                  {globalOffset + currentIndex + 1} <span className="mx-1 text-slate-300">/</span> {globalTotal || 200}
                </>
              ) : (
                <>
                  {currentIndex + 1} <span className="mx-1 text-slate-300">/</span> {data.length}
                </>
              )}
            </div>

            {currentIndex === data.length - 1 ? (
              isFullTest ? (
                <div className="relative group">
                  <button
                    onClick={onNextPart}
                    className="px-10 py-3 rounded-full font-bold text-[13px] transition-all bg-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-700 active:scale-95 uppercase tracking-widest flex items-center gap-2"
                  >
                    Tiếp sang Part 2 <ChevronRightIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] translate-y-2 group-hover:translate-y-0">
                    Phím tắt: Mũi tên phải
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>
              ) : !isSubmitted ? (
                <button
                  onClick={handleFinishTest}
                  disabled={isSubmitting}
                  className="px-10 py-3 rounded-full font-bold text-[13px] transition-all bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-95 uppercase tracking-widest"
                >
                  {isSubmitting ? '...' : 'Nộp bài'}
                </button>
              ) : null
            ) : (
              <div className="relative group">
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(data.length - 1, prev + 1))}
                  className="px-10 py-3 rounded-full font-bold text-[13px] transition-all bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-95 uppercase tracking-widest"
                >
                  Tiếp
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] translate-y-2 group-hover:translate-y-0">
                  Phím tắt: Mũi tên phải
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        );

        if (isFullTest && mounted && typeof document !== "undefined" && document.getElementById("bottom-nav-portal-target")) {
          return createPortal(
            <div className="relative flex-none h-20 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[70] flex items-center justify-center pb-2 pointer-events-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
              <div className="absolute left-4 flex gap-2 pointer-events-auto z-[80]">
                <button
                  onClick={() => startToeicPartTour(1, true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 pointer-events-auto"
                  title="Khởi động Tour hướng dẫn nhanh"
                >
                  <HelpCircle size={13} className="animate-pulse" />
                  Hướng dẫn nhanh
                </button>
                {videoExplanation && videoExplanation.videoUrl && (
                  <button
                    onClick={() => onToggleVideo ? onToggleVideo() : setShowVideo(prev => !prev)}
                    className="px-3 py-1.5 bg-[#05b169]/10 hover:bg-[#05b169]/20 text-[#05b169] rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 border border-[#05b169]/20"
                    title="Xem video chữa đề / giải thích"
                  >
                    🎬 {(onToggleVideo ? videoOpen : showVideo) ? "Ẩn video chữa" : "Xem video chữa"}
                  </button>
                )}
              </div>
              {navContent}
            </div>,
            document.getElementById("bottom-nav-portal-target")!
          );
        }

        return (
          <div className="relative flex-none h-20 bg-white/80 backdrop-blur-md border-t border-slate-100 z-[70] flex items-center justify-center pb-2">
            <div className="absolute left-4 flex gap-2 pointer-events-auto z-[80]">
              <button
                onClick={() => startToeicPartTour(1, true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 pointer-events-auto"
                title="Khởi động Tour hướng dẫn nhanh"
              >
                <HelpCircle size={13} className="animate-pulse" />
                Hướng dẫn nhanh
              </button>
              {videoExplanation && videoExplanation.videoUrl && (
                <button
                  onClick={() => onToggleVideo ? onToggleVideo() : setShowVideo(prev => !prev)}
                  className="px-3 py-1.5 bg-[#05b169]/10 hover:bg-[#05b169]/20 text-[#05b169] rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 border border-[#05b169]/20 animate-pulse"
                  title="Xem video chữa đề / giải thích"
                >
                  🎬 {(onToggleVideo ? videoOpen : showVideo) ? "Ẩn video chữa" : "Xem video chữa"}
                </button>
              )}
            </div>
            {navContent}
          </div>
        );
      })()}

      {!onToggleVideo && showVideo && videoExplanation && videoExplanation.videoUrl && (
        <FloatingVideoExplanationPlayer
          videoExplanation={videoExplanation}
          onClose={() => setShowVideo(false)}
          onQuestionSync={(targetIndex) => {
            if (isFullTest && onVideoQuestionSync) {
              onVideoQuestionSync(targetIndex);
              return;
            }
            const groupIdx = data.findIndex(group =>
              group.questions?.some((q: any) => q.questionNo === targetIndex)
            );
            if (groupIdx !== -1) {
              setCurrentIndex(groupIdx);
            }
          }}
          currentIndex={currentIndex}
        />
      )}

      {/* WORD FAMILY POPOVER DICTIONARY */}
      {activeWordFamily.length > 0 && (
        <WordFamilyPopover
          wordFamilies={activeWordFamily}
          position={popoverPos}
          onClose={() => setActiveWordFamily([])}
          onPositionChange={(pos) => setPopoverPos(pos)}
        />
      )}

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}

interface WordFamilyEntry {
  key: string;
  originalValue: string;
  type: string;
  roots?: string[];
  matchedWord?: string;
}

interface DraggablePopoverProps {
  wordFamilies: WordFamilyEntry[];
  position: { x: number; y: number };
  onClose: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
}

function WordFamilyPopover({ wordFamilies, position, onClose, onPositionChange }: DraggablePopoverProps) {
  const wordFamily = wordFamilies[0];
  const popoverRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.popover-header')) {
      e.preventDefault();
      setDragStart({ x: e.clientX, y: e.clientY });
      setStartPos({ x: position.x, y: position.y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragStart) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        onPositionChange({
          x: startPos.x + dx,
          y: startPos.y + dy
        });
      }
    };

    const handleMouseUp = () => {
      setDragStart(null);
    };

    if (dragStart) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStart, startPos, onPositionChange]);

  const formatContent = (val: string, key: string, type: string, roots?: string[], displayTitle?: string, matchedWord?: string) => {
    const lines = val.split('\n');

    // Parse "english word/phrase (translation)" pairs from a text segment and render as 2-column grid
    const renderSegment = (textStr: string, termLower: string): React.ReactNode => {
      const regex = /([a-zA-Z0-9\s''\/↔\-]+?)\s*(\((?:"[^"]*"|[^)]+)\))/g;
      const pairs: { eng: string; trans: string; isMatch: boolean }[] = [];
      let lastIndex = 0;
      let prefixText = '';
      let match;

      regex.lastIndex = 0;
      while ((match = regex.exec(textStr)) !== null) {
        const engWord = match[1].trim();
        const translation = match[2];

        if (pairs.length === 0 && match.index > lastIndex) {
          // Strip bracket delimiters [ ] （ ） and normalize known label text
          prefixText = textStr.substring(lastIndex, match.index)
            .replace(/^\s*[\[（]/, '')
            .replace(/[\]）]\s*$/, '')
            .replace(/Đồng nghĩa TOEIC hay gặp/gi, 'Các từ/cụm từ tương tự')
            .trim();
        }

        const isMatch = !!(termLower && (
          engWord.toLowerCase() === termLower.toLowerCase() ||
          engWord.toLowerCase().includes(termLower.toLowerCase()) ||
          termLower.toLowerCase().includes(engWord.toLowerCase())
        ));

        pairs.push({ eng: engWord, trans: translation, isMatch });
        lastIndex = regex.lastIndex;
      }

      // Strip trailing bracket delimiter from suffix
      const suffixText = (lastIndex < textStr.length ? textStr.substring(lastIndex) : '')
        .replace(/^\s*[\]）]\s*$/, '').trim();

      if (pairs.length === 0) {
        return <React.Fragment key="raw">{textStr}</React.Fragment>;
      }

      return (
        <React.Fragment key="grid">
          {prefixText && <span className="text-teal-700 font-medium">{prefixText}</span>}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
            {pairs.map((p, i) => (
              <div key={i} className="flex items-start gap-1 min-w-0">
                {p.isMatch ? (
                  <span
                    onClick={() => speak(p.eng)}
                    className="text-amber-600 font-bold cursor-pointer hover:underline inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap"
                  >
                    {p.eng}
                    <Volume2 className="w-3 h-3 text-amber-500/70 shrink-0" />
                  </span>
                ) : (
                  <strong
                    onClick={() => speak(p.eng)}
                    className="font-extrabold text-slate-900 cursor-pointer hover:underline inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap"
                  >
                    {p.eng}
                    <Volume2 className="w-3 h-3 text-slate-400/70 shrink-0" />
                  </strong>
                )}
                <span className="text-slate-500 font-normal text-xs leading-snug">{p.trans}</span>
              </div>
            ))}
          </div>
          {suffixText && <span className="text-slate-500">{suffixText}</span>}
        </React.Fragment>
      );
    };

    const renderRichText = (raw: string, termLower: string): React.ReactNode[] => {
      const bracketSplit = /([\[（][^\]）]*[\]）])/g;
      const bracketParts = raw.split(bracketSplit);

      const result: React.ReactNode[] = [];
      bracketParts.forEach((seg, bIdx) => {
        const isBracket = (seg.startsWith('[') && seg.endsWith(']')) || (seg.startsWith('（') && seg.endsWith('）'));

        if (isBracket) {
          result.push(
            <span key={`br-${bIdx}`} className="text-teal-600 text-[0.9em] font-normal">
              {renderSegment(seg, termLower)}
            </span>
          );
        } else {
          result.push(
            <React.Fragment key={`seg-${bIdx}`}>
              {renderSegment(seg, termLower)}
            </React.Fragment>
          );
        }
      });

      return result;
    };

    return lines.map((line: string, idx: number) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return null;

      let lineClass = "text-slate-700 text-sm leading-relaxed my-1.5 font-medium";
      const lowerTrimmed = trimmed.toLowerCase();
      if (
        lowerTrimmed.startsWith('gốc:') || 
        lowerTrimmed.startsWith('goc:') || 
        lowerTrimmed.startsWith('tiền tố:') || 
        lowerTrimmed.startsWith('tien to:') ||
        lowerTrimmed.startsWith('hậu tố:') || 
        lowerTrimmed.startsWith('hau to:')
      ) {
        lineClass = "text-red-600 text-sm leading-relaxed my-1.5 font-bold";
      } else if (trimmed.startsWith('=') || trimmed.startsWith('~')) {
        lineClass = "text-emerald-700 text-sm leading-relaxed my-1.5 font-bold";
      } else if (trimmed.startsWith('><') || trimmed.includes('↔')) {
        lineClass = "text-red-600 text-sm leading-relaxed my-1.5 font-bold";
      } else if (trimmed.includes('->') || trimmed.startsWith('-')) {
        lineClass = "text-indigo-700 text-sm leading-relaxed my-1.5 font-semibold";
      }

      const searchTerms = type === 'root' && roots
        ? roots
        : [matchedWord ? matchedWord.toLowerCase() : (displayTitle ? displayTitle.toLowerCase() : key.replace(/[\/,]/g, ' ').split(' ')[0])];

      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('·');

      const firstTerm = searchTerms[0] || '';
      const termLower = firstTerm.toLowerCase();
      const termRegex = firstTerm.length >= 2
        ? (type === 'root'
          ? new RegExp(`(${firstTerm})`, 'gi')
          : new RegExp(`\\b(${firstTerm})\\b`, 'gi'))
        : null;

      if (isBullet) {
        const bulletMatch = trimmed.match(/^([•*·]\s*)([\w\s/,'-]+?)(\s*(?:v|n|adj|adv|prep|conj|phr|phrase)?\.?:)([\s\S]*)/);
        if (bulletMatch) {
          const [, marker, exWord, colon, rest] = bulletMatch;
          return (
            <div key={idx} className={lineClass}>
              <span>{marker}</span>
              <span
                onClick={() => speak(exWord.trim())}
                className="font-bold text-slate-900 cursor-pointer hover:underline inline-flex items-center gap-0.5"
              >
                {exWord}
                <Volume2 className="w-3.5 h-3.5 text-slate-400/70 shrink-0" />
              </span>
              <span className="font-semibold text-slate-600">{colon}</span>
              {renderRichText(rest, termLower)}
            </div>
          );
        }
      }

      const richParts = renderRichText(line, termLower);
      return <div key={idx} className={lineClass}>{richParts}</div>;
    });
  };

  const getDisplayTitle = (key: string, matchedWord?: string): string => {
    if (!matchedWord) return key;
    const clean = key.replace(/\s*\([^)]*\)/g, '');
    const items = clean.split(/[,/]/).map(item => item.trim());
    
    if (items.length === 1) {
      return items[0].charAt(0).toUpperCase() + items[0].slice(1);
    }

    const target = matchedWord.toLowerCase().trim();
    let bestItem = items[0];
    let bestScore = -1;

    items.forEach(item => {
      const itemLower = item.toLowerCase();
      if (itemLower === target) {
        bestItem = item;
        bestScore = 100;
        return;
      }

      if (target.startsWith(itemLower) || itemLower.startsWith(target)) {
        const score = Math.min(itemLower.length, target.length) / Math.max(itemLower.length, target.length);
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
      } else if (target.includes(itemLower) || itemLower.includes(target)) {
        const score = 0.5 * (Math.min(itemLower.length, target.length) / Math.max(itemLower.length, target.length));
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
      }
    });

    return bestItem.charAt(0).toUpperCase() + bestItem.slice(1);
  };

  return (
    <div
      ref={popoverRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-[9999] w-max max-w-[min(680px,90vw)] max-h-[440px] overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col animate-in zoom-in-95 duration-200"
    >
      <div
        onMouseDown={handleMouseDown}
        className="popover-header px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 flex items-center justify-between cursor-move select-none shrink-0"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Mở rộng vốn từ Part 1</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 select-text">
        {wordFamilies.map((fam, famIdx) => {
          const displayTitle = fam.key;
          const isRoot = fam.type === 'root' || (typeof fam.originalValue === 'string' && fam.originalValue.trimStart().startsWith('Gốc:'));
          return (
            <div key={famIdx}>
              {famIdx > 0 && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nhóm khác</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              )}
              <h4 className={`text-lg font-black mb-2 border-b pb-1.5 capitalize ${isRoot && famIdx > 0 ? 'text-amber-700 border-amber-100' : 'text-slate-800 border-slate-100'}`}>
                {displayTitle}
              </h4>
              <div className="space-y-1">
                {formatContent(fam.originalValue, fam.key, fam.type, fam.roots, displayTitle, fam.matchedWord)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
