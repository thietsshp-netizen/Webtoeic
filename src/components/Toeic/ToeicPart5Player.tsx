"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import wordFamiliesDataStatic from "@/data/word_families.json";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  CheckCircleIcon, FlagIcon, ClockIcon, TrophyIcon,
  ChevronLeftIcon, ChevronRightIcon, XMarkIcon,
  InformationCircleIcon, ListBulletIcon, ArrowPathIcon,
  BookOpenIcon, SpeakerWaveIcon
} from "@heroicons/react/24/solid";
import { LayoutDashboard, Send, Edit2, Flag, PenLine, HelpCircle, Volume2, Check, X, Loader2, Trash2, Plus } from "lucide-react";
import { AdminInlineEditor } from "@/components/Admin/AdminInlineEditor";
import { useAdminEdit } from "@/components/Admin/AdminEditProvider";
import confetti from 'canvas-confetti';
import Link from 'next/link';
import FlagSelector, { FlagColor } from '../Player/FlagSelector';
import ConfirmModal from '@/components/UI/ConfirmModal';
import { startToeicPartTour } from './toeicTour';
import FloatingVideoExplanationPlayer from '../Player/FloatingVideoExplanationPlayer';

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
  videoExplanation?: any;
  onVideoQuestionSync?: (questionNo: number) => void;
  onToggleVideo?: () => void;
  videoOpen?: boolean;
}

