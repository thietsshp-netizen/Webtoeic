"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { FlagIcon, TrophyIcon, ChevronRightIcon, ClockIcon } from "@heroicons/react/24/solid";
import { GripHorizontal, ChevronsLeftRight, LayoutDashboard, Send, Edit2, Check, X, Flag, PenLine, HelpCircle } from "lucide-react";
import { AdminInlineEditor } from "@/components/Admin/AdminInlineEditor";
import { useAdminEdit } from "@/components/Admin/AdminEditProvider";
import confetti from 'canvas-confetti';
import Link from 'next/link';
import FlagSelector, { FlagColor } from '../../Player/FlagSelector';
import { startToeicPartTour } from '../toeicTour';
import FloatingVideoExplanationPlayer from '../../Player/FloatingVideoExplanationPlayer';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getHighlightClass = (colorStr: string) => {
  const map: Record<string, string> = {
    yellow: "text-indigo-700 bg-indigo-50 border-indigo-200",
    cyan: "text-blue-700 bg-blue-50 border-blue-200",
    green: "text-emerald-700 bg-emerald-50 border-emerald-200",
    magenta: "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200",
    default: "text-slate-700 bg-slate-100 border-slate-200"
  };
  return map[colorStr] || map.default;
};

// Component để format nội dung giải thích, biến (s1), s1 thành link click được
const FormattedExplanation = React.memo(({ text, onSidClick }: { text: string, onSidClick: (sid: string) => void }) => {
  if (!text) return null;
  // Regex để tìm: (s1), (abc), "abc", 'abc', **abc**
  const regex = /(s\d+)|(\(.*?\))|(".*?")|('.*?')|(\*\*.*?\*\*)/g;
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // 1. Xử lý mã câu s1, s2...
        if (/^s\d+$/.test(part)) {
          const sid = part;
          return (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onSidClick(sid);
              }}
              className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[11px] cursor-pointer hover:bg-indigo-200 transition-colors mx-0.5"
            >
              {part}
            </span>
          );
        }

        // 2. Xử lý in đậm các phần trích dẫn (Dùng màu Indigo/Purple giống Part 7)
        const isBracket = /^\(.*\)$/.test(part);
        const isDoubleQuote = /^".*"$/.test(part);
        const isSingleQuote = /^'.*'$/.test(part);
        const isMarkdownBold = /^\*\*.*\*\*$/.test(part);

        if (isBracket || isDoubleQuote || isSingleQuote || isMarkdownBold) {
          let cleanText = part;
          if (isMarkdownBold) cleanText = part.replace(/\*\*/g, '');
          return <span key={i} className="font-black text-indigo-600 underline-offset-4 decoration-indigo-200/50">{cleanText}</span>;
        }

        // 3. Văn bản bình thường
        return <span key={i}>{part}</span>;
      })}
    </>
  );
});

