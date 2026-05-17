"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  CheckCircleIcon, FlagIcon, ClockIcon, TrophyIcon,
  ChevronLeftIcon, ChevronRightIcon, XMarkIcon,
  InformationCircleIcon, ListBulletIcon, ArrowPathIcon,
  BookOpenIcon, SpeakerWaveIcon
} from "@heroicons/react/24/solid";
import { LayoutDashboard, Send, Edit2, Flag, PenLine } from "lucide-react";
import { AdminInlineEditor } from "@/components/Admin/AdminInlineEditor";
import { useAdminEdit } from "@/components/Admin/AdminEditProvider";
import confetti from 'canvas-confetti';
import Link from 'next/link';
import FlagSelector, { FlagColor } from '../Player/FlagSelector';
import ConfirmModal from '@/components/UI/ConfirmModal';

interface ProgressType {
  isCorrect: boolean;
  userAnswer: string;
  isFlagged: boolean;
  flagColor?: 'RED' | 'PURPLE' | 'BLUE' | 'YELLOW' | null;
  flagNote?: string | null;
}

interface ToeicPart5PlayerProps {
  content?: string; // JSON filters: { day?: string, type?: string }
  data?: any[];
  lessonId?: string;
  courseId?: string;
  nextLessonId?: string;
  initialProgress?: Record<string, ProgressType>;
  isReviewMode?: boolean;
  isSubmitted?: boolean;
  onResolved?: () => void;
  onToggleFlag?: (qId: string, flag: boolean, color?: FlagColor | null, note?: string) => void;
  onProgressChange?: (progress: Record<string, ProgressType>) => void;
  isFullTest?: boolean;
  onNextPart?: () => void;
  onPrevPart?: () => void;
  onActiveQuestionChange?: (questionNo: number) => void;
  jumpTo?: { id: string; ts: number } | null;
  globalOffset?: number;
  globalTotal?: number;
}