// Bộ nhớ đệm lưu cache các từ đã kiểm tra và tìm thấy URL thành công
const audioCache = new Map<string, string>();

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
  globalTotal,
  videoExplanation: videoExplanationRaw,
  onVideoQuestionSync,
  onToggleVideo,
  videoOpen
}: ToeicPart5PlayerProps) {
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

  // --- STATE ---
  const [wordFamiliesData, setWordFamiliesData] = useState<any[]>(wordFamiliesDataStatic);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/word-families?part=5")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setWordFamiliesData(res.data);
        }
      })
      .catch((err) => console.error("Lỗi tải word families từ DB:", err));
  }, []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(propsIsSubmitted);
  const [revealMode, setRevealMode] = useState(isReviewMode || propsIsSubmitted);
  const [showExplain, setShowExplain] = useState<Record<string, boolean>>({});
  const [showExplainPartial, setShowExplainPartial] = useState<Record<string, boolean>>({});
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, message: string, onConfirm: () => void } | null>(null);
  const [showVideo, setShowVideo] = useState(false);

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

  // --- WORD FAMILY STATE ---
  const [activeWordFamily, setActiveWordFamily] = useState<any[]>([]);
  const [popoverPos, setPopoverPos] = useState({ x: 200, y: 200 });

  useEffect(() => {
    setActiveWordFamily([]);
  }, [currentIndex]);

  // Lắng nghe sự kiện từ Tour để tự động mở bung Sidebar làm ví dụ
  useEffect(() => {
    const handleTourSidebar = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsSidebarHovered(customEvent.detail.open);
    };
    window.addEventListener("toeic-tour-sidebar", handleTourSidebar);
    return () => window.removeEventListener("toeic-tour-sidebar", handleTourSidebar);
  }, []);
  const { isAdminMode, canEdit } = useAdminEdit();
  const explainScrollRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<Window | null>(null);
  const lastVocabHotkeyTime = useRef<number>(0);

  const [selectedCloudIndex, setSelectedCloudIndex] = useState<number>(-1);

  const getMatchedFamiliesForQuestion = (index: number) => {
    const currentQ = questions[index];
    if (!currentQ) return [];

    const qText = currentQ.questionText || (currentQ as any).question || (currentQ as any).passageText || "";
    const optA = currentQ.optionA || (currentQ as any).OptionA || "";
    const optB = currentQ.optionB || (currentQ as any).OptionB || "";
    const optC = currentQ.optionC || (currentQ as any).OptionC || "";
    const optD = currentQ.optionD || (currentQ as any).OptionD || "";
    
    const fullText = `${qText} ${optA} ${optB} ${optC} ${optD}`;
    const candidates: any[] = [];
    
    const isRootEntry = (fam: any): boolean =>
      fam.type === 'root' || (typeof fam.originalValue === 'string' && fam.originalValue.trimStart().startsWith('Gốc:'));

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
      if (wordLower.startsWith(stem)) {
        const suffix = wordLower.substring(stem.length);
        if (endsWithE) {
          if (/^(e|es|ed|ing|er|est|y|ely)$/.test(suffix)) return true;
        } else {
          if (/^(s|es|ed|ing|er|est|ly|y)?$/.test(suffix)) return true;
        }
      }
      const safePrefixes = ['under', 'over', 'counter', 'multi', 'semi', 'out', 'sub', 'super', 'inter'];
      for (const prefix of safePrefixes) {
        if (wordLower.startsWith(prefix)) {
          const rest = wordLower.substring(prefix.length);
          if (rest === memberLower || rest === stem) return true;
          if (rest.startsWith(stem)) {
            const restSuffix = rest.substring(stem.length);
            if (endsWithE) {
              if (/^(e|es|ed|ing|er|est|y|ely)$/.test(restSuffix)) return true;
            } else {
              if (/^(s|es|ed|ing|er|est|ly|y)?$/.test(restSuffix)) return true;
            }
          }
        }
      }
      return false;
    };

    const isRelatedWordMatch = (memberLower: string, wordLower: string): boolean => {
      if (memberLower === wordLower) return true;
      const stem = (memberLower.length > 2 && memberLower.endsWith('e'))
        ? memberLower.slice(0, -1)
        : memberLower;
      if (wordLower.startsWith(stem)) {
        const suffix = wordLower.substring(stem.length);
        return suffix.length <= 3 && /^(s|es|ed|ing|er|est|ly|y)?$/.test(suffix);
      }
      return false;
    };

    wordFamiliesData.forEach((fam: any, dbIdx: number) => {
      if (!fam.words) return;
      fam.words.forEach((member: string) => {
        const isPhrase = member.includes(' ');
        const escaped = member.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        let regex: RegExp;

        if (isPhrase) {
          regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        } else {
          const mLower = member.toLowerCase();
          if (mLower.length >= 4) {
            regex = new RegExp(`\\b[a-zA-Z]*${escaped}[a-zA-Z]*\\b`, 'gi');
          } else {
            regex = new RegExp(`\\b${escaped}[a-zA-Z]{0,3}\\b`, 'gi');
          }
        }

        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(fullText)) !== null) {
          const matchedStr = match[0];
          if (!isPhrase) {
            const mainKeys = isRootEntry(fam) ? [] : getMainKeys(fam.key);
            const isMain = isRootEntry(fam) || mainKeys.includes(member.toLowerCase());
            const matches = isMain 
              ? isWordMatch(member.toLowerCase(), matchedStr.toLowerCase())
              : isRelatedWordMatch(member.toLowerCase(), matchedStr.toLowerCase());
            if (!matches) continue;
          }
          const isColA = !isRootEntry(fam) && getMainKeys(fam.key).includes(member.toLowerCase());
          candidates.push({
            start: match.index,
            end: match.index + matchedStr.length,
            length: matchedStr.length,
            family: fam,
            matchedWord: matchedStr,
            isPhrase,
            isRoot: isRootEntry(fam),
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
      if (a.isRoot !== b.isRoot) return a.isRoot ? -1 : 1;
      if (b.length !== a.length) return b.length - a.length;
      if (b.memberLength !== a.memberLength) return b.memberLength - a.memberLength;
      return a.indexInDb - b.indexInDb;
    });

    const selectedMatches: any[] = [];
    const isOccupied = new Array(fullText.length).fill(false);

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

    const matchedFamiliesMap = new Map<string, any>();
    selectedMatches.forEach(m => {
      if (!matchedFamiliesMap.has(m.family.id)) {
        matchedFamiliesMap.set(m.family.id, { ...m.family, matchedWord: m.matchedWord });
      }
      
      const wordLower = m.matchedWord.toLowerCase();
      wordFamiliesData.forEach((fam: any) => {
        if (!isRootEntry(fam) || !fam.words) return;
        if (fam.id === m.family.id) return;
        const found = fam.words.find((memberStr: string) => 
          isWordMatch(memberStr.toLowerCase(), wordLower) || 
          isRelatedWordMatch(memberStr.toLowerCase(), wordLower)
        );
        if (found && !matchedFamiliesMap.has(fam.id)) {
          matchedFamiliesMap.set(fam.id, { ...fam, matchedWord: m.matchedWord });
        }
      });
    });

    return Array.from(matchedFamiliesMap.values());
  };

  const formatValueToHtml = (val: string, key: string, type: string) => {
    if (!val) return '';
    const lines = val.split('\n');
    const searchTerms = [key.replace(/[\/,]/g, ' ').split(' ')[0]];
    const firstTerm = searchTerms[0] || '';
    const termLower = firstTerm.toLowerCase();
    
    const highlightTerm = (text: string) => {
      if (!firstTerm || firstTerm.length < 2 || !text) return text;
      const escapedTerm = firstTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const termRegex = type === 'root' ? new RegExp(`(${escapedTerm})`, 'gi') : new RegExp(`\\b(${escapedTerm})\\b`, 'gi');
      return text.split(termRegex).map((part) => {
        if (part.toLowerCase() === termLower) {
          return `<span class="highlight-term">${part}</span>`;
        }
        return part;
      }).join('');
    };

    const highlightWords = (text: string) => {
      return text.replace(/\b([a-zA-Z0-9'\s-]+)\s*\(([^)]+)\)/g, (match, eng, vi) => {
        return `<strong style="color: #2563eb; font-weight: 800;">${eng.trim()}</strong> <span style="color: #475569;">(${vi})</span>`;
      });
    };

    const highlightColon = (text: string) => {
      if (
        text.toLowerCase().startsWith('gốc:') ||
        text.toLowerCase().startsWith('goc:') ||
        text.toLowerCase().startsWith('tiền tố:') ||
        text.toLowerCase().startsWith('tien to:') ||
        text.toLowerCase().startsWith('hậu tố:') ||
        text.toLowerCase().startsWith('hau to:') ||
        text.toLowerCase().startsWith('ví dụ:') ||
        text.toLowerCase().startsWith('vi du:')
      ) {
        return text;
      }
      const colonIndex = text.indexOf(':');
      if (colonIndex > 0) {
        const before = text.slice(0, colonIndex);
        const after = text.slice(colonIndex);
        const bulletRegex = /^([\s*•-]*)(.*)$/;
        const match = before.match(bulletRegex);
        if (match) {
          const bullet = match[1];
          const words = match[2].trim();
          if (words && /[a-zA-Z]/.test(words) && !words.includes('[') && !words.includes('(') && !words.includes('<')) {
            return `${bullet}<strong style="color: #2563eb; font-weight: 800;">${words}</strong>${after}`;
          }
        }
      }
      return text;
    };

    return lines.map((line) => {
      let cleanLine = line.trim();
      if (cleanLine.length === 0) return '';
      if (cleanLine.startsWith('[') && cleanLine.endsWith(']')) {
        cleanLine = cleanLine.slice(1, -1);
      }
      cleanLine = cleanLine.replace(/Đồng nghĩa TOEIC hay gặp/gi, 'Các từ/cụm từ tương tự');
      
      let className = "line-normal";
      const lowerTrimmed = cleanLine.toLowerCase();
      
      if (
        lowerTrimmed.startsWith('gốc:') || 
        lowerTrimmed.startsWith('goc:') || 
        lowerTrimmed.startsWith('tiền tố:') || 
        lowerTrimmed.startsWith('tien to:') ||
        lowerTrimmed.startsWith('hậu tố:') || 
        lowerTrimmed.startsWith('hau to:')
      ) {
        className = "line-root";
      } else if (cleanLine.startsWith('=') || cleanLine.startsWith('~')) {
        className = "line-synonym";
      } else if (cleanLine.startsWith('><')) {
        className = "line-antonym";
      } else if (cleanLine.includes('->') || cleanLine.startsWith('-')) {
        className = "line-example";
      }
      
      cleanLine = highlightWords(cleanLine);
      cleanLine = highlightColon(cleanLine);
      return `<div class="${className}">${highlightTerm(cleanLine)}</div>`;
    }).join('');
  };

  const pipWindowRef = useRef<any>(null);

  const updateCloudPopup = async (index: number, targetCloudIndex: number) => {
    if (!isAdminMode && !canEdit) return;
    const currentQ = questions[index];
    if (!currentQ) return;

    const meta = currentQ.metadata as any;
    let explainData: any = { overall: "", vocabulary: [] };
    if (meta?.explanation) {
      explainData = meta.explanation;
    } else if (currentQ.explanation && typeof currentQ.explanation === 'string' && currentQ.explanation.startsWith('{')) {
      explainData = JSON.parse(currentQ.explanation);
    } else if (currentQ.explanation) {
      explainData = { overall: currentQ.explanation, vocabulary: meta?.vocabulary || [] };
    }

    const matchedFamilies = getMatchedFamiliesForQuestion(index);
    if (matchedFamilies.length === 0) return;

    let activeIdx = targetCloudIndex;
    if (activeIdx < 0) activeIdx = matchedFamilies.length - 1;
    if (activeIdx >= matchedFamilies.length) activeIdx = 0;

    const fam = matchedFamilies[activeIdx];
    if (!fam) return;

    setSelectedCloudIndex(activeIdx);

    const escapeHtml = (unsafe: string) => {
      return (unsafe || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const width = 450;
    const height = 580;

    const popupHtml = `
      <div class="title-container">
        <div>
          <div class="title">Từ khóa: "${escapeHtml(fam.matchedWord || fam.key)}"</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Đám mây từ vựng - Câu ${currentQ.questionNo || ''}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
          <div class="pagination-indicator">${activeIdx + 1} / ${matchedFamilies.length}</div>
          ${currentQ.correctAnswer ? `<div class="correct-answer-badge">ĐÁP ÁN: <span style="color: #10b981; font-weight: 900; font-size: 12px; margin-left: 2px;">${currentQ.correctAnswer}</span></div>` : ''}
        </div>
      </div>
      
      <div class="middle-scroll-container">
        <div class="family-item">
          <div class="family-header">
            <span class="family-key">${escapeHtml(fam.key)}</span>
            <span class="family-badge ${fam.type === 'root' ? 'badge-root' : 'badge-word'}">
              ${fam.type === 'root' ? 'Gốc từ' : 'Từ vựng'}
            </span>
          </div>
          <div>
            ${formatValueToHtml(fam.originalValue, fam.key, fam.type)}
          </div>
        </div>
      </div>

      <div class="options-footer">
        <div class="options-footer-title">Các phương án lựa chọn:</div>
        <div class="options-grid">
          ${(() => {
            const cleanValue = (val: string) => {
              if (!val) return '';
              const trimmed = val.trim();
              if (trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'null') return '';
              return trimmed;
            };
            return ['A', 'B', 'C', 'D'].map(opt => {
              const isCorrect = opt === currentQ.correctAnswer;
              const label = currentQ[`option${opt}`] || '';
              const breakdown = explainData.options_breakdown?.[opt] || {};
              const meaning = cleanValue(breakdown.meaning);
              const syns = cleanValue(breakdown.synonyms);
              const ants = cleanValue(breakdown.antonyms);
              return `
                <div class="opt-row ${isCorrect ? 'opt-row-correct' : ''}">
                  <span class="opt-badge ${isCorrect ? 'opt-badge-correct' : ''}">${opt}</span>
                  <div class="opt-details">
                    <div class="opt-main">
                      <span class="opt-label">${escapeHtml(label)}</span>
                      ${meaning ? `<span class="opt-eq">=</span> <span class="opt-meaning">${escapeHtml(meaning)}</span>` : ''}
                    </div>
                    ${(syns || ants) ? `
                      <div class="opt-extra">
                        ${syns ? `<span class="opt-syn">~ ${escapeHtml(syns)}</span>` : ''}
                        ${ants ? `<span class="opt-ant">>< ${escapeHtml(ants)}</span>` : ''}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('');
          })()}
        </div>
      </div>
    `;

    // 1. Dùng Document Picture-in-Picture nếu được hỗ trợ để luôn nổi trên cùng
    const hasPiP = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
    
    if (hasPiP) {
      try {
        let pipWindow = pipWindowRef.current;
        const isClosed = !pipWindow || pipWindow.closed;
        
        if (isClosed) {
          // @ts-ignore
          pipWindow = await window.documentPictureInPicture.requestWindow({ width, height });
          pipWindowRef.current = pipWindow;

          try {
            const leftPos = window.screenLeft || window.screenX || 0;
            const topPos = (window.screenTop || window.screenY || 0) + (window.outerHeight || window.innerHeight || 800) - height;
            pipWindow.moveTo(leftPos, topPos);
          } catch (e) {}

          const style = pipWindow.document.createElement('style');
          style.textContent = `
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 16px;
              margin: 0;
              background-color: #f8fafc;
              color: #1e293b;
              height: calc(100vh - 32px);
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
            }
            .middle-scroll-container {
              flex: 1;
              overflow-y: auto;
              margin-bottom: 12px;
              padding-right: 4px;
            }
            .title-container {
              position: sticky;
              top: 0;
              background-color: #f8fafc;
              padding-bottom: 12px;
              border-bottom: 2px solid #e2e8f0;
              margin-bottom: 16px;
              z-index: 10;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
            }
            .pagination-indicator {
              font-size: 12px;
              font-weight: 700;
              background-color: #e2e8f0;
              color: #475569;
              padding: 3px 8px;
              border-radius: 6px;
            }
            .correct-answer-badge {
              font-size: 10px;
              color: #475569;
              background-color: #ecfdf5;
              border: 1px solid #a7f3d0;
              padding: 2px 8px;
              border-radius: 6px;
              font-weight: 700;
              display: inline-flex;
              align-items: center;
            }
            .options-footer {
              flex-shrink: 0;
              border-top: 2px solid #e2e8f0;
              padding-top: 12px;
              margin-top: auto;
              background-color: #f8fafc;
            }
            .options-footer-title {
              font-size: 11px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 8px;
            }
            .options-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .opt-row {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              padding: 6px 10px;
              border-radius: 8px;
              background-color: #ffffff;
              border: 1px solid #e2e8f0;
            }
            .opt-row-correct {
              background-color: #ecfdf5;
              border-color: #a7f3d0;
            }
            .opt-badge {
              width: 20px;
              height: 20px;
              font-size: 11px;
              font-weight: 800;
              background-color: #f1f5f9;
              color: #475569;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #cbd5e1;
              flex-shrink: 0;
              margin-top: 2px;
            }
            .opt-badge-correct {
              background-color: #10b981;
              color: #ffffff;
              border-color: #059669;
            }
            .opt-details {
              display: flex;
              flex-direction: column;
              gap: 2px;
              text-align: left;
            }
            .opt-main {
              font-size: 13.5px;
              font-weight: 500;
            }
            .opt-label {
              font-weight: 800;
              color: #0f172a;
            }
            .opt-eq {
              color: #94a3b8;
              margin: 0 4px;
            }
            .opt-meaning {
              color: #475569;
            }
            .opt-extra {
              display: flex;
              gap: 12px;
              font-size: 11.5px;
              font-weight: 700;
              margin-top: 1px;
            }
            .opt-syn {
              color: #059669;
            }
            .opt-ant {
              color: #dc2626;
            }
            .family-item {
              background-color: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 14px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
            }
            .family-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }
            .family-key {
              font-weight: 800;
              color: #2563eb;
              font-size: 16px;
            }
            .family-badge {
              font-size: 10px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 9999px;
              text-transform: uppercase;
            }
            .badge-word {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .badge-root {
              background-color: #fef3c7;
              color: #92400e;
            }
            .line-normal {
              color: #334155;
              font-size: 13.5px;
              line-height: 1.6;
              margin: 6px 0;
              font-weight: 500;
            }
            .line-root {
              color: #dc2626;
              font-size: 13.5px;
              line-height: 1.6;
              margin: 6px 0;
              font-weight: bold;
            }
            .line-synonym {
              color: #047857;
              font-size: 13.5px;
              line-height: 1.6;
              margin: 6px 0;
              font-weight: bold;
            }
            .line-antonym {
              color: #dc2626;
              font-size: 13.5px;
              line-height: 1.6;
              margin: 6px 0;
              font-weight: bold;
            }
            .line-example {
              color: #4338ca;
              font-size: 13.5px;
              line-height: 1.6;
              margin: 6px 0;
              font-weight: 600;
            }
            .highlight-term {
              color: #d97706;
              font-weight: bold;
            }
          `;
          pipWindow.document.head.appendChild(style);

          const mainWindow = window;
          pipWindow.document.addEventListener('keydown', (e: KeyboardEvent) => {
            const isTargetKey = 
              e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
              e.key === ',' || e.key === '.' ||
              e.key === '[' || e.key.toLowerCase() === 'ư' || 
              e.key === ']' || e.key.toLowerCase() === 'ơ';
            if (isTargetKey) {
              e.preventDefault();
              mainWindow.postMessage({ type: 'CYCLE_CLOUD', key: e.key }, '*');
            }
          });
        }

        pipWindow.document.body.innerHTML = popupHtml;
        try {
          window.focus();
        } catch (e) {}
        return;
      } catch (err) {
        console.error("Lỗi khi mở Document PiP:", err);
      }
    }

    // 2. Fallback nếu không hỗ trợ PiP
    const left = window.screenLeft || window.screenX || 0;
    const top = (window.screenTop || window.screenY || 0) + (window.outerHeight || window.innerHeight || 800) - height;

    const popup = window.open(
      'about:blank',
      'CloudSynonyms',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popupRef.current = popup;
      try {
        window.focus();
      } catch (e) {}
      
      popup.document.open();
      popup.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Đám mây từ vựng - Câu ${currentQ.questionNo || ''}</title>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                padding: 16px;
                margin: 0;
                background-color: #f8fafc;
                color: #1e293b;
                height: calc(100vh - 32px);
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
              }
              .middle-scroll-container {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 12px;
                padding-right: 4px;
              }
              .title-container {
                position: sticky;
                top: 0;
                background-color: #f8fafc;
                padding-bottom: 12px;
                border-bottom: 2px solid #e2e8f0;
                margin-bottom: 16px;
                z-index: 10;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .title {
                font-size: 16px;
                font-weight: 800;
                color: #0f172a;
                margin: 0;
              }
              .pagination-indicator {
                font-size: 12px;
                font-weight: 700;
                background-color: #e2e8f0;
                color: #475569;
                padding: 3px 8px;
                border-radius: 6px;
              }
              .correct-answer-badge {
                font-size: 10px;
                color: #475569;
                background-color: #ecfdf5;
                border: 1px solid #a7f3d0;
                padding: 2px 8px;
                border-radius: 6px;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
              }
              .options-footer {
                flex-shrink: 0;
                border-top: 2px solid #e2e8f0;
                padding-top: 12px;
                margin-top: auto;
                background-color: #f8fafc;
              }
              .options-footer-title {
                font-size: 11px;
                font-weight: 800;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 8px;
              }
              .options-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
              }
              .opt-row {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 6px 10px;
                border-radius: 8px;
                background-color: #ffffff;
                border: 1px solid #e2e8f0;
              }
              .opt-row-correct {
                background-color: #ecfdf5;
                border-color: #a7f3d0;
              }
              .opt-badge {
                width: 20px;
                height: 20px;
                font-size: 11px;
                font-weight: 800;
                background-color: #f1f5f9;
                color: #475569;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #cbd5e1;
                flex-shrink: 0;
                margin-top: 2px;
              }
              .opt-badge-correct {
                background-color: #10b981;
                color: #ffffff;
                border-color: #059669;
              }
              .opt-details {
                display: flex;
                flex-direction: column;
                gap: 2px;
                text-align: left;
              }
              .opt-main {
                font-size: 13.5px;
                font-weight: 500;
              }
              .opt-label {
                font-weight: 800;
                color: #0f172a;
              }
              .opt-eq {
                color: #94a3b8;
                margin: 0 4px;
              }
              .opt-meaning {
                color: #475569;
              }
              .opt-extra {
                display: flex;
                gap: 12px;
                font-size: 11.5px;
                font-weight: 700;
                margin-top: 1px;
              }
              .opt-syn {
                color: #059669;
              }
              .opt-ant {
                color: #dc2626;
              }
              .family-item {
                background-color: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 14px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
              }
              .family-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
              }
              .family-key {
                font-weight: 800;
                color: #2563eb;
                font-size: 16px;
              }
              .family-badge {
                font-size: 10px;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 9999px;
                text-transform: uppercase;
              }
              .badge-word {
                background-color: #dbeafe;
                color: #1e40af;
              }
              .badge-root {
                background-color: #fef3c7;
                color: #92400e;
              }
              .line-normal {
                color: #334155;
                font-size: 13.5px;
                line-height: 1.6;
                margin: 6px 0;
                font-weight: 500;
              }
              .line-root {
                color: #dc2626;
                font-size: 13.5px;
                line-height: 1.6;
                margin: 6px 0;
                font-weight: bold;
              }
              .line-synonym {
                color: #047857;
                font-size: 13.5px;
                line-height: 1.6;
                margin: 6px 0;
                font-weight: bold;
              }
              .line-antonym {
                color: #dc2626;
                font-size: 13.5px;
                line-height: 1.6;
                margin: 6px 0;
                font-weight: bold;
              }
              .line-example {
                color: #4338ca;
                font-size: 13.5px;
                line-height: 1.6;
                margin: 6px 0;
                font-weight: 600;
              }
              .highlight-term {
                color: #d97706;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            ${popupHtml}
             <script>
              document.addEventListener('keydown', (e) => {
                const isTargetKey = 
                  e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                  e.key === ',' || e.key === '.' ||
                  e.key === '[' || e.key.toLowerCase() === 'ư' || 
                  e.key === ']' || e.key.toLowerCase() === 'ơ';
                if (isTargetKey) {
                  e.preventDefault();
                  if (window.opener) {
                    window.opener.postMessage({ type: 'CYCLE_CLOUD', key: e.key }, '*');
                  }
                }
              });
            </script>
          </body>
        </html>
      `);
      popup.document.close();
    }
  };

  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  // Tự động cuộn lên đầu khi chuyển câu, đóng cửa sổ từ điển nổi của câu cũ, và tự động cập nhật popup nếu đang mở
  useEffect(() => {
    if (explainScrollRef.current) explainScrollRef.current.scrollTop = 0;
    setActiveWordFamily([]);
    setSelectedCloudIndex(-1);
    const isPopupActive = (popupRef.current && !popupRef.current.closed) || (pipWindowRef.current && !pipWindowRef.current.closed);
    if (isPopupActive) {
      updateCloudPopup(currentIndex, 0);
    }
  }, [currentIndex]);

  // Nhận thông điệp chuyển câu/đám mây từ cửa sổ popup khi nó đang được focus
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CYCLE_CLOUD') {
        lastVocabHotkeyTime.current = Date.now();
        console.log("[DEBUG MESSAGE] CYCLE_CLOUD key:", e.data.key, "updated lastVocabHotkeyTime to:", lastVocabHotkeyTime.current);
        const matchedFamilies = getMatchedFamiliesForQuestion(currentIndex);
        if (matchedFamilies.length > 0) {
          let nextIdx = 0;
          const isNext = e.data.key === 'ArrowUp' || e.data.key === '.' || e.data.key === ']' || e.data.key?.toLowerCase() === 'ơ';
          if (isNext) {
            nextIdx = selectedCloudIndex === -1 ? 0 : (selectedCloudIndex + 1) % matchedFamilies.length;
          } else {
            nextIdx = selectedCloudIndex === -1 ? matchedFamilies.length - 1 : (selectedCloudIndex - 1 + matchedFamilies.length) % matchedFamilies.length;
          }
          updateCloudPopup(currentIndex, nextIdx);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentIndex, selectedCloudIndex, updateCloudPopup]);

  useEffect(() => {
    setMounted(true);
    // Tự động khởi chạy tour hướng dẫn học Part 5 lần đầu
    startToeicPartTour(5);
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
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = (
        (activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable ||
          activeEl.closest('[contenteditable]') !== null
        )) ||
        (target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          (typeof target.closest === 'function' && target.closest('[contenteditable]') !== null)
        ))
      );
      if (isInput) return;

      console.log("[DEBUG KEYDOWN] key:", e.key, "code:", e.code, "currentIndex:", currentIndex);

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const timeSinceVocab = Date.now() - lastVocabHotkeyTime.current;
        console.log("[DEBUG ARROWLEFT] timeSinceVocab:", timeSinceVocab, "lastVocabHotkeyTime:", lastVocabHotkeyTime.current);
        if (timeSinceVocab < 1200) {
          console.log("[DEBUG IGNORE] Ignored simulated ArrowLeft due to recent vocab hotkey. Diff:", timeSinceVocab);
          return;
        }
        if (currentIndex === 0) {
          if (isFullTest && onPrevPart) onPrevPart();
        } else {
          setCurrentIndex(prev => prev - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const timeSinceVocab = Date.now() - lastVocabHotkeyTime.current;
        console.log("[DEBUG ARROWRIGHT] timeSinceVocab:", timeSinceVocab, "lastVocabHotkeyTime:", lastVocabHotkeyTime.current);
        if (timeSinceVocab < 1200) {
          console.log("[DEBUG IGNORE] Ignored simulated ArrowRight due to recent vocab hotkey. Diff:", timeSinceVocab);
          return;
        }
        if (currentIndex === questions.length - 1) {
          if (isFullTest && onNextPart) onNextPart();
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      } else if ((isAdminMode || canEdit) && (
        e.key === ',' || e.key === '.' ||
        e.key === '[' || e.key.toLowerCase() === 'ư' || 
        e.key === ']' || e.key.toLowerCase() === 'ơ'
      )) {
        lastVocabHotkeyTime.current = Date.now();
        console.log("[DEBUG VOCAB KEY] updated lastVocabHotkeyTime to:", lastVocabHotkeyTime.current);
        e.preventDefault();
        const matchedFamilies = getMatchedFamiliesForQuestion(currentIndex);
        if (matchedFamilies.length > 0) {
          let nextIdx = 0;
          const isNext = e.key === '.' || e.key === ']' || e.key.toLowerCase() === 'ơ';
          if (isNext) {
            nextIdx = selectedCloudIndex === -1 ? 0 : (selectedCloudIndex + 1) % matchedFamilies.length;
          } else {
            nextIdx = selectedCloudIndex === -1 ? matchedFamilies.length - 1 : (selectedCloudIndex - 1 + matchedFamilies.length) % matchedFamilies.length;
          }
          updateCloudPopup(currentIndex, nextIdx);
        }
      }

      // CTRL/CMD + SHIFT + S: Toggle Solution
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const currentQ = questions[currentIndex];
        if (currentQ) {
          setShowExplain(prev => {
            const nextVal = !prev[currentQ.id];
            if (nextVal) {
              setShowExplainPartial(p => ({ ...p, [currentQ.id]: false })); // Tắt gợi ý
            }
            return { ...prev, [currentQ.id]: nextVal };
          });
        }
        return;
      }

      // CTRL/CMD + S: Toggle Solution Hint (Gợi ý đầy đủ thông tin nhưng không lộ đáp án đúng/sai)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const currentQ = questions[currentIndex];
        if (currentQ) {
          setShowExplainPartial(prev => {
            const nextVal = !prev[currentQ.id];
            if (nextVal) {
              setShowExplain(p => ({ ...p, [currentQ.id]: false })); // Tắt chế độ đầy đủ
            }
            return { ...prev, [currentQ.id]: nextVal };
          });
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions.length, currentIndex, isFullTest, onPrevPart, onNextPart, isAdminMode, canEdit, selectedCloudIndex, updateCloudPopup]);

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

  const fallbackSpeak = (text: string, type: 'uk' | 'us' = 'us') => {
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

  const speak = async (text: string, type: 'uk' | 'us' = 'us') => {
    if (typeof window === 'undefined') return;

    // Loại bỏ nhãn từ loại trong dấu ngoặc đơn ở cuối từ (ví dụ: "Bicyclist (n)" -> "Bicyclist")
    const cleanSpeechText = text.replace(/\s*\([^)]*\)/g, '').trim();

    if (cleanSpeechText.includes(' ')) {
      fallbackSpeak(cleanSpeechText, type);
      return;
    }

    const cleanWord = cleanSpeechText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cacheKey = `${cleanWord}_${type}`;

    // 1. Kiểm tra cache trước
    if (audioCache.has(cacheKey)) {
      const cachedUrl = audioCache.get(cacheKey)!;
      if (cachedUrl === 'tts') {
        fallbackSpeak(cleanSpeechText, type);
      } else {
        const audio = new Audio(cachedUrl);
        audio.play().catch(() => fallbackSpeak(cleanSpeechText, type));
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
        audio.play().catch(() => fallbackSpeak(cleanSpeechText, type));
      } else {
        audioCache.set(cacheKey, 'tts');
        fallbackSpeak(cleanSpeechText, type);
      }
    } catch (err) {
      console.warn('[Audio] Error in parallel check:', err);
      fallbackSpeak(cleanSpeechText, type);
    } finally {
      controller.abort();
    }
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

  interface TokenSegment {
    type: 'text' | 'vocab' | 'expansion';
    content: string;
    data?: any;
  }

  const renderWordFamilyCloud = (text: string, children?: React.ReactNode, sentenceText?: string) => {
    const isRevealed = revealMode || showExplain[currentQ.id] || showExplainPartial[currentQ.id];

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

      // Suffix matching (e.g. budgets, budgeting, budgeted, wider...)
      if (wordLower.startsWith(stem)) {
        const suffix = wordLower.substring(stem.length);
        if (endsWithE) {
          if (/^(e|es|ed|ing|er|est|y|ely)$/.test(suffix)) return true;
        } else {
          if (/^(s|es|ed|ing|er|est|ly|y)?$/.test(suffix)) return true;
        }
      }

      // Safe prefixes only (underbudgeted, overpriced...) to prevent wrong matches like returns -> turn
      const safePrefixes = ['under', 'over', 'counter', 'multi', 'semi', 'out', 'sub', 'super', 'inter'];
      for (const prefix of safePrefixes) {
        if (wordLower.startsWith(prefix)) {
          const rest = wordLower.substring(prefix.length);
          if (rest === memberLower || rest === stem) return true;
          if (rest.startsWith(stem)) {
            const restSuffix = rest.substring(stem.length);
            if (endsWithE) {
              if (/^(e|es|ed|ing|er|est|y|ely)$/.test(restSuffix)) return true;
            } else {
              if (/^(s|es|ed|ing|er|est|ly|y)?$/.test(restSuffix)) return true;
            }
          }
        }
      }

      return false;
    };

    const isRelatedWordMatch = (memberLower: string, wordLower: string): boolean => {
      if (memberLower === wordLower) return true;
      const stem = (memberLower.length > 2 && memberLower.endsWith('e'))
        ? memberLower.slice(0, -1)
        : memberLower;
      if (wordLower.startsWith(stem)) {
        const suffix = wordLower.substring(stem.length);
        return suffix.length <= 3 && /^(s|es|ed|ing|er|est|ly|y)?$/.test(suffix);
      }
      return false;
    };

    // Entry được coi là "gốc từ" nếu type==='root' HOẶC nội dung bắt đầu bằng "Gốc:"
    const isRootEntry = (fam: any): boolean =>
      fam.type === 'root' || (typeof fam.originalValue === 'string' && fam.originalValue.trimStart().startsWith('Gốc:'));


    if (children) {
      const cleanText = text.trim();
      // Tìm cả best word match VÀ best root match riêng biệt
      let bestWordFam: any = null;
      let bestRootFam: any = null;
      let bestWordMemberLen = -1;
      let bestRootMemberLen = -1;
      let bestWordDbIdx = Infinity;
      let bestRootDbIdx = Infinity;
      let bestWordIsColA = false;

      for (let i = 0; i < wordFamiliesData.length; i++) {
        const fam = wordFamiliesData[i];
        if (!fam.words) continue;
        const isRoot = isRootEntry(fam);
        const colAWords = isRoot ? [] : getMainKeys(fam.key);

        // 1. Thử tìm khớp trong Cột A trước (với word entry)
        let foundMember = fam.words.find((member: string) => {
          const mLower = member.toLowerCase();
          if (!isRoot && !colAWords.includes(mLower)) return false;

          const lower = cleanText.toLowerCase();
          if (mLower.includes(' ')) {
            return mLower === lower;
          } else {
            return isWordMatch(mLower, lower);
          }
        });
        let matchedAsColA = !isRoot && !!foundMember;

        // 2. Nếu không khớp cột A, thử tìm khớp trong cột B (với word entry) hoặc toàn bộ (với root entry)
        if (!foundMember) {
          foundMember = fam.words.find((member: string) => {
            const mLower = member.toLowerCase();
            const lower = cleanText.toLowerCase();
            if (mLower.includes(' ')) {
              return mLower === lower;
            } else {
              return isRoot ? isWordMatch(mLower, lower) : isRelatedWordMatch(mLower, lower);
            }
          });
          matchedAsColA = false;
        }

        if (foundMember) {
          const memberLen = foundMember.length;
          if (isRoot) {
            if (memberLen > bestRootMemberLen || (memberLen === bestRootMemberLen && i < bestRootDbIdx)) {
              bestRootMemberLen = memberLen;
              bestRootDbIdx = i;
              bestRootFam = fam;
            }
          } else {
            // Ưu tiên khớp từ Cột A hơn Cột B
            const shouldReplace = !bestWordFam || 
              (matchedAsColA && !bestWordIsColA) || 
              (matchedAsColA === bestWordIsColA && (memberLen > bestWordMemberLen || (memberLen === bestWordMemberLen && i < bestWordDbIdx)));

            if (shouldReplace) {
              bestWordMemberLen = memberLen;
              bestWordDbIdx = i;
              bestWordFam = fam;
              bestWordIsColA = matchedAsColA;
            }
          }
        }
      }

      // Gộp kết quả: word trước, root sau
      const matchedFamilies: any[] = [];
      if (bestWordFam) matchedFamilies.push({ ...bestWordFam, matchedWord: cleanText });
      if (bestRootFam) matchedFamilies.push({ ...bestRootFam, matchedWord: cleanText });

      if (matchedFamilies.length > 0) {
        const primaryFam = matchedFamilies[0];
        return (
          <span className="relative inline-block group/cloud mx-0.5 select-text">
            {children}
            {isRevealed && (
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
                  setActiveWordFamily(matchedFamilies);
                }}
                className="absolute -top-[5px] -right-[6px] text-blue-400 hover:text-blue-600 transition-colors z-10 p-0 m-0 cursor-pointer"
                title={`Xem họ từ/gốc từ: ${primaryFam.key}`}
              >
                <svg className="w-2.5 h-2.5 fill-blue-100 stroke-blue-500 stroke-[1.5]" viewBox="0 0 24 24">
                  <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z" />
                </svg>
              </button>
            )}
          </span>
        );
      }
      return children;
    }

    // Nếu không có children (text thường), ta sử dụng thuật toán cắt cụm từ trước (Phrase-First)
    interface MatchCandidate {
      start: number;
      end: number;
      length: number;
      family: any;
      matchedWord: string;
      isPhrase: boolean;
      isRoot: boolean;
      isColA: boolean;
      indexInDb: number;
      memberLength: number;
    }

    const candidates: MatchCandidate[] = [];

    wordFamiliesData.forEach((fam, dbIdx) => {
      if (!fam.words) return;
      fam.words.forEach((member: string) => {
        const isPhrase = member.includes(' ');
        const escaped = member.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        let regex: RegExp;

        if (isPhrase) {
          regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        } else {
          const mLower = member.toLowerCase();
          if (mLower.length >= 4) {
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
            const mainKeys = isRootEntry(fam) ? [] : getMainKeys(fam.key);
            const isMain = isRootEntry(fam) || mainKeys.includes(member.toLowerCase());
            const matches = isMain 
              ? isWordMatch(member.toLowerCase(), matchedStr.toLowerCase())
              : isRelatedWordMatch(member.toLowerCase(), matchedStr.toLowerCase());
            if (!matches) continue;
          }
          const isColA = !isRootEntry(fam) && getMainKeys(fam.key).includes(member.toLowerCase());
          candidates.push({
            start: match.index,
            end: match.index + matchedStr.length,
            length: matchedStr.length,
            family: fam,
            matchedWord: matchedStr,
            isPhrase,
            isRoot: isRootEntry(fam),
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

    // Sắp xếp: Cụm từ > Cột A > Gốc từ (root) > dài hơn > member dài hơn > xuất hiện sớm trong db
    candidates.sort((a, b) => {
      if (a.isPhrase !== b.isPhrase) return a.isPhrase ? -1 : 1;
      if (a.isColA !== b.isColA) return a.isColA ? -1 : 1;
      if (a.isRoot !== b.isRoot) return a.isRoot ? -1 : 1;
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

    const wrapTextInSpans = (str: string, prefixKey: string) => {
      const tokens = str.split(/(\s+)/);
      return tokens.map((token, tIdx) => {
        if (token.trim() === "") {
          return token;
        }
        return (
          <span key={`${prefixKey}-${tIdx}`} className="inline-block">
            {token}
          </span>
        );
      });
    };

    const resultElements: React.ReactNode[] = [];
    let lastIdx = 0;

    selectedMatches.forEach((match, idx) => {
      if (match.start > lastIdx) {
        resultElements.push(<Fragment key={`t-${idx}`}>{wrapTextInSpans(text.substring(lastIdx, match.start), `t-${idx}`)}</Fragment>);
      }
      // Với mỗi match, tìm thêm root match (nếu có) cho cùng từ đó
      const extraRootForMatch = (() => {
        const wordLower = match.matchedWord.toLowerCase();
        let bestRoot: any = null;
        let bestLen = -1;
        wordFamiliesData.forEach((fam: any, di: number) => {
          if (!isRootEntry(fam) || !fam.words) return;
          if (fam.id === match.family.id) return;
          const found = fam.words.find((m: string) => isWordMatch(m.toLowerCase(), wordLower) || isRelatedWordMatch(m.toLowerCase(), wordLower));
          if (found && found.length > bestLen) { bestLen = found.length; bestRoot = { ...fam, matchedWord: match.matchedWord }; }
        });
        return bestRoot;
      })();

      const famList = [{ ...match.family, matchedWord: match.matchedWord }];
      if (extraRootForMatch && !famList.some((f: any) => f.id === extraRootForMatch.id)) {
        famList.push(extraRootForMatch);
      }
      // Sắp xếp: word trước, root sau
      famList.sort((a: any, b: any) => (a.type === 'root' ? 1 : 0) - (b.type === 'root' ? 1 : 0));

      resultElements.push(
        <span key={`m-${idx}`} className="relative inline-block group/cloud mx-0.5 select-text">
          {text.substring(match.start, match.end)}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (activeWordFamily.length > 0 && activeWordFamily[0].id === famList[0].id) {
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
              setActiveWordFamily(famList);
            }}
            className="absolute -top-[5px] -right-[6px] text-blue-400 hover:text-blue-600 transition-colors z-10 p-0 m-0 cursor-pointer"
            title={`Xem họ từ/gốc từ: ${famList[0].key}`}
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
      resultElements.push(<Fragment key="t-end">{wrapTextInSpans(text.substring(lastIdx), 't-end')}</Fragment>);
    }

    return resultElements;
  };

  const renderQuestionText = (text: string | null | undefined) => {
    if (!text) return null;

    // Loại bỏ số thứ tự ở đầu nếu có
    const raw = text.replace(/^\d+[\.\s]*/, '');

    // LẤY DỮ LIỆU TỪ METADATA (CỰC KỲ AN TOÀN & RỘNG RÃI)
    const meta = currentQ.metadata as any;
    const vocabs = meta?.vocabulary || explainData?.vocabulary || [];
    const expansions = meta?.explanation?.expansion || explainData?.explanation?.expansion || explainData?.expansion || [];

    // Danh sách so khớp
    const matchers: { text: string; type: 'vocab' | 'expansion'; data: any }[] = [];

    if (Array.isArray(expansions)) {
      expansions.forEach((ep: any) => {
        if (ep && ep.phrase) {
          matchers.push({ text: ep.phrase, type: 'expansion', data: ep });
        }
      });
    }

    if (Array.isArray(vocabs)) {
      vocabs.forEach((v: any) => {
        if (v && v.word) {
          matchers.push({ text: v.word, type: 'vocab', data: v });
        }
      });
    }

    // Sắp xếp các cụm từ/từ cần match theo độ dài giảm dần (Maximal Matching) để ưu tiên match từ dài trước
    matchers.sort((a, b) => b.text.length - a.text.length);

    let segments: TokenSegment[] = [{ type: 'text', content: raw }];

    matchers.forEach(matcher => {
      const newSegments: TokenSegment[] = [];

      segments.forEach(seg => {
        if (seg.type !== 'text') {
          newSegments.push(seg);
          return;
        }

        // Thoát các ký tự đặc biệt trong Regex
        const escapedText = matcher.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        // Sử dụng thuật toán Stemming thông minh để khớp cả số nhiều (s/es), quá khứ (ed), V-ing, so sánh hơn/nhất (er/est)
        // Nếu từ kết thúc bằng chữ 'e' (như lease, wide, feature), bỏ 'e' đi để khớp được cả leasing, wider, features...
        const stem = (escapedText.length > 2 && escapedText.toLowerCase().endsWith('e'))
          ? escapedText.slice(0, -1)
          : escapedText;
        const regex = new RegExp(`\\b${stem}[a-zA-Z]*\\b`, 'i');
        const match = seg.content.match(regex);

        if (match && match.index !== undefined) {
          const matchedString = match[0];
          const leftText = seg.content.substring(0, match.index);
          const rightText = seg.content.substring(match.index + matchedString.length);

          if (leftText) newSegments.push({ type: 'text', content: leftText });
          newSegments.push({ type: matcher.type, content: matchedString, data: matcher.data });
          if (rightText) newSegments.push({ type: 'text', content: rightText });
        } else {
          newSegments.push(seg);
        }
      });

      segments = newSegments;
    });

    const isRevealed = revealMode || showExplain[currentQ.id] || showExplainPartial[currentQ.id];

    return segments.map((seg, i) => {
      if (seg.type === 'vocab') {
        const meaningRaw = String(seg.data.meaning || '');
        // Tách lấy nghĩa ngắn gọn trước dấu chấm phẩy (;), hai chấm (:), dấu gạch ngang (-), dấu chấm (.), dấu ngoặc đơn hoặc ngoặc vuông
        const shortMeaning = meaningRaw.split(';')[0].split(':')[0].split('-')[0].split('.')[0].split('(')[0].split('[')[0].trim().toLowerCase();

        // Nếu từ thực tế trong đề khác từ gốc (ví dụ: harvests vs harvest, selected vs select)
        // thì hiển thị theo định dạng: "từ_gốc = nghĩa" để học sinh dễ học từ gốc
        const isDifferentForm = seg.content.toLowerCase().trim() !== String(seg.data.word || '').toLowerCase().trim();
        const displayMeaning = isDifferentForm
          ? `${String(seg.data.word || '').toLowerCase()} = ${shortMeaning}`
          : shortMeaning;

        const rubyNode = isRevealed ? (
          <ruby
            className="text-emerald-755 font-bold cursor-help transition-all align-baseline mx-0.5 whitespace-nowrap"
            title={`${seg.content} (${seg.data.ipa_uk || seg.data.ipa || ''}): ${seg.data.meaning}`}
          >
            <span className="border-b border-dashed border-emerald-400 pb-0.5">
              {seg.content}
            </span>
            <rt className="text-[10px] text-emerald-600 font-extrabold tracking-wide select-none lowercase pb-0 text-center">
              <span className="inline-block max-w-[120px] whitespace-normal break-words text-center leading-tight">
                {displayMeaning.split(',').map((part, index, arr) => (
                  <Fragment key={index}>
                    {index > 0 && <br />}
                    {part.trim()}
                    {index < arr.length - 1 && ','}
                  </Fragment>
                ))}
              </span>
            </rt>
          </ruby>
        ) : (
          <span className="font-bold border-b border-transparent pb-0.5">{seg.content}</span>
        );

        return <Fragment key={i}>{renderWordFamilyCloud(seg.content, rubyNode, raw)}</Fragment>;
      }

      if (seg.type === 'expansion') {
        const meaningRaw = String(seg.data.meaning || '');
        // Tách lấy nghĩa ngắn gọn trước dấu chấm phẩy (;), hai chấm (:), dấu gạch ngang (-), dấu chấm (.), dấu ngoặc đơn hoặc ngoặc vuông
        const shortMeaning = meaningRaw.split(';')[0].split(':')[0].split('-')[0].split('.')[0].split('(')[0].split('[')[0].trim().toLowerCase();

        // Kiểm tra biến thể của cụm từ tương tự từ đơn
        const isDifferentForm = seg.content.toLowerCase().trim() !== String(seg.data.phrase || '').toLowerCase().trim();
        const displayMeaning = isDifferentForm
          ? `${String(seg.data.phrase || '').toLowerCase()} = ${shortMeaning}`
          : shortMeaning;

        const rubyNode = isRevealed ? (
          <ruby
            className="text-purple-755 font-bold cursor-help transition-all align-baseline mx-0.5 whitespace-nowrap"
            title={`Cấu trúc: ${seg.data.phrase} - Nghĩa đầy đủ: ${seg.data.meaning}`}
          >
            <span className="border-b border-dashed border-purple-400 pb-0.5">
              {seg.content}
            </span>
            <rt className="text-[10px] text-purple-600 font-extrabold tracking-wide select-none lowercase pb-0 text-center">
              <span className="inline-block max-w-[280px] whitespace-normal break-words text-center leading-tight">
                {displayMeaning.split(',').map((part, index, arr) => (
                  <Fragment key={index}>
                    {index > 0 && <br />}
                    {part.trim()}
                    {index < arr.length - 1 && ','}
                  </Fragment>
                ))}
              </span>
            </rt>
          </ruby>
        ) : (
          <span className="font-bold border-b border-transparent pb-0.5">{seg.content}</span>
        );

        return <Fragment key={i}>{renderWordFamilyCloud(seg.content, rubyNode, raw)}</Fragment>;
      }

      // Đối với text thường, xử lý các ô trống như ban đầu
      const parts = seg.content.split(/(_{3,})/);
      return parts.map((part, pi) => {
        if (part.startsWith('_')) {
          return (
            <span key={`${i}-${pi}`} className="inline mx-3 text-slate-900 font-bold tracking-tight">
              {part}
            </span>
          );
        }
        return <Fragment key={`${i}-${pi}`}>{renderWordFamilyCloud(part, null, raw)}</Fragment>;
      });
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

  const hasAnyExplanation = revealMode || showExplain[currentQ.id] || showExplainPartial[currentQ.id];
  const revealTrueAnswer = revealMode || showExplain[currentQ.id];

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
        <div id="part5-scroll-container" className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 md:pl-8 md:pr-16 scroll-smooth webtoeic-scroll-container">
          <div className="flex-1 flex flex-col w-full min-h-0 pb-10">
            <div className="bg-white rounded-3xl shadow-md border border-blue-100 mt-4 shrink-0 flex flex-col relative z-20">
              <div className="bg-slate-50/50 border-b border-slate-100 px-6 h-14 flex items-center justify-between shrink-0 rounded-t-3xl">
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
                    id="reveal-btn"
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
                      const breakdown = explainData.options_breakdown?.[opt] || {};
                      const value = currentQ[`option${opt}`] || (currentQ as any)[`Option${opt}`] || (currentQ as any).options?.find((o: any) => o.label === opt)?.text || (currentQ as any).options?.find((o: any) => o.label === opt)?.vi;
                      let btnClass = "border-slate-200 bg-white hover:border-blue-300 text-slate-900 shadow-sm";
                      if (revealTrueAnswer) {
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
                              !revealTrueAnswer && handleSelect(qKey, opt);
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-all shrink-0 cursor-pointer hover:scale-110 active:scale-95 ${revealTrueAnswer && isCorrect ? 'bg-emerald-500 text-white border-emerald-600' :
                              revealTrueAnswer && isSelected ? 'bg-red-500 text-white border-red-600' :
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
                                {hasAnyExplanation && breakdown.meaning && (
                                  <span className="text-[12px] text-slate-500 font-medium leading-tight">
                                    = {breakdown.meaning}
                                  </span>
                                )}
                              </div>
                              {hasAnyExplanation && (isValidData(breakdown.synonyms) || isValidData(breakdown.antonyms)) && (
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
                {(revealMode || showExplain[currentQ.id] || showExplainPartial[currentQ.id]) && (
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
            {(revealMode || showExplain[currentQ.id] || showExplainPartial[currentQ.id]) && (
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
                    {revealTrueAnswer && (
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
                    )}
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
                                  const showCorrectHighlight = revealTrueAnswer && isCorrectRow;
                                  const breakdown = explainData.options_breakdown?.[opt] || {};
                                  const label = currentQ[`option${opt}`];
                                  return (
                                    <tr key={opt} className={`transition-colors divide-x divide-slate-100 ${showCorrectHighlight ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                                      <td className="px-5 py-6 whitespace-nowrap">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border-2 transition-all shadow-sm ${showCorrectHighlight ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                          {opt}
                                        </div>
                                      </td>
                                      <td className="px-5 py-6 align-top">
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 group/word">
                                            <span className={`text-lg font-bold tracking-tight ${showCorrectHighlight ? 'text-emerald-700' : 'text-slate-800'}`}>{label}</span>
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
            className={`questions-sidebar-portal fixed right-0 top-14 bottom-0 z-[999] transition-all duration-300 ease-out border-l border-white/10 shadow-2xl flex flex-col ${isSidebarHovered ? "w-72 bg-slate-900/90 backdrop-blur-xl" : "w-14 bg-white/50 backdrop-blur-sm hover:bg-white/60 cursor-pointer"}`}
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
          <div id="toeic-navigation-container" className="flex items-center gap-6 pointer-events-auto">
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
              {isFullTest ? (
                <>
                  {globalOffset + currentIndex + 1} <span className="mx-1 text-slate-300">/</span> {globalTotal || 200}
                </>
              ) : (
                <>
                  {currentIndex + 1} <span className="mx-1 text-slate-300">/</span> {questions.length}
                </>
              )}
            </div>

            {currentIndex === questions.length - 1 ? (
              isFullTest ? (
                <div className="relative group">
                  <button
                    onClick={onNextPart}
                    className="px-10 py-2.5 rounded-full font-bold text-[13px] transition-all bg-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-700 active:scale-95 uppercase tracking-widest flex items-center gap-2"
                  >
                    Tiếp sang Part 6 <ChevronRightIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-xl shadow-2xl z-[100] translate-y-2 group-hover:translate-y-0">
                    Phím tắt: Mũi tên phải
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>
              ) : !isSubmitted ? (
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

        const footerWrapperClass = "relative flex-none h-20 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[70] flex items-center justify-center pb-2 pointer-events-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)]";

        if (mounted && typeof document !== "undefined" && document.getElementById("bottom-nav-portal-target")) {
          return createPortal(
            <div className={footerWrapperClass}>
              <div className="absolute left-4 flex gap-2 pointer-events-auto z-[80]">
                <button
                  onClick={() => startToeicPartTour(5, true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
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
          <div className={footerWrapperClass}>
            <div className="absolute left-4 flex gap-2 pointer-events-auto z-[80]">
              <button
                onClick={() => startToeicPartTour(5, true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
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

      {/* TRÌNH PHÁT VIDEO CHỮA NỔI */}
      {!onToggleVideo && showVideo && videoExplanation && videoExplanation.videoUrl && (
        <FloatingVideoExplanationPlayer
          videoExplanation={videoExplanation}
          onClose={() => setShowVideo(false)}
          onQuestionSync={(targetIndex) => {
            if (isFullTest && onVideoQuestionSync) {
              onVideoQuestionSync(targetIndex);
              return;
            }
            if (targetIndex > 0 && targetIndex <= questions.length) {
              setCurrentIndex(targetIndex - 1);
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
    </div>
  );
}

interface WordFamilyEntry {
  id?: string;
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

function WordFamilyPopover({ wordFamilies: initialWordFamilies, position, onClose, onPositionChange }: DraggablePopoverProps) {
  const { isAdminMode } = useAdminEdit();
  const [wordFamilies, setWordFamilies] = useState(initialWordFamilies);
  
  useEffect(() => {
    setWordFamilies(initialWordFamilies);
  }, [initialWordFamilies]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"key" | "line" | null>(null);
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditKey = (id: string, currentValue: string) => {
    setEditingId(id);
    setEditingField("key");
    setEditingLineIdx(null);
    setEditValue(currentValue);
  };

  const startLineEdit = (id: string, idx: number, currentValue: string) => {
    setEditingId(id);
    setEditingField("line");
    setEditingLineIdx(idx);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingLineIdx(null);
    setEditValue("");
  };

  const saveKeyEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/update-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "wordFamily",
          id,
          field: "key",
          value: editValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWordFamilies(prev => prev.map(fam => {
          if (fam.id === id) {
            return { ...fam, key: editValue };
          }
          return fam;
        }));
        cancelEdit();
      } else {
        alert(data.error || "Lỗi lưu dữ liệu");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const saveLineEdit = async (id: string, idx: number, originalValue: string) => {
    setSaving(true);
    try {
      const lines = originalValue.split('\n');
      if (idx >= lines.length) {
        lines.push(editValue);
      } else {
        lines[idx] = editValue;
      }
      const newValue = lines.filter(line => line.trim().length > 0 || line === "").join('\n');

      const res = await fetch("/api/admin/update-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "wordFamily",
          id,
          field: "originalValue",
          value: newValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWordFamilies(prev => prev.map(fam => {
          if (fam.id === id) {
            return { ...fam, originalValue: newValue };
          }
          return fam;
        }));
        cancelEdit();
      } else {
        alert(data.error || "Lỗi lưu dữ liệu");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const deleteLine = async (id: string, idx: number, originalValue: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dòng này không?")) return;
    setSaving(true);
    try {
      const lines = originalValue.split('\n');
      const filteredLines = lines.filter((_, i) => i !== idx);
      const newValue = filteredLines.join('\n');

      const res = await fetch("/api/admin/update-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "wordFamily",
          id,
          field: "originalValue",
          value: newValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWordFamilies(prev => prev.map(fam => {
          if (fam.id === id) {
            return { ...fam, originalValue: newValue };
          }
          return fam;
        }));
        cancelEdit();
      } else {
        alert(data.error || "Lỗi lưu dữ liệu");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const startAddLine = (id: string, originalValue: string) => {
    const lines = originalValue.split('\n');
    startLineEdit(id, lines.length, "");
  };

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

    try {
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=${type === 'uk' ? '1' : '2'}`;
      audioCache.set(cacheKey, audioUrl);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      fallbackSpeak(cleanSpeechText);
    }
  };

  const popoverRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      onPositionChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, onPositionChange]);

  const getDisplayTitle = (keyStr: string, matchedWord?: string): string => {
    if (!matchedWord) return keyStr.split(/[,/]/)[0].trim();

    const mLower = matchedWord.toLowerCase();
    const items = keyStr.split(/[,/]/).map(item => item.trim());

    const isMatch = (member: string, target: string): boolean => {
      const memberLower = member.toLowerCase();
      if (memberLower === target) return true;
      const stem = memberLower.endsWith('e') ? memberLower.slice(0, -1) : memberLower;
      if (target.startsWith(stem)) {
        const suffix = target.substring(stem.length);
        return /^(s|es|ed|ing|er|est|ly|y|ely)?$/.test(suffix);
      }
      return false;
    };

    let bestItem = items[0] || '';
    let bestScore = -1;

    items.forEach(item => {
      const cleanItem = item.replace(/\s*\([^)]*\)/g, '').trim();
      if (isMatch(cleanItem, mLower)) {
        const score = cleanItem.length;
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
      }
    });

    return bestItem.charAt(0).toUpperCase() + bestItem.slice(1);
  };

  const formatLine = (line: string, idx: number, key: string, type: string, roots?: string[], displayTitle?: string) => {
    let cleanLine = line.trim();
    if (cleanLine.length === 0) return null;

    // Strip leading and trailing brackets from the entire line if they wrap the line
    if (cleanLine.startsWith('[') && cleanLine.endsWith(']')) {
      cleanLine = cleanLine.slice(1, -1);
    }



    let lineClass = "text-slate-700 text-sm leading-relaxed my-1.5 font-medium";
    const lowerTrimmed = cleanLine.toLowerCase();
    if (
      lowerTrimmed.startsWith('gốc:') || 
      lowerTrimmed.startsWith('goc:') || 
      lowerTrimmed.startsWith('tiền tố:') || 
      lowerTrimmed.startsWith('tien to:') ||
      lowerTrimmed.startsWith('hậu tố:') || 
      lowerTrimmed.startsWith('hau to:')
    ) {
      lineClass = "text-red-600 text-sm leading-relaxed my-1.5 font-bold";
    } else if (cleanLine.startsWith('=') || cleanLine.startsWith('~')) {
      lineClass = "text-emerald-700 text-sm leading-relaxed my-1.5 font-bold";
    } else if (cleanLine.startsWith('><')) {
      lineClass = "text-red-600 text-sm leading-relaxed my-1.5 font-bold";
    } else if (cleanLine.includes('->') || cleanLine.startsWith('-')) {
      lineClass = "text-indigo-700 text-sm leading-relaxed my-1.5 font-semibold";
    }

    const searchTerms = type === 'root' && roots
      ? roots
      : [displayTitle ? displayTitle.toLowerCase() : key.replace(/[\/,]/g, ' ').split(' ')[0]];
    const firstTerm = searchTerms[0] || '';
    const termLower = firstTerm.toLowerCase();
    const termRegex = firstTerm.length >= 2
      ? (type === 'root'
        ? new RegExp(`(${firstTerm})`, 'gi')
        : new RegExp(`\\b(${firstTerm})\\b`, 'gi'))
      : null;

    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễđìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/i;

    const highlightTerm = (text: string) => {
      if (!termRegex || !text) return text;
      termRegex.lastIndex = 0;
      const parts = text.split(termRegex);
      return parts.map((part, i) => {
        const formattedPart = part.replace(/\//g, '/\u200b');
        if (part.toLowerCase() === termLower) {
          return (
            <span key={i} className="text-amber-600 font-bold">
              {formattedPart}
            </span>
          );
        }
        return formattedPart;
      });
    };

    // Check if it is a list or synonym line that should be displayed in a 2-column grid
    const isExampleLine = cleanLine.startsWith('→') || cleanLine.startsWith('->') || cleanLine.startsWith('-');
    const isGridLine = !isExampleLine && (cleanLine.startsWith('=') || cleanLine.startsWith('~') || cleanLine.startsWith('><') || cleanLine.includes('↔') || cleanLine.includes('|'));
    if (isGridLine) {
      const rawItems = cleanLine.includes('↔') 
        ? cleanLine.split('↔') 
        : (cleanLine.includes('|') ? cleanLine.split('|') : cleanLine.split(/,(?![^(]*\))/));
      
      let prefix = "";
      const prefixMatch = rawItems[0].match(/^([=~><]+\s*)/);
      if (prefixMatch) {
        prefix = prefixMatch[1];
        rawItems[0] = rawItems[0].slice(prefix.length);
      }

      return (
        <div className={lineClass}>
          {prefix && <span className="font-bold text-slate-500 mr-2">{prefix}</span>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
            {rawItems.map((item, i) => {
              const word = item.trim();
              if (!word) return null;

              const tokens = word.split(/(\[.*?\]|\(.*?\))/g);
              return (
                <div key={i} className="flex items-start gap-1 min-w-0">
                  {tokens.map((tok, tIdx) => {
                    if (!tok) return null;
                    if ((tok.startsWith('[') && tok.endsWith(']')) || (tok.startsWith('(') && tok.endsWith(')'))) {
                      let displayTok = tok;
                      if (displayTok.startsWith('[') && displayTok.endsWith(']')) {
                        displayTok = displayTok.slice(1, -1);
                        return (
                          <span key={tIdx} className="text-teal-600 text-[0.85em] font-normal px-1 bg-teal-50/50 rounded whitespace-normal">
                            {displayTok}
                          </span>
                        );
                      }
                      return (
                        <span key={tIdx} className="text-slate-500 font-normal text-xs italic">
                          {displayTok}
                        </span>
                      );
                    }
                    
                    const hasVietnamese = vietnameseRegex.test(tok);
                    const hasEnglishLetters = /[a-zA-Z0-9]/.test(tok);
                    if (hasEnglishLetters && !hasVietnamese) {
                      const cleanSpeech = tok.replace(/\(.*?\)/g, '').trim();
                      return (
                        <span
                          key={tIdx}
                          onClick={() => speak(cleanSpeech)}
                          className="cursor-pointer hover:underline text-slate-900 font-semibold inline-block animate-in fade-in"
                          title={`Nghe: ${cleanSpeech}`}
                        >
                          {highlightTerm(tok)}
                          <Volume2 className="w-3.5 h-3.5 text-slate-400/80 hover:text-blue-600 transition-colors shrink-0 inline-block align-middle ml-1" />
                        </span>
                      );
                    }
                    return <span key={tIdx} className="inline">{highlightTerm(tok)}</span>;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Default/Normal Line rendering (1 column)
    const tokens = cleanLine.split(/(\|\||[,;=~:|]|\->|↔|\[.*?\]|\(.*?\))/g);
    return (
      <div className={`${lineClass} inline-block w-full`}>
        {tokens.map((tok: string, tIdx: number) => {
          if (!tok) return null;

          if ((tok.startsWith('[') && tok.endsWith(']')) || (tok.startsWith('(') && tok.endsWith(')'))) {
            let displayTok = tok;
            if (displayTok.startsWith('[') && displayTok.endsWith(']')) {
              displayTok = displayTok.slice(1, -1);
              return (
                <span key={tIdx} className="text-teal-600 text-[0.85em] font-normal px-1 bg-teal-50/50 rounded">
                  {displayTok}
                </span>
              );
            }
            return (
              <span key={tIdx} className="text-slate-500 font-normal text-xs italic">
                {displayTok}
              </span>
            );
          }

          if (/^(\|\||[,;=~:|]|\->|↔)$/.test(tok.trim())) {
            return (
              <span key={tIdx} className="text-slate-400 font-semibold mx-1">
                {tok}
              </span>
            );
          }

          const trimmedTok = tok.trim();
          if (trimmedTok.length === 0) {
            return <span key={tIdx}>&nbsp;</span>;
          }
          const bulletMatch = tok.match(/^([•*·\-]+\s*)(.*)/);
          let prefix = "";
          let coreText = tok;
          if (bulletMatch) {
            prefix = bulletMatch[1];
            coreText = bulletMatch[2];
          }
          const trimmedCore = coreText.trim();
          if (trimmedCore.length === 0) {
            return <span key={tIdx}>{prefix}</span>;
          }
          const hasVietnamese = vietnameseRegex.test(trimmedCore);
          const hasEnglishLetters = /[a-zA-Z0-9]/.test(trimmedCore);
          if (hasEnglishLetters && !hasVietnamese) {
            const cleanSpeech = trimmedCore.replace(/\(.*?\)/g, '').trim();
            return (
              <span key={tIdx} className="inline">
                {prefix && <span className="text-slate-400 font-bold mr-0.5">{prefix}</span>}
                <span
                  onClick={() => speak(cleanSpeech)}
                  className="cursor-pointer hover:underline text-slate-900 font-semibold inline"
                  title={`Nghe: ${cleanSpeech}`}
                >
                  {highlightTerm(coreText)}
                  <Volume2 className="w-3.5 h-3.5 text-slate-400/80 hover:text-blue-600 transition-colors shrink-0 inline-block align-middle ml-1" />
                </span>
              </span>
            );
          }
          return (
            <span key={tIdx} className="inline">
              {prefix && <span className="text-slate-400 font-bold mr-0.5">{prefix}</span>}
              {highlightTerm(coreText)}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={popoverRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-[9999] w-fit min-w-[350px] max-w-[650px] max-h-[400px] overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col animate-in zoom-in-95 duration-200"
    >
      <div
        onMouseDown={handleMouseDown}
        className="popover-header px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 flex items-center justify-between cursor-move select-none shrink-0"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Mở rộng vốn từ</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 select-text webtoeic-scroll-container">
        {wordFamilies.map((fam, famIdx) => {
          const displayTitle = getDisplayTitle(fam.key, fam.matchedWord);
          const isRoot = fam.type === 'root' || (typeof fam.originalValue === 'string' && fam.originalValue.trimStart().startsWith('Gốc:'));
          const lines = (fam.originalValue || "").split('\n');

          return (
            <div key={famIdx} className="relative">
              {famIdx > 0 && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gốc từ</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              )}
              
              {/* Inline Key Edit */}
              <div className="group/title relative">
                {editingId === fam.id && editingField === "key" ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-sm border-2 border-indigo-500 rounded-lg outline-none font-medium text-slate-800"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      disabled={saving}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveKeyEdit(fam.id!);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <button
                      onClick={() => saveKeyEdit(fam.id!)}
                      disabled={saving}
                      className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <h4 className={`text-lg font-black mb-2 border-b pb-1.5 capitalize flex items-center justify-between ${isRoot && famIdx > 0 ? 'text-amber-700 border-amber-100' : 'text-slate-800 border-slate-100'}`}>
                    <span>{displayTitle}</span>
                    {isAdminMode && fam.id && (
                      <button
                        onClick={() => startEditKey(fam.id!, fam.key)}
                        className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-indigo-600 p-1 rounded-md transition duration-150 animate-in fade-in"
                        title="Sửa nhóm từ (Key)"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                  </h4>
                )}
              </div>

              {/* Line-by-Line Edit & Content Rendering */}
              <div className="space-y-1">
                {lines.map((lineText, lineIdx) => {
                  const isEditingThisLine = editingId === fam.id && editingField === "line" && editingLineIdx === lineIdx;

                  if (isEditingThisLine) {
                    return (
                      <div key={lineIdx} className="flex items-center gap-2 my-1 animate-in slide-in-from-top-1 duration-150">
                        <input
                          type="text"
                          className="flex-1 px-2.5 py-1 text-sm border-2 border-indigo-500 rounded-lg outline-none font-medium text-slate-850"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          disabled={saving}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveLineEdit(fam.id!, lineIdx, fam.originalValue);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <button
                          onClick={() => saveLineEdit(fam.id!, lineIdx, fam.originalValue)}
                          disabled={saving}
                          className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition disabled:opacity-50"
                          title="Lưu"
                        >
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition"
                          title="Hủy"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={lineIdx} className="group/line relative pr-8">
                      {formatLine(lineText, lineIdx, fam.key, fam.type, fam.roots, displayTitle)}
                      {isAdminMode && fam.id && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/line:opacity-100 transition-all duration-150 flex items-center gap-0.5 bg-white pl-1.5">
                          <button
                            onClick={() => startLineEdit(fam.id!, lineIdx, lineText)}
                            className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-100 transition"
                            title="Sửa dòng này"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => deleteLine(fam.id!, lineIdx, fam.originalValue)}
                            className="text-slate-400 hover:text-red-600 p-0.5 rounded hover:bg-slate-100 transition"
                            title="Xóa dòng này"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add New Line Control */}
              {isAdminMode && fam.id && (
                <div className="mt-3 pt-2 border-t border-dashed border-slate-150 flex justify-end">
                  <button
                    onClick={() => startAddLine(fam.id!, fam.originalValue)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm dòng giải nghĩa
                  </button>
                </div>
              )}

            </div>
          );
        })}
        {editingId && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 space-y-1.5 leading-relaxed font-medium animate-in fade-in duration-200 shrink-0">
            <div className="font-bold text-slate-700 flex items-center gap-1">💡 Hướng dẫn soạn thảo trực quan:</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-slate-500">
              <div>• <span className="font-bold text-slate-700">Từ vựng + nghĩa:</span> <code className="px-1 bg-amber-50 text-amber-700 rounded font-semibold">look (nhìn)</code> (Tự tạo loa nghe)</div>
              <div>• <span className="font-bold text-slate-700">Chia cột:</span> Dùng dấu <code className="px-1 bg-teal-50 text-teal-700 rounded font-semibold">|</code> hoặc <code className="px-1 bg-emerald-50 text-emerald-700 rounded font-semibold">=</code></div>
              <div>• <span className="font-bold text-slate-700">Từ trái nghĩa:</span> Bắt đầu bằng <code className="px-1 bg-red-50 text-red-700 rounded font-semibold">&gt;&lt;</code></div>
              <div>• <span className="font-bold text-slate-700">Ghi chú nhỏ:</span> Đặt trong ngoặc vuông <code className="px-1 bg-indigo-50 text-indigo-700 rounded font-semibold">[ghi chú]</code></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