// Formatter cho từng câu trong đoạn văn (English + Vietnamese hover)
const SentenceItem = React.memo(({
  sentence,
  revealMode,
  questions,
  activeSid,
  onHover
}: {
  sentence: any,
  revealMode: boolean,
  questions: any[],
  activeSid?: string | null,
  onHover?: (text: string | null) => void
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const text = sentence.text || "";
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  const isEmailHeaderLike = ['To:', 'From:', 'Subject:', 'Date:', 'Attachment:', 'Cc:', 'Bcc:'].some(h => cleanText.startsWith(h) || cleanText.startsWith(h + ' '));
  const isHeaderLike = sentence.type === 'header' || sentence.type === 'signature' || sentence.type === 'signoff' || isEmailHeaderLike;

  const parsePart6Text = (rawText: string) => {
    if (!rawText) return null;
    const regex = /(?:<sup>(\d+)<\/sup>(?:\s*\*\*(.*?)\*\*)?)|(?:\*\*(\d+)\s+(.*?)\*\*)|(?:(\d+)\s*\*\*(.*?)\*\*)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: rawText.substring(lastIndex, match.index) });
      }
      let qId, blankWord;
      if (match[1]) { qId = parseInt(match[1]); blankWord = match[2] || ""; }
      else if (match[3]) { qId = parseInt(match[3]); blankWord = match[4] || ""; }
      else { qId = parseInt(match[5]); blankWord = match[6] || ""; }

      const qData = questions.find((q: any) => q.questionNo === qId);
      const fallbackWord = qData ? qData[`option${qData.correctAnswer}`] : "";
      const styleClass = getHighlightClass(qData?.metadata?.highlight_color || "default");

      parts.push({ type: 'blank', qId, content: blankWord || fallbackWord, styleClass });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < rawText.length) {
      parts.push({ type: 'text', content: rawText.substring(lastIndex) });
    }

    return parts.map((p, i) => {
      if (p.type === 'text') {
        const formattedContent = p.content.replace(/\n/g, '<br />');
        return <span key={i} dangerouslySetInnerHTML={{ __html: formattedContent }} />;
      }
      if (p.type === 'blank') {
        if (!revealMode) {
          return (
            <span key={i} className="inline items-center font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200 mx-1 text-xs shadow-sm">
              --- {p.qId} ---
            </span>
          );
        } else {
          const [textColor, bgColor, borderColor] = (p.styleClass || "").split(' ');
          return (
            <span key={i} className={`${bgColor} ${borderColor} border-b font-bold px-1 py-0 rounded-sm mx-0.5 inline items-baseline gap-0.5`}>
              <sup className={`text-[9px] ${textColor} opacity-70 inline-block align-top mt-1`}>{p.qId}</sup>
              <span className={`${textColor} inline`} dangerouslySetInnerHTML={{ __html: (p.content || "").trim() }} />
            </span>
          );
        }
      }
      return null;
    });
  };

  return (
    <span
      id={sentence.sid}
      onMouseDown={(e) => e.stopPropagation()}
      className={`group relative transition-all duration-200 px-0.5 rounded-sm inline select-text
        ${revealMode ? 'cursor-pointer hover:outline hover:outline-2 hover:outline-slate-300/50 hover:outline-offset-1' : ''}
        ${revealMode && activeSid === sentence.sid ? 'bg-amber-100 ring-2 ring-amber-400 ring-offset-0 z-10 shadow-md' : ''}`}
      onMouseEnter={() => {
        if (revealMode && sentence.viText) {
          window.dispatchEvent(new CustomEvent('toeic-part6-translation', {
            detail: { text: sentence.viText, sid: sentence.sid }
          }));
        }
      }}
      onMouseLeave={() => {
        window.dispatchEvent(new CustomEvent('toeic-part6-translation', {
          detail: { text: null, sid: null }
        }));
      }}
    >
      <span className="transition-all inline gap-1">
        {revealMode && activeSid === sentence.sid && (
          <span className="shrink-0 bg-amber-500 text-white text-[9px] px-1 py-0.5 rounded font-black mr-1 animate-bounce inline-flex items-center align-middle">
            {sentence.sid}
          </span>
        )}
        <span className={`inline whitespace-pre-line ${sentence.type === 'header' || sentence.type === 'signature' || sentence.type === 'signoff' ? 'leading-normal block' : 'leading-loose'}`}>
          {parsePart6Text(text)}
        </span>
      </span>
    </span>
  );
}, (prev, next) => {
  return (
    prev.sentence === next.sentence &&
    prev.revealMode === next.revealMode &&
    prev.activeSid === next.activeSid &&
    prev.questions === next.questions
  );
});

interface ProgressType {
  isCorrect: boolean;
  userAnswer: string;
  isFlagged: boolean;
  flagColor?: 'RED' | 'PURPLE' | 'BLUE' | 'YELLOW' | null;
  flagNote?: string | null;
}

