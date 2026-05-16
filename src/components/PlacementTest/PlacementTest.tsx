"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  PlayCircle,
  CheckCircle2,
  Trophy,
  BookOpen,
  ArrowRight,
  Info,
  Clock,
  LayoutGrid,
  Send,
  AlertCircle,
  Volume2
} from "lucide-react";

import clsx from "clsx";
import diagnosticData from "@/data/diagnostic-test.json";

interface PlacementTestProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlacementTest({ isOpen, onClose }: PlacementTestProps) {
  const [step, setStep] = useState<"intro" | "testing" | "result" | "review">("intro");
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(12 * 60);
  const [showQuestionSheet, setShowQuestionSheet] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isReadingStarted, setIsReadingStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentGroup = diagnosticData[currentGroupIdx];
  const totalGroups = diagnosticData.length;

  const allQuestions = diagnosticData.flatMap((g: any, gIdx: number) =>
    g.questions.map((q: any) => ({ ...q, groupIdx: gIdx }))
  );

  const totalQuestionsCount = allQuestions.length;

  useEffect(() => {
    if (isOpen) {
      setStep("intro");
      setCurrentGroupIdx(0);
      setUserAnswers({});
      setTimeLeft(12 * 60);
      setIsTimeUp(false);
      setShowQuestionSheet(false);
      setIsReadingStarted(false);
    }
  }, [isOpen]);

