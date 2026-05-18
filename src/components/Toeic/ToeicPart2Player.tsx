"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from "react-dom";
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import {
  PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon,
  CheckCircleIcon, EyeIcon, ClockIcon, FlagIcon, TrophyIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import { Send, LayoutDashboard, ChevronRight, Play, Pause, Volume2, HelpCircle, CheckCircle2, XCircle, Info, Lightbulb, Flag, ChevronsLeftRight, PenLine } from "lucide-react";
import { AdminInlineEditor } from "@/components/Admin/AdminInlineEditor";
import { useAdminEdit } from "@/components/Admin/AdminEditProvider";
import confetti from 'canvas-confetti';
import Link from 'next/link';
import FlagSelector, { FlagColor } from '../Player/FlagSelector';
import { startToeicPartTour } from './toeicTour';

function cleanSpeakerLabels(text: string) {
  if (!text) return "";
  return text.replace(/[MW]-[A-Za-z]+:\s*/g, '').trim();
}

function parseOptionsFromText(text: string) {
  if (!text) return [];
  const parts = text.split(/(?=\([A-C,Q]\))/gi).map(s => s.trim()).filter(Boolean);
  return parts.map(p => {
    const match = p.match(/^\(([A-C,Q])\)\s*(.*)/i);
    if (match) return { label: match[1].toUpperCase(), text: cleanSpeakerLabels(match[2]) };
    return { label: '?', text: cleanSpeakerLabels(p) };
  });
}

const speak = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};

