"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  Timer, 
  Send, 
  Lightbulb, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Trophy,
  Info,
  PenTool,
  Sparkles,
  Eye,
  EyeOff,
  BookOpen,
  Trash2
} from "lucide-react";
import { useSession } from "next-auth/react";
import { showToast } from "@/components/UI/Toast";
import { useDictionary } from "@/components/Dictionary/DictionaryProvider";

export interface UserHighlight {
  id: string;
  passageIdx: number;
  selector: string; // CSS selector of parent sentence/p (e.g. '[data-sid="s1"]')
  startOffset: number;
  endOffset: number;
  text: string;
  color: string; // 'yellow' | 'green' | 'blue' | 'pink' | 'purple'
  questionNo?: number;
}

// Helper chuyển giây thành chuỗi MM:SS
const formatMMSS = (secs: number): string => {
  if (typeof secs !== 'number' || isNaN(secs)) return '00:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Định nghĩa màu cho dẫn chứng gợi ý (tương tự Part 7)
interface EvidenceColor {
  bg: string;
  text: string;
  border: string;
  hexBg: string;
  hexBorder: string;
  hexText: string;
  badgeBg: string;
  badgeText: string;
}

const getEvidenceColor = (colorName: string): EvidenceColor => {
  const map: Record<string, EvidenceColor> = {
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', hexBg: '#fef9c3', hexBorder: '#fef08a', hexText: '#854d0e', badgeBg: '#eab308', badgeText: '#000000' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', hexBg: '#ecfeff', hexBorder: '#a5f3fc', hexText: '#155e75', badgeBg: '#06b6d4', badgeText: '#ffffff' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', hexBg: '#ecfdf5', hexBorder: '#a7f3d0', hexText: '#065f46', badgeBg: '#10b981', badgeText: '#ffffff' },
    magenta: { bg: 'bg-pink-100', text: 'text-pink-805', border: 'border-pink-200', hexBg: '#fdf2f8', hexBorder: '#fbcfe8', hexText: '#9d174d', badgeBg: '#ec4899', badgeText: '#ffffff' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-850', border: 'border-orange-200', hexBg: '#fff7ed', hexBorder: '#ffedd5', hexText: '#9a3412', badgeBg: '#f97316', badgeText: '#ffffff' }
  };
  return map[colorName] || map.yellow;
};

const getUserHighlightHex = (color: string): string => {
  const map: Record<string, string> = {
    yellow: '#fef08a', // bright yellow
    green: '#86efac',  // mint green
    blue: '#93c5fd',   // sky blue
    pink: '#fda4af',   // rose pink
    purple: '#d8b4fe'  // lavender purple
  };
  return map[color] || '#fef08a';
};

// Hàm quy đổi từ số câu đúng sang Band Score IELTS Reading (Academic)
const getIeltsBandScore = (correctCount: number): number => {
  if (correctCount >= 39) return 9.0;
  if (correctCount >= 37) return 8.5; // 37, 38
  if (correctCount >= 35) return 8.0; // 35, 36
  if (correctCount >= 33) return 7.5; // 33, 34
  if (correctCount >= 30) return 7.0; // 30, 31, 32
  if (correctCount >= 27) return 6.5; // 27, 28, 29
  if (correctCount >= 23) return 6.0; // 23, 24, 25, 26
  if (correctCount >= 20) return 5.5; // 20, 21, 22
  if (correctCount >= 15) return 5.0; // 15, 16, 17, 18, 19
  if (correctCount >= 13) return 4.5; // 13, 14
  if (correctCount >= 10) return 4.0; // 10, 11, 12
  if (correctCount >= 8) return 3.5;  // 8, 9
  if (correctCount >= 6) return 3.0;  // 6, 7
  if (correctCount >= 4) return 2.5;  // 4, 5
  if (correctCount >= 2) return 2.0;  // 2, 3
  return 0.0;
};

// Hàm inject các badge câu hỏi thực tế vào HTML đoạn văn
const injectBadgesToHtml = (rawHtml: string, evidenceMap: Record<string, { colors: string[], qNos: number[] }>) => {
  if (!rawHtml) return "";
  if (typeof window === "undefined") return rawHtml;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
    const spans = doc.querySelectorAll("span[data-sid]");
    
    spans.forEach((span) => {
      const sid = span.getAttribute("data-sid");
      if (!sid) return;
      
      const s = String(sid).toLowerCase();
      // Tìm dữ liệu map tương thích case-insensitive và suffix
      let matchData = evidenceMap[s];
      if (!matchData) {
        const foundKey = Object.keys(evidenceMap).find(k => 
          k.toLowerCase() === s || 
          s.endsWith("-" + k.toLowerCase()) ||
          k.toLowerCase().endsWith("-" + s)
        );
        if (foundKey) {
          matchData = evidenceMap[foundKey];
        }
      }
      
      // Xóa badge cũ để tránh nhân đôi khi render lại
      const oldBadges = span.querySelectorAll(".ielts-badge-wrapper");
      oldBadges.forEach(b => b.remove());
      
      if (matchData && matchData.qNos.length > 0) {
        const wrapper = doc.createElement("span");
        wrapper.className = "ielts-badge-wrapper inline-flex items-center gap-1 mr-1 select-none";
        wrapper.setAttribute("contenteditable", "false");
        wrapper.style.display = "inline-flex";
        wrapper.style.verticalAlign = "middle";
        wrapper.style.gap = "3px";
        wrapper.style.marginRight = "4px";
        
        matchData.qNos.forEach((qNo, idx) => {
          const groupColorName = matchData.colors[idx] || matchData.colors[0] || 'yellow';
          const colorConfig = getEvidenceColor(groupColorName);
          
          const badge = doc.createElement("span");
          badge.className = "ielts-badge";
          badge.textContent = String(qNo);
          
          badge.style.display = "inline-flex";
          badge.style.alignItems = "center";
          badge.style.justifyContent = "center";
          badge.style.backgroundColor = colorConfig.badgeBg;
          badge.style.color = colorConfig.badgeText;
          badge.style.border = `1px solid ${colorConfig.badgeBg}`;
          badge.style.borderRadius = "4px";
          badge.style.padding = "0 4.5px";
          badge.style.height = "15px";
          badge.style.minWidth = "15px";
          badge.style.fontSize = "9px";
          badge.style.fontWeight = "900";
          badge.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
          badge.style.lineHeight = "1";
          badge.style.transform = "translateY(-1px)";
          
          wrapper.appendChild(badge);
        });
        
        if (span.firstChild) {
          span.insertBefore(wrapper, span.firstChild);
        } else {
          span.appendChild(wrapper);
        }
      }
    });
    return doc.body.innerHTML;
  } catch (e) {
    console.error("Error parsing HTML with DOMParser:", e);
    return rawHtml;
  }
};

// Hàm định dạng in đậm các từ khóa quan trọng trong hướng dẫn đề bài
const formatInstruction = (text: string) => {
  if (!text) return "";
  let formatted = text.trim();

  // Thay thế các ký tự xuống dòng thực tế trước
  formatted = formatted.replace(/\r?\n/g, '<br />');

  // 1. In đậm và tạo dòng riêng cho phần Questions X-Y
  // Ví dụ: "Questions 17-21" hoặc "Question 23-26"
  formatted = formatted.replace(
    /(questions?\s+\d+(?:-\d+|\s+to\s+\d+)?)/gi,
    '<strong class="block text-[16px] font-black text-slate-800 mt-1 mb-1.5 not-italic">$1</strong>'
  );

  // 2. Định dạng xuống dòng và làm nổi bật phần chú ý NB / Note
  // Ví dụ: "NB: YOU MAY USE ANY LETTER MORE THAN ONCE."
  formatted = formatted.replace(
    /(NB:|Note:)/gi,
    '<br /><strong class="inline-block text-[14px] text-blue-600 font-black not-italic mt-2">$1</strong>'
  );

  // 3. In đậm các cụm từ giới hạn số lượng từ
  formatted = formatted.replace(
    /(no\s+more\s+than\s+(?:one|two|three|four|\d+)\s+words?(?:\s+and\/or\s+a\s+number)?)/gi,
    '<strong>$1</strong>'
  );
  formatted = formatted.replace(
    /((?:one\s+word\s+only|only\s+one\s+word|a\s+single\s+word))/gi,
    '<strong>$1</strong>'
  );

  // 4. In đậm các cụm từ chỉ vị trí hộp câu hỏi
  formatted = formatted.replace(
    /(boxes?\s+\d+(?:-\d+|\s+to\s+\d+)?)/gi,
    '<strong>$1</strong>'
  );

  // 5. In đậm các đáp án dạng TRUE / FALSE / NOT GIVEN hoặc YES / NO / NOT GIVEN
  formatted = formatted.replace(
    /\b(TRUE|FALSE|NOT GIVEN|YES|NO)\b/g,
    '<strong>$1</strong>'
  );

  // Dọn dẹp các thẻ br thừa do replace gây ra ở đầu dòng
  formatted = formatted.replace(/^(?:<br\s*\/?>)+/i, '');

  return formatted;
};

interface IeltsReadingPlayerProps {
  lessonId: string;
  courseId?: string;
  nextLessonId?: string;
  passages: any[]; // Mảng chứa 3 JSON của 3 Passages
  previousAttempts?: any[]; // Lịch sử làm bài trước đó (FullTestAttempt)
  userId?: string | null;
}

export default function IeltsReadingPlayer({
  lessonId,
  courseId,
  nextLessonId,
  passages = [],
  previousAttempts = [],
  userId: propUserId
}: IeltsReadingPlayerProps) {
  const { data: session } = useSession();
  const userId = propUserId || session?.user?.id;
  const { openDictionary } = useDictionary();

  // Lấy lượt thi gần nhất (nếu có) để hiển thị lịch sử xem lại
  const latestAttempt = useMemo(() => {
    if (!previousAttempts || previousAttempts.length === 0) return null;
    return previousAttempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [previousAttempts]);

  // Tab active: Passage 1 (0), Passage 2 (1), Passage 3 (2)
  const [activePassageIdx, setActivePassageIdx] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Câu trả lời của học viên: { questionNo: userResponseText }
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Trạng thái gợi ý bóng đèn của từng câu hỏi: { questionNo: boolean }
  const [hintsActive, setHintsActive] = useState<Record<number, boolean>>({});

  // Trạng thái thi
  const [isSubmitted, setIsSubmitted] = useState(!!latestAttempt);
  const [showResults, setShowResults] = useState(!!latestAttempt);

  // Trạng thái hiển thị lời giải / dịch nghĩa (Toggle bằng Eye icon)
  const [showExplanation, setShowExplanation] = useState(!!latestAttempt);

  // Bộ đếm giờ (60 phút = 3600 giây)
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [timeSpent, setTimeSpent] = useState(0);

  // Câu hỏi đang được chọn (để đồng bộ highlight/scroll)
  const [selectedQuestionNo, setSelectedQuestionNo] = useState<number | null>(null);

  // Chiều rộng cột trái bài đọc (%), mặc định 50%
  const [leftWidth, setLeftWidth] = useState(50);
  const isDragging = useRef(false);
  const [isResizing, setIsResizing] = useState(false);

  // Drag & Drop state cho MATCHING_HEADINGS
  const [dragItem, setDragItem] = useState<{ code: string; fromQuestionNo?: number } | null>(null);
  const [dropTargetNo, setDropTargetNo] = useState<number | 'pool' | null>(null);

  // Tooltip dịch nghĩa câu
  const [tooltip, setTooltip] = useState<{ text: string; rect: DOMRect; sid: string } | null>(null);

  // Menu nổi khi bôi đen text để highlight
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; range: Range } | null>(null);

  // Trạng thái highlight của học viên
  const [userHighlights, setUserHighlights] = useState<UserHighlight[]>([]);
  const [showUserHighlights, setShowUserHighlights] = useState(true);
  const [activeHighlightMenu, setActiveHighlightMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const lastActiveMenuOpenTime = useRef<number>(0);

  const passageScrollRef = useRef<HTMLDivElement>(null);
  const questionsScrollRef = useRef<HTMLDivElement>(null);

  // Chuẩn hóa toàn bộ câu hỏi (1-40) để dễ truy xuất
  const allQuestions = useMemo(() => {
    const list: any[] = [];
    passages.forEach((p, pIdx) => {
      const groups = p.question_groups || [];
      groups.forEach((g: any) => {
        const questions = g.questions || [];
        questions.forEach((q: any) => {
          list.push({
            ...q,
            passageIdx: pIdx,
            group_type: g.question_type,
            instruction: g.instruction,
            options_pool: g.options_pool,
            group_color: g.group_color || "yellow"
          });
        });
      });
    });
    // Sắp xếp theo số câu hỏi tăng dần
    return list.sort((a, b) => a.questionNo - b.questionNo);
  }, [passages]);

  // Nhóm câu hỏi thuộc passage đang active
  const activeQuestions = useMemo(() => {
    return allQuestions.filter(q => q.passageIdx === activePassageIdx);
  }, [allQuestions, activePassageIdx]);

  // Bản dịch map chung cho tất cả các passage
  const translationMap = useMemo(() => {
    const map: Record<string, string> = {};
    passages.forEach((p: any) => {
      const ps = p.passages?.[0] || p;
      if (ps.translation_map) {
        Object.assign(map, ps.translation_map);
      }
    });
    return map;
  }, [passages]);

  // Cấu hình map highlight của gợi ý bóng đèn
  const hintsEvidenceMap = useMemo(() => {
    if (isSubmitted || showExplanation) {
      // Khi đã nộp bài hoặc bật nút Hiện lời giải, hiện tất cả các câu dẫn chứng của các câu hỏi với màu sắc tương ứng theo Nhóm câu hỏi
      const map: Record<string, { colors: string[], qNos: number[] }> = {};
      const colors = ['yellow', 'cyan', 'emerald', 'magenta', 'orange'];
      
      let groupGlobalIdx = 0;
      passages.forEach((p) => {
        const groups = p.question_groups || [];
        groups.forEach((g: any) => {
          const groupColor = colors[groupGlobalIdx % colors.length];
          groupGlobalIdx++;
          
          const questions = g.questions || [];
          questions.forEach((q: any) => {
            const sids = q.evidence_sids || q.metadata?.evidence_sids || q.explanation?.evidence_sids || [];
            sids.forEach((sid: any) => {
              if (!sid) return;
              const s = String(sid);
              if (!map[s]) map[s] = { colors: [], qNos: [] };
              if (!map[s].colors.includes(groupColor)) map[s].colors.push(groupColor);
              if (!map[s].qNos.includes(q.questionNo)) map[s].qNos.push(q.questionNo);
            });
          });
        });
      });
      return map;
    }

    // Khi đang làm, chỉ hiện highlight cho các câu hỏi đang được click bật bóng đèn gợi ý
    const map: Record<string, { colors: string[], qNos: number[] }> = {};
    const colors = ['yellow', 'cyan', 'emerald', 'magenta', 'orange'];
    
    let groupGlobalIdx = 0;
    passages.forEach((p) => {
      const groups = p.question_groups || [];
      groups.forEach((g: any) => {
        const groupColor = colors[groupGlobalIdx % colors.length];
        groupGlobalIdx++;
        
        const questions = g.questions || [];
        questions.forEach((q: any) => {
          if (hintsActive[q.questionNo]) {
            const sids = q.evidence_sids || q.metadata?.evidence_sids || q.explanation?.evidence_sids || [];
            sids.forEach((sid: any) => {
              if (!sid) return;
              const s = String(sid);
              if (!map[s]) map[s] = { colors: [], qNos: [] };
              if (!map[s].colors.includes(groupColor)) map[s].colors.push(groupColor);
              if (!map[s].qNos.includes(q.questionNo)) map[s].qNos.push(q.questionNo);
            });
          }
        });
      });
    });
    return map;
  }, [passages, hintsActive, isSubmitted, showExplanation]);

  // Đánh dấu đã mount lên Client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Đếm ngược đồng hồ làm bài
  useEffect(() => {
    if (isSubmitted || showResults) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Tự động nộp bài khi hết giờ
          handleSubmitTest(true);
          return 0;
        }
        setTimeSpent(t => t + 1);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, showResults]);

  // Khôi phục bài làm từ LocalStorage nếu có
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`ielts_reading_answers_${lessonId}`);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        const restored: Record<number, string> = {};
        Object.entries(parsed).forEach(([k, v]) => {
          restored[parseInt(k)] = String(v);
        });
        setAnswers(restored);
      } catch (e) {}
    }

    const savedHighlights = localStorage.getItem(`ielts_reading_highlights_${lessonId}`);
    if (savedHighlights) {
      try {
        setUserHighlights(JSON.parse(savedHighlights));
      } catch (e) {}
    } else {
      setUserHighlights([]);
    }
  }, [lessonId]);

  // Lắng nghe phím tắt ArrowLeft/ArrowRight để chuyển Passage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        (activeEl as HTMLElement).isContentEditable
      )) {
        return; // Bỏ qua phím tắt khi học viên đang gõ đáp án
      }

      if (e.key === "ArrowLeft") {
        setActivePassageIdx(prev => {
          if (prev > 0) return prev - 1;
          return prev;
        });
      } else if (e.key === "ArrowRight") {
        setActivePassageIdx(prev => {
          if (prev < passages.length - 1) return prev + 1;
          return prev;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [passages.length]);

  // Cuộn cả 2 panel về đầu khi chuyển Passage
  useEffect(() => {
    if (passageScrollRef.current) {
      passageScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (questionsScrollRef.current) {
      questionsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activePassageIdx]);

  // Cập nhật LocalStorage khi câu trả lời thay đổi
  const handleAnswerChange = (qNo: number, value: string) => {
    if (isSubmitted) return;
    const newAnswers = { ...answers, [qNo]: value };
    setAnswers(newAnswers);
    localStorage.setItem(`ielts_reading_answers_${lessonId}`, JSON.stringify(newAnswers));
  };

  // Xử lý tick chọn nhiều đáp án dạng MULTIPLE_CHOICE_MULTI
  const handleMultiChoiceChange = (optCode: string, groupQuestions: any[]) => {
    if (isSubmitted) return;
    
    // Lấy các đáp án hiện tại của nhóm câu hỏi này
    const currentSelections = groupQuestions
      .map((q: any) => answers[q.questionNo] || "")
      .filter(Boolean);
      
    let newSelections = [...currentSelections];
    
    if (newSelections.includes(optCode)) {
      // Bỏ chọn
      newSelections = newSelections.filter(x => x !== optCode);
    } else {
      // Chọn thêm (tối đa bằng số câu hỏi trong nhóm)
      if (newSelections.length < groupQuestions.length) {
        newSelections.push(optCode);
      } else {
        // Tự động bỏ lựa chọn cũ nhất và thêm lựa chọn mới (FIFO)
        newSelections.shift();
        newSelections.push(optCode);
      }
    }
    
    // Cập nhật lại answers cho các câu hỏi phụ của nhóm
    const updatedAnswers = { ...answers };
    groupQuestions.forEach((q: any, idx: number) => {
      updatedAnswers[q.questionNo] = newSelections[idx] || "";
    });
    
    setAnswers(updatedAnswers);
    localStorage.setItem(`ielts_reading_answers_${lessonId}`, JSON.stringify(updatedAnswers));
  };

  // Tính số câu trả lời đúng
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    allQuestions.forEach(q => {
      const userAns = (answers[q.questionNo] || "").trim().toLowerCase();
      const correctAns = String(q.correctAnswer || "").trim().toLowerCase();
      
      if (!userAns) {
        unanswered++;
      } else if (userAns === correctAns || correctAns.split('/').map((x: string) => x.trim()).includes(userAns)) {
        correct++;
      } else {
        incorrect++;
      }
    });

    return {
      correctCount: correct,
      incorrectCount: incorrect,
      unansweredCount: unanswered,
      bandScore: getIeltsBandScore(correct)
    };
  }, [allQuestions, answers]);

  // Xử lý nộp bài
  const handleSubmitTest = async (auto = false) => {
    if (isSubmitted) return;
    
    if (!auto) {
      const confirmSubmit = window.confirm("Bạn có chắc chắn muốn nộp bài thi IELTS Reading?");
      if (!confirmSubmit) return;
    }

    setIsSubmitted(true);
    setShowResults(true);
    setShowExplanation(true);
    localStorage.removeItem(`ielts_reading_answers_${lessonId}`); // Xoá nháp sau khi nộp

    // Lưu kết quả vào DB
    if (userId) {
      try {
        const res = await fetch("/api/me/full-test-attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            testId: passages[0]?.test_title || "IELTS Reading Test",
            lcScore: 0,
            rcScore: stats.correctCount, 
            totalScore: stats.bandScore,
            correctCount: stats.correctCount,
            incorrectCount: stats.incorrectCount,
            unansweredCount: stats.unansweredCount,
            timeSpent: timeSpent,
            attempts: [] // Truyền rỗng để tránh foreign key constraint
          })
        });

        if (res.ok) {
          showToast("Ghi nhận kết quả làm bài thành công!", "success");
        } else {
          console.error("Failed to save attempt summary");
        }
      } catch (err) {
        console.error("Error submitting test attempt:", err);
      }
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Tính % từ clientX tương đối với container (đúng khi có sidebar)
  const calcPercent = (clientX: number) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return null;
    const pct = ((clientX - box.left) / box.width) * 100;
    if (pct < 25 || pct > 75) return null;
    return pct;
  };

  // Kéo chia đôi màn hình — cả mouse lẫn touch (iPad)
  const handleDragStart = (clientX: number) => {
    isDragging.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const pct = calcPercent(e.clientX);
      if (pct !== null) setLeftWidth(pct);
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const pct = calcPercent(e.touches[0].clientX);
      if (pct !== null) setLeftWidth(pct);
    };
    const onTouchEnd = () => {
      isDragging.current = false;
      setIsResizing(false);
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Làm lại bài
  const handleReset = () => {
    const confirmReset = window.confirm("Bạn có muốn làm lại bài thi từ đầu?");
    if (!confirmReset) return;

    setAnswers({});
    setHintsActive({});
    setIsSubmitted(false);
    setShowResults(false);
    setShowExplanation(false);
    setTimeLeft(60 * 60);
    setTimeSpent(0);
    setSelectedQuestionNo(null);
    setTooltip(null);
    setUserHighlights([]);
    localStorage.removeItem(`ielts_reading_answers_${lessonId}`);
    localStorage.removeItem(`ielts_reading_highlights_${lessonId}`);
  };



  // Đăng ký sự kiện native mouseup trực tiếp trên container bài đọc để e.stopPropagation()
  // chặn đứng hoàn toàn sự kiện mouseup lan truyền lên document (tắt từ điển tự động)
  useEffect(() => {
    const el = passageScrollRef.current;
    if (!el) return;

    const handleNativeMouseUp = (e: MouseEvent) => {
      // Nếu đang kéo thanh resize → KHÔNG chặn sự kiện, để window.mouseup kết thúc resize
      if (isDragging.current) return;
      // Chặn native event để DictionaryProvider toàn cục không nhận được sự kiện mouseup
      e.stopPropagation();


      const selection = window.getSelection();
      if (isSubmitted) return;
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        
        // Đảm bảo selection nằm trong phần bài đọc
        if (el.contains(range.commonAncestorContainer)) {
          const rect = range.getBoundingClientRect();
          setSelectionMenu({
            x: rect.left + rect.width / 2,
            y: rect.top - 45,
            range
          });
        }
      } else {
        setSelectionMenu(null);
      }
    };

    el.addEventListener('mouseup', handleNativeMouseUp);
    return () => {
      el.removeEventListener('mouseup', handleNativeMouseUp);
    };
  }, [isSubmitted]);

  // Click ra ngoài để đóng các menu nổi
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (Date.now() - lastActiveMenuOpenTime.current < 200) return;
      if (!document.body.contains(target)) return;
      if (activeHighlightMenu && !target.closest('.user-highlight') && !target.closest('[data-active-hl-menu="true"]')) {
        setActiveHighlightMenu(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeHighlightMenu]);

  // Lắng nghe phím tắt xóa/đóng khi đang mở menu sửa đổi highlight
  useEffect(() => {
    if (!activeHighlightMenu) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteHighlight(activeHighlightMenu.id);
      } else if (e.key === 'Escape') {
        setActiveHighlightMenu(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeHighlightMenu, userHighlights]);

  // Hover xem dịch tiếng Việt
  const handleSentenceHover = (sid: string | null, e: React.MouseEvent, rect?: DOMRect) => {
    if (!showExplanation) {
      setTooltip(null);
      return;
    }
    if (!sid) {
      setTooltip(null);
      return;
    }
    const textVi = translationMap[sid];
    if (textVi && rect) {
      setTooltip({ text: textVi, rect, sid });
    }
  };

  // Click bóng đèn gợi ý
  const handleToggleHint = (qNo: number, q: any) => {
    const isNowActive = !hintsActive[qNo];
    setHintsActive(prev => ({ ...prev, [qNo]: isNowActive }));

    if (isNowActive) {
      const sids = q.evidence_sids || q.metadata?.evidence_sids || q.explanation?.evidence_sids || [];
      const sid = sids[0];
      if (sid && passageScrollRef.current) {
        setTimeout(() => {
          const el = passageScrollRef.current?.querySelector(`[data-sid="${sid}"]`) || 
                     passageScrollRef.current?.querySelector(`[data-sid="${sid.toUpperCase()}"]`) || 
                     passageScrollRef.current?.querySelector(`[data-sid="${sid.toLowerCase()}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Tạo hiệu ứng nháy viền nhẹ cho câu dẫn chứng
            el.classList.add("highlight-blink");
            setTimeout(() => el.classList.remove("highlight-blink"), 2000);
          }
        }, 100);
      }
    }
  };



  // Tìm selector của thẻ chứa gần nhất để tái tạo highlight chính xác
  const getContainerSelector = (el: HTMLElement): string => {
    const sid = el.getAttribute('data-sid');
    if (sid) {
      return `[data-sid="${sid}"]`;
    }
    const root = passageScrollRef.current;
    if (!root) return 'p';
    let path = '';
    let current: HTMLElement | null = el;
    while (current && current !== root) {
      let tagName = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(current);
        path = `${tagName}:nth-child(${index + 1})` + (path ? ' > ' + path : '');
      } else {
        path = tagName + (path ? ' > ' + path : '');
      }
      current = parent as HTMLElement | null;
    }
    return path ? `.ielts-passage-content ${path}` : 'p';
  };

  // Tính start/end offset của vùng chọn so với textContent gốc của thẻ chứa (bỏ qua tag html và badge câu hỏi)
  const getSelectionOffsets = (container: HTMLElement, range: Range) => {
    const textNodes: Text[] = [];
    const findTextNodes = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains('ielts-badge') || el.classList.contains('ielts-badge-wrapper')) {
          return;
        }
      }
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text);
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          findTextNodes(node.childNodes[i]);
        }
      }
    };
    findTextNodes(container);

    let startOffset = 0;
    let foundStart = false;

    for (const node of textNodes) {
      if (node === range.startContainer) {
        startOffset += range.startOffset;
        foundStart = true;
        break;
      }
      startOffset += node.length;
    }

    if (!foundStart) {
      const preRange = document.createRange();
      preRange.selectNodeContents(container);
      preRange.setEnd(range.startContainer, range.startOffset);
      startOffset = preRange.toString().length;
    }

    const endOffset = startOffset + range.toString().length;
    return { startOffset, endOffset };
  };

  // Tạo highlight cho học viên
  const applyUserHighlight = (color: string) => {
    if (!selectionMenu) return;
    const { range } = selectionMenu;
    
    try {
      const container = passageScrollRef.current?.querySelector('.ielts-passage-content') as HTMLElement | null;
      if (container) {
        const { startOffset, endOffset } = getSelectionOffsets(container, range);
        const text = range.toString();
        
        if (text.trim()) {
          const newHighlight: UserHighlight = {
            id: `user-hl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            passageIdx: activePassageIdx,
            selector: '.ielts-passage-content',
            startOffset,
            endOffset,
            text,
            color
          };
          
          const updated = [...userHighlights, newHighlight];
          setUserHighlights(updated);
          localStorage.setItem(`ielts_reading_highlights_${lessonId}`, JSON.stringify(updated));

          // Mở menu đổi màu/gán câu ngay lập tức cho highlight vừa tạo
          lastActiveMenuOpenTime.current = Date.now();
          setActiveHighlightMenu({
            id: newHighlight.id,
            x: selectionMenu.x,
            y: selectionMenu.y - 10
          });
        }
      }
    } catch (e) {
      console.error("Error highlighting:", e);
      showToast("Không thể highlight đoạn văn này.", "error");
    }
    
    window.getSelection()?.removeAllRanges();
    setSelectionMenu(null);
  };

  // Áp dụng thẻ highlight vào DOM
  const applyHighlight = (container: HTMLElement, hl: UserHighlight) => {
    const textNodes: Text[] = [];
    const findTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text);
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          findTextNodes(node.childNodes[i]);
        }
      }
    };
    findTextNodes(container);

    let charCount = 0;
    let startNode: Text | null = null;
    let startNodeOffset = 0;
    let endNode: Text | null = null;
    let endNodeOffset = 0;

    for (const node of textNodes) {
      const nodeLength = node.length;
      if (!startNode && charCount + nodeLength >= hl.startOffset) {
        startNode = node;
        startNodeOffset = hl.startOffset - charCount;
      }
      if (!endNode && charCount + nodeLength >= hl.endOffset) {
        endNode = node;
        endNodeOffset = hl.endOffset - charCount;
        break;
      }
      charCount += nodeLength;
    }

    const createHighlightSpan = (isLast: boolean) => {
      const span = document.createElement("span");
      span.className = "user-highlight cursor-pointer";
      span.setAttribute("data-hl-id", hl.id);
      span.style.backgroundColor = getUserHighlightHex(hl.color);
      span.style.color = '#000000';
      span.style.borderRadius = '2px';
      span.style.padding = '0 1px';
      
      if (isLast && hl.questionNo) {
        span.setAttribute("data-q", String(hl.questionNo));
      }

      span.onclick = (e) => {
        e.stopPropagation();
        const rect = span.getBoundingClientRect();
        lastActiveMenuOpenTime.current = Date.now();
        setActiveHighlightMenu({
          id: hl.id,
          x: rect.left + rect.width / 2,
          y: rect.top - 55
        });
      };
      return span;
    };

    if (startNode && endNode) {
      try {
        if (startNode === endNode) {
          const mid = startNode.splitText(startNodeOffset);
          mid.splitText(endNodeOffset - startNodeOffset);
          const span = createHighlightSpan(true);
          mid.parentNode?.insertBefore(span, mid);
          span.appendChild(mid);
        } else {
          const nodesToWrap: Text[] = [];
          let collecting = false;
          for (const node of textNodes) {
            if (node === startNode) {
              collecting = true;
              const mid = node.splitText(startNodeOffset);
              nodesToWrap.push(mid);
              continue;
            }
            if (node === endNode) {
              node.splitText(endNodeOffset);
              nodesToWrap.push(node);
              break;
            }
            if (collecting) {
              nodesToWrap.push(node);
            }
          }

          nodesToWrap.forEach((node, idx) => {
            const isLast = idx === nodesToWrap.length - 1;
            const span = createHighlightSpan(isLast);
            node.parentNode?.insertBefore(span, node);
            span.appendChild(node);
          });
        }
      } catch (err) {
        console.error("Error surrounding contents:", err);
      }
    }
  };

  const handleUpdateHighlightColor = (id: string, color: string) => {
    const updated = userHighlights.map(hl => hl.id === id ? { ...hl, color } : hl);
    setUserHighlights(updated);
    localStorage.setItem(`ielts_reading_highlights_${lessonId}`, JSON.stringify(updated));
    setActiveHighlightMenu(null);
  };

  const handleUpdateHighlightQuestionNo = (id: string, qNo: number | undefined) => {
    const updated = userHighlights.map(hl => hl.id === id ? { ...hl, questionNo: qNo || undefined } : hl);
    setUserHighlights(updated);
    localStorage.setItem(`ielts_reading_highlights_${lessonId}`, JSON.stringify(updated));
  };

  const handleDeleteHighlight = (id: string) => {
    const updated = userHighlights.filter(hl => hl.id !== id);
    setUserHighlights(updated);
    localStorage.setItem(`ielts_reading_highlights_${lessonId}`, JSON.stringify(updated));
    setActiveHighlightMenu(null);
  };

  const handleClearAllHighlights = () => {
    if (window.confirm("Bạn có muốn xóa toàn bộ highlight đã vẽ?")) {
      setUserHighlights([]);
      localStorage.removeItem(`ielts_reading_highlights_${lessonId}`);
      setActiveHighlightMenu(null);
    }
  };

  // Chuyển nhanh đến câu hỏi và Passage tương ứng
  const handleJumpToQuestion = (qNo: number) => {
    const q = allQuestions.find(item => item.questionNo === qNo);
    if (!q) return;

    // Chuyển tab Passage nếu cần
    if (q.passageIdx !== activePassageIdx) {
      setActivePassageIdx(q.passageIdx);
    }

    setSelectedQuestionNo(qNo);

    // Cuộn tới câu hỏi đó ở khung bên phải
    setTimeout(() => {
      let el = questionsScrollRef.current?.querySelector(`#ielts-q-${qNo}`);
      if (!el) {
        // Tìm cụm nhóm câu hỏi chứa số câu đó (dành cho câu hỏi bị ẩn lúc đang làm bài)
        el = questionsScrollRef.current?.querySelector(`[data-qnos*="${qNo}"]`);
      }
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  };

  // Chuyển câu hỏi trước đó
  const handlePrevQuestion = () => {
    if (!selectedQuestionNo) {
      handleJumpToQuestion(1);
    } else if (selectedQuestionNo > 1) {
      handleJumpToQuestion(selectedQuestionNo - 1);
    }
  };

  // Chuyển câu hỏi tiếp theo
  const handleNextQuestion = () => {
    if (!selectedQuestionNo) {
      handleJumpToQuestion(1);
    } else if (selectedQuestionNo < 40) {
      handleJumpToQuestion(selectedQuestionNo + 1);
    }
  };

  // Lấy HTML content cho passage active
  const htmlContent = useMemo(() => {
    const activePassage = passages[activePassageIdx];
    if (!activePassage) return "";
    const pBody = activePassage.passages?.[0] || activePassage;
    const rawHtml = pBody.html_content || pBody.passage_body || "";
    if (!isMounted) return rawHtml;
    return injectBadgesToHtml(rawHtml, hintsEvidenceMap);
  }, [passages, activePassageIdx, hintsEvidenceMap, isMounted]);

  // Phát hiện MATCHING_HEADINGS group trong passage hiện tại
  const matchingHeadingsGroup = useMemo(() => {
    const groups = passages[activePassageIdx]?.question_groups || [];
    return (groups as any[]).find((g) => g.question_type === 'MATCHING_HEADINGS') || null;
  }, [passages, activePassageIdx]);

  // Parse HTML passage thành các đoạn văn có nhãn (A, B, C...) cho drag-drop
  const passageParagraphs = useMemo(() => {
    if (!matchingHeadingsGroup || !htmlContent) return null;
    const positions: { index: number; label: string }[] = [];
    
    // Regex vạn năng: Hỗ trợ bắt cả <p><b>A.</b>, <p><b>Section A</b>, <p><b>Paragraph A</b>, <h3><b>Section A</b>...
    const labelRegex = /<(?:p|h3|h4)[^>]*>\s*(?:<span[^>]*>)?\s*<b>\s*(?:Section|Paragraph)?\s*([A-Z])(?:\.|\s|<\/b>)/gi;
    let m;
    while ((m = labelRegex.exec(htmlContent)) !== null) {
      positions.push({ index: m.index, label: m[1].toUpperCase() });
    }
    
    if (positions.length === 0) return null;
    const segments = positions.map((pos, i) => ({
      label: pos.label,
      html: htmlContent.slice(pos.index, i + 1 < positions.length ? positions[i + 1].index : htmlContent.length),
    }));
    const preamble = htmlContent.slice(0, positions[0].index);
    return { preamble, segments };
  }, [matchingHeadingsGroup, htmlContent]);

  // Tạo CSS động cho highlight bóng đèn gợi ý
  const dynamicStyles = useMemo(() => {
    let css = "";
    Object.entries(hintsEvidenceMap).forEach(([sid, data]) => {
      const colorArray = data.colors;
      const qNos = data.qNos;
      if (colorArray.length === 0) return;

      const primaryColor = getEvidenceColor(colorArray[0]);
      let backgroundStyles = `background-color: ${primaryColor.hexBg} !important; color: ${primaryColor.hexText} !important;`;

      // Nếu câu này là dẫn chứng cho từ 2 nhóm câu hỏi khác nhau trở lên, gạch chân bằng màu của nhóm thứ hai
      if (colorArray.length > 1) {
        const secondaryColor = getEvidenceColor(colorArray[1]);
        backgroundStyles += ` border-bottom: 2.5px solid ${secondaryColor.badgeBg} !important; padding-bottom: 1.5px !important; border-radius: 4px 4px 0 0 !important;`;
      }

      css += `
        [data-sid="${sid}"], [data-sid="${sid.toUpperCase()}"], [data-sid="${sid.toLowerCase()}"],
        [data-sid$="-${sid}"], [data-sid$="-${sid.toUpperCase()}"], [data-sid$="-${sid.toLowerCase()}"] {
          ${backgroundStyles}
          border-radius: 4px !important;
          transition: all 0.2s ease !important;
          position: relative !important;
          font-weight: 500 !important;
        }
      `;
    });
    return css;
  }, [hintsEvidenceMap]);

  // Memoize phần nội dung bài đọc để tránh React re-render làm mất selection bôi đen của học viên
  const memoizedPassageContent = useMemo(() => {
    return (
      <div 
        className={`ielts-passage-content prose prose-slate max-w-none select-text ${
          showExplanation ? "show-translations" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: htmlContent || "" }}
        onMouseOver={(e) => {
          const target = (e.target as HTMLElement).closest('[data-sid]');
          if (target) {
            const rect = target.getBoundingClientRect();
            handleSentenceHover(target.getAttribute('data-sid'), e, rect);
          }
        }}
        onMouseOut={(e) => {
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (relatedTarget && relatedTarget.closest('[data-sid]')) return;
          handleSentenceHover(null, e);
        }}
      />
    );
  }, [htmlContent, isSubmitted, showExplanation, userHighlights, showUserHighlights]);

  // Áp dụng highlights vào DOM sau khi React kết thúc render/re-render nội dung bài đọc
  useEffect(() => {
    if (!passageScrollRef.current || !showUserHighlights) return;
    
    // Đợi 30ms để React hoàn tất vẽ htmlContent mới vào DOM
    const timer = setTimeout(() => {
      const container = passageScrollRef.current;
      if (!container) return;
      
      userHighlights.forEach(hl => {
        if (hl.passageIdx !== activePassageIdx) return;
        
        const targetEl = container.querySelector(hl.selector) as HTMLElement | null;
        if (targetEl) {
          applyHighlight(targetEl, hl);
        }
      });
    }, 30);
    
    return () => clearTimeout(timer);
  }, [memoizedPassageContent, userHighlights, showUserHighlights, activePassageIdx]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 text-slate-855 font-sans">
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      <style>{`
        .highlight-blink {
          animation: blink-border 0.5s ease-in-out 4;
        }
        @keyframes blink-border {
          0%, 100% { outline: 2px solid transparent; }
          50% { outline: 3px solid #3b82f6; outline-offset: 1px; }
        }
        .ielts-passage-content p {
          margin-bottom: 1.5em;
          text-align: justify;
        }
        .ielts-passage-content.show-translations span[data-sid] {
          cursor: help;
          transition: background-color 0.2s;
        }
        .ielts-passage-content.show-translations span[data-sid]:hover {
          background-color: rgba(254, 240, 138, 0.4);
        }
        /* Custom badge hiển thị số câu hỏi cho highlight của học viên */
        .user-highlight[data-q]::after {
          content: "Q" attr(data-q);
          margin-left: 3px;
          padding: 0 4px;
          background-color: #2563eb;
          color: #ffffff;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          vertical-align: middle;
          line-height: 1.2;
        }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shadow-sm z-55 flex-wrap gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
            IELTS READING
          </span>
          <h1 className="font-extrabold text-sm tracking-tight text-slate-800 truncate" title={passages[0]?.test_title}>
            {passages[0]?.test_title || "IELTS Reading Practice Test"}
          </h1>
        </div>

        {/* Cụm điều khiển bên phải */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Bảng Tabs Passages */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            {passages.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActivePassageIdx(idx)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activePassageIdx === idx 
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-850"
                }`}
              >
                P{idx + 1}
              </button>
            ))}
          </div>

          {/* Đồng hồ */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Timer className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono font-bold text-xs text-blue-700">
              {isSubmitted ? `Đã nộp` : formatMMSS(timeLeft)}
            </span>
          </div>

          {/* Nút Hiện lời giải (Luôn luôn hiển thị để học viên chủ động bật/tắt dịch hover) */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all font-bold text-[11px] uppercase tracking-wider ${
              showExplanation 
                ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" 
                : "bg-white border-slate-350 text-slate-500 hover:bg-slate-50"
            }`}
            title={showExplanation ? "Ẩn giải thích & bản dịch" : "Hiện giải thích & bản dịch"}
          >
            {showExplanation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showExplanation ? "Ẩn giải thích" : "Hiện lời giải"}</span>
          </button>

          {/* Nút hành động tương ứng: Làm Lại hoặc Nộp Bài */}
          {isSubmitted ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-700 font-bold text-[11px] uppercase tracking-wider rounded-xl border border-slate-300 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Làm Lại
            </button>
          ) : (
            <button
              onClick={() => handleSubmitTest(false)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/10"
            >
              <Send className="w-3.5 h-3.5" /> Nộp Bài
            </button>
          )}
        </div>
      </div>

      {/* CORE BODY (SPLIT VIEW) */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative bg-slate-100">
        
        {/* CỘT TRÁI - BÀI ĐỌC */}
        <div 
          style={{ width: `${leftWidth}%` }}
          className="h-full flex flex-col bg-white border-r border-slate-200 overflow-hidden relative select-text"
        >
          <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-slate-500 select-none">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {passages[activePassageIdx]?.passage_title || `Passage ${activePassageIdx + 1}`}
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1 text-slate-400">
                <PenTool className="w-3.5 h-3.5" />
                <span>Highlight tự do</span>
              </div>
              <div className="h-3.5 w-[1px] bg-slate-300" />
              <button 
                onClick={() => setShowUserHighlights(prev => !prev)} 
                className={`p-1 rounded hover:bg-slate-200 transition-colors flex items-center gap-1 font-bold ${showUserHighlights ? 'text-blue-600' : 'text-slate-400'}`}
                title={showUserHighlights ? "Tạm thời ẩn tất cả highlight cá nhân" : "Hiện lại highlight cá nhân"}
              >
                {showUserHighlights ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showUserHighlights ? "Ẩn" : "Hiện"}</span>
              </button>
              <button 
                onClick={handleClearAllHighlights} 
                className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors flex items-center gap-1 font-bold"
                title="Xóa tất cả highlight cá nhân"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa hết</span>
              </button>
            </div>
          </div>

          {/* Vùng bài đọc có thanh cuộn riêng */}
          <div 
            ref={passageScrollRef}
            className="flex-1 overflow-y-auto p-8 scrollbar-thin text-slate-800 leading-relaxed text-[16px] bg-white"
          >
            {/* Nếu là MATCHING_HEADINGS: render từng đoạn văn kèm drop zone */}
            {matchingHeadingsGroup && passageParagraphs ? (
              <div className={`ielts-passage-content prose prose-slate max-w-none select-text ${showExplanation ? 'show-translations' : ''}`}>
                {passageParagraphs.preamble && (
                  <div dangerouslySetInnerHTML={{ __html: passageParagraphs.preamble }} />
                )}
                {passageParagraphs.segments.map((seg, idx) => {
                  const q = (matchingHeadingsGroup.questions || []).find((xq: any) => {
                    const qText = String(xq.text || "").trim().toLowerCase();
                    const label = seg.label.trim().toLowerCase();
                    return qText === label || qText.endsWith(" " + label);
                  });
                  if (!q) return <div key={idx} dangerouslySetInnerHTML={{ __html: seg.html }} />;
                  const assigned = answers[q.questionNo] || null;
                  const assignedText = assigned ? (matchingHeadingsGroup.options_pool as any)?.[assigned] : null;
                  const isOver = dropTargetNo === q.questionNo;
                  const isCorrect = isSubmitted && !!assigned && String(assigned).trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase();
                  const isWrong = isSubmitted && !!assigned && !isCorrect;
                  return (
                    <div key={idx}>
                      {/* Drop zone đầu đoạn */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDropTargetNo(q.questionNo); }}
                        onDragLeave={() => setDropTargetNo(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!dragItem) return;
                          if (dragItem.fromQuestionNo && dragItem.fromQuestionNo !== q.questionNo) handleAnswerChange(dragItem.fromQuestionNo, '');
                          handleAnswerChange(q.questionNo, dragItem.code);
                          setDragItem(null); setDropTargetNo(null);
                        }}
                        className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg border-2 transition-all select-none ${
                          isOver ? 'border-blue-400 bg-blue-50' :
                          isCorrect ? 'border-emerald-300 bg-emerald-50/80' :
                          isWrong ? 'border-red-300 bg-red-50/80' :
                          assigned ? 'border-blue-200 bg-blue-50/50' :
                          'border-dashed border-slate-300 bg-slate-50/80'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded text-white text-[9px] font-black flex items-center justify-center shrink-0 ${
                          isCorrect ? 'bg-emerald-500' : isWrong ? 'bg-red-500' : 'bg-blue-600'
                        }`}>{q.questionNo}</div>
                        {assigned ? (
                          <div
                            draggable={!isSubmitted}
                            onDragStart={() => setDragItem({ code: assigned, fromQuestionNo: q.questionNo })}
                            className={`flex-1 flex items-center gap-1.5 rounded px-2 py-0.5 text-xs border cursor-grab active:cursor-grabbing ${
                              isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                              isWrong ? 'bg-red-50 border-red-200 text-red-800' :
                              'bg-white border-blue-200 text-slate-700 hover:shadow-sm'
                            }`}
                          >
                            <span className={`font-black shrink-0 ${
                              isCorrect ? 'text-emerald-600' : isWrong ? 'text-red-600' : 'text-blue-600'
                            }`}>{assigned}.</span>
                            <span className="leading-snug">{assignedText}</span>
                            {!isSubmitted && (
                              <button onMouseDown={(e) => e.stopPropagation()} onClick={() => handleAnswerChange(q.questionNo, '')} className="ml-auto shrink-0 text-slate-400 hover:text-red-500">×</button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">{isOver ? '↓ Thả vào đây' : 'Kéo heading từ danh sách →'}</span>
                        )}
                        {isSubmitted && isWrong && (
                          <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 shrink-0">✓ {q.correctAnswer}</span>
                        )}
                      </div>
                      {/* Nội dung đoạn văn */}
                      <div
                        dangerouslySetInnerHTML={{ __html: seg.html }}
                        onMouseOver={(e) => { const t = (e.target as HTMLElement).closest('[data-sid]'); if (t) handleSentenceHover(t.getAttribute('data-sid'), e, t.getBoundingClientRect()); }}
                        onMouseOut={(e) => { if (!(e.relatedTarget as HTMLElement)?.closest('[data-sid]')) handleSentenceHover(null, e); }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              memoizedPassageContent
            )}
          </div>

          {/* Menu nổi khi bôi đen */}
          {selectionMenu && (
            <div 
              style={{ 
                position: "fixed",
                left: `${selectionMenu.x}px`, 
                top: `${selectionMenu.y}px`,
                transform: "translateX(-50%)"
              }}
              className="z-50 bg-white border border-slate-200 px-2 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* 5 Nút màu */}
              {['yellow', 'green', 'blue', 'pink', 'purple'].map((color) => {
                const bgClass = color === 'yellow' ? 'bg-[#fef08a]' :
                                color === 'green' ? 'bg-[#86efac]' :
                                color === 'blue' ? 'bg-[#93c5fd]' :
                                color === 'pink' ? 'bg-[#fda4af]' : 'bg-[#d8b4fe]';
                return (
                  <button 
                    key={color}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyUserHighlight(color);
                    }} 
                    className={`w-4 h-4 rounded-full ${bgClass} border border-slate-200 hover:scale-110 active:scale-95 transition-transform`} 
                    title={`Highlight ${color === 'yellow' ? 'Vàng' : color === 'green' ? 'Lục' : color === 'blue' ? 'Lam' : color === 'pink' ? 'Hồng' : 'Tím'}`} 
                  />
                );
              })}

              <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5"></div>

              {/* Nút Tra từ */}
              <button 
                onMouseDown={(e) => {
                  e.preventDefault();
                  const text = selectionMenu.range.toString().trim();
                  if (text) {
                    const rect = selectionMenu.range.getBoundingClientRect();
                    openDictionary(text, {
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      top: rect.top,
                      bottom: rect.bottom
                    });
                    window.getSelection()?.removeAllRanges();
                    setSelectionMenu(null);
                  }
                }} 
                className="p-1 rounded-full text-blue-600 hover:bg-blue-50 active:scale-95 transition-all"
                title="Tra từ điển"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5"></div>

              {/* Nút Xóa/Hủy */}
              <button 
                onMouseDown={(e) => {
                  e.preventDefault();
                  window.getSelection()?.removeAllRanges();
                  setSelectionMenu(null);
                }} 
                className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-95 transition-all"
                title="Hủy bôi đen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Menu nổi khi click vào highlight cá nhân đã tạo */}
          {activeHighlightMenu && (
            <div 
              data-active-hl-menu="true"
              style={{ 
                position: "fixed",
                left: `${activeHighlightMenu.x}px`, 
                top: `${activeHighlightMenu.y}px`,
                transform: "translateX(-50%) translateY(-100%)",
                marginTop: "-8px"
              }}
              className="z-55 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 select-none"
            >
              {/* 5 Nút màu đổi nhanh */}
              <div className="flex items-center gap-1">
                {['yellow', 'green', 'blue', 'pink', 'purple'].map((color) => {
                  const hex = getUserHighlightHex(color);
                  const isCurrent = userHighlights.find(h => h.id === activeHighlightMenu.id)?.color === color;
                  return (
                    <button 
                      key={color}
                      onClick={() => handleUpdateHighlightColor(activeHighlightMenu.id, color)} 
                      style={{ backgroundColor: hex }}
                      className={`w-4 h-4 rounded-full border ${isCurrent ? 'border-slate-800 scale-110 shadow-sm' : 'border-slate-200'} hover:scale-110 active:scale-95 transition-transform`} 
                      title={`Đổi sang màu ${color === 'yellow' ? 'Vàng' : color === 'green' ? 'Xanh lá' : color === 'blue' ? 'Xanh dương' : color === 'pink' ? 'Hồng' : 'Tím'}`} 
                    />
                  );
                })}
              </div>

              <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

              {/* Ô gán số thứ tự câu hỏi */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Gán câu:</span>
                <input 
                  type="number"
                  min="1"
                  max="40"
                  placeholder="--"
                  value={userHighlights.find(h => h.id === activeHighlightMenu.id)?.questionNo || ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                    handleUpdateHighlightQuestionNo(activeHighlightMenu.id, val);
                  }}
                  className="w-10 h-6 border border-slate-300 rounded px-1 text-xs font-black text-slate-700 text-center focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

              {/* Nút xóa highlight */}
              <button 
                onClick={() => handleDeleteHighlight(activeHighlightMenu.id)} 
                className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-750 active:scale-95 transition-all"
                title="Xóa highlight (phím tắt: Delete / Backspace)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Nút đóng menu */}
              <button 
                onClick={() => setActiveHighlightMenu(null)} 
                className="p-1 rounded text-slate-400 hover:bg-slate-50 hover:text-slate-650 active:scale-95 transition-all border border-transparent hover:border-slate-200"
                title="Đóng menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* THANH KÉO DÃN (RESIZER) — có núm tròn ở giữa, hỗ trợ touch iPad */}
        <div
          className={`relative w-[6px] shrink-0 h-full flex items-center justify-center z-40 transition-colors ${
            isResizing ? 'bg-blue-100' : 'bg-slate-200 hover:bg-blue-50'
          }`}
        >
          {/* Núm tròn — đây mới là vùng kéo thật sự */}
          <div
            onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX); }}
            onTouchStart={(e) => { handleDragStart(e.touches[0].clientX); }}
            className={`absolute w-6 h-12 rounded-full border-2 flex flex-col items-center justify-center gap-[3px] cursor-col-resize select-none transition-all shadow-md ${
              isResizing
                ? 'bg-blue-600 border-blue-700 scale-110'
                : 'bg-white border-slate-300 hover:bg-blue-600 hover:border-blue-700 hover:scale-110'
            }`}
            title="Kéo để thay đổi tỷ lệ"
          >
            <div className={`w-[2px] h-3 rounded-full ${isResizing ? 'bg-white/70' : 'bg-slate-300 group-hover:bg-white/70'}`} />
            <div className={`w-[2px] h-3 rounded-full ${isResizing ? 'bg-white/70' : 'bg-slate-300 group-hover:bg-white/70'}`} />
          </div>
        </div>

        {/* CỘT PHẢI - CÂU HỎI */}
        <div 
          style={{ width: `${100 - leftWidth}%` }}
          className="h-full flex flex-col bg-slate-50 overflow-hidden relative"
        >
          <div className="bg-slate-100 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center text-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              QUESTIONS LIST (PASSAGE {activePassageIdx + 1})
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {activeQuestions.length > 0 ? `Câu ${activeQuestions[0].questionNo} - ${activeQuestions[activeQuestions.length - 1].questionNo}` : ""}
            </span>
          </div>

          <div 
            ref={questionsScrollRef}
            className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-4 select-text bg-slate-50"
          >
            {/* Nếu đã nộp bài, hiển thị bảng điểm kết quả trên cùng cột câu hỏi */}
            {showResults && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500 select-none">
                
                {/* Vòng Band Score to tròn kiểu IELTS */}
                <div className="relative w-22 h-22 rounded-full bg-slate-800/80 border-4 border-blue-500/80 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
                  <span className="text-3xl font-black text-blue-400 tracking-tight leading-none">{stats.bandScore.toFixed(1)}</span>
                  <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase mt-0.5">BAND SCORE</span>
                </div>

                {/* Phần thông tin chi tiết */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h3 className="font-extrabold text-[15px] text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Kết Quả Đọc Hiểu IELTS Reading
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto sm:mx-0">
                    <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/50 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Đúng</p>
                      <p className="text-sm font-black text-emerald-400">{stats.correctCount} / 40</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/50 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Sai</p>
                      <p className="text-sm font-black text-rose-400">{stats.incorrectCount}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/50 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Bỏ qua</p>
                      <p className="text-sm font-black text-slate-300">{stats.unansweredCount}</p>
                    </div>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                  <button 
                    onClick={() => setShowResults(false)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-500/20 text-center"
                  >
                    Xem chi tiết bài làm
                  </button>
                </div>
              </div>
            )}

            {/* Render các nhóm câu hỏi */}
            {passages[activePassageIdx]?.question_groups?.map((g: any, gIdx: number) => {
              const qNosStr = (g.questions || []).map((xq: any) => xq.questionNo).join(",");
              return (
                <div 
                  key={gIdx} 
                  data-qnos={qNosStr}
                  className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-sm space-y-3"
                >
                
                {/* Instruction của nhóm */}
                <div className="border-l-4 border-blue-600 pl-4 space-y-1.5">
                  <span className="text-xs font-black tracking-widest text-blue-600 uppercase">
                    NHÓM CÂU HỎI {gIdx + 1} - {g.question_type}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed font-semibold select-text">
                    <span dangerouslySetInnerHTML={{ __html: formatInstruction(g.instruction) }} />
                  </p>
                </div>

                {/* Tương thích ảnh minh họa sơ đồ/hình vẽ (Fallback Image) từ Prompt mới */}
                {g.image_url && (
                  <div className="my-4 p-2 bg-slate-50 border border-slate-200 rounded-2xl flex justify-center">
                    <img 
                      src={g.image_url} 
                      alt={`Sơ đồ nhóm câu hỏi ${gIdx + 1}`}
                      className="max-w-full max-h-[350px] object-contain rounded-xl shadow-sm"
                      onError={(e) => {
                        // Ẩn ảnh nếu đường dẫn placeholder bị lỗi
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Danh sách từ pool options (Multiple Choice Multi & Matching) — KHÔNG áp dụng cho MULTIPLE_CHOICE_SINGLE và MATCHING_HEADINGS */}
                {g.options_pool && Object.keys(g.options_pool).length > 0 && g.question_type !== "MULTIPLE_CHOICE_SINGLE" && g.question_type !== "MATCHING_HEADINGS" && (() => {
                  const groupQuestions = g.questions || [];
                  const isMultiChoice = g.question_type === "MULTIPLE_CHOICE_MULTI";
                  const canUseMultipleTimes = String(g.instruction || "").toLowerCase().includes("more than once");
                  
                  // Tập hợp các câu trả lời hiện tại của nhóm
                  const selectedOptions = groupQuestions
                    .map((q: any) => answers[q.questionNo] || "")
                    .filter(Boolean);
                  
                  return (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                        {isMultiChoice ? "Danh sách lựa chọn (Tích chọn đáp án trực tiếp):" : "Danh sách lựa chọn (Kéo nhãn chữ cái thả vào ô câu hỏi phía dưới):"}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(g.options_pool)
                          .filter(([optCode]) => isMultiChoice || canUseMultipleTimes || !selectedOptions.includes(optCode))
                          .map(([optCode, optVal]) => {
                            const isChecked = selectedOptions.includes(optCode);
                            const isClickable = isMultiChoice && !isSubmitted;
                            
                            // Loại bỏ tiền tố trùng lặp dạng "A. ", "B. ", "i. " ở đầu dòng để tránh lặp
                            let cleanText = String(optVal).trim();
                            const prefixRegex = new RegExp(`^\\s*${optCode}\\s*\\.\\s*`, 'i');
                            cleanText = cleanText.replace(prefixRegex, '');

                            return (
                              <div 
                                key={optCode} 
                                className={`text-sm flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                  isChecked && !canUseMultipleTimes
                                    ? "bg-blue-50/70 border-blue-450/40 text-blue-700 shadow-sm animate-in fade-in duration-200"
                                    : isChecked && canUseMultipleTimes
                                    ? "bg-slate-50 border-slate-250 text-slate-500 opacity-60"
                                    : "bg-white border-slate-200 text-slate-700"
                                }`}
                              >
                                {isMultiChoice ? (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    disabled={isSubmitted}
                                    onClick={() => isClickable && handleMultiChoiceChange(optCode, groupQuestions)}
                                    className="mt-0.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300 w-4 h-4 cursor-pointer"
                                  />
                                ) : (
                                  <span 
                                    draggable={!isSubmitted}
                                    onDragStart={() => {
                                      if (!isSubmitted) {
                                        setDragItem({ code: optCode });
                                      }
                                    }}
                                    onDragEnd={() => {
                                      setDragItem(null);
                                      setDropTargetNo(null);
                                    }}
                                    className="font-black text-blue-600 w-7 h-7 text-xs shrink-0 bg-blue-50 hover:bg-blue-100 flex items-center justify-center rounded-lg border border-blue-200/50 cursor-grab active:cursor-grabbing select-none"
                                  >
                                    {optCode}
                                  </span>
                                )}
                                <div className="flex items-start gap-1 select-text font-medium text-slate-750 flex-col">
                                  <span>{cleanText}</span>
                                  {showExplanation && g.options_pool_translation?.[optCode] && (
                                    <span className="text-[11px] text-blue-650/80 italic font-bold mt-0.5">
                                      ({g.options_pool_translation[optCode]})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        {!isMultiChoice && Object.keys(g.options_pool).length > 0 && Object.keys(g.options_pool).filter(code => !selectedOptions.includes(code)).length === 0 && (
                          <div className="col-span-full py-4 text-center text-slate-400 text-xs italic bg-slate-100/50 rounded-xl border border-dashed border-slate-250 select-none">
                            🎉 Bạn đã chọn hết tất cả các phương án!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ===== MATCHING_HEADINGS: Chỉ hiện pool heading, drop zones đã nằm trong passage bên trái ===== */}
                {g.question_type === "MATCHING_HEADINGS" && g.options_pool && (() => {
                  const groupQuestions = g.questions || [];
                  const usedCodes = new Set(groupQuestions.map((q: any) => answers[q.questionNo]).filter(Boolean));
                  const availableHeadings = Object.entries(g.options_pool).filter(([code]) => !usedCodes.has(code));
                  return (
                    <div>
                      <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase mb-2">
                        Danh sách heading — kéo vào ô đầu đoạn văn bên trái:
                      </p>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDropTargetNo('pool'); }}
                        onDragLeave={() => setDropTargetNo(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!dragItem || !dragItem.fromQuestionNo) return;
                          handleAnswerChange(dragItem.fromQuestionNo, '');
                          setDragItem(null); setDropTargetNo(null);
                        }}
                        className={`space-y-1.5 p-2 rounded-xl border-2 border-dashed transition-all ${
                          dropTargetNo === 'pool' ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        {availableHeadings.map(([code, text]) => (
                          <div
                            key={code}
                            draggable={!isSubmitted}
                            onDragStart={() => setDragItem({ code })}
                            onDragEnd={() => { setDragItem(null); setDropTargetNo(null); }}
                            className={`flex items-start gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs hover:border-blue-300 hover:shadow-sm transition-all ${
                              isSubmitted ? 'opacity-60 cursor-default' : 'cursor-grab active:cursor-grabbing'
                            }`}
                          >
                            <span className="font-black text-blue-600 shrink-0 min-w-[22px]">{code}.</span>
                            <span className="text-slate-700 leading-snug">{String(text)}</span>
                          </div>
                        ))}
                        {availableHeadings.length === 0 && !isSubmitted && (
                          <p className="text-center text-slate-400 text-[10px] py-2">Đã dùng hết heading</p>
                        )}
                      </div>
                    </div>
                  );
                })()}


                {/* Đoạn văn Summary điền vào chỗ trống (SUMMARY_COMPLETION_TEXT) */}
                {g.question_type === "SUMMARY_COMPLETION_TEXT" && (

                  <div
                    id={`ielts-q-${(g.questions?.[0]?.questionNo)}`}
                    data-qnos={(g.questions || []).map((xq: any) => xq.questionNo).join(",")}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4"
                  >
                    <p className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">Hoàn thành đoạn tóm tắt sau:</p>
                    <p className="text-sm leading-[2.4rem] text-slate-800">
                      {g.questions?.map((q: any) => {
                        const userAns = answers[q.questionNo] || "";
                        const isCorrect = userAns.trim().toLowerCase() === String(q.correctAnswer || "").trim().toLowerCase() ||
                          String(q.correctAnswer || "").trim().toLowerCase().split("/").map((x: any) => x.trim()).includes(userAns.trim().toLowerCase());
                        return (
                          <span key={q.questionNo}>
                            {q.prefix && <span>{q.prefix}</span>}
                            <span
                              className="inline-flex items-center gap-1 mx-1"
                              onClick={() => setSelectedQuestionNo(q.questionNo)}
                            >
                              <span className={`text-[10px] font-black px-1 py-0.5 rounded leading-none ${
                                isSubmitted
                                  ? isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                  : userAns ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"
                              }`}>{q.questionNo}</span>
                              {isSubmitted ? (
                                <span className={`font-bold px-2 py-0.5 rounded border text-xs ${
                                  isCorrect
                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                    : "text-red-700 bg-red-50 border-red-200 line-through"
                                }`}>
                                  {userAns || "___"}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={userAns}
                                  onClick={(e) => { e.stopPropagation(); setSelectedQuestionNo(q.questionNo); }}
                                  onChange={(e) => handleAnswerChange(q.questionNo, e.target.value)}
                                  className={`w-28 px-2 py-0.5 bg-white border-b-2 outline-none text-xs font-semibold text-center transition-all ${
                                    userAns ? "border-indigo-500 text-indigo-700" : "border-slate-300 text-slate-500"
                                  }`}
                                  placeholder="___"
                                />
                              )}
                              {isSubmitted && !isCorrect && (
                                <span className="text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  → {String(q.correctAnswer)}
                                </span>
                              )}
                            </span>
                            {q.suffix && <span>{q.suffix}</span>}
                          </span>
                        );
                      })}
                    </p>
                    {/* Giải thích sau khi nộp bài */}
                    {isSubmitted && (
                      <div className="space-y-3 pt-3 border-t border-slate-200">
                        {g.questions?.map((q: any) => {
                          const userAns = answers[q.questionNo] || "";
                          const isCorrect = userAns.trim().toLowerCase() === String(q.correctAnswer || "").trim().toLowerCase() ||
                            String(q.correctAnswer || "").trim().toLowerCase().split("/").map((x: any) => x.trim()).includes(userAns.trim().toLowerCase());
                          return (
                            <div key={q.questionNo} className={`text-xs rounded-xl p-3 border ${
                              isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-black px-1.5 py-0.5 rounded text-white text-[10px] ${
                                  isCorrect ? "bg-emerald-500" : "bg-red-500"
                                }`}>{q.questionNo}</span>
                                <span className="font-semibold text-slate-600">Đáp án của bạn: <strong className={isCorrect ? "text-emerald-700" : "text-red-700"}>{userAns || "(bỏ trống)"}</strong></span>
                                {!isCorrect && <span className="font-semibold text-slate-600">→ Đáp án đúng: <strong className="text-emerald-700">{String(q.correctAnswer)}</strong></span>}
                              </div>
                              {q.explanation?.vi && <p className="text-slate-500 italic mt-1">{q.explanation.vi}</p>}
                              {q.explanation?.why_correct && (
                                <p className="text-emerald-700 mt-1">
                                  <span className="font-black text-[10px] uppercase">Vì sao đúng: </span>{q.explanation.why_correct}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Nút gợi ý dẫn chứng tổng hợp */}
                    <div className="flex gap-2">
                      {g.questions?.map((q: any) => (
                        <button
                          key={q.questionNo}
                          onClick={(e) => { e.stopPropagation(); handleToggleHint(q.questionNo, q); }}
                          className={`p-1.5 rounded-lg border transition-colors text-xs flex items-center gap-1 ${
                            hintsActive[q.questionNo]
                              ? "bg-amber-450 border-amber-400 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-400/50"
                          }`}
                          title={`Gợi ý câu ${q.questionNo}`}
                        >
                          <Lightbulb className="w-3 h-3" fill={hintsActive[q.questionNo] ? "currentColor" : "none"} />
                          <span>{q.questionNo}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Các câu hỏi trong nhóm */}
                <div className="space-y-4">
                  {/* Nếu nhóm có cấu trúc table_data, render bảng HTML trước */}
                  {g.table_data && g.table_data.headers && (
                    <div className="overflow-x-auto my-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm select-text">
                      <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-slate-50">
                            {g.table_data.headers.map((h: string, idx: number) => (
                              <th 
                                key={idx} 
                                className="p-3 font-black text-slate-700 border-r border-b border-slate-200 last:border-r-0"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {g.table_data.rows.map((row: string[], rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                              {row.map((cell: string, cIdx: number) => {
                                const parts = String(cell).split(/(\[q-\d+\])/g);
                                return (
                                  <td 
                                    key={cIdx} 
                                    className="p-3 text-slate-650 leading-relaxed font-medium border-r border-b border-slate-150 last:border-r-0"
                                  >
                                    {parts.map((part, pIdx) => {
                                      const qMatch = part.match(/\[q-(\d+)\]/);
                                      if (qMatch) {
                                        const qNo = parseInt(qMatch[1]);
                                        const targetQ = g.questions?.find((xq: any) => xq.questionNo === qNo);
                                        if (!targetQ) return part;
                                        const userAns = answers[qNo] || "";
                                        
                                        const isCorrect = isSubmitted && userAns.trim().toLowerCase() === String(targetQ.correctAnswer || "").trim().toLowerCase();
                                        const isWrong = isSubmitted && userAns && !isCorrect;

                                        return (
                                          <span key={pIdx} className="inline-flex items-center gap-1.5 mx-1 my-1">
                                            <span className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[9px] border bg-slate-100 border-slate-250 text-slate-600 shrink-0 select-none">
                                              {qNo}
                                            </span>
                                            <input
                                              type="text"
                                              value={userAns}
                                              disabled={isSubmitted}
                                              onClick={(e) => { e.stopPropagation(); setSelectedQuestionNo(qNo); }}
                                              onChange={(e) => handleAnswerChange(qNo, e.target.value)}
                                              className={`px-2 py-1 bg-white border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-xs font-bold text-slate-800 transition-all shadow-sm max-w-[130px] ${
                                                isCorrect ? "border-emerald-450 bg-emerald-50 text-emerald-700" :
                                                isWrong ? "border-red-450 bg-red-50 text-red-700" :
                                                "border-slate-250"
                                              }`}
                                              placeholder="..."
                                            />
                                            {isSubmitted && isWrong && (
                                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-250 shrink-0 select-none">
                                                ✓ {targetQ.correctAnswer}
                                              </span>
                                            )}
                                          </span>
                                        );
                                      }
                                      return <span key={pIdx}>{part}</span>;
                                    })}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {g.questions?.map((q: any, qIdx: number) => {
                    // Ẩn hết câu hỏi phụ khi đã được render dạng khác (đoạn văn liền, checkbox, drag-drop, bảng table_data)
                    if (g.table_data || g.question_type === "MULTIPLE_CHOICE_MULTI" || g.question_type === "SUMMARY_COMPLETION_TEXT" || g.question_type === "MATCHING_HEADINGS") {
                      return null;
                    }

                    const isSelected = selectedQuestionNo === q.questionNo;
                    const userAns = answers[q.questionNo] || "";
                    
                    let displayTitle: any = q.text;
                    if (g.question_type === "MULTIPLE_CHOICE_MULTI") {
                      displayTitle = `Lựa chọn thứ ${qIdx + 1}`;
                    } else if (g.question_type === "SUMMARY_COMPLETION_TEXT") {
                      // Dạng tóm tắt: Hiển thị tĩnh
                      displayTitle = (
                        <span className="font-medium text-slate-700 leading-relaxed">
                          {q.prefix && <span>{q.prefix} </span>}
                          <strong className="mx-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-700 font-bold underline">
                            {userAns || "....... ? ......."}
                          </strong>
                          {q.suffix && <span> {q.suffix}</span>}
                        </span>
                      );
                    } else if (g.question_type === "SENTENCE_COMPLETION") {
                      // Dạng hoàn thành câu lẻ: Cho phép nhập trực tiếp trong lòng câu (Inline Input)
                      displayTitle = (
                        <span className="font-medium text-slate-700 leading-relaxed flex flex-wrap items-center gap-y-2">
                          {q.prefix && <span>{q.prefix}&nbsp;</span>}
                          <input
                            type="text"
                            value={userAns}
                            disabled={isSubmitted}
                            onClick={(e) => { e.stopPropagation(); setSelectedQuestionNo(q.questionNo); }}
                            onChange={(e) => handleAnswerChange(q.questionNo, e.target.value)}
                            className="mx-1 px-3 py-1 bg-white border-2 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-xs font-bold text-blue-700 text-center min-w-[130px] transition-all shadow-sm"
                            placeholder="Nhập từ..."
                          />
                          {q.suffix && <span>&nbsp;{q.suffix}</span>}
                        </span>
                      );
                    }
                    const isCorrect = userAns.trim().toLowerCase() === String(q.correctAnswer || "").trim().toLowerCase() || 
                                      String(q.correctAnswer || "").trim().toLowerCase().split('/').map((x: any) => x.trim()).includes(userAns.trim().toLowerCase());

                    return (
                      <div 
                        key={q.questionNo}
                        id={`ielts-q-${q.questionNo}`}
                        onClick={() => setSelectedQuestionNo(q.questionNo)}
                        className={`p-3.5 rounded-xl border transition-all duration-300 ${
                          isSelected
                            ? "bg-blue-50/20 border-blue-500/30 shadow-sm" 
                            : "bg-white border-slate-150 hover:bg-slate-50/50 hover:border-slate-250"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          
                          {/* Số thứ tự câu + Nút công cụ */}
                          <div className="flex flex-col items-center gap-2">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border ${
                              isSubmitted
                                ? isCorrect 
                                  ? "bg-emerald-50 border-emerald-250 text-emerald-700" 
                                  : "bg-red-50 border-red-250 text-red-700"
                                : userAns
                                  ? "bg-blue-50 border-blue-250 text-blue-700 animate-pulse"
                                  : "bg-slate-100 border-slate-200 text-slate-650"
                            }`}>
                              {q.questionNo}
                            </span>
                            
                            {/* Nút gợi ý dẫn chứng */}
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleHint(q.questionNo, q);
                              }}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                hintsActive[q.questionNo]
                                  ? "bg-amber-450 border-amber-400 text-white shadow-sm"
                                  : "bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-400/50 hover:bg-slate-50"
                              }`}
                              title="Chỉ ra câu chứa dẫn chứng trong bài"
                            >
                              <Lightbulb className="w-3.5 h-3.5" fill={hintsActive[q.questionNo] ? "currentColor" : "none"} />
                            </button>
                          </div>

                          {/* Nội dung câu hỏi và nhập liệu */}
                          <div className="flex-1 space-y-3 pt-0.5">
                            
                            {/* Text câu hỏi */}
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-800 leading-snug">
                                {displayTitle}
                              </p>
                              {showExplanation && q.explanation?.vi && (
                                <div className="text-[13px] text-blue-650/90 italic font-semibold leading-relaxed bg-blue-50/40 p-2 rounded-xl border border-blue-100/50 mt-1 select-text">
                                  <span className="font-black not-italic text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-1.5 shrink-0 select-none">DỊCH NGHĨA</span>
                                  {q.explanation.vi}
                                </div>
                              )}
                            </div>

                            {/* Render UI Nhập liệu tùy theo dạng câu hỏi */}
                            <div className="pl-1">
                              {g.question_type === "MULTIPLE_CHOICE_SINGLE" && (q.options || q.options_pool || g.options_pool) && (
                                <div className="flex flex-col gap-1.5 pt-1.5">
                                  {Object.entries(q.options || q.options_pool || g.options_pool || {}).map(([optCode, optVal]) => {
                                    const isChecked = userAns === optCode;
                                    const optTranslation = q.options_translation?.[optCode] || g.options_pool_translation?.[optCode];
                                    return (
                                      <div 
                                        key={optCode}
                                        className="flex items-center gap-2.5 text-xs text-slate-700 py-1"
                                      >
                                        <input
                                          type="radio"
                                          name={`q-${q.questionNo}`}
                                          value={optCode}
                                          checked={isChecked}
                                          disabled={isSubmitted}
                                          onChange={() => handleAnswerChange(q.questionNo, optCode)}
                                          className="text-blue-600 focus:ring-blue-500 bg-white border-slate-300 w-3.5 h-3.5 cursor-pointer shrink-0"
                                        />
                                        <div className="flex items-start gap-1 select-text">
                                          <span className="font-bold">{optCode}.</span>
                                          <div className="flex flex-col text-sm font-medium text-slate-700">
                                            <span>{String(optVal)}</span>
                                            {showExplanation && optTranslation && (
                                              <span className="text-[11px] text-blue-600/80 font-bold italic mt-0.5">
                                                ({String(optTranslation)})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}


                              {(g.question_type === "TRUE_FALSE_NOT_GIVEN" || g.question_type === "YES_NO_NOT_GIVEN") && (
                                <div className="flex flex-wrap gap-4 pt-1.5">
                                  {[(g.question_type === "TRUE_FALSE_NOT_GIVEN" ? "TRUE" : "YES"), 
                                    (g.question_type === "TRUE_FALSE_NOT_GIVEN" ? "FALSE" : "NO"), 
                                    "NOT GIVEN"].map((optionVal: string) => {
                                      const isChecked = userAns.toUpperCase() === optionVal;
                                      return (
                                        <div 
                                          key={optionVal}
                                          className="flex items-center gap-2 text-xs text-slate-700 font-bold"
                                        >
                                          <input
                                            type="radio"
                                            name={`q-${q.questionNo}`}
                                            value={optionVal}
                                            checked={isChecked}
                                            disabled={isSubmitted}
                                            onChange={() => handleAnswerChange(q.questionNo, optionVal)}
                                            className="text-blue-600 focus:ring-blue-500 bg-white border-slate-300 w-3.5 h-3.5 cursor-pointer shrink-0"
                                          />
                                          <span className="select-text cursor-default">{optionVal}</span>
                                        </div>
                                      );
                                  })}
                                </div>
                              )}

                              {(g.question_type === "FILL_IN_BLANKS" || 
                                g.question_type === "SHORT_ANSWER" || 
                                g.question_type === "SUMMARY_COMPLETION_TEXT" || 
                                g.question_type === "FLOW_CHART_COMPLETION" || 
                                g.question_type === "FLOWCHART_COMPLETION" || 
                                g.question_type === "DIAGRAM_LABEL_COMPLETION" || 
                                g.question_type === "DIAGRAM_LABEL" || 
                                g.question_type === "DIAGRAM_MAP_LABEL" || 
                                g.question_type === "TABLE_COMPLETION" || 
                                g.question_type === "NOTE_COMPLETION") && (
                                <input
                                  type="text"
                                  value={userAns}
                                  disabled={isSubmitted}
                                  onChange={(e) => handleAnswerChange(q.questionNo, e.target.value)}
                                  className="w-full max-w-sm px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl outline-none text-xs font-medium text-slate-800 transition-all placeholder-slate-400 shadow-sm"
                                  placeholder="Gõ đáp án cần điền..."
                                />
                              )}

                              {(g.question_type === "MATCHING_HEADINGS" || 
                                g.question_type === "MATCHING_INFORMATION" || 
                                g.question_type === "SUMMARY_COMPLETION_OPTION" ||
                                g.question_type === "MATCHING_FEATURES" ||
                                g.question_type === "MATCHING_SENTENCE_ENDINGS") && g.options_pool && (() => {
                                 const isOver = dropTargetNo === q.questionNo;
                                 const assignedText = userAns ? (g.options_pool as any)[userAns] : null;

                                 // Lọc bỏ tiền tố chữ cái lặp của option text
                                 let cleanAssignedText = assignedText ? String(assignedText).trim() : "";
                                 if (userAns) {
                                   const prefixRegex = new RegExp(`^\\s*${userAns}\\s*\\.\\s*`, 'i');
                                   cleanAssignedText = cleanAssignedText.replace(prefixRegex, '');
                                 }

                                 const isCorrect = isSubmitted && userAns && String(userAns).trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase();
                                 const isWrong = isSubmitted && userAns && !isCorrect;

                                 return (
                                   <div
                                     onDragOver={(e) => { e.preventDefault(); setDropTargetNo(q.questionNo); }}
                                     onDragLeave={() => setDropTargetNo(null)}
                                     onDrop={(e) => {
                                       e.preventDefault();
                                       if (!dragItem) return;
                                       handleAnswerChange(q.questionNo, dragItem.code);
                                       setDragItem(null); setDropTargetNo(null);
                                     }}
                                     className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all w-full max-w-md ${
                                       isOver ? "border-blue-400 bg-blue-50/50 scale-[1.01]" :
                                       isCorrect ? "border-emerald-300 bg-emerald-50/40" :
                                       isWrong ? "border-red-300 bg-red-50/40" :
                                       userAns ? "border-blue-200 bg-blue-50/20" :
                                       "border-dashed border-slate-350 bg-slate-50/50"
                                     }`}
                                   >
                                     {userAns ? (
                                       <div className="flex-1 flex items-center gap-2 text-sm">
                                         <span className="font-black text-blue-600 bg-blue-50 border border-blue-200/50 w-6 h-6 flex items-center justify-center rounded-lg shrink-0">{userAns}</span>
                                         <div className="flex flex-col truncate">
                                           <span className="text-slate-700 font-medium truncate leading-snug">{cleanAssignedText}</span>
                                           {showExplanation && g.options_pool_translation?.[userAns] && (
                                             <span className="text-[11px] text-blue-650/80 italic font-bold truncate">
                                               ({g.options_pool_translation[userAns]})
                                             </span>
                                           )}
                                         </div>
                                         {!isSubmitted && (
                                           <button 
                                             onClick={() => handleAnswerChange(q.questionNo, '')} 
                                             className="ml-auto text-slate-400 hover:text-red-500 font-bold px-1.5 transition-colors text-xs"
                                             title="Hủy chọn"
                                           >✕</button>
                                         )}
                                       </div>
                                     ) : (
                                       <span className="text-slate-400 text-sm italic py-1 select-none">
                                         {isOver ? "↓ Thả nhãn vào đây" : "Kéo nhãn chữ cái thả vào đây..."}
                                       </span>
                                     )}

                                     {isSubmitted && isWrong && (
                                       <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-250 shrink-0">
                                         ✓ {q.correctAnswer}
                                       </span>
                                     )}
                                   </div>
                                 );
                               })()}

                              {/* MATCHING_INFORMATION / MATCHING_FEATURES không có options_pool → tự sinh chữ cái từ instruction */}
                              {(g.question_type === "MATCHING_INFORMATION" || g.question_type === "MATCHING_FEATURES") && !g.options_pool && (() => {
                                // Tìm dạng "A-I", "A-J", "A-H" trong instruction
                                const rangeMatch = (g.instruction || "").match(/\b([A-Z])-([A-Z])\b/);
                                const start = rangeMatch ? rangeMatch[1].charCodeAt(0) : "A".charCodeAt(0);
                                const end = rangeMatch ? rangeMatch[2].charCodeAt(0) : "I".charCodeAt(0);
                                const letters = Array.from({ length: end - start + 1 }, (_, i) => String.fromCharCode(start + i));
                                return (
                                  <select
                                    value={userAns}
                                    disabled={isSubmitted}
                                    onChange={(e) => handleAnswerChange(q.questionNo, e.target.value)}
                                    className="w-full max-w-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs text-slate-800 shadow-sm transition-all"
                                  >
                                    <option value="">-- Chọn đoạn --</option>
                                    {letters.map((letter: string) => (
                                      <option key={letter} value={letter}>{letter}</option>
                                    ))}
                                  </select>
                                );
                              })()}
                            </div>

                            {/* Bảng xem lại giải thích và đáp án chuẩn khi nộp bài */}
                            {showExplanation && (
                              <div className="bg-slate-100/85 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs leading-relaxed animate-in slide-in-from-top-2 duration-300">
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 font-bold">
                                  <span className="text-slate-550">
                                    Đáp án của bạn: <span className={isCorrect ? "text-emerald-600" : userAns ? "text-red-600 line-through" : "text-slate-400"}>{userAns || "(Trống)"}</span>
                                  </span>
                                  <span className="text-slate-550">
                                    Đáp án đúng: <span className="text-emerald-600">{q.correctAnswer}</span>
                                  </span>
                                </div>

                                {q.explanation && (
                                  <div className="border-t border-slate-200 pt-3 space-y-2 text-slate-700">
                                    {q.explanation.why_correct && (
                                      <div>
                                        <span className="font-extrabold text-[10px] text-emerald-600 uppercase tracking-wide block">Vì sao đáp án này đúng:</span>
                                        <p className="mt-0.5">{q.explanation.why_correct}</p>
                                      </div>
                                    )}
                                    {q.explanation.why_wrong && (
                                      <div>
                                        <span className="font-extrabold text-[10px] text-red-650 uppercase tracking-wide block">Phân tích sai sót thường gặp:</span>
                                        <p className="mt-0.5 text-slate-655">{q.explanation.why_wrong}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );})}

          </div>
        </div>

      </div>

      {/* FOOTER NAVIGATION & BẢNG SỐ CÂU (1-40) */}
      {(() => {
        const renderQuestionButton = (q: any) => {
          const userAns = answers[q.questionNo] || "";
          const isCorrect = userAns.trim().toLowerCase() === String(q.correctAnswer || "").trim().toLowerCase() || 
                            String(q.correctAnswer || "").trim().toLowerCase().split('/').map((x: any) => x.trim()).includes(userAns.trim().toLowerCase());
          const isQSelected = selectedQuestionNo === q.questionNo;

          let btnClass = "bg-white hover:bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300";
          
          if (isSubmitted) {
            btnClass = isCorrect 
              ? "bg-emerald-500 border-emerald-500 text-white font-bold shadow-sm" 
              : "bg-red-500 border-red-500 text-white font-bold shadow-sm";
          } else if (userAns) {
            btnClass = "bg-blue-500 border-blue-500 text-white font-bold shadow-sm";
          }

          if (isQSelected) {
            btnClass += " ring-2 ring-slate-800 border-slate-800 scale-110 shadow-md z-10";
          }

          return (
            <button
              key={q.questionNo}
              onClick={() => handleJumpToQuestion(q.questionNo)}
              className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all flex items-center justify-center border ${btnClass}`}
            >
              {q.questionNo}
            </button>
          );
        };

        return (
          <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shadow-md relative z-40 select-none">
            
            {/* Cụm trái: Câu 1 - 20 */}
            <div className="flex-1 flex flex-wrap gap-1.5 justify-end max-w-[45%]">
              {allQuestions.slice(0, 20).map((q: any) => renderQuestionButton(q))}
            </div>

            {/* Nút Passage trước/tiếp nhỏ gọn ở giữa */}
            <div className="flex items-center gap-1 mx-4 flex-shrink-0">
              <button
                disabled={activePassageIdx === 0}
                onClick={() => setActivePassageIdx(prev => prev - 1)}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 rounded-full border border-slate-200 text-slate-700 transition-all disabled:cursor-not-allowed active:scale-95 shadow-sm"
                title="Passage trước (Phím ←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={activePassageIdx === passages.length - 1}
                onClick={() => setActivePassageIdx(prev => prev + 1)}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 rounded-full border border-slate-200 text-slate-700 transition-all disabled:cursor-not-allowed active:scale-95 shadow-sm"
                title="Passage tiếp (Phím →)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Cụm phải: Câu 21 - 40 */}
            <div className="flex-1 flex flex-wrap gap-1.5 justify-start max-w-[45%]">
              {allQuestions.slice(20, 40).map((q: any) => renderQuestionButton(q))}
            </div>

          </div>
        );
      })()}

      {/* TOOLTIP HIỂN THỊ BẢN DỊCH HOVER */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            top: `${tooltip.rect.top - 10}px`,
            left: `${tooltip.rect.left + tooltip.rect.width / 2}px`,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none"
          }}
          className="z-[999] bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.15)] text-xs max-w-sm leading-relaxed text-center animate-in fade-in zoom-in-95 duration-200"
        >
          <p className="font-bold">{tooltip.text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-800" />
        </div>
      )}

    </div>
  );
}