export default function ToeicPart5Player({
  content = "{}",
  data: propsData,
  lessonId,
  courseId,
  nextLessonId,
  initialProgress = {},
  isReviewMode = false,
  isSubmitted: propsIsSubmitted = false,
  onResolved,
  onToggleFlag,
  onProgressChange,
  isFullTest,
  onNextPart,
  onPrevPart,
  onActiveQuestionChange,
  jumpTo,
  globalOffset = 0,
  globalTotal
}: ToeicPart5PlayerProps) {
  // --- STATE ---
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(propsIsSubmitted);
  const [revealMode, setRevealMode] = useState(isReviewMode || propsIsSubmitted);
  const [showExplain, setShowExplain] = useState<Record<string, boolean>>({});
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, message: string, onConfirm: () => void } | null>(null);

  // Sync with parent submission state
  useEffect(() => {
    if (propsIsSubmitted) {
      setIsSubmitted(true);
      setRevealMode(true);
    }
  }, [propsIsSubmitted]);

  // Deep-linking: Jump to specific question from URL param 'q'
  const searchParams = useSearchParams();
  const targetQuestionId = searchParams.get('q');
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (targetQuestionId && questions.length > 0) {
      const index = questions.findIndex(q => q.id === targetQuestionId);
      if (index !== -1) {
        setCurrentIndex(index);
        // Delay scroll slightly to ensure DOM is ready
        setTimeout(() => {
          const el = questionRefs.current[targetQuestionId];
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('animate-pulse-blue');
            setTimeout(() => el.classList.remove('animate-pulse-blue'), 3000);
          }
        }, 300);
      }
    }
  }, [targetQuestionId, questions]);

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

  const [testScore, setTestScore] = useState({ correct: 0, total: 0, incorrect: 0, unanswered: 0 });
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAdminMode } = useAdminEdit();
  const explainScrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn lên đầu khi chuyển câu
  useEffect(() => {
    if (explainScrollRef.current) explainScrollRef.current.scrollTop = 0;
  }, [currentIndex]);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    const q = questions[currentIndex];
    if (onActiveQuestionChange && q?.questionNo) {
      onActiveQuestionChange(q.questionNo);
    }
  }, [currentIndex, questions, onActiveQuestionChange]);

  // Nhảy tới câu hỏi từ Full Test Sidebar hoặc Review Center
  useEffect(() => {
    if (jumpTo?.id && questions.length > 0) {
      const targetId = String(jumpTo.id);
      // Tìm index dựa trên database ID hoặc questionNo
      const idx = questions.findIndex(q =>
        String(q.id) === targetId ||
        String(q.questionNo) === targetId
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
  }, [jumpTo, questions]);



  useEffect(() => {
    if (propsData && propsData.length > 0) {
      // Nếu data truyền vào là dạng Groups (Full Test), chúng ta cần phẳng hóa nó
      // Part 5 thường là 1 group = 1 câu hỏi
      const flatQuestions = propsData.flatMap(g => {
        if (g.questions && g.questions.length > 0) {
          return g.questions.map((q: any) => ({
            ...q,
            // Đảm bảo các field cần thiết từ group (nếu có) được truyền vào question
            explanation: q.explanation || g.explanation || g.passageText,
            metadata: q.metadata || g.metadata
          }));
        }
        return g; // Trường hợp data đã phẳng sẵn
      });

      setQuestions(flatQuestions);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const filters = JSON.parse(content);
        const params = new URLSearchParams();
        if (filters.book) params.append("book", filters.book);
        if (filters.test) params.append("test", filters.test);
        if (filters.type) params.append("type", filters.type);

        // BƯỚC 1: Tải 10 câu đầu tiên + Summary của toàn bộ để dựng UI nhanh
        params.append("limit", "10");
        params.append("offset", "0");

        const res = await fetch(`/api/admin/part5/selection?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          // Tạo mảng placeholder cho toàn bộ câu hỏi dựa trên summary
          const fullSummary = data.summary || [];
          const initialQuestions = fullSummary.map((s: any) => {
            const fullQ = data.questions.find((q: any) => q.id === s.id);
            return fullQ || { ...s, _isPlaceholder: true };
          });

          setQuestions(initialQuestions);
          setLoading(false); // Cho phép học sinh làm bài ngay sau khi có 10 câu đầu

          // BƯỚC 2: Tải ngầm phần còn lại nếu có trên 10 câu
          if (initialQuestions.length > 10) {
            const bgParams = new URLSearchParams();
            if (filters.book) bgParams.append("book", filters.book);
            if (filters.test) bgParams.append("test", filters.test);
            if (filters.type) bgParams.append("type", filters.type);
            bgParams.append("offset", "10"); // Bỏ qua 10 câu đã tải

            const bgRes = await fetch(`/api/admin/part5/selection?${bgParams.toString()}`);
            const bgData = await bgRes.json();

            if (bgData.success) {
              setQuestions(prev => {
                const updated = [...prev];
                bgData.questions.forEach((fullQ: any) => {
                  const idx = updated.findIndex(q => q.id === fullQ.id);
                  if (idx !== -1) updated[idx] = fullQ;
                });
                return updated;
              });
            }
          }
        }
      } catch (err) {
        console.error("Lỗi nạp bài tập Part 5:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [content, propsData]);

  // --- TIMER ---
  useEffect(() => {
    if (showCompletion || isSubmitted) return;
    const interval = setInterval(() => setTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [showCompletion, isSubmitted]);

  // --- SYNC SCORE ---
  useEffect(() => {
    if (isSubmitted && questions.length > 0) {
      let c = 0; let i = 0; let u = 0;
      questions.forEach(q => {
        const ans = answers[q.id];
        if (!ans) u++;
        else if (ans === q.correctAnswer) c++;
        else i++;
      });
      setTestScore({ correct: c, total: questions.length, incorrect: i, unanswered: u });
    }
  }, [isSubmitted, questions, answers]);

  // --- HANDLERS ---
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSelect = (qId: string, option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleUpdateFlag = async (qId: string, color: FlagColor | null, note?: string, deleteNote: boolean = false) => {
    setFlags(prev => ({ ...prev, [qId]: color }));
    if (note !== undefined) {
      setFlagNotes(prev => ({ ...prev, [qId]: note }));
    } else if (deleteNote) {
      setFlagNotes(prev => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }

    try {
      await fetch('/api/progress/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'flag',
          questionId: qId,
          lessonId,
          courseId,
          isFlagged: !!color,
          flagColor: color,
          flagNote: deleteNote ? null : (note !== undefined ? note : (flagNotes[qId] || ""))
        })
      });
    } catch (e) {
      console.error("Lỗi gắn cờ:", e);
    }
    if (onToggleFlag) onToggleFlag(qId, !!color, color, deleteNote ? undefined : (note !== undefined ? note : (flagNotes[qId] || "")));
  };

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
        if (currentIndex === questions.length - 1) {
          if (isFullTest && onNextPart) onNextPart();
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      }

      // CTRL/CMD + SHIFT + S: Toggle Solution
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const currentQ = questions[currentIndex];
        if (currentQ) {
          setShowExplain(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions.length, currentIndex, isFullTest, onPrevPart, onNextPart]);

  const handleFinish = async () => {
    const done = Object.keys(answers).length;
    let msg = "";
    if (done < questions.length) {
      msg = `Bạn còn ${questions.length - done} câu chưa trả lời. Nộp bài ngay?`;
    } else {
      msg = "Bạn có chắc chắn muốn nộp bài?";
    }

    setConfirmConfig({
      isOpen: true,
      message: msg,
      onConfirm: async () => {
        setConfirmConfig(null);
        await processFinish();
      }
    });
  };

  const processFinish = async () => {

    setIsSubmitting(true);
    try {
      const attempts = questions.map(q => {
        const ans = answers[q.id] || "";
        if (!ans) return null;
        return {
          questionId: q.id,
          lessonId,
          courseId,
          userAnswer: ans,
          isCorrect: ans === q.correctAnswer,
          isFlagged: !!flags[q.id],
          flagColor: flags[q.id] || null
        };
      }).filter(a => a !== null);

      await fetch('/api/progress/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'batch', attempts })
      });

      await fetch('/api/progress/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, isCompleted: true })
      });

      setIsSubmitted(true);
      setShowCompletion(true);
      setRevealMode(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      console.error("Lỗi nộp bài:", e);
      alert("Nộp bài thất bại, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setConfirmConfig({
      isOpen: true,
      message: "Làm lại sẽ xóa hết kết quả hiện tại. Bạn đồng ý chứ?",
      onConfirm: () => {
        setConfirmConfig(null);
        setAnswers({});
        setFlags({});
        setTime(0);
        setIsSubmitted(false);
        setShowCompletion(false);
        setRevealMode(false);
        setShowExplain({});
        setCurrentIndex(0);
      }
    });
  };

  const speak = (text: string, type: 'uk' | 'us' = 'us') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => {
      if (type === 'uk') return v.lang === 'en-GB';
      return v.lang === 'en-US' || v.lang === 'en_US';
    }) || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const isValidData = (val: string | null | undefined) => {
    if (!val) return false;
    const clean = val.trim().toLowerCase();
    return clean !== '' && clean !== 'null' && clean !== 'none' && clean !== 'n/a';
  };

  const formatText = (text: string | null | undefined) => {
    if (!text) return null;

    // Tách văn bản dựa trên **...** hoặc '...'
    const parts = text.split(/(\*\*.*?\*\*|'.*?')/g);

    return parts.map((part, i) => {
      // Xử lý in đậm cho **văn bản**
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-slate-700 mx-0.5">{part.slice(2, -2)}</strong>;
      }
      // Xử lý in đậm cho 'từ tiếng anh'
      if (part.startsWith("'") && part.endsWith("'")) {
        return <strong key={i} className="font-extrabold text-slate-800 bg-blue-50 px-1 rounded-sm mx-0.5">{part}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <div className="py-40 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-slate-600 font-bold uppercase tracking-widest text-base">Đang tải dữ liệu Part 5...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-3xl border border-blue-100 p-12 max-w-xl mx-auto mt-20">
        <InformationCircleIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-600">Không tìm thấy câu hỏi phù hợp.</h3>
      </div>
    );
  }

  const renderQuestionText = (text: string | null | undefined) => {
    if (!text) return null;

    // Loại bỏ số thứ tự ở đầu nếu có (đã xử lý ở chỗ hiển thị chính)
    const raw = text.replace(/^\d+[\.\s]*/, '');

    // Tách câu dựa trên cụm 3 dấu gạch dưới trở lên
    const parts = raw.split(/(_{3,})/);

    return parts.map((part, i) => {
      if (part.startsWith('_')) {
        // Biến dấu gạch dưới thành một ô trống có style chuyên nghiệp
        return (
          <span
            key={i}
            className="inline mx-3 text-slate-900 font-bold tracking-tight"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };


  if (loading || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <ClockIcon className="w-12 h-12 animate-pulse" />
        <p className="font-medium">Đang tải câu hỏi Part 5...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || {};

  // Parse dữ liệu JSON xịn mới (Siêu giải mã cho Part 5)
  const richData = (() => {
    if (!currentQ) return null;
    try {
      const meta = currentQ.metadata as any;

      // 1. Cấu trúc metadata.translation / vocabulary (Thực tế DB Part 5)
      if (meta?.translation || meta?.vocabulary) {
        return {
          question: { vi: meta.translation },
          vocabulary: meta.vocabulary || [],
          explanation: {
            correct: { why: currentQ.explanation }
          }
        };
      }

      // 2. Cấu trúc metadata.explanation_vn
      if (meta?.explanation_vn) {
        const ev = meta.explanation_vn;
        return {
          question: { vi: ev.vi },
          options: ev.options_vn ? Object.entries(ev.options_vn).map(([label, vi]) => ({ label, vi })) : [],
          explanation: {
            correct: { why: ev.why_correct },
            incorrect: ev.why_wrong ? Object.entries(ev.why_wrong).map(([label, why]) => ({ label, why })) : []
          }
        };
      }

      // 3. Dạng chuỗi JSON ở explanation
      if (currentQ.explanation && typeof currentQ.explanation === 'string' && currentQ.explanation.startsWith('{')) {
        return JSON.parse(currentQ.explanation);
      }
    } catch (e) { }
    return null;
  })();
  let explainData: any = { overall: "", vocabulary: [] };
  try {
    const meta = currentQ.metadata as any;
    if (meta?.explanation) {
      explainData = meta.explanation;
    } else if (currentQ.explanation && typeof currentQ.explanation === 'string' && currentQ.explanation.startsWith('{')) {
      explainData = JSON.parse(currentQ.explanation);
    } else {
      explainData = { overall: currentQ.explanation, vocabulary: meta?.vocabulary || [] };
    }
  } catch (e) {
    explainData = { overall: currentQ.explanation };
  }

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
            <button 
              onClick={() => setShowCompletion(false)} 
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <CheckCircleIcon className="w-4 h-4" /> Xem lại bài làm
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

        {/* CONFIRM MODAL TRONG MÀN HÌNH HOÀN THÀNH */}
        {confirmConfig && (
          <ConfirmModal
            isOpen={confirmConfig.isOpen}
            message={confirmConfig.message}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setConfirmConfig(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-sans bg-[#f8fafc] text-slate-900 overflow-hidden select-text relative">
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 md:pl-8 md:pr-16 scroll-smooth">
          <div className="flex-1 flex flex-col w-full min-h-0 pb-10">
            <div className="bg-white rounded-3xl shadow-md border border-blue-100 mt-4 shrink-0 overflow-hidden flex flex-col">
              <div className="bg-slate-50/50 border-b border-slate-100 px-6 h-14 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4"></div>
                <div className="flex items-center gap-4">
                  <FlagSelector
                    isFlagged={!!flags[currentQ.id || `${currentQ.groupId}_${currentQ.questionNo}`]}
                    flagColor={flags[currentQ.id || `${currentQ.groupId}_${currentQ.questionNo}`] || 'RED'}
                    flagNote={flagNotes[currentQ.id || `${currentQ.groupId}_${currentQ.questionNo}`]}
                    onToggle={(color, note) => {
                      const qKey = currentQ.id || `${currentQ.groupId}_${currentQ.questionNo}`;
                      handleUpdateFlag(qKey, color, note);
                    }}
                    onUnflag={(deleteNote) => {
                      const qKey = currentQ.id || `${currentQ.groupId}_${currentQ.questionNo}`;
                      handleUpdateFlag(qKey, null, undefined, deleteNote);
                    }}
                    compact={true}
                    layout="horizontal"
                  />
                  <div className="h-6 w-[1px] bg-blue-100"></div>
                  <button
                    onClick={() => setShowExplain(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
                    title="Ẩn/Hiện lời giải (Phím tắt: ctrl/cmd + shift + s)"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border ${showExplain[currentQ.id] ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-600 border-blue-100 hover:border-blue-400'
                      }`}
                  >
                    <InformationCircleIcon className="w-3.5 h-3.5" />
                    {showExplain[currentQ.id] ? "Ẩn lời giải" : "Xem lời giải"}
                  </button>
                </div>
              </div>
              <div
                ref={el => { if (currentQ.id) questionRefs.current[currentQ.id] = el; }}
                className="p-4 space-y-4 flex-1 transition-all duration-1000 rounded-3xl"
              >
                <div className="flex items-start text-lg md:text-xl font-bold text-slate-900 leading-[2.2] tracking-normal mb-4">
                  <span className="inline-flex items-center justify-center min-w-[32px] h-8 rounded-lg bg-slate-100 text-slate-400 font-bold text-sm mr-4 flex-shrink-0 mt-1 transition-colors group-hover:bg-slate-100 group-hover:text-slate-1000">
                    {currentQ.questionNo}
                  </span>
                  <AdminInlineEditor
                    target="question"
                    id={currentQ.id}
                    field="questionText"
                    value={currentQ.questionText || (currentQ as any).question || (currentQ as any).passageText || ""}
                    multiline
                  >
                    <span>{renderQuestionText(currentQ.questionText || (currentQ as any).question || (currentQ as any).passageText)}</span>
                  </AdminInlineEditor>
                </div>
                <div className="w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const qKey = currentQ.id || `${currentQ.groupId}_${currentQ.questionNo}`;
                      const isSelected = answers[qKey] === opt;
                      const isCorrect = currentQ.correctAnswer === opt;
                      const revealed = revealMode || showExplain[currentQ.id];
                      const breakdown = explainData.options_breakdown?.[opt] || {};
                      const value = currentQ[`option${opt}`] || (currentQ as any)[`Option${opt}`] || (currentQ as any).options?.find((o: any) => o.label === opt)?.text || (currentQ as any).options?.find((o: any) => o.label === opt)?.vi;
                      let btnClass = "border-slate-200 bg-white hover:border-blue-300 text-slate-900 shadow-sm";
                      if (revealed) {
                        if (isCorrect) btnClass = "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-50";
                        else if (isSelected) btnClass = "border-red-500 bg-red-100 text-red-900 shadow-sm shadow-red-50";
                        else btnClass = "border-slate-300 bg-white shadow-none";
                      }
                      return (
                        <div
                          key={opt}
                          onMouseDown={(e) => e.stopPropagation()}
                          className={`relative py-1 px-3 rounded-xl border text-left text-[16px] font-semibold transition-all flex items-center gap-3 cursor-default select-text ${btnClass}`}
                        >
                          <div
                            onClick={() => {
                              const qKey = currentQ.id || `${currentQ.groupId}_${currentQ.questionNo}`;
                              !revealed && handleSelect(qKey, opt);
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-all shrink-0 cursor-pointer hover:scale-110 active:scale-95 ${revealed && isCorrect ? 'bg-emerald-500 text-white border-emerald-600' :
                              revealed && isSelected ? 'bg-red-500 text-white border-red-600' :
                                isSelected ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-400'
                              }`}>{opt}</div>
                          <AdminInlineEditor
                            target="question"
                            id={currentQ.id}
                            field={`option${opt}`}
                            value={value}
                          >
                            <div className="flex flex-col flex-1 py-1">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="whitespace-normal font-bold">{value}</span>
                                {revealed && breakdown.meaning && (
                                  <span className="text-[12px] text-slate-500 font-medium leading-tight">
                                    = {breakdown.meaning}
                                  </span>
                                )}
                              </div>
                              {revealed && (isValidData(breakdown.synonyms) || isValidData(breakdown.antonyms)) && (
                                <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                                  {isValidData(breakdown.synonyms) && (
                                    <div className="flex items-center gap-1 group/syn">
                                      <span className="text-emerald-600 font-bold whitespace-nowrap">
                                        ~ {breakdown.synonyms}
                                      </span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); speak(breakdown.synonyms); }}
                                        className="p-0.5 rounded hover:bg-emerald-50 text-emerald-400/60 hover:text-emerald-600 transition-colors"
                                        title="Nghe từ đồng nghĩa"
                                      >
                                        <SpeakerWaveIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  {isValidData(breakdown.antonyms) && (
                                    <div className="flex items-center gap-1 group/ant">
                                      <span className="text-red-500 font-bold whitespace-nowrap">
                                        &gt;&lt; {breakdown.antonyms}
                                      </span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); speak(breakdown.antonyms); }}
                                        className="p-0.5 rounded hover:bg-red-50 text-red-400/60 hover:text-red-600 transition-colors"
                                        title="Nghe từ trái nghĩa"
                                      >
                                        <SpeakerWaveIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </AdminInlineEditor>
                          {isValidData(value) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); speak(value); }}
                              className="p-1.5 hover:bg-white/50 rounded-full transition-colors shrink-0"
                              title="Phát âm"
                            >
                              <SpeakerWaveIcon className="w-4 h-4 text-slate-1000 opacity-60 hover:opacity-100" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TRANSLATION SECTION - MOVED BELOW OPTIONS */}
                {(revealMode || showExplain[currentQ.id]) && (
                  <div className="mt-6 p-5 bg-slate-50/50 rounded-2xl border border-blue-100/30 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <BookOpenIcon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Bản dịch câu hỏi:</span>
                    </div>
                    <p className="text-[15px] font-bold text-slate-700 leading-relaxed italic">
                      <AdminInlineEditor
                        target="question"
                        id={currentQ.id}
                        field="metadata.translation"
                        value={currentQ.metadata?.translation || "Đang cập nhật bản dịch chi tiết..."}
                        multiline
                      >
                        "{currentQ.metadata?.translation || "Đang cập nhật bản dịch chi tiết..."}"
                      </AdminInlineEditor>
                    </p>
                  </div>
                )}

                {isReviewMode && answers[currentQ.id] && !revealMode && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={async () => {
                        setRevealMode(true);
                        const isC = answers[currentQ.id] === currentQ.correctAnswer;
                        if (isC && lessonId) {
                          await fetch('/api/progress/questions', {
                            method: 'POST',
                            body: JSON.stringify({
                              mode: 'batch',
                              attempts: [{
                                questionId: currentQ.id,
                                lessonId,
                                courseId,
                                userAnswer: answers[currentQ.id],
                                isCorrect: true,
                                isFlagged: !!flags[currentQ.id]
                              }]
                            })
                          });
                          if (onResolved) onResolved();
                        }
                      }}
                      className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all animate-in zoom-in-90"
                    >
                      Kiểm Tra Đáp Án
                    </button>
                  </div>
                )}
              </div>
            </div>
            {(revealMode || showExplain[currentQ.id]) && (
              <div className="mt-6 h-[700px] shrink-0 relative overflow-hidden bg-white rounded-3xl border border-blue-100 shadow-md flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <BookOpenIcon className="w-4 h-4 text-slate-700" />
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">LỜI GIẢI CHI TIẾT</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
                <div ref={explainScrollRef} className="flex-1 overflow-y-auto pt-10 px-8 pb-40 scrollbar-thin scrollbar-thumb-blue-100 scrollbar-track-transparent">
                  <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Đáp án đúng là:</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <p className="text-2xl font-bold text-slate-900">
                            {currentQ.correctAnswer}. {currentQ[`option${currentQ.correctAnswer}`]}
                            <CheckCircleIcon className="w-7 h-7 text-emerald-500 inline-block ml-3 mb-1" />
                          </p>
                          <button onClick={() => speak(currentQ[`option${currentQ.correctAnswer}`])} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                            <SpeakerWaveIcon className="w-5 h-5 text-slate-600" />
                          </button>
                        </div>
                        <div className="p-6 bg-slate-100/30 rounded-2xl border border-blue-100/30 italic font-bold text-slate-700 leading-relaxed text-lg">
                          <AdminInlineEditor
                            target="question"
                            id={currentQ.id}
                            field="metadata.translation"
                            value={currentQ.metadata?.translation || "Đang cập nhật bản dịch chi tiết..."}
                            multiline
                          >
                            "{currentQ.metadata?.translation || "Đang cập nhật bản dịch chi tiết..."}"
                          </AdminInlineEditor>
                        </div>
                      </div>
                    </section>
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <ListBulletIcon className="w-5 h-5 text-slate-300" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Giải mã các phương án</span>
                      </div>
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <div className="overflow-hidden border border-slate-200 sm:rounded-2xl shadow-sm bg-white">
                            <table className="min-w-full divide-y divide-slate-200 border-collapse">
                              <thead className="bg-slate-100/80">
                                <tr className="divide-x divide-slate-200">
                                  <th scope="col" className="px-5 py-4 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest w-16">Câu</th>
                                  <th scope="col" className="px-5 py-4 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest w-64">Từ vựng & Phát âm</th>
                                  <th scope="col" className="px-5 py-4 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest">Phân tích chi tiết</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-200">
                                {['A', 'B', 'C', 'D'].map((opt) => {
                                  const isCorrectRow = opt === currentQ.correctAnswer;
                                  const breakdown = explainData.options_breakdown?.[opt] || {};
                                  const label = currentQ[`option${opt}`];
                                  return (
                                    <tr key={opt} className={`transition-colors divide-x divide-slate-100 ${isCorrectRow ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                                      <td className="px-5 py-6 whitespace-nowrap">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border-2 transition-all shadow-sm ${isCorrectRow ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                          {opt}
                                        </div>
                                      </td>
                                      <td className="px-5 py-6 align-top">
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 group/word">
                                            <span className={`text-lg font-bold tracking-tight ${isCorrectRow ? 'text-emerald-700' : 'text-slate-800'}`}>{label}</span>
                                            <button onClick={() => speak(label)} className="p-1 px-1.5 bg-slate-100 rounded-md hover:bg-blue-600 hover:text-white transition-all text-slate-400" title="Phát âm">
                                              <SpeakerWaveIcon className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                          <div className="flex flex-col gap-1.5">
                                            {isValidData(breakdown.ipa_uk) && (
                                              <div className="flex items-center gap-2 text-[11px]">
                                                <span className="font-bold text-slate-400 w-5">UK</span>
                                                <div className="flex items-center gap-1.5">
                                                  <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{breakdown.ipa_uk}</span>
                                                  <button onClick={() => speak(label, 'uk')} className="text-slate-300 hover:text-blue-500"><SpeakerWaveIcon className="w-3 h-3" /></button>
                                                </div>
                                              </div>
                                            )}
                                            {isValidData(breakdown.ipa_us) && (
                                              <div className="flex items-center gap-2 text-[11px]">
                                                <span className="font-bold text-slate-400 w-5">US</span>
                                                <div className="flex items-center gap-1.5">
                                                  <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{breakdown.ipa_us}</span>
                                                  <button onClick={() => speak(label, 'us')} className="text-slate-300 hover:text-blue-500"><SpeakerWaveIcon className="w-3 h-3" /></button>
                                                </div>
                                              </div>
                                            )}
                                            {!isValidData(breakdown.ipa_uk) && !isValidData(breakdown.ipa_us) && isValidData(breakdown.ipa) && (
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">[{breakdown.ipa}]</span>
                                                <button onClick={() => speak(label)} className="text-slate-300 hover:text-blue-500"><SpeakerWaveIcon className="w-3 h-3" /></button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-5 py-6 align-top">
                                        <div className="space-y-4">
                                          <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nghĩa phương án:</div>
                                            <p className="font-bold text-slate-800 text-base leading-snug">
                                              <AdminInlineEditor target="question" id={currentQ.id} field={`metadata.explanation.options_breakdown.${opt}.meaning`} value={breakdown.meaning || ""}>
                                                {formatText(breakdown.meaning) || "Nghĩa của từ này đang được cập nhật..."}
                                              </AdminInlineEditor>
                                            </p>
                                          </div>
                                          <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phân tích:</div>
                                            <div className="text-slate-700 leading-relaxed font-medium">
                                              <AdminInlineEditor target="question" id={currentQ.id} field={`metadata.explanation.options_breakdown.${opt}.reason`} value={breakdown.reason || ""} multiline>
                                                {formatText(breakdown.reason)}
                                              </AdminInlineEditor>
                                            </div>
                                          </div>

                                          {(isValidData(breakdown.synonyms) || isValidData(breakdown.antonyms)) && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                              {isValidData(breakdown.synonyms) && (
                                                <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 group/syn">
                                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">🔗 Syn</span>
                                                  <span className="text-[13px] font-bold text-emerald-700">{breakdown.synonyms}</span>
                                                  <button
                                                    onClick={() => speak(breakdown.synonyms)}
                                                    className="p-1 rounded hover:bg-emerald-100 text-emerald-400 transition-colors"
                                                    title="Nghe tất cả từ đồng nghĩa"
                                                  >
                                                    <SpeakerWaveIcon className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              )}
                                              {isValidData(breakdown.antonyms) && (
                                                <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 group/ant">
                                                  <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">↔️ Ant</span>
                                                  <span className="text-[13px] font-bold text-red-600">{breakdown.antonyms}</span>
                                                  <button
                                                    onClick={() => speak(breakdown.antonyms)}
                                                    className="p-1 rounded hover:bg-red-100 text-red-300 transition-colors"
                                                    title="Nghe tất cả từ trái nghĩa"
                                                  >
                                                    <SpeakerWaveIcon className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Expansion & Vocabulary Section - Unified Compact Table */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <BookOpenIcon className="w-5 h-5 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Thư viện Từ vựng & Cấu trúc mở rộng</span>
                      </div>

                      <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
                        <table className="min-w-full divide-y divide-slate-200 border-collapse">
                          <thead className="bg-slate-100/80 border-b border-slate-200">
                            <tr className="divide-x divide-slate-200">
                              <th scope="col" className="px-5 py-3 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest w-1/4">Từ vựng / Cấu trúc</th>
                              <th scope="col" className="px-5 py-3 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest w-1/4">Phiên âm</th>
                              <th scope="col" className="px-5 py-3 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest">Ý nghĩa & Cách dùng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {/* Expansion Items */}
                            {explainData.expansion?.map((item: any, idx: number) => (
                              <tr key={`exp-${idx}`} className="hover:bg-amber-50/30 transition-colors group divide-x divide-slate-100">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2">
                                    <AdminInlineEditor
                                      target="question"
                                      id={currentQ.id}
                                      field={`metadata.explanation.expansion.${idx}.phrase`}
                                      value={item.phrase || ""}
                                    >
                                      <span className="font-bold text-amber-900 text-base">{item.phrase}</span>
                                    </AdminInlineEditor>
                                    <button onClick={() => speak(item.phrase)} className="p-1.5 rounded-full hover:bg-amber-100 text-amber-400 transition-colors opacity-0 group-hover:opacity-100">
                                      <SpeakerWaveIcon className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-tighter">Phrasal Verb</span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex flex-col gap-1">
                                    {isValidData(item.ipa_uk) && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 w-4">UK</span>
                                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1 rounded">{item.ipa_uk}</span>
                                      </div>
                                    )}
                                    {isValidData(item.ipa_us) && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 w-4">US</span>
                                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1 rounded">{item.ipa_us}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                    <AdminInlineEditor
                                      target="question"
                                      id={currentQ.id}
                                      field={`metadata.explanation.expansion.${idx}.meaning`}
                                      value={item.meaning || ""}
                                      multiline
                                    >
                                      {formatText(item.meaning)}
                                    </AdminInlineEditor>
                                  </p>
                                </td>
                              </tr>
                            ))}

                            {/* Vocabulary Items */}
                            {(richData?.vocabulary || explainData.vocabulary)?.map((v: any, vi: number) => (
                              <tr key={`voc-${vi}`} className="hover:bg-indigo-50/30 transition-colors group divide-x divide-slate-100">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2">
                                    <AdminInlineEditor
                                      target="question"
                                      id={currentQ.id}
                                      field={`metadata.explanation.vocabulary.${vi}.word`}
                                      value={v.word || ""}
                                    >
                                      <span className="font-bold text-indigo-900 text-base lowercase">{v.word}</span>
                                    </AdminInlineEditor>
                                    <button onClick={() => speak(v.word)} className="p-1.5 rounded-full hover:bg-indigo-100 text-indigo-400 transition-colors opacity-0 group-hover:opacity-100">
                                      <SpeakerWaveIcon className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-tighter">Vocabulary</span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex flex-col gap-1">
                                    {isValidData(v.ipa_uk) && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 w-4">UK</span>
                                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1 rounded">{v.ipa_uk}</span>
                                      </div>
                                    )}
                                    {isValidData(v.ipa_us) && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 w-4">US</span>
                                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1 rounded">{v.ipa_us}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                    <AdminInlineEditor
                                      target="question"
                                      id={currentQ.id}
                                      field={`metadata.explanation.vocabulary.${vi}.meaning`}
                                      value={v.meaning || ""}
                                      multiline
                                    >
                                      {formatText(v.meaning)}
                                    </AdminInlineEditor>
                                  </p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {!isFullTest && mounted && createPortal(
          <div
            className={`fixed right-0 top-14 bottom-0 z-[999] transition-all duration-300 ease-out border-l border-white/10 shadow-2xl flex flex-col ${isSidebarHovered ? "w-72 bg-slate-900/90 backdrop-blur-xl" : "w-14 bg-white/50 backdrop-blur-sm hover:bg-white/60 cursor-pointer"}`}
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
                  <div>
                    <h3 className="font-black text-white mb-0.5">BẢNG CÂU HỎI</h3>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {isSidebarHovered ? (
                <div className="grid grid-cols-4 gap-2">
                  {questions.map((q, idx) => {
                    const qKey = q.id || `${q.groupId}_${q.questionNo}`;
                    const isCurr = currentIndex === idx;
                    const isDone = !!answers[qKey];
                    let btnClass = isSubmitted ? (answers[qKey] === q.correctAnswer ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : (isDone ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400');
                    return (
                      <button key={q.id} onClick={() => setCurrentIndex(idx)} className={`h-10 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center relative ${isCurr ? 'ring-2 ring-white z-20 scale-110' : ''} ${btnClass}`}>
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="text-[10px] font-black text-blue-500">{Math.round((Object.keys(answers).length / questions.length) * 100)}%</div>
                  <div className="w-1 h-12 bg-slate-200 rounded-full overflow-hidden flex flex-col justify-end">
                    <div className="bg-blue-500 w-full" style={{ height: `${(Object.keys(answers).length / questions.length) * 100}%` }}></div>
                  </div>
                </div>
              )}
            </div>
            <div className={`p-4 border-t border-white/10 bg-black/20 shrink-0 ${!isSidebarHovered && 'flex justify-center'}`}>
              {isSidebarHovered ? (
                !isSubmitted ? (
                  <button onClick={handleFinish} className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-[13px] hover:bg-blue-700 transition-all uppercase flex items-center justify-center gap-2">
                    <Send size={16} /> NỘP BÀI NGAY
                  </button>
                ) : (
                  <button onClick={handleRetake} className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-700 transition uppercase">🔄 Làm lại bài</button>
                )
              ) : (
                <button onClick={handleFinish} className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg"><Send size={16} /></button>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
      {(() => {
        const navContent = (
          <div className="flex items-center gap-6 pointer-events-auto">
            <div className="relative group">
              <button
                onClick={() => currentIndex === 0 ? onPrevPart?.() : setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0 && !onPrevPart}
                className="px-8 py-2.5 rounded-full font-bold text-[13px] transition-all disabled:opacity-20 hover:bg-slate-50 text-slate-500 uppercase tracking-widest border border-transparent hover:border-slate-200"
              >
                {currentIndex === 0 && onPrevPart ? 'Về part trước' : 'Lùi'}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] translate-y-2 group-hover:translate-y-0">
                Phím tắt: Mũi tên trái
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
              </div>
            </div>

            <div className="px-8 font-black text-slate-600 text-sm border-x border-slate-100 min-w-[120px] text-center">
              {currentIndex + 1} <span className="mx-1 text-slate-300">/</span> {questions.length}
            </div>

            {currentIndex === questions.length - 1 ? (
              !isSubmitted ? (
                <button
                  onClick={handleFinish}
                  className="px-10 py-2.5 rounded-full font-bold text-[13px] transition-all bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-95 uppercase tracking-widest"
                >
                  Nộp bài
                </button>
              ) : null
            ) : (
              <div className="relative group">
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-10 py-2.5 rounded-full font-bold text-[13px] transition-all bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:bg-blue-700 active:scale-95 uppercase tracking-widest"
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

        const footerWrapperClass = "flex-none h-20 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[70] flex items-center justify-center pb-2 pointer-events-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)]";

        if (isFullTest && mounted && typeof document !== "undefined" && document.getElementById("bottom-nav-portal-target")) {
          return createPortal(
            <div className={footerWrapperClass}>
              {navContent}
            </div>,
            document.getElementById("bottom-nav-portal-target")!
          );
        }

        return (
          <div className={footerWrapperClass}>
            {navContent}
          </div>
        );
      })()}
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

      {/* CONFIRM MODAL */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}
