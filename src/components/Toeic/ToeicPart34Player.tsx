"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";

import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import {
  PlayIcon, PauseIcon, ClockIcon, FlagIcon, CheckBadgeIcon,
  InformationCircleIcon, ForwardIcon, XMarkIcon, TrophyIcon,
  ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, EyeIcon, BookOpenIcon
} from "@heroicons/react/24/solid";
import { Send, ChevronLeft, ChevronRight, Play, Pause, Volume2, HelpCircle, CheckCircle2, XCircle, Info, Lightbulb, Flag, ChevronsLeftRight, LayoutDashboard, PenLine } from "lucide-react";
import { AdminInlineEditor } from "@/components/Admin/AdminInlineEditor";
import { useAdminEdit } from "@/components/Admin/AdminEditProvider";
import confetti from 'canvas-confetti';
import Link from 'next/link';
import FlagSelector, { FlagColor } from '../Player/FlagSelector';
import { startToeicPartTour } from './toeicTour';
import FloatingVideoExplanationPlayer from '../Player/FloatingVideoExplanationPlayer';

// --- UTILITIES (ĐỊNH NGHĨA NỘI BỘ ĐỂ TRÁNH LỖI IMPORT) ---
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- HỖ TRỢ HIỂN THỊ TRANSCRIPT ---
const InteractiveWord = ({ word, isReveal, forceBold = false }: { word: string, isReveal: boolean, forceBold?: boolean }) => {
  const [revealed, setRevealed] = useState(false);
  const isRevealed = revealed || isReveal;

  const match = word.match(/^(.*?)([.,!?;:"'()\[\]{}]*)$/);
  const letters = match ? match[1] : word;
  const punctuation = match ? match[2] : "";
  const maskedLetters = letters.replace(/[a-zA-Z]/g, '_');

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text.replace(/[^a-zA-Z]/g, ''));
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

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
        <span className={`select-text ${forceBold ? 'font-black text-indigo-900 underline decoration-indigo-300 underline-offset-4' : ''}`}>{word}</span>
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

const getQuestionStyles = (qNo: number | null) => {
  if (!qNo) return { text: 'text-slate-900', bg: 'bg-transparent', border: 'border-transparent', sup: 'text-slate-600 bg-blue-50' };

  const index = (qNo - 1) % 3;
  const styles = [
    { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-300', decoration: 'decoration-indigo-300/60', sup: 'text-indigo-700 bg-indigo-100' },   // Q1
    { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', decoration: 'decoration-emerald-300/60', sup: 'text-emerald-700 bg-emerald-100' }, // Q2
    { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300', decoration: 'decoration-orange-300/60', sup: 'text-orange-700 bg-orange-100' },    // Q3
  ];
  return styles[index] || styles[0];
};

const FormattedInteractiveText = ({ text, revealed, initialBold = false, questions = [], qNo = null, initialQNo = null, sharedKeywordsMap = {} }: { text: string; revealed: boolean, initialBold?: boolean, questions?: any[], qNo?: number | null, initialQNo?: number | null, sharedKeywordsMap?: Record<number, string[]> }) => {
  if (!text) return { content: null, finalBold: initialBold, finalQNo: initialQNo };

  const sanitizedText = text.replace(/\$(\d+)\$/g, '$^{$1}$');
  const parts = sanitizedText.split(/(\*\*|\$\^\{.*?\}\$|\^\{.*?\}\$|\^\{.*?\}|\|\^\{.*?\}\$\|)/g);

  let isBold = initialBold;
  let activeQNo: number | null = initialQNo || qNo;

  const content = parts.map((part, index) => {
    if (!part) return null;

    if (part === '**') {
      isBold = !isBold;
      return null;
    }

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
      activeQNo = parseInt(supContent);
      const styles = getQuestionStyles(activeQNo);

      return (
        <sup key={index} className={`text-[12px] font-bold ${styles.sup} px-1.5 rounded-md ml-0.5 inline -translate-y-1 shadow-sm border border-current/10 pointer-events-none select-none`}>
          {supContent}
        </sup>
      );
    }

    const styles = getQuestionStyles(activeQNo);
    const subParts = part.split(' ').map((word, wIdx, arr) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isKeyword = activeQNo && sharedKeywordsMap[activeQNo]?.includes(cleanWord);

      return (
        <span key={`${index}-${wIdx}`} className="inline">
          <InteractiveWord word={word} isReveal={revealed} forceBold={!!isKeyword} />
          {wIdx < arr.length - 1 && <span className="select-text"> </span>}
        </span>
      );
    });

    if (isBold) {
      return (
        <strong key={index} className={`font-bold ${styles.text}`}>
          {subParts}
        </strong>
      );
    }

    return <span key={index}>{subParts}</span>;
  });

  return { content, finalBold: isBold, finalQNo: activeQNo };
};

const FormattedText = ({ text, revealed, initialBold = false, questions = [], qNo = null, isExplanation = false, sharedKeywordsMap = {} }: { text: string; revealed: boolean, initialBold?: boolean, questions?: any[], qNo?: number | null, isExplanation?: boolean, sharedKeywordsMap?: Record<number, string[]> }) => {
  if (!text) return null;

  let processedText = text;

  if (isExplanation) {
    processedText = processedText.replace(/\*\*/g, '');
    processedText = processedText.replace(/(\(.*?\)|'[^']*(?:'[\w]{1,2}[^']*)*'|"[^"]*")/g, '**$1**');
  }

  const { content } = FormattedInteractiveText({ text: processedText, revealed, initialBold, questions, qNo, sharedKeywordsMap });
  return <>{content}</>;
};

const InteractiveTranscript = ({ passages, revealed }: any) => {
  if (!passages || !passages.length) return null;

  return (
    <div className="space-y-8">
      {passages.map((passage: any, pIdx: number) => {
        const html = passage.html_content || "";
        const transMap = passage.translation_map || {};

        const segments = html.match(/<div data-sid='(.*?)'>(.*?)<\/div>/g) || [];

        return (
          <div key={pIdx} className="space-y-4">
            {segments.map((segment: string, sIdx: number) => {
              const sidMatch = segment.match(/data-sid='(.*?)'/);
              const contentMatch = segment.match(/>(.*?)<\/div>/);
              const sid = sidMatch ? sidMatch[1] : "";
              const content = contentMatch ? contentMatch[1] : "";
              const translation = transMap[sid] || "";

              return (
                <div key={sIdx} className="group">
                  <div
                    className="text-base leading-relaxed text-slate-800"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                  {revealed && translation && (
                    <div
                      className="mt-1 text-[13px] text-slate-500 italic pl-4 border-l-2 border-slate-200 group-hover:border-blue-300 transition-colors leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: translation }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// --- TRÌNH PHÁT CHÍNH ---
interface ProgressType {
  isCorrect: boolean;
  userAnswer: string;
  isFlagged: boolean;
  flagColor?: 'RED' | 'PURPLE' | 'BLUE' | 'YELLOW' | null;
  flagNote?: string | null;
}

interface ToeicPart34PlayerProps {
  data: any[];
  lessonId?: string;
  initialProgress?: Record<string, ProgressType>;
  courseId?: string;
  nextLessonId?: string;
  onFinish?: (results: any) => void;
  isReviewMode?: boolean;
  isSubmitted?: boolean;
  onResolved?: () => void;
  onToggleFlag?: (qId: string, flag: boolean, color?: FlagColor | null, note?: string) => void;
  targetPart?: number;
  onProgressChange?: (progress: Record<string, any>) => void;
  isFullTest?: boolean;
  onNextPart?: () => void;
  onPrevPart?: () => void;
  onActiveQuestionChange?: (questionNo: number) => void;
  jumpTo?: { id: string; ts: number } | null;
  globalOffset?: number;
  globalTotal?: number;
  videoExplanation?: any;
  onVideoQuestionSync?: (questionNo: number) => void;
  onToggleVideo?: () => void;
  videoOpen?: boolean;
}

export default function ToeicPart34Player({
  data: rawData,
  lessonId,
  initialProgress = {},
  courseId,
  nextLessonId,
  onFinish,
  isReviewMode = false,
  isSubmitted = false,
  onResolved,
  onToggleFlag,
  targetPart = 3,
  onProgressChange,
  isFullTest,
  onNextPart,
  onPrevPart,
  onActiveQuestionChange,
  jumpTo,
  globalOffset = 0,
  globalTotal,
  videoExplanation: videoExplanationRaw,
  onVideoQuestionSync,
  onToggleVideo,
  videoOpen
}: ToeicPart34PlayerProps) {
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

  // Sắp xếp dữ liệu CHẶT CHẼ theo thứ tự câu hỏi tăng dần ngay từ đầu
  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];
    return [...rawData].sort((a, b) => {
      const aMin = Math.min(...(a.questions || []).map((q: any) => q.questionNo || 999));
      const bMin = Math.min(...(b.questions || []).map((q: any) => q.questionNo || 999));
      return aMin - bMin;
    }).map(group => {
      // Enrich questions with text from metadata if missing
      const mj = (group.metadata as any)?.Json || (group.metadata as any)?.json || (group.metadata as any)?.JSON;
      const pj = typeof mj === 'string' ? JSON.parse(mj) : mj;

      const enrichedQuestions = (group.questions || []).map((q: any, idx: number) => {
        // Recursive helper to find question data in metadata
        const findInMeta = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return null;

          const targetNos = [
            String(q.questionNo),
            String(q.originalQuestionNo),
            String(idx + 1), // Local index (1, 2, 3)
            String(q.questionNo % 100),
          ].filter(v => v && v !== 'undefined' && v !== '0');

          if (Array.isArray(obj)) {
            // 1. Try matching by question number fields
            for (const item of obj) {
              const itemNo = String(item.questionNo || item.question_no || item.number || item.qNo || "");
              if (itemNo && targetNos.includes(itemNo)) return item;
            }
            // 2. Fallback to index only if count matches and no other match found
            if (obj.length === (group.questions || []).length && obj[idx]) {
              return obj[idx];
            }
            // 3. Search deeper
            for (const item of obj) {
              const res = findInMeta(item);
              if (res) return res;
            }
          } else {
            const itemNo = String(obj.questionNo || obj.question_no || obj.number || obj.qNo || "");
            if (itemNo && targetNos.includes(itemNo)) return obj;

            for (const key in obj) {
              if (targetNos.includes(String(key))) return obj[key];
              const res = findInMeta(obj[key]);
              if (res) return res;
            }
          }
          return null;
        };

        const metaQ = findInMeta(pj || group.metadata);
        const textFallback = metaQ?.question || metaQ?.text || metaQ?.questionText;

        if (metaQ) {
          // Merge metadata into q, prioritizing q's existing properties but filling blanks
          return {
            ...metaQ,
            ...q,
            questionText: (q.questionText && q.questionText.trim() !== "") ? q.questionText : textFallback,
            optionA: q.optionA || metaQ.optionA || metaQ.a || metaQ.options?.A || "",
            optionB: q.optionB || metaQ.optionB || metaQ.b || metaQ.options?.B || "",
            optionC: q.optionC || metaQ.optionC || metaQ.c || metaQ.options?.C || "",
            optionD: q.optionD || metaQ.optionD || metaQ.d || metaQ.options?.D || "",
          };
        }
        return q;
      });

      return {
        ...group,
        questions: [...enrichedQuestions].sort((a, b) => (a.questionNo || 0) - (b.questionNo || 0))
      };
    });
  }, [rawData]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
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
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAdminMode } = useAdminEdit();
  const [hoveredTranslation, setHoveredTranslation] = useState<{ text: string, sid: string } | null>(null);
  const hoverTimeoutRef = useRef<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const [revealMode, setRevealMode] = useState(isReviewMode || isSubmitted);
  const [revealPartialMode, setRevealPartialMode] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSubmittedInternal, setIsSubmittedInternal] = useState(isSubmitted);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
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
  const playingSegmentRef = useRef<{
    label: string,
    segments: { start: number, end: number }[],
    currentSegmentIndex: number
  } | null>(null);

  // Tự động cuộn lên đầu khi chuyển câu (group)
  useEffect(() => {
    if (transcriptScrollRef.current) transcriptScrollRef.current.scrollTop = 0;
    if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;

    // Reset revealMode when switching group unless it's review mode or already submitted
    if (!isReviewMode && !isSubmittedInternal) {
      setRevealMode(false);
      setRevealPartialMode(false);
    }
  }, [currentIndex, isReviewMode, isSubmittedInternal]);

  // Nhảy tới câu hỏi từ Full Test Sidebar hoặc Review Center
  useEffect(() => {
    if (jumpTo?.id && data.length > 0) {
      const targetId = String(jumpTo.id);
      const idx = data.findIndex(g =>
        g.questions?.some((q: any) =>
          String(q.questionNo) === targetId ||
          String(q.id) === targetId
        )
      );

      if (idx !== -1) {
        setCurrentIndex(idx);

        // Cuộn lên đầu các container trước
        if (transcriptScrollRef.current) transcriptScrollRef.current.scrollTop = 0;
        if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Tự động khởi chạy tour hướng dẫn học Part 3 hoặc Part 4 lần đầu
    startToeicPartTour(targetPart);
  }, [targetPart]);


  // Sync with parent submission state
  useEffect(() => {
    if (isSubmitted) {
      setIsSubmittedInternal(true);
      setRevealMode(true);
    }
  }, [isSubmitted]);

  // Notify parent of progress changes
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




  const [totalQuestionsDone, setTotalQuestionsDone] = useState(0);
  const [testScore, setTestScore] = useState({ correct: 0, total: 0, incorrect: 0, unanswered: 0 });

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const regionsPlugin = useRef<any>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const questionsScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);


  const [vSplitWidth, setVSplitWidth] = useState(55); // % chiều rộng khung trái (Vertical)
  const [isResizingV, setIsResizingV] = useState(false);

  const currentGroup = data[currentIndex] || { questions: [] };

  const parsedTranscript = useMemo(() => {
    try {
      const mj = (currentGroup.metadata as any)?.Json;
      const pj = typeof mj === 'string' ? JSON.parse(mj) : mj;
      // 1. Cấu trúc Mới (html_content + translation_map)
      if (pj?.passages && Array.isArray(pj.passages) && pj.passages.length > 0) {
        const p = pj.passages[0];
        const html = p.html_content || "";
        const tMap = p.translation_map || {};

        const sentences: any[] = [];
        const regex = /data-sid=['"]([^'"]+)['"]>([\s\S]*?)<\/div>/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          const rawContent = match[2];
          const speakerMatch = rawContent.match(/^<b>(.*?):<\/b>/);
          let speaker = speakerMatch ? speakerMatch[1].trim() : "";

          const cleanEnglish = rawContent
            .replace(/<sup[^>]*>.*?<\/sup>/g, "")
            .replace(/^<b>(.*?):<\/b>/g, "")
            .replace(/\^{.*?}/g, "")
            .replace(/<[^>]*>/g, "")
            .trim();

          sentences.push({
            id: match[1],
            speaker,
            english: cleanEnglish,
            viText: (tMap[match[1]] || "").replace(/<[^>]*>/g, "").trim()
          });
        }
        if (sentences.length > 0) return sentences;
      }

      // 2. Cấu trúc Legacy
      let t: any = null;
      if (currentGroup.transcript) {
        t = typeof currentGroup.transcript === 'string' ? JSON.parse(currentGroup.transcript) : currentGroup.transcript;
      } else if (currentGroup.metadata && (currentGroup.metadata as any).transcript) {
        t = typeof (currentGroup.metadata as any).transcript === 'string' ? JSON.parse((currentGroup.metadata as any).transcript) : (currentGroup.metadata as any).transcript;
      }

      if (t && t.english && Array.isArray(t.english)) {
        return t.english.map((enObj: any) => {
          const viMatch = t.vietnamese?.find((v: any) => v.sentenceID === enObj.sentenceID);
          return { ...enObj, viText: viMatch?.text || "" };
        });
      }

      if (Array.isArray(t)) return t.map(item => ({ ...item, viText: item.vietnamese || "" }));
      return [];
    } catch (e) {
      console.error("Error parsing transcript:", e);
      return [];
    }
  }, [currentGroup]);

  const sharedKeywordsMap = useMemo(() => {
    if (!parsedTranscript || !currentGroup.questions) return {};

    const stopWords = new Set(['the', 'and', 'for', 'only', 'from', 'with', 'that', 'this', 'your', 'they', 'them', 'then', 'than', 'once', 'please', 'note', 'can', 'also', 'some', 'any', 'will', 'would', 'should', 'could', 'about', 'been', 'were', 'have', 'more', 'when', 'what', 'where', 'which', 'their', 'very', 'here', 'there', 'those', 'these', 'just', 'been', 'each', 'into']);

    const evidenceTextMap: Record<number, string> = {};
    const mj = (currentGroup.metadata as any)?.Json;
    const pj = typeof mj === 'string' ? JSON.parse(mj) : mj;

    parsedTranscript.forEach((item: any) => {
      const evidenceFor = pj?.questions?.find((q: any) => q.evidence_sids?.includes(item.id));
      const qNo = evidenceFor ? evidenceFor.question_no || (pj.questions.indexOf(evidenceFor) + (currentGroup.questions[0]?.questionNo || 1)) : null;
      if (qNo) {
        evidenceTextMap[qNo] = (evidenceTextMap[qNo] || "") + " " + item.english;
      }
    });

    const resultMap: Record<number, string[]> = {};
    currentGroup.questions.forEach((q: any) => {
      const qNo = q.questionNo;
      const correctOpt = q.correctAnswer;
      const ansText = (q as any)[`option${correctOpt}`] || "";
      const eviText = evidenceTextMap[qNo] || "";

      if (!eviText) return;

      const cleanRegex = /[^a-z0-9]/g;
      const ansWords = ansText.toLowerCase().split(/[\s,.;!?]+/).map((w: string) => w.replace(cleanRegex, '')).filter((w: string) => w.length >= 3 && !stopWords.has(w));
      const eviWords = new Set(eviText.toLowerCase().split(/[\s,.;!?]+/).map((w: string) => w.replace(cleanRegex, '')).filter((w: string) => w.length >= 3 && !stopWords.has(w)));

      const shared = ansWords.filter((w: string) => eviWords.has(w));
      if (shared.length) {
        resultMap[qNo] = shared;
      }
    });
    return resultMap;
  }, [parsedTranscript, currentGroup]);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <ClockIcon className="w-12 h-12 animate-pulse" />
        <p className="font-medium">Đang tải câu hỏi Part {targetPart}...</p>
      </div>
    );
  }

  // Giải mã dữ liệu Pedagogical (Giải thích, Từ vựng)
  const richData = useMemo(() => {
    try {
      const meta = currentGroup.metadata as any;
      if (meta?.explanation_vn) return meta.explanation_vn;
      if (typeof currentGroup.explanation === 'string' && currentGroup.explanation.startsWith('{')) {
        return JSON.parse(currentGroup.explanation);
      }
    } catch (e) { }
    return null;
  }, [currentGroup.metadata, currentGroup.explanation]);

  const questions = currentGroup.questions || [];

  // Hẹn giờ
  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    const timer = setInterval(() => setTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isReviewMode, isSubmitted]);

  // Khởi tạo âm thanh
  useEffect(() => {
    if (!waveformRef.current || !currentGroup.audioUrl) return;
    if (wavesurfer.current) wavesurfer.current.destroy();

    const wsRegions = RegionsPlugin.create();
    regionsPlugin.current = wsRegions;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#cbd5e1",
      progressColor: "#2563eb",
      height: 48,
      barWidth: 2,
      cursorWidth: 1,
      normalize: true,
      plugins: [wsRegions]
    });

    ws.load(currentGroup.audioUrl).catch(() => { });
    wavesurfer.current = ws;

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => {
      setIsPlaying(false);
      ws?.seekTo(0);
    });

    // --- REGIONS LOGIC ---
    wsRegions.enableDragSelection({ color: "rgba(37, 99, 235, 0.2)" });

    // Dùng tên riêng (ws*) để tránh xung đột với isDragging của panel resize
    const wsDragging = { current: false };
    const wsHasDragged = { current: false };
    let wsMouseDownX = 0;
    const WS_DRAG_THRESHOLD = 5;

    waveformRef.current?.addEventListener('mousedown', (e: MouseEvent) => {
      wsDragging.current = true;
      wsHasDragged.current = false;
      wsMouseDownX = e.clientX;
      // Seek tới vị trí click ngay để audio không chạy về cuối file trong lúc kéo
      const rect = (waveformRef.current as HTMLElement).getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const dur = ws.getDuration();
      if (dur > 0) ws.seekTo(Math.max(0, Math.min(1, ratio)));
    });

    waveformRef.current?.addEventListener('mousemove', (e: MouseEvent) => {
      if (wsDragging.current && Math.abs(e.clientX - wsMouseDownX) > WS_DRAG_THRESHOLD) {
        wsHasDragged.current = true;
      }
    });

    wsRegions.on('region-created', (region: any) => {
      if (!wsHasDragged.current) {
        // Click đơn: xóa region auto-created, giữ nguyên vùng chọn cũ
        region.remove();
        return;
      }
      // Kéo thực sự: xóa region cũ
      wsRegions.getRegions().forEach((r: any) => { if (r.id !== region.id) r.remove(); });
    });

    const handleWsMouseUp = () => {
      if (!wsDragging.current) return;
      wsDragging.current = false;
      const regions = wsRegions.getRegions();

      if (!wsHasDragged.current) {
        // Click đơn: nếu có region → luôn play từ đầu region (loop)
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
    waveformRef.current?.addEventListener('mouseup', handleWsMouseUp);
    document.addEventListener('mouseup', handleWsMouseUp);

    // Xử lý dừng audio segment (evidence) và Loop trong vùng chọn
    ws.on('timeupdate', (currentTime: number) => {
      if (wsDragging.current) return;

      // 1. Kiểm tra dừng/nhảy segment gợi ý
      if (playingSegmentRef.current) {
        const { segments, currentSegmentIndex } = playingSegmentRef.current;
        const currentSeg = segments[currentSegmentIndex];

        if (currentTime >= currentSeg.end) {
          if (currentSegmentIndex < segments.length - 1) {
            // Còn đoạn tiếp theo: Nhảy đến đoạn kế tiếp
            const nextIndex = currentSegmentIndex + 1;
            const nextSeg = segments[nextIndex];
            playingSegmentRef.current.currentSegmentIndex = nextIndex;
            ws.setTime(nextSeg.start);
            ws.play().catch(() => ws.play());
          } else {
            // Đã hết tất cả các đoạn
            ws.pause();
            playingSegmentRef.current = null;
            setPlayingSegmentLabel(null);
          }
        }
      }

      // 2. Loop trong vùng chọn thủ công
      const regions = wsRegions.getRegions();
      if (regions.length > 0) {
        const r = regions[0];
        if (currentTime >= r.end) ws.play(r.start);
      }
    });

    // Reset state nếu dừng thủ công hoặc kết thúc
    const clearPlayingState = () => {
      playingSegmentRef.current = null;
      setPlayingSegmentLabel(null);
    };
    ws.on('pause', clearPlayingState);
    ws.on('finish', clearPlayingState);

    // Double-click → xóa hết regions
    const handleDblClick = () => { wsRegions.clearRegions(); };
    waveformRef.current?.addEventListener('dblclick', handleDblClick);

    return () => {
      waveformRef.current?.removeEventListener('dblclick', handleDblClick);
      waveformRef.current?.removeEventListener('mouseup', handleWsMouseUp);
      document.removeEventListener('mouseup', handleWsMouseUp);
      ws.destroy();
    };

  }, [currentIndex, currentGroup.audioUrl]);

  const playEvidence = (qIndex: number) => {
    const q = currentGroup.questions[qIndex];
    if (!q || !wavesurfer.current) return;

    // Lấy evidence_sids từ các nguồn có thể có (đảm bảo luôn là mảng)
    let rawSids: any = q.evidence_sids || q.evidenceSids || [];
    let evidenceSids: string[] = [];

    if (Array.isArray(rawSids)) {
      evidenceSids = rawSids;
    } else if (typeof rawSids === 'string') {
      evidenceSids = rawSids.split(/[\s,]+/).filter(Boolean);
    }

    if (evidenceSids.length === 0) {
      try {
        const meta = q.metadata as any;
        const qExpl = typeof q.explanation === 'string' ? JSON.parse(q.explanation) : q.explanation;
        let altSids = meta?.explanation_vn?.evidence_sids || meta?.Json?.evidence_sids || qExpl?.evidence_sids || [];
        if (Array.isArray(altSids)) evidenceSids = altSids;
        else if (typeof altSids === 'string') evidenceSids = altSids.split(/[\s,]+/).filter(Boolean);
      } catch (e) { }
    }

    if (!evidenceSids || evidenceSids.length === 0) {
      console.warn("No evidence_sids found for question", q.questionNo, q);
      return;
    }

    const timestamps = (currentGroup.metadata as any)?.timestamps;
    if (!timestamps || !Array.isArray(timestamps)) {
      console.warn("No timestamps found in group metadata");
      return;
    }

    // --- LOGIC NHÓM CÁC SID LIÊN TIẾP ---
    // 1. Tìm index của từng sid trong mảng timestamps gốc
    const sidIndices = evidenceSids
      .map(sid => timestamps.findIndex((t: any) => t.sid === sid))
      .filter(idx => idx !== -1)
      .sort((a, b) => a - b);

    if (sidIndices.length === 0) return;

    // 2. Nhóm các index liên tiếp thành các khối (blocks)
    const blocks: { start: number, end: number }[] = [];
    let currentBlock: { startIndex: number, endIndex: number } | null = null;

    sidIndices.forEach((idx) => {
      if (!currentBlock) {
        currentBlock = { startIndex: idx, endIndex: idx };
      } else if (idx === currentBlock.endIndex + 1) {
        // Liên tiếp: Mở rộng khối hiện tại
        currentBlock.endIndex = idx;
      } else {
        // Không liên tiếp: Kết thúc khối cũ, bắt đầu khối mới
        blocks.push({
          start: timestamps[currentBlock.startIndex].start,
          end: timestamps[currentBlock.endIndex].end
        });
        currentBlock = { startIndex: idx, endIndex: idx };
      }
    });

    // Thêm khối cuối cùng
    if (currentBlock) {
      const b = currentBlock as { startIndex: number, endIndex: number };
      blocks.push({
        start: timestamps[b.startIndex].start,
        end: timestamps[b.endIndex].end
      });
    }

    if (blocks.length === 0) return;

    const ws = wavesurfer.current;
    regionsPlugin.current?.getRegions().forEach((r: any) => r.remove());

    // Khởi tạo hàng đợi phát
    playingSegmentRef.current = {
      label: `q${qIndex + 1}`,
      segments: blocks,
      currentSegmentIndex: 0
    };

    // Nhảy tới bắt đầu của khối đầu tiên và phát
    ws.setTime(blocks[0].start);

    setTimeout(() => {
      ws.play().catch(() => ws.play());
      setPlayingSegmentLabel(`q${qIndex + 1}`);
    }, 50);
  };

  // Tải trước audio và ảnh của nhóm tiếp theo
  useEffect(() => {
    if (currentIndex < data.length - 1) {
      const nextGroup = data[currentIndex + 1];
      if (nextGroup) {
        if (nextGroup.audioUrl) {
          const audio = new Audio();
          audio.src = nextGroup.audioUrl;
          audio.preload = "auto";
        }
        if (nextGroup.imageUrl) {
          const img = new Image();
          img.src = nextGroup.imageUrl;
        }
      }
    }
  }, [currentIndex, data]);

  // -- Cảnh báo mất dữ liệu (Before Unload & Navigation Guard) --
  useEffect(() => {
    const hasUnsavedData = Object.keys(answers).length > 0 && !isSubmittedInternal && !isReviewMode;

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
  }, [isSubmittedInternal, isReviewMode, answers]);

  // Cuộn lên đầu khi chuyển nhóm câu hỏi
  useEffect(() => {
    if (transcriptScrollRef.current) transcriptScrollRef.current.scrollTop = 0;
    if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;
  }, [currentIndex]);

  // Handle Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !mainContainerRef.current) return;
      const rect = mainContainerRef.current.getBoundingClientRect();
      let percentage = ((e.clientX - rect.left) / rect.width) * 100;
      if (percentage < 20) percentage = 20;
      if (percentage > 80) percentage = 80;
      setVSplitWidth(percentage);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      setIsResizingV(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    setIsResizingV(true);
  };

  // Tự động tính điểm nếu vào chế độ Review hoặc đã nộp
  useEffect(() => {
    if ((isReviewMode || isSubmittedInternal) && data.length > 0) {
      let c = 0; let i = 0; let u = 0; let t = 0;
      data.forEach(group => {
        group.questions.forEach((q: any) => {
          t++;
          const qKey = q.id || `${group.id}_${q.questionNo}`;
          const ans = answers[qKey];
          if (!ans) u++;
          else if (ans === q.correctAnswer) c++;
          else i++;
        });
      });
      setTestScore({ correct: c, total: t, incorrect: i, unanswered: u });
    }
  }, [isReviewMode, isSubmittedInternal, data, answers]);

  // Nhảy tới câu hỏi từ Full Test Sidebar
  useEffect(() => {
    if (jumpTo?.id && data.length > 0) {
      const targetId = jumpTo.id; // This is the questionNo string
      const idx = data.findIndex(g =>
        g.questions?.some((q: any) => String(q.questionNo) === targetId || q.id === targetId)
      );

      if (idx !== -1) {
        setCurrentIndex(idx);

        // Đợi một chút để group mới render xong rồi cuộn
        setTimeout(() => {
          const el = document.getElementById(`question-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            const elFallback = document.querySelector(`[id$="-${targetId}"]`);
            if (elFallback) elFallback.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    }
  }, [jumpTo, data]);

  const handleSelect = (qId: string, option: string) => {
    if (isReviewMode || isSubmittedInternal) return;
    setAnswers(prev => {
      const next = { ...prev, [qId]: option };
      setTotalQuestionsDone(Object.keys(next).length);
      return next;
    });
  };

  const handleRetake = () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hết bài đang làm để làm lại từ đầu?")) return;
    setAnswers({});
    setTime(0);
    setIsSubmittedInternal(false);
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

    // Lưu ngay lập tức vào DB
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

  useEffect(() => {
    if (onActiveQuestionChange && currentGroup?.questions?.[0]?.questionNo) {
      onActiveQuestionChange(currentGroup.questions[0].questionNo);
    }
  }, [currentIndex, currentGroup, onActiveQuestionChange]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Phím số 1-3: Vẫn cho phép làm phím tắt khi đang chép chính tả (Dictation)
      // nhưng sẽ chặn nếu đang gõ trong ô Ghi chú (Flag Note)
      if (['1', '2', '3'].includes(e.key)) {
        if (target.id === 'flag-note-textarea') return;
      } else if (isInput) {
        // Các phím khác (mũi tên, `) thì chặn nếu đang ở trong bất kỳ input nào
        return;
      }

      if (['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        playEvidence(parseInt(e.key) - 1);
        return;
      }

      // CTRL/CMD + SHIFT + S: Toggle Reveal Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setRevealMode(prev => {
          const next = !prev;
          if (next) {
            setRevealPartialMode(false);
          }
          return next;
        });
        return;
      }

      // CTRL/CMD + S: Toggle Reveal Partial Mode (Bản dịch câu hỏi/đáp án + Transcript Anh)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setRevealPartialMode(prev => {
          const next = !prev;
          if (next) {
            setRevealMode(false);
          }
          return next;
        });
        return;
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
      } else if (e.key === ';') {
        e.preventDefault();
        if (!wavesurfer.current) return;
        const ws = wavesurfer.current;
        ws.setTime(Math.max(0, ws.getCurrentTime() - 5));
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, data.length, isFullTest, onPrevPart, onNextPart]);

  const totalQuestions = data.reduce((acc, g) => acc + (g.questions?.length || 0), 0);

  const handleFinishTest = async () => {
    if (totalQuestionsDone < totalQuestions) {
      if (!window.confirm(`Bạn còn ${totalQuestions - totalQuestionsDone} câu chưa trả lời. Nộp bài ngay?`)) return;
    } else {
      if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return;
    }

    let correctCount = 0; let unansweredCount = 0; let totalCount = 0;
    const payload = data.flatMap(group =>
      group.questions.map((q: any) => {
        totalCount++;
        const qKey = q.id || `${group.id}_${q.questionNo}`;
        const ans = answers[qKey] || "";
        const isCorrect = ans === q.correctAnswer;
        if (!ans) {
          unansweredCount++;
          return null;
        }
        if (isCorrect) correctCount++;

        return {
          questionId: q.id || qKey,
          lessonId,
          courseId,
          userAnswer: ans,
          isCorrect,
          isFlagged: !!flags[qKey],
          flagColor: flags[qKey] || null
        };
      })
    ).filter(item => item !== null) as any[];

    setTestScore({
      correct: correctCount,
      total: totalCount,
      incorrect: totalCount - correctCount - unansweredCount,
      unanswered: unansweredCount
    });

    if (lessonId) {
      setIsSubmitting(true);
      try {
        await fetch('/api/progress/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'batch', attempts: payload })
        });
        await fetch('/api/progress/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, isCompleted: true })
        });
      } catch (e) {
        console.error("Lỗi nộp bài:", e);
      }
      setIsSubmitting(false);
    }

    setIsSubmittedInternal(true);
    setRevealMode(true);
    setShowCompletion(true);
    if (onFinish) onFinish(answers);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.3 } });
  };

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
    <div className="absolute inset-0 flex flex-col font-sans bg-[#f8fafc] text-slate-800 overflow-hidden pr-20 select-text">
      <style dangerouslySetInnerHTML={{
        __html: `
        .p34-sentence-hover {
          transition: filter 0.15s ease, outline 0.15s ease !important;
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .p34-sentence-hover:hover {
          filter: brightness(0.95) !important;
          outline: 1px solid rgba(0,0,0,0.1) !important;
          outline-offset: 1px !important;
          z-index: 10 !important;
        }
      ` }} />

      {/* 1. HEADER ÂM THANH CỐ ĐỊNH - KHUNG RIÊNG BIỆT PHÍA TRÊN */}
      <div className="flex-none z-[250] bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto w-full p-3 px-6 flex items-center gap-6">
          {/* Play/Pause Button */}
          <div className="relative group shrink-0">
            <button
              id="play-audio-btn"
              onClick={() => wavesurfer.current?.playPause()}
              className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 ring-4 ring-indigo-50"
            >
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
            </button>

            {/* Tooltip on Hover */}
            <div className="absolute left-0 top-full mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] -translate-y-2 group-hover:translate-y-0">
              {isPlaying ? 'DỪNG' : 'PHÁT'} (PHÍM ` DƯỚI ESC)
              <div className="absolute -top-1 left-5 w-2 h-2 bg-slate-900 rotate-45"></div>
            </div>
          </div>
          <div className="flex-1 h-14 relative bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner px-6">
            <div id="waveform-audio-container" ref={waveformRef} className="absolute inset-x-6 inset-y-0 cursor-pointer" />
          </div>
          <div className="flex items-center gap-2 border-l border-r border-slate-100 px-6 h-12 flex-shrink-0">
            {[0.5, 0.75, 1, 1.2].map(speed => (
              <button
                key={speed}
                onClick={() => { setPlaybackRate(speed); wavesurfer.current?.setPlaybackRate(speed); }}
                className={`w-10 h-8 rounded-lg text-[10px] font-black transition-all ${playbackRate === speed ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                {speed}x
              </button>
            ))}
          </div>

        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col px-4 relative overflow-hidden">


        {/* 3. THÂN TRÌNH PHÁT: HAI CỘT CUỘN ĐỘC LẬP */}
        <div ref={mainContainerRef} className="flex-1 flex overflow-hidden pb-4 relative gap-4 mt-4">

          {/* CỘT TRÁI: HÌNH CỐ ĐỊNH + TRANSCRIPT CUỘN */}
          <div
            id="left-split-col"
            ref={containerRef}
            className="flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative flex-none"
            style={{ width: `${vSplitWidth}%`, flexShrink: 0 }}
          >
            {/* Picture (if any) */}
            {(currentGroup.image || currentGroup.imageUrl) && (
              <div className="flex-none p-2 max-h-[300px]">
                <div className="h-full min-h-[150px] bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                  <img
                    src={currentGroup.image || currentGroup.imageUrl}
                    alt="Part 3/4"
                    className="max-w-full max-h-full object-contain p-1"
                  />
                </div>
              </div>
            )}

            <div
              ref={transcriptScrollRef}
              className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300"
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 py-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Transcript & Translation</span>
                {/* Eye icon: hiện/ẩn đáp án & transcript */}
                <button
                  id="reveal-btn"
                  onClick={() => setRevealMode(!revealMode)}
                  className={`w-7 h-7 ml-1 flex items-center justify-center rounded-lg border-2 transition-all ${revealMode ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                  title={`${revealMode ? 'Ẩn lời giải' : 'Hiện lời giải'} (Phím tắt: ctrl/cmd + shift + s)`}
                >
                  <span className="text-xs leading-none">👁️</span>
                </button>
              </div>

              {parsedTranscript ? (
                (revealMode || revealPartialMode) ? (
                  <div className="space-y-2 px-2 pb-20">
                    {(() => {
                      // Group sentences by turn (consecutive sentences with same speaker or continuation)
                      const turns: any[] = [];
                      let currentTurn: any = null;

                      parsedTranscript.forEach((item: any) => {
                        const mj = (currentGroup.metadata as any)?.Json;
                        const pj = typeof mj === 'string' ? JSON.parse(mj) : mj;
                        const evidenceFor = pj?.questions?.find((q: any) => q.evidence_sids?.includes(item.id));
                        const qNo = evidenceFor ? evidenceFor.question_no || (pj.questions.indexOf(evidenceFor) + (questions[0]?.questionNo || 1)) : null;

                        const sentenceData = { ...item, qNo };

                        if (!currentTurn || (item.speaker && item.speaker !== currentTurn.speaker)) {
                          currentTurn = {
                            speaker: item.speaker,
                            sentences: [sentenceData]
                          };
                          turns.push(currentTurn);
                        } else {
                          currentTurn.sentences.push(sentenceData);
                        }
                      });

                      return turns.map((turn, tIdx) => (
                        <div key={tIdx} className="p-2.5 rounded-xl bg-slate-50/30 border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all duration-300 group flex items-start gap-3">
                          {turn.speaker && (
                            <div className="flex items-center gap-1.5 shrink-0 pt-1.5 w-[75px]">
                              <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
                              <span className="text-[12px] font-black text-indigo-900/70 tracking-tight whitespace-nowrap">
                                {turn.speaker.split('-').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('-')}
                              </span>
                            </div>
                          )}
                          <div className="leading-relaxed flex-1 pt-0.5 text-[15px]">
                            {turn.sentences.map((s: any, sIdx: number) => {
                              const qStyles = s.qNo ? getQuestionStyles(s.qNo) : null;
                              return (
                                <span key={sIdx}>
                                  <span
                                    onMouseEnter={() => {
                                      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                      if (revealMode && !revealPartialMode && s.viText) {
                                        setHoveredTranslation({ text: s.viText, sid: s.sid });
                                      }
                                    }}
                                    onMouseLeave={() => {
                                      if (isAdminMode) {
                                        hoverTimeoutRef.current = setTimeout(() => setHoveredTranslation(null), 300);
                                      } else {
                                        setHoveredTranslation(null);
                                      }
                                    }}
                                    className={`group/sentence relative transition-all duration-200 rounded-md select-text ${qStyles ? `${qStyles.bg} ${qStyles.text} px-1 mx-0.5 p34-sentence-hover font-semibold` : "text-slate-700 px-0.5 p34-sentence-hover"
                                      }`}
                                  >
                                    <FormattedText text={s.english} revealed={true} questions={questions} qNo={s.qNo} sharedKeywordsMap={sharedKeywordsMap} />
                                    {s.qNo && (
                                      <span className={`inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full text-[9px] font-black text-white -translate-y-1 ${s.qNo % 3 === 1 ? "bg-indigo-500" : s.qNo % 3 === 2 ? "bg-emerald-500" : "bg-orange-500"
                                        }`}>
                                        {s.qNo}
                                      </span>
                                    )}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center py-20">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <BookOpenIcon className="w-10 h-10 text-indigo-300" />
                    </div>
                    <h4 className="text-slate-900 font-bold text-[16px] mb-2 text-balance">Luyện nghe tập trung</h4>
                    <p className="text-slate-500 text-[13.5px] max-w-[280px] leading-relaxed mx-auto">
                      Hãy nghe kỹ và làm bài trước khi xem lời thoại. Bấm Icon con mắt hoặc <span className="font-bold text-indigo-600">"Hiện đáp án"</span> (phím tắt: <strong className="font-bold text-slate-800">ctrl/cmd+shift+s</strong>) để mở khóa Transcript & Bản dịch.
                    </p>
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                    <InformationCircleIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <h4 className="text-slate-900 font-bold text-[15px] mb-2">Không tìm thấy Lời thoại</h4>
                  <p className="text-slate-400 text-[13px] max-w-[200px] leading-relaxed">
                    Nội dung transcript cho nhóm câu hỏi này đang được cập nhật.
                  </p>
                </div>
              )}
            </div>

            {/* GLOBAL TRANSLATION PORTAL (FLOATING OVERLAY - NO JUMPING) */}
            {revealMode && hoveredTranslation && (
              <div
                className={`fixed z-[9999] transition-opacity duration-200 ${isAdminMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                }}
                onMouseLeave={() => {
                  if (isAdminMode) {
                    hoverTimeoutRef.current = setTimeout(() => setHoveredTranslation(null), 200);
                  }
                }}
                style={{
                  left: `${Math.min(mousePos.x + 20, typeof window !== 'undefined' ? window.innerWidth - 380 : mousePos.x)}px`,
                  top: `${Math.min(mousePos.y + 20, typeof window !== 'undefined' ? window.innerHeight - 150 : mousePos.y)}px`,
                  maxWidth: '400px'
                }}
              >
                <div className="relative group">
                  {isAdminMode && (
                    <div className="absolute -top-3 left-2 bg-indigo-600 text-[8px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter z-10 shadow-lg">
                      Sửa bản dịch ({hoveredTranslation.sid})
                    </div>
                  )}
                  <span
                    className={`text-white px-4 py-2 rounded-lg shadow-xl border border-white/10 animate-in fade-in zoom-in-95 duration-200 text-[14px] leading-relaxed font-bold inline ${isAdminMode ? 'cursor-edit' : ''}`}
                    style={{
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                      backgroundColor: "rgba(0, 0, 0, 0.8)"
                    }}
                  >
                    <AdminInlineEditor
                      target="group"
                      id={currentGroup.id}
                      field="translation_map"
                      sid={hoveredTranslation.sid}
                      value={hoveredTranslation.text}
                      multiline
                    >
                      {hoveredTranslation.text}
                    </AdminInlineEditor>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* VERTICAL DIVIDER */}
          <div
            className="group relative w-2 hover:w-4 flex items-center justify-center transition-all z-30"
          >
            {/* The Line */}
            <div className={`w-[2px] h-full transition-colors ${isResizingV ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-indigo-400'}`}></div>

            {/* The Handle - Circular */}
            <div
              onMouseDown={handleMouseDown}
              className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 shadow-xl flex items-center justify-center transition-all cursor-col-resize ${isResizingV ? 'border-indigo-500 scale-110 shadow-indigo-200' : 'border-slate-200 group-hover:border-indigo-400 group-hover:scale-105'}`}
            >
              <ChevronsLeftRight className={`w-5 h-5 ${isResizingV ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative pl-4">
            <div
              ref={questionsScrollRef}
              className="flex-1 overflow-y-auto pr-3 pl-4 scrollbar-thin scrollbar-thumb-slate-300"
            >
              <div className="space-y-4 pt-2 pb-24 w-full">
                {questions.map((q: any) => {
                  const qKey = q.id || `${currentGroup.id}_${q.questionNo}`;
                  const isSelectedAny = !!answers[qKey];

                  const qRichData = (() => {
                    const meta = q.metadata as any;
                    let rd: any = null;
                    try {
                      if (meta?.explanation_vn) {
                        const ev = meta.explanation_vn;
                        rd = {
                          question: { vi: ev.vi },
                          options: ev.options_vn ? Object.entries(ev.options_vn).map(([label, vi]) => ({ label, vi })) : [],
                          explanation: {
                            correct: { why: ev.why_correct },
                            incorrect: ev.why_wrong ? Object.entries(ev.why_wrong).map(([label, why]) => ({ label, why })) : []
                          },
                          why_correct: ev.why_correct,
                          why_wrong: ev.why_wrong,
                          vocabulary: ev.vocabulary
                        };
                      } else if (meta?.Json) {
                        rd = typeof meta.Json === 'string' ? JSON.parse(meta.Json) : meta.Json;
                      } else if (q.explanation && typeof q.explanation === 'string' && q.explanation.startsWith('{')) {
                        rd = JSON.parse(q.explanation);
                      }
                    } catch (e) { }
                    return rd;
                  })();

                  const qVi = qRichData?.question?.vi || qRichData?.vi;

                  return (
                    <div key={qKey} id={`question-${q.questionNo}`} className="group/qrow w-full mb-4">
                      <div className={`p-4 rounded-[24px] border transition-all duration-300 ${isSelectedAny ? 'border-indigo-200 bg-indigo-50/20 shadow-lg shadow-indigo-500/5' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]'}`}>
                        <div className="flex items-start gap-4">
                          {/* Left Column: Number + Speaker + Flag */}
                          <div className="flex flex-col items-center gap-4 shrink-0 pt-0.5">
                            {(() => {
                              const styles = getQuestionStyles(q.questionNo);
                              return (
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[12px] shadow-sm transition-all duration-300 ${styles.sup} border border-current/10`}>
                                  {q.questionNo}
                                </div>
                              );
                            })()}

                            {(() => {
                              const qIdx = questions.indexOf(q);
                              const qLabel = `q${qIdx + 1}`;
                              return (
                                <button
                                  onClick={() => playEvidence(qIdx)}
                                  className={`play-evidence-btn w-8 h-8 flex items-center justify-center rounded-xl border transition-all duration-300 ${playingSegmentLabel === qLabel ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border-slate-100 text-slate-400 hover:border-indigo-300 hover:text-indigo-600'}`}
                                  title={`Audio gợi ý (Phím tắt: phím số ${qIdx + 1})`}
                                >
                                  <Volume2 size={13} />
                                </button>
                              );
                            })()}

                            <FlagSelector
                              isFlagged={!!flags[q.id || `${currentGroup.id}_${q.questionNo}`]}
                              flagColor={flags[q.id || `${currentGroup.id}_${q.questionNo}`] || 'RED'}
                              flagNote={flagNotes[q.id || `${currentGroup.id}_${q.questionNo}`]}
                              onToggle={(color, note) => handleUpdateFlag(qKey, color, note)}
                              onUnflag={(deleteNote) => handleUpdateFlag(qKey, null, undefined, deleteNote)}
                              compact={true}
                              layout="vertical"
                            />
                          </div>

                          {/* Right Column: Question + Answers */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-3 pt-0">
                              <h4 className="font-bold text-slate-900 text-[17px] leading-tight">
                                <AdminInlineEditor
                                  target="question"
                                  id={q.id}
                                  field="questionText"
                                  value={q.questionText}
                                >
                                  <FormattedText text={q.questionText} revealed={true} questions={questions} qNo={null} sharedKeywordsMap={sharedKeywordsMap} />
                                </AdminInlineEditor>
                              </h4>

                              {/* Dịch câu hỏi (Vi) */}
                              {(revealMode || revealPartialMode) && qVi && (
                                <div className="text-[15px] text-slate-500 italic mt-2 font-medium leading-relaxed">
                                  <AdminInlineEditor
                                    target="question"
                                    id={q.id}
                                    field="metadata.explanation_vn.vi"
                                    value={qVi}
                                    multiline
                                  >
                                    <FormattedText text={qVi} revealed={true} questions={questions} qNo={q.questionNo} />
                                  </AdminInlineEditor>
                                </div>
                              )}
                            </div>

                            {/* Answers */}
                            <div className="space-y-1.5">
                              {['A', 'B', 'C', 'D'].map(opt => {
                                const qKey = q.id || `${currentGroup.id}_${q.questionNo}`;
                                const isSelected = answers[qKey] === opt;
                                const isCorrect = q.correctAnswer === opt;

                                const styles = getQuestionStyles(q.questionNo);
                                let btnClass = "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50 text-slate-700 shadow-sm";
                                if (revealMode) {
                                  if (isCorrect) {
                                    btnClass = "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-500/10";
                                  }
                                  else if (isSelected) btnClass = "border-red-500 bg-red-50 text-red-900 shadow-md shadow-red-500/10";
                                  else btnClass = "border-slate-300 bg-white shadow-sm";
                                } else if (isSelected) {
                                  btnClass = "border-blue-500 bg-blue-50/50 text-blue-900 shadow-md shadow-blue-500/5";
                                }

                                let optionVi = "";
                                if (revealMode || revealPartialMode) {
                                  try {
                                    const meta = q.metadata as any;
                                    if (meta?.explanation_vn?.options_vn?.[opt]) {
                                      optionVi = meta.explanation_vn.options_vn[opt];
                                    } else {
                                      const expl = typeof q.explanation === 'string' ? JSON.parse(q.explanation) : q.explanation;
                                      optionVi = (expl.options_vn && expl.options_vn[opt]) || expl[`option${opt}Vi`] || (expl.options && expl.options.find((o: any) => o.label === opt)?.vi) || "";
                                    }
                                  } catch (e) { }
                                }
                                const engOption = (q as any)[`option${opt}`] || "";

                                return (
                                  <div key={opt} className="space-y-0.5">
                                    <div
                                      className={`w-full py-0.5 px-2 rounded-xl border text-left text-[16px] font-semibold transition-all duration-300 relative overflow-hidden flex items-center gap-2 cursor-default select-text ${btnClass} ${!revealMode && !isSelected ? 'hover:bg-slate-50' : ''}`}
                                      role="presentation"
                                    >
                                      <div
                                        onClick={() => {
                                          const qKey = q.id || `${currentGroup.id}_${q.questionNo}`;
                                          !revealMode && handleSelect(qKey, opt);
                                        }}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-black border transition-all duration-300 cursor-pointer group/opt ${revealMode
                                          ? (isCorrect ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' : isSelected ? 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-500/20' : 'bg-slate-50 text-slate-400 border-slate-200')
                                          : isSelected ? 'bg-blue-600 text-white border-blue-700 scale-105 shadow-sm shadow-blue-200' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-500 hover:scale-110'
                                          }`}
                                      >
                                        {opt}
                                      </div>
                                      <div className="flex flex-col flex-1 pl-1">
                                        <div className={revealMode && isCorrect ? 'text-emerald-900 font-bold' : isSelected && !revealMode ? 'text-blue-900 font-bold' : 'text-slate-900 font-bold'}>
                                          <AdminInlineEditor
                                            target="question"
                                            id={q.id}
                                            field={`option${opt}`}
                                            value={engOption}
                                          >
                                            <FormattedText text={engOption} revealed={true} questions={questions} qNo={isCorrect && revealMode ? q.questionNo : null} sharedKeywordsMap={sharedKeywordsMap} />
                                          </AdminInlineEditor>
                                        </div>
                                        {optionVi && optionVi.trim() !== engOption.trim() && (
                                          <div className={`text-[14px] italic mt-0.5 font-medium ${isCorrect && revealMode ? 'text-emerald-700/80' : 'text-slate-500'}`}>
                                            <AdminInlineEditor
                                              target="question"
                                              id={q.id}
                                              field={`metadata.explanation_vn.options_vn.${opt}`}
                                              value={optionVi}
                                            >
                                              <FormattedText text={optionVi} revealed={true} questions={questions} qNo={isCorrect && revealMode ? q.questionNo : null} sharedKeywordsMap={sharedKeywordsMap} />
                                            </AdminInlineEditor>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {revealMode && (
                                      <div className="ml-12 pl-4 pr-2 py-0.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                        {(() => {
                                          let qExpl: any = {};
                                          try {
                                            qExpl = typeof q.explanation === 'string' ? JSON.parse(q.explanation) : q.explanation;
                                          } catch (e) { }

                                          const whyCorrect = qRichData?.why_correct || qExpl?.why_correct || qExpl?.whyCorrect || "Đáp án chính xác.";
                                          const whyWrong = qRichData?.why_wrong?.[opt] || qExpl?.why_wrong?.[opt] || qExpl?.whyWrong?.[opt] || qRichData?.explanation?.incorrect?.find((i: any) => i.label === opt)?.why || "Lựa chọn này chưa chính xác.";

                                          return isCorrect ? (
                                            <div className="flex items-start gap-1.5 text-[12px] leading-relaxed text-emerald-700 bg-emerald-500/5 p-2 rounded-lg border-l-2 border-emerald-500/30">
                                              <CheckCircleIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                              <span>
                                                <strong className="font-bold">Giải thích:</strong>{" "}
                                                <AdminInlineEditor
                                                  target="question"
                                                  id={q.id}
                                                  field="metadata.explanation_vn.why_correct"
                                                  value={whyCorrect}
                                                  multiline
                                                >
                                                  <FormattedText text={whyCorrect} revealed={true} questions={questions} qNo={q.questionNo} sharedKeywordsMap={sharedKeywordsMap} isExplanation={true} />
                                                </AdminInlineEditor>
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex items-start gap-1.5 text-[12px] leading-relaxed text-red-700 bg-red-500/5 p-2 rounded-lg border-l-2 border-red-500/30">
                                              <XCircleIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                              <span>
                                                <strong className="font-bold">Bẫy/Sai:</strong>{" "}
                                                <AdminInlineEditor
                                                  target="question"
                                                  id={q.id}
                                                  field={`metadata.explanation_vn.why_wrong.${opt}`}
                                                  value={whyWrong}
                                                  multiline
                                                >
                                                  <FormattedText text={whyWrong} revealed={true} questions={questions} qNo={q.questionNo} isExplanation={true} />
                                                </AdminInlineEditor>
                                              </span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Hiển thị Giải thích chi tiết & Từ vựng (Mới) */}
                            {revealMode && qRichData && (
                              <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                {/* 1. Từ vựng quan trọng */}
                                {qRichData?.vocabulary && Array.isArray(qRichData.vocabulary) && qRichData.vocabulary.length > 0 && (
                                  <div className="bg-amber-50/30 rounded-2xl p-5 border border-amber-100/50">
                                    <div className="flex items-center gap-2 text-amber-700 font-bold text-[13px] mb-4 uppercase tracking-wider">
                                      <BookOpenIcon className="w-4 h-4" />
                                      <span>Từ vựng quan trọng</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                      {qRichData.vocabulary.map((v: any, vIdx: number) => (
                                        <div key={vIdx} className="flex flex-wrap items-baseline gap-2 group/vocab">
                                          <span className="font-bold text-slate-900 text-[15px] group-hover/vocab:text-amber-700 transition-colors">{v.word}</span>
                                          {v.ipa && <span className="text-[13px] text-slate-400 font-serif">{v.ipa}</span>}
                                          <span className="text-slate-400 text-xs"> : </span>
                                          <span className="text-[14px] text-slate-600 font-medium">{v.meaning}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    {data.flatMap((g, gIdx) => g.questions?.map((q: any) => {
                      const qKey = q.id || `${g.id}_${q.questionNo}`;
                      const isCurrGroup = gIdx === currentIndex;
                      const isActiveQ = qKey === activeQuestionId;
                      const isDone = !!answers[qKey];
                      const isCorrect = isDone && answers[qKey] === q.correctAnswer;
                      const showResult = isReviewMode || isSubmittedInternal;
                      const isFlagged = !!flags[qKey];

                      let btnClass = "";
                      if (showResult) {
                        if (!isDone) btnClass = "bg-slate-800 text-slate-500 border border-slate-700";
                        else if (isCorrect) btnClass = "bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400";
                        else btnClass = "bg-red-500 text-white shadow-sm ring-1 ring-red-400";
                      } else {
                        btnClass = isDone
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentIndex(gIdx);
                            setActiveQuestionId(q.id);
                            if (transcriptScrollRef.current) transcriptScrollRef.current.scrollTop = 0;
                            if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;
                            const el = document.getElementById("question-" + q.questionNo);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className={`h-10 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center relative 
                              ${isActiveQ ? 'ring-2 ring-white z-20 scale-110 shadow-lg' : isCurrGroup ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 z-10 scale-105' : ''} 
                              ${btnClass}`}
                        >
                          {q.questionNo}
                          {isFlagged && (
                            <div className="absolute top-1 right-1 group/flag">
                              <Flag
                                size={10}
                                className={`shadow-sm fill-current ${flags[qKey] === 'PURPLE' ? 'text-purple-500' :
                                  flags[qKey] === 'BLUE' ? 'text-blue-500' :
                                    flags[qKey] === 'YELLOW' ? 'text-yellow-500' :
                                      'text-red-500'
                                  }`}
                              />
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
                    }))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 py-4 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-[10px] font-black text-blue-500">{Math.round((totalQuestionsDone / totalQuestions) * 100)}%</div>
                      <div className="w-1 h-12 bg-slate-200 rounded-full overflow-hidden flex flex-col justify-end">
                        <div className="bg-blue-500 w-full transition-all duration-500" style={{ height: `${(totalQuestionsDone / totalQuestions) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {data.slice(0, 10).map((g, idx) => {
                        const isDone = g.questions?.every((q: any) => answers[q.id]);
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
                  !isReviewMode && !isSubmittedInternal ? (
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
      </div>
      {/* BOTTOM NAVIGATION BAR */}
      {(() => {
        const navContent = (
          <div id="toeic-navigation-container" className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/50 shadow-sm pointer-events-auto">
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
                className="px-6 py-2 rounded-lg font-bold text-[13px] transition-all disabled:opacity-30 hover:bg-white text-slate-600 uppercase tracking-wider"
              >
                {currentIndex === 0 && onPrevPart ? 'Lùi về part trước' : 'Lùi'}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] translate-y-2 group-hover:translate-y-0">
                Phím tắt: Mũi tên trái
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
              </div>
            </div>

            <div className="px-6 font-mono font-bold text-slate-600 text-sm border-x border-slate-200/50">
              {isFullTest ? (
                <>
                  {currentGroup?.questions?.[0]?.questionNo || (globalOffset + currentIndex + 1)} <span className="mx-1 text-slate-300">/</span> {globalTotal || 200}
                </>
              ) : (
                <>
                  {currentIndex + 1} / {data.length}
                </>
              )}
            </div>

            {currentIndex === data.length - 1 ? (
              isFullTest ? (
                <div className="relative group">
                  <button
                    onClick={onNextPart}
                    className="px-10 py-2.5 rounded-2xl font-bold text-[13px] transition-all bg-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-700 active:scale-95 ml-1 uppercase tracking-wider flex items-center gap-2"
                  >
                    Tiếp sang Part {targetPart === 3 ? '4' : '5'} <ChevronRightIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] translate-y-2 group-hover:translate-y-0">
                    Phím tắt: Mũi tên phải
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>
              ) : !isSubmittedInternal && (
                <button
                  onClick={handleFinishTest}
                  disabled={isSubmitting}
                  className="px-10 py-2.5 rounded-2xl font-bold text-[13px] transition-all bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:bg-indigo-700 active:scale-95 ml-1 uppercase tracking-wider"
                >
                  {isSubmitting ? '...' : 'Nộp bài'}
                </button>
              )
            ) : (
              <div className="relative group">
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(data.length - 1, prev + 1))}
                  className="px-8 py-2 rounded-lg font-bold text-[13px] transition-all bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95 ml-1 uppercase tracking-wider"
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

        if (isFullTest && mounted && document.getElementById("bottom-nav-portal-target")) {
          return createPortal(
            <div className="relative flex-none h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[70] flex items-center justify-center pointer-events-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
              <div className="absolute left-4 flex gap-2 pointer-events-auto z-[80]">
                <button
                  onClick={() => startToeicPartTour(targetPart, true)}
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
          <div className="relative flex-none h-16 bg-white border-t border-slate-200 z-[70] flex items-center justify-center">
            <div className="absolute left-4 flex gap-2 pointer-events-auto z-[80]">
              <button
                onClick={() => startToeicPartTour(targetPart, true)}
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
