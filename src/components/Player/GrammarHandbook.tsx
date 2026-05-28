"use client";

import { useEffect, useState, useRef } from "react";
import { X, Maximize2, Minimize2, BookOpen, Loader2, Columns2, Rows2, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isOpen, setIsOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [splitMode, setSplitMode] = useState<"none" | "vertical" | "horizontal">("none");
  const [zoom1, setZoom1] = useState(100);
  const [zoom2, setZoom2] = useState(100);
  const [activeTab, setActiveTab] = useState<"theory" | "practice">("theory");
  const [selectedPartIdx, setSelectedPartIdx] = useState<Record<number, number>>({});
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  // States cho Draggable và Resizable - Đặt kích thước mặc định rộng hơn (1000px) để hiển thị grid cực kỳ đẹp mắt
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(650);
  const [position, setPosition] = useState({ x: 100, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'r' | 'b' | 'br'

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
    if (!isOpen || lessons.length > 0) return;

    async function fetchGrammar() {
      try {
        setLoading(true);
        const res = await fetch(`/api/grammar?t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setLessons(data.lessons);
          if (data.lessons.length > 0) {
            setActiveLesson(data.lessons[0]);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu sổ tay ngữ pháp:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGrammar();
  }, [isOpen, lessons.length]);

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

  // Lắng nghe chuột toàn màn hình khi kéo thả hoặc co giãn
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, position.x, position.y, width, height]);

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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
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

                                return (
                                  <div
                                    key={optKey}
                                    onClick={() => handleSelectOption(lesson.id, currentPartIdx, `${q.id}-${subIdx}`, optKey)}
                                    className={`border rounded-xl p-3.5 text-[13px] font-bold cursor-pointer transition-all active:scale-[0.98] flex items-center gap-2.5 ${optionStyle}`}
                                  >
                                    <span className={`w-5.5 h-5.5 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm ${badgeStyle}`}>
                                      {optKey}
                                    </span>
                                    <span className="leading-snug">{optVal}</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
                      {Object.entries(q.options).map(([optKey, optVal]) => {
                        const isSelected = chosenAnswer === optKey;
                        const isCorrectOption = q.correctAnswer === optKey;

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
                            onClick={() => handleSelectOption(lesson.id, currentPartIdx, q.id, optKey)}
                            className={`border rounded-xl p-4 text-[13px] font-bold cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3 ${optionStyle}`}
                          >
                            <span className={`w-5.5 h-5.5 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm ${badgeStyle}`}>
                              {optKey}
                            </span>
                            <span className="leading-snug">{optVal}</span>
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
        <div className="h-[40vh] w-full shrink-0" />
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
        return str.replace(/APOSTROPHETEMP/g, "'");
      }
      return quoteParts.map((subPart, subIdx) => {
        const isQuoted = /^['"“‘].+?['"“”’]$/.test(subPart);
        const restoredPart = subPart.replace(/APOSTROPHETEMP/g, "'");
        if (isQuoted) {
          return (
            <strong key={`${baseKey}-${subIdx}`} className="text-indigo-600 font-extrabold mx-0.5">
              {restoredPart}
            </strong>
          );
        }
        return <span key={`${baseKey}-${subIdx}`}>{restoredPart}</span>;
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
        parts.push(
          <span key={`red-${idx}`} className="text-red-500 italic font-black mx-0.5">
            {restoredRed}
          </span>
        );
      } else if (parenthesisMatch) {
        const restoredParenthesis = parenthesisMatch.replace(/APOSTROPHETEMP/g, "'");
        parts.push(
          <span key={`blue-${idx}`} className="text-blue-600 font-black mx-0.5">
            ({restoredParenthesis})
          </span>
        );
      } else if (bracketMatch) {
        const restoredBracket = bracketMatch.replace(/APOSTROPHETEMP/g, "'");
        parts.push(
          <span key={`bracket-${idx}`} className="block text-red-500 font-bold text-[12.5px] mt-1 font-mono">
            [{restoredBracket}]
          </span>
        );
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
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
            zIndex: 100,
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
            {splitMode === "vertical" ? (
              <>
                {/* Cột trái */}
                <div className="flex-1 relative flex flex-col overflow-hidden border-r-2 border-slate-300">
                  {activeLesson && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-1.5 py-0.5 rounded-lg shadow-md select-none">
                      <button
                        onClick={() => setZoom1(prev => Math.max(70, prev - 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Thu nhỏ chữ"
                      >
                        <ZoomOut size={12} />
                      </button>
                      <span className="text-[9px] font-black text-slate-200 min-w-[24px] text-center">
                        {zoom1}%
                      </span>
                      <button
                        onClick={() => setZoom1(prev => Math.min(150, prev + 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Phóng to chữ"
                      >
                        <ZoomIn size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-6 custom-vertical-scrollbar w-full">
                    {activeLesson ? (
                      <>
                        <div
                          className="grammar-handbook-content select-text text-slate-700 w-full"
                          style={{ zoom: zoom1 / 100 }}
                          dangerouslySetInnerHTML={{ __html: activeLesson.htmlContent }}
                        />
                        {/* Khoảng trống 1/2 trang ở cuối */}
                        <div className="h-[40vh] w-full shrink-0" />
                      </>
                    ) : (
                      !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <BookOpen size={48} className="text-slate-200 mb-3" />
                          <p className="text-sm font-semibold">Vui lòng chọn bài học từ thanh cuộn phía trên.</p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Cột phải (Hiển thị bài tập luyện tập) */}
                <div className="flex-1 relative flex flex-col overflow-hidden">
                  {activeLesson && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-1.5 py-0.5 rounded-lg shadow-md select-none">
                      <button
                        onClick={() => setZoom2(prev => Math.max(70, prev - 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Thu nhỏ chữ"
                      >
                        <ZoomOut size={12} />
                      </button>
                      <span className="text-[9px] font-black text-slate-200 min-w-[24px] text-center">
                        {zoom2}%
                      </span>
                      <button
                        onClick={() => setZoom2(prev => Math.min(150, prev + 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Phóng to chữ"
                      >
                        <ZoomIn size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto pt-0 px-6 pb-6 custom-vertical-scrollbar w-full bg-slate-50/50">
                    {activeLesson ? (
                      renderPractice(activeLesson, zoom2)
                    ) : (
                      !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <BookOpen size={48} className="text-slate-200 mb-3" />
                          <p className="text-sm font-semibold">Vui lòng chọn bài học từ thanh cuộn phía trên.</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            ) : splitMode === "horizontal" ? (
              <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Phần trên */}
                <div className="flex-1 relative flex flex-col overflow-hidden border-b-2 border-slate-300">
                  {activeLesson && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-1.5 py-0.5 rounded-lg shadow-md select-none">
                      <button
                        onClick={() => setZoom1(prev => Math.max(70, prev - 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Thu nhỏ chữ"
                      >
                        <ZoomOut size={12} />
                      </button>
                      <span className="text-[9px] font-black text-slate-200 min-w-[24px] text-center">
                        {zoom1}%
                      </span>
                      <button
                        onClick={() => setZoom1(prev => Math.min(150, prev + 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Phóng to chữ"
                      >
                        <ZoomIn size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-6 custom-vertical-scrollbar w-full">
                    {activeLesson ? (
                      <>
                        <div
                          className="grammar-handbook-content select-text text-slate-700 w-full"
                          style={{ zoom: zoom1 / 100 }}
                          dangerouslySetInnerHTML={{ __html: activeLesson.htmlContent }}
                        />
                        {/* Khoảng trống 1/2 trang ở cuối */}
                        <div className="h-[40vh] w-full shrink-0" />
                      </>
                    ) : (
                      !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <BookOpen size={48} className="text-slate-200 mb-3" />
                          <p className="text-sm font-semibold">Vui lòng chọn bài học từ thanh cuộn phía trên.</p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Phần dưới (Hiển thị bài tập luyện tập) */}
                <div className="flex-1 relative flex flex-col overflow-hidden">
                  {activeLesson && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-1.5 py-0.5 rounded-lg shadow-md select-none">
                      <button
                        onClick={() => setZoom2(prev => Math.max(70, prev - 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Thu nhỏ chữ"
                      >
                        <ZoomOut size={12} />
                      </button>
                      <span className="text-[9px] font-black text-slate-200 min-w-[24px] text-center">
                        {zoom2}%
                      </span>
                      <button
                        onClick={() => setZoom2(prev => Math.min(150, prev + 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Phóng to chữ"
                      >
                        <ZoomIn size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto pt-0 px-6 pb-6 custom-vertical-scrollbar w-full bg-slate-50/50">
                    {activeLesson ? (
                      renderPractice(activeLesson, zoom2)
                    ) : (
                      !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <BookOpen size={48} className="text-slate-200 mb-3" />
                          <p className="text-sm font-semibold">Vui lòng chọn bài học từ thanh cuộn phía trên.</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 relative flex flex-col overflow-hidden w-full">
                {activeLesson && (
                  <>
                    {/* Segmented Control & BT Part Selector in ONE row */}
                    <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100 bg-slate-50/30 shrink-0 select-none gap-4">
                      {/* Left: Lý thuyết / Bài tập toggle */}
                      <div className="flex p-0.5 bg-slate-100/80 rounded-lg border border-slate-200/30 gap-0.5 min-w-[180px] shrink-0">
                        <button
                          onClick={() => setActiveTab("theory")}
                          className={`flex-1 py-0.5 rounded-md text-[10px] font-black transition-all ${
                            activeTab === "theory"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Lý thuyết
                        </button>
                        <button
                          onClick={() => setActiveTab("practice")}
                          className={`flex-1 py-0.5 rounded-md text-[10px] font-black transition-all ${
                            activeTab === "practice"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Bài tập
                        </button>
                      </div>

                      {/* Right: BT Selector tabs - only shown when in practice tab and has parts */}
                      {activeTab === "practice" && activeLesson.practice?.parts && activeLesson.practice.parts.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center justify-end overflow-hidden">
                          {activeLesson.practice.parts.map((part, idx) => {
                            const currentPartIdx = selectedPartIdx[activeLesson.id] || 0;
                            const isActive = currentPartIdx === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedPartIdx(prev => ({ ...prev, [activeLesson.id]: idx }))}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 shrink-0 ${
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

                    <div className="absolute top-11 right-4 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-1.5 py-0.5 rounded-lg shadow-md select-none">
                      <button
                        onClick={() => setZoom1(prev => Math.max(70, prev - 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Thu nhỏ chữ"
                      >
                        <ZoomOut size={12} />
                      </button>
                      <span className="text-[9px] font-black text-slate-200 min-w-[24px] text-center">
                        {zoom1}%
                      </span>
                      <button
                        onClick={() => setZoom1(prev => Math.min(150, prev + 10))}
                        className="p-1 text-slate-300 hover:text-white rounded active:scale-95 transition-all"
                        title="Phóng to chữ"
                      >
                        <ZoomIn size={12} />
                      </button>
                    </div>
                  </>
                )}
                <div className={`flex-1 overflow-y-auto p-6 custom-vertical-scrollbar w-full ${activeTab === 'practice' ? 'bg-slate-50/50' : ''}`}>
                  {activeLesson ? (
                    activeTab === "theory" ? (
                      <>
                        <div
                          className="grammar-handbook-content select-text text-slate-700 w-full"
                          style={{ zoom: zoom1 / 100 }}
                          dangerouslySetInnerHTML={{ __html: activeLesson.htmlContent }}
                        />
                        {/* Khoảng trống 1/2 trang ở cuối */}
                        <div className="h-[40vh] w-full shrink-0" />
                      </>
                    ) : (
                      renderPractice(activeLesson, zoom1, false)
                    )
                  ) : (
                    !loading && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <BookOpen size={48} className="text-slate-200 mb-3" />
                        <p className="text-sm font-semibold">Vui lòng chọn bài học từ thanh cuộn phía trên.</p>
                      </div>
                    )
                  )}
                </div>
              </div>
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
  );
}