const TranslationPortal = ({ groupId, isAdminMode }: { groupId: string; isAdminMode: boolean }) => {
  const [data, setData] = useState<{ text: string | null; sid: string | null }>({ text: null, sid: null });

  useEffect(() => {
    const handler = (e: any) => {
      setData(e.detail);
    };
    window.addEventListener('toeic-part6-translation', handler);
    return () => window.removeEventListener('toeic-part6-translation', handler);
  }, []);

  if (!data.text) return null;

  return (
    <div
      id="global-translation-portal"
      className={`fixed z-[9999] transition-opacity duration-200 ${isAdminMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{
        left: `-999px`,
        top: `-999px`,
        maxWidth: '350px'
      }}
      onMouseLeave={() => {
        if (!isAdminMode) setData({ text: null, sid: null });
      }}
    >
      <div className="bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <div className="shrink-0 bg-blue-600 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest mt-0.5 shadow-lg shadow-blue-500/20">Dịch</div>
          <div className="text-[14px] leading-relaxed font-medium text-slate-100">
            <AdminInlineEditor
              target="group"
              id={groupId}
              field={`translation_map.${data.sid}`}
              value={data.text}
              sid={data.sid || undefined}
              multiline
            >
              <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: data.text }} />
            </AdminInlineEditor>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToeicPart6PlayerProps {
  data: any[];
  lessonId?: string;
  initialProgress?: Record<string, ProgressType>;
  courseId?: string;
  nextLessonId?: string;
  onFinish?: (results: any) => void;
  isReviewMode?: boolean;
  isSubmitted?: boolean;
  onResolved?: () => void;
  onToggleFlag?: (questionId: string, flag: boolean, color?: FlagColor | null, note?: string) => void;
  onProgressChange?: (progress: Record<string, ProgressType>) => void;
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

export default function ToeicPart6Player({
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
}: ToeicPart6PlayerProps) {
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

  const [activeSid, setActiveSid] = useState<string | null>(null);

  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];

    return [...rawData].sort((a, b) => {
      const aMin = Math.min(...(a.questions || []).map((q: any) => q.questionNo || 999));
      const bMin = Math.min(...(b.questions || []).map((q: any) => q.questionNo || 999));
      return aMin - bMin;
    }).map(group => ({
      ...group,
      questions: [...(group.questions || [])].sort((a, b) => (a.questionNo || 0) - (b.questionNo || 0))
    }));
  }, [rawData]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [time, setTime] = useState(0);
  const [showExplainGroups, setShowExplainGroups] = useState<Record<string, boolean>>({});
  const [showOptionsTranslationGroups, setShowOptionsTranslationGroups] = useState<Record<string, boolean>>({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSubmittedInternal, setIsSubmittedInternal] = useState(isSubmitted);
  const [testScore, setTestScore] = useState({ correct: 0, total: 0, incorrect: 0, unanswered: 0 });
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Lắng nghe sự kiện từ Tour để tự động mở bung Sidebar làm ví dụ
  useEffect(() => {
    const handleTourSidebar = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsSidebarHovered(customEvent.detail.open);
    };
    window.addEventListener("toeic-tour-sidebar", handleTourSidebar);
    return () => window.removeEventListener("toeic-tour-sidebar", handleTourSidebar);
  }, []);

  // Refs
  const questionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const passageRefs = useRef<Map<string, HTMLElement>>(new Map());
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const passageScrollRef = useRef<HTMLDivElement>(null);
  const questionsScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Derived data for current passage
  const currentGroup = data[currentIndex] || { questions: [], id: "" };
  const questions = currentGroup.questions || [];
  const isCurrentRevealed = isReviewMode || isSubmittedInternal || !!showExplainGroups[currentGroup.id];
  const isTranslationRevealed = isCurrentRevealed || !!showOptionsTranslationGroups[currentGroup.id];
  const passages = currentGroup.passages || [];


  // Tự động cuộn lên đầu khi chuyển câu (group)
  useEffect(() => {
    if (passageScrollRef.current) passageScrollRef.current.scrollTop = 0;
    if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;

    // Tự động set active question là câu đầu tiên của group mới
    if (data[currentIndex]?.questions?.[0]) {
      setActiveQuestionId(data[currentIndex].questions[0].id);
    }
  }, [currentIndex, data]);

  // Sync active question from jumpTo (for Full Test mode)
  useEffect(() => {
    if (jumpTo && jumpTo.id) {
      const qId = jumpTo.id;
      data.forEach((group, gIdx) => {
        const qIdx = group.questions.findIndex((q: any) => String(q.questionNo) === qId || q.id === qId);
        if (qIdx !== -1) {
          setCurrentIndex(gIdx);
          setActiveQuestionId(group.questions[qIdx].id);
          setTimeout(() => {
            questionRefs.current.get(group.questions[qIdx].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      });
    }
  }, [jumpTo, data]);
  useEffect(() => {
    const q = data[currentIndex]?.questions?.[0];
    if (onActiveQuestionChange && q?.questionNo) {
      onActiveQuestionChange(q.questionNo);
    }
  }, [currentIndex, data, onActiveQuestionChange]);

  useEffect(() => {
    setMounted(true);
    // Tự động khởi chạy tour hướng dẫn học Part 6 lần đầu
    startToeicPartTour(6);
  }, []);

  // Sync with parent submission state
  useEffect(() => {
    if (isSubmitted) {
      setIsSubmittedInternal(true);
      // Khi nộp bài sẽ tự động hiện đáp án cho tất cả các group
      const allGroupsRevealed: Record<string, boolean> = {};
      data.forEach(g => { if (g.id) allGroupsRevealed[g.id] = true; });
      setShowExplainGroups(allGroupsRevealed);
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
        if (passageScrollRef.current) passageScrollRef.current.scrollTop = 0;
        if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;

        // Đợi một chút để group mới render xong rồi cuộn
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



  const [vSplitWidth, setVSplitWidth] = useState(55);
  const [isResizingV, setIsResizingV] = useState(false);
  const { isAdminMode } = useAdminEdit();

  useEffect(() => {
    if (passageScrollRef.current) passageScrollRef.current.scrollTop = 0;
    if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;
    setActiveSid(null);
  }, [currentIndex, isCurrentRevealed]);

  useEffect(() => {
    if (!isCurrentRevealed) {
      setActiveSid(null);
    }
  }, [isCurrentRevealed]);
  const parsedPassage = useMemo(() => {
    let p: any = null;
    try {
      if (currentGroup.passage) {
        p = currentGroup.passage;
      } else if (currentGroup.passageText) {
        p = JSON.parse(currentGroup.passageText);
      } else if ((currentGroup.metadata as any)?.Json?.passage) {
        p = (currentGroup.metadata as any).Json.passage;
      } else if ((currentGroup.metadata as any)?.Json) {
        const pj = typeof (currentGroup.metadata as any).Json === 'string' ? JSON.parse((currentGroup.metadata as any).Json) : (currentGroup.metadata as any).Json;
        p = pj.passage;
      }

      if (Array.isArray(p)) {
        return p.map((s: any) => {
          const rawSid = String(s.sid || s.sentenceID || "");
          const sid = rawSid.startsWith('s') ? rawSid : 's' + rawSid;
          return { ...s, sid };
        });
      }

      if (p && p.english && p.vietnamese) {
        return p.english.map((enObj: any) => {
          const rawSid = String(enObj.sentenceID || "");
          const sid = rawSid.startsWith('s') ? rawSid : 's' + rawSid;
          const viMatch = p.vietnamese.find((v: any) => v.sentenceID === enObj.sentenceID);
          return { ...enObj, sid, viText: viMatch?.text || "" };
        });
      }
      return [];
    } catch { return []; }
  }, [currentGroup.passage, currentGroup.passageText, currentGroup.metadata]);

  useEffect(() => {
    if (isReviewMode || isSubmittedInternal || showCompletion) return;
    const timer = setInterval(() => setTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isReviewMode, isSubmittedInternal, showCompletion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua phím tắt nếu đang gõ trong input/textarea/contentEditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === 'ArrowLeft') {
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

      // CTRL/CMD + SHIFT + S: Toggle Solution
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowExplainGroups(prev => ({ ...prev, [currentGroup.id]: !prev[currentGroup.id] }));
        return;
      }

      // CTRL/CMD + S: Toggle Options Translation
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowOptionsTranslationGroups(prev => ({ ...prev, [currentGroup.id]: !prev[currentGroup.id] }));
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, data.length, isFullTest, onPrevPart, onNextPart]);

  // RESIZE LOGIC
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const percentage = (e.clientX / window.innerWidth) * 100;
      if (percentage > 20 && percentage < 80) setVSplitWidth(percentage);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length === 0) return;
      const clientX = e.touches[0].clientX;
      const percentage = (clientX / window.innerWidth) * 100;
      if (percentage > 20 && percentage < 80) setVSplitWidth(percentage);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      setIsResizingV(false);
      document.body.style.cursor = 'default';
    };
    const handleTouchEnd = () => {
      isDragging.current = false;
      setIsResizingV(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
    setIsResizingV(true);
    document.body.style.cursor = 'col-resize';
  };

  const handleTouchStart = () => {
    isDragging.current = true;
    setIsResizingV(true);
  };

  const handleSelect = (questionId: string, option: string) => {
    if (isReviewMode || isSubmittedInternal) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleRetake = () => {
    if (!window.confirm("Bạn có chắc chắn muốn làm lại từ đầu?")) return;
    setAnswers({});
    setTime(0);
    setIsSubmittedInternal(false);
    setShowExplainGroups({});
    setShowOptionsTranslationGroups({});
    setShowCompletion(false);
  };

  const handleToggleFlag = async (questionId: string, color: FlagColor | null, note?: string, deleteNote?: boolean) => {
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
    } catch (e) { }
    if (onToggleFlag) onToggleFlag(questionId, !!color, color, deleteNote ? undefined : (note !== undefined ? note : flagNotes[questionId]));
  };

  const handleFinishTest = async () => {
    const totalDone = Object.keys(answers).length;
    const totalQ = data.reduce((acc, g) => acc + (g.questions?.length || 0), 0);
    if (totalDone < totalQ) {
      if (!window.confirm(`Bạn còn ${totalQ - totalDone} câu chưa trả lời. Nộp bài ngay?`)) return;
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
          isFlagged: flags[qKey] || false
        };
      })
    ).filter(item => item !== null) as any[];

    setTestScore({ correct: correctCount, total: totalCount, incorrect: totalCount - correctCount - unansweredCount, unanswered: unansweredCount });

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
      } catch (e) { }
      setIsSubmitting(false);
    }

    setIsSubmittedInternal(true);
    // Khi nộp bài sẽ tự động hiện đáp án cho tất cả các group
    const allGroupsRevealed: Record<string, boolean> = {};
    data.forEach(g => { if (g.id) allGroupsRevealed[g.id] = true; });
    setShowExplainGroups(allGroupsRevealed);

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

  const totalQuestionsDone = Object.keys(answers).length;
  const totalQuestions = data.reduce((acc, g) => acc + (g.questions?.length || 0), 0);

  const paragraphs: any[][] = [];
  if (parsedPassage) {
    let currentPar: any[] = [];

    const isEmailHeader = (text: string) => {
      if (!text) return false;
      const clean = text.replace(/<[^>]*>/g, '').trim();
      const headers = ['To:', 'From:', 'Subject:', 'Date:', 'To :', 'From :', 'Subject :', 'Date :', 'Attachment:', 'Attachment :'];
      return headers.some(h => clean.startsWith(h));
    };

    parsedPassage.forEach((s: any, idx: number) => {
      const isHeader = s.type === 'header' || s.type === 'signature' || s.type === 'greeting';
      const prev = idx > 0 ? parsedPassage[idx - 1] : null;
      const prevWasHeader = prev && (prev.type === 'header' || prev.type === 'signature' || prev.type === 'greeting');
      const isSentenceSelection = s.text && s.text.trim().startsWith('**') && s.text.trim().endsWith('**');

      const isCurrentEmailHeader = isEmailHeader(s.text);
      const isPrevEmailHeader = prev && isEmailHeader(prev.text);

      const shouldBreak = s.is_new_paragraph || isCurrentEmailHeader || isPrevEmailHeader;

      if (shouldBreak && currentPar.length > 0) {
        if (!isSentenceSelection || isHeader || prevWasHeader || isCurrentEmailHeader || isPrevEmailHeader) {
          paragraphs.push(currentPar);
          currentPar = [];
        }
      }
      currentPar.push(s);
    });
    if (currentPar.length > 0) paragraphs.push(currentPar);
  }

  const getParagraphStyle = (par: any[], nextPar?: any[]) => {
    if (par.length === 0) return 'mb-6 indent-0';
    const firstSentence = par[0];
    const type = firstSentence.type;
    const nextType = nextPar?.[0]?.type;
    const isHeader = type === 'header' || type === 'signature';
    const nextIsHeader = nextType === 'header' || nextType === 'signature';

    const text = (firstSentence.text || "").trim();
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    const headers = ['To:', 'From:', 'Subject:', 'Date:', 'Subject :', 'Attachment:', 'Attachment :'];

    const style = (() => {
      if (isHeader) {
        if (nextPar && !nextIsHeader) return 'mb-6 indent-0';
        if (nextPar && nextPar[0]?.is_new_paragraph) {
          const nextText = (nextPar[0]?.text || "").trim();
          const nextCleanText = nextText.replace(/<[^>]*>/g, '').trim();
          const isNextEmail = headers.some(k => nextCleanText.startsWith(k));
          const isCurrentEmail = headers.some(k => cleanText.startsWith(k));
          if (isNextEmail || isCurrentEmail) {
            return 'mb-0 indent-0';
          }

          const isDateText = (t: string) => {
            const clean = t.toLowerCase();
            const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            return months.some(m => clean.includes(m)) && (/\d+/.test(clean) || clean.length < 15);
          };

          if (isDateText(cleanText)) {
            return 'mb-6 indent-0';
          }

          if (nextIsHeader) {
            return 'mb-0 indent-0';
          }

          return 'mb-6 indent-0';
        }
        return 'mb-0 indent-0';
      }

      if (type === 'greeting' || type === 'signoff') return 'mb-4 indent-0';
      if (type === 'body') return firstSentence.is_new_paragraph ? 'mb-4' : 'mb-0';

      if (par.length !== 1) return 'mb-6 indent-0';
      const greetingSignoff = ['Dear', 'Sincerely', 'Best regards', 'Best,', 'Regards,', 'Best'];

      const isCurrentHeaderFallback = headers.some(k => cleanText.startsWith(k));
      if (isCurrentHeaderFallback) {
        if (nextPar) {
          const nextText = (nextPar[0]?.text || "").trim();
          const nextCleanText = nextText.replace(/<[^>]*>/g, '').trim();
          const isNextHeaderFallback = headers.some(k => nextCleanText.startsWith(k));
          if (!isNextHeaderFallback) return 'mb-6 indent-0';
        }
        return 'mb-0 indent-0';
      }

      if (greetingSignoff.some(k => cleanText.startsWith(k))) return 'mb-4 indent-0';
      if (cleanText.length > 0 && cleanText.length < 40) return 'mb-0 indent-0';

      return 'mb-6 indent-0';
    })();

    return style;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <ClockIcon className="w-12 h-12 animate-pulse" />
        <p className="font-medium">Đang tải câu hỏi Part 6...</p>
      </div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      className="absolute inset-0 flex flex-col font-sans bg-[#f8fafc] text-slate-800 overflow-hidden pr-20 select-text"
    >
      <div className="flex-none p-3 px-4 z-[60] bg-[#f8fafc]">
        <div className="max-w-[1600px] mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 p-2 px-4 flex items-center justify-between gap-4">
          <div className="text-sm font-bold text-slate-700">Part 6: Text Completion</div>
          <button
            id="reveal-btn"
            onClick={() => setShowExplainGroups(prev => ({ ...prev, [currentGroup.id]: !prev[currentGroup.id] }))}
            title="Ẩn/Hiện lời giải (Phím tắt: ctrl/cmd + shift + s)"
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isCurrentRevealed ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            {isCurrentRevealed ? "ẨN LỜI GIẢI" : "HIỆN LỜI GIẢI"}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full flex-1 flex overflow-hidden relative">
        {/* CENTER CONTENT: SPLIT PANES */}
        <div ref={mainContainerRef} className="flex-1 min-h-0 flex overflow-hidden pb-4 relative">
          <div
            id="left-split-col"
            className="flex flex-col min-h-0 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative flex-none"
            style={{ width: `${vSplitWidth}%`, flexShrink: 0 }}
          >
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 bg-slate-50/50 border-b flex items-center justify-between sticky top-0 z-10">
                <span className="font-bold text-slate-500 text-[10px] tracking-widest uppercase">Text Passage</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded italic">Bật Hiện đáp án và rê chuột vào câu để xem bản dịch</span>
              </div>
              <div
                ref={passageScrollRef}
                className="flex-1 overflow-y-auto p-8 lg:p-12 pb-[35vh] lg:pb-[35vh] scrollbar-thin"
                onMouseMove={(e) => {
                  const x = e.clientX;
                  const y = e.clientY;
                  const el = document.getElementById('global-translation-portal');
                  if (el) {
                    el.style.left = `${Math.min(x + 20, window.innerWidth - 380)}px`;
                    el.style.top = `${Math.min(y + 20, window.innerHeight - 150)}px`;
                  }
                }}
              >
                <div className="mb-6 text-slate-800 text-xl px-2 italic font-medium border-l-4 border-blue-200 pl-4">
                  {(() => {
                    const qNos = (data[currentIndex]?.questions || [])
                      .map((q: any) => parseInt(q.questionNo))
                      .filter((n: number) => !isNaN(n))
                      .sort((a: number, b: number) => a - b);

                    if (qNos.length === 0) return <span>Questions refer to the following passage.</span>;

                    const minQ = qNos[0];
                    const maxQ = qNos[qNos.length - 1];
                    const range = minQ === maxQ ? `Question ${minQ}` : `Questions ${minQ}–${maxQ}`;

                    const meta = (data[currentIndex]?.metadata as any) || {};
                    const passageType = (meta.PassageType || meta.passageType || "passage").toLowerCase();

                    return (
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <span className="font-bold text-blue-600">{range}</span> refer to the following {passageType}.
                        </div>
                        {isAdminMode && (
                          <AdminInlineEditor
                            target="group"
                            id={data[currentIndex]?.id}
                            field="html_content"
                            value={data[currentIndex]?.html_content || ""}
                            multiline
                          >
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-500 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider shadow-sm">
                              <Edit2 size={12} /> Sửa nguồn (HTML)
                            </button>
                          </AdminInlineEditor>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="bg-white p-2">
                  {paragraphs.map((par, pIdx) => (
                    <div key={pIdx} className={`${getParagraphStyle(par, paragraphs[pIdx + 1])} last:mb-0`}>
                      {par.map((s: any, sIdx: number) => {
                        const clean = (s.text || "").replace(/<[^>]*>/g, '').trim();
                        const isEmailHeaderLike = ['To:', 'From:', 'Subject:', 'Date:', 'Attachment:', 'Cc:', 'Bcc:'].some(h => clean.startsWith(h) || clean.startsWith(h + ' '));
                        const isHeaderLike = s.type === 'header' || s.type === 'signature' || s.type === 'signoff' || isEmailHeaderLike;
                        return (
                          <span
                            key={s.sid || sIdx}
                            ref={el => { if (el && s.sid) passageRefs.current.set(s.sid, el); else if (s.sid) passageRefs.current.delete(s.sid); }}
                            className={isHeaderLike ? "block" : "inline"}
                          >
                            <SentenceItem
                              sentence={s}
                              revealMode={isCurrentRevealed}
                              questions={questions}
                              activeSid={activeSid}
                            />
                            {" "}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* GLOBAL TRANSLATION PORTAL - DECOUPLED */}
          {(isCurrentRevealed || isAdminMode) && (
            <TranslationPortal
              groupId={data[currentIndex]?.id}
              isAdminMode={isAdminMode}
            />
          )}

          {/* VERTICAL DIVIDER */}
          <div
            className="group relative w-2 hover:w-4 flex items-center justify-center transition-all z-30"
          >
            {/* The Line */}
            <div className={`w-[2px] h-full transition-colors ${isResizingV ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-indigo-400'}`}></div>

            {/* The Handle */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 shadow-xl flex items-center justify-center transition-all cursor-col-resize ${isResizingV ? 'border-indigo-500 scale-110 shadow-indigo-200' : 'border-slate-200 group-hover:border-indigo-400 group-hover:scale-105'}`}
            >
              <ChevronsLeftRight className={`w-5 h-5 ${isResizingV ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
            </div>
          </div>

          {/* RIGHT: QUESTIONS COLUMN */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative pl-4">
            <div ref={questionsScrollRef} className="flex-1 overflow-y-auto pr-3 scrollbar-thin space-y-4 pb-[35vh]">
              {questions.map((q: any) => {
                const qKey = q.id || `${currentGroup.id}_${q.questionNo}`;
                const isSelectedAny = !!answers[qKey];
                const isFlagged = flags[qKey];
                const highlightColorClass = getHighlightClass(q.metadata?.highlight_color || "default");
                const [hText, hBg, hBorder] = highlightColorClass.split(' ');

                return (
                  <div
                    key={q.id || qKey}
                    id={`question-${q.questionNo}`}
                    ref={el => { if (el) questionRefs.current.set(q.id || qKey, el); else questionRefs.current.delete(q.id || qKey); }}
                    className={`p-4 rounded-[24px] border transition-all duration-300 mb-4 ${isSelectedAny ? 'border-indigo-200 bg-indigo-50/20 shadow-lg shadow-indigo-500/5' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30_rgb(0,0,0,0.08)]'}`}
                  >
                    <div className="flex items-start gap-6 mb-4">
                      {/* Left Column: Number + Flag */}
                      <div className="flex flex-col items-center gap-4 shrink-0 pt-0.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[14px] shadow-sm border ${isCurrentRevealed ? hBg + ' ' + hText + ' ' + hBorder : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                          {q.questionNo}
                        </div>
                        <FlagSelector
                          isFlagged={!!flags[qKey]}
                          flagColor={flags[qKey] || null}
                          flagNote={flagNotes[qKey]}
                          onToggle={(color, note) => handleToggleFlag(qKey, color, note)}
                          onUnflag={(deleteNote) => handleToggleFlag(qKey, null, undefined, deleteNote)}
                          compact={true}
                          layout="vertical"
                        />
                      </div>

                      {/* Right Column: Question Content */}
                      <div className="flex-1 min-w-0">
                        <div className="space-y-1">
                          {['A', 'B', 'C', 'D'].map(opt => {
                            const optText = q[`option${opt}`];
                            if (!optText) return null;
                            const isSelected = answers[qKey] === opt;
                            const isCorrectOpt = q.correctAnswer === opt;
                            let uiState = "UNSELECTED";
                            if (isReviewMode || isSubmittedInternal) {
                              if (isCorrectOpt) uiState = "CORRECT";
                              else if (isSelected) uiState = "WRONG";
                              else uiState = "FADED";
                            } else if (isSelected) uiState = "SELECTED";

                            let optClass = "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md shadow-sm";
                            let letterClass = "bg-slate-50 text-slate-400 border-slate-200 group-hover:border-slate-400";

                            if (isCurrentRevealed) {
                              if (isCorrectOpt) {
                                optClass = "border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10";
                                letterClass = "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 scale-110";
                              } else if (isSelected) {
                                optClass = "border-red-500 bg-red-50/30 shadow-md shadow-red-500/10";
                                letterClass = "bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20 scale-110";
                              } else {
                                optClass = "border-slate-300 bg-white shadow-sm";
                                letterClass = "bg-slate-100 text-slate-400 border-slate-200";
                              }
                            } else if (isSelected) {
                              optClass = "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/5";
                              letterClass = "bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-200/50 scale-110";
                            }

                            return (
                              <div key={opt}>
                                <div className={`group w-full flex items-center py-0.5 px-2 rounded-xl border text-left transition-all relative cursor-default select-text gap-2 ${optClass}`}>
                                  <span
                                    onClick={() => !(isReviewMode || isSubmittedInternal) && handleSelect(qKey, opt)}
                                    className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-black border transition-all duration-300 ${!(isReviewMode || isSubmittedInternal) ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'} ${letterClass}`}
                                  >
                                    {opt}
                                  </span>
                                  <div className="flex flex-col gap-0.5 w-full">
                                    <AdminInlineEditor
                                      target="question"
                                      id={q.id}
                                      field={`option${opt}`}
                                      value={optText}
                                    >
                                      <span className={`text-[15px] font-bold ${uiState === "CORRECT" ? 'text-emerald-900' : uiState === "SELECTED" ? 'text-blue-900' : 'text-slate-900'} leading-snug`}>{optText}</span>
                                    </AdminInlineEditor>
                                    {isTranslationRevealed && (q.metadata as any)?.options_vn?.[opt] && (
                                      <div className="text-[14px] text-slate-500 font-medium italic mt-0.5 leading-tight">
                                        <AdminInlineEditor
                                          target="question"
                                          id={q.id}
                                          field={`metadata.explanation_vn.options_vn.${opt}`}
                                          value={(q.metadata as any).options_vn[opt]}
                                        >
                                          {(q.metadata as any).options_vn[opt]}
                                        </AdminInlineEditor>
                                      </div>
                                    )}
                                  </div>
                                  {isCurrentRevealed && isCorrectOpt && <Check className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 animate-in zoom-in duration-300" />}
                                  {isCurrentRevealed && isSelected && !isCorrectOpt && <X className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-red-500 animate-in zoom-in duration-300" />}
                                </div>

                                {isCurrentRevealed && (() => {
                                  const meta = q.metadata as any;
                                  let rationale: any = null;
                                  const isCorrect = q.correctAnswer === opt;
                                  let parsedExpl: any = {};
                                  try { parsedExpl = JSON.parse(q.explanation || "{}"); } catch { }

                                  if (meta?.explanation_vn) {
                                    const ev = meta.explanation_vn;
                                    if (isCorrect) rationale = { why: ev.why_correct || ev.why };
                                    else if (ev.wrong?.[opt]) rationale = { why: ev.wrong[opt] };
                                  }

                                  if (!rationale) {
                                    if (isCorrect) rationale = { why: parsedExpl?.why_correct };
                                    else if (parsedExpl?.wrong?.[opt]) rationale = { why: parsedExpl.wrong[opt] };
                                  }

                                  if (!rationale?.why) return null;

                                  return (
                                    <div className={`ml-14 p-4 rounded-r-2xl border-l-4 mt-2 text-[14px] font-medium italic animate-in slide-in-from-left-2 duration-300 ${isCorrect ? 'text-emerald-700 bg-emerald-50/50 border-emerald-400' : 'text-red-600 bg-red-50/50 border-red-200'}`}>
                                      <span className="text-[10px] uppercase tracking-tighter opacity-50 block mb-1">
                                        {isCorrect ? "Vì sao đúng:" : "Tại sao sai:"}
                                      </span>
                                      <AdminInlineEditor
                                        target="question"
                                        id={q.id}
                                        field={isCorrect ? "metadata.explanation_vn.why_correct" : `metadata.explanation_vn.wrong.${opt}`}
                                        value={rationale.why}
                                        multiline
                                      >
                                        <FormattedExplanation
                                          text={rationale.why}
                                          onSidClick={(sid) => {
                                            setActiveSid(sid);
                                            const el = passageRefs.current.get(sid);
                                            if (el) {
                                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                          }}
                                        />
                                      </AdminInlineEditor>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isReviewMode && !isCurrentRevealed && Object.keys(initialProgress).length > 0 && answers[Object.keys(initialProgress)[0]] && (
              <div className="mt-8 flex justify-center pb-24">
                <button
                  onClick={async () => {
                    setShowExplainGroups(prev => ({ ...prev, [currentGroup.id]: true }));
                    const reviewedQId = Object.keys(initialProgress)[0];
                    const isC = answers[reviewedQId] === data.flatMap(g => g.questions).find(q => q.id === reviewedQId)?.correctAnswer;
                    if (isC) {
                      if (lessonId) {
                        await fetch('/api/progress/questions', {
                          method: 'POST',
                          body: JSON.stringify({
                            mode: 'batch',
                            attempts: [{
                              questionId: reviewedQId,
                              lessonId,
                              courseId,
                              userAnswer: answers[reviewedQId],
                              isCorrect: true,
                              isFlagged: !!flags[reviewedQId]
                            }]
                          })
                        });
                      }
                      if (onResolved) onResolved();
                    }
                  }}
                  className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all animate-in zoom-in-90 pointer-events-auto"
                >
                  Kiểm Tra Đáp Án
                </button>
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
                  {data.flatMap((g, gIdx) => g.questions?.map((q: any) => {
                    const qKey = q.id || `${g.id}_${q.questionNo}`;
                    const isCurrGroup = gIdx === currentIndex;
                    const isActiveQ = (q.id === activeQuestionId || qKey === activeQuestionId) && isCurrGroup;
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
                        key={q.id || qKey}
                        onClick={() => {
                          setCurrentIndex(gIdx);
                          setActiveQuestionId(q.id || qKey);
                          if (passageScrollRef.current) passageScrollRef.current.scrollTop = 0;
                          if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;
                          setTimeout(() => {
                            const targetEl = questionRefs.current.get(q.id);
                            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 150);
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
                              className={`shadow-sm ${flags[qKey] === 'RED' ? 'text-red-500 fill-red-500' :
                                flags[qKey] === 'PURPLE' ? 'text-purple-500 fill-purple-500' :
                                  flags[qKey] === 'BLUE' ? 'text-blue-500 fill-blue-500' :
                                    'text-yellow-500 fill-yellow-500'
                                }`}
                            />
                            {flagNotes[qKey] && (
                              <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/flag:opacity-100 transition-all duration-200 pointer-events-none z-[1000]">
                                <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10 w-48">
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
                {currentIndex === 0 && onPrevPart ? 'Về part trước' : 'Lùi'}
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
                    className="px-10 py-3 rounded-full font-bold text-[13px] transition-all bg-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-700 active:scale-95 uppercase tracking-widest flex items-center gap-2"
                  >
                    Tiếp sang Part 7 <ChevronRightIcon className="w-4 h-4" />
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

        if (isFullTest && mounted && typeof document !== "undefined" && document.getElementById("bottom-nav-portal-target")) {
          return createPortal(
            <div className="relative flex-none h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[70] flex items-center justify-center pointer-events-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
              <div className="absolute left-4 flex gap-2 pointer-events-auto z-[80]">
                <button
                  onClick={() => startToeicPartTour(6, true)}
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
                onClick={() => startToeicPartTour(6, true)}
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
