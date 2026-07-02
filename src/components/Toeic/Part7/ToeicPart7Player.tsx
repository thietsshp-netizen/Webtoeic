"use client";

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { InformationCircleIcon, CheckCircleIcon, ClockIcon, TrophyIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { Send, ChevronLeft, ChevronRight, Play, Pause, Volume2, HelpCircle, CheckCircle2, XCircle, Info, Lightbulb, Flag, GripVertical, Check, X, LayoutDashboard, Edit2, ChevronsLeftRight, PanelTopClose, ChevronsUpDown, PenLine } from "lucide-react";
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

const formatExplanation = (text: string) => {
  if (!text) return "";
  let formatted = text;
  // 1. Wrap text in single or double quotes with bold purple styling
  formatted = formatted.replace(/(['"])(.*?)(['"])/g, '<span class="font-black text-purple-600">$1$2$3</span>');

  // 2. Linkify SIDs (p1-s7, s1, etc.)
  // Matches patterns like p1-s7, s7, optionally in parentheses
  formatted = formatted.replace(/(\(?)([pP]\d+-s\d+|[sS]\d+)(\)?)/g, (match, p1, sid, p3) => {
    return `${p1}<span class="text-indigo-600 font-black cursor-pointer underline decoration-2 underline-offset-4 hover:text-indigo-800 transition-colors" onclick="window.highlightClue('${sid}')">${sid}</span>${p3}`;
  });

  return formatted;
};

const getEvidenceColor = (colorStr: string) => {
  const map: Record<string, { text: string; bg: string; border: string; lightBg: string; hexBorder: string; hexBg: string; hexText: string }> = {
    yellow: { text: "text-amber-700", bg: "bg-amber-200", border: "border-amber-300", lightBg: "bg-amber-50", hexBorder: "#fbbf24", hexBg: "#fde68a", hexText: "#92400e" },
    cyan: { text: "text-cyan-700", bg: "bg-cyan-200", border: "border-cyan-300", lightBg: "bg-cyan-50", hexBorder: "#22d3ee", hexBg: "#a5f3fc", hexText: "#155e75" },
    emerald: { text: "text-emerald-700", bg: "bg-emerald-200", border: "border-emerald-300", lightBg: "bg-emerald-50", hexBorder: "#34d399", hexBg: "#a7f3d0", hexText: "#065f46" },
    magenta: { text: "text-fuchsia-700", bg: "bg-fuchsia-200", border: "border-fuchsia-300", lightBg: "bg-fuchsia-50", hexBorder: "#e879f9", hexBg: "#f5d0fe", hexText: "#86198f" },
    orange: { text: "text-orange-700", bg: "bg-orange-200", border: "border-orange-300", lightBg: "bg-orange-50", hexBorder: "#fb923c", hexBg: "#fed7aa", hexText: "#9a3412" },
    default: { text: "text-slate-700", bg: "bg-slate-200", border: "border-slate-300", lightBg: "bg-slate-50", hexBorder: "#94a3b8", hexBg: "#e2e8f0", hexText: "#1e293b" }
  };
  return map[colorStr] || map.default;
};

const PassageHTMLRenderer = memo(({
  html,
  onSentenceHover,
  evidenceMap,
  reviewMode,
  vocabHighlights,
  isAdminMode
}: {
  html: string,
  onSentenceHover?: (sid: string | null, e?: any, rect?: any) => void,
  evidenceMap?: Record<string, { colors: string[], qNos: number[] }>,
  reviewMode: boolean,
  vocabHighlights?: { word: string, sids: string[] }[],
  isAdminMode: boolean
}) => {
  const renderedHtml = useMemo(() => {
    if (!vocabHighlights || !vocabHighlights.length) return html;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      vocabHighlights.forEach(vh => {
        const { word, sids } = vh;
        if (!word || !sids.length) return;

        sids.forEach(sid => {
          const elements = doc.querySelectorAll(`[data-sid="${sid}"], [data-sid$="-${sid}"]`);
          elements.forEach(el => {
            const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
            let node;
            const nodesToReplace = [];
            while (node = walk.nextNode()) {
              if (node.textContent?.toLowerCase().includes(word.toLowerCase())) {
                nodesToReplace.push(node);
              }
            }

            nodesToReplace.forEach(textNode => {
              const parent = textNode.parentNode;
              if (!parent) return;
              const content = textNode.textContent || "";
              const regex = new RegExp(`(\\b${word}\\b|${word})`, 'gi'); // Ưu tiên khớp nguyên từ
              const fragments = content.split(regex);

              const container = document.createDocumentFragment();
              fragments.forEach(frag => {
                if (frag.toLowerCase() === word.toLowerCase()) {
                  const mark = document.createElement('mark');
                  mark.className = "bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-black shadow-sm ring-1 ring-blue-800 mx-0.5";
                  mark.style.cssText = "text-decoration: none !important; color: white !important; display: inline !important; line-height: 1 !important;";
                  mark.textContent = frag;
                  container.appendChild(mark);
                } else if (frag) {
                  container.appendChild(document.createTextNode(frag));
                }
              });
              parent.replaceChild(container, textNode);
            });
          });
        });
      });
      return doc.body.innerHTML;
    } catch (e) {
      console.error("Vocabulary highlight error:", e);
      return html;
    }
  }, [html, vocabHighlights]);

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverCbRef = useRef(onSentenceHover);
  useEffect(() => { hoverCbRef.current = onSentenceHover; }, [onSentenceHover]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-sid]');
      if (target) {
        const rect = target.getBoundingClientRect();
        hoverCbRef.current?.(target.getAttribute('data-sid'), e, rect);
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      // Nếu di chuyển sang một element khác cũng có data-sid thì không cần làm gì
      // vì mouseover của element đó sẽ tự xử lý.
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (relatedTarget && relatedTarget.closest('[data-sid]')) return;

      // Nếu di chuyển ra ngoài hoàn toàn vùng có sid
      hoverCbRef.current?.(null, e);
    };

    el.addEventListener('mouseover', handleMouseOver);
    el.addEventListener('mouseout', handleMouseOut);

    // Tự động ẩn các hình ảnh bị lỗi (404) để giao diện sạch sẽ hơn
    const images = el.querySelectorAll('img');
    images.forEach(img => {
      img.onerror = () => {
        (img as HTMLElement).style.display = 'none';
      };
      // Nếu hình đã lỗi trước khi gắn event
      if (img.complete && img.naturalWidth === 0) {
        (img as HTMLElement).style.display = 'none';
      }
    });

    return () => {
      el.removeEventListener('mouseover', handleMouseOver);
      el.removeEventListener('mouseout', handleMouseOut);
    };
  }, [html, renderedHtml]); // Thêm renderedHtml vào deps để chạy lại khi nội dung thay đổi

  const dynamicStyles = useMemo(() => {
    if (!evidenceMap) return "";
    let css = "";
    Object.entries(evidenceMap).forEach(([sid, data]) => {
      const { colors: colorArray, qNos } = data;
      if (!Array.isArray(colorArray) || colorArray.length === 0) return;

      let backgroundStyles = "";
      let primaryColor = getEvidenceColor(colorArray[0]);

      if (colorArray.length === 1) {
        backgroundStyles = `background-color: ${primaryColor.hexBg} !important; color: ${primaryColor.hexText} !important;`;
      } else {
        const secondary = getEvidenceColor(colorArray[1]);
        const tertiary = colorArray[2] ? getEvidenceColor(colorArray[2]) : null;
        let shadow = `inset 0 -3px 0 0 ${secondary.hexBorder}`;
        if (tertiary) shadow += `, inset 0 3px 0 0 ${tertiary.hexBorder}`;

        backgroundStyles = `
          background-color: ${primaryColor.hexBg} !important; 
          color: ${primaryColor.hexText} !important;
          box-shadow: ${shadow} !important;
        `;
      }

      css += `
        [data-sid="${sid}"], [data-sid="${sid.toUpperCase()}"], [data-sid="${sid.toLowerCase()}"],
        [data-sid$="-${sid}"], [data-sid$="-${sid.toUpperCase()}"], [data-sid$="-${sid.toLowerCase()}"] {
          ${backgroundStyles}
          border-radius: 2px !important;
          transition: all 0.2s ease !important;
          position: relative !important;
        }
        [data-sid="${sid}"]::before, [data-sid="${sid.toUpperCase()}"]::before, [data-sid="${sid.toLowerCase()}"]::before,
        [data-sid$="-${sid}"]::before, [data-sid$="-${sid.toUpperCase()}"]::before, [data-sid$="-${sid.toLowerCase()}"]::before {
          content: "${qNos.join(",")}";
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          background-color: ${primaryColor.hexBg} !important;
          color: ${primaryColor.hexText} !important;
          border: 1px solid ${primaryColor.hexBorder} !important;
          border-radius: 5px !important;
          padding: 0 5px !important;
          height: 16px !important;
          min-width: 16px !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          margin-right: 6px !important;
          transform: translateY(-2px) !important;
          font-family: ui-sans-serif, system-ui, sans-serif !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }
      `;
    });
    return css;
  }, [evidenceMap, reviewMode]);


  return (
    <div className="relative">
      {/* Base hover styles cho tất cả [data-sid] - cursor pointer + darkening */}
      <style dangerouslySetInnerHTML={{
        __html: `
        [data-sid] {
          cursor: pointer !important;
          border-radius: 2px !important;
          transition: filter 0.15s ease, outline 0.15s ease !important;
        }
        [data-sid]:hover {
          filter: ${(reviewMode || isAdminMode) ? 'brightness(0.82)' : 'none'} !important;
          outline: ${(reviewMode || isAdminMode) ? '2px solid rgba(0,0,0,0.25)' : 'none'} !important;
          outline-offset: 1px !important;
        }
        /* Style cho câu văn mẫu dịch nghĩa trong Tour hướng dẫn - Chỉ kích hoạt khi đang ở bước dịch nghĩa của Tour */
        body.driver-translate-step .tour-translate-demo-target {
          position: relative !important;
          z-index: 9999999 !important;
          display: inline-block !important;
          background-color: rgba(99, 102, 241, 0.18) !important;
          outline: 2px solid rgba(99, 102, 241, 0.65) !important;
          border-radius: 4px !important;
          padding: 1px 4px !important;
        }
        /* Thu gọn khoảng cách các đoạn văn */
        .toeic-passage-content p {
          margin-top: 0.5em !important;
          margin-bottom: 0.5em !important;
        }
        /* Thu gọn khoảng cách các bảng, đặc biệt là header email/thư */
        .toeic-passage-content table {
          margin-top: 0.75em !important;
          margin-bottom: 0.75em !important;
        }
        .toeic-passage-content th, .toeic-passage-content td {
          padding-top: 0.3em !important;
          padding-bottom: 0.3em !important;
        }
        .toeic-passage-content td p, .toeic-passage-content th p {
          margin-top: 0.1em !important;
          margin-bottom: 0.1em !important;
        }
        .toeic-passage-content hr {
          margin-top: 1em !important;
          margin-bottom: 1em !important;
        }
        /* Căn giữa các thành phần nếu chúng có width cố định (như khung tin nhắn) */
        .toeic-passage-content > * {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* Tự động căn giữa và giãn rộng các div có border hoặc mockup điện thoại theo khung chứa */
        .toeic-passage-content div[style*="width"], 
        .toeic-passage-content div[style*="max-width"] {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* Fix absolute elements đè lên chữ (như logo River Street Hotel) */
        .toeic-passage-content div[style*="position: absolute"],
        .toeic-passage-content div[style*="position:absolute"],
        .toeic-passage-content span[style*="position: absolute"],
        .toeic-passage-content span[style*="position:absolute"] {
          position: relative !important;
          float: right !important;
          bottom: auto !important;
          right: auto !important;
          margin-top: 10px !important;
          margin-bottom: 10px !important;
          clear: both !important;
        }
        /* Hủy bỏ thước cuộn dọc riêng và giới hạn chiều cao nội bộ trong đoạn văn */
        .toeic-passage-content div[style*="overflow-y"],
        .toeic-passage-content div[style*="overflow-y: auto"],
        .toeic-passage-content div[style*="max-height"] {
          max-height: none !important;
          overflow-y: visible !important;
        }
      ` }} />
      {dynamicStyles && <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />}
      <div
        ref={containerRef}
        className="toeic-passage-content prose prose-slate prose-p:first:mt-0 prose-headings:first:mt-0 max-w-none text-[17px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
});
PassageHTMLRenderer.displayName = "PassageHTMLRenderer";

interface ToeicPart7PlayerProps {
  data: any[];
  lessonId?: string;
  initialProgress?: Record<string, any>;
  courseId?: string;
  nextLessonId?: string;
  onFinish?: (results: any) => void;
  isReviewMode?: boolean;
  isSubmitted?: boolean;
  targetQuestionId?: string;
  targetQuestionType?: string;
  onProgressChange?: (progress: Record<string, any>) => void;
  isFullTest?: boolean;
  onResolved?: () => void;
  onNextPart?: () => void;
  onPrevPart?: () => void;
  onToggleFlag?: (questionId: string, flag: boolean, color?: FlagColor | null, note?: string) => void;
  onActiveQuestionChange?: (questionNo: number) => void;
  jumpTo?: { id: string; ts: number } | null;
  globalOffset?: number;
  globalTotal?: number;
  videoExplanation?: any;
  onVideoQuestionSync?: (questionNo: number) => void;
  onToggleVideo?: () => void;
  videoOpen?: boolean;
}

export default function ToeicPart7Player({
  data: rawData,
  lessonId,
  courseId,
  nextLessonId,
  initialProgress = {},
  onFinish,
  isReviewMode = false,
  isSubmitted = false,
  onResolved,
  targetQuestionId,
  targetQuestionType,
  onProgressChange,
  isFullTest,
  onNextPart,
  onPrevPart,
  onToggleFlag,
  onActiveQuestionChange,
  jumpTo,
  globalOffset = 0,
  globalTotal,
  videoExplanation: videoExplanationRaw,
  onVideoQuestionSync,
  onToggleVideo,
  videoOpen
}: ToeicPart7PlayerProps) {
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

  // Logic for Clue Connector (Clickable SIDs in explanations)
  useEffect(() => {
    // Inject global styles for the focus effect
    const styleId = 'toeic-clue-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .highlight-focus {
          box-shadow: 0 0 0 4px #8b5cf6 !important;
          background-color: rgba(139, 92, 246, 0.15) !important;
          border-radius: 4px !important;
          z-index: 50 !important;
          position: relative !important;
          transition: all 0.3s ease !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    (window as any).highlightClue = (sid: string) => {
      // Find all elements matching the SID
      const elements = document.querySelectorAll(`[data-sid="${sid}"], [data-sid$="-${sid}"], [data-sid$="-${sid.toLowerCase()}"], [data-sid$="-${sid.toUpperCase()}"]`);

      if (elements.length > 0) {
        const el = elements[0] as HTMLElement;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Add a temporary focus effect
        el.classList.add('highlight-focus');
        setTimeout(() => el.classList.remove('highlight-focus'), 3000);
      }
    };
  }, []);

  const data = useMemo(() => {
    if (!rawData) return [];

    let processed = rawData.map((g: any) => {
      // ... (logic parse JSON giữ nguyên)
      let parsedJson: any = {};
      let rawText = (g.passageText || "").trim();
      if (rawText.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawText);
          parsedJson = Array.isArray(parsed) ? { passages: parsed } : parsed;
        } catch (e) { }
      }

      // Handle both 'questions' (plural) and 'question' (singular)
      const questionsFromJson = parsedJson.questions || (parsedJson.question ? (Array.isArray(parsedJson.question) ? parsedJson.question : [parsedJson.question]) : []);
      const dbQuestions = g.questions || [];
      const sourceQuestions = questionsFromJson.length > 0 ? questionsFromJson : dbQuestions;

      const finalQuestions = sourceQuestions.map((q: any, idx: number) => {
        // ... (logic mapping giữ nguyên nhưng dùng sourceQuestions)
        const dbMatch = dbQuestions.find((dbQ: any) =>
          String(dbQ.questionNo) === String(q.questionNo || q.question_no || q.number || q.qNo)
        ) || dbQuestions[idx];

        let meta = q.metadata;
        if (typeof meta === 'string' && meta.trim().startsWith('{')) {
          try { meta = JSON.parse(meta); } catch (e) { }
        }
        let expl = q.explanation;
        if (typeof expl === 'string' && expl.trim().startsWith('{')) {
          try { expl = JSON.parse(expl); } catch (e) { }
        }
        const mOptions = q.options || meta?.options || {};
        const finalOptions = {
          A: q.optionA || mOptions.A || meta?.optionA || q.option_a || "",
          B: q.optionB || mOptions.B || meta?.optionB || q.option_b || "",
          C: q.optionC || mOptions.C || meta?.optionC || q.option_c || "",
          D: q.optionD || mOptions.D || meta?.option_d || q.option_d || ""
        };
        const finalOptionsVn = q.options_vn || meta?.options_vn || meta?.vietnamese?.options || {};

        return {
          ...q,
          id: dbMatch?.id || q.id || `q-${g.id}-${idx}`,
          dbId: dbMatch?.id,
          groupId: g.id,
          questionText: q.questionText || q.question_text || meta?.questionText || q.text || "",
          questionText_vn: q.questionText_vn || meta?.questionText_vn || meta?.vietnamese?.question || "",
          correctAnswer: q.correctAnswer || q.correct_answer || meta?.correctAnswer || q.answer || "",
          options: finalOptions,
          options_vn: finalOptionsVn,
          metadata: meta,
          explanation: expl || meta?.explanation || meta?.vietnamese?.explanation || {},
          type: q.type || meta?.type || "Detail",
          isTarget: q.isTarget // GIỮ LẠI NHÃN MỤC TIÊU TỪ LOADER
        };
      });

      let finalPassages = parsedJson.passages || g.passages || [];
      if (finalPassages.length === 0 && rawText && !rawText.startsWith('{')) {
        finalPassages = [{ html_content: rawText, type: "Reading" }];
      }

      return {
        ...g,
        passages: finalPassages,
        groupMetadata: parsedJson.group_metadata || g.metadata || {},
        questions: finalQuestions
      };
    }).filter((g: any) => g.questions && g.questions.length > 0);

    // Ghi chú: Việc lọc theo targetQuestionType hiện đã được xử lý triệt để ở ToeicPart7Loader (Server-side)
    // Player chỉ việc hiển thị dữ liệu đã được Loader chuẩn bị sẵn.
    return processed;
  }, [rawData, targetQuestionType, isFullTest, isReviewMode]);


  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <ClockIcon className="w-12 h-12 animate-pulse" />
        <p className="font-medium">Đang tải câu hỏi Part 7...</p>
      </div>
    );
  }
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
    const safeProgress = initialProgress || {};
    Object.keys(safeProgress).forEach(k => {
      acc[k] = safeProgress[k].isFlagged ? (safeProgress[k].flagColor || 'RED') : null;
    });
    return acc;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    let acc: any = {};
    const safeProgress = initialProgress || {};
    Object.keys(safeProgress).forEach(k => {
      if (safeProgress[k]?.flagNote) acc[k] = safeProgress[k].flagNote;
    });
    return acc;
  });

  useEffect(() => {
    if (initialProgress) {
      const newFlags: Record<string, FlagColor | null> = {};
      const newNotes: Record<string, string> = {};
      Object.entries(initialProgress).forEach(([qId, prog]: [string, any]) => {
        if (prog.isFlagged) newFlags[qId] = prog.flagColor || 'RED';
        if (prog.flagNote) newNotes[qId] = prog.flagNote;
      });
      setFlags(newFlags);
      setNotes(newNotes);
    }
  }, [initialProgress]);

  const [hintsActive, setHintsActive] = useState<Record<string, boolean>>({});
  const [showExplainGroups, setShowExplainGroups] = useState<Record<string, boolean>>({});
  const [showOptionsTranslationGroups, setShowOptionsTranslationGroups] = useState<Record<string, boolean>>({});
  const [time, setTime] = useState(0);
  const [reviewMode, setReviewMode] = useState(isReviewMode || isSubmitted);
  const { isAdminMode } = useAdminEdit();
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSubmittedInternal, setIsSubmittedInternal] = useState(isSubmitted);
  const [testScore, setTestScore] = useState({ correct: 0, total: 0, incorrect: 0, unanswered: 0 });
  const [tooltip, setTooltip] = useState<{ text: string, rect: DOMRect, sid: string } | null>(null);
  const tooltipTimeoutRef = useRef<any>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Lắng nghe sự kiện từ Tour để tự động mở bung Sidebar làm ví dụ
  useEffect(() => {
    const handleTourSidebar = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsSidebarHovered(customEvent.detail.open);
    };

    const handleEvidenceMode = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.open) {
        if (data && data[currentIndex]?.questions?.length > 0) {
          const firstQ = data[currentIndex].questions[0];
          const qKey = getQuestionKey(firstQ);
          setHintsActive(prev => ({ ...prev, [qKey]: true }));
        }
      } else {
        setHintsActive({});
      }
    };

    window.addEventListener("toeic-tour-sidebar", handleTourSidebar);
    window.addEventListener("toeic-tour-evidence-mode", handleEvidenceMode);
    
    return () => {
      window.removeEventListener("toeic-tour-sidebar", handleTourSidebar);
      window.removeEventListener("toeic-tour-evidence-mode", handleEvidenceMode);
    };
  }, [currentIndex, data]);

  // Split View States
  const [isSplitView, setIsSplitView] = useState(false);
  const [splitHeight, setSplitHeight] = useState(50);
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const isResizingSplitRef = useRef(false);
  const passageScrollRefBottom = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const questionsScrollRef = useRef<HTMLDivElement>(null);
  const passageScrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Tự động cuộn lên đầu hoặc tới câu mục tiêu khi chuyển câu (group)
  useEffect(() => {
    if (passageScrollRef.current) passageScrollRef.current.scrollTop = 0;

    const questions = data[currentIndex]?.questions || [];
    const normalize = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, '');

    // Tìm câu mục tiêu dựa trên nhãn isTarget đã được Loader dán sẵn
    const targetQ = questions.find((q: any) => q.isTarget);

    if (targetQ) {
      setActiveQuestionId(targetQ.id);
      setTimeout(() => {
        // Tìm element dựa trên ID (có thể là questionNo hoặc CUID)
        const el = document.getElementById(`question-${targetQ.questionNo}`) ||
          document.getElementById(`question-${targetQ.id}`) ||
          document.querySelector(`[id$="-${targetQ.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } else {
      if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;
      if (questions[0]) {
        setActiveQuestionId(questions[0].id);
      }
    }
  }, [currentIndex, data?.length, targetQuestionType]);

  // Sync with parent submission state
  useEffect(() => {
    if (isSubmitted) {
      setIsSubmittedInternal(true);
      setReviewMode(true);
    }
  }, [isSubmitted]);

  // Notify parent of progress changes - Debounced or stable
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onProgressChange) {
        const progress: Record<string, any> = {};
        const allIds = new Set([...Object.keys(answers), ...Object.keys(flags)]);
        allIds.forEach(id => {
          progress[id] = {
            userAnswer: answers[id] || null,
            isFlagged: !!flags[id],
            flagColor: flags[id] || null,
            flagNote: notes[id] || null,
            isCorrect: false
          };
        });
        onProgressChange(progress);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [answers, flags, notes, onProgressChange]);

  // Nhảy tới câu hỏi từ URL (?q=...) hoặc Full Test Sidebar
  useEffect(() => {
    if (jumpTo?.id && data.length > 0) {
      const targetId = String(jumpTo.id);

      // Tìm nhóm chứa câu hỏi (hỗ trợ cả DB ID và questionNo)
      const idx = data.findIndex(g =>
        g.questions?.some((q: any) =>
          String(q.id) === targetId ||
          String(q.dbId) === targetId ||
          String(q.questionNo) === targetId
        )
      );

      if (idx !== -1) {
        setCurrentIndex(idx);

        // Tìm câu hỏi cụ thể trong nhóm đó để highlight
        const targetQ = data[idx].questions.find((q: any) =>
          String(q.id) === targetId ||
          String(q.dbId) === targetId ||
          String(q.questionNo) === targetId
        );

        if (targetQ) {
          setActiveQuestionId(targetQ.id);
        }

        // Đợi một chút để group mới render xong rồi cuộn
        setTimeout(() => {
          // Thử tìm theo ID DOM (chứa questionNo hoặc CUID)
          const el = document.getElementById(`question-${targetId}`) ||
            document.querySelector(`[id$="-${targetId}"]`) ||
            document.querySelector(`[id^="question-"][id$="-${targetId}"]`);

          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Thêm hiệu ứng highlight nhẹ
            el.classList.add('ring-4', 'ring-indigo-400', 'ring-offset-4', 'rounded-2xl', 'z-10');
            setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-400', 'ring-offset-4'), 3000);
          }
        }, 400);
      }
    }
  }, [jumpTo, data]);

  useEffect(() => {
    setMounted(true);
    // Tự động khởi chạy tour hướng dẫn học Part 7 lần đầu
    startToeicPartTour(7);
  }, []);



  useEffect(() => {
    const q = data[currentIndex]?.questions?.[0];
    if (onActiveQuestionChange && q?.questionNo) {
      onActiveQuestionChange(q.questionNo);
    }
  }, [currentIndex, data, onActiveQuestionChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const [leftWidth, setLeftWidth] = useState(45);
  const isDragging = useRef(false);

  const currentGroup = data[currentIndex] || { questions: [], passages: [], groupMetadata: {} };
  const passages = currentGroup.passages || [];
  const groupMetadata = currentGroup.groupMetadata || {};
  const questions = currentGroup.questions || [];
  const isRevealed = reviewMode || !!showExplainGroups[currentGroup.id];
  const isTranslationRevealed = isRevealed || !!showOptionsTranslationGroups[currentGroup.id];

  const getQuestionKey = useCallback((q: any) => {
    return q.id || `${q.groupId || currentGroup?.id}_${q.questionNo}`;
  }, [currentGroup?.id]);

  const fullEvidenceMap = useMemo(() => {
    const map: Record<string, { colors: string[], qNos: number[] }> = {};
    const colors = ['yellow', 'cyan', 'emerald', 'magenta', 'orange'];
    questions.forEach((q: any, idx: number) => {
      const color = colors[idx % colors.length];
      const rawSids = q.evidence_sids || q.metadata?.evidence_sids || q.explanation?.evidence_sids || [];
      const sids = Array.isArray(rawSids) ? rawSids : [rawSids];

      sids.forEach((sid: any) => {
        if (sid === undefined || sid === null) return;
        const s = String(sid);
        if (!map[s]) map[s] = { colors: [], qNos: [] };
        if (!map[s].colors.includes(color)) map[s].colors.push(color);
        if (!map[s].qNos.includes(q.questionNo)) map[s].qNos.push(q.questionNo);
      });
    });
    return map;
  }, [questions]);

  const analyzeEvidence = (sids: string[]) => {
    const passageIds = new Set<string>();
    sids.forEach(sid => {
      if (!sid) return;
      const s = String(sid).toLowerCase();
      // Look for passage identifiers like p1, p2, passage1, etc.
      const match = s.match(/^p(\d+)-/);
      if (match) {
        passageIds.add(match[1]);
      } else {
        passageIds.add('1'); // Default to passage 1
      }
    });
    return Array.from(passageIds);
  };

  const handleToggleHint = (qKey: string, question: any) => {
    const isNowActive = !hintsActive[qKey];
    setHintsActive(prev => ({ ...prev, [qKey]: isNowActive }));

    if (isNowActive) {
      const rawSids = question.evidence_sids || question.metadata?.evidence_sids || question.explanation?.evidence_sids || [];
      const sids = Array.isArray(rawSids) ? rawSids : [rawSids];
      const pIds = analyzeEvidence(sids);

      if (pIds.length >= 2) {
        setIsSplitView(true);
        // Set timeout to wait for React to render the split view refs
        setTimeout(() => {
          // Find first sid for top pane
          const topSid = sids.find(s => String(s).toLowerCase().startsWith(`p${pIds[0]}-`)) || sids[0];
          // Find second sid for bottom pane
          const bottomSid = sids.find(s => String(s).toLowerCase().startsWith(`p${pIds[1]}-`)) || sids[1];

          if (topSid && passageScrollRef.current) {
            const el = passageScrollRef.current.querySelector(`[data-sid="${topSid}"]`) || passageScrollRef.current.querySelector(`[data-sid="${topSid.toUpperCase()}"]`) || passageScrollRef.current.querySelector(`[data-sid="${topSid.toLowerCase()}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          if (bottomSid && passageScrollRefBottom.current) {
            const el = passageScrollRefBottom.current.querySelector(`[data-sid="${bottomSid}"]`) || passageScrollRefBottom.current.querySelector(`[data-sid="${bottomSid.toUpperCase()}"]`) || passageScrollRefBottom.current.querySelector(`[data-sid="${bottomSid.toLowerCase()}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else if (pIds.length === 1) {
        setIsSplitView(false);
        setTimeout(() => {
          if (sids[0] && passageScrollRef.current) {
            const sid = sids[0];
            const el = passageScrollRef.current.querySelector(`[data-sid="${sid}"]`) || passageScrollRef.current.querySelector(`[data-sid="${sid.toUpperCase()}"]`) || passageScrollRef.current.querySelector(`[data-sid="${sid.toLowerCase()}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } else {
      setIsSplitView(false);
    }
  };

  const combinedEvidenceMap = useMemo(() => {
    if (isRevealed) return fullEvidenceMap;
    const map: Record<string, { colors: string[], qNos: number[] }> = {};
    const colors = ['yellow', 'cyan', 'emerald', 'magenta', 'orange'];
    questions.forEach((q: any, idx: number) => {
      const qKey = getQuestionKey(q);
      if (hintsActive[qKey]) {
        const color = colors[idx % colors.length];
        const rawSids = q.evidence_sids || q.metadata?.evidence_sids || q.explanation?.evidence_sids || [];
        const sids = Array.isArray(rawSids) ? rawSids : [rawSids];

        sids.forEach((sid: any) => {
          if (sid === undefined || sid === null) return;
          const s = String(sid);
          if (!map[s]) map[s] = { colors: [], qNos: [] };
          if (!map[s].colors.includes(color)) map[s].colors.push(color);
          if (!map[s].qNos.includes(q.questionNo)) map[s].qNos.push(q.questionNo);
        });
      }
    });
    return map;
  }, [isRevealed, fullEvidenceMap, questions, hintsActive]);

  const translationMap = useMemo(() => {
    const map: Record<string, string> = {};
    passages.forEach((p: any) => {
      if (p.translation_map) Object.assign(map, p.translation_map);
    });
    return map;
  }, [passages]);

  // Tự động gán nhãn .tour-translate-demo-target cho câu bằng chứng đầu tiên ngay khi mount/questions thay đổi (chờ 500ms để HTML render xong)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (questions.length > 0) {
        // Xóa nhãn cũ nếu có
        document.querySelectorAll('.tour-translate-demo-target').forEach(el => {
          el.classList.remove('tour-translate-demo-target');
        });

        const firstQ = questions[0];
        const rawSids = firstQ?.evidence_sids || firstQ?.metadata?.evidence_sids || firstQ?.explanation?.evidence_sids || [];
        const sids = Array.isArray(rawSids) ? rawSids : [rawSids];
        const targetSid = sids[0] || "s1";

        const sentenceEl = document.querySelector(`.toeic-passage-content [data-sid="${targetSid}"]`) ||
                           document.querySelector(`.toeic-passage-content [data-sid="${targetSid.toUpperCase()}"]`) ||
                           document.querySelector(`.toeic-passage-content [data-sid="${targetSid.toLowerCase()}"]`) ||
                           document.querySelector('.toeic-passage-content [data-sid]');

        if (sentenceEl) {
          sentenceEl.classList.add('tour-translate-demo-target');
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [questions.length, currentIndex]);

  useEffect(() => {
    const handleTranslateMode = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.open) {
        // Tìm câu bằng chứng đầu tiên của câu hỏi đầu tiên
        const firstQ = questions[0];
        const rawSids = firstQ?.evidence_sids || firstQ?.metadata?.evidence_sids || firstQ?.explanation?.evidence_sids || [];
        const sids = Array.isArray(rawSids) ? rawSids : [rawSids];
        const targetSid = sids[0] || "s3";

        const sentenceEl = document.querySelector(`.toeic-passage-content [data-sid="${targetSid}"]`) ||
                           document.querySelector(`.toeic-passage-content [data-sid="${targetSid.toUpperCase()}"]`) ||
                           document.querySelector(`.toeic-passage-content [data-sid="${targetSid.toLowerCase()}"]`) ||
                           document.querySelector('.toeic-passage-content [data-sid].tour-translate-demo-target') ||
                           document.querySelector('.toeic-passage-content [data-sid]') as HTMLElement;

        if (sentenceEl) {
          const sid = sentenceEl.getAttribute('data-sid') || String(targetSid);
          const rect = sentenceEl.getBoundingClientRect();
          // Lấy bản dịch hoặc dùng text mặc định nếu chưa có
          const text = translationMap[sid] || "Đây là bản dịch tiếng Việt minh hoạ cho câu văn này. Trong thực tế, bạn chỉ cần lướt chuột qua bất kỳ câu nào để xem nghĩa.";
          
          sentenceEl.classList.add('tour-translate-demo-target');
          setTooltip({ text, rect, sid });
        }
      } else {
        // Không xóa class .tour-translate-demo-target ở đây để tránh Race Condition khiến driver.js không tìm thấy element khi chuyển bước.
        // Chỉ ẩn tooltip đi là đủ.
        setTooltip(null);
      }
    };

    window.addEventListener("toeic-tour-translate-mode", handleTranslateMode);
    return () => window.removeEventListener("toeic-tour-translate-mode", handleTranslateMode);
  }, [translationMap, questions]);

  useEffect(() => {
    if (reviewMode || showCompletion) return;
    const timer = setInterval(() => setTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [reviewMode, showCompletion]);

  // Luôn luôn highlight từ vựng trong đoạn văn để học viên dễ tìm (giống thi thật)
  const vocabHighlights = useMemo(() => {
    const list: { word: string, sids: string[] }[] = [];
    questions.forEach((q: any) => {
      const text = q.questionText || "";
      // Tìm từ trong ngoặc kép cho câu hỏi Từ vựng
      const match = text.match(/The word\s+["“]([^"”]+)["”]/i) || text.match(/["“]([^"”]+)["”]\s+is closest/i);
      if (match && match[1] && match[1].length < 15) {
        const sids = q.evidence_sids || q.metadata?.evidence_sids || q.explanation?.evidence_sids || [];
        list.push({
          word: match[1],
          sids: Array.isArray(sids) ? sids : [sids]
        });
      }
    });
    return list;
  }, [questions]);

  const handleSentenceHover = useCallback((sid: string | null, e: any, rect: any) => {
    // Nếu đang chạy hướng dẫn nhanh (Tour), hoàn toàn bỏ qua các sự kiện di chuột để tránh làm mất hiển thị giả lập của Tour
    if (typeof document !== "undefined" && document.body.classList.contains("driver-active")) {
      return;
    }

    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);

    if (!sid || (!isRevealed && !isAdminMode)) {
      if (isAdminMode) {
        // Cho Admin một khoảng trễ để kịp di chuyển chuột vào tooltip
        tooltipTimeoutRef.current = setTimeout(() => {
          setTooltip(null);
        }, 300);
      } else {
        setTooltip(null);
      }
      return;
    }
    const text = translationMap[sid];
    if (text) {
      setTooltip({ text, rect, sid });
    } else {
      setTooltip(null);
    }
  }, [translationMap, isRevealed, isAdminMode]);

  // DRAG HANDLERS
  const handleMouseDown = () => { isDragging.current = true; setIsResizing(true); document.body.style.cursor = 'col-resize'; };
  const handleTouchStart = () => { isDragging.current = true; setIsResizing(true); };
  const handleToggleFlag = async (questionId: string, color: FlagColor | null, note?: string) => {
    // Tìm câu hỏi thực tế để lấy dbId
    let targetDbId = questionId;
    data.forEach(g => {
      const found = g.questions.find((q: any) => q.id === questionId || q.dbId === questionId);
      if (found?.dbId) targetDbId = found.dbId;
    });

    setFlags(prev => ({ ...prev, [questionId]: color }));
    if (note !== undefined) setNotes(prev => ({ ...prev, [questionId]: note }));

    try {
      const response = await fetch('/api/progress/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'flag',
          questionId: targetDbId, // Dùng ID thật
          lessonId,
          courseId,
          isFlagged: !!color,
          flagColor: color,
          flagNote: note !== undefined ? note : notes[questionId]
        })
      });
    } catch (e: any) {
      console.error("[Part 7 Flag Fetch Error]", e.message);
    }
    if (onToggleFlag) onToggleFlag(questionId, !!color, color, note !== undefined ? note : notes[questionId]);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const percentage = (e.clientX / window.innerWidth) * 100;
        if (percentage > 20 && percentage < 80) setLeftWidth(percentage);
      }
      if (isResizingSplitRef.current) {
        const container = passageScrollRef.current?.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          const yOffset = e.clientY - rect.top;
          const percentage = (yOffset / rect.height) * 100;
          if (percentage > 20 && percentage < 80) setSplitHeight(percentage);
        }
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      if (isDragging.current) {
        const percentage = (touch.clientX / window.innerWidth) * 100;
        if (percentage > 20 && percentage < 80) setLeftWidth(percentage);
      }
      if (isResizingSplitRef.current) {
        const container = passageScrollRef.current?.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          const yOffset = touch.clientY - rect.top;
          const percentage = (yOffset / rect.height) * 100;
          if (percentage > 20 && percentage < 80) setSplitHeight(percentage);
        }
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      setIsResizing(false);
      isResizingSplitRef.current = false;
      setIsResizingSplit(false);
      document.body.style.cursor = 'default';
    };
    const handleTouchEnd = () => {
      isDragging.current = false;
      setIsResizing(false);
      isResizingSplitRef.current = false;
      setIsResizingSplit(false);
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

  const handleFinishTest = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return;
    setIsSubmitting(true);
    let correct = 0; let total = 0; let unanswered = 0;
    const attempts: any[] = [];

    data.forEach(g => {
      g.questions.forEach((q: any) => {
        total++;
        const qKey = getQuestionKey(q);
        const ans = answers[qKey] || "";
        if (!ans) {
          unanswered++;
        } else {
          const isCorrect = ans === q.correctAnswer;
          if (isCorrect) correct++;
          attempts.push({
            questionId: q.dbId || q.id || qKey,
            lessonId,
            userAnswer: ans,
            isCorrect,
            isFlagged: !!flags[q.id],
            flagColor: flags[q.id] || null,
            flagNote: notes[q.id] || null
          });
        }
      });
    });

    setTestScore({ correct, total, incorrect: total - correct - unanswered, unanswered });

    if (lessonId && attempts.length > 0) {
      try {
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
      } catch (e) {
        console.error("Lỗi nộp bài:", e);
      }
    }

    setIsSubmittedInternal(true);
    setReviewMode(true);
    setShowCompletion(true);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.3 } });
    if (onFinish) onFinish(answers);
    setIsSubmitting(false);
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
            <button onClick={() => window.location.reload()} className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-indigo-600 text-white shadow-[0_10px_20_rgba(79,70,229,0.2)] font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
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

  const totalQuestions = data.flatMap(g => g.questions).length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="absolute inset-0 flex flex-col font-sans bg-[#f8fafc] text-slate-800 overflow-hidden pr-20">
      {/* HEADER */}
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-8 bg-white shrink-0 z-20 w-full">
        <div className="flex flex-col">
          <h1 className="font-black text-slate-800 text-[12px] uppercase tracking-widest">
            {groupMetadata.intro_text || "Reading Comprehension"}
          </h1>
          {isRevealed && groupMetadata.intro_text_vn && (
            <p className="text-[10px] text-slate-400 font-medium italic -mt-0.5">{groupMetadata.intro_text_vn}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            id="split-view-btn"
            onClick={() => setIsSplitView(prev => !prev)}
            title="Chia ngang đoạn văn"
            className={`flex items-center justify-center p-2 rounded-xl transition-all ${isSplitView ? 'bg-indigo-100 text-indigo-600 shadow-sm border border-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <PanelTopClose className="w-4 h-4" />
          </button>
          <button
            id="reveal-btn"
            onClick={() => setShowExplainGroups(prev => ({ ...prev, [currentGroup.id]: !prev[currentGroup.id] }))}
            title="Ẩn/Hiện lời giải (Phím tắt: ctrl/cmd + shift + s)"
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${showExplainGroups[currentGroup.id] ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <InformationCircleIcon className="w-4 h-4" />
            {showExplainGroups[currentGroup.id] ? 'Ẩn lời giải' : 'Hiện lời giải'}
          </button>
        </div>
      </div>

      {/* MAIN WORK AREA */}
      <div className="flex-1 flex overflow-hidden relative w-full">
        {/* COLUMN 1: PASSAGES */}
        <div
          id="toeic-passage-container-target"
          className="border-r border-slate-100 bg-white flex flex-col flex-none relative"
          style={{ width: `${leftWidth}%`, flexShrink: 0 }}
        >
          {/* TOP OR SINGLE PASSAGE PANE */}
          <div
            id="part7-passage-container-top"
            ref={passageScrollRef}
            className="overflow-y-auto scrollbar-thin select-text webtoeic-scroll-container"
            style={{ height: isSplitView ? `${splitHeight}%` : '100%', flex: isSplitView ? 'none' : '1' }}
          >
            <div className="p-10 space-y-16 pb-[35vh]">
              {passages.map((p: any, idx: number) => (
                <div key={idx} className="relative animate-in fade-in duration-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black tracking-[0.3em] text-slate-200 uppercase">PASSAGE {idx + 1}</span>
                      <div className="h-px w-20 bg-slate-50" />
                      <AdminInlineEditor
                        target="group"
                        id={currentGroup.id}
                        field="type"
                        value={p.type || ""}
                      >
                        <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black rounded-full uppercase border border-slate-100">{p.type || "Reading"}</span>
                      </AdminInlineEditor>
                    </div>
                    {isAdminMode && (
                      <div className="flex gap-2">
                        <AdminInlineEditor
                          target="group"
                          id={currentGroup.id}
                          field="passageText"
                          value={currentGroup.passageText || ""}
                          multiline
                        >
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-400 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider shadow-sm border border-slate-100">
                            <Edit2 size={12} /> Sửa nguồn (HTML)
                          </button>
                        </AdminInlineEditor>
                      </div>
                    )}
                  </div>
                  <PassageHTMLRenderer
                    html={p.html_content}
                    onSentenceHover={handleSentenceHover}
                    evidenceMap={combinedEvidenceMap}
                    reviewMode={isRevealed}
                    vocabHighlights={vocabHighlights}
                    isAdminMode={isAdminMode}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* HORIZONTAL SPLIT RESIZER */}
          {isSplitView && (
            <div
              className={`h-2 flex-none bg-slate-100 hover:bg-indigo-100 border-y border-slate-200 flex items-center justify-center cursor-row-resize transition-colors ${isResizingSplit ? 'bg-indigo-200 border-indigo-300' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingSplit(true);
                isResizingSplitRef.current = true;
                document.body.style.cursor = 'row-resize';
              }}
              onTouchStart={() => {
                setIsResizingSplit(true);
                isResizingSplitRef.current = true;
              }}
            >
              <ChevronsUpDown size={14} className="text-slate-400" />
            </div>
          )}

          {/* BOTTOM PASSAGE PANE */}
          {isSplitView && (
            <div
              id="part7-passage-container-bottom"
              ref={passageScrollRefBottom}
              className="overflow-y-auto scrollbar-thin select-text flex-1 webtoeic-scroll-container"
            >
              <div className="p-10 space-y-16 pb-[35vh]">
                {passages.map((p: any, idx: number) => (
                  <div key={`bottom-${idx}`} className="relative animate-in fade-in duration-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black tracking-[0.3em] text-slate-200 uppercase">PASSAGE {idx + 1}</span>
                        <div className="h-px w-20 bg-slate-50" />
                        <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black rounded-full uppercase border border-slate-100">{p.type || "Reading"}</span>
                      </div>
                    </div>
                    <PassageHTMLRenderer
                      html={p.html_content}
                      onSentenceHover={handleSentenceHover}
                      evidenceMap={combinedEvidenceMap}
                      reviewMode={isRevealed}
                      vocabHighlights={vocabHighlights}
                      isAdminMode={false} // Disable admin edit in bottom pane to prevent duplicate editors
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RESIZER BAR */}
        <div
          className="group relative w-2 hover:w-4 flex items-center justify-center transition-all z-30"
        >
          <div className={`w-[2px] h-full transition-colors ${isResizing ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-indigo-400'}`}></div>
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 shadow-xl flex items-center justify-center transition-all cursor-col-resize ${isResizing ? 'border-indigo-500 scale-110 shadow-indigo-200' : 'border-slate-200 group-hover:border-indigo-400 group-hover:scale-105'}`}
          >
            <ChevronsLeftRight className={`w-5 h-5 ${isResizing ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
          </div>
        </div>
        {/* COLUMN 2: QUESTIONS (Full width expansion) */}
        <div className="flex-1 min-h-0 relative flex flex-col min-w-[400px]">
          <div id="part7-questions-container" ref={questionsScrollRef} className="flex-1 overflow-y-auto bg-white scrollbar-thin scroll-smooth select-text webtoeic-scroll-container">
            <div className="p-10 space-y-6 pb-[35vh] w-full">
              {questions.map((q: any, qIdx: number) => {
                const colors = ['yellow', 'cyan', 'emerald', 'magenta', 'orange'];
                const cColors = getEvidenceColor(colors[qIdx % colors.length]);
                const qKey = getQuestionKey(q);
                const userAns = answers[qKey];

                const isTarget = q.isTarget;

                return (
                  <div
                    key={`${q.id || qKey}-${qIdx}`}
                    id={`question-${q.questionNo}`}
                    className="relative group/q animate-in slide-in-from-bottom-4 duration-500 rounded-[32px] transition-all p-4 border-2 border-transparent hover:bg-white hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50"
                  >
                    <div className="flex items-start gap-4">
                      {/* Left Column: Small Number + Tools */}
                      <div className="flex flex-col items-center gap-4 shrink-0 pt-1 w-12">
                        <div className={`w-10 h-10 rounded-xl ${cColors.bg} flex items-center justify-center shrink-0 font-black text-sm ${cColors.text} shadow-sm border ${cColors.border}`}>
                          {q.questionNo}
                        </div>

                        {mounted && (
                          <div className="flex flex-col items-center gap-3">
                            <button
                              onClick={() => handleToggleHint(qKey, q)}
                              className={`hint-active-lightbulb p-2 rounded-xl transition-all duration-300 ${hintsActive[qKey]
                                ? "bg-yellow-400 text-white shadow-lg shadow-yellow-200"
                                : "bg-white text-slate-300 border border-slate-100 hover:text-yellow-500 hover:border-yellow-200"
                                }`}
                              title="Xem câu gợi ý trong đoạn văn"
                            >
                              <Lightbulb size={18} fill={hintsActive[qKey] ? "currentColor" : "none"} />
                            </button>
                            <FlagSelector
                              isFlagged={!!flags[q.id]}
                              flagColor={(flags[q.id] || null) as FlagColor | null}
                              flagNote={notes[q.id] || ""}
                              onToggle={(color: FlagColor | null, note?: string) => handleToggleFlag(q.id, color, note)}
                              onUnflag={(deleteNote: boolean) => handleToggleFlag(q.id, null, deleteNote ? "" : undefined)}
                              compact={true}
                              layout="vertical"
                            />
                          </div>
                        )}
                      </div>

                      {/* Right Column: Question Content + Options */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[17px] font-bold text-slate-900 leading-snug">
                          <AdminInlineEditor
                            target="question"
                            id={q.id}
                            field="questionText"
                            value={q.questionText || ""}
                          >
                            {(() => {
                              const text = q.questionText || "";

                              // Xử lý cho dạng Sentence Insertion (Chèn câu)
                              // Thường có pattern: [1], [2], [3], [4]
                              if (text.includes('[1]') || text.includes('[2]')) {
                                // Trích xuất câu văn cần chèn (thường nằm trong ngoặc kép sau đoạn text hướng dẫn)
                                const targetMatch = text.match(/["“]([^"”]{10,})["”]/);
                                const targetSentence = targetMatch ? targetMatch[1] : (q.metadata?.target_sentence || q.metadata?.sentence);

                                // Tách text và biến các [1-4] thành Badge
                                const parts = text.split(/(\[[1-4]\])/g);

                                return (
                                  <div className="space-y-4">
                                    <div className="leading-relaxed text-[17px] font-bold text-slate-900">
                                      {parts.map((part: string, i: number) => {
                                        const posMatch = part.match(/^\[([1-4])\]$/);
                                        if (posMatch) {
                                          return (
                                            <span key={i} className="inline-flex items-center justify-center px-1.5 h-6 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[12px] font-black shrink-0 shadow-sm mx-0.5">
                                              {part}
                                            </span>
                                          );
                                        }

                                        // Kiểm tra nếu đoạn text chứa câu văn trong ngoặc (đơn hoặc kép)
                                        // Hỗ trợ: "...", '...', “...”, ‘...’
                                        // Sử dụng [\s\S] thay cho . kết hợp flag /s để tương thích môi trường cũ
                                        const targetMatch = part.match(/^([\s\S]*?)["'“‘]([^"'“”‘’]{10,})["'”’]([\s\S]*)$/);
                                        if (targetMatch) {
                                          return (
                                            <span key={i} className="contents">
                                              {targetMatch[1]}
                                              <div className="w-full mt-4 mb-2 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-[16px] font-bold text-slate-800 italic leading-relaxed">
                                                "{targetMatch[2]}"
                                              </div>
                                              {targetMatch[3]}
                                            </span>
                                          );
                                        }

                                        return <span key={i}>{part}</span>;
                                      })}
                                    </div>
                                  </div>
                                );
                              }

                              // 2. Dạng bài Từ vựng/Ngữ cảnh (Context/Vocabulary): Làm nổi bật cụm từ trong ngoặc
                              // Tách riêng ngoặc kép và ngoặc đơn để tránh nhầm lẫn với dấu phẩy lửng (apostrophe)
                              // Sử dụng [\s\S] thay cho . kết hợp flag /s để tương thích môi trường cũ
                              const vocabMatch = text.match(/^([\s\S]*?)["“]([^"“”]{1,60})["”]([\s\S]*)$/) ||
                                text.match(/^([\s\S]*?)['‘]([^'‘’]{1,60})['’]([\s\S]*)$/);
                              if (vocabMatch) {
                                return (
                                  <span>
                                    {vocabMatch[1]}
                                    <span className="text-blue-600 font-black underline decoration-2 underline-offset-4">"{vocabMatch[2]}"</span>
                                    {vocabMatch[3]}
                                  </span>
                                );
                              }

                              return text;
                            })()}
                          </AdminInlineEditor>
                        </h3>
                        {isRevealed && q.questionText_vn && (
                          <div className="mt-2">
                            <AdminInlineEditor
                              target="question"
                              id={q.id}
                              field="questionText_vn"
                              value={q.questionText_vn}
                              className="text-[16px] text-slate-500 font-medium italic animate-in fade-in duration-500"
                            >
                              {q.questionText_vn}
                            </AdminInlineEditor>
                          </div>
                        )}
                        <div className="mt-3 mb-3">
                          <AdminInlineEditor
                            target="question"
                            id={q.id}
                            field="metadata.type"
                            value={(() => {
                              const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
                              return meta?.type || q.type || "";
                            })()}
                          >
                            {(() => {
                              const normalize = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                              const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
                              const types = [
                                q.type,
                                meta?.type,
                                meta?.question_type,
                                meta?.Question_Type,
                                ...(Array.isArray(meta?.tags) ? meta.tags : [meta?.tags])
                              ].filter(Boolean).map(t => String(t));

                              // Nếu có dạng bài mục tiêu, ưu tiên hiển thị cái đó nếu nó nằm trong danh sách types
                              const targetNorm = targetQuestionType ? normalize(targetQuestionType) : null;
                              let displayType = types[0] || "GENERAL";

                              if (targetNorm) {
                                const matchedType = types.find(t => normalize(t) === targetNorm);
                                if (matchedType) {
                                  displayType = matchedType;
                                }
                              }

                              return (
                                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                                  {displayType}
                                </span>
                              );
                            })()}
                          </AdminInlineEditor>
                        </div>

                        {/* Options List */}
                        <div className="space-y-0.5">
                          {['A', 'B', 'C', 'D'].map((label) => {
                            const optText = q.options?.[label];
                            if (!optText) return null;
                            const isSelected = userAns === label;
                            const isCorrectLabel = q.correctAnswer === label;

                            let uiState = "UNSELECTED";
                            if (isRevealed) {
                              if (isCorrectLabel) uiState = "CORRECT";
                              else if (isSelected) uiState = "WRONG";
                              else uiState = "FADED";
                            } else if (isSelected) uiState = "SELECTED";

                            let style = "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg";
                            if (isSelected) style = "border-indigo-600 bg-indigo-50/50 shadow-xl ring-1 ring-indigo-600";
                            if (isRevealed) {
                              if (isCorrectLabel) style = "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 shadow-emerald-100";
                              else if (isSelected) style = "border-red-500 bg-red-50 ring-2 ring-red-500 shadow-red-100";
                            }

                            const wrongExpl = q.explanation?.wrong_options?.[label] || q.explanation?.wrong?.[label] || q.metadata?.explanation?.wrong_options?.[label] || q.metadata?.explanation?.wrong?.[label];

                            return (
                              <div key={label} className="space-y-1">
                                <div
                                  onClick={() => !isRevealed && setAnswers(prev => ({ ...prev, [qKey]: label }))}
                                  className={`group/opt w-full flex items-center gap-2 py-0.5 px-2 rounded-xl border-2 transition-all cursor-pointer relative ${style}`}
                                >
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border-2 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : isRevealed && isCorrectLabel ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover/opt:border-indigo-300 group-hover/opt:bg-white'}`}>
                                    {label}
                                  </div>
                                  <div className="flex-1 min-w-0 py-0.5">
                                    <div className={`text-[15px] font-bold leading-snug ${uiState === "CORRECT" ? 'text-emerald-900' : uiState === "SELECTED" ? 'text-indigo-900' : 'text-slate-900'}`}>
                                      <AdminInlineEditor target="question" id={q.id} field={`option${label}`} value={optText}>{optText}</AdminInlineEditor>
                                    </div>
                                    {isTranslationRevealed && q.options_vn?.[label] && (
                                      <div className="mt-0.5 text-[14px] text-slate-500 font-medium italic">{q.options_vn[label]}</div>
                                    )}
                                  </div>
                                  {isRevealed && isCorrectLabel && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />}
                                  {isRevealed && isSelected && !isCorrectLabel && <X className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
                                </div>

                                {isRevealed && !isCorrectLabel && wrongExpl && (
                                  <div className="ml-10 p-3 bg-red-50/50 border-l-4 border-red-200 rounded-r-xl text-[13px] text-red-600 font-bold italic">
                                    <div dangerouslySetInnerHTML={{ __html: formatExplanation(wrongExpl) }} />
                                  </div>
                                )}
                                {isRevealed && isCorrectLabel && (q.explanation?.why_correct || q.metadata?.explanation?.why_correct || (typeof q.explanation === 'string' ? q.explanation : '') || q.why_correct) && (
                                  <div className="ml-10 p-3 bg-emerald-50/50 border-l-4 border-emerald-400 rounded-r-xl text-[14px] text-emerald-700 font-bold italic">
                                    <div dangerouslySetInnerHTML={{ __html: formatExplanation(q.explanation?.why_correct || q.metadata?.explanation?.why_correct || (typeof q.explanation === 'string' ? q.explanation : '') || q.why_correct) }} />
                                  </div>
                                )}
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
                  {data.flatMap((g, gIdx) => g.questions.map((q: any, qIdx: number) => {
                    const isCurrentGroup = gIdx === currentIndex;
                    const qKeyNum = q.questionNo;
                    const qNavKey = getQuestionKey(q);
                    const isActiveQ = (q.id === activeQuestionId || q.questionNo === activeQuestionId) && isCurrentGroup;
                    const isAnswered = !!answers[qNavKey];
                    const isCorrect = isRevealed && answers[qNavKey] === q.correctAnswer;
                    const isFlagged = !!flags[qNavKey];

                    let btnClass = "";
                    if (isRevealed) {
                      if (!isAnswered) btnClass = "bg-slate-800 text-slate-500 border border-slate-700";
                      else if (isCorrect) btnClass = "bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400";
                      else btnClass = "bg-red-500 text-white shadow-sm ring-1 ring-red-400";
                    } else {
                      btnClass = isAnswered
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700';
                    }

                    return (
                      <button
                        key={`nav-q-${gIdx}-${qIdx}`}
                        onClick={() => {
                          setCurrentIndex(gIdx);
                          setActiveQuestionId(q.id);
                          if (passageScrollRef.current) passageScrollRef.current.scrollTop = 0;
                          if (questionsScrollRef.current) questionsScrollRef.current.scrollTop = 0;
                          const el = document.getElementById("question-" + qKeyNum);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={`h-10 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center relative 
                            ${isActiveQ ? 'ring-2 ring-white z-20 scale-110 shadow-lg' : isCurrentGroup ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 z-10 scale-105' : ''} 
                            ${btnClass}`}
                      >
                        {qKeyNum}
                        {isFlagged && (
                          <div className="absolute top-1 right-1 group/flag">
                            <Flag
                              size={10}
                              className={`shadow-sm ${flags[qNavKey] === 'RED' ? 'text-red-500 fill-red-500' :
                                flags[qNavKey] === 'PURPLE' ? 'text-purple-500 fill-purple-500' :
                                  flags[qNavKey] === 'BLUE' ? 'text-blue-500 fill-blue-500' :
                                    'text-yellow-500 fill-yellow-500'
                                }`}
                            />
                            {notes[qNavKey] && (
                              <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/flag:opacity-100 transition-all duration-200 pointer-events-none z-[1000]">
                                <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10 w-48">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <PenLine size={10} className="text-blue-400" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ghi chú</span>
                                  </div>
                                  <p className="text-[10px] leading-relaxed font-medium line-clamp-4 italic text-slate-100">
                                    "{notes[qNavKey]}"
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
                    <div className="text-[10px] font-black text-blue-500">{Math.round((answeredCount / totalQuestions) * 100)}%</div>
                    <div className="w-1 h-12 bg-slate-200 rounded-full overflow-hidden flex flex-col justify-end">
                      <div className="bg-blue-500 w-full transition-all duration-500" style={{ height: `${(answeredCount / totalQuestions) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {data.slice(0, 10).map((g, idx) => {
                      const isDone = g.questions?.every((q: any) => answers[q.id || `${g.id}_${q.questionNo}`]);
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
                !isRevealed ? (
                  <button
                    onClick={handleFinishTest}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-[13px] shadow-lg shadow-blue-900/30 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> NỘP BÀI NGAY
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs shadow-sm hover:bg-slate-700 transition active:scale-95 uppercase tracking-wide"
                  >
                    🔄 Làm lại bài
                  </button>
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

      {/* BOTTOM NAVIGATION BAR (PORTAL HOẶC CỐ ĐỊNH TÙY NGỮ CẢNH) */}
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
                    onClick={() => {
                      const btn = document.getElementById('full-test-submit-btn');
                      if (btn) btn.click();
                    }}
                    className="px-10 py-2.5 rounded-2xl font-bold text-[13px] transition-all bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:bg-indigo-700 active:scale-95 ml-1 uppercase tracking-wider flex items-center gap-2"
                  >
                    Hoàn thành & Nộp bài <Send size={14} />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] translate-y-2 group-hover:translate-y-0">
                    Phím tắt: Mũi tên phải
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>
              ) : !isSubmitted && (
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

        if (mounted) {
          const target = document.getElementById("bottom-nav-portal-target");
          if (target) {
            return createPortal(
              <div className="relative flex-none h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[70] flex items-center justify-center pointer-events-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="absolute left-4 flex gap-2 pointer-events-auto z-[80]">
                  <button
                    onClick={() => startToeicPartTour(7, true)}
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
              target
            );
          }
        }

        return (
          <div className="relative flex-none h-16 bg-white border-t border-slate-200 z-[70] flex items-center justify-center">
            <div className="absolute left-4 flex gap-2 pointer-events-auto z-[80]">
              <button
                onClick={() => startToeicPartTour(7, true)}
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

      {/* TOOLTIP TRANSLATION */}
      {tooltip && tooltip.rect && tooltip.text && currentGroup && mounted && createPortal(
        <div
          className="fixed z-[99999999] pointer-events-none transition-all duration-200 tour-translate-tooltip-portal"
          style={{
            left: `${(tooltip.rect?.left || 0) + (tooltip.rect?.width || 0) / 2}px`,
            top: `${tooltip.rect?.top || 0}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-12px'
          }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
            <span
              className="relative block px-6 py-3 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl text-white text-[15px] font-bold leading-relaxed max-w-sm"
              style={{
                padding: '4px 12px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)'
              }}
            >
              <AdminInlineEditor
                target="group"
                id={currentGroup.id}
                field="translation_map"
                sid={tooltip.sid || ""}
                value={tooltip.text || ""}
                multiline
              >
                {tooltip.text || ""}
              </AdminInlineEditor>
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}