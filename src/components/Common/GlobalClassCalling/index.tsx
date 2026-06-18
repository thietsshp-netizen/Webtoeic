"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CalendarCheck, X, Play, Users, Shuffle, RotateCcw, GripVertical, Calendar, Loader2, Minimize2, Maximize2, Mic, MicOff } from "lucide-react";
import { clsx } from "clsx";

export const GlobalClassCalling: React.FC = () => {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // States
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [classes, setClasses] = useState<{ code: string; sessionCount: number }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [presentStudents, setPresentStudents] = useState<any[]>([]);
  const [callingStudentId, setCallingStudentId] = useState<string | null>(null);
  const lastLocalUpdate = useRef<number>(0);
  
  const toggleMuteStudent = async (studentId: string) => {
    if (!activeSession) return;
    const targetStudent = presentStudents.find(s => s.id === studentId);
    if (!targetStudent) return;
    const nextMuteState = !targetStudent.isMuted;

    setPresentStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, isMuted: nextMuteState };
      }
      return s;
    }));

    try {
      await fetch("/api/admin/classes/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          targetUserId: studentId,
          isMuted: nextMuteState
        })
      });
    } catch (e) {
      console.error("Lỗi cập nhật mic học viên:", e);
    }
  };
  
  // States for attendance controls
  const [sessionTitleInput, setSessionTitleInput] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Throttling state for Enter key
  const isThrottled = useRef(false);

  // Position state for Draggable Widget
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // States for searchable class dropdown
  const [showClassList, setShowClassList] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const classSelectRef = useRef<HTMLDivElement>(null);

  // Click outside to close searchable class dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classSelectRef.current && !classSelectRef.current.contains(e.target as Node)) {
        setShowClassList(false);
        setClassSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Fetch trạng thái buổi học đang hoạt động của lớp được chọn (Khai báo trước để dùng trong useEffect)
  const fetchActiveSession = useCallback(async (classCode: string) => {
    if (!classCode) return;
    // Ngăn chặn ghi đè nếu vừa cập nhật tại client trong vòng 2.5 giây qua
    if (Date.now() - lastLocalUpdate.current < 2500) return;

    try {
      const res = await fetch(`/api/admin/classes/sessions?classCode=${classCode}`);
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        // Tìm buổi học đang hoạt động (isActive = true) hoặc buổi mới nhất
        const active = data.sessions.find((s: any) => s.isActive) || data.sessions[0];
        // Nếu có buổi active hoặc có buổi học gần nhất, ta hiển thị buổi học đó
        if (active) {
          setActiveSession(active);
          // Lấy danh sách học viên đã điểm danh
          const students = active.attendances.map((a: any) => ({
            ...a.user,
            speakCount: a.speakCount || 0,
            isMuted: !!a.isMuted
          }));
          setPresentStudents(students);

          // Cập nhật người đang phát biểu từ DB
          setCallingStudentId(active.callingStudentId || null);
        } else {
          setActiveSession(null);
          setPresentStudents([]);
          setCallingStudentId(null);
        }
      } else {
        setActiveSession(null);
        setPresentStudents([]);
        setCallingStudentId(null);
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin buổi dạy:", err);
    }
  }, []);

  // 2. Fetch danh sách các lớp học hiện có và khôi phục lớp chọn cũ từ localStorage
  useEffect(() => {
    if (!isAdmin) return;

    fetch("/api/admin/enrollments")
      .then(res => res.json())
      .then(data => {
        if (data.classes) {
          setClasses(data.classes);
          
          const classCodes = data.classes.map((c: any) => c.code);
          if (data.activeClassCode && classCodes.includes(data.activeClassCode)) {
            setSelectedClass(data.activeClassCode);
            fetchActiveSession(data.activeClassCode);
          } else {
            const savedClass = localStorage.getItem("webtoeic_selected_class");
            if (savedClass && classCodes.includes(savedClass)) {
              setSelectedClass(savedClass);
              fetchActiveSession(savedClass);
            } else if (classCodes.length > 0) {
              setSelectedClass(classCodes[0]);
              fetchActiveSession(classCodes[0]);
            }
          }
        }
      })
      .catch(err => console.error("Lỗi lấy danh sách lớp học:", err));
  }, [isAdmin, fetchActiveSession]);

  // Poll dữ liệu điểm danh mỗi 3 giây khi widget đang mở và lớp học được chọn
  useEffect(() => {
    if (!isAdmin || !isOpen || !selectedClass) return;

    fetchActiveSession(selectedClass);
    const interval = setInterval(() => {
      fetchActiveSession(selectedClass);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAdmin, isOpen, selectedClass, fetchActiveSession]);

  // Sinh tiêu đề buổi học mặc định
  const getDefaultSessionTitle = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `Buổi học ngày ${dd}/${mm}/${yyyy}`;
  };

  // Tạo buổi học mới và mở điểm danh
  const handleStartSession = async () => {
    const title = (sessionTitleInput || getDefaultSessionTitle()).trim();
    if (!selectedClass || !title) return;
    setIsCreatingSession(true);
    try {
      const res = await fetch("/api/admin/classes/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode: selectedClass,
          title
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạo buổi học");

      setSessionTitleInput("");
      setShowCreateForm(false);
      await fetchActiveSession(selectedClass);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Thay đổi trạng thái điểm danh (Khóa / Mở)
  const handleToggleAttendance = async () => {
    if (!activeSession) return;
    const newActiveState = !activeSession.isActive;
    try {
      const res = await fetch("/api/admin/classes/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          isActive: newActiveState
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật trạng thái");

      setActiveSession((prev: any) => prev ? { ...prev, isActive: newActiveState } : null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 3. Logic chọn học viên tiếp theo (Next Student) - Xử lý ngay tại Client trước để tạo trải nghiệm mượt mà
  const handleCallStudent = useCallback(async (index: number) => {
    if (!activeSession || presentStudents.length === 0) return;

    let targetIdx = index;
    if (targetIdx < 0 || targetIdx >= presentStudents.length) {
      targetIdx = 0; // Quay lại từ đầu
    }

    const student = presentStudents[targetIdx];
    
    // Ghi nhận thời gian cập nhật nội bộ để chặn polling ghi đè
    lastLocalUpdate.current = Date.now();
    setCallingStudentId(student.id);

    // Cập nhật số lần phát biểu cục bộ ngay lập tức để có phản hồi UI nhanh chóng
    setPresentStudents(prev => prev.map((s, idx) => {
      if (idx === targetIdx) {
        return { ...s, speakCount: (s.speakCount || 0) + 1 };
      }
      return s;
    }));

    // Phát âm thanh tiếng chuông "tong tong" bằng Web Audio API
    if (typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const ctx = new AudioContextClass();
          const triggerChime = (time: number, freq: number) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const overtone = ctx.createOscillator();
            const overtoneGain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, time);

            overtone.type = "sine";
            overtone.frequency.setValueAtTime(freq * 2, time);

            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.25, time + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

            overtoneGain.gain.setValueAtTime(0, time);
            overtoneGain.gain.linearRampToValueAtTime(0.08, time + 0.01);
            overtoneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

            osc.connect(gainNode);
            overtone.connect(overtoneGain);
            gainNode.connect(ctx.destination);
            overtoneGain.connect(ctx.destination);

            osc.start(time);
            overtone.start(time);
            osc.stop(time + 0.9);
            overtone.stop(time + 0.9);
          };

          const now = ctx.currentTime;
          // Tiếng chuông thứ nhất "tong" (Tone cao hơn - A5: 880Hz)
          triggerChime(now, 880);
          // Tiếng chuông thứ hai "tong" (Tone thấp hơn chút - G5: 784Hz) sau 150ms
          triggerChime(now + 0.15, 784);
        } catch (err) {
          console.error("Lỗi phát chuông:", err);
        }
      }
    }

    // Gửi ID đã chọn lên API để lưu vào DB ngầm
    try {
      await fetch("/api/admin/classes/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          callingStudentId: student.id
        })
      });
    } catch (e) {
      console.error("Lỗi cập nhật người phát biểu:", e);
    }
  }, [activeSession, presentStudents]);

  // Helper tính toán và lấy index học viên tiếp theo theo thuật toán thông minh
  const getSmartNextStudentIndex = useCallback(() => {
    if (presentStudents.length === 0) return -1;
    
    const activeStudents = presentStudents.filter(s => !s.isMuted);
    if (activeStudents.length === 0) return -1;
    if (activeStudents.length === 1) {
      return presentStudents.findIndex(p => p.id === activeStudents[0].id);
    }

    const candidates = activeStudents.map((s) => ({
      ...s,
      originalIndex: presentStudents.findIndex(p => p.id === s.id)
    }));
    
    // Loại trừ người đang phát biểu hiện tại nếu lớp học có nhiều hơn 1 học viên không bị tắt mic
    const eligibleCandidates = candidates.filter(c => c.id !== callingStudentId);
    const finalCandidates = eligibleCandidates.length > 0 ? eligibleCandidates : candidates;
    
    // Tìm speakCount nhỏ nhất trong số các ứng viên
    const minSpeakCount = Math.min(...finalCandidates.map(c => c.speakCount));
    
    // Lọc các ứng viên có số lần phát biểu ít nhất
    const bestCandidates = finalCandidates.filter(c => c.speakCount === minSpeakCount);
    
    // Chọn ngẫu nhiên một người trong số các ứng viên tốt nhất để tạo sự công bằng và bất ngờ
    const randIdx = Math.floor(Math.random() * bestCandidates.length);
    return bestCandidates[randIdx].originalIndex;
  }, [presentStudents, callingStudentId]);

  // Gọi người tiếp theo
  const handleNextStudent = useCallback(() => {
    const nextIdx = getSmartNextStudentIndex();
    if (nextIdx !== -1) {
      handleCallStudent(nextIdx);
    }
  }, [getSmartNextStudentIndex, handleCallStudent]);

  // Gọi ngẫu nhiên (áp dụng thuật toán công bằng)
  const handleRandomStudent = () => {
    handleNextStudent();
  };

  // Lấy thông tin học viên tiếp theo dự kiến hiển thị lên UI preview
  const getNextStudentPreview = () => {
    const activeStudents = presentStudents.filter(s => !s.isMuted);
    if (activeStudents.length === 0) return null;
    if (activeStudents.length === 1) return activeStudents[0];

    const eligibleCandidates = activeStudents.filter(s => s.id !== callingStudentId);
    const finalCandidates = eligibleCandidates.length > 0 ? eligibleCandidates : activeStudents;
    const minSpeakCount = Math.min(...finalCandidates.map(s => s.speakCount));
    const bestCandidates = finalCandidates.filter(s => s.speakCount === minSpeakCount);
    
    return bestCandidates[0];
  };

  const nextStudentPreview = getNextStudentPreview();

  // Đặt lại lượt gọi (Xóa người đang phát biểu)
  const handleResetCalling = async () => {
    if (!activeSession) return;
    lastLocalUpdate.current = Date.now();
    setCallingStudentId(null);
    try {
      await fetch("/api/admin/classes/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          clearCalling: true
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Lắng nghe phím tắt Enter toàn cục (Chỉ chạy khi Widget đang hiển thị)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !activeSession || presentStudents.length === 0) return;

      // Kiểm tra xem tiêu điểm gõ chữ có đang nằm trong thẻ nhập liệu nào không
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        const isContentEditable = 
          activeEl.hasAttribute("contenteditable") || 
          (activeEl as HTMLElement).isContentEditable === true;
        if (tagName === "input" || tagName === "textarea" || isContentEditable) {
          return; // Bỏ qua không kích hoạt phím tắt gọi tên
        }
      }

      if (e.key === "Enter") {
        e.preventDefault();
        
        // Throttling phím Enter để ngăn bấm đúp liên tục gây lag
        if (isThrottled.current) return;
        isThrottled.current = true;
        setTimeout(() => {
          isThrottled.current = false;
        }, 500);

        handleNextStudent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeSession, presentStudents, handleNextStudent]);

  // 5. Logic Kéo Thả (Draggable) của Widget
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    // Bỏ qua kéo thả nếu bấm nhầm vào input, select dropdown hoặc các nút button
    if (tagName === "input" || tagName === "select" || target.closest("button")) {
      return;
    }

    e.preventDefault(); // Chặn bôi đen chữ & hành vi kéo mặc định của trình duyệt gây đơ
    if (widgetRef.current) {
      isDragging.current = true;
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 300, newX)),
      y: Math.max(0, Math.min(window.innerHeight - 80, newY))
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Nếu không phải Admin, không kết xuất bất kỳ cái gì
  if (!isAdmin) return null;

  return (
    <>
      {/* Nút kích hoạt nổi ở góc trên bên phải, cạnh nút Draw */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          top: "14px",
          right: "62px",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          borderRadius: "9999px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          background: isOpen ? "rgba(37, 99, 235, 0.95)" : "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: isOpen ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
          cursor: "pointer",
          boxShadow: isOpen 
            ? "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px rgba(37, 99, 235, 0.4)" 
            : "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          userSelect: "none"
        }}
        title={isOpen ? "Ẩn bảng điểm danh & gọi học viên" : "Bật bảng điểm danh & gọi học viên phát biểu"}
        className="hover:scale-105 active:scale-95 hover:text-white"
      >
        {isOpen ? <X size={18} /> : <CalendarCheck size={18} />}
      </button>

      {/* Widget gọi tên nổi (Chỉ hiển thị khi bấm nút kích hoạt) */}
      {isOpen && (
        <div
          ref={widgetRef}
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          onKeyDown={(e) => e.stopPropagation()}
          className={clsx(
            "fixed z-[99998] bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl select-none transition-[width,padding,border-radius] duration-200",
            isMinimized ? "w-[300px] p-3 rounded-2xl" : "w-[350px] p-5 rounded-3xl"
          )}
        >
          {isMinimized ? (
            /* Layout khi thu nhỏ tối giản */
            <div className="flex items-center gap-2.5 cursor-move animate-in fade-in zoom-in-95 duration-200" onMouseDown={handleMouseDown}>
              <GripVertical size={14} className="text-white/30 shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                {/* Dòng 1: Học viên đang phát biểu */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mic size={13} className="text-indigo-400 shrink-0 animate-pulse" />
                  {(() => {
                    const currentStudent = presentStudents.find(s => s.id === callingStudentId);
                    const nameText = currentStudent ? currentStudent.displayName || currentStudent.name || "Chưa đặt tên" : "CHƯA GỌI";
                    return (
                      <span 
                        title={nameText}
                        className="text-xs font-black text-white uppercase italic truncate flex-1 min-w-0"
                      >
                        {nameText}
                      </span>
                    );
                  })()}
                </div>
                {/* Dòng 2: Học viên tiếp theo */}
                <div className="flex items-center gap-1 text-[9px] text-white/40 font-bold pl-[19.5px] min-w-0">
                  <span className="shrink-0">TIẾP THEO:</span>
                  <span className="truncate flex-1 italic text-white/60 uppercase">
                    {nextStudentPreview 
                      ? nextStudentPreview.displayName || nextStudentPreview.name || "Chưa đặt tên" 
                      : "Hết lượt (Quay lại đầu)"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition shrink-0"
                title="Mở rộng bảng điều khiển"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          ) : (
            /* Layout đầy đủ */
            <>
              {/* Header & Drag Grip */}
              <div 
                onMouseDown={handleMouseDown}
                className="flex items-center gap-2 pb-3 border-b border-white/10 cursor-move"
              >
                <GripVertical size={16} className="text-white/30 shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none block">Điểm Danh & Gọi Tên</span>
                  <span className="text-[10px] text-white/50 font-medium">Bấm giữ để di chuyển thanh</span>
                </div>
                
                {/* Nút Thu Nhỏ */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 hover:bg-white/10 text-white/60 hover:text-white rounded transition mr-1"
                  title="Thu nhỏ thanh gọi tên"
                >
                  <Minimize2 size={14} />
                </button>

                {/* Searchable Select Chọn Lớp */}
                <div ref={classSelectRef} className="relative z-[10000]">
                  <input
                    type="text"
                    value={showClassList ? classSearch : selectedClass}
                    placeholder="Tìm lớp..."
                    onFocus={() => {
                      setShowClassList(true);
                      setClassSearch("");
                    }}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="text-[10px] font-bold text-indigo-300 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer w-[145px] placeholder-indigo-300/40 text-left truncate"
                    title="Tìm và chọn lớp học"
                  />
                  {showClassList && (
                    <div className="absolute right-0 mt-1 w-[220px] max-h-[180px] overflow-y-auto bg-slate-800/95 border border-white/10 rounded-xl shadow-xl z-[10001] no-scrollbar py-1">
                      {classes.filter(c => c.code.toLowerCase().includes(classSearch.toLowerCase())).length > 0 ? (
                        classes
                          .filter(c => c.code.toLowerCase().includes(classSearch.toLowerCase()))
                          .map(c => (
                            <button
                              key={c.code}
                              onClick={() => {
                                setSelectedClass(c.code);
                                localStorage.setItem("webtoeic_selected_class", c.code);
                                fetchActiveSession(c.code);
                                setShowClassList(false);
                                setClassSearch("");
                              }}
                              className={clsx(
                                "w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-colors truncate block",
                                c.code === selectedClass ? "text-indigo-400 bg-white/5" : "text-white"
                              )}
                            >
                              {c.code} ({c.sessionCount} buổi)
                            </button>
                          ))
                      ) : (
                        <div className="px-3 py-2 text-[10px] text-white/40 italic">Không tìm thấy lớp</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quản lý Buổi học & Điểm danh trực tiếp */}
              <div className="mt-3 pb-3 border-b border-white/10 space-y-2">
                {activeSession ? (
                  <div className="bg-white/5 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate flex-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">BUỔI DẠY HIỆN TẠI</span>
                        <span className="text-xs font-bold text-white italic truncate block" title={activeSession.title}>
                          {activeSession.title}
                        </span>
                      </div>
                      <span className={clsx(
                        "shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                        activeSession.isActive 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {activeSession.isActive ? "Đang mở" : "Đã khóa"}
                      </span>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={handleToggleAttendance}
                        className={clsx(
                          "flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border",
                          activeSession.isActive
                            ? "bg-rose-600/10 border-rose-500/20 text-rose-400 hover:bg-rose-600/20"
                            : "bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20"
                        )}
                      >
                        {activeSession.isActive ? "Khóa điểm danh" : "Mở điểm danh"}
                      </button>
                      <button
                        onClick={() => {
                          setSessionTitleInput(getDefaultSessionTitle());
                          setShowCreateForm(!showCreateForm);
                        }}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-white/5"
                        title="Tạo buổi học mới cho lớp"
                      >
                        Tạo buổi mới
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3 text-center">
                    <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2">Chưa mở điểm danh</p>
                    {!showCreateForm && (
                      <button
                        onClick={() => {
                          setSessionTitleInput(getDefaultSessionTitle());
                          setShowCreateForm(true);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        MỞ ĐIỂM DANH NGAY
                      </button>
                    )}
                  </div>
                )}

                {/* Form nhập tạo buổi mới */}
                {showCreateForm && (
                  <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-3 space-y-2.5">
                    <div>
                      <label className="block text-[8px] font-black text-indigo-300 uppercase tracking-wider mb-1">TÊN BUỔI HỌC MỚI</label>
                      <input
                        type="text"
                        placeholder="Nhập tên buổi..."
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-xs font-bold text-white"
                        value={sessionTitleInput}
                        onChange={(e) => setSessionTitleInput(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleStartSession}
                        disabled={isCreatingSession}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        {isCreatingSession ? "ĐANG TẠO..." : "XÁC NHẬN MỞ"}
                      </button>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-white/5"
                      >
                        HỦY
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Nội dung điểm danh & gọi tên */}
              <div className="py-3 space-y-3">
                {activeSession ? (
                  presentStudents.length > 0 ? (
                    <div className="space-y-3">
                      {/* Học viên hiện tại */}
                      <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 text-center relative overflow-hidden">
                        {(() => {
                          const currentStudent = presentStudents.find(s => s.id === callingStudentId);
                          return (
                            <>
                              <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex justify-center items-center gap-1.5">
                                <span>ĐANG PHÁT BIỂU</span>
                                {currentStudent && (
                                  <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                    {currentStudent.speakCount || 0} LẦN
                                  </span>
                                )}
                              </div>
                              <div 
                                title={currentStudent ? currentStudent.displayName || currentStudent.name || "Chưa đặt tên" : "CHƯA GỌI"}
                                className="text-2xl font-black text-indigo-300 uppercase italic tracking-tight px-2 break-words leading-tight"
                              >
                                {currentStudent ? currentStudent.displayName || currentStudent.name || "Chưa đặt tên" : "CHƯA GỌI"}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Học viên tiếp theo */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs">
                        <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">TIẾP THEO GỢI Ý:</span>
                        <span className="text-white font-black italic truncate max-w-[200px] text-right">
                          {nextStudentPreview 
                            ? `${nextStudentPreview.displayName || nextStudentPreview.name || "Chưa đặt tên"} (${nextStudentPreview.speakCount || 0} lần)` 
                            : "Hết lượt (Quay lại từ đầu)"}
                        </span>
                      </div>

                      {/* Thống kê sĩ số */}
                      <div className="flex items-center justify-between text-[10px] text-white/30 font-bold px-1">
                        <div className="flex items-center gap-1.5">
                          <Users size={12} />
                          <span>ĐÃ CÓ MẶT: {presentStudents.length} học viên</span>
                        </div>
                      </div>

                      {/* Danh sách học viên có thể cuộn */}
                      <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 border border-white/5 bg-white/5 rounded-2xl p-2.5 no-scrollbar">
                        {presentStudents.map((s) => {
                          const isMuted = !!s.isMuted;
                          const displayName = s.displayName || s.name || "Chưa đặt tên";
                          const isCurrent = s.id === callingStudentId;
                          return (
                            <div 
                              key={s.id} 
                              className={clsx(
                                "flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl transition-all",
                                isCurrent 
                                  ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-200" 
                                  : "hover:bg-white/5 text-white/70"
                              )}
                            >
                              <span 
                                title={displayName}
                                className={clsx(
                                  "text-[11px] font-bold truncate flex-1",
                                  isMuted ? "text-white/20 line-through italic" : "text-white/80"
                                )}
                              >
                                {displayName} <span className="text-[9px] opacity-40 font-normal">({s.speakCount || 0} lần)</span>
                              </span>
                              <button
                                onClick={() => toggleMuteStudent(s.id)}
                                className={clsx(
                                  "p-1 rounded-lg transition-all",
                                  isMuted 
                                    ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" 
                                    : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                )}
                                title={isMuted ? "Bật lại mic cho học viên này" : "Tắt mic học viên này"}
                              >
                                {isMuted ? <MicOff size={11} /> : <Mic size={11} />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-white/40 text-xs italic flex flex-col items-center gap-2">
                      <Users size={24} className="opacity-30" />
                      <span>Buổi học chưa có học viên nào điểm danh.</span>
                    </div>
                  )
                ) : (
                  <div className="py-6 text-center text-white/40 text-xs italic flex flex-col items-center gap-2">
                    <Calendar size={24} className="opacity-30" />
                    <span>Không tìm thấy buổi học nào đang mở.</span>
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              {activeSession && presentStudents.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={handleNextStudent}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    title="Gọi người tiếp theo (Phím Enter)"
                  >
                    <Play size={12} fill="currentColor" /> ENTER
                  </button>
                  <button
                    onClick={handleRandomStudent}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/5"
                    title="Chọn ngẫu nhiên 1 học viên bất kỳ"
                  >
                    <Shuffle size={12} /> RANDOM
                  </button>
                  <button
                    onClick={handleResetCalling}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/5"
                    title="Đặt lại lượt gọi về từ đầu"
                  >
                    <RotateCcw size={12} /> RESET
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};