  // Auto-play audio when group changes
  useEffect(() => {
    if (step === "testing" && currentGroup?.audioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log("Auto-play blocked:", err));
    }

    // Check if we entered Reading part
    if (currentGroup && currentGroup.part >= 5 && !isReadingStarted) {
      setIsReadingStarted(true);
    }
  }, [currentGroupIdx, step]);

  useEffect(() => {
    if (step === "testing" && isReadingStarted && timeLeft > 0 && !isTimeUp) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && step === "testing" && isReadingStarted) {
      setIsTimeUp(true);
    }
  }, [step, timeLeft, isTimeUp, isReadingStarted]);

  if (!isOpen) return null;

  const handleAnswer = (questionId: string, answer: string) => {
    if (isTimeUp) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextStep = () => {
    if (currentGroupIdx < totalGroups - 1) {
      setCurrentGroupIdx(prev => prev + 1);
    } else {
      setStep("result");
    }
  };

  const prevStep = () => {
    if (currentGroupIdx > 0) {
      setCurrentGroupIdx(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    diagnosticData.forEach((group: any) => {
      group.questions.forEach((q: any) => {
        if (userAnswers[q.id] === q.correctAnswer) {
          correct++;
        }
      });
    });

    const rawScore = (correct / totalQuestionsCount) * 990;
    // Làm tròn về bội số của 5 để giống thang điểm TOEIC thực tế
    const scaledScore = Math.round(rawScore / 5) * 5;

    return { correct, total: totalQuestionsCount, scaledScore };
  };

  const QuestionSheet = () => (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Bảng câu hỏi</h3>
            <p className="text-sm text-slate-500">
              {step === "testing" ? "Theo dõi tiến độ làm bài của bạn" : "Xem nhanh kết quả các câu hỏi"}
            </p>
          </div>
          <button onClick={() => setShowQuestionSheet(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {allQuestions.map((q: any, i: number) => {
              const isAnswered = userAnswers[q.id];
              const isCurrent = currentGroup.questions.some((cq: any) => cq.id === q.id);
              const isCorrect = userAnswers[q.id] === q.correctAnswer;

              let bgColor = "bg-slate-100 text-slate-400 hover:bg-slate-200";
              if (step === "testing") {
                if (isAnswered) bgColor = "bg-blue-600 text-white";
              } else {
                if (!isAnswered) bgColor = "bg-slate-200 text-slate-500";
                else if (isCorrect) bgColor = "bg-emerald-500 text-white";
                else bgColor = "bg-rose-500 text-white";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    const targetGroupIdx = q.groupIdx;
                    setCurrentGroupIdx(targetGroupIdx);
                    setShowQuestionSheet(false);
                  }}
                  className={clsx(
                    "h-10 w-full rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                    isCurrent ? "ring-2 ring-blue-500 ring-offset-2 scale-105 z-10" : "",
                    bgColor
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-slate-100">
            {step === "testing" ? (
              <>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-600"></div><span className="text-xs text-slate-600">Đã làm</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-100 border"></div><span className="text-xs text-slate-600">Chưa làm</span></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-500"></div><span className="text-xs text-slate-600">Câu đúng</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-rose-500"></div><span className="text-xs text-slate-600">Câu sai</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-200"></div><span className="text-xs text-slate-600">Bỏ trống</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSplitView = currentGroup && (currentGroup.part <= 4 || currentGroup.part === 6 || currentGroup.part === 7);
  const hideOptionText = currentGroup && (currentGroup.part === 1 || currentGroup.part === 2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100 animate-in fade-in duration-300 font-sans overflow-hidden overscroll-none">
      <div className="w-full h-[100dvh] flex flex-col bg-[#f0f2f5] overflow-hidden">
        {/* --- TOPBAR --- */}
        <div className="h-14 bg-[#2c3e50] text-white flex items-center justify-between px-6 shadow-md z-50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold italic">HT</div>
              <span className="font-bold tracking-tight uppercase">HocToeic <span className="text-blue-400">Diagnostic</span></span>
            </div>
            {step === "testing" && currentGroup && (
              <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-300">
                <div className="h-8 w-[1px] bg-slate-600 mx-4" />
                <span>Part {currentGroup.part}: {getPartName(currentGroup.part)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            {step === "testing" && (
              <div className={clsx(
                "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500",
                !isReadingStarted ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                  timeLeft < 60 ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-black/20 border-white/10 text-white"
              )}>
                <Clock size={16} className={!isReadingStarted ? "text-emerald-400" : timeLeft < 60 ? "text-red-500" : "text-blue-400"} />
                <span className="font-mono text-lg font-bold tabular-nums">
                  {isReadingStarted ? formatTime(timeLeft) : "LISTENING"}
                </span>
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={24} /></button>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
          {showQuestionSheet && <QuestionSheet />}
          {step === "intro" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
              <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-slate-200 max-w-2xl w-full">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8 mx-auto">
                  <LayoutGrid size={40} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-4 italic">Chào mừng bạn đến với bài test kiểm tra trình độ</h1>
                <p className="text-slate-500 mb-10 leading-relaxed font-medium italic">
                  Bài test sẽ diễn ra trong khoảng 22 phút. <br />
                  Hãy đảm bảo bạn sẵn sàng để bài kiểm tra không bị gián đoạn nhé.
                </p>
                <button onClick={() => setStep("testing")} className="w-full bg-[#2c3e50] text-white py-5 rounded-2xl font-bold text-lg uppercase tracking-widest hover:bg-[#1a252f] transition-all flex items-center justify-center gap-3">Bắt đầu làm bài <ChevronRight size={24} /></button>
              </div>
            </div>
          )}

          {step === "testing" && (
            <div className="flex-1 flex overflow-hidden">
              {showQuestionSheet && (
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl z-40 animate-in slide-in-from-left duration-300">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Answer Sheet</h3>
                    <button onClick={() => setShowQuestionSheet(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400"><X size={16} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 gap-2 content-start">
                    {allQuestions.map((q: any) => (
                      <button key={q.id} onClick={() => { setCurrentGroupIdx(q.groupIdx); setShowQuestionSheet(false); }} className={clsx("h-10 rounded font-bold text-xs flex items-center justify-center transition-all border-2", q.groupIdx === currentGroupIdx ? "border-blue-600" : "border-transparent", !!userAnswers[q.id] ? "bg-[#2c3e50] text-white" : "bg-slate-100 text-slate-400")}>
                        {q.questionNo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
                {isTimeUp && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center space-y-6">
                      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto"><AlertCircle size={40} /></div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase italic">HẾT THỜI GIAN!</h2>
                      <button onClick={() => setStep("result")} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-700">Xem kết quả ngay</button>
                    </div>
                  </div>
                )}

                <div className={clsx(
                  "flex-1 overflow-y-auto scroll-smooth flex flex-col",
                  isSplitView ? "lg:flex-row" : "items-center justify-center p-6 md:p-10"
                )}>
                  {currentGroup && (
                    <div className={clsx(
                      "relative min-h-[100px] border-r border-slate-200 flex flex-col items-center justify-center p-8 md:p-12",
                      isSplitView ? "lg:w-1/2 lg:h-full lg:sticky lg:top-0" : "max-w-5xl w-full"
                    )}>
                      {currentGroup.audioUrl && (
                        <div className="absolute top-6 right-6 z-10">
                          <button
                            onClick={() => { if (audioRef.current && !isTimeUp) { audioRef.current.currentTime = 0; audioRef.current.play(); } }}
                            className="w-16 h-16 bg-[#2c3e50] text-white rounded-full flex items-center justify-center hover:bg-[#1a252f] transition-all shadow-xl active:scale-90 shrink-0"
                            title="Play Audio"
                          >
                            <Volume2 size={32} />
                            <audio
                              ref={audioRef}
                              src={currentGroup.audioUrl}
                              hidden
                              onEnded={nextStep}
                            />
                          </button>
                        </div>
                      )}

                      {currentGroup.imageUrl && (
                        <div className="bg-white p-2 rounded-xl border-2 border-slate-100 shadow-sm overflow-hidden w-full max-w-2xl mx-auto">
                          <img src={currentGroup.imageUrl} alt="Exam Stimulus" className="w-full h-auto object-contain max-h-[600px] mx-auto rounded-lg" />
                        </div>
                      )}

                      {currentGroup.passageText && (
                        <div className={clsx(
                          "w-full overflow-hidden",
                          currentGroup.part === 7 ? "max-w-none" : "bg-white border-2 border-slate-100 p-10 rounded-xl shadow-inner max-w-3xl",
                          currentGroup.part <= 4 && "hidden"
                        )}>
                          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: formatPassage(currentGroup.passageText) }} />
                        </div>
                      )}
                    </div>
                  )}

                  {currentGroup && (
                    <div className={clsx(
                      "flex flex-col p-8 md:p-12 bg-white",
                      isSplitView ? "lg:w-1/2" : "max-w-5xl w-full"
                    )}>
                      <div className="space-y-6 pb-32">
                        {currentGroup.questions.map((q: any) => (
                          <div key={q.id} className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-start gap-4 border-b border-slate-100 pb-2 relative">
                              <span className="w-8 h-8 bg-[#e74c3c] text-white rounded flex items-center justify-center font-bold text-xs shadow-sm shrink-0">{q.questionNo}</span>
                              <div className="flex-1 flex flex-col gap-1">
                                <h3 className="font-bold text-slate-800 text-lg md:text-xl italic leading-tight">
                                  {hideOptionText ? "Mark your answer on the answer sheet:" : (q.questionText || "Chọn đáp án đúng nhất:")}
                                </h3>
                              </div>
                            </div>

                            <div className={clsx("grid gap-0.5", hideOptionText ? "grid-cols-1 w-20 mx-auto md:mx-0" : "grid-cols-1")}>
                              {['A', 'B', 'C', 'D'].map((opt) => {
                                const optionText = q[`option${opt}`];
                                if (!optionText && opt === 'D' && currentGroup.part === 2) return null;
                                const isSelected = userAnswers[q.id] === opt;
                                return (
                                  <button
                                    key={opt}
                                    disabled={isTimeUp}
                                    onClick={() => handleAnswer(q.id, opt)}
                                    className={clsx(
                                      "text-left p-1 rounded-xl transition-all flex items-center gap-3 group border-2 outline-none",
                                      isSelected
                                        ? "bg-blue-50/50 border-blue-600/20 shadow-sm"
                                        : "bg-transparent border-transparent hover:bg-slate-50/50",
                                      hideOptionText ? "justify-center" : ""
                                    )}
                                  >
                                    <div className={clsx(
                                      "w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-all",
                                      isSelected ? "bg-[#2c3e50] border-[#2c3e50] text-white shadow-lg" : "bg-white border-slate-300 text-slate-500 group-hover:border-slate-800 group-hover:text-slate-800"
                                    )}>{opt}</div>
                                    {!hideOptionText && <span className={clsx("font-bold text-sm md:text-base leading-tight transition-colors", isSelected ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900")}>{optionText}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* --- FOOTER --- */}
                <div className="h-20 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-6 z-30">
                  <button onClick={() => setShowQuestionSheet(true)} className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">
                    <LayoutGrid size={18} />
                    <span className="hidden md:inline">Xem bảng câu hỏi</span>
                  </button>
                  <div className="flex items-center gap-4">
                    <button onClick={prevStep} disabled={currentGroupIdx === 0 || isTimeUp} className="px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-30 flex items-center gap-2">
                      <ChevronLeft size={18} /> Back
                    </button>
                    <button onClick={nextStep} disabled={isTimeUp} className={clsx("px-8 py-2.5 rounded font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 text-white shadow-md active:scale-95 disabled:opacity-30", currentGroupIdx === totalGroups - 1 ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700")}>
                      {currentGroupIdx === totalGroups - 1 ? <>Finish <Send size={18} /></> : <>Next <ChevronRight size={18} /></>}
                    </button>
                  </div>
                  <div className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Part {currentGroup.part} Questions<br />
                    {currentGroup.questions[0]?.questionNo} - {currentGroup.questions[currentGroup.questions.length - 1]?.questionNo}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "result" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
              <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-slate-200 max-w-3xl w-full">
                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 mx-auto"><Trophy size={40} /></div>
                <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase italic">KẾT QUẢ CỦA BẠN</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10">KẾT QUẢ ĐÁNH GIÁ TRÌNH ĐỘ</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center justify-center group">
                    <div className="text-6xl font-black text-slate-900 mb-2 group-hover:scale-110 transition-transform tabular-nums">{calculateScore().scaledScore}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm dự kiến (Thang 990)</div>
                    <div className="mt-4 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Đúng {calculateScore().correct}/{calculateScore().total} câu</div>
                  </div>
                  <div className="bg-[#2c3e50] p-8 rounded-3xl text-white text-left relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12"><Trophy size={80} /></div>
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">LỘ TRÌNH GỢI Ý</div>
                    <div className="text-xl font-bold mb-2 italic">{getRecommendation(calculateScore().scaledScore).title}</div>
                    <p className="text-slate-400 text-xs leading-relaxed italic">{getRecommendation(calculateScore().scaledScore).desc}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 mt-6">
                  <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 border-2 border-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase text-[11px] tracking-widest">Thoát</button>
                    <button onClick={() => { setCurrentGroupIdx(0); setStep("review"); }} className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all uppercase text-[11px] tracking-widest">Xem chi tiết đáp án</button>
                  </div>
                  <button onClick={() => { onClose(); window.location.href = "/courses"; }} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all uppercase text-[11px] tracking-widest shadow-lg shadow-blue-100">Tham khảo lộ trình học</button>
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50">
              {/* Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setStep("result"); setCurrentGroupIdx(0); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="font-black text-slate-800 uppercase italic">Review: Part {currentGroup.part}</h2>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Question {currentGroup.questions[0].questionNo} - {currentGroup.questions[currentGroup.questions.length - 1].questionNo}
                </div>
              </div>

              {/* Split View Content */}
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-white">
                {/* Left Side: Media & Transcript */}
                <div className="lg:w-1/2 flex-1 overflow-y-auto border-r border-slate-200 p-8 md:p-12 bg-slate-50/50">
                  <div className="max-w-3xl mx-auto space-y-8">
                    {currentGroup.audioUrl && (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Volume2 size={24} /></div>
                        <audio src={currentGroup.audioUrl} controls className="flex-1" />
                      </div>
                    )}

                    {/* Stimulus Image - Always show if present, but only once */}
                    {currentGroup.imageUrl && (
                      <div className="bg-white p-2 rounded-xl border-2 border-slate-100 shadow-sm overflow-hidden mb-6">
                        <img src={currentGroup.imageUrl} alt="Review Stimulus" className="w-full h-auto object-contain max-h-[500px] mx-auto rounded-lg" />
                      </div>
                    )}

                    {/* Transcript for Part 3/4/6/7 - Hide for Part 1 & 2 as it's redundant */}
                    {![1, 2].includes(currentGroup.part) && (currentGroup.passageText || currentGroup.transcript) && (
                      <div className={clsx(
                        "p-10 rounded-xl shadow-inner",
                        currentGroup.passageText ? "bg-white border-2 border-slate-100" : "bg-[#2c3e50] text-white"
                      )}>
                        {(() => {
                          const defaultColors = ["yellow", "green", "blue", "purple", "orange", "pink"];
                          const evidenceMap = currentGroup.questions.reduce((acc: any, q: any, idx: number) => {
                            const rawCandidates = [q.explanation, (currentGroup as any).explanation, (currentGroup as any).passageText, (currentGroup as any).stimulus];
                            let trueQ = q;
                            for (const raw of rawCandidates) {
                              try {
                                if (!raw) continue;
                                const parsed = typeof raw === 'object' ? raw : JSON.parse(raw.replace(/_x000D_/g, '').trim());
                                const found = parsed.questions?.find((sq: any) => String(sq.id) === String(q.id) || String(sq.questionNo) === String(q.questionNo));
                                if (found) { trueQ = found; break; }
                              } catch (e) { }
                            }

                            const realCorrect = trueQ.correct_answer || trueQ.correctAnswer || q.correctAnswer;
                            const isCorrect = userAnswers[q.id] === realCorrect;

                            // Use JSON color OR default from array based on index
                            const highlightColor = trueQ.highlight_color || q.highlight_color || defaultColors[idx % defaultColors.length];

                            const sids = trueQ.evidence_sids || q.evidence_sids || [];
                            sids.forEach((sid: string) => {
                              acc[sid] = { questionNo: q.questionNo, isCorrect, highlightColor };
                            });
                            return acc;
                          }, {});

                          const contentToFormat = currentGroup.passageText || currentGroup.transcript;
                          return (
                            <div className={clsx(
                              "prose max-w-none leading-relaxed font-medium",
                              currentGroup.passageText ? "prose-slate text-slate-700" : "prose-invert text-slate-200"
                            )} dangerouslySetInnerHTML={{ __html: formatPassage(contentToFormat, true, evidenceMap) }} />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Questions & Explanations */}
                <div className="lg:w-1/2 flex-1 overflow-y-auto p-8 md:p-12">
                  <div className="max-w-3xl mx-auto space-y-10 pb-20">
                    {currentGroup.questions.map((q: any, idx: number) => {
                      const userAnswer = userAnswers[q.id];

                      // --- PARSE DATA ---
                      const parsedExplanation = (() => {
                        const rawCandidates = [
                          q.explanation,
                          (currentGroup as any).explanation,
                          (currentGroup as any).passageText,
                          (currentGroup as any).stimulus,
                          ...currentGroup.questions.map((quest: any) => quest.explanation)
                        ];

                        const parsedCandidates = rawCandidates
                          .map(raw => {
                            if (!raw) return null;
                            if (typeof raw === 'object') return raw;
                            try {
                              const cleaned = raw.replace(/_x000D_/g, '').trim();
                              return (cleaned.startsWith('{') || cleaned.startsWith('[')) ? JSON.parse(cleaned) : null;
                            } catch (e) { return null; }
                          })
                          .filter(p => p !== null);

                        // Priority 1: The one that actually has question-level data
                        const best = parsedCandidates.find(p => p.options_vn || p.options_breakdown || p.questions || p.explanation?.options_breakdown || p.explanation?.why_correct || p.why_correct);
                        if (best) return best;

                        // Priority 2: The one matching current question ID
                        const matchingId = parsedCandidates.find(p => p.id === q.id || p.id === q.questionNo);
                        if (matchingId) return matchingId;

                        return parsedCandidates[0] || null;
                      })();

                      // NEW: Enhanced matching for Part 7 questions (CRITICAL for data syncing)
                      const trueQData = parsedExplanation?.questions?.find((sq: any) => {
                        const sqId = String(sq.id || sq.questionNo || "");
                        const qId = String(q.id || q.questionNo || "");
                        const qNo = String(q.questionNo || "");
                        return sqId === qId || sqId === qNo || (sq.questionNo && String(sq.questionNo) === qNo);
                      }) || q;

                      const realCorrectAnswer = trueQData.correct_answer || trueQData.correctAnswer || q.correctAnswer;
                      const isCorrect = userAnswer === realCorrectAnswer;
                      const questionText = trueQData.questionText || trueQData.text || q.questionText;
                      const questionVi = trueQData.questionText_vn || trueQData.text_vn || trueQData.vi || q.questionText_vn;

                      const findBreakdownRecursive = (obj: any): any => {
                        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
                        if (obj.options_breakdown) return obj.options_breakdown;
                        for (const key in obj) {
                          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                            const res = findBreakdownRecursive(obj[key]);
                            if (res) return res;
                          }
                        }
                        return null;
                      };

                      const breakdown = findBreakdownRecursive(parsedExplanation);
                      const expContainer = (parsedExplanation?.explanation && typeof parsedExplanation.explanation === 'object')
                        ? parsedExplanation.explanation
                        : parsedExplanation;

                      const explanation = q.explanation || (parsedExplanation ? JSON.stringify(parsedExplanation) : null);

                      const getDetailsFromBreakdown = (opt: string) => {
                        if (!breakdown) return null;

                        // 1. If breakdown is keyed by question number (Common in P6 groups)
                        const qNo = q.questionNo?.toString();
                        if (qNo && breakdown[qNo] && typeof breakdown[qNo] === 'object') {
                          const qData = breakdown[qNo];
                          if (Array.isArray(qData)) {
                            return qData.find((b: any) => b.label === opt || b.option === opt || b.id === opt);
                          }
                          return qData[opt];
                        }

                        // 2. If breakdown is an array directly
                        if (Array.isArray(breakdown)) {
                          return breakdown.find((b: any) => b.label === opt || b.option === opt || b.id === opt);
                        }

                        // 3. Keyed by option letter directly
                        return breakdown[opt];
                      };
                      // --- END PARSE ---

                      // Helper to extract translation for ANY part (with Recursive & Pattern Search)
                      const getTranslationForOption = (opt: string) => {
                        const subData = trueQData || parsedExplanation;
                        if (!subData) return null;

                        const findVnRecursive = (obj: any): any => {
                          if (!obj) return null;
                          
                          // 1. Handle Pattern Search in strings: (A) Text (B) Text...
                          if (typeof obj === 'string' && obj.includes(`(${opt})`)) {
                            const parts = obj.split(/\([A-D]\)/i);
                            const labels = obj.match(/\([A-D]\)/gi) || [];
                            const labelIdx = labels.findIndex(l => l.toUpperCase() === `(${opt.toUpperCase()})`);
                            if (labelIdx !== -1 && parts[labelIdx + 1]) {
                                return parts[labelIdx + 1].trim();
                            }
                          }
                          
                          if (typeof obj !== 'object' || Array.isArray(obj)) return null;

                          // 2. Handle Object Search: options_vn: { A: "..." }
                          if (obj.options_vn) {
                            const val = obj.options_vn[opt] || obj.options_vn[opt.toLowerCase()];
                            if (val) return val;
                          }
                          
                          // 3. Deep search into common fields
                          for (const k in obj) {
                            const res = findVnRecursive(obj[k]);
                            if (res) return res;
                          }
                          return null;
                        };

                        // Execute search
                        const optVn = findVnRecursive(subData) || findVnRecursive(parsedExplanation);
                        if (optVn) return optVn;

                        // 4. From options_breakdown (Found in P5/P6)
                        const details = getDetailsFromBreakdown(opt);
                        if (details) return details.meaning || details.vi || details.translation || details.text_vi;

                        // 5. From options array (Found in P2)
                        const optSource = subData.options || (parsedExplanation as any)?.options;
                        if (optSource && Array.isArray(optSource)) {
                           const found = optSource.find((o: any) => (o.label || o.id || o.option) === opt);
                           if (found) return found.vi || found.meaning || found.translation || found.en_vi;
                        }

                        return null;
                      };

                      // Helper to extract why right/wrong for ANY part (Global & Deep Search)
                      const getExplanationForOption = (opt: string) => {
                        const target = trueQData || parsedExplanation;
                        if (!target) return null;

                        const isCorrectOpt = realCorrectAnswer === opt;

                        // Recursive helper to find explanation keys
                        const findIn = (obj: any, key: string): any => {
                          if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
                          if (obj[key]) return obj[key];
                          if (obj.explanation && typeof obj.explanation === 'object') {
                            const res = findIn(obj.explanation, key);
                            if (res) return res;
                          }
                          for (const k in obj) {
                            if (k !== 'explanation' && typeof obj[k] === 'object') {
                              const res = findIn(obj[k], key);
                              if (res) return res;
                            }
                          }
                          return null;
                        };

                        // Search in specific question first, then global group
                        const whyCorrect = findIn(trueQData, 'why_correct') || findIn(trueQData, 'whyCorrect') || findIn(parsedExplanation, 'why_correct') || findIn(parsedExplanation, 'correct')?.why || parsedExplanation?.explanation?.correct?.why;
                        // KEY FIX: Added support for 'incorrect' array and other Part 2 formats
                        const wrongData = findIn(trueQData, 'wrong_options') || findIn(trueQData, 'wrong') || findIn(trueQData, 'why_wrong') || findIn(trueQData, 'whyWrong') || findIn(parsedExplanation, 'wrong_options') || findIn(parsedExplanation, 'wrong') || findIn(parsedExplanation, 'why_wrong') || findIn(parsedExplanation, 'incorrect') || parsedExplanation?.explanation?.incorrect;

                        if (isCorrectOpt && whyCorrect) {
                          if (typeof whyCorrect === 'string') return whyCorrect;
                          return whyCorrect[opt] || whyCorrect[opt.toLowerCase()] || whyCorrect;
                        }

                        if (!isCorrectOpt && wrongData) {
                          if (Array.isArray(wrongData)) {
                             const found = wrongData.find((i: any) => i.label === opt || i.option === opt);
                             return found?.why || found?.reason;
                          }
                          return wrongData[opt] || wrongData[opt.toLowerCase()];
                        }

                        // Fallback to breakdown
                        const details = getDetailsFromBreakdown(opt);
                        if (details) return details.reason || details.why || details.text || details.explanation;

                        if (isCorrectOpt) return findIn(target, 'correct')?.why || whyCorrect;
                        return null;
                      };

                      // Helper to extract question translation for Part 2/3/4
                      const getQuestionTranslation = () => {
                        if (!parsedExplanation) return null;
                        const subData = (parsedExplanation.questions?.find((sq: any) =>
                          String(sq.id) === String(q.id) || String(sq.id) === String(q.questionNo)
                        )) || (parsedExplanation.questions?.[0]) || parsedExplanation;
                        
                        return subData.vi || subData.question?.vi || subData.translation?.vi || subData.translation_vn || parsedExplanation.vi || (parsedExplanation.question?.vi);
                      };


                      return (
                        <div key={q.id} className="space-y-6">
                          <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                            {(() => {
                              const defaultColors = ["yellow", "green", "blue", "purple", "orange", "pink"];
                              const hColor = (trueQData?.highlight_color || q.highlight_color || defaultColors[idx % defaultColors.length]).toLowerCase();
                              const badgeBg = (({
                                yellow: "bg-yellow-500",
                                green: "bg-emerald-500",
                                blue: "bg-blue-500",
                                purple: "bg-purple-500",
                                orange: "bg-orange-500",
                                pink: "bg-pink-500"
                              } as Record<string, string>)[hColor] || "bg-yellow-500");

                              return (
                                <span className={clsx(
                                  "w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0 shadow-sm text-white",
                                  badgeBg
                                )}>{q.questionNo}</span>
                              );
                            })()}
                            <div className="flex flex-col gap-1">
                              <h3 className="font-bold text-slate-800 text-lg md:text-xl italic leading-tight">
                                {currentGroup.part === 2 ? (questionText || "Question:") : (questionText || "Chọn đáp án đúng:")}
                              </h3>
                              {questionVi && (
                                <p className="text-blue-600 text-sm font-medium italic" dangerouslySetInnerHTML={{ __html: `Dịch: ${renderBoldText(questionVi)}` }} />
                              )}

                              {/* Full sentence translation for Part 5/6/7 */}
                              {(() => {
                                try {
                                  const target = parsedExplanation || {};
                                  if (target.translation) {
                                    return (
                                      <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                        <div dangerouslySetInnerHTML={{ __html: `<span class="text-blue-500 font-bold not-italic mr-2">Dịch câu:</span> ${renderBoldText(target.translation)}` }} className="text-slate-700 leading-relaxed italic text-sm md:text-base" />
                                      </div>
                                    );
                                  }
                                } catch (e) { }
                                return null;
                              })()}
                            </div>
                          </div>

                          <div className="grid gap-3">
                            {['A', 'B', 'C', 'D'].map((opt) => {
                              const optionText = trueQData[`option${opt}`] || q[`option${opt}`];
                              if (!optionText && opt === 'D' && currentGroup.part === 2) return null;

                              const isUserChoice = userAnswer === opt;
                              const isCorrectChoice = realCorrectAnswer === opt;
                              const translation = getTranslationForOption(opt);
                              const why = getExplanationForOption(opt);

                              return (
                                <div key={opt} className="flex flex-col gap-2 mb-3">
                                  {/* Khung đáp án & Dịch */}
                                  <div className={clsx(
                                    "p-4 rounded-2xl border-2 transition-all duration-300 shadow-sm",
                                    isCorrectChoice ? "bg-emerald-50 border-emerald-500/20" :
                                      isUserChoice && !isCorrect ? "bg-red-50 border-red-500/20" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                                  )}>
                                    <div className="flex items-center gap-4">
                                      <div className={clsx(
                                        "w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300",
                                        isCorrectChoice ? "bg-emerald-500 border-emerald-500 text-white shadow-md ring-4 ring-emerald-500/10" :
                                          isUserChoice ? "bg-red-500 border-red-500 text-white shadow-md ring-4 ring-red-500/10" : "bg-white border-slate-200 text-slate-400"
                                      )}>{opt}</div>
                                      <div className="flex flex-col">
                                        {optionText && <span className={clsx(
                                          "font-bold text-sm md:text-base tracking-tight",
                                          isCorrectChoice ? "text-emerald-800" :
                                            isUserChoice ? "text-red-800" : "text-slate-700"
                                        )}>{optionText}</span>}
                                        {translation && (
                                          <div className="text-xs text-slate-500 italic font-medium mt-0.5 leading-relaxed">
                                            {translation}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Giải thích tách rời hoàn toàn */}
                                  {why && (
                                    <div className={clsx(
                                      "ml-14 text-[12px] leading-relaxed p-4 rounded-2xl border-l-4 bg-white/50 shadow-sm border border-slate-100",
                                      isCorrectChoice ? "border-emerald-400 text-emerald-800" : "border-red-300 text-slate-700"
                                    )}>
                                      <div className="flex items-center gap-2 mb-1.5">
                                        {isCorrectChoice ?
                                          <CheckCircle2 size={14} className="text-emerald-500" /> :
                                          <AlertCircle size={14} className="text-red-400" />
                                        }
                                        <span className={clsx(
                                          "font-bold uppercase text-[10px] tracking-widest",
                                          isCorrectChoice ? "text-emerald-600" : "text-red-500"
                                        )}>
                                          {isCorrectChoice ? "Tại sao đúng" : "Tại sao sai"}
                                        </span>
                                      </div>
                                      <div dangerouslySetInnerHTML={{ __html: renderBoldText(why) }} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation Card - Only show vocabulary for P2, full card for others */}
                          {parsedExplanation?.vocabulary && parsedExplanation.vocabulary.length > 0 && (
                            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mt-6">
                              <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center gap-2">
                                <BookOpen size={16} className="text-blue-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Từ vựng quan trọng</span>
                              </div>
                              <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {parsedExplanation.vocabulary.map((v: any, i: number) => (
                                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-sm">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-800 text-xs">{v.word}</span>
                                        <span className="text-[9px] text-slate-400 font-mono">{v.ipa}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 italic">{v.meaning}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Explanation Card - Hide for P1-P7 as they have per-option translations/explanations */}
                          {explanation && ![1, 2, 3, 4, 5, 6, 7].includes(currentGroup.part) && (
                            <div className="bg-slate-50 rounded-2xl shadow-sm border-t border-slate-100 overflow-hidden mt-6">
                              <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center gap-2">
                                <Info size={16} className="text-blue-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Giải thích chi tiết</span>
                              </div>
                              <div className="p-6">
                                {(() => {
                                  try {
                                    const cleanExp = explanation.replace(/_x000D_/g, '');
                                    const parsed = JSON.parse(cleanExp);
                                    return (
                                      <div className="space-y-6">
                                        {parsed.translation && (
                                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <p
                                              className="text-blue-900 text-sm font-medium leading-relaxed italic mt-1"
                                              dangerouslySetInnerHTML={{ __html: `<span class="text-blue-500 font-bold not-italic mr-2">Dịch câu:</span> ${renderBoldText(parsed.translation)}` }}
                                            />
                                          </div>
                                        )}

                                        {parsed.explanation?.options_breakdown && (
                                          <div className="space-y-4">
                                            {['A', 'B', 'C', 'D'].map(opt => {
                                              const details = parsed.explanation.options_breakdown[opt];
                                              if (!details) return null;
                                              const isCorrect = opt === (q.correctAnswer || parsed.correctAnswer);

                                              return (
                                                <div key={opt} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-100'}`}>
                                                  <div className="flex items-start gap-3">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                      {opt}
                                                    </span>
                                                    <div className="space-y-2">
                                                      <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-sm">{details.meaning}</span>
                                                        {details.ipa_us && <span className="text-[10px] text-slate-400 font-mono">/{details.ipa_us}/</span>}
                                                      </div>
                                                      <p
                                                        className={`text-slate-600 text-[11px] leading-relaxed border-l-2 pl-4 mt-2 ${isCorrect ? 'border-emerald-200' : 'border-slate-200'}`}
                                                        dangerouslySetInnerHTML={{
                                                          __html: `<span class="font-bold mr-1 ${isCorrect ? 'text-emerald-600' : 'text-slate-500'}">${isCorrect ? 'Tại sao đúng:' : 'Tại sao chưa đúng:'}</span> ${renderBoldText(details.reason)}`
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {/* Handle Part 6/7 Passage Translation */}
                                        {(parsed.passage?.vietnamese || parsed.vietnamese) && (
                                          <div className="space-y-4">
                                            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                                              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                                                {(() => {
                                                  const viIntro = (parsed.passage?.intro?.vietnamese?.[0]?.text || parsed.intro?.vietnamese?.[0]?.text || "").replace(/_x000D_/g, '');
                                                  const viBody = (parsed.passage?.vietnamese || parsed.vietnamese || [])
                                                    .map((v: any) => (v.text || "").replace(/_x000D_/g, ''))
                                                    .join(' ');
                                                  return (viIntro ? viIntro + "\n\n" : "") + viBody;
                                                })()}
                                              </p>
                                            </div>
                                          </div>
                                        )}

                                        {!parsed.explanation?.options_breakdown && !parsed.passage?.vietnamese && !parsed.vietnamese && (
                                          <p
                                            className="text-slate-700 text-sm leading-relaxed font-medium italic"
                                            dangerouslySetInnerHTML={{ __html: renderBoldText(cleanExp) }}
                                          />
                                        )}
                                      </div>
                                    );
                                  } catch (e) {
                                    return <p className="text-slate-700 text-sm leading-relaxed font-medium italic">{explanation.replace(/_x000D_/g, '')}</p>;
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Navigation Footer for Review */}
              <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-between px-6 z-30">
                <button
                  onClick={() => { setStep("result"); setCurrentGroupIdx(0); }}
                  className="px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-2"
                >
                  <ChevronLeft size={14} /> Quay lại bảng kết quả
                </button>

                <button
                  onClick={() => setShowQuestionSheet(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-semibold border border-slate-200 text-xs uppercase tracking-widest"
                >
                  <LayoutGrid size={18} />
                  <span>Bảng câu hỏi</span>
                </button>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentGroupIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentGroupIdx === 0}
                    className="px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentGroupIdx(prev => Math.min(totalGroups - 1, prev + 1))}
                    disabled={currentGroupIdx === totalGroups - 1}
                    className="px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getPartName(part: number) {
  const names: any = { 1: "Photographs", 2: "Question-Response", 3: "Short Conversations", 4: "Short Talks", 5: "Incomplete Sentences", 6: "Text Completion", 7: "Reading Comprehension" };
  return names[part] || "";
}

function getRecommendation(scaledScore: number) {
  if (scaledScore < 500) {
    return {
      title: "KHÓA CĂN BẢN 600+",
      desc: "Đây là lớp giúp người học hệ thống kiến thức trọng tâm và hướng dẫn kỹ năng làm bài cho từng Part."
    };
  }
  return {
    title: "LỚP GIẢI ĐỀ CHUYÊN SÂU",
    desc: "Lớp tập trung luyện giải và chữa đề thực chiến, phù hợp với các bạn đã có kiến thức nền."
  };
}

function renderBoldText(text: string) {
  if (!text) return "";
  // Process all types in one pass to avoid nested replacement issues
  return text.replace(/\*\*(.*?)\*\*|\((.*?)\)|"(.*?)"|'(.*?)'/g, (match, p1, p2, p3, p4) => {
    if (p1) return `<strong class="font-bold text-slate-900">${p1}</strong>`;
    if (p2) return `<strong class="font-bold text-slate-900">(${p2})</strong>`;
    if (p3) return `<strong class="font-bold text-slate-900">"${p3}"</strong>`;
    if (p4) return `<strong class="font-bold text-slate-900">'${p4}'</strong>`;
    return match;
  });
}

function formatPassage(input: any, isReview: boolean = false, evidenceMap: any = {}) {
  if (!input) return "";
  try {
    // Some Excel exports include _x000D_ for newlines, clean them up
    const cleanInput = typeof input === 'string' ? input.trim().replace(/_x000D_/g, '') : input;
    let data = (typeof cleanInput === 'string' && (cleanInput.startsWith('{') || cleanInput.startsWith('[')))
      ? JSON.parse(cleanInput)
      : input;

    let htmlPrefix = "";
    if (isReview) {
      htmlPrefix += `<style>
        [data-translation] { position: relative; }
        [data-translation]:hover::after {
          content: attr(data-translation);
          position: absolute;
          bottom: 110%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          z-index: 1000;
          width: 200px;
          white-space: normal;
          line-height: 1.4;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
          pointer-events: none;
          animation: fadeIn 0.2s ease-out;
          text-align: center;
          white-space: normal;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      </style>`;
    }

    // Normalize Part 6 structure if needed
    if (data && data.passage && !data.english) {
      data = { ...data, ...data.passage };
    }

    // Handle Part 7 / Part 6 Structure (passages with html_content)
    if (data && typeof data === 'object' && data.passages && Array.isArray(data.passages)) {
      let html = htmlPrefix;
      if (data.group_metadata && data.group_metadata.intro_text) {
        html += `<p class="text-slate-500 italic mb-8 text-lg font-bold border-b pb-4">${data.group_metadata.intro_text}</p>`;
      }
      data.passages.forEach((p: any) => {
        if (p.html_content) {
          let content = p.html_content;

          // Build translation_map if it's missing but vietnamese array exists (common in P6/P7)
          if (isReview && !p.translation_map && p.vietnamese && Array.isArray(p.vietnamese)) {
            p.translation_map = {};
            p.vietnamese.forEach((v: any) => {
              if (v.sentenceID && v.text) p.translation_map[v.sentenceID] = v.text;
            });
          }

          // Apply hover translations if translation_map exists
          if (isReview && p.translation_map) {
            Object.entries(p.translation_map).forEach(([sid, translation]: [string, any]) => {
              const cleanTranslation = typeof translation === 'string'
                ? translation
                    .replace(/<[^>]*>?/gm, '')
                    .replace(/\*\*/g, '')
                    .replace(/_x000D_/g, ' ')
                    .replace(/"/g, '&quot;')
                    .trim()
                : '';

              // Support any tag type (div, span, p, etc.) with data-sid
              const regex = new RegExp(`(<([a-zA-Z0-9]+)([^>]*)data-sid=['"]${sid}['"]([^>]*)>)(.*?)(</\\2>)`, 'g');

              content = content.replace(regex, (match: any, fullOpenTag: any, tagName: any, attrBefore: any, attrAfter: any, text: any, closeTag: any) => {
                const isNewTurn = text.trim().startsWith('<b>') || tagName === 'p';
                const displayClass = isNewTurn ? "block mt-3" : "inline";
                const allAttrs = (attrBefore + ` data-sid="${sid}" ` + attrAfter).trim();

                // Evidence Highlighting Logic with unique colors
                const ev = evidenceMap[sid];
                let extraClass = "";
                let badge = "";
                if (ev) {
                  const colors: any = {
                    yellow: { bg: "bg-yellow-100", border: "border-yellow-400", badge: "bg-yellow-500" },
                    green: { bg: "bg-emerald-100", border: "border-emerald-400", badge: "bg-emerald-500" },
                    blue: { bg: "bg-blue-100", border: "border-blue-400", badge: "bg-blue-500" },
                    purple: { bg: "bg-purple-100", border: "border-purple-400", badge: "bg-purple-500" },
                    orange: { bg: "bg-orange-100", border: "border-orange-400", badge: "bg-orange-500" },
                    pink: { bg: "bg-pink-100", border: "border-pink-400", badge: "bg-pink-500" }
                  };
                  const s = colors[ev.highlightColor?.toLowerCase()] || colors.yellow;
                  extraClass = ` ${s.bg} ${s.border} border-b-2 px-1 rounded-sm relative group/ev shadow-sm`;
                  badge = `<span class="absolute -top-7 left-0 ${s.badge} text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm z-50 font-bold pointer-events-none">${ev.questionNo}</span>`;
                }

                return `<${tagName} data-translation="${cleanTranslation}" class="hover:text-blue-700 hover:bg-blue-50 transition-all cursor-help border-b border-dotted border-blue-200 py-0.5 ${displayClass} ${extraClass}" ${allAttrs}>${badge}${text}</${tagName}>`;
              });
            });
          }
          html += `<div class="part7-content text-lg md:text-xl leading-relaxed">${content}</div>`;
        }
      });
      return html;
    }

    // Handle Part 3/4/6 Structure (english array or passages with html_content)
    if (data && typeof data === 'object' && data.english) {
      let html = htmlPrefix;

      // Build translation_map if it's missing but vietnamese array exists (common in P6)
      if (isReview && !data.translation_map && data.vietnamese && Array.isArray(data.vietnamese)) {
        data.translation_map = {};
        data.vietnamese.forEach((v: any) => {
          if (v.sentenceID && v.text) data.translation_map[v.sentenceID] = v.text;
        });
      }

      if (data.intro && data.intro.english && data.intro.english[0]) {
        const introText = (data.intro.english[0].text || "").replace(/_x000D_/g, '');
        html += `<p class="text-slate-500 italic mb-8 text-lg font-bold border-b pb-4">${introText}</p>`;
      }

      let currentParagraph = "";
      data.english.forEach((item: any) => {
        let text = (item.text || "").replace(/_x000D_/g, '');
        if (item.type === 'header') {
          if (currentParagraph) {
            html += `<p class="text-slate-700 text-justify text-base md:text-lg mb-4">${currentParagraph}</p>`;
            currentParagraph = "";
          }
          html += `<h5 class="text-center font-bold text-slate-900 mb-6 uppercase tracking-tight underline decoration-blue-200 underline-offset-4 text-xl">${text}</h5>`;
        } else {
          let maskedText = text;
          if (isReview) {
            // Highlight inserted answers in Review mode
            maskedText = maskedText.replace(/\*\*(.*?)\*\*/g, '<strong class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 mx-0.5">$1</strong>');

            // Highlight question numbers (e.g. <sup>131</sup>)
            maskedText = maskedText.replace(/<sup>(\d+)<\/sup>/g, '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold mx-1 align-middle shadow-sm">$1</span>');

            // Apply hover translation if mapping exists
            if (item.sentenceID && data.translation_map && data.translation_map[item.sentenceID]) {
              const translation = (data.translation_map[item.sentenceID] || "")
                .replace(/<[^>]*>?/gm, '')
                .replace(/\*\*/g, '')
                .replace(/_x000D_/g, ' ')
                .replace(/"/g, '&quot;')
                .trim();
              const isNewTurn = text.trim().startsWith('<b>');
              const displayClass = isNewTurn ? "block mt-3" : "inline";

              maskedText = `<div data-translation="${translation}" class="hover:text-blue-700 hover:bg-blue-50 transition-all cursor-help border-b border-dotted border-blue-200 py-0.5 ${displayClass}">${maskedText}</div>`;
            }
          } else {
            maskedText = maskedText.replace(/<sup>(\d+)<\/sup>\s*\*\*.*?\*\*/g, "<strong>($1)</strong> _______");
            maskedText = maskedText.replace(/\*\*(.*?)\*\*/g, "_______");
          }

          if (item.is_new_paragraph && currentParagraph) {
            html += `<p class="text-slate-700 text-justify text-base md:text-lg mb-4">${currentParagraph}</p>`;
            currentParagraph = maskedText;
          } else {
            // If it's a div (hover translation), don't add space if it's a new turn
            const space = (currentParagraph && !maskedText.includes('class="block')) ? " " : "";
            currentParagraph += space + maskedText;
          }
        }
      });
      if (currentParagraph) {
        html += `<p class="text-slate-700 text-justify text-base md:text-lg">${currentParagraph}</p>`;
      }
      return html;
    }

    if (typeof input === 'string') {
      let formatted = input;
      if (isReview) {
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      } else {
        formatted = formatted.replace(/<sup>(\d+)<\/sup>\s*\*\*.*?\*\*/g, "<strong>($1)</strong> _______");
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, "_______");
      }
      formatted = formatted.replace(/<sup>(\d+)<\/sup>/g, "<strong>($1)</strong>");
      return formatted;
    }
    return "";
  } catch (e) {
    return typeof input === 'string' ? input : "";
  }
}