const HintPhrase = ({ phrase, isReveal, questionIndex, hintIndex }: { phrase: string, isReveal: boolean, questionIndex: number, hintIndex?: number }) => {
  const [revealed, setRevealed] = useState(false);

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
  const isRevealedState = revealed || isReveal;

  // Tách phần chữ (bao gồm cả tiếng Việt) và phần dấu câu
  const punctuationRegex = /[.,;?!:()\[\]{}"']/g;
  const match = word.match(/^(.*?)([.,!?;:"'()\[\]{}]*)$/);
  const letters = match ? match[1] : word;
  const punctuation = match ? match[2] : "";
  const maskedLetters = letters.replace(/[a-zA-Z]/g, '_');

  return (
    <span
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (!isRevealedState) {
          e.stopPropagation();
          setRevealed(true);
          speak(word);
        }
      }}
      className="inline cursor-text select-text"
    >
      {isRevealedState ? (
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

const FormattedInteractiveText = ({ text, revealed, currentIndex, initialBold = false, hintMode = false, wordsToMask = [], startHintIndex = 1 }: { text: string; revealed: boolean, currentIndex: number, initialBold?: boolean, hintMode?: boolean, wordsToMask?: string[], startHintIndex?: number }) => {
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

    if (hintMode && wordsToMask.length > 0) {
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

        return fragment.split(' ').map((word, wIdx, fArr) => (
          <span key={`word-${currentIndex}-${index}-${fIdx}-${wIdx}`} className="inline">
            <InteractiveWord word={word} isReveal={true} />
            {wIdx < fArr.length - 1 && " "}
          </span>
        ));
      });

      if (isBold) return <strong key={index} className="font-bold text-slate-800 underline decoration-blue-200/50 decoration-2 underline-offset-2">{subParts}</strong>;
      return <span key={index}>{subParts}</span>;
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

const FormattedText = ({ text, revealed, currentIndex, initialBold = false, hintMode = false, wordsToMask = [], startHintIndex = 1 }: { text: string; revealed: boolean, currentIndex: number, initialBold?: boolean, hintMode?: boolean, wordsToMask?: string[], startHintIndex?: number }) => {
  const { content } = FormattedInteractiveText({ text, revealed, currentIndex, initialBold, hintMode, wordsToMask, startHintIndex });
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
    <div className="relative w-full flex items-center">
      {/* Display Layer - Always on top */}
      <div className="relative z-20 pointer-events-none break-words whitespace-pre-wrap select-text text-slate-400 font-mono font-bold text-[20px] leading-relaxed tracking-[0.02em] m-0 p-0 border-0 w-full">
        {targetText.split('').map((char, i) => {
          const typed = input[i]; const isLetter = /[a-zA-Z]/.test(char);
          if (!isLetter) return <span key={i} className="text-slate-300">{char}</span>;
          if (!typed) return <span key={i} className="text-slate-400">.</span>;
          const isCorrect = typed.toLowerCase() === char.toLowerCase();
          return (
            <span
              key={i}
              className={`${isCorrect ? "text-emerald-600" : "text-red-500 bg-red-50"} transition-colors`}
            >
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
        className="w-full h-full bg-transparent outline-none resize-none absolute inset-0 z-10 m-0 p-0 border-0 font-mono font-bold text-[20px] leading-relaxed tracking-[0.02em] pointer-events-auto overflow-hidden"
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

export default function ToeicPart2Player({
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
  onPrevPart,
  onActiveQuestionChange,
  isSubmitted: externalIsSubmitted = false,
  jumpTo,
  globalOffset = 0,
  globalTotal
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
  onPrevPart?: () => void;
  onActiveQuestionChange?: (questionNo: number) => void;
  isSubmitted?: boolean;
  jumpTo?: { id: string; ts: number } | null;
  globalOffset?: number;
  globalTotal?: number;
}) {
  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];
    return [...rawData].sort((a, b) => {
      const aNo = a.questions?.[0]?.questionNo || 999;
      const bNo = b.questions?.[0]?.questionNo || 999;
      return aNo - bNo;
    });
  }, [rawData]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const { isAdminMode } = useAdminEdit();
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <ClockIcon className="w-12 h-12 animate-pulse" />
        <p className="font-medium">Đang tải câu hỏi Part 2...</p>
      </div>
    );
  }
  useEffect(() => {
    const q = data[currentIndex]?.questions?.[0];
    if (onActiveQuestionChange && q?.questionNo) {
      onActiveQuestionChange(q.questionNo);
    }
  }, [currentIndex, data, onActiveQuestionChange]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [revealMode, setRevealMode] = useState(!!(isReviewMode || externalIsSubmitted));
  const [mode, setMode] = useState<'practice' | 'dictation'>('practice');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Tự động khởi chạy tour hướng dẫn học Part 2 lần đầu
    startToeicPartTour(2);
  }, []);

  // Sync revealMode with externalIsSubmitted
  useEffect(() => {
    if (externalIsSubmitted) {
      setRevealMode(true);
      setIsSubmitted(true);
    }
  }, [externalIsSubmitted]);

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    let acc: any = {};
    Object.keys(initialProgress).forEach(k => { if (initialProgress[k].userAnswer) acc[k] = initialProgress[k].userAnswer; });
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
          flagNote: flagNotes[id] || null
        };
      });
      onProgressChange(progress);
    }
  }, [answers, flags, flagNotes, onProgressChange]);

  // Nhảy tới câu hỏi từ Full Test Sidebar hoặc Review Center
  useEffect(() => {
    if (jumpTo?.id && data.length > 0) {
      const targetId = String(jumpTo.id);
      // Tìm vị trí của nhóm chứa câu hỏi (hỗ trợ cả database ID và questionNo)
      const idx = data.findIndex(g =>
        g.questions?.some((q: any) =>
          String(q.questionNo) === targetId ||
          String(q.id) === targetId
        )
      );

      if (idx !== -1) {
        setCurrentIndex(idx);

        // Đợi một chút để group mới render xong rồi cuộn đến câu hỏi cụ thể
        setTimeout(() => {
          const el = document.getElementById(`question-${targetId}`) ||
            document.querySelector(`[id$="-${targetId}"]`) ||
            document.querySelector(`[id^="question-"][id$="-${targetId}"]`);

          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Thêm hiệu ứng highlight
            el.classList.add('ring-4', 'ring-indigo-400', 'ring-offset-4', 'rounded-2xl', 'z-10');
            setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-400', 'ring-offset-4'), 3000);
          }
        }, 300);
      }
    }
  }, [jumpTo, data]);

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

  const currentGroup = data[currentIndex] || {};
  const questionData = currentGroup?.questions?.[0] || {};
  const currentQuestionId = questionData.id;
  const currentQKey = questionData.id || `${currentGroup.id}_${questionData.questionNo}`;
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

  const basePath = (questionData.metadata as any)?.vietnamese ? "metadata.vietnamese" : "explanation";

  const engParts = parseOptionsFromText(currentGroup?.transcript || "");
  const vieParts = parseOptionsFromText(explanationObj.vietText || "");

  const hintMasksMap = useMemo(() => {
    const aux = new Set(['is', 'are', 'was', 'were', 'am', 'be', 'been', 'being', 'has', 'have', 'had']);
    const det = new Set(['a', 'an', 'the', 'some', 'any', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'last', 'next', 'each', 'every', 'all']);
    const prep = new Set(['in', 'on', 'at', 'by', 'with', 'for', 'from', 'to', 'of', 'about', 'over', 'under', 'across', 'through', 'into', 'along', 'behind', 'beside', 'near', 'past', 'up', 'down']);
    const adverbs = new Set(['downtown', 'upstairs', 'downstairs', 'nearby', 'outside', 'inside', 'away', 'here', 'there', 'soon', 'now', 'later', 'already', 'yet', 'still', 'everywhere', 'anywhere', 'somewhere', 'yesterday', 'today', 'tomorrow']);

    const maskedGlobal = new Set<string>();
    const map: Record<string, string[]> = {};

    const questionText = richData?.question?.en || engParts.find(p => p.label === '?')?.text || questionData.questionText || "";
    const whWords = new Set(['who', 'what', 'where', 'when', 'why', 'how', 'which', 'whose', 'whom']);

    ['Q', 'A', 'B', 'C'].forEach(label => {
      let text = "";
      if (label === 'Q') text = questionText;
      else text = engParts.find(p => p.label === label)?.text || (questionData as any)[`option${label}`] || "";

      if (!text) return;
      const tokens = text.split(' ');
      const candidates: string[] = [];

      const isProperNoun = (idx: number) => {
        const t = tokens[idx];
        if (!t) return false;
        const clean = t.replace(/[^\w]/g, '');
        if (!clean) return false;
        return clean.charAt(0) === clean.charAt(0).toUpperCase() &&
          clean.charAt(0) !== clean.charAt(0).toLowerCase() &&
          idx > 0;
      };

      for (let i = 0; i < tokens.length; i++) {
        const word = tokens[i].toLowerCase().replace(/[^\w]/g, '');
        if (whWords.has(word)) {
          candidates.push(tokens[i].replace(/[^\w\s]+$/g, ''));
        }
        if (!isProperNoun(i) && (word.endsWith('ing') || word.endsWith('ed'))) {
          let vpTokens = [tokens[i]];
          if (i + 1 < tokens.length) {
            const next = tokens[i + 1].toLowerCase().replace(/[^\w]/g, '');
            if (prep.has(next)) vpTokens.push(tokens[i + 1]);
          }
          candidates.push(vpTokens.join(' ').replace(/[^\w\s]+$/g, ''));
        }
      }
      for (let i = 0; i < tokens.length; i++) {
        if (isProperNoun(i)) continue;
        const word = tokens[i].toLowerCase().replace(/[^\w]/g, '');
        if (det.has(word)) {
          let npTokens = []; let j = i + 1;
          while (j < tokens.length && j < i + 4) {
            const nextWord = tokens[j].toLowerCase().replace(/[^\w]/g, '');
            if (aux.has(nextWord) || prep.has(nextWord) || det.has(nextWord)) break;
            if (nextWord.endsWith('ing') || nextWord.endsWith('ed')) break;
            if (npTokens.length >= 1 && adverbs.has(nextWord)) break;
            npTokens.push(tokens[j].replace(/[^\w\s]+$/g, ''));
            if (/[.,;?!]/.test(tokens[j])) break;
            j++;
          }
          if (npTokens.length > 0) candidates.push(npTokens.join(' ').replace(/[^\w\s]+$/g, ''));
        }
      }
      tokens.forEach((t: string) => {
        const clean = t.toLowerCase().replace(/[^\w]/g, '');
        if (clean.length > 3 && !aux.has(clean) && !det.has(clean) && !prep.has(clean) && !whWords.has(clean)) {
          if (!candidates.some(c => c.includes(t))) candidates.push(t.replace(/[^\w\s]+$/g, ''));
        }
      });
      candidates.sort((a, b) => {
        const aCount = a.split(' ').length;
        const bCount = b.split(' ').length;
        if (aCount !== bCount) return bCount - aCount;
        return b.length - a.length;
      });
      const picked: string[] = [];
      for (const cand of candidates) {
        const candClean = cand.toLowerCase().replace(/[^\w\s]/g, '');
        if (![...maskedGlobal].some(m => candClean.includes(m) || m.includes(candClean))) {
          picked.push(cand);
          cand.split(' ').forEach(w => maskedGlobal.add(w.toLowerCase().replace(/[^\w]/g, '')));
          if (picked.length >= 2) break;
        }
      }
      map[label] = picked;
    });
    return map;
  }, [questionData, engParts, richData]);

  useEffect(() => {
    if (isSubmitted || showCompletion || isReviewMode) return;
    const interval = setInterval(() => setTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, showCompletion, isReviewMode]);

  useEffect(() => {
    const hasUnsavedData = Object.keys(answers).length > 0 && !isSubmitted && !isReviewMode;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (hasUnsavedData) { e.preventDefault(); e.returnValue = ''; } };
    const handleInternalNavigation = (e: MouseEvent) => {
      const target = e.target as HTMLElement; const anchor = target.closest('a');
      if (anchor && anchor.href && hasUnsavedData) {
        const url = new URL(anchor.href);
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          if (!window.confirm("Dữ liệu bài làm chưa được nộp sẽ bị mất. Bạn có chắc muốn chuyển bài hông?")) { e.preventDefault(); e.stopPropagation(); }
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleInternalNavigation, { capture: true });
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); document.removeEventListener('click', handleInternalNavigation, { capture: true }); };
  }, [isSubmitted, isReviewMode, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60); const secs = seconds % 60;
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
  const handleUpdateFlag = async (questionId: string, color: FlagColor | null, note?: string, deleteNote?: boolean) => {
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
          courseId,
          isFlagged: !!color,
          flagColor: color,
          flagNote: deleteNote ? null : (note !== undefined ? note : flagNotes[questionId])
        })
      });
    } catch (err) {
      console.error("Lỗi khi gắn cờ:", err);
    }

    if (onToggleFlag) onToggleFlag(questionId, !!color, color, deleteNote ? undefined : (note !== undefined ? note : flagNotes[questionId]));
  };

  const handleFinishTest = async () => {
    const answeredCount = Object.keys(answers).length; const totalCount = data.length;
    if (answeredCount < totalCount) { if (!window.confirm(`Bạn còn ${totalCount - answeredCount} câu chưa trả lời. Nộp bài ngay?`)) return; }
    else { if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return; }

    let cCount = 0; let uCount = 0;
    const payload = data.map(group => {
      const q = group.questions[0];
      const qKey = q.id || `${group.id}_${q.questionNo}`;
      const ans = answers[qKey] || "";
      const isCorrect = ans === q.correctAnswer;
      if (!ans) {
        uCount++;
        return null; // Trả về null cho câu chưa làm
      }
      if (isCorrect) cCount++;
      return {
        questionId: q.id || qKey,
        lessonId,
        courseId,
        userAnswer: ans,
        isCorrect,
        isFlagged: !!flags[qKey],
        flagColor: flags[qKey] || null
      };
    }).filter(item => item !== null) as any[];
    setTestScore({ correct: cCount, total: totalCount, incorrect: totalCount - cCount - uCount, unanswered: uCount });

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
    if (!waveformRef.current || !currentGroup?.audioUrl) return;
    if (wavesurfer.current) wavesurfer.current.destroy();
    const wsRegions = RegionsPlugin.create(); regionsPlugin.current = wsRegions;
    const ws = WaveSurfer.create({
      container: waveformRef.current, waveColor: '#cbd5e1', progressColor: '#3b82f6', cursorColor: '#1d4ed8',
      barWidth: 2, barGap: 2, barRadius: 2, height: 36, plugins: [wsRegions], fetchParams: { cache: "default" }
    });
    ws.load(currentGroup.audioUrl).catch(() => { }); wavesurfer.current = ws;
    ws.on('play', () => setIsPlaying(true)); ws.on('pause', () => setIsPlaying(false));
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
        region.remove();
        return;
      }
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
        return;
      }

      // Kéo xong: play từ đầu vùng chọn mới
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
      if (regions.length > 0) { const region = regions[0]; if (currentTime >= region.end) ws.play(region.start); }
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
      const target = e.target as HTMLElement;

      // 1. Chặn phím tắt khi đang focus vào ô ghi chú Flag Note
      if (target && target.id === 'flag-note-textarea') {
        return;
      }

      // 2. Khi đang chép chính tả: chỉ cho phép 1, 2, 3, 4 và phím ` phát âm thanh hoạt động
      if (target && target.getAttribute('data-dictation') === 'true') {
        if (!['1', '2', '3', '4', '`'].includes(e.key)) {
          return;
        }
      } else {
        // 3. Ở các input/textarea khác: Chặn hoàn toàn phím tắt
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
      }

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
        if (currentIndex === 0) {
          if (isFullTest && onPrevPart) onPrevPart();
        } else {
          setCurrentIndex(prev => prev - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex === data.length - 1) {
          if (isFullTest && onNextPart) onNextPart();
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const labels = ['question', 'A', 'B', 'C'];
        playSegment(labels[parseInt(e.key) - 1]);
        return;
      }

      // CTRL/CMD + SHIFT + S: Toggle Solution
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setRevealMode(prev => !prev);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, data.length, isFullTest, onPrevPart, onNextPart]);

  const changeSpeed = (speed: number) => { setPlaybackRate(speed); if (wavesurfer.current) wavesurfer.current.setPlaybackRate(speed); };

  if (!data || data.length === 0) return <div>Không có dữ liệu bài tập!</div>;

  if (showCompletion) {
    return (
      <div className="absolute inset-0 w-full h-full bg-[#f8fafc] z-[200] overflow-y-auto flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-w-4xl bg-white rounded-[40px] p-8 md:p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600"></div>
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 mx-auto shadow-inner ring-8 ring-emerald-50/50">
            <TrophyIcon className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#05b169] mb-4 tracking-tight uppercase">HOÀN THÀNH BÀI LÀM!</h2>
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
            <button onClick={() => setShowCompletion(false)} className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-600 font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
              👁️ Xem lại bài
            </button>
            <button onClick={handleRetake} className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.2)] font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
              🔄 Làm lại bài
            </button>
            {nextLessonId && (
              <Link href={`/learn/${courseId}/lesson/${nextLessonId}`} className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-wide group">
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
        {/* Questions Column Wrapper */}
        <div className="flex-1 relative flex flex-col overflow-visible">
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-20 scrollbar-thin">
            <div className="flex flex-wrap justify-between items-center bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 mb-2 gap-2">
              <div className="flex items-center gap-2">
                <button id="dictation-mode-btn" onClick={() => setMode(mode === 'dictation' ? 'practice' : 'dictation')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${mode === 'dictation' ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>✏️ Chế độ Chép chính tả</button>
                <button
                  id="hint-mode-btn"
                  onClick={() => setIsHintMode(!isHintMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition flex items-center gap-2 ${isHintMode ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'}`}
                >
                  {isHintMode ? "✨ Tắt Chế độ Gợi ý" : "💡 Chế độ Gợi ý"}
                </button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto mb-4 relative z-[250]">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-3 py-2 flex items-center gap-3">
                {/* Play/Pause Button */}
                <div className="relative group shrink-0">
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
                <div className="flex bg-slate-50 rounded-lg border border-slate-200 p-0.5 shrink-0">
                  {[0.5, 0.75, 1, 1.25, 1.5].map(speed => (
                    <button key={speed} onClick={() => changeSpeed(speed)} className={`px-2 py-1 rounded-md text-[10px] font-black transition-all ${playbackRate === speed ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:bg-white hover:text-indigo-600'}`}>
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto pb-10">
              <div className="flex flex-col gap-2.5 py-2 justify-center w-full tour-question-options-target">
                <div className={`border p-3.5 rounded-2xl mb-1 transition-all overflow-visible ${mode === 'dictation' ? 'border-pink-200 bg-pink-50/30' : 'border-blue-100 bg-blue-50/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">CÂU HỎI (QUESTION)</div>
                    <FlagSelector
                      isFlagged={!!flags[currentQKey]}
                      flagColor={flags[currentQKey] || 'RED'}
                      flagNote={flagNotes[currentQKey]}
                      onToggle={(color, note) => handleUpdateFlag(currentQKey, color, note)}
                      onUnflag={(deleteNote) => handleUpdateFlag(currentQKey, null, undefined, deleteNote)}
                      compact={true}
                      layout="horizontal"
                    />
                    <button
                      id="reveal-btn"
                      onClick={() => setRevealMode(!revealMode)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg border-2 transition-all ${revealMode ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                      title={`${revealMode ? 'Ẩn lời giải' : 'Hiện lời giải'} (Phím tắt: ctrl/cmd + shift + s)`}
                    >
                      <span className="text-xs leading-none">👁️</span>
                    </button>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 shrink-0 mt-[3px]">
                      <div className="bg-blue-600 text-white font-bold text-sm rounded-lg px-2.5 py-1 shadow-md leading-none">{questionData?.questionNo}</div>
                      {(currentGroup?.metadata as any)?.timestamps?.['question'] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSegment('question');
                          }}
                          className={`part2-segment-audio-btn w-8 h-8 flex items-center justify-center rounded-xl border-2 transition-all duration-300 ${playingSegmentLabel === 'question'
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 animate-pulse'
                            : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm bg-white'
                            }`}
                          title="Nghe câu hỏi (Phím tắt: phím số 1)"
                        >
                          <Volume2 size={14} fill={playingSegmentLabel === 'question' ? "currentColor" : "none"} />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 text-lg font-bold text-slate-800 leading-relaxed min-h-[40px]">
                      {mode === 'dictation' ? (
                        <DictationSentence targetText={richData?.question?.en || engParts.find(p => p.label === '?')?.text || questionData.questionText || ""} />
                      ) : (revealMode || isHintMode) ? (
                        <div className="space-y-2">
                          <div className="font-bold text-slate-900 text-[17px]">
                            {(() => {
                              // HIEN THI TIENG ANH: KHONG QUET VAO PHAN VIETNAMESE
                              const explQuestion = richData?.question?.en || (typeof richData?.question === 'string' ? richData.question : null);
                              const transcriptQuestion = engParts.find(p => p.label === '?' || p.label === 'Q')?.text;

                              const displayValue = explQuestion || transcriptQuestion || questionData.questionText || "";

                              let target: "group" | "question" = "question";
                              let field = "questionText";
                              let id = questionData?.id;
                              let sid = "";

                              if (explQuestion && richData?.question) {
                                field = "explanation.question";
                              } else if (transcriptQuestion) {
                                target = "group";
                                id = currentGroup?.id;
                                field = "transcript";
                                sid = "Q";
                              }

                              return (
                                <AdminInlineEditor
                                  target={target as "question" | "group"}
                                  id={id}
                                  field={field}
                                  sid={sid}
                                  value={displayValue}
                                  multiline
                                >
                                  <FormattedText
                                    text={displayValue}
                                    revealed={revealMode}
                                    currentIndex={currentIndex}
                                    hintMode={isHintMode}
                                    wordsToMask={hintMasksMap['Q']}
                                    startHintIndex={1}
                                  />
                                </AdminInlineEditor>
                              );
                            })()}
                          </div>
                          {(richData?.question?.vi || explanationObj.vietText) && revealMode && (
                            <div className="mt-2 text-indigo-600/80 font-medium italic text-[15px] pl-3 border-l-2 border-indigo-100 bg-indigo-50/30 p-2 rounded-r-lg">
                              {(() => {
                                // KIEM TRA CHINH XAC NGUON GOC BAN DICH
                                const metaTranslation = (questionData.metadata as any)?.vietnamese?.question_vi || (questionData.metadata as any)?.vietnamese?.question;
                                const explTranslation = richData?.question?.vi || (typeof richData?.question === 'object' ? richData.question.vi : null) || explanationObj.vietText;
                                const transcriptTranslation = vieParts.find(p => p.label === 'Q' || p.label === '?')?.text;

                                const displayValue = metaTranslation || explTranslation || transcriptTranslation || "";

                                let target: "group" | "question" = "question";
                                let field = "explanation.vietText";
                                let id = questionData?.id;
                                let sid = "";

                                if (metaTranslation && (questionData.metadata as any)?.vietnamese) {
                                  field = "metadata.vietnamese.question_vi";
                                } else if (explTranslation && richData?.question?.vi) {
                                  field = "explanation.question.vi";
                                } else if (transcriptTranslation) {
                                  target = "group";
                                  id = currentGroup?.id;
                                  field = "transcript";
                                  sid = "Q";
                                }

                                return (
                                  <AdminInlineEditor
                                    target={target as "question" | "group"}
                                    id={id}
                                    field={field}
                                    sid={sid}
                                    value={displayValue}
                                    multiline
                                  >
                                    <StaticFormattedText text={displayValue} />
                                  </AdminInlineEditor>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ) : (<div className="h-6 w-1/2 bg-slate-200/50 animate-pulse rounded mt-2"></div>)}
                    </div>
                  </div>
                </div>
                {mode === 'dictation' && <div className="text-[10px] font-bold text-pink-600 uppercase tracking-widest pl-2 mb-1 border-l-2 border-pink-500">THỬ THÁCH ĐIỀN TỪ: GÕ THAY THẾ CÁC DẤU CHẤM</div>}
                <div className="flex flex-col gap-1.5">
                  {['A', 'B', 'C'].map(opt => {
                    const richOpt = richData?.options?.find((o: any) => o.label === opt);
                    const engPartFromParsed = engParts.find(p => p.label === opt);

                    const targetEngText = richOpt?.en || engPartFromParsed?.text || (questionData as any)[`option${opt}`] || "";
                    const viText = richOpt?.vi || vieParts.find(p => p.label === opt)?.text || "";

                    const isCorrectTarget = correctAnswer === opt;
                    const isSelected = selectedAnswer === opt;
                    const boxClasses = ["border py-0.5 px-2 rounded-xl flex gap-2 transition-all outline-none text-left w-full relative cursor-pointer", revealMode ? (isCorrectTarget ? "border-emerald-500 bg-emerald-50 shadow-sm" : isSelected ? "border-red-500 bg-red-100 shadow-sm" : "border-slate-200 bg-white shadow-none") : (isSelected ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm")].join(" ");
                    let circleBorder = ""; let circleFill = "";
                    if (revealMode) { if (isCorrectTarget) { circleBorder = "border-emerald-500"; circleFill = "bg-emerald-500"; } else if (isSelected) { circleBorder = "border-red-500"; circleFill = "bg-red-500"; } else { circleBorder = "border-slate-300"; } } else { if (isSelected) { circleBorder = "border-blue-500"; circleFill = "bg-blue-500"; } else { circleBorder = "border-slate-300"; } }

                    const incorrectRationale = richData?.explanation?.incorrect?.find((i: any) => i.label === opt);
                    const correctRationale = isCorrectTarget ? (richData?.explanation?.correct || richData?.explanation) : null;

                    return (
                      <React.Fragment key={opt}>
                        <div
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-full select-text cursor-default"
                        >
                          <div className={boxClasses.replace('cursor-pointer', 'cursor-default')}>
                            <div
                              onClick={() => handleSelectAnswer(opt)}
                              className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-black border transition-all duration-300 cursor-pointer group/opt ${revealMode
                                ? (isCorrectTarget ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' : isSelected ? 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-500/20' : 'bg-slate-50 text-slate-400 border-slate-200')
                                : isSelected ? 'bg-blue-600 text-white border-blue-700 scale-105 shadow-sm shadow-blue-200' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-500 hover:scale-110'
                                }`}
                            >
                              {opt}
                            </div>
                            <div className="flex-1 w-full text-left">
                              <div className={`font-bold text-[16px] leading-relaxed flex items-start gap-2 ${revealMode && isCorrectTarget ? 'text-emerald-700' : 'text-slate-900'}`}>
                                <div className="flex items-center gap-1.5 shrink-0 mt-[2px]">
                                  {(currentGroup?.metadata as any)?.timestamps?.[opt] && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        playSegment(opt);
                                      }}
                                      className={`part2-segment-audio-btn p-1 rounded-md transition-all duration-300 ${playingSegmentLabel === opt
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 animate-pulse'
                                        : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'
                                        }`}
                                      title={`Nghe phương án ${opt} (Phím tắt: phím số ${['A', 'B', 'C'].indexOf(opt) + 2})`}
                                    >
                                      <Volume2 size={13} fill={playingSegmentLabel === opt ? "currentColor" : "none"} />
                                    </button>
                                  )}
                                </div>
                                <div className="flex-1">
                                  {mode === 'dictation' ? (<DictationSentence targetText={targetEngText} />) : (revealMode || isHintMode) ? (
                                    <div className="space-y-1.5">
                                      <div className="font-semibold text-slate-800">
                                        <AdminInlineEditor
                                          target="group"
                                          id={currentGroup?.id}
                                          field="transcript"
                                          sid={opt}
                                          value={targetEngText}
                                        >
                                          <FormattedText
                                            text={targetEngText}
                                            revealed={revealMode}
                                            currentIndex={currentIndex}
                                            hintMode={isHintMode}
                                            wordsToMask={hintMasksMap[opt]}
                                            startHintIndex={1 + (hintMasksMap['Q']?.length || 0) + (['A', 'B', 'C'].indexOf(opt) * 2)}
                                          />
                                        </AdminInlineEditor>
                                      </div>
                                      {viText && revealMode && (
                                        <div className={`text-xs italic mt-0.5 ${isCorrectTarget ? 'text-emerald-700/80 font-medium' : 'text-slate-500'}`}>
                                          <AdminInlineEditor
                                            target="question"
                                            id={questionData.id}
                                            field={`${basePath}.vietText`}
                                            sid={opt}
                                            value={viText}
                                            multiline
                                          >
                                            <StaticFormattedText text={viText} />
                                          </AdminInlineEditor>
                                        </div>
                                      )}
                                    </div>
                                  ) : (<div className="h-5 w-full bg-slate-100 animate-pulse rounded opacity-50"></div>)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {revealMode && (incorrectRationale || (isCorrectTarget && correctRationale?.why)) && (
                          <div className={`mt-2 ml-9 p-3 rounded-xl text-xs border ${isCorrectTarget ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                            <div className="font-bold mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                              {isCorrectTarget ? (
                                <><CheckCircleIcon className="w-3.5 h-3.5" /> Tại sao đúng?</>
                              ) : (
                                <><FlagIcon className="w-3.5 h-3.5" /> Tại sao sai (Bẫy)?</>
                              )}
                            </div>
                            <div className="leading-relaxed opacity-90">
                              {isCorrectTarget ? (
                                <AdminInlineEditor
                                  target="question"
                                  id={questionData.id}
                                  field={`${basePath}.explanation.correct.why`}
                                  value={correctRationale?.why || correctRationale?.why_correct || ""}
                                  multiline
                                >
                                  <AutoBoldEnglish text={correctRationale?.why || correctRationale?.why_correct || ""} />
                                </AdminInlineEditor>
                              ) : (
                                <AdminInlineEditor
                                  target="question"
                                  id={questionData.id}
                                  field={`${basePath}.explanation.incorrect.why`}
                                  sid={opt}
                                  value={incorrectRationale?.why || ""}
                                  multiline
                                >
                                  <AutoBoldEnglish text={incorrectRationale?.why || ""} />
                                </AdminInlineEditor>
                              )}
                            </div>

                            {incorrectRationale?.suggested_question && (
                              <div className="mt-2 pt-2 border-t border-red-200/50 italic opacity-80">
                                <p className="font-medium text-[10px] mb-1">{incorrectRationale.context_intro || "Câu này sẽ ĐÚNG nếu câu hỏi là:"}</p>
                                <div className="group/suggested">
                                  <div className="flex items-center gap-1">
                                    •
                                    <AdminInlineEditor
                                      target="question"
                                      id={questionData.id}
                                      field={`${basePath}.explanation.incorrect.en`}
                                      sid={opt}
                                      value={incorrectRationale.suggested_question.en}
                                    >
                                      <strong className="font-bold text-slate-900 tracking-wide"><AutoBoldEnglish text={incorrectRationale.suggested_question.en} /></strong>
                                    </AdminInlineEditor>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); speak(incorrectRationale.suggested_question.en); }}
                                      className="inline-flex items-center justify-center p-1 rounded-md text-red-400 hover:bg-red-100 hover:text-red-600 transition-all align-middle"
                                      title="Nghe phát âm"
                                    >
                                      <Volume2 size={12} />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-red-900/60 font-medium">
                                  →
                                  <AdminInlineEditor
                                    target="question"
                                    id={questionData.id}
                                    field={`${basePath}.explanation.incorrect.vi`}
                                    sid={opt}
                                    value={incorrectRationale.suggested_question.vi}
                                  >
                                    {incorrectRationale.suggested_question.vi}
                                  </AdminInlineEditor>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {isReviewMode && selectedAnswer && !revealMode && (
                  <div className="mt-8 flex justify-center">
                    <button onClick={async () => { setRevealMode(true); const isC = selectedAnswer === correctAnswer; if (isC) { if (lessonId && currentQuestionId) { await fetch('/api/progress/questions', { method: 'POST', body: JSON.stringify({ mode: 'batch', attempts: [{ questionId: currentQuestionId, lessonId, courseId, userAnswer: selectedAnswer, isCorrect: true, isFlagged: flags[currentQuestionId] || false }] }) }); } if (onResolved) onResolved(); } }} className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all animate-in zoom-in-90">Kiểm Tra Đáp Án</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* INTEGRATED SIDEBAR COLUMN - Hide if Full Test (Parent has its own) */}
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
                      if (!answers[q.id]) btnClass = "bg-slate-800 text-slate-500 border border-slate-700";
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
                        {isFlaged && (
                          <div className="absolute top-1 right-1 group/flag">
                            <Flag size={10} className="text-red-500 fill-red-500 shadow-sm" />
                            {flagNotes[qKey] && (
                              <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/flag:opacity-100 transition-all duration-200 pointer-events-none z-[1000]">
                                <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10 w-48 text-left">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <PenLine size={10} className="text-blue-400" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ghi chú</span>
                                  </div>
                                  <p className="text-[10px] leading-relaxed font-medium line-clamp-4 italic text-slate-100">
                                    "{flagNotes[qKey]}"
                                  </p>
                                  <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/10" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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
                onClick={() => {
                  if (currentIndex === 0) {
                    if (onPrevPart) onPrevPart();
                  } else {
                    setCurrentIndex(prev => prev - 1);
                  }
                }}
                disabled={currentIndex === 0 && !onPrevPart}
                className="px-8 py-3 rounded-full font-bold text-[13px] transition-all disabled:opacity-20 hover:bg-slate-50 text-slate-400 uppercase tracking-widest"
              >
                {currentIndex === 0 && onPrevPart ? 'Về part trước' : 'Lùi'}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] translate-y-2 group-hover:translate-y-0">
                Phím tắt: Mũi tên trái
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
              </div>
            </div>

            <div className="px-8 font-black text-slate-600 text-sm border-x border-slate-100">
              {isFullTest ? (
                <>
                  {questionData?.questionNo || (globalOffset + currentIndex + 1)} <span className="mx-1 text-slate-300">/</span> {globalTotal || 200}
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
                    Tiếp sang Part 3 <ChevronRightIcon className="w-4 h-4" />
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
              <button
                onClick={() => startToeicPartTour(2, true)}
                className="absolute left-4 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 pointer-events-auto"
                title="Khởi động Tour hướng dẫn nhanh"
              >
                <HelpCircle size={13} className="animate-pulse" />
                Hướng dẫn nhanh
              </button>
              {navContent}
            </div>,
            document.getElementById("bottom-nav-portal-target")!
          );
        }

        return (
          <div className="relative flex-none h-20 bg-white/80 backdrop-blur-md border-t border-slate-100 z-[70] flex items-center justify-center pb-2">
            <button
              onClick={() => startToeicPartTour(2, true)}
              className="absolute left-4 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 pointer-events-auto"
              title="Khởi động Tour hướng dẫn nhanh"
            >
              <HelpCircle size={13} className="animate-pulse" />
              Hướng dẫn nhanh
            </button>
            {navContent}
          </div>
        );
      })()}
      {/* FORCE WORD-LEVEL SELECTION STYLES */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .select-text {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        [role="button"] *, div[onClick] * {
          pointer-events: auto !important;
        }
      ` }} />
    </div>
  );
}
