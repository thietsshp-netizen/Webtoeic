"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import {
  Timer,
  Send,
  Flag,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Trophy,
  RotateCcw,
  Check,
  Play,
  Square,
  Pause,
  X
} from "lucide-react";
import ToeicPart1Player from "@/components/Toeic/ToeicPart1Player";
import ToeicPart2Player from "@/components/Toeic/ToeicPart2Player";
import ToeicPart34Player from "@/components/Toeic/ToeicPart34Player";
import ToeicPart5Player from "@/components/Toeic/ToeicPart5Player";
import ToeicPart6Player from "@/components/Toeic/Part6/ToeicPart6Player";
import ToeicPart7Player from "@/components/Toeic/Part7/ToeicPart7Player";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { showToast } from "@/components/UI/Toast";
import Link from "next/link";
import { FlagColor } from "../Player/FlagSelector";
import FloatingVideoExplanationPlayer from "../Player/FloatingVideoExplanationPlayer";

interface FullTestPlayerProps {
  book: string;
  test: string;
  data: Record<number, any[]>;
  lessonId: string;
  courseId?: string;
  nextLessonId?: string;
  initialProgress?: any;
  initialIsSubmitted?: boolean;
  jumpTo?: { id: string; ts: number } | null;
  videoExplanation?: any;
}

