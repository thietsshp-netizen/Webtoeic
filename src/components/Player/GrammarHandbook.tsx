"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { X, Maximize2, Minimize2, BookOpen, Loader2, Columns2, Rows2, ZoomIn, ZoomOut, Lock, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import wordFamiliesData from "@/data/word_families.json";

const audioCache = new Map<string, string>();

interface SubQuestion {
  q: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  explanationTranslation?: string;
}

interface Question {
  id: string;
  questionText?: string;
  tenseName?: string;
  options?: Record<string, string>;
  correctAnswer?: string;
  explanation?: string;
  explanationTranslation?: string;
  subQuestions?: SubQuestion[];
  sentenceTranslation?: string;
}

interface PracticePart {
  partNumber: number;
  title: string;
  type: string;
  instruction: string;
  questions: Question[];
}

interface Lesson {
  id: number;
  title: string;
  htmlContent: string;
  filename: string;
  practice?: {
    parts: PracticePart[];
  };
}

export default function GrammarHandbook() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const [isOpen, setIsOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessErrorType, setAccessErrorType] = useState<"UNAUTHORIZED" | "EXPIRED" | "FORBIDDEN" | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [splitMode, setSplitMode] = useState<"none" | "vertical" | "horizontal">("none");
  const [zoom1, setZoom1] = useState(100);
  const [zoom2, setZoom2] = useState(100);
  const [pane1Tab, setPane1Tab] = useState<"theory" | "practice">("theory");
  const [pane2Tab, setPane2Tab] = useState<"theory" | "practice">("practice");
  const [selectedPartIdx, setSelectedPartIdx] = useState<Record<number, number>>({});
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  // States cho Word Family Popover (Đám mây)
  const [activeWordFamily, setActiveWordFamily] = useState<any[]>([]);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // States cho Draggable và Resizable - Đặt kích thước mặc định rộng hơn (1000px) để hiển thị grid cực kỳ đẹp mắt
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(650);
  const [position, setPosition] = useState({ x: 100, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'r' | 'b' | 'br'

  // States cho thước phân chia Split View
  const [splitRatio, setSplitRatio] = useState(50); // tỷ lệ phần trăm (0 - 100)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Lưu trạng thái trước khi Maximize
  const preMaximizeState = useRef({ width: 1000, height: 650, x: 100, y: 80 });

  const dragStart = useRef({ x: 0, y: 0 });
  const positionStart = useRef({ x: 0, y: 0 });
  const sizeStart = useRef({ w: 0, h: 0 });

  // Lắng nghe sự kiện toggle mở/đóng từ Sidebar
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };
    window.addEventListener("toggle-grammar-handbook", handleToggle);
    return () => window.removeEventListener("toggle-grammar-handbook", handleToggle);
  }, []);

  // Gọi API tải dữ liệu 10 bài ngữ pháp khi mở lần đầu
  useEffect(() => {
    if (!isOpen || (lessons.length > 0 && hasAccess)) return;

    async function fetchGrammar() {
      try {
        setLoading(true);
        const res = await fetch(`/api/grammar?courseId=${courseId || ""}&t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        
        if (res.status === 401) {
          setHasAccess(false);
          setAccessErrorType("UNAUTHORIZED");
        } else if (res.status === 403) {
          setHasAccess(false);
          setAccessErrorType(data.error === "EXPIRED" ? "EXPIRED" : "FORBIDDEN");
        } else if (data.success) {
          setLessons(data.lessons);
          if (data.lessons.length > 0) {
            setActiveLesson(data.lessons[0]);
          }
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu sổ tay ngữ pháp:", err);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }
    fetchGrammar();
  }, [isOpen, lessons.length, courseId, hasAccess]);

  // Khởi tạo vị trí tối ưu trên màn hình Client
  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialWidth = Math.min(1050, window.innerWidth - 60);
    const initialHeight = Math.min(window.innerHeight * 0.8, 700);

    // Đặt mặc định căn giữa/phải màn hình
    const initialX = Math.max(20, window.innerWidth - initialWidth - 30);
    const initialY = 85;

    setWidth(initialWidth);
    setHeight(initialHeight);
    setPosition({ x: initialX, y: initialY });
    preMaximizeState.current = { width: initialWidth, height: initialHeight, x: initialX, y: initialY };
  }, []);

  // Xử lý kéo thả cửa sổ nổi
  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    if (e.button !== 0) return; // Chỉ kéo bằng chuột trái

    const target = e.target as HTMLElement;
    // Không kéo khi bấm vào nút điều khiển hoặc khu vực chọn bài học
    if (target.closest("button") || target.closest(".lesson-tabs-container")) return;

    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    positionStart.current = { x: position.x, y: position.y };
    e.preventDefault();
  };

  // Xử lý co giãn kích thước cửa sổ nổi
  const handleResizeStart = (direction: string, e: React.MouseEvent) => {
    if (isMaximized) return;
    if (e.button !== 0) return;

    setIsResizing(direction);
    dragStart.current = { x: e.clientX, y: e.clientY };
    sizeStart.current = { w: width, h: height };
    positionStart.current = { x: position.x, y: position.y };

    e.preventDefault();
    e.stopPropagation();
  };

  // Điều khiển phóng to / Thu nhỏ lại
  const toggleMaximize = () => {
    if (isMaximized) {
      // Khôi phục trạng thái cũ
      const state = preMaximizeState.current;
      setWidth(state.width);
      setHeight(state.height);
      setPosition({ x: state.x, y: state.y });
      setIsMaximized(false);
    } else {
      // Lưu lại trạng thái trước khi phóng to
      preMaximizeState.current = { width, height, x: position.x, y: position.y };
      setWidth(window.innerWidth);
      setHeight(window.innerHeight - 56); // Trừ đi header học tập
      setPosition({ x: 0, y: 56 });
      setIsMaximized(true);
    }
  };

  // Nhấp đúp vào header để phóng to / thu nhỏ nhanh
  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".lesson-tabs-container")) return;
    toggleMaximize();
  };

  const handleSplitDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  const handleSplitTouchStart = (e: React.TouchEvent) => {
    setIsDraggingSplit(true);
  };

  // Lắng nghe chuột/touch toàn màn hình khi kéo thả hoặc co giãn
  useEffect(() => {
    const updateSplitRatio = (clientX: number, clientY: number) => {
      if (splitContainerRef.current) {
        const rect = splitContainerRef.current.getBoundingClientRect();
        if (splitMode === "vertical") {
          const ratio = ((clientX - rect.left) / rect.width) * 100;
          setSplitRatio(Math.max(0, Math.min(100, ratio)));
        } else if (splitMode === "horizontal") {
          const ratio = ((clientY - rect.top) / rect.height) * 100;
          setSplitRatio(Math.max(0, Math.min(100, ratio)));
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSplit) {
        updateSplitRatio(e.clientX, e.clientY);
      }

      if (isDragging) {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;

        const nextX = Math.max(0, Math.min(window.innerWidth - width, positionStart.current.x + deltaX));
        const nextY = Math.max(56, Math.min(window.innerHeight - 100, positionStart.current.y + deltaY));

        setPosition({ x: nextX, y: nextY });
      }

      if (isResizing) {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;

        if (isResizing === "r" || isResizing === "br") {
          const nextW = Math.max(400, Math.min(window.innerWidth - position.x, sizeStart.current.w + deltaX));
          setWidth(nextW);
        }

        if (isResizing === "b" || isResizing === "br") {
          const nextH = Math.max(300, Math.min(window.innerHeight - position.y, sizeStart.current.h + deltaY));
          setHeight(nextH);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSplit && e.touches[0]) {
        updateSplitRatio(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      setIsDraggingSplit(false);
    };

    if (isDragging || isResizing || isDraggingSplit) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, isResizing, isDraggingSplit, splitMode, position.x, position.y, width, height]);

  // Rút gọn title để hiển thị trên tab: giữ "Bài X" + tên chủ đề chính

  const handleSelectOption = (lessonId: number, partIdx: number, questionId: string, option: string) => {
    const key = `${lessonId}-${partIdx}-${questionId}`;
    if (userAnswers[key]) return; // Answered already, block choosing again
    setUserAnswers(prev => ({ ...prev, [key]: option }));
  };
  const renderPractice = (lesson: Lesson, zoomValue: number, showSelector: boolean = true) => {
    if (!lesson.practice || !lesson.practice.parts || lesson.practice.parts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
          <BookOpen size={40} className="text-slate-200 mb-2 animate-pulse" />
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Bài tập đang được cập nhật</p>
          <p className="text-[10px] text-slate-400 mt-1">Bài tập luyện tập của chủ đề này sẽ sớm xuất hiện.</p>
        </div>
      );
    }

    const currentPartIdx = selectedPartIdx[lesson.id] || 0;
    const currentPart = lesson.practice.parts[currentPartIdx];

    if (!currentPart) return null;

    return (
      <div className="w-full flex flex-col gap-4 select-text" style={{ zoom: zoomValue / 100 }}>
        {showSelector && (
          <div className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-20 pt-4 pb-2 -mx-6 px-6 border-b border-slate-200/60 select-none flex flex-wrap gap-1.5">
            {lesson.practice.parts.map((part, idx) => {
              const isActive = currentPartIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedPartIdx(prev => ({ ...prev, [lesson.id]: idx }))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {part.title.replace("Bài tập", "BT")}
                </button>
              );
            })}
          </div>
        )}
        {currentPart.instruction && (
          <p className="text-[13px] font-bold text-slate-500 italic bg-indigo-50/30 px-3.5 py-3 rounded-xl border border-indigo-50/50">
            👉 {currentPart.instruction}
          </p>
        )}

        {/* Danh sách câu hỏi */}
        <div className="flex flex-col gap-4">
          {currentPart.questions.map((q, qIdx) => {
            const answerKey = `${lesson.id}-${currentPartIdx}-${q.id}`;
            const chosenAnswer = userAnswers[answerKey];
            const isCorrect = chosenAnswer === q.correctAnswer;

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:border-slate-200/80 transition-all flex flex-col gap-3.5"
              >
                {/* Tiêu đề câu hỏi chính */}
                <h4 className="text-[15px] font-black text-slate-800 leading-snug">
                  {formatQuestionText(q.questionText || q.tenseName)}
                </h4>

                {/* THỨ NHẤT: Nếu câu hỏi chứa các câu hỏi con nested (subQuestions) */}
                {q.subQuestions && q.subQuestions.length > 0 && (
                  <div className="flex flex-col gap-5 mt-2 pl-3 border-l-2 border-indigo-500/30">
                    {q.subQuestions.map((subQ, subIdx) => {
                      const subAnswerKey = `${lesson.id}-${currentPartIdx}-${q.id}-${subIdx}`;
                      const subChosenAnswer = userAnswers[subAnswerKey];
                      const isSubCorrect = subChosenAnswer === subQ.correctAnswer;

                      return (
                        <div key={subIdx} className="flex flex-col gap-3 pt-4 border-t border-slate-100 first:border-t-0 first:pt-0">
                          <p className="text-[13px] font-black text-indigo-900 flex items-start gap-1.5 leading-relaxed bg-indigo-50/30 py-2 px-3 rounded-lg border border-indigo-50/50">
                            <span className="text-indigo-600 font-extrabold shrink-0">Câu {subIdx + 1}:</span>
                            <span>{formatQuestionText(subQ.q)}</span>
                          </p>

                          {subQ.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-text">
                              {Object.entries(subQ.options).map(([optKey, optVal]) => {
                                const isSelected = subChosenAnswer === optKey;
                                const isCorrectOption = subQ.correctAnswer === optKey;

                                let optionStyle = "border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600";
                                let badgeStyle = "bg-slate-100 text-slate-500";

                                if (subChosenAnswer) {
                                  if (isCorrectOption) {
                                    optionStyle = "bg-green-50 border-green-200 text-green-700 font-black";
                                    badgeStyle = "bg-green-600 text-white";
                                  } else if (isSelected) {
                                    optionStyle = "bg-red-50 border-red-200 text-red-700 font-black";
                                    badgeStyle = "bg-red-600 text-white";
                                  } else {
                                    optionStyle = "border-slate-100 text-slate-400 opacity-60";
                                    badgeStyle = "bg-slate-50 text-slate-300";
                                  }
                                }

                                const isSubAnswered = !!subChosenAnswer;
                                return (
                                  <div
                                    key={optKey}
                                    className={`border rounded-xl p-3.5 text-[13px] font-bold flex items-center gap-2.5 ${optionStyle}`}
                                  >
                                    <span
                                      onClick={() => !isSubAnswered && handleSelectOption(lesson.id, currentPartIdx, `${q.id}-${subIdx}`, optKey)}
                                      className={`w-5.5 h-5.5 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm transition-all select-none ${
                                        !isSubAnswered ? "cursor-pointer hover:scale-110 active:scale-90" : "cursor-default"
                                      } ${badgeStyle}`}
                                    >
                                      {optKey}
                                    </span>
                                    <span className="leading-snug select-text">{optVal}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {subChosenAnswer && (
                            <div className="p-4 rounded-xl border bg-amber-50/40 border-amber-100/50 text-[12.5px] text-amber-950 leading-relaxed shadow-sm flex flex-col gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 font-black text-amber-800 mb-1">
                                  <span>💡 ĐÁP ÁN ĐÚNG: {subQ.correctAnswer}</span>
                                  {isSubCorrect ? (
                                    <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">CHÍNH XÁC</span>
                                  ) : (
                                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">SAI MẤT RỒI</span>
                                  )}
                                </div>
                                <p className="font-semibold">{formatQuestionText(subQ.explanation)}</p>
                              </div>
                              {subQ.explanationTranslation && (
                                <div className="mt-1.5 pt-2 border-t border-amber-200/40 text-[12px] text-emerald-800 font-medium flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1 font-black text-emerald-700">
                                    <span>🌐 DỊCH NGHĨA GIẢI THÍCH:</span>
                                  </div>
                                  <p className="leading-relaxed">{formatQuestionText(subQ.explanationTranslation)}</p>
                                </div>
                              )}
                              {q.sentenceTranslation && hasEnglish(subQ.q) && (
                                <div className="mt-1.5 pt-2 border-t border-amber-200/40 text-[12px] text-amber-950/90 font-medium italic flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1 font-black not-italic text-amber-900">
                                    <span>🇻🇳 DỊCH NGHĨA CÂU:</span>
                                  </div>
                                  <p className="leading-relaxed not-italic">{formatQuestionText(q.sentenceTranslation)}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* THỨ HAI: Nếu câu hỏi thông thường dạng Multiple Choice và có options trực tiếp */}
                {!q.subQuestions && q.options && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-text">
                      {Object.entries(q.options).map(([optKey, optVal]) => {
                        const isSelected = chosenAnswer === optKey;
                        const isCorrectOption = q.correctAnswer === optKey;
                        const isAnswered = !!chosenAnswer;

                        let optionStyle = "border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600";
                        let badgeStyle = "bg-slate-100 text-slate-500";

                        if (chosenAnswer) {
                          if (isCorrectOption) {
                            optionStyle = "bg-green-50 border-green-200 text-green-700 font-black";
                            badgeStyle = "bg-green-600 text-white";
                          } else if (isSelected) {
                            optionStyle = "bg-red-50 border-red-200 text-red-700 font-black";
                            badgeStyle = "bg-red-600 text-white";
                          } else {
                            optionStyle = "border-slate-100 text-slate-400 opacity-60";
                            badgeStyle = "bg-slate-50 text-slate-300";
                          }
                        }

                        return (
                          <div
                            key={optKey}
                            className={`border rounded-xl p-4 text-[13px] font-bold flex items-center gap-3 ${optionStyle}`}
                          >
                            <span
                              onClick={() => !isAnswered && handleSelectOption(lesson.id, currentPartIdx, q.id, optKey)}
                              className={`w-5.5 h-5.5 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm transition-all select-none ${
                                !isAnswered ? "cursor-pointer hover:scale-110 active:scale-90" : "cursor-default"
                              } ${badgeStyle}`}
                            >
                              {optKey}
                            </span>
                            <span className="leading-snug select-text">{optVal}</span>
                          </div>
                        );
                      })}
                    </div>

                    {chosenAnswer && q.correctAnswer && (
                      <div className="p-4 rounded-xl border bg-amber-50/40 border-amber-100/50 text-[12.5px] text-amber-950 leading-relaxed shadow-sm flex flex-col gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 font-black text-amber-800 mb-1">
                            <span>💡 ĐÁP ÁN ĐÚNG: {q.correctAnswer}</span>
                            {isCorrect ? (
                              <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">CHÍNH XÁC</span>
                            ) : (
                              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">SAI MẤT RỒI</span>
                            )}
                          </div>
                          <p className="font-semibold">{formatQuestionText(q.explanation)}</p>
                        </div>
                        {q.explanationTranslation && (
                          <div className="mt-1.5 pt-2 border-t border-amber-200/40 text-[12px] text-emerald-800 font-medium flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 font-black text-emerald-700">
                              <span>🌐 DỊCH NGHĨA GIẢI THÍCH:</span>
                            </div>
                            <p className="leading-relaxed">{formatQuestionText(q.explanationTranslation)}</p>
                          </div>
                        )}
                        {q.sentenceTranslation && hasEnglish(q.questionText) && (
                          <div className="mt-1.5 pt-2 border-t border-amber-200/40 text-[12px] text-amber-950/90 font-medium italic flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 font-black not-italic text-amber-900">
                              <span>🇻🇳 DỊCH NGHĨA CÂU:</span>
                            </div>
                            <p className="leading-relaxed not-italic">{formatQuestionText(q.sentenceTranslation)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* THỨ BA: Nếu câu hỏi tự luận không có options nhưng có explanation/hướng dẫn giải */}
                {!q.subQuestions && !q.options && q.explanation && (
                  <div className="p-4.5 rounded-xl border bg-indigo-50/30 border-indigo-100/50 text-[13px] text-slate-700 leading-relaxed shadow-sm flex flex-col gap-2">
                    <div>
                      <div className="font-black text-indigo-800 mb-1.5 flex items-center gap-1">
                        <span>💡 HƯỚNG DẪN / ĐÁP ÁN:</span>
                      </div>
                      <p className="font-semibold whitespace-pre-wrap">{formatQuestionText(q.explanation)}</p>
                    </div>
                    {q.explanationTranslation && (
                      <div className="mt-1.5 pt-2 border-t border-indigo-100/40 text-[12.5px] text-emerald-700 font-medium flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 font-black text-emerald-700">
                          <span>🌐 DỊCH NGHĨA GIẢI THÍCH:</span>
                        </div>
                        <p className="leading-relaxed">{formatQuestionText(q.explanationTranslation)}</p>
                      </div>
                    )}
                    {q.sentenceTranslation && hasEnglish(q.questionText) && (
                      <div className="mt-1.5 pt-2 border-t border-indigo-100/40 text-[12.5px] text-slate-700 font-medium italic flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 font-black not-italic text-indigo-900">
                          <span>🇻🇳 DỊCH NGHĨA CÂU:</span>
                        </div>
                        <p className="leading-relaxed not-italic">{formatQuestionText(q.sentenceTranslation)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Khoảng trống 1/2 trang ở cuối */}
        <div className="h-[100vh] w-full shrink-0" />
      </div>
    );
  };

  // Kiểm tra xem text có chứa từ tiếng Anh không (ít nhất 2 chữ cái ASCII liên tiếp)
  const hasEnglish = (text?: string) => {
    if (!text) return false;
    return /[a-zA-Z]{2,}/.test(text);
  };

  const getShortTitle = (title: string) => {
    // Ví dụ: "Bài 4 - Mệnh đề quan hệ - Rút gọn MĐQH" → "Bài 4 – Mệnh đề quan hệ"
    // Thay thế dấu phân tách (- hoặc .) bằng " – ", lấy phần trước " – " thứ 2 nếu quá dài
    const normalized = title.trim();
    // Tách theo ký tự phân cách đầu tiên (- hoặc .)
    const sepMatch = normalized.match(/^(Bài\s*\d+)\s*[-–.]\s*(.+)$/i);
    if (!sepMatch) return normalized.slice(0, 30);
    const prefix = sepMatch[1]; // "Bài 4"
    const rest = sepMatch[2];   // "Mệnh đề quan hệ - Rút gọn MĐQH"
    // Nếu phần còn lại có nhiều đoạn, chỉ lấy đoạn đầu
    const mainPart = rest.split(/\s*[-–]\s*/)[0].trim();
    const label = `${prefix} – ${mainPart}`;
    // Cắt nếu vẫn quá dài
    return label.length > 40 ? label.slice(0, 38) + "…" : label;
  };

  const renderWordFamilyCloud = (text: string, children?: React.ReactNode, sentenceText?: string, elementKey?: string) => {
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

    const isRootEntry = (fam: any): boolean =>
      fam.type === 'root' || (typeof fam.originalValue === 'string' && fam.originalValue.trimStart().startsWith('Gốc:'));

    if (children) {
      const cleanText = text.trim();
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

      const matchedFamilies: any[] = [];
      if (bestWordFam) matchedFamilies.push({ ...bestWordFam, matchedWord: cleanText });
      if (bestRootFam) matchedFamilies.push({ ...bestRootFam, matchedWord: cleanText });

      if (matchedFamilies.length > 0) {
        const primaryFam = matchedFamilies[0];
        return (
          <span key={elementKey} className="relative inline-block group/cloud mx-0.5 select-text">
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
                setActiveWordFamily(matchedFamilies);
              }}
              className="absolute -top-[5px] -right-[6px] text-blue-400 hover:text-blue-600 transition-colors z-10 p-0 m-0 cursor-pointer animate-pulse"
              title={`Xem họ từ/gốc từ: ${primaryFam.key}`}
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
            className="absolute -top-[5px] -right-[6px] text-blue-400 hover:text-blue-600 transition-colors z-10 p-0 m-0 cursor-pointer animate-pulse"
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

  const formatQuestionText = (text?: string): React.ReactNode => {
    if (!text) return "";
    // Nếu text chứa thẻ HTML (ví dụ: <span class="rc">) → render bằng dangerouslySetInnerHTML
    if (/<[a-z][^>]*>/i.test(text)) {
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }

    let protectedText = text
      .replace(/([a-zA-Z])'([a-zA-Z])/g, "$1APOSTROPHETEMP$2");

    // Regex tìm chỗ trống (2+ gạch), phần text tô đỏ _text_, phần động từ kẹp trong dấu () hoặc phần [] để xuống dòng tô đỏ
    const regex = /(__+|--+)|_([^_]+)_|\(([^)]+)\)|\[([^\]]+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    const parseQuotes = (str: string, baseKey: string) => {
      const quoteRegex = /(['"“‘][^'"“”‘’]+?['"“”’])/g;
      const quoteParts = str.split(quoteRegex);
      if (quoteParts.length === 1) {
        return renderWordFamilyCloud(str.replace(/APOSTROPHETEMP/g, "'"));
      }
      return quoteParts.map((subPart, subIdx) => {
        const isQuoted = /^['"“‘].+?['"“”’]$/.test(subPart);
        const restoredPart = subPart.replace(/APOSTROPHETEMP/g, "'");
        if (isQuoted) {
          const node = (
            <strong key={`${baseKey}-${subIdx}`} className="text-indigo-600 font-extrabold mx-0.5">
              {restoredPart}
            </strong>
          );
          return renderWordFamilyCloud(restoredPart, node, undefined, `${baseKey}-${subIdx}`);
        }
        return <Fragment key={`${baseKey}-${subIdx}`}>{renderWordFamilyCloud(restoredPart)}</Fragment>;
      });
    };

    let idx = 0;
    while ((match = regex.exec(protectedText)) !== null) {
      if (match.index > lastIndex) {
        const plainText = protectedText.substring(lastIndex, match.index);
        parts.push(<span key={`text-${idx}`}>{parseQuotes(plainText, `text-${idx}`)}</span>);
        idx++;
      }

      const [fullMatch, blankMatch, redTextMatch, parenthesisMatch, bracketMatch] = match;

      if (blankMatch) {
        // Để nguyên gạch dưới hoặc gạch ngang liên tiếp của câu gốc, chỉ tô đỏ
        parts.push(
          <span key={`blank-${idx}`} className="text-red-500 font-black tracking-wider mx-0.5">
            {blankMatch}
          </span>
        );
      } else if (redTextMatch) {
        const restoredRed = redTextMatch.replace(/APOSTROPHETEMP/g, "'");
        const node = (
          <span key={`red-${idx}`} className="text-red-500 italic font-black mx-0.5">
            {restoredRed}
          </span>
        );
        parts.push(renderWordFamilyCloud(restoredRed, node, undefined, `red-${idx}`));
      } else if (parenthesisMatch) {
        const restoredParenthesis = parenthesisMatch.replace(/APOSTROPHETEMP/g, "'");
        const node = (
          <span key={`blue-${idx}`} className="text-blue-600 font-black mx-0.5">
            ({restoredParenthesis})
          </span>
        );
        parts.push(renderWordFamilyCloud(restoredParenthesis, node, undefined, `blue-${idx}`));
      } else if (bracketMatch) {
        const restoredBracket = bracketMatch.replace(/APOSTROPHETEMP/g, "'");
        const node = (
          <span key={`bracket-${idx}`} className="block text-red-500 font-bold text-[12.5px] mt-1 font-mono">
            [{restoredBracket}]
          </span>
        );
        parts.push(renderWordFamilyCloud(restoredBracket, node, undefined, `bracket-${idx}`));
      }
      idx++;
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < protectedText.length) {
      const plainText = protectedText.substring(lastIndex);
      parts.push(<span key={`text-${idx}`}>{parseQuotes(plainText, `text-${idx}`)}</span>);
    }

    return <>{parts}</>;
  };

  const renderPane = (
    paneId: 1 | 2,
    tab: "theory" | "practice",
    setTab: (t: "theory" | "practice") => void,
    zoomValue: number,
    setZoomValue: React.Dispatch<React.SetStateAction<number>>
  ) => {
    if (!activeLesson) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <BookOpen size={48} className="text-slate-200 mb-3" />
          <p className="text-sm font-semibold">Vui lòng chọn bài học từ thanh cuộn phía trên.</p>
        </div>
      );
    }

    return (
      <div className="flex-1 relative flex flex-col overflow-hidden w-full h-full">
        {/* Header bar cho từng Pane */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50/30 shrink-0 select-none gap-2">
          {/* Left: Lý thuyết / Bài tập toggle */}
          <div className="flex p-0.5 bg-slate-100/80 rounded-lg border border-slate-200/30 gap-0.5 min-w-[140px] shrink-0">
            <button
              onClick={() => setTab("theory")}
              className={`flex-1 py-0.5 rounded-md text-[10px] font-black transition-all ${
                tab === "theory"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Lý thuyết
            </button>
            <button
              onClick={() => setTab("practice")}
              className={`flex-1 py-0.5 rounded-md text-[10px] font-black transition-all ${
                tab === "practice"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Bài tập
            </button>
          </div>

          {/* Middle: BT Selector tabs - only shown when in practice tab and has parts */}
          {tab === "practice" && activeLesson.practice?.parts && activeLesson.practice.parts.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center justify-end overflow-hidden">
              {activeLesson.practice.parts.map((part, idx) => {
                const currentPartIdx = selectedPartIdx[activeLesson.id] || 0;
                const isActive = currentPartIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedPartIdx(prev => ({ ...prev, [activeLesson.id]: idx }))}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all active:scale-95 shrink-0 ${
                      isActive
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {part.title.replace("Bài tập", "BT")}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Zoom Control ở góc trên bên phải trong mỗi Pane */}
        <div className="absolute top-12 right-4 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-1.5 py-0.5 rounded-lg shadow-md select-none">
          <button
            onClick={() => setZoomValue(prev => Math.max(70, prev - 10))}
            className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
            title="Thu nhỏ chữ"
          >
            <ZoomOut size={12} />
          </button>
          <span className="text-[9px] font-black text-slate-200 min-w-[24px] text-center">
            {zoomValue}%
          </span>
          <button
            onClick={() => setZoomValue(prev => Math.min(150, prev + 10))}
            className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
            title="Phóng to chữ"
          >
            <ZoomIn size={12} />
          </button>
        </div>

        {/* Content area */}
        <div className={`flex-1 overflow-y-auto p-6 custom-vertical-scrollbar w-full webtoeic-scroll-container ${tab === 'practice' ? 'bg-slate-50/50' : ''}`}>
          {tab === "theory" ? (
            <>
              <div
                className="grammar-handbook-content select-text text-slate-700 w-full"
                style={{ zoom: zoomValue / 100 }}
                dangerouslySetInnerHTML={{ __html: activeLesson.htmlContent }}
              />
              {/* Khoảng trống 1/2 trang ở cuối */}
              <div className="h-[100vh] w-full shrink-0" />
            </>
          ) : (
            renderPractice(activeLesson, zoomValue, false)
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
          key="grammar-handbook-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          style={{
            position: "fixed",
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${width}px`,
            height: `${height}px`,
            zIndex: 9999,
          }}
          className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-3xl shadow-[0_20px_60px_rgba(79,70,229,0.18)] flex flex-col overflow-hidden select-none"
        >
          {/* DRAGGABLE HEADER ZONE */}
          <div
            onMouseDown={handleDragStart}
            onDoubleClick={handleHeaderDoubleClick}
            className={`px-4 py-1.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 shrink-0 select-none ${isMaximized ? "cursor-default" : "cursor-move"
              }`}
          >
            {/* Cột trái: Tiêu đề */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <BookOpen size={11} />
              </div>
              <h2 className="text-[10.5px] font-black text-indigo-600 uppercase tracking-[0.08em] whitespace-nowrap">
                Sổ tay Ngữ pháp
              </h2>
            </div>

            {/* Cột giữa: Danh sách bài học cuộn ngang ngang hàng */}
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-1 overflow-x-auto py-0.5 custom-horizontal-scrollbar scroll-smooth">
                {loading ? (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[9px]">
                    <Loader2 size={9} className="animate-spin" />
                    <span>Đang tải...</span>
                  </div>
                ) : !hasAccess ? (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold italic uppercase tracking-wider">
                    <Lock size={9} />
                    <span>Nội dung đang khóa</span>
                  </div>
                ) : (
                  lessons.map(lesson => {
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 transition-all active:scale-95 border ${isActive
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm font-black"
                          : "bg-white border-slate-150 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          }`}
                        title={lesson.title}
                      >
                        {getShortTitle(lesson.title)}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cột phải: Các nút góc cửa sổ */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Nút chia dọc */}
              <button
                onClick={() => setSplitMode(prev => prev === "vertical" ? "none" : "vertical")}
                className={`p-0.5 rounded transition-all active:scale-90 ${splitMode === "vertical"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                title={splitMode === "vertical" ? "Đóng chia dọc" : "Chia dọc màn hình (Split Vertical)"}
              >
                <Columns2 size={12} />
              </button>
              {/* Nút chia ngang */}
              <button
                onClick={() => setSplitMode(prev => prev === "horizontal" ? "none" : "horizontal")}
                className={`p-0.5 rounded transition-all active:scale-90 ${splitMode === "horizontal"
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                title={splitMode === "horizontal" ? "Đóng chia ngang" : "Chia ngang màn hình (Split Horizontal)"}
              >
                <Rows2 size={12} />
              </button>
              <button
                onClick={toggleMaximize}
                className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all active:scale-90"
                title={isMaximized ? "Thu nhỏ kích thước" : "Phóng to toàn màn hình"}
              >
                {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all active:scale-90"
                title="Đóng sổ tay"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* DUNG LƯỢNG NỘI DUNG LÝ THUYẾT NGUYÊN BẢN HTML */}
          <div className="flex-1 flex overflow-hidden bg-white select-text">
            {!hasAccess ? (
              /* --- PREMIUM LOCK UI --- */
              <div className="flex-1 flex items-center justify-center p-8 bg-white select-none">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-12 shadow-md">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-wide">NỘI DUNG ĐANG KHÓA</h3>
                  <p className="text-slate-500 text-xs font-semibold mb-6 leading-relaxed px-4">
                    {accessErrorType === "EXPIRED"
                      ? "Tài khoản của bạn đã hết hạn sử dụng. Vui lòng liên hệ Admin để đăng ký khóa học chính thức và tiếp tục học tập!"
                      : accessErrorType === "FORBIDDEN"
                      ? "Tài khoản của bạn chưa được cấp quyền truy cập. Vui lòng liên hệ Admin để được hỗ trợ mở khóa!"
                      : "Bạn cần đăng nhập và tham gia khóa học này để xem các nội dung chi tiết."}
                  </p>
                  <div className="flex flex-col gap-2.5 items-center">
                    {accessErrorType === "UNAUTHORIZED" ? (
                      <Link 
                        href="/?tab=dashboard" 
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
                      >
                        ĐĂNG NHẬP NGAY
                      </Link>
                    ) : (
                      <a
                        href="https://m.me/101690955494114"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-green-600/20 active:scale-95 block text-center"
                      >
                        LIÊN HỆ MỞ KHÓA
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : splitMode === "vertical" ? (
              <div ref={splitContainerRef} className="flex-1 flex overflow-hidden bg-white select-text w-full relative">
                {/* Cột trái */}
                <div 
                  className="relative flex flex-col overflow-hidden"
                  style={{ width: `${splitRatio}%`, flexShrink: 0, flexGrow: 0 }}
                >
                  {renderPane(1, pane1Tab, setPane1Tab, zoom1, setZoom1)}
                </div>

                {/* Thước kẻ phân chia dọc */}
                <div className="w-1.5 bg-slate-200 relative overflow-visible shrink-0 z-30">
                  <div
                    onMouseDown={handleSplitDragStart}
                    onTouchStart={handleSplitTouchStart}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-600 border border-indigo-500 shadow-md text-white flex items-center justify-center cursor-col-resize active:scale-110 active:bg-indigo-700 transition-all select-none z-40"
                  >
                    <span className="text-[10px] font-black select-none">&lt;&gt;</span>
                  </div>
                </div>

                {/* Cột phải */}
                <div className="relative flex flex-col overflow-hidden flex-1">
                  {renderPane(2, pane2Tab, setPane2Tab, zoom2, setZoom2)}
                </div>
              </div>
            ) : splitMode === "horizontal" ? (
              <div ref={splitContainerRef} className="flex-1 flex flex-col overflow-hidden bg-white select-text w-full relative">
                {/* Phần trên */}
                <div 
                  className="relative flex flex-col overflow-hidden w-full"
                  style={{ height: `${splitRatio}%`, flexShrink: 0, flexGrow: 0 }}
                >
                  {renderPane(1, pane1Tab, setPane1Tab, zoom1, setZoom1)}
                </div>

                {/* Thước kẻ phân chia ngang */}
                <div className="h-1.5 bg-slate-200 relative overflow-visible shrink-0 z-30 w-full">
                  <div
                    onMouseDown={handleSplitDragStart}
                    onTouchStart={handleSplitTouchStart}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-600 border border-indigo-500 shadow-md text-white flex items-center justify-center cursor-row-resize active:scale-110 active:bg-indigo-700 transition-all select-none z-40"
                    style={{ transform: "translate(-50%, -50%) rotate(90deg)" }}
                  >
                    <span className="text-[10px] font-black select-none">&lt;&gt;</span>
                  </div>
                </div>

                {/* Phần dưới */}
                <div className="relative flex flex-col overflow-hidden flex-1 w-full">
                  {renderPane(2, pane2Tab, setPane2Tab, zoom2, setZoom2)}
                </div>
              </div>
            ) : (
              renderPane(1, pane1Tab, setPane1Tab, zoom1, setZoom1)
            )}
          </div>

          {/* RESIZE HANDLES (Chỉ hiện khi không phóng to) */}
          {!isMaximized && (
            <>
              {/* Tay kéo bên phải */}
              <div
                onMouseDown={e => handleResizeStart("r", e)}
                className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-400/20 active:bg-indigo-500/40 transition-colors z-50"
              />
              {/* Tay kéo ở dưới */}
              <div
                onMouseDown={e => handleResizeStart("b", e)}
                className="absolute bottom-0 left-0 w-full h-1.5 cursor-row-resize hover:bg-indigo-400/20 active:bg-indigo-500/40 transition-colors z-50"
              />
              {/* Góc co dãn kéo chéo */}
              <div
                onMouseDown={e => handleResizeStart("br", e)}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-[60]"
              >
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full border-r border-b border-slate-400 opacity-60 group-hover:opacity-100" />
              </div>
            </>
          )}

          {/* CSS custom scrollbar ẩn thô kệch */}
          <style jsx>{`
            .custom-horizontal-scrollbar::-webkit-scrollbar {
              height: 4px;
            }
            .custom-horizontal-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-horizontal-scrollbar::-webkit-scrollbar-thumb {
              background: #e2e8f0;
              border-radius: 8px;
            }

            .custom-vertical-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .custom-vertical-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-vertical-scrollbar::-webkit-scrollbar-thumb {
              background: #e2e8f0;
              border-radius: 8px;
            }
          `}</style>

          {/* CSS cấu trúc cây thụt đầu dòng + bảng căn giữa — global, áp dụng cho dangerouslySetInnerHTML */}
          <style dangerouslySetInnerHTML={{
            __html: `
            /* ── Cấu trúc cây: thụt đầu dòng theo cấp ──
               Vị trí visual (tính từ edge container):
                 grammar-section-title →  0px
                 h3                    → 20px
                 .section-lv1 content  → 36px  (+16 so với h3) ✓
                 h4 (trong lv1)        → 44px  (+8 so với lv1) ✓
                 .section-lv2 content  → 60px  (+16 so với h4) ✓
            */

            .grammar-handbook-content h1.grammar-title {
              padding-left: 0 !important;
              margin-left: 0 !important;
            }
            .grammar-handbook-content .grammar-section-title {
              padding-left: 0 !important;
              margin-left: 0 !important;
            }

            /* h3 là heading ngoài section-lv1 → 20px */
            .grammar-handbook-content h3 {
              padding-left: 20px !important;
              margin-left: 0 !important;
            }

            /* section-lv1: bọc content sau h3 → indent 36px (> h3's 20px) */
            .grammar-handbook-content .section-lv1 {
              padding-left: 36px;
            }

            /* h4 nằm TRONG section-lv1 (36px) → thêm 8px = 44px tổng */
            .grammar-handbook-content .section-lv1 h4 {
              padding-left: 8px !important;
              margin-left: 0 !important;
            }

            /* section-lv2 nằm TRONG section-lv1 (36px) → thêm 24px = 60px tổng */
            .grammar-handbook-content .section-lv2 {
              padding-left: 24px;
            }

            /* ── Bảng: width tự nhiên, căn giữa ── */
            .grammar-handbook-content table.grammar-table {
              width: auto !important;
              min-width: 0 !important;
              max-width: 100% !important;
              margin-top: 16px !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }

            /* ── Khoảng cách dưới đoạn văn / text trước card hoặc bảng ── */
            .grammar-handbook-content p {
              margin-bottom: 16px;
            }

            /* Mệnh đề quan hệ được đánh dấu bằng <span class="rc"> */
            .rc {
              color: #ef4444;
              font-style: italic;
              font-weight: 900;
            }
          ` }} />
        </motion.div>
      )}
      </AnimatePresence>
      {activeWordFamily.length > 0 && (
        <WordFamilyPopover
          key="grammar-word-family-popover"
          wordFamilies={activeWordFamily}
          position={popoverPos}
          onClose={() => setActiveWordFamily([])}
          onPositionChange={(pos) => setPopoverPos(pos)}
        />
      )}
    </>
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
          const res = await Promise.race([fetchPromise, timeoutPromise]);
          if (res && res.ok) {
            return url;
          }
          return null;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(checkPromises);
      const bestUrl = results.find(url => url !== null);

      if (bestUrl) {
        audioCache.set(cacheKey, bestUrl);
        const audio = new Audio(bestUrl);
        audio.play().catch(() => fallbackSpeak(cleanSpeechText));
      } else {
        audioCache.set(cacheKey, 'tts');
        fallbackSpeak(cleanSpeechText);
      }
    } catch {
      audioCache.set(cacheKey, 'tts');
      fallbackSpeak(cleanSpeechText);
    }
  };

  const popoverRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const positionStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.popover-header')) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    positionStart.current = { x: position.x, y: position.y };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    let newX = positionStart.current.x + dx;
    let newY = positionStart.current.y + dy;

    newX = Math.max(10, Math.min(newX, window.innerWidth - 390));
    newY = Math.max(10, Math.min(newY, window.innerHeight - 370));

    onPositionChange({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('.group\\/cloud') || target.closest('svg')) return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const formatContent = (val: string, key: string, type: string, roots?: string[], displayTitle?: string) => {
    const lines = val.split('\n');

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

    return lines.map((line: string, idx: number) => {
      let cleanLine = line.trim();
      if (cleanLine.length === 0) return null;

      if (cleanLine.startsWith('[') && cleanLine.endsWith(']')) {
        cleanLine = cleanLine.slice(1, -1);
      }

      cleanLine = cleanLine.replace(/Đồng nghĩa TOEIC hay gặp/gi, 'Các từ/cụm từ tương tự');

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
          <div key={idx} className={lineClass}>
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
                            className="cursor-pointer hover:underline text-slate-900 font-semibold inline-block"
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

      const tokens = cleanLine.split(/(\|\||[,;=~:|]|\->|↔|\[.*?\]|\(.*?\))/g);
      return (
        <div key={idx} className={`${lineClass} inline-block w-full`}>
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
          return (
            <div key={famIdx}>
              {famIdx > 0 && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gốc từ</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              )}
              <h4 className={`text-lg font-black mb-2 border-b pb-1.5 capitalize ${isRoot && famIdx > 0 ? 'text-amber-700 border-amber-100' : 'text-slate-800 border-slate-100'}`}>
                {displayTitle}
              </h4>
              <div className="space-y-1">
                {formatContent(fam.originalValue, fam.key, fam.type, fam.roots, displayTitle)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