export default function ToeicFullTestPlayer({
  book,
  test,
  data,
  lessonId,
  courseId,
  nextLessonId,
  initialProgress = {},
  initialIsSubmitted = false,
  jumpTo: jumpToProp,
  videoExplanation
}: FullTestPlayerProps) {
  const [activePart, setActivePart] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 phút
  const [isSubmitted, setIsSubmitted] = useState(initialIsSubmitted);
  const [showResults, setShowResults] = useState(false);
  const [userProgress, setUserProgress] = useState(initialProgress);
  const [jumpTo, setJumpTo] = useState<{ id: string; ts: number } | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeQuestionNo, setActiveQuestionNo] = useState<number | null>(null);
  const [disableSidebarTransition, setDisableSidebarTransition] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  type RecTimestamp = { label: string; time: number; targetIndex: number };
  const [isTeachingMode, setIsTeachingMode] = useState(false);
  const [showTeachSetup, setShowTeachSetup] = useState(false);
  const [showTeachFinish, setShowTeachFinish] = useState(false);
  const [isTeachPaused, setIsTeachPaused] = useState(false);

  const [teachingTitle, setTeachingTitle] = useState(`Chữa đề ${book} - ${test}`);
  const [teachingStartNo, setTeachingStartNo] = useState<number>(101);
  const [teachingVideoUrl, setTeachingVideoUrl] = useState("");
  const [teachingVideoType, setTeachingVideoType] = useState<"youtube" | "google-drive" | "direct">("direct");
  const [teachingSaveType, setTeachingSaveType] = useState<"new" | "overwrite">("new");
  const [teachingOverwriteIndex, setTeachingOverwriteIndex] = useState<number>(0);

  const [teachStartTime, setTeachStartTime] = useState<number | null>(null);
  const [recTimestamps, setRecTimestamps] = useState<RecTimestamp[]>([]);
  const [recElapsed, setRecElapsed] = useState(0);
  const [isSavingRec, setIsSavingRec] = useState(false);

  // Chuẩn hóa videoExplanation thành dạng vừa là Mảng vừa là Đối tượng đơn để tương thích ngược 100% với các Part Players
  const normalizedExplanation = useMemo(() => {
    if (!videoExplanation) return null;
    const array = Array.isArray(videoExplanation)
      ? videoExplanation
      : [videoExplanation];
    
    return Object.assign([...array], {
      videoUrl: array[0]?.videoUrl,
      videoType: array[0]?.videoType,
      timestamps: array[0]?.timestamps,
    });
  }, [videoExplanation]);

  // Lắng nghe sự kiện từ Tour để tự động mở bung Sidebar làm ví dụ
  useEffect(() => {
    const handleTourSidebar = (e: Event) => {
      const customEvent = e as CustomEvent;
      // Tắt transition để Sidebar phình to lập tức 0ms, giúp Driver.js đo kích thước chuẩn 100%
      setDisableSidebarTransition(true);
      setIsSidebarHovered(customEvent.detail.open);

      // Sau khi đóng hoặc chuyển bước, khôi phục lại transition mượt mà sau 500ms
      if (!customEvent.detail.open) {
        setTimeout(() => {
          setDisableSidebarTransition(false);
        }, 500);
      }
    };
    window.addEventListener("toeic-tour-sidebar", handleTourSidebar);
    return () => window.removeEventListener("toeic-tour-sidebar", handleTourSidebar);
  }, []);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeInput, setTimeInput] = useState("120");
  const [isSaving, setIsSaving] = useState(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, message: string, onConfirm: () => void } | null>(null);

  const lastScrolledNo = useRef<number | null>(null);

  // Tự động cuộn sidebar tới câu hiện tại khi hover
  useEffect(() => {
    if (isSidebarHovered && activeQuestionNo && questionRefs.current.has(activeQuestionNo)) {
      const delay = lastScrolledNo.current === null ? 500 : 50;

      const timer = setTimeout(() => {
        const targetEl = questionRefs.current.get(activeQuestionNo);
        if (targetEl) {
          targetEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          lastScrolledNo.current = activeQuestionNo;
        }
      }, delay);
      return () => clearTimeout(timer);
    }

    if (!isSidebarHovered) {
      lastScrolledNo.current = null;
    }
  }, [isSidebarHovered, activeQuestionNo]);

  // Cuộn lên đầu khi đổi Part
  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [activePart]);

  useEffect(() => {
    setMounted(true);
  }, []);


  // Đồng hồ đếm ngược
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Tổng hợp tất cả câu hỏi để làm bảng điều hướng (200 câu)
  const allQuestions = useMemo(() => {
    const list: any[] = [];
    [1, 2, 3, 4, 5, 6, 7].forEach(p => {
      if (!data[p]) return;
      data[p].forEach((group, gIdx) => {
        let questionsToProcess = group.questions || [];

        // ĐẶC BIỆT: Part 7 có thể parse JSON từ passageText để lấy list câu hỏi "chuẩn"
        if (p === 7 && group.passageText?.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(group.passageText);
            const questionsFromJson = parsed.questions || (parsed.question ? (Array.isArray(parsed.question) ? parsed.question : [parsed.question]) : []);
            if (questionsFromJson.length > 0) {
              questionsToProcess = questionsFromJson.map((q: any, idx: number) => {
                const dbMatch = (group.questions || []).find((dbQ: any) =>
                  String(dbQ.questionNo) === String(q.questionNo || q.question_no || q.number || q.qNo)
                ) || (group.questions || [])[idx];

                return {
                  ...q,
                  id: dbMatch?.id || q.id || `q-${group.id || group._id}-${idx}`,
                  dbId: dbMatch?.id || (q.id?.startsWith('q-') || q.id?.includes('_') ? null : q.id)
                };
              });
            }
          } catch (e) {
            console.error("Error parsing Part 7 passageText JSON in FullTestPlayer:", e);
          }
        }

        if (Array.isArray(questionsToProcess)) {
          questionsToProcess.forEach((q: any, qIdx: number) => {
            let meta = q.metadata || {};
            if (typeof meta === 'string' && meta.trim().startsWith('{')) {
              try { meta = JSON.parse(meta); } catch (e) { }
            }

            let standardId = q.id || q._id || q.dbId;
            if (!standardId) {
              if (p === 7) standardId = `q-${group.id || group._id}-${qIdx}`;
              else standardId = `${group.id || group._id}_${q.questionNo || qIdx}`;
            }

            const standardCorrectAnswer = String(
              q.correctAnswer ||
              q.correct_answer ||
              meta.correctAnswer ||
              meta.correct_answer ||
              q.answer ||
              ""
            ).trim().toUpperCase();

            const normalizedQ = {
              ...q,
              part: p,
              groupId: group.id || group._id || `group-${p}-${gIdx}`,
              id: standardId,
              dbId: q.id || q._id || q.dbId || (standardId.startsWith('q-') || standardId.includes('_') ? null : standardId),
              correctAnswer: standardCorrectAnswer,
              metadata: meta
            };
            list.push(normalizedQ);
          });
        }
      });
    });

    const sorted = list.sort((a, b) => a.questionNo - b.questionNo);
    return sorted;
  }, [data]);

  // Sync jumpTo from props
  const lastJumpedId = useRef<string | null>(null);

  useEffect(() => {
    if (jumpToProp?.id && allQuestions.length > 0) {
      const targetId = String(jumpToProp.id);
      if (lastJumpedId.current === targetId) return;

      const foundQ = allQuestions.find(q =>
        String(q.id) === targetId ||
        String(q.dbId) === targetId ||
        String(q.questionNo) === targetId
      );

      if (foundQ) {
        lastJumpedId.current = targetId;
        if (foundQ.part !== activePart) {
          setActivePart(foundQ.part);
        }
        setJumpTo({ id: targetId, ts: Date.now() });
      }
    }
  }, [jumpToProp, allQuestions]);

  const partOffsets = useMemo(() => {
    const offsets: Record<number, number> = {};
    let currentOffset = 0;
    [1, 2, 3, 4, 5, 6, 7].forEach(p => {
      offsets[p] = currentOffset;
      if (data[p]) {
        data[p].forEach(group => {
          if (group.questions && Array.isArray(group.questions)) {
            currentOffset += group.questions.length;
          }
        });
      }
    });
    return offsets;
  }, [data]);

  // Đồng hồ chạy ngầm tăng giây mỗi giây khi không Pause
  useEffect(() => {
    if (!isTeachingMode || teachStartTime === null || isTeachPaused) return;
    const timer = setInterval(() => {
      setRecElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTeachingMode, teachStartTime, isTeachPaused]);

  // Phím tắt vạn năng cho Admin (Space/Enter)
  useEffect(() => {
    const handleRecKeyDown = (e: KeyboardEvent) => {
      if (!isTeachingMode || showTeachSetup || showTeachFinish) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        
        const lastStamp = recTimestamps[recTimestamps.length - 1];
        const nextNo = lastStamp ? lastStamp.targetIndex + 1 : teachingStartNo;
        const totalQs = allQuestions.length || 200;
        const label = `${nextNo}/${totalQs}`;

        setRecTimestamps(ts => {
          if (ts.some(t => t.targetIndex === nextNo)) return ts;
          return [
            ...ts,
            { label, time: recElapsed, targetIndex: nextNo }
          ];
        });

        showToast(`Đã ghi nhận mốc Câu ${nextNo}!`, "success");
      }
    };

    window.addEventListener('keydown', handleRecKeyDown);
    return () => window.removeEventListener('keydown', handleRecKeyDown);
  }, [isTeachingMode, recTimestamps, recElapsed, teachingStartNo, allQuestions, showTeachSetup, showTeachFinish]);

  const handleNextStampClick = () => {
    const lastStamp = recTimestamps[recTimestamps.length - 1];
    const nextNo = lastStamp ? lastStamp.targetIndex + 1 : teachingStartNo;
    const totalQs = allQuestions.length || 200;
    const label = `${nextNo}/${totalQs}`;

    setRecTimestamps(ts => {
      if (ts.some(t => t.targetIndex === nextNo)) return ts;
      return [
        ...ts,
        { label, time: recElapsed, targetIndex: nextNo }
      ];
    });

    showToast(`Đã ghi nhận mốc Câu ${nextNo}!`, "success");
  };

  const handleStartTeaching = () => {
    const now = Date.now();
    setTeachStartTime(now);
    setRecTimestamps([]);
    setRecElapsed(0);
    setIsTeachPaused(false);
    setIsTeachingMode(true);
    setShowTeachSetup(false);

    // Ghi mốc đầu tiên của câu bắt đầu tại 0s
    const totalQs = allQuestions.length || 200;
    const label = `${teachingStartNo}/${totalQs}`;
    setRecTimestamps([{ label, time: 0, targetIndex: teachingStartNo }]);
  };

  const handleFinishTeaching = async () => {
    setIsSavingRec(true);
    try {
      const newVideoEntry = {
        title: teachingTitle.trim() || `Chữa đề ${book} - ${test}`,
        videoUrl: teachingVideoUrl.trim(),
        videoType: teachingVideoType,
        timestamps: recTimestamps.map(t => ({
          label: t.label,
          time: t.time,
          targetIndex: t.targetIndex
        }))
      };

      let updatedExplanation: any[] = [];
      const currentRaw = videoExplanation;
      const currentArray = Array.isArray(currentRaw)
        ? currentRaw
        : currentRaw?.videoUrl
        ? [currentRaw]
        : [];

      if (teachingSaveType === "overwrite" && currentArray.length > 0) {
        updatedExplanation = [...currentArray];
        const idx = Math.min(teachingOverwriteIndex, updatedExplanation.length - 1);
        if (idx >= 0) {
          updatedExplanation[idx] = {
            ...updatedExplanation[idx],
            title: newVideoEntry.title,
            videoUrl: newVideoEntry.videoUrl || updatedExplanation[idx].videoUrl,
            videoType: newVideoEntry.videoType,
            timestamps: newVideoEntry.timestamps
          };
        }
      } else {
        updatedExplanation = [...currentArray, newVideoEntry];
      }

      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoExplanation: updatedExplanation
        })
      });

      if (!res.ok) throw new Error("API call failed");

      showToast("Đã lưu mốc bài giảng thành công!", "success");
      setIsTeachingMode(false);
      setShowTeachFinish(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      showToast("Gặp lỗi khi lưu mốc bài giảng!", "error");
    } finally {
      setIsSavingRec(false);
    }
  };

  const formatRec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getListeningScore = (correct: number) => {
    if (correct >= 91) return 495;
    const table: Record<number, number> = {
      90: 440, 89: 490, 88: 485, 87: 480, 86: 475, 85: 470, 84: 465, 83: 460, 82: 450, 81: 445,
      80: 440, 79: 430, 78: 425, 77: 420, 76: 410, 75: 405, 74: 400, 73: 395, 72: 390, 71: 385,
      70: 380, 69: 370, 68: 365, 67: 360, 66: 350, 65: 345, 64: 340, 63: 330, 62: 325, 61: 320,
      60: 315, 59: 310, 58: 300, 57: 295, 56: 290, 55: 280, 54: 275, 53: 270, 52: 260, 51: 255,
      50: 250, 49: 245, 48: 240, 47: 230, 46: 220, 45: 215, 44: 210, 43: 200, 42: 195, 41: 190,
      40: 185, 39: 180, 38: 175, 37: 170, 36: 165, 35: 160, 34: 150, 33: 145, 32: 140, 31: 135,
      30: 130, 29: 125, 28: 120, 27: 115, 26: 110, 25: 100, 24: 95, 23: 90, 22: 85, 21: 80,
      20: 75, 19: 70, 18: 65, 17: 60, 16: 55, 15: 50, 14: 45, 13: 40, 12: 35, 11: 30,
      10: 25, 9: 20, 8: 15, 7: 10, 6: 5, 5: 5, 4: 5, 3: 5, 2: 5, 1: 5, 0: 5
    };
    return table[correct] ?? 5;
  };

  const getReadingScore = (correct: number) => {
    if (correct >= 97) return 495;
    const table: Record<number, number> = {
      96: 490, 95: 485, 94: 480, 93: 470, 92: 465, 91: 455, 90: 450, 89: 445, 88: 435, 87: 430, 86: 425, 85: 420, 84: 415, 83: 410, 82: 405, 81: 400,
      80: 395, 79: 390, 78: 385, 77: 380, 76: 370, 75: 365, 74: 360, 73: 355, 72: 350, 71: 340,
      70: 335, 69: 330, 68: 325, 67: 320, 66: 310, 65: 305, 64: 300, 63: 290, 62: 285, 61: 280,
      60: 270, 59: 265, 58: 260, 57: 255, 56: 250, 55: 240, 54: 235, 53: 230, 52: 225, 51: 220,
      50: 215, 49: 210, 48: 200, 47: 195, 46: 190, 45: 180, 44: 175, 43: 170, 42: 165, 41: 160,
      40: 150, 39: 145, 38: 140, 37: 130, 36: 125, 35: 120, 34: 115, 33: 110, 32: 100, 31: 95,
      30: 90, 29: 85, 28: 80, 27: 70, 26: 65, 25: 60, 24: 50, 23: 45, 22: 40, 21: 35,
      20: 30, 19: 25, 18: 20, 17: 15, 16: 10, 15: 5, 14: 5, 13: 5, 12: 5, 11: 5,
      10: 5, 9: 5, 8: 5, 7: 5, 6: 5, 5: 5, 4: 5, 3: 5, 2: 5, 1: 5, 0: 5
    };
    return table[correct] ?? 5;
  };

  const stats = useMemo(() => {
    const parts = [1, 2, 3, 4, 5, 6, 7];
    const pStats: Record<number, { correct: number, total: number, incorrect: number, unanswered: number, categories: Record<string, { correct: number, total: number }> }> = {};

    parts.forEach(p => {
      pStats[p] = { correct: 0, total: 0, incorrect: 0, unanswered: 0, categories: {} };
      const partQuestions = allQuestions.filter(q => q.part === p);

      partQuestions.forEach(q => {
        const catRaw = q.metadata?.category || q.metadata?.type || q.category || "Khác";
        const cat = String(catRaw).trim() || "Khác";
        if (!pStats[p].categories[cat]) pStats[p].categories[cat] = { correct: 0, total: 0 };

        pStats[p].total++;
        pStats[p].categories[cat].total++;

        const qKey = q.id;
        const prog = userProgress[qKey];
        const ans = prog?.userAnswer;

        if (!ans) {
          pStats[p].unanswered++;
        } else if (String(ans).toUpperCase() === String(q.correctAnswer).toUpperCase()) {
          pStats[p].correct++;
          pStats[p].categories[cat].correct++;
        } else {
          pStats[p].incorrect++;
        }
      });
    });

    const lcCorrect = pStats[1].correct + pStats[2].correct + pStats[3].correct + pStats[4].correct;
    const rcCorrect = pStats[5].correct + pStats[6].correct + pStats[7].correct;

    const lcScore = getListeningScore(lcCorrect);
    const rcScore = getReadingScore(rcCorrect);

    return {
      total: allQuestions.length,
      answered: Object.values(userProgress).filter((p: any) => p.userAnswer).length,
      parts: pStats,
      lcScore,
      rcScore,
      totalScore: lcScore + rcScore,
      timeSpent: 7200 - timeLeft
    };
  }, [data, userProgress, allQuestions, timeLeft]);

  const handleSyncFlag = async (qId: string, color: FlagColor | null, note?: string) => {
    try {
      const q = allQuestions.find(aq => aq.id === qId);
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
          flagNote: note,
          testId: `${book}-${test}`,
          questionNo: q?.questionNo
        })
      });
    } catch (err) {
      console.error("Lỗi khi đồng bộ cờ:", err);
    }
  };

  const handleSubmit = () => {
    setConfirmConfig({
      isOpen: true,
      message: "Bạn có chắc chắn muốn nộp bài không?",
      onConfirm: async () => {
        setIsSubmitted(true);
        setShowResults(true);
        setConfirmConfig(null);
        setIsSaving(true);

        try {
          const attempts = allQuestions
            .filter(q => q.dbId)
            .map(q => {
              const qKey = q.id;
              const prog = userProgress[qKey] || {};
              const userAns = String(prog.userAnswer || "").trim().toUpperCase();
              const correctAns = String(q.correctAnswer || "").trim().toUpperCase();
              const isCorrect = userAns !== "" && userAns === correctAns;

              return {
                questionId: q.dbId,
                questionNo: q.questionNo,
                lessonId,
                courseId,
                userAnswer: userAns,
                isCorrect: isCorrect
              };
            });

          await fetch("/api/me/full-test-attempts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonId,
              testId: `${book}-${test}`,
              lcScore: stats.lcScore,
              rcScore: stats.rcScore,
              totalScore: stats.totalScore,
              correctCount: Object.values(stats.parts).reduce((sum: number, p: any) => sum + p.correct, 0),
              incorrectCount: Object.values(stats.parts).reduce((sum: number, p: any) => sum + (p.total - p.correct - p.unanswered), 0),
              unansweredCount: Object.values(stats.parts).reduce((sum: number, p: any) => sum + p.unanswered, 0),
              timeSpent: stats.timeSpent,
              attempts
            })
          });
          showToast("Đã lưu kết quả bài thi!");
        } catch (error) {
          console.error("Failed to save test result:", error);
          showToast("Lỗi khi lưu kết quả bài thi!", "error");
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const handleUpdateProgress = useCallback((newProgress: any) => {
    setUserProgress((prev: any) => {
      const hasChange = Object.entries(newProgress).some(([id, data]: [string, any]) => {
        const prevData = prev[id];
        return !prevData || prevData.userAnswer !== data.userAnswer || prevData.isFlagged !== data.isFlagged || prevData.flagColor !== data.flagColor;
      });

      if (!hasChange) return prev;

      return {
        ...prev,
        ...newProgress
      };
    });
  }, []);

  // Cross-part navigation từ video player
  const handleVideoQuestionSync = useCallback((questionNo: number) => {
    const foundQ = allQuestions.find(q => q.questionNo === questionNo);
    if (foundQ) {
      if (activePart !== foundQ.part) {
        setActivePart(foundQ.part);
      }
      setActiveQuestionNo(foundQ.questionNo);
      setJumpTo({ id: String(foundQ.questionNo), ts: Date.now() });
    }
  }, [allQuestions, activePart]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
      {/* Hidden button to be clicked programmatically by child Part Players */}
      <button
        id="full-test-submit-btn"
        className="hidden"
        onClick={handleSubmit}
      />

      {/* Portal for Timer in Top Header */}
      {mounted && document.getElementById("header-extra-portal") && createPortal(
        <div id="full-test-part-timer-target" className="flex items-center gap-3 bg-slate-50/50 px-4 py-2 rounded-2xl border border-slate-200/50 backdrop-blur-md">
          {/* Part tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">CHỌN PART:</span>
            {[1, 2, 3, 4, 5, 6, 7].map(p => (
              <button
                key={p}
                onClick={() => setActivePart(p)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                  activePart === p
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                P{p}
              </button>
            ))}
          </div>

          <div className="h-5 w-[1.5px] bg-slate-200"></div>

          {/* Clock - inline editor */}
          <div className="relative flex items-center gap-2">
            {!showTimePicker ? (
              <button
                onClick={() => { setShowTimePicker(true); setTimeInput(String(Math.ceil(timeLeft / 60))); }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all group ${
                  timeLeft < 300 ? "bg-red-100 text-red-600 shadow-sm" : "bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm border border-blue-100/50"
                }`}
                title="Click để đặt thời gian"
              >
                <Clock size={14} className={timeLeft < 300 ? "animate-pulse" : ""} />
                <span className={`text-sm font-black font-mono ${timeLeft < 300 ? "text-red-600" : "text-slate-700"}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap ml-1.5">Đặt lại</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-white border-2 border-blue-500 rounded-xl p-0.5 shadow-lg shadow-blue-500/10 animate-in zoom-in-95 duration-150">
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={999}
                  value={timeInput}
                  onChange={e => setTimeInput(e.target.value)}
                  onBlur={() => setShowTimePicker(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const mins = parseInt(timeInput);
                      if (mins > 0) { setTimeLeft(mins * 60); setShowTimePicker(false); }
                    }
                    if (e.key === 'Escape') setShowTimePicker(false);
                  }}
                  className="w-12 px-1 py-0.5 text-sm font-bold text-slate-800 text-center focus:outline-none bg-transparent"
                  placeholder="P"
                />
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const mins = parseInt(timeInput);
                    if (mins > 0) { setTimeLeft(mins * 60); setShowTimePicker(false); }
                  }}
                  className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Check size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="h-5 w-[1.5px] bg-slate-200"></div>

          {/* Score counter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <CheckCircle2 size={13} className="text-green-500" />
            {stats.answered}/{stats.total}
          </div>

          {/* Admin Teaching Mode Controls */}
          {isAdmin && (
            <>
              <div className="h-5 w-[1.5px] bg-slate-200"></div>
              {!isTeachingMode ? (
                <button
                  onClick={() => {
                    let suggestedNo = 1;
                    if (activePart === 5) suggestedNo = 101;
                    else if (activePart === 6) suggestedNo = 131;
                    else if (activePart === 7) suggestedNo = 147;
                    else if (activeQuestionNo) suggestedNo = activeQuestionNo;
                    setTeachingStartNo(suggestedNo);
                    setShowTeachSetup(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-amber-500/20 flex items-center gap-1.5 active:scale-95"
                >
                  <Play size={10} className="fill-white text-white" /> Giảng bài
                </button>
              ) : (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-sm border transition-all ${
                    isTeachPaused ? "bg-yellow-50 border-yellow-100 text-yellow-600" : "bg-red-50 border-red-100 text-red-600"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isTeachPaused ? "bg-yellow-500" : "bg-red-500 animate-ping"}`} />
                    <span className="text-[10px] font-black font-mono">
                      {isTeachPaused ? "PAUSE" : "REC"} {formatRec(recElapsed)}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsTeachPaused(!isTeachPaused)}
                    className={`p-1.5 rounded-xl border transition-all ${
                      isTeachPaused
                        ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-600"
                        : "bg-yellow-50 hover:bg-yellow-100 border-yellow-100 text-yellow-600"
                    }`}
                    title={isTeachPaused ? "Tiếp tục" : "Tạm dừng"}
                  >
                    {isTeachPaused ? <Play size={10} className="fill-emerald-600 text-emerald-600" /> : <Pause size={10} className="fill-yellow-600 text-yellow-600" />}
                  </button>

                  {(() => {
                    const lastStamp = recTimestamps[recTimestamps.length - 1];
                    const currentNo = lastStamp ? lastStamp.targetIndex : teachingStartNo;
                    const nextNo = lastStamp ? lastStamp.targetIndex + 1 : teachingStartNo;
                    const totalQs = allQuestions.length || 200;
                    return (
                      <>
                        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-xl text-[10px] font-extrabold">
                          Đang giảng {currentNo}/{totalQs}
                        </div>
                        <button
                          onClick={handleNextStampClick}
                          disabled={isTeachPaused}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </>
                    );
                  })()}

                  <button
                    onClick={() => setShowTeachFinish(true)}
                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all active:scale-95"
                    title="Kết thúc ghi mốc"
                  >
                    <Square size={10} className="fill-white text-white" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>,
        document.getElementById("header-extra-portal")!
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <div id="bottom-nav-portal-target" className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none"></div>

        <div ref={mainScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-[1400px] mx-auto pb-20">
            <div className="relative w-full min-h-[calc(100vh-250px)] bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              {activePart === 1 && (
                <ToeicPart1Player
                  key="part1"
                  data={data[1]} lessonId={lessonId} courseId={courseId} isFullTest={true} initialProgress={userProgress} isSubmitted={isSubmitted}
                  onProgressChange={handleUpdateProgress} jumpTo={jumpTo} onNextPart={() => setActivePart(2)}
                  onActiveQuestionChange={setActiveQuestionNo}
                  onToggleFlag={(qId: string, flag: boolean, color?: FlagColor | null, note?: string) => {
                    handleUpdateProgress({ [qId]: { isFlagged: flag, flagColor: color || null, flagNote: note } });
                  }}
                  globalOffset={partOffsets[1]} globalTotal={allQuestions.length}
                  videoExplanation={normalizedExplanation}
                  onVideoQuestionSync={handleVideoQuestionSync}
                  onToggleVideo={() => setShowVideo(p => !p)}
                  videoOpen={showVideo}
                />
              )}
              {activePart === 2 && (
                <ToeicPart2Player
                  key="part2"
                  data={data[2]} lessonId={lessonId} courseId={courseId} isFullTest={true} initialProgress={userProgress} isSubmitted={isSubmitted}
                  onProgressChange={handleUpdateProgress} jumpTo={jumpTo} onNextPart={() => setActivePart(3)}
                  onActiveQuestionChange={setActiveQuestionNo}
                  onToggleFlag={(qId: string, flag: boolean, color?: FlagColor | null, note?: string) => {
                    handleUpdateProgress({ [qId]: { isFlagged: flag, flagColor: color || null, flagNote: note } });
                  }}
                  onPrevPart={() => {
                    const lastQ = allQuestions.filter(q => q.part === 1).pop()?.questionNo || 6;
                    setJumpTo({ id: String(lastQ), ts: Date.now() });
                    setActivePart(1);
                  }}
                  globalOffset={partOffsets[2]} globalTotal={allQuestions.length}
                  videoExplanation={normalizedExplanation}
                  onVideoQuestionSync={handleVideoQuestionSync}
                  onToggleVideo={() => setShowVideo(p => !p)}
                  videoOpen={showVideo}
                />
              )}
              {activePart === 3 && (
                <ToeicPart34Player
                  key="part3"
                  data={data[3]} lessonId={lessonId} courseId={courseId} isFullTest={true} initialProgress={userProgress} isSubmitted={isSubmitted}
                  targetPart={3} onProgressChange={handleUpdateProgress} jumpTo={jumpTo} onNextPart={() => setActivePart(4)}
                  onActiveQuestionChange={setActiveQuestionNo}
                  onToggleFlag={(qId: string, flag: boolean, color?: FlagColor | null, note?: string) => {
                    handleUpdateProgress({ [qId]: { isFlagged: flag, flagColor: color || null, flagNote: note } });
                  }}
                  onPrevPart={() => {
                    const lastQ = allQuestions.filter(q => q.part === 2).pop()?.questionNo || 31;
                    setJumpTo({ id: String(lastQ), ts: Date.now() });
                    setActivePart(2);
                  }}
                  globalOffset={partOffsets[3]} globalTotal={allQuestions.length}
                  videoExplanation={normalizedExplanation}
                  onVideoQuestionSync={handleVideoQuestionSync}
                  onToggleVideo={() => setShowVideo(p => !p)}
                  videoOpen={showVideo}
                />
              )}
              {activePart === 4 && (
                <ToeicPart34Player
                  key="part4"
                  data={data[4]} lessonId={lessonId} courseId={courseId} isFullTest={true} initialProgress={userProgress} isSubmitted={isSubmitted}
                  targetPart={4} onProgressChange={handleUpdateProgress} jumpTo={jumpTo} onNextPart={() => setActivePart(5)}
                  onActiveQuestionChange={setActiveQuestionNo}
                  onToggleFlag={(qId: string, flag: boolean, color?: FlagColor | null, note?: string) => {
                    handleUpdateProgress({ [qId]: { isFlagged: flag, flagColor: color || null, flagNote: note } });
                  }}
                  onPrevPart={() => {
                    const lastQ = allQuestions.filter(q => q.part === 3).pop()?.questionNo || 70;
                    setJumpTo({ id: String(lastQ), ts: Date.now() });
                    setActivePart(3);
                  }}
                  globalOffset={partOffsets[4]} globalTotal={allQuestions.length}
                  videoExplanation={normalizedExplanation}
                  onVideoQuestionSync={handleVideoQuestionSync}
                  onToggleVideo={() => setShowVideo(p => !p)}
                  videoOpen={showVideo}
                />
              )}
              {activePart === 5 && (
                <ToeicPart5Player
                  key="part5"
                  data={data[5]} lessonId={lessonId} courseId={courseId} isFullTest={true} initialProgress={userProgress} isSubmitted={isSubmitted}
                  onProgressChange={handleUpdateProgress} jumpTo={jumpTo} onNextPart={() => setActivePart(6)}
                  onActiveQuestionChange={setActiveQuestionNo}
                  onToggleFlag={(qId: string, flag: boolean, color?: FlagColor | null, note?: string) => {
                    handleUpdateProgress({ [qId]: { isFlagged: flag, flagColor: color || null, flagNote: note } });
                  }}
                  onPrevPart={() => {
                    const lastQ = allQuestions.filter(q => q.part === 4).pop()?.questionNo || 100;
                    setJumpTo({ id: String(lastQ), ts: Date.now() });
                    setActivePart(4);
                  }}
                  globalOffset={partOffsets[5]} globalTotal={allQuestions.length}
                  videoExplanation={normalizedExplanation}
                  onVideoQuestionSync={handleVideoQuestionSync}
                  onToggleVideo={() => setShowVideo(p => !p)}
                  videoOpen={showVideo}
                />
              )}
              {activePart === 6 && (
                <ToeicPart6Player
                  key="part6"
                  data={data[6]} lessonId={lessonId} courseId={courseId} isFullTest={true} initialProgress={userProgress} isSubmitted={isSubmitted}
                  onProgressChange={handleUpdateProgress} jumpTo={jumpTo} onNextPart={() => setActivePart(7)}
                  onActiveQuestionChange={setActiveQuestionNo}
                  onToggleFlag={(qId: string, flag: boolean, color?: FlagColor | null, note?: string) => {
                    handleUpdateProgress({ [qId]: { isFlagged: flag, flagColor: color || null, flagNote: note } });
                  }}
                  onPrevPart={() => {
                    const lastQ = allQuestions.filter(q => q.part === 5).pop()?.questionNo || 130;
                    setJumpTo({ id: String(lastQ), ts: Date.now() });
                    setActivePart(5);
                  }}
                  globalOffset={partOffsets[6]} globalTotal={allQuestions.length}
                  videoExplanation={normalizedExplanation}
                  onVideoQuestionSync={handleVideoQuestionSync}
                  onToggleVideo={() => setShowVideo(p => !p)}
                  videoOpen={showVideo}
                />
              )}
              {activePart === 7 && (
                <ToeicPart7Player
                  key="part7"
                  data={data[7]} lessonId={lessonId} courseId={courseId} isFullTest={true} initialProgress={userProgress} isSubmitted={isSubmitted}
                  onProgressChange={handleUpdateProgress} jumpTo={jumpTo}
                  onActiveQuestionChange={setActiveQuestionNo}
                  onToggleFlag={(qId: string, flag: boolean, color?: FlagColor | null, note?: string) => {
                    handleUpdateProgress({ [qId]: { isFlagged: flag, flagColor: color || null, flagNote: note } });
                    handleSyncFlag(qId, color || null, note);
                  }}
                  onPrevPart={() => {
                    const lastQ = allQuestions.filter(q => q.part === 6).pop()?.questionNo || 146;
                    setJumpTo({ id: String(lastQ), ts: Date.now() });
                    setActivePart(6);
                  }}
                  globalOffset={partOffsets[7]} globalTotal={allQuestions.length}
                  videoExplanation={normalizedExplanation}
                  onVideoQuestionSync={handleVideoQuestionSync}
                  onToggleVideo={() => setShowVideo(p => !p)}
                  videoOpen={showVideo}
                />
              )}
            </div>
          </div>
        </div>

        {mounted && createPortal(
          <div
            className={`questions-sidebar-portal
              fixed right-0 top-14 bottom-0 z-[999] ${disableSidebarTransition ? "" : "transition-all duration-300 ease-out"} border-l border-white/10 shadow-2xl flex flex-col
            ${isSidebarHovered ? "w-80 bg-slate-900/70 backdrop-blur-xl" : "w-14 bg-white/50 backdrop-blur-sm hover:bg-white/60 cursor-pointer"}
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

            <div
              ref={sidebarScrollRef}
              className="flex-1 overflow-y-auto p-4 custom-scrollbar"
              style={{ paddingBottom: '400px' }}
            >
              {isSidebarHovered ? (
                <div className="grid grid-cols-5 gap-2 animate-in fade-in duration-500">
                  {allQuestions.map((q) => {
                    const qKey = q.id;
                    const isAnswered = !!userProgress[qKey]?.userAnswer;
                    const isFlagged = !!userProgress[qKey]?.isFlagged;
                    const isActive = q.questionNo === activeQuestionNo;
                    const isActiveGroup = activeQuestionNo !== null && q.groupId === allQuestions.find(aq => aq.questionNo === activeQuestionNo)?.groupId;
                    const userAnswer = userProgress[qKey]?.userAnswer;
                    const isCorrect = userAnswer && String(userAnswer).trim().toUpperCase() === String(q.correctAnswer || "").trim().toUpperCase();

                    return (
                      <button
                        key={q.questionNo}
                        ref={(el) => {
                          if (el) questionRefs.current.set(q.questionNo, el);
                          else questionRefs.current.delete(q.questionNo);
                        }}
                        onClick={() => {
                          if (activePart !== q.part) setActivePart(q.part);
                          setActiveQuestionNo(q.questionNo);
                          setJumpTo({ id: String(q.questionNo), ts: Date.now() });
                        }}
                        className={`
                        aspect-square rounded-xl text-[13px] font-black transition-all flex items-center justify-center relative
                        ${isActive
                            ? isSubmitted
                              ? isCorrect
                                ? "bg-emerald-600 text-white scale-110 z-20 shadow-lg ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900"
                                : "bg-rose-600 text-white scale-110 z-20 shadow-lg ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-900"
                              : "bg-blue-600 text-white scale-110 z-20 shadow-lg ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                            : isActiveGroup
                              ? isSubmitted
                                ? isCorrect
                                  ? "bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50 z-10 scale-105"
                                  : "bg-rose-500/20 text-rose-300 border-2 border-rose-500/50 z-10 scale-105"
                                : "bg-blue-500/20 text-blue-300 border-2 border-blue-500/50 z-10 scale-105"
                              : isSubmitted
                                ? isAnswered
                                  ? isCorrect
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                                    : "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                                  : "bg-rose-950/40 text-rose-400 border border-dashed border-rose-500/30"
                                : isAnswered
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10"
                          }
                      `}
                      >
                        {q.questionNo}
                        {isFlagged && (
                          <div className={`absolute -top-1.5 -right-1.5 p-0.5 rounded-full border border-white shadow-sm flex items-center justify-center animate-in zoom-in duration-300 ${
                            userProgress[qKey]?.flagColor === 'PURPLE' ? 'bg-purple-500' :
                            userProgress[qKey]?.flagColor === 'BLUE' ? 'bg-blue-500' :
                            userProgress[qKey]?.flagColor === 'YELLOW' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            <Flag size={8} className="text-white fill-current" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2 opacity-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                </div>
              )}
            </div>

            <div className={`p-4 border-t border-white/10 shrink-0 flex flex-col items-center justify-center gap-3 ${isSidebarHovered ? '' : 'h-32'}`}>
              {isSidebarHovered ? (
                <div className="w-full animate-in fade-in duration-300">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    <span>Tiến độ</span>
                    <span className="text-white/80">{stats.answered}/{stats.total}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(stats.answered / stats.total) * 100}%` }}></div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-wider"
                  >
                    <Send size={16} />
                    Nộp bài ngay
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center justify-center font-black text-[10px] text-blue-600 bg-blue-50 w-10 h-10 rounded-full border border-blue-100 shadow-inner">
                    {Math.round((stats.answered / stats.total) * 100)}%
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    title="Nộp bài"
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {showResults && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 p-8 text-center text-white relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-80 h-80 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-80 h-80 bg-white rounded-full blur-3xl"></div>
              </div>
              <div className="inline-flex p-4 bg-white/20 rounded-2xl backdrop-blur-xl mb-4 ring-4 ring-white/10">
                <Trophy size={32} className="text-yellow-300 drop-shadow-lg" />
              </div>
              <h2 className="text-3xl font-black mb-1 tracking-tight">Kết quả thi TOEIC</h2>
              <div className="mt-8 flex justify-center items-end gap-12">
                <div className="flex flex-col items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-black text-white drop-shadow-md">{stats.totalScore}</span>
                    <span className="text-xl font-bold text-white/50">/990</span>
                  </div>
                  <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.3em] mt-2 ml-2">Tổng điểm</span>
                </div>
                <div className="h-16 w-px bg-white/20 mb-2"></div>
                <div className="flex gap-10 mb-1">
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-black text-white">{stats.lcScore}</span>
                      <span className="text-sm font-bold text-white/40">/495</span>
                    </div>
                    <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">Nghe</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-black text-white">{stats.rcScore}</span>
                      <span className="text-sm font-bold text-white/40">/495</span>
                    </div>
                    <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">Đọc</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center">
                  <div className="text-emerald-600 font-black text-2xl">
                    {Object.values(stats.parts).reduce((sum: number, p: any) => sum + p.correct, 0)}
                  </div>
                  <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Câu đúng</div>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col items-center justify-center">
                  <div className="text-red-600 font-black text-2xl">
                    {Object.values(stats.parts).reduce((sum: number, p: any) => sum + p.incorrect, 0)}
                  </div>
                  <div className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">Câu sai</div>
                </div>
                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                  <div className="text-slate-600 font-black text-2xl">
                    {Object.values(stats.parts).reduce((sum: number, p: any) => sum + p.unanswered, 0)}
                  </div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Chưa làm</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex flex-col items-center justify-center">
                  <div className="text-amber-600 font-black text-2xl">{Object.values(userProgress).filter((p: any) => p.isFlagged).length}</div>
                  <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">Gắn cờ</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                  <div className="text-slate-600 font-black text-2xl">{formatTime(stats.timeSpent)}</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Thời gian</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map(p => {
                  const s = stats.parts[p];
                  const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                  return (
                    <div key={p} className="p-5 rounded-2xl border border-slate-100 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1 inline-block">Part {p}</span>
                          <h4 className="font-bold text-slate-800">Phần {p}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-700">{s.correct}/{s.total}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{accuracy}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${accuracy > 70 ? 'bg-emerald-500' : accuracy > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${accuracy}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button onClick={() => setShowResults(false)} className="flex-1 py-4 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95">👁️ Xem đáp án</button>
                <button onClick={() => { setUserProgress({}); setIsSubmitted(false); setShowResults(false); setTimeLeft(7200); setActivePart(1); }} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95"><RotateCcw size={18} /> Làm lại</button>
                {nextLessonId && courseId && (
                  <Link href={`/learn/${courseId}/lesson/${nextLessonId}`} className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95">Tiếp theo <ChevronRight size={18} /></Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video player quản lý ở level full test để không bị mất khi chuyển part */}
      {showVideo && videoExplanation && (Array.isArray(videoExplanation) ? videoExplanation.some((v: any) => v.videoUrl) : !!videoExplanation.videoUrl) && (
        <FloatingVideoExplanationPlayer
          videoExplanation={videoExplanation}
          onClose={() => setShowVideo(false)}
          onQuestionSync={handleVideoQuestionSync}
          currentIndex={activeQuestionNo ? activeQuestionNo - 1 : 0}
        />
      )}

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

      {/* ── Setup Modal ── */}
      {showTeachSetup && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
              <h3 className="text-xl font-black">Thiết lập phiên Giảng bài</h3>
              <p className="text-xs text-white/80 mt-1">Đồng hồ tự động sẽ bắt đầu chạy để anh dễ dàng ghi mốc câu.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tiêu đề video bài giảng</label>
                <input
                  type="text"
                  value={teachingTitle}
                  onChange={e => setTeachingTitle(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  placeholder="Ví dụ: Chữa Part 5 đề ETS 2024"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Loại nguồn</label>
                  <select
                    value={teachingVideoType}
                    onChange={e => setTeachingVideoType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-850 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="direct">Chưa xác định / Khác</option>
                    <option value="youtube">YOUTUBE</option>
                    <option value="google-drive">Google Drive</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Đường dẫn Video giải thích (Link)</label>
                  <input
                    type="text"
                    value={teachingVideoUrl}
                    onChange={e => setTeachingVideoUrl(e.target.value)}
                    onKeyDown={e => e.stopPropagation()}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                    placeholder="Dán link video tại đây (nếu có)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Câu bắt đầu</label>
                  <input
                    type="number"
                    value={teachingStartNo}
                    onChange={e => setTeachingStartNo(parseInt(e.target.value) || 1)}
                    onKeyDown={e => e.stopPropagation()}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phương thức lưu</label>
                  <select
                    value={teachingSaveType}
                    onChange={e => setTeachingSaveType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="new">Tạo Video mới</option>
                    {Array.isArray(videoExplanation) && videoExplanation.length > 0 && (
                      <option value="overwrite">Ghi đè Video sẵn có</option>
                    )}
                  </select>
                </div>
              </div>

              {teachingSaveType === "overwrite" && Array.isArray(videoExplanation) && videoExplanation.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Chọn video ghi đè</label>
                  <select
                    value={teachingOverwriteIndex}
                    onChange={e => setTeachingOverwriteIndex(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {videoExplanation.map((v: any, i: number) => (
                      <option key={i} value={i}>{v.title || `Video ${i + 1}`}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowTeachSetup(false)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-100 transition-all uppercase tracking-wider"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleStartTeaching}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs rounded-xl hover:opacity-90 transition-all uppercase tracking-wider shadow-md shadow-amber-500/20"
              >
                Bắt đầu giảng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Finish/Review Modal ── */}
      {showTeachFinish && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white shrink-0">
              <h3 className="text-xl font-black">Xác nhận Lưu mốc Bài giảng</h3>
              <p className="text-xs text-white/80 mt-1">Rà soát lại mốc và nhãn tự động trước khi ghi nhận lên Database.</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 scrollbar-thin">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold text-slate-600 space-y-1">
                <div>Tiêu đề: <span className="text-slate-800 font-black">{teachingTitle}</span></div>
                <div>Loại nguồn: <span className="text-slate-800 font-black uppercase">{teachingVideoType === "direct" ? "CHƯA XÁC ĐỊNH / KHÁC" : teachingVideoType}</span></div>
                <div className="truncate">Link: <span className="text-slate-800 font-black">{teachingVideoUrl || "(Trống, sẽ dán sau ở Editor)"}</span></div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách mốc ({recTimestamps.length})</span>
                  <button 
                    onClick={() => {
                      if (window.confirm("Bạn có muốn xoá tất cả các mốc vừa ghi?")) setRecTimestamps([]);
                    }}
                    className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-wider"
                  >
                    Xoá tất cả
                  </button>
                </div>

                <div className="border border-slate-200/60 rounded-2xl overflow-hidden bg-white max-h-[300px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Mốc</th>
                        <th className="p-3">Nhãn hiển thị</th>
                        <th className="p-3">targetIndex</th>
                        <th className="p-3 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {recTimestamps.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-bold italic">
                            Chưa ghi nhận mốc nào. Nhấn các phím tắt/Space để ghi mốc!
                          </td>
                        </tr>
                      ) : (
                        recTimestamps.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-blue-600">
                              <input 
                                type="text"
                                defaultValue={formatRec(t.time)}
                                onBlur={e => {
                                  const parts = e.target.value.split(':');
                                  if (parts.length === 2) {
                                    const m = parseInt(parts[0]) || 0;
                                    const s = parseInt(parts[1]) || 0;
                                    const newTime = m * 60 + s;
                                    setRecTimestamps(ts => {
                                      const next = [...ts];
                                      next[idx] = { ...next[idx], time: newTime };
                                      return next;
                                    });
                                  }
                                }}
                                onKeyDown={e => e.stopPropagation()}
                                className="w-16 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-center font-mono font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="text"
                                value={t.label}
                                onChange={e => {
                                  const val = e.target.value;
                                  setRecTimestamps(ts => {
                                    const next = [...ts];
                                    next[idx] = { ...next[idx], label: val };
                                    return next;
                                  });
                                }}
                                onKeyDown={e => e.stopPropagation()}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3 font-mono text-slate-400">{t.targetIndex}</td>
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => setRecTimestamps(ts => ts.filter((_, i) => i !== idx))}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 flex gap-3">
              <button
                onClick={() => setShowTeachFinish(false)}
                className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-100 transition-all uppercase tracking-wider"
              >
                Quay lại
              </button>
              <button
                onClick={handleFinishTeaching}
                disabled={isSavingRec}
                className="flex-1 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-wider shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
              >
                {isSavingRec ? "Đang lưu..." : "Xác nhận & Lưu dữ liệu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
