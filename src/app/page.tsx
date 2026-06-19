"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { clsx } from "clsx";
import CourseCard from "@/components/Course/CourseCard";
import PlacementTest from "@/components/PlacementTest/PlacementTest";
import VocabGuideModal, { VocabGuideContent } from "@/components/Vocab/VocabGuideModal";
import FloatingMessenger from "@/components/UI/FloatingMessenger";
import { speakVocab } from "@/lib/vocab-audio";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";



// --- IMPORT SWIPER ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  Clock,
  Search,
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  Settings,
  ChevronRight,
  TrendingUp,
  Eye,
  GraduationCap,
  Trophy,
  Star,
  Layout,
  LogOut,
  User,
  ShieldCheck,
  Flame,
  Award,
  Users,
  Zap,
  Mic,
  MicOff,
  Target,
  Check,
  X,
  KeyRound,
  UserCircle2,
  Flag,
  Headphones,
  MessageSquare,
  FileText,
  Languages,
  Play,
  Info,
  Volume2,
  Link2,
  Replace,
  Layers,
  Shuffle,
  PenLine,
  Lightbulb,
  History,
  Calendar,
  HelpCircle,
  Gamepad2,
  XCircle,
  EyeOff,
  Lock,
  Compass
} from "lucide-react";

import { ScrambleGame, FillGame, MatchGame, SynonymGame, VocabWord } from "@/components/Vocab/VocabGamePlayer";
import DeviceManagement from "@/components/Account/DeviceManagement";
import { startVocabTour } from "@/components/Toeic/toeicTour";

function HomeContent() {
  const { data: session, status, update } = useSession() as any;
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // --- STATES QUẢN LÝ GIAO DIỆN ---
  const [activeTab, setActiveTab] = useState<string>("courses");

  // --- STATES QUẢN LÝ ĐĂNG NHẬP (CREDENTIALS) TRÊN DASHBOARD CHƯA LOGIN ---
  const [dashEmail, setDashEmail] = useState("");
  const [dashPassword, setDashPassword] = useState("");
  const [dashShowPassword, setDashShowPassword] = useState(false);
  const [dashIsLoading, setDashIsLoading] = useState(false);
  const [dashShowCredentials, setDashShowCredentials] = useState(false);
  const [dashError, setDashError] = useState("");

  const ERROR_MESSAGES: Record<string, string> = {
    OAuthAccountNotLinked: "Email này không được phép đăng nhập theo cách này.",
    CredentialsSignin:     "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.",
    SessionRequired:       "Bạn cần đăng nhập để tiếp tục.",
    Default:               "Đã xảy ra lỗi, vui lòng thử lại sau.",
  };

  const handleDashboardCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDashIsLoading(true);
    setDashError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: dashEmail,
        password: dashPassword,
        callbackUrl: "/?tab=dashboard",
      });

      if (res?.error) {
        setDashError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.Default);
      } else {
        window.location.href = "/?tab=dashboard";
      }
    } catch (err) {
      setDashError("Đã xảy ra lỗi hệ thống, vui lòng thử lại.");
    } finally {
      setDashIsLoading(false);
    }
  };
  const [dashTab, setDashTab] = useState<string>("courses");
  // Attendance States
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [isMutedCheck, setIsMutedCheck] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [vocabMode, setVocabMode] = useState<string>("library");
  const [vocabFilter, setVocabFilter] = useState<"all" | "unlearned" | "review">("all");
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loadingMyCourses, setLoadingMyCourses] = useState(false);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [myStats, setMyStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [myVocab, setMyVocab] = useState<any[]>([]);
  const [loadingVocab, setLoadingVocab] = useState(false);
  const [globalFlip, setGlobalFlip] = useState<"front" | "back" | null>(null);
  const [showVocabGuide, setShowVocabGuide] = useState(false);
  const [showReviewGuide, setShowReviewGuide] = useState(false);
  const [hasClosedReviewGuide, setHasClosedReviewGuide] = useState(false);
  const [hasClosedVocabGuide, setHasClosedVocabGuide] = useState(false);

  // Dashboard Sidebar States
  const [collapsed, setCollapsed] = useState(false);
  const [showPlacementTest, setShowPlacementTest] = useState(false);

  // --- SETTINGS MODAL ---
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDisplayName, setSettingsDisplayName] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState("");
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [showSettingsConfirmPassword, setShowSettingsConfirmPassword] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsDone, setSettingsDone] = useState(false);
  const [detailPart, setDetailPart] = useState<any>(null);

  const isSettingsInitialized = useRef(false);
  useEffect(() => {
    if (session?.user && !isSettingsInitialized.current) {
      setSettingsDisplayName(session.user.name || "");
      isSettingsInitialized.current = true;
    }
  }, [session]);

  // --- QUẢN LÝ ẢNH & MOUNTED ---
  const [scoreImages, setScoreImages] = useState<any[]>([]);
  const [feedbackImages, setFeedbackImages] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // 1. useEffect KHỞI TẠO & FETCH GALLERY (SUPABASE)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setCollapsed(true);
    }

    const fetchGallery = async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = "https://lvbdcqoagtrzvnaeeznm.supabase.co";
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

        if (!supabaseKey) return;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const bucket = 'marketing';
        const baseUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}`;

        const { data: scoreData } = await supabase.storage.from(bucket).list('bang-diem');
        if (scoreData) {
          const sortedScores = scoreData
            .filter((f: any) => f.name !== '.emptyKeep')
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
            .map((f: any) => ({ id: f.id, url: `${baseUrl}/bang-diem/${f.name}` }));
          setScoreImages(sortedScores);
        }

        const { data: feedbackData } = await supabase.storage.from(bucket).list('cam-nhan');
        if (feedbackData) {
          const sortedFeedback = feedbackData
            .filter((f: any) => f.name !== '.emptyKeep')
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
            .map((f: any) => ({ id: f.id, url: `${baseUrl}/cam-nhan/${f.name}` }));
          setFeedbackImages(sortedFeedback);
        }
      } catch (error) {
        console.error("Lỗi lấy ảnh từ Supabase:", error);
      }
    };

    fetchGallery();
  }, []);

  // 2. useEffect ĐỒNG BỘ TAB THEO URL
  useEffect(() => {
    if (pathname === "/courses") {
      setActiveTab("courses");
    } else {
      const tab = searchParams.get("tab");
      setActiveTab(tab || "intro");
    }
  }, [pathname, searchParams]);

  // 3. useEffect FETCH DANH SÁCH KHÓA HỌC (PUBLIC)
  useEffect(() => {
    if (activeTab === "courses") {
      setLoadingCourses(true);
      fetch("/api/courses")
        .then(res => res.json())
        .then(data => { if (data.success) setCourses(data.courses); })
        .catch(err => console.error(err))
        .finally(() => setLoadingCourses(false));
    }
  }, [activeTab]);

  const fetchAttendanceStats = useCallback(async (isInitial = false) => {
    setAttendanceError("");
    if (isInitial) {
      setLoadingAttendance(true);
    }
    try {
      const res = await fetch(`/api/classes/attendance/stats?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
      if (res.status === 401) {
        setAttendanceData(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải dữ liệu điểm danh");
      setAttendanceData(data);
    } catch (err: any) {
      console.error(err);
      setAttendanceError(err.message);
    } finally {
      if (isInitial) {
        setLoadingAttendance(false);
      }
    }
  }, []);

  // 4. useEffect FETCH DỮ LIỆU DASHBOARD (PRIVATE)
  useEffect(() => {
    if (activeTab === "dashboard" && status === "authenticated") {
      setLoadingMyCourses(true);
      fetch("/api/me/courses")
        .then(res => res.json())
        .then(data => { if (data.success) setMyCourses(data.courses); })
        .catch(err => console.error(err))
        .finally(() => setLoadingMyCourses(false));

      setLoadingStats(true);
      fetch("/api/me/stats")
        .then(res => res.json())
        .then(data => { if (data.success) setMyStats(data); })
        .catch(err => console.error(err))
        .finally(() => setLoadingStats(false));

      setLoadingHistory(true);
      fetch("/api/me/full-test-attempts")
        .then(res => res.json())
        .then(data => { if (data.success) setMyHistory(data.history); })
        .catch(err => console.error(err))
        .finally(() => setLoadingHistory(false));

      setLoadingVocab(true);
      fetch(`/api/user-vocabulary?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMyVocab(data.filter((v: any) => v.isStarred));
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingVocab(false));

      fetchAttendanceStats(true);
    }
  }, [activeTab, status, fetchAttendanceStats]);

  // Polling cho trạng thái điểm danh học viên
  useEffect(() => {
    if (activeTab === "dashboard" && status === "authenticated" && dashTab === "attendance") {
      fetchAttendanceStats();
      const interval = setInterval(() => {
        fetchAttendanceStats();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab, status, dashTab, fetchAttendanceStats]);



  // Global vocabulary update listener
  const fetchVocab = useCallback(() => {
    if (status === "authenticated") {
      setLoadingVocab(true);
      fetch(`/api/user-vocabulary?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMyVocab(data.filter((v: any) => v.isStarred));
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingVocab(false));
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      window.addEventListener('vocab-updated', fetchVocab);
      return () => window.removeEventListener('vocab-updated', fetchVocab);
    }
  }, [status, fetchVocab]);

  const handleSRSUpdate = useCallback(async (word: string, definition: string, isCorrect: boolean) => {
    // Tìm ID của từ dựa trên word và definition trong myVocab
    const vocabItem = myVocab.find(v => 
      v.word.trim().toLowerCase() === word.trim().toLowerCase() && 
      v.definition.trim().toLowerCase() === definition.trim().toLowerCase()
    );
    
    const wordId = vocabItem?.id;
    if (!wordId) return;

    try {
      const res = await fetch("/api/vocab/srs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId, isCorrect }),
      });
      if (res.ok) {
        const { updated } = await res.json();
        setMyVocab(prev => prev.map(v => v.id === wordId ? { ...v, ...updated } : v));
      }
    } catch (err) {
      console.error("SRS Update failed:", err);
    }
  }, [myVocab]);

  // Auto-trigger guides for new users
  useEffect(() => {
    // Tự động ẩn hướng dẫn dạng modal (vì giờ đã có bản inline)
  }, [dashTab, loadingStats, myStats, hasClosedReviewGuide]);

  useEffect(() => {
    // Nếu có từ vựng thì mặc định ẩn hướng dẫn đi
    if (myVocab.length > 0) {
      setShowVocabGuide(false);
    }
  }, [dashTab, myVocab.length, hasClosedVocabGuide]);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  if (!mounted) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-[#fcfdfe] font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* --- TOP NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
              hoctoeic
              <span className="text-blue-600 block text-[10px] uppercase tracking-[0.3em] font-bold -mt-1">E-LEARNING SYSTEM</span>
            </span>
          </Link>

          <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar max-w-[290px] sm:max-w-none">
            <TabBtn href="/?tab=intro" id="intro" active={activeTab} label="GIỚI THIỆU" icon={<Star size={16} />} />
            <TabBtn href="/courses" id="courses" active={activeTab} label="KHÓA HỌC" icon={<BookOpen size={16} />} />
            <TabBtn href="/?tab=dashboard" id="dashboard" active={activeTab} label="DASHBOARD" icon={<Layout size={16} />} color="blue" />
          </div>

          <div className="hidden md:flex items-center gap-4">
            {status === "authenticated" ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link href="/admin/courses" className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all shadow-md">
                    🛠️ QUẢN TRỊ
                  </Link>
                )}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800 leading-none mb-1">
                      {(session?.user as any)?.displayName || session?.user?.name || "User"}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Hội viên Pro</div>
                  </div>
                  <button onClick={() => signOut()} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className={clsx("min-h-screen", activeTab === "dashboard" && status === "authenticated" ? "bg-slate-50/30 pt-20" : "pt-32 pb-40 px-6 sm:px-12 max-w-7xl mx-auto")}>

        {/* --- TAB 1: GIỚI THIỆU --- */}
        {activeTab === "intro" && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* Hero Section */}
            <section className="text-center mb-32 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-50/50 blur-[120px] -z-10 rounded-full"></div>

              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold uppercase tracking-widest mb-10 border border-emerald-100 shadow-sm">
                <Award size={16} fill="currentColor" /> HỌC THẬT - THI THẬT - KẾT QUẢ THẬT
              </div>

              <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-[-0.05em] mb-12 italic uppercase">
                LỘ TRÌNH TOEIC <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 animate-gradient-x underline decoration-emerald-100 decoration-8 underline-offset-8">CÁ NHÂN HÓA</span>
              </h1>

              <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed mb-14">
                Hệ thống lớp học tại <span className="text-slate-900 font-bold">hoctoeic</span> được thiết kế tinh gọn, tập trung hoàn toàn vào việc lấy lại gốc tiếng Anh và rèn luyện kỹ năng giải đề thực chiến để đạt mục tiêu trong thời gian ngắn nhất.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6">
                <Link
                  href="/courses"
                  className="group bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] font-bold text-sm uppercase tracking-widest shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-3"
                >
                  Xem danh sách lớp học <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => setShowPlacementTest(true)}
                  className="bg-white text-slate-600 border-2 border-slate-100 px-12 py-6 rounded-[2.5rem] font-bold text-sm uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Kiểm tra trình độ miễn phí
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 border-t border-slate-100 pt-16">
                {[
                  { val: "2000+", label: "Học viên tham gia" },
                  { val: "95%", label: "Tỉ lệ đạt mục tiêu" },
                  { val: "13000+", label: "Bài tập thực hành" },
                  { val: "24/7", label: "Hỗ trợ học tập" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-4xl font-bold text-slate-900 mb-1">{stat.val}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-20 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] mb-24 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.02),transparent)] pointer-events-none"></div>

              <div className="relative z-10 grid lg:grid-cols-10 gap-8 md:gap-16 items-center">
                <div className="lg:col-span-6">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-yellow-400/10 rounded-[3rem] blur-2xl group-hover:opacity-100 transition duration-1000"></div>
                    <Swiper
                      modules={[Navigation, Pagination, Autoplay]}
                      spaceBetween={0}
                      slidesPerView={1}
                      pagination={{ clickable: true }}
                      autoplay={{ delay: 4000 }}
                      className="rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl aspect-video bg-[#f8f9fa] relative"
                    >
                      <SwiperSlide>
                        <div className="relative h-full w-full p-2 md:p-6 flex items-center justify-center">
                          <img
                            src="https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/marketing/teacher-info/teacher2.jpg"
                            alt="TOEIC 990 - 2023"
                            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute bottom-4 left-6 bg-emerald-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                            CERTIFICATE: 2023
                          </div>
                        </div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="relative h-full w-full p-2 md:p-6 flex items-center justify-center">
                          <img
                            src="https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/marketing/teacher-info/teacher1.jpg"
                            alt="TOEIC 990 - 2018"
                            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute bottom-4 left-6 bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                            CERTIFICATE: 2018
                          </div>
                        </div>
                      </SwiperSlide>
                      <div className="absolute top-4 right-4 z-20 bg-yellow-400 text-white w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl rotate-12 group-hover:rotate-0 transition-all duration-500">
                        <Trophy size={24} fill="currentColor" />
                      </div>
                    </Swiper>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                      <Zap size={14} fill="currentColor" /> EXPERT INSTRUCTOR
                    </div>
                    <h2 className="font-bold text-slate-900 leading-tight uppercase italic tracking-normal">
                      <span className="text-xl md:text-2xl block mb-1">Học với chuyên gia</span>
                      <span className="text-3xl md:text-5xl text-blue-600">Mr. Thiệt 990/990</span>
                    </h2>
                    <p className="text-slate-500 font-medium leading-relaxed italic text-base border-l-4 border-emerald-500 pl-4">
                      "Học với người đạt 990 không chỉ là học kiến thức, mà là học phương pháp giải đề tối ưu và tâm thế làm chủ bài thi từ trải nghiệm thực tế."
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Trophy size={22} />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Kinh nghiệm</div>
                        <div className="text-sm font-bold text-slate-700 uppercase italic leading-none">10+ Năm đào tạo</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Target size={22} />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Phương pháp</div>
                        <div className="text-sm font-bold text-slate-700 uppercase italic leading-none">Giải đề thực chiến</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-slate-50 rounded-[4rem] p-12 md:p-24 border border-slate-100 relative overflow-hidden mb-32">
              <div className="relative z-10">
                <div className="text-center mb-20">
                  <h2 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tighter italic">Các giai đoạn học trọng tâm</h2>
                  <div className="w-32 h-2 bg-emerald-500 mx-auto rounded-full"></div>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                  <CourseIntroCard step="01" title="Pre-TOEIC (Móng)" desc="Xây dựng nền tảng ngữ pháp, từ vựng và chuẩn hóa phát âm cho người mới bắt đầu hoặc mất gốc hoàn toàn." target="Xóa mất gốc - Lấy lại căn bản" color="blue" />
                  <CourseIntroCard step="02" title="TOEIC 450 - 650+" desc="Tập trung kỹ thuật làm bài theo từng Part, phương pháp nghe hiểu và nhận diện các bẫy thường gặp trong đề thi." target="Kỹ thuật làm bài - Nghe hiểu sâu" color="emerald" isHot={true} />
                  <CourseIntroCard step="03" title="TOEIC 750 - 900+" desc="Giải đề chuyên sâu, rèn kỹ năng và chiến thuật làm bài cho mục tiêu 900+, mở rộng vốn từ cấp cao." target="Giải đề thực chiến - Đột phá điểm" color="purple" />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-20 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] mb-32 relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tighter italic">Vinh Danh <span className="text-emerald-600">Bảng Vàng</span></h2>
                  <p className="text-slate-500 max-w-2xl mx-auto font-medium text-sm md:text-lg">Kết quả thật từ những nỗ lực không ngừng nghỉ của cộng đồng học viên hoctoeic.</p>
                  <div className="w-24 h-2 bg-emerald-500 mx-auto rounded-full mt-8"></div>
                </div>

                <div className="relative group px-0 md:px-10">
                  {scoreImages.length > 0 ? (
                    <Swiper modules={[Navigation, Pagination, Autoplay]} spaceBetween={25} slidesPerView={1} breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }} pagination={{ clickable: true, dynamicBullets: true }} navigation={true} autoplay={{ delay: 4000 }} className="pb-20 scorecard-swiper">
                      {scoreImages.map((img) => (
                        <SwiperSlide key={img.id}>
                          <div className="bg-white rounded-[2.5rem] p-2 md:p-3 shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 h-full hover:shadow-emerald-200/50 hover:-translate-y-3 transition-all duration-500 group/card relative">
                            <div className="aspect-[3/4] w-full overflow-hidden rounded-[2rem] bg-slate-50 flex items-center justify-center relative">
                              <img src={img.url} alt="Bảng điểm" className="max-w-full max-h-full object-contain group-hover/card:scale-110 transition-transform duration-1000" />
                            </div>
                            <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-400 to-orange-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl rotate-12 group-hover/card:rotate-0 transition-all duration-500">
                              <Trophy size={22} fill="currentColor" />
                            </div>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[1, 2, 3].map(i => <div key={i} className="aspect-[3/4] bg-slate-100 animate-pulse rounded-[3rem]"></div>)}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 border border-blue-100 rounded-[3rem] md:rounded-[4rem] p-6 md:p-24 relative overflow-hidden mb-32">
              <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-5 gap-10 md:gap-20 items-center">
                <div className="lg:col-span-2 space-y-6 md:space-y-8 text-center lg:text-left">
                  <h2 className="text-3xl md:text-5xl font-black leading-[1.1] uppercase tracking-tighter italic text-blue-700">Cảm nhận <br className="hidden md:block" /> học viên</h2>
                  <p className="text-slate-500 text-sm md:text-lg font-medium max-w-md mx-auto lg:mx-0">Những chia sẻ chân thực nhất về hành trình thay đổi điểm số tại hoctoeic.</p>
                  <div className="grid grid-cols-2 gap-4 md:gap-6 pt-2">
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-blue-100 shadow-sm">
                      <div className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">TỐT NGHIỆP</div>
                      <div className="text-xl md:text-3xl font-bold text-slate-900">5000+</div>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-blue-100 shadow-sm">
                      <div className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">HÀI LÒNG</div>
                      <div className="text-xl md:text-3xl font-bold text-slate-900">4.9/5</div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-3 w-full min-w-0">
                  {feedbackImages.length > 0 ? (
                    <Swiper modules={[Pagination, Autoplay]} spaceBetween={25} slidesPerView={1} pagination={{ clickable: true }} autoplay={{ delay: 5000 }} className="testimonial-swiper">
                      {feedbackImages.map((img) => (
                        <SwiperSlide key={img.id}>
                          <div className="bg-white p-1.5 md:p-3 rounded-[1.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden border-2 md:border-8 border-slate-800 group">
                            <img src={img.url} alt="Feedback" className="w-full h-auto object-contain rounded-[1rem] md:rounded-[2rem] group-hover:scale-[1.02] transition-transform duration-1000" />
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <div className="aspect-[16/10] bg-slate-800 animate-pulse rounded-[2rem] md:rounded-[3rem]"></div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* --- TAB 2: KHÓA HỌC (COLLECTION) --- */}
        {activeTab === "courses" && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-10">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">KHO HỌC LIỆU <span className="text-blue-600">PREMIUM</span></h2>
                <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-[0.4em]">
                  <div className="w-12 h-1 bg-blue-600 rounded-full"></div> Cập nhật giáo trình mới nhất 2026
                </div>
              </div>
              <div className="relative group w-full md:w-[400px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={22} />
                <input type="text" placeholder="Tìm tên khóa học hoặc kỹ năng..." className="pl-14 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[2.5rem] w-full shadow-sm focus:border-blue-500 focus:ring-8 focus:ring-blue-50 outline-none transition-all font-bold text-sm" />
              </div>
            </div>

            {loadingCourses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {[1, 2, 3].map(i => <div key={i} className="h-[550px] bg-slate-50 animate-pulse rounded-[4rem]"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {courses.map(course => {
                  const previewLessons = course.sections?.flatMap((s: any) => s.lessons?.filter((l: any) => l.isPreview)) || [];
                  const hasPreviews = previewLessons.length > 0;
                  return (
                    <div key={course.id} className="flex flex-col gap-6">
                      <CourseCard
                        course={course}
                        isAdmin={isAdmin}
                        showProgress={false}
                      />

                      {hasPreviews && (
                        <div className="px-8 pb-4 space-y-3">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-px flex-1 bg-slate-100"></div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Học thử ngay</span>
                            <div className="h-px flex-1 bg-slate-100"></div>
                          </div>
                          {previewLessons.slice(0, 2).map((lesson: any) => (
                            <Link key={lesson.id} href={`/learn/${course.id}/lesson/${lesson.id}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm group/item">
                              <div className="flex items-center gap-4 truncate">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">
                                  <PlayCircle size={14} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 truncate uppercase italic">{lesson.title}</span>
                              </div>
                              <ArrowRight size={14} className="text-slate-300 group-hover/item:text-blue-500 group-hover/item:translate-x-1 transition-all" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: DASHBOARD (STUDENT CONSOLE) --- */}
        {activeTab === "dashboard" && (
          status === "unauthenticated" ? (
            <div className="max-w-xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 hover:rotate-6 transition-transform">
                <GraduationCap className="text-white" size={32} />
              </div>
              <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900 uppercase italic leading-none">
                BẠN CẦN ĐĂNG KÝ TÀI KHOẢN
              </h2>
              <p className="mt-4 text-center text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
                để được cấp Dashboard riêng và trải nghiệm các tính năng Pro
              </p>

              <div className="mt-8 bg-white/80 backdrop-blur-xl py-10 px-6 shadow-2xl rounded-[3rem] sm:px-12 border border-white text-left">
                {/* Hộp thông báo màu xanh ngọc (Emerald Box) */}
                <div className="mb-8 p-5 bg-emerald-50 rounded-3xl border border-emerald-100 text-center shadow-sm shadow-emerald-50/50">
                  <ShieldCheck className="text-emerald-500 mx-auto mb-3" size={28} />
                  <p className="text-xs font-bold text-emerald-700 leading-relaxed">
                    Hãy đăng ký tài khoản để nhận ngay
                    <br />
                    <span className="text-emerald-600 font-black text-lg tracking-wide">7 NGÀY HỌC THỬ MIỄN PHÍ</span>
                    <br />
                    và trải nghiệm tính năng <span className="font-black uppercase text-emerald-600">PRO</span>!
                  </p>
                </div>

                {/* Google Sign In */}
                <button
                  onClick={() => signIn("google", { callbackUrl: "/?tab=dashboard" })}
                  className="w-full flex flex-col justify-center items-center gap-1 py-4 px-4 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
                      <path fill="#34A853" d="M16.04 18.013c-1.09.585-2.346.903-3.66.903a7.07 7.07 0 0 1-6.717-4.887l-4.04 3.114C3.553 21.1 7.495 24 12 24c3.055 0 5.783-1.01 7.803-2.733l-3.762-3.254Z" />
                      <path fill="#4285F4" d="M23.49 12.275c0-.84-.075-1.65-.214-2.434H12v4.604h6.442a5.504 5.504 0 0 1-2.39 3.61l3.762 3.254c2.201-2.032 3.678-5.023 3.678-8.761Z" />
                      <path fill="#FBBC05" d="M5.663 14.03a7.062 7.062 0 0 1 0-4.06L1.637 6.855a11.824 11.824 0 0 0 0 10.29l4.026-3.115Z" />
                    </svg>
                    <span className="text-sm font-black text-slate-700 uppercase tracking-wide">Đăng ký/Đăng nhập bằng Google</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">(không cần tạo mật khẩu)</span>
                </button>

                {/* Admin Credentials section */}
                <div className="mt-8 mb-4 text-center">
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                    Nếu bạn đã được Admin cấp tài khoản và mật khẩu,
                    <br />
                    hãy đăng nhập theo link dưới đây:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDashShowCredentials(!dashShowCredentials)}
                  className="w-full flex flex-col justify-center items-center gap-1 py-3 px-4 bg-slate-50 border border-slate-200 rounded-[2rem] hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer animate-none"
                >
                  <span className="text-xs font-black text-blue-600 uppercase tracking-wide">
                    {dashShowCredentials ? "Ẩn khung đăng nhập" : "Đăng nhập bằng tài khoản được cấp"}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    {dashShowCredentials ? "(Nhấp để thu gọn)" : "(Cần email và mật khẩu được cấp)"}
                  </span>
                </button>

                <AnimatePresence>
                  {dashShowCredentials && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6 mt-6 overflow-hidden"
                      onSubmit={handleDashboardCredentialsLogin}
                    >
                      {dashError && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold text-center border border-red-100">
                          {dashError}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Thư điện tử (Email)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-300" />
                          </div>
                          <input
                            type="email"
                            required
                            value={dashEmail}
                            onChange={(e) => setDashEmail(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium bg-slate-50/50"
                            placeholder="học.viên@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Mật khẩu</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-300" />
                          </div>
                          <input
                            type={dashShowPassword ? "text" : "password"}
                            required
                            value={dashPassword}
                            onChange={(e) => setDashPassword(e.target.value)}
                            className="block w-full pl-12 pr-12 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium bg-slate-50/50"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setDashShowPassword(!dashShowPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                          >
                            {dashShowPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                          <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-slate-500">Ghi nhớ tôi</label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={dashIsLoading}
                        className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-[2rem] shadow-xl shadow-blue-100 text-sm font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {dashIsLoading ? "Đang xử lý..." : "Đăng nhập"} <ArrowRight size={18} />
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="mt-8 text-center">
                  <Link
                    href="/?tab=intro"
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest cursor-pointer"
                  >
                    ← Quay lại trang giới thiệu
                  </Link>
                </div>

                <div className="mt-8 text-center text-xs font-medium text-slate-400 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1 justify-center">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Bảo mật an toàn bởi hoctoeic PRO</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex -mb-20 h-[calc(100vh-80px)] overflow-hidden">
               <aside className={clsx(
                "bg-white border-r border-slate-100 flex flex-col transition-all duration-500 shadow-xl shadow-slate-200/50 z-20 shrink-0",
                collapsed ? "w-12 md:w-24" : "w-64 md:w-72"
              )}>
                <div className={clsx("border-b border-slate-50 flex items-center justify-between", collapsed ? "p-2 md:p-6 justify-center" : "p-6")}>
                  {!collapsed && <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Học viên Pro</span>}
                  <button onClick={() => setCollapsed(!collapsed)} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                    {collapsed ? <ChevronRight size={18} /> : <ArrowLeft size={18} />}
                  </button>
                </div>

                <div className={clsx("flex-1 space-y-2 overflow-y-auto no-scrollbar", collapsed ? "p-1 md:p-4" : "p-4")}>
                  <SideTabBtn id="courses" active={dashTab} onClick={setDashTab} collapsed={collapsed} icon={<BookOpen size={20} />} label="Khóa học" />
                  <SideTabBtn id="stats" active={dashTab} onClick={setDashTab} collapsed={collapsed} icon={<BarChart3 size={20} />} label="Thống kê" />
                  <SideTabBtn id="history" active={dashTab} onClick={setDashTab} collapsed={collapsed} icon={<Clock size={20} />} label="Lịch sử giải đề" />
                  <SideTabBtn id="review" active={dashTab} onClick={setDashTab} collapsed={collapsed} icon={<Star size={20} />} label="Ôn tập" />
                  <SideTabBtn id="vocab" active={dashTab} onClick={setDashTab} collapsed={collapsed} icon={<Languages size={20} />} label="Từ vựng" />
                  <SideTabBtn id="attendance" active={dashTab} onClick={setDashTab} collapsed={collapsed} icon={<CalendarCheck size={20} />} label="Điểm danh & Chuyên cần" />
                  <SideTabBtn id="account" active={dashTab} onClick={setDashTab} collapsed={collapsed} icon={<Settings size={20} />} label="Cài đặt tài khoản" />
                </div>

                <div className={clsx("border-t border-slate-50 space-y-2", collapsed ? "p-1 md:p-4 text-center" : "p-4")}>
                  {!collapsed ? (
                    <div className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] px-4 py-2">Hỗ trợ 24/7</div>
                  ) : (
                    <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none py-1">24/7</div>
                  )}
                </div>
              </aside>

              <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-12">
                <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

                  {/* Dashboard Sections based on dashTab */}
                  {/* --- TAB 1: KHÓA HỌC CỦA BẠN --- */}
                  {(dashTab === "overview" || dashTab === "courses") && (
                    <div className="space-y-12">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Khóa học của bạn</h2>
                          <p className="text-slate-500 font-medium">Tiếp tục hành trình chinh phục TOEIC ngay hôm nay.</p>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-3xl border border-blue-100">
                          <div className="w-10 h-10 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <GraduationCap size={22} />
                          </div>
                          <div>
                            <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">Cấp độ</div>
                            <div className="text-sm font-black text-blue-700 uppercase italic leading-none">Học viên Pro</div>
                          </div>
                        </div>
                      </div>

                      {myStats?.lastLesson && (
                        <div className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-12 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
                          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                            <div className="space-y-4">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <Play size={12} fill="currentColor" /> Đang học dở
                              </div>
                              <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                                {myStats.lastLesson.lessonTitle}
                              </h3>
                              <p className="text-slate-400 font-medium italic">Khóa học: {myStats.lastLesson.courseTitle}</p>
                            </div>
                            <Link
                              href={`/learn/${myStats.lastLesson.courseId}/lesson/${myStats.lastLesson.lessonId}`}
                              className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center gap-2"
                            >
                              Học tiếp ngay <ArrowRight size={16} />
                            </Link>
                          </div>
                        </div>
                      )}

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                            <div className="w-12 h-1 bg-blue-600 rounded-full" /> Danh sách khóa học
                          </h3>
                        </div>
                        {loadingMyCourses ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[1, 2].map(i => <div key={i} className="h-44 bg-slate-50 animate-pulse rounded-[3rem]" />)}
                          </div>
                        ) : myCourses.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {myCourses.map(course => (
                              <CourseCard key={course.id} course={course} isAdmin={isAdmin} showProgress={true} />
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-16 text-center max-w-2xl mx-auto">
                            <div className="w-20 h-20 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                              <BookOpen size={32} className="text-blue-500" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-4 uppercase italic">Chào mừng bạn đến với trải nghiệm học thử!</h4>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                              Bạn có thể bắt đầu khám phá các tính năng của website qua các bài học đang mở <span className="text-emerald-500 font-black italic underline decoration-2 underline-offset-4">MIỄN PHÍ (Free)</span>.
                              Hãy chọn một khóa học bạn quan tâm để bắt đầu ngay nhé!
                            </p>
                            <button
                              onClick={() => setActiveTab("courses")}
                              className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3 mx-auto"
                            >
                              XEM DANH SÁCH KHÓA HỌC <ArrowRight size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- TAB 2: THỐNG KÊ KẾT QUẢ --- */}
                  {dashTab === "stats" && (
                    <div className="space-y-12">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Phân tích kết quả</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashCard icon={<TrendingUp size={28} className="text-blue-600" />} label="Độ chính xác" value={`${myStats?.totalAttempts > 0 ? Math.round(myStats.partStats.reduce((s: number, p: any) => s + p.correct, 0) / Math.max(myStats.totalAttempts, 1) * 100) : 0}%`} detail={`(${myStats?.partStats.reduce((s: number, p: any) => s + p.correct, 0) || 0}/${myStats?.totalAttempts || 0}) Câu đúng/Tổng số câu đã làm`} />
                        <DashCard icon={<Award size={28} className="text-emerald-600" />} label="Tổng câu đúng" value={myStats?.partStats.reduce((s: number, p: any) => s + p.correct, 0) || 0} detail="Câu trả lời chính xác" />
                        <DashCard icon={<Target size={28} className="text-orange-500" />} label="Điểm trung bình" value={myStats?.averageScore || 0} detail="Dựa trên lịch sử làm đề Full Test" />
                      </div>

                      {/* Phân tích theo Part dạng Bảng */}
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 uppercase italic tracking-tight flex items-center gap-3">
                          <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                          Thống kê kết quả làm bài theo từng Part
                        </h3>
                        <div className="bg-white border border-slate-100 rounded-3xl sm:rounded-[2.5rem] overflow-x-auto shadow-sm">
                          <table className="w-full min-w-[500px] sm:min-w-0 text-left">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phần thi</th>
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Độ chính xác</th>
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Số câu đúng</th>
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Chi tiết theo dạng</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {myStats?.partStats?.length > 0 ? (
                                myStats.partStats.map((p: any) => {
                                  const pct = Math.round((p.correct / Math.max(p.total, 1)) * 100);
                                  const color = pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : "text-red-500";
                                  return (
                                    <tr key={p.partNumber} className="hover:bg-slate-50/50 transition-colors group">
                                      <td className="px-3 sm:px-8 py-4 sm:py-5">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            {p.partNumber}
                                          </div>
                                          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase italic">Part {p.partNumber}</span>
                                        </div>
                                      </td>
                                      <td className="px-3 sm:px-8 py-4 sm:py-5 text-center">
                                        <span className={clsx("text-base sm:text-lg font-black italic", color)}>
                                          {pct}%
                                        </span>
                                      </td>
                                      <td className="px-3 sm:px-8 py-4 sm:py-5 text-center">
                                        <span className="text-xs sm:text-sm font-bold text-slate-600">{p.correct} / {p.total}</span>
                                      </td>
                                      <td className="px-3 sm:px-8 py-4 sm:py-5 text-center">
                                        <button
                                          onClick={() => setDetailPart(p)}
                                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm mx-auto"
                                        >
                                          <Eye size={16} className="sm:w-5 sm:h-5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-3 sm:px-8 py-12 sm:py-20 text-center text-slate-400 font-bold italic">
                                    Chưa có dữ liệu thống kê bài tập.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- TAB 3: LỊCH SỬ LÀM BÀI --- */}
                  {dashTab === "history" && (
                    <div className="space-y-12">
                      <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Thông tin các đề bạn đã làm</h2>
                      <p className="text-xs font-bold text-slate-400 italic flex items-center gap-2">
                        <Info size={14} className="text-blue-500" />
                        Lưu ý: Chỉ các đề full (200 câu), đã làm và bấm nút Gửi bài mới được lưu lại lịch sử ở đây
                      </p>

                      {/* Summary Stats */}
                      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-20 py-10 bg-gradient-to-br from-white to-slate-50/50 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tổng số đề đã giải</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-slate-900 italic tracking-tighter">{myHistory.length}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Đề</span>
                          </div>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-slate-100"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Điểm trung bình</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-blue-600 italic tracking-tighter">
                              {myHistory.length > 0
                                ? Math.round(myHistory.reduce((acc, h) => acc + h.totalScore, 0) / myHistory.length)
                                : 0}
                            </span>
                            <span className="text-xs font-bold text-blue-400 uppercase">/ 990</span>
                          </div>
                          {myHistory.length > 0 && (
                            <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>L: <span className="text-slate-700">{Math.round(myHistory.reduce((acc, h) => acc + h.lcScore, 0) / myHistory.length)}</span></span>
                              <div className="w-px h-3 bg-slate-200"></div>
                              <span>R: <span className="text-slate-700">{Math.round(myHistory.reduce((acc, h) => acc + h.rcScore, 0) / myHistory.length)}</span></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm max-h-[650px] flex flex-col relative">
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                          <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100 shadow-sm">
                              <tr>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bài kiểm tra</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kết quả</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {loadingHistory ? (
                                <tr>
                                  <td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-medium italic">Đang tải lịch sử...</td>
                                </tr>
                              ) : myHistory.length > 0 ? (
                                myHistory.map((h: any) => (
                                  <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                      <div className="text-sm font-bold text-slate-900">{new Date(h.createdAt).toLocaleDateString('vi-VN')}</div>
                                      <div className="text-[10px] text-slate-400 font-medium italic">{new Date(h.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                      <div className="text-sm font-bold text-slate-700">{h.testId}</div>
                                      {h.lessonId && h.courseId ? (
                                        <Link
                                          href={`/learn/${h.courseId}/lesson/${h.lessonId}`}
                                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-black uppercase tracking-widest hover:text-blue-800 transition-colors group"
                                        >
                                          Làm lại <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                      ) : (
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                          Đã làm
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-bold text-sm italic">
                                        {h.totalScore} / 990
                                      </div>
                                      <div className="text-[9px] text-slate-400 mt-1">
                                        L: {h.lcScore} | R: {h.rcScore}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-medium italic">Bạn chưa có lịch sử làm bài.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="p-8 text-center text-slate-400 font-medium italic border-t border-slate-50 bg-slate-50/20">
                          Hệ thống đang đồng bộ thêm lịch sử làm bài của bạn...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- TAB 4: TRUNG TÂM ÔN TẬP --- */}
                  {dashTab === "review" && (
                    <div className="space-y-12">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Trung tâm ôn tập</h2>
                          <button
                            onClick={() => setShowReviewGuide(!showReviewGuide)}
                            className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-all shadow-sm"
                            title="Hướng dẫn ôn tập"
                          >
                            <HelpCircle size={20} />
                          </button>
                        </div>
                        <Link href="/review" className="bg-red-600 text-white px-10 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                          <Flame size={18} fill="currentColor" /> Bắt đầu ôn ngay
                        </Link>
                      </div>

                      {showReviewGuide && (
                        <div className="mt-8 p-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] text-white shadow-2xl animate-in slide-in-from-top duration-500 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                          <button
                            onClick={() => {
                              setShowReviewGuide(false);
                              setHasClosedReviewGuide(true);
                            }}
                            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                          >
                            <X size={20} />
                          </button>

                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Zap size={24} className="text-yellow-300" />
                              </div>
                              <h3 className="text-xl font-black uppercase italic tracking-tight">Bí quyết đạt điểm cao</h3>
                            </div>

                            <div className="space-y-4 text-blue-50 font-medium leading-relaxed max-w-3xl">
                              <p>
                                Để đảm bảo hiệu quả học tập cao nhất, hệ thống <span className="text-white font-black underline decoration-yellow-400 decoration-2 underline-offset-4">hoctoeic</span> sẽ giúp bạn tập hợp lại toàn bộ các câu bạn đã làm sai hoặc gắn cờ để bạn có thể xem và ôn tập lại những câu này.
                              </p>
                              <p>
                                Bạn hãy chọn bài học bất kỳ, làm bài, gắn cờ cho câu muốn xem lại và quay lại trang này thì sẽ thấy những câu đó được thống kê đầy đủ ở đây và bạn có thể làm lại những câu đó tại đây luôn - <span className="text-white font-black">vô cùng tiện lợi.</span>
                              </p>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap items-center gap-6">
                              <button
                                onClick={() => {
                                  setActiveTab("courses");
                                  setShowReviewGuide(false);
                                  setHasClosedReviewGuide(true);
                                }}
                                className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 hover:text-slate-900 transition-all shadow-lg flex items-center gap-2"
                              >
                                Hãy chọn bài học học thử ngay bây giờ <ArrowRight size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-red-50 transition-colors" />
                          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-8 relative z-10">
                            <X size={32} />
                          </div>
                          <div className="text-5xl font-black text-slate-900 italic tracking-tighter mb-2 relative z-10">{myStats?.incorrectCount || 0}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Câu làm sai cần làm lại</div>
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-orange-50 transition-colors" />
                          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-8 relative z-10">
                            <Flag size={32} fill="currentColor" />
                          </div>
                          <div className="text-5xl font-black text-slate-900 italic tracking-tighter mb-2 relative z-10">{myStats?.flaggedCount || 0}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Câu đã gắn cờ quan trọng</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- TAB 6: THÔNG TIN TÀI KHOẢN --- */}
                  {dashTab === "account" && (
                    <div className="space-y-12">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Cài đặt tài khoản</h2>
                        <button onClick={() => signOut()} className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-xs uppercase border border-red-100 flex items-center gap-2 hover:bg-red-100 transition-all">
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[3rem] p-12 shadow-sm">
                          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                            <div className="w-12 h-1 bg-blue-600 rounded-full" /> Cập nhật hồ sơ
                          </h3>

                          {settingsMsg?.type === 'error' && (
                            <div className="p-6 rounded-3xl text-sm font-bold mb-10 border bg-red-50 text-red-600 border-red-100 flex items-center gap-3">
                              <X className="shrink-0" size={18} /> {settingsMsg.text}
                            </div>
                          )}
                          {settingsDone && (
                            <div className="p-6 rounded-3xl text-sm font-bold mb-10 border bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-3">
                              <CheckCircle2 className="shrink-0" size={18} /> Cập nhật thông tin thành công!
                            </div>
                          )}

                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (settingsPassword && settingsPassword !== settingsConfirmPassword) {
                              setSettingsMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
                              return;
                            }
                            setSettingsLoading(true);
                            setSettingsMsg(null);
                            try {
                              const res = await fetch('/api/me/update', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  displayName: settingsDisplayName,
                                  ...(settingsPassword ? { password: settingsPassword } : {})
                                })
                              });
                              if (res.ok) {
                                if (update) {
                                  await update({ name: settingsDisplayName });
                                }
                                setSettingsDone(true);
                                setTimeout(() => setSettingsDone(false), 5000);
                              } else {
                                const data = await res.json();
                                setSettingsMsg({ type: 'error', text: data.message || 'Có lỗi xảy ra.' });
                              }
                            } catch {
                              setSettingsMsg({ type: 'error', text: 'Lỗi kết nối.' });
                            } finally {
                              setSettingsLoading(false);
                            }
                          }} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tên hiển thị</label>
                                <input type="text" value={settingsDisplayName} onChange={(e) => setSettingsDisplayName(e.target.value)} className="w-full px-6 py-4 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-bold text-sm bg-slate-50" placeholder="Tên của bạn..." />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Địa chỉ Email</label>
                                <input type="email" value={session?.user?.email || ""} disabled className="w-full px-6 py-4 border border-slate-100 rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed" />
                              </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Thay đổi bảo mật</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mật khẩu mới</label>
                                  <div className="relative group">
                                    <input
                                      type={showSettingsPassword ? "text" : "password"}
                                      value={settingsPassword}
                                      onChange={(e) => setSettingsPassword(e.target.value)}
                                      autoComplete="new-password"
                                      className="w-full px-6 py-4 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-bold text-sm bg-slate-50 pr-14"
                                      placeholder="Để trống nếu không đổi..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-blue-500 transition-all"
                                    >
                                      {showSettingsPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Xác nhận mật khẩu</label>
                                  <div className="relative group">
                                    <input
                                      type={showSettingsConfirmPassword ? "text" : "password"}
                                      value={settingsConfirmPassword}
                                      onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                                      autoComplete="new-password"
                                      className="w-full px-6 py-4 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-bold text-sm bg-slate-50 pr-14"
                                      placeholder="Nhập lại mật khẩu mới..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowSettingsConfirmPassword(!showSettingsConfirmPassword)}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-blue-500 transition-all"
                                    >
                                      {showSettingsConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button type="submit" disabled={settingsLoading} className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-50">
                              {settingsLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                          </form>
                        </div>

                        <div className="space-y-8">
                          <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                            <div className="relative z-10">
                              <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mb-6">
                                <ShieldCheck size={28} className="text-blue-400" />
                              </div>
                              <h3 className="text-xl font-bold uppercase italic mb-2">Trạng thái</h3>
                              <div className="text-emerald-400 font-black text-sm uppercase tracking-widest italic mb-6">Hội viên Pro</div>
                              <div className="space-y-4 pt-6 border-t border-white/10 text-xs text-slate-400 font-medium">
                                <div className="flex justify-between">
                                  <span>Ngày đăng ký:</span>
                                  <span className="text-white">
                                    {(session?.user as any)?.createdAt ? new Date((session?.user as any).createdAt).toLocaleDateString("vi-VN") : "---"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Thời hạn:</span>
                                  <span className="text-emerald-400">
                                    {(() => {
                                      const days = (session?.user as any)?.daysLeft;
                                      if (days === undefined || days === null) return "Vĩnh viễn";
                                      if (days > 0) return `Còn ${days} ngày`;
                                      if (days === 0) return "Ngày cuối cùng";
                                      return "Đã hết hạn";
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Device Management Section */}
                        <div className="lg:col-span-3 mt-4">
                          <DeviceManagement />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- TAB: ĐIỂM DANH & CHUYÊN CẦN --- */}
                  {dashTab === "attendance" && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Điểm danh & Chuyên cần</h2>
                          <p className="text-slate-500 font-medium">Theo dõi lịch sử tham gia lớp học của bạn.</p>
                        </div>
                      </div>

                      {/* Khung Điểm danh */}
                      <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                        
                        {loadingAttendance ? (
                          <div className="py-10 text-center text-slate-400 font-bold flex items-center justify-center gap-3">
                            <span className="animate-spin text-blue-500">⏳</span>
                            <span>Đang kiểm tra trạng thái lớp học...</span>
                          </div>
                        ) : attendanceData?.noClass ? (
                          <div className="flex flex-col items-center py-10 text-center text-slate-400">
                            <CalendarCheck size={48} className="opacity-20 mb-4 text-indigo-500" />
                            <h4 className="text-lg font-bold text-slate-700 uppercase italic">Tài khoản chưa được xếp lớp</h4>
                            <p className="text-sm font-medium text-slate-400 mt-2 max-w-md">
                              Tài khoản của bạn hiện chưa liên kết với lớp học nào. Vui lòng liên hệ Giáo viên/Admin để được xếp lớp và cấp quyền điểm danh nhé.
                            </p>
                          </div>
                        ) : attendanceData?.activeSession ? (
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-3">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Đang mở điểm danh
                              </div>
                              <h3 className="text-2xl font-black text-slate-800">
                                {attendanceData.activeSession.title}
                              </h3>
                              <p className="text-slate-500 text-sm font-medium">
                                {attendanceData.activeSession.checkedIn 
                                  ? "Bạn đã điểm danh thành công cho buổi học này! Vui lòng chú ý lắng nghe bài giảng."
                                  : "Buổi học đang bắt đầu, vui lòng bấm nút bên cạnh để điểm danh vào lớp ngay."}
                              </p>
                            </div>
                            
                             {attendanceData.activeSession.checkedIn ? (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl px-6 py-4 flex items-center gap-3 font-bold text-sm">
                                  <CheckCircle2 size={22} className="text-emerald-500" /> Đã điểm danh thành công
                                </div>
                                <button
                                  onClick={async () => {
                                    if (checkingIn) return;
                                    setCheckingIn(true);
                                    try {
                                      const nextMuteState = !attendanceData.activeSession.isMuted;
                                      const res = await fetch("/api/classes/attendance/checkin", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ isMuted: nextMuteState })
                                      });
                                      const resData = await res.json();
                                      if (!res.ok) throw new Error(resData.error || "Không thể thay đổi trạng thái mic");
                                      fetchAttendanceStats();
                                    } catch (err: any) {
                                      alert("⚠️ Lỗi: " + err.message);
                                    } finally {
                                      setCheckingIn(false);
                                    }
                                  }}
                                  disabled={checkingIn}
                                  className={clsx(
                                    "px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border",
                                    attendanceData.activeSession.isMuted
                                      ? "bg-rose-500/10 border-rose-500/20 text-rose-600 hover:bg-rose-500/20"
                                      : "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/20"
                                  )}
                                >
                                  {attendanceData.activeSession.isMuted ? (
                                    <>
                                      <MicOff size={16} /> Xin bật lại mic
                                    </>
                                  ) : (
                                    <>
                                      <Mic size={16} /> Xin phép tắt mic
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center sm:items-end gap-3">
                                <label className="flex items-center gap-2 text-slate-600 font-bold text-xs cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isMutedCheck}
                                    onChange={(e) => setIsMutedCheck(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span>Xin tắt mic (không gọi tên phát biểu)</span>
                                </label>
                                <button
                                  onClick={async () => {
                                    if (checkingIn) return;
                                    setCheckingIn(true);
                                    try {
                                      const res = await fetch("/api/classes/attendance/checkin", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ isMuted: isMutedCheck })
                                      });
                                      const resData = await res.json();
                                      if (!res.ok) throw new Error(resData.error || "Điểm danh thất bại");
                                      alert("🎉 Điểm danh thành công!");
                                      fetchAttendanceStats();
                                    } catch (err: any) {
                                      alert("⚠️ Lỗi: " + err.message);
                                    } finally {
                                      setCheckingIn(false);
                                    }
                                  }}
                                  disabled={checkingIn}
                                  className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50"
                                >
                                  {checkingIn ? "Đang xử lý..." : "👉 Điểm danh vào lớp"}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-10 text-center text-slate-400">
                            <CalendarCheck size={48} className="opacity-20 mb-4 text-slate-600" />
                            <h4 className="text-lg font-bold text-slate-700 uppercase italic">Lớp học hiện tại chưa mở điểm danh</h4>
                            <p className="text-sm font-medium text-slate-400 mt-2 max-w-md">
                              Khi giáo viên bắt đầu buổi học mới và mở điểm danh, nút điểm danh sẽ tự động xuất hiện tại đây.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Thống kê chuyên cần và lịch sử (Chỉ hiển thị khi đã được xếp lớp) */}
                      {!attendanceData?.noClass && (
                        <>
                          {/* Thống kê chuyên cần */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-2">Tổng số buổi đã học</p>
                              <p className="text-4xl font-black text-blue-600 italic">{attendanceData?.total || 0} <span className="text-xs font-bold text-slate-400 uppercase not-italic">buổi</span></p>
                            </div>
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-2">Số buổi có mặt</p>
                              <p className="text-4xl font-black text-emerald-600 italic">{attendanceData?.present || 0} <span className="text-xs font-bold text-slate-400 uppercase not-italic">buổi</span></p>
                            </div>
                            <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 shadow-sm">
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-2">Số buổi vắng</p>
                              <p className="text-4xl font-black text-rose-600 italic">{attendanceData?.absent || 0} <span className="text-xs font-bold text-slate-400 uppercase not-italic">buổi</span></p>
                            </div>
                          </div>

                          {/* Danh sách lịch sử điểm danh */}
                          <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 uppercase italic tracking-tight flex items-center gap-3">
                              <div className="w-2 h-8 bg-blue-600 rounded-full" />
                              Chi tiết lịch sử chuyên cần
                            </h3>
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buổi học</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {attendanceData?.history && attendanceData.history.length > 0 ? (
                                    attendanceData.history.map((h: any) => (
                                      <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                          <span className="text-sm font-bold text-slate-700 uppercase italic">{h.title}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                          <span className="text-xs text-slate-500 font-medium">
                                            {new Date(h.createdAt).toLocaleDateString("vi-VN", {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit"
                                            })}
                                          </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                          {h.checkedIn ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                                              Có mặt ({new Date(h.checkedInAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })})
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                                              Vắng mặt
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={3} className="px-8 py-16 text-center text-slate-400 font-bold italic">
                                        Chưa có lịch sử buổi học nào.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {dashTab === "vocab" && (
                    <div className="space-y-6 sm:space-y-12">
                      <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.02)] p-4 sm:p-10 animate-in fade-in zoom-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-5 sm:mb-10">
                          <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">NGÀY 0</div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3 flex-wrap">
                              <span id="vocab-title-target">Sổ tay từ vựng</span>
                              <button
                                onClick={() => {
                                  setShowVocabGuide(true);
                                  setHasClosedVocabGuide(false);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg sm:rounded-xl font-bold text-[8px] sm:text-[10px] uppercase tracking-wider transition-all shadow-sm"
                                title="Xem cơ chế 5 rổ từ vựng Leitner"
                              >
                                <HelpCircle size={10} />
                                Cơ chế 5 rổ từ vựng
                              </button>

                              <button
                                onClick={() => {
                                  startVocabTour();
                                }}
                                id="vocab-guide-btn"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg sm:rounded-xl font-bold text-[8px] sm:text-[10px] uppercase tracking-wider transition-all shadow-sm"
                                title="Khởi động Tour hướng dẫn"
                              >
                                <Compass size={10} className="animate-pulse" />
                                Hướng dẫn nhanh
                              </button>
                            </h2>
                          </div>

                          {/* Filter Tabs (Like Course Player) */}
                          <div id="vocab-filters-target" className="flex gap-0.5 sm:gap-1 bg-slate-50 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-100 overflow-x-auto scrollbar-hide whitespace-nowrap">
                            <button
                              id="vocab-filter-all-btn"
                              onClick={() => setVocabFilter("all")}
                              className={clsx(
                                "px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                                vocabFilter === "all" ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-500"
                              )}
                            >
                              TẤT CẢ ({myVocab.length})
                            </button>
                            <button
                              id="vocab-filter-unlearned-btn"
                              onClick={() => setVocabFilter("unlearned")}
                              className={clsx(
                                "px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                                vocabFilter === "unlearned" ? "bg-white shadow-sm text-rose-500" : "text-slate-400 hover:text-slate-500"
                              )}
                            >
                              CHƯA THUỘC ({myVocab.filter(v => v.isUnlearned).length})
                            </button>
                            <button
                              id="vocab-filter-review-btn"
                              onClick={() => setVocabFilter("review")}
                              className={clsx(
                                "px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                                vocabFilter === "review" ? "bg-white shadow-sm text-amber-500" : "text-slate-400 hover:text-slate-500"
                              )}
                            >
                              CẦN ÔN TẬP ({myVocab.filter(v => !v.nextReviewDate || new Date(v.nextReviewDate) <= new Date()).length})
                            </button>
                          </div>
                        </div>

                        {/* Sub-navigation for Vocab Modes (Horizontal scrollable style) */}
                        {/* Sub-navigation for Vocab Modes (Horizontal scrollable style) */}
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100/50 mb-5 sm:mb-12 whitespace-nowrap">
                          {/* Nút Thư viện riêng biệt */}
                          {(() => {
                            const Icon = BookOpen;
                            const isActive = vocabMode === "library";
                            return (
                              <button
                                id="vocab-mode-library-btn"
                                onClick={() => setVocabMode("library")}
                                className={clsx(
                                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                                  isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-white"
                                )}
                              >
                                <Icon size={14} fill={isActive ? "currentColor" : "none"} />
                                Thư viện
                              </button>
                            );
                          })()}

                          {/* Dải 4 trò chơi còn lại */}
                          <div id="vocab-games-target" className="flex gap-1 whitespace-nowrap">
                            {[
                              { id: "scramble", label: "Xếp chữ", icon: Shuffle },
                              { id: "fill", label: "Điền từ", icon: PenLine },
                              { id: "match", label: "Ghép từ", icon: Link2 },
                              { id: "synonym", label: "Đồng nghĩa", icon: Lightbulb },
                            ].map((mode) => {
                              const Icon = mode.icon;
                              const isActive = vocabMode === mode.id;
                              return (
                                <button
                                  key={mode.id}
                                  onClick={() => setVocabMode(mode.id)}
                                  className={clsx(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                                    isActive
                                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                      : "text-slate-400 hover:text-slate-700 hover:bg-white"
                                  )}
                                >
                                  <Icon size={14} fill={isActive ? "currentColor" : "none"} />
                                  {mode.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {loadingVocab ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-3xl" />)}
                          </div>
                        ) : myVocab.length > 0 ? (
                          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {vocabMode === "library" && (
                              <>
                                <div id="vocab-global-flip-target" className="flex gap-2 mb-8">
                                  <button
                                    onClick={() => setGlobalFlip(prev => prev === "back" ? "front" : "back")}
                                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                                  >
                                    <Layers size={14} className="text-blue-500" />
                                    {globalFlip === "back" ? "Hiện mặt trước" : "Hiện mặt sau"}
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {(() => {
                                    const filtered = vocabFilter === "review"
                                      ? myVocab.filter(v => !v.nextReviewDate || new Date(v.nextReviewDate) <= new Date())
                                      : vocabFilter === "unlearned"
                                        ? myVocab.filter(v => v.isUnlearned)
                                        : myVocab;

                                    return filtered.map((vocab, idx) => (
                                      <DashVocabCard
                                        key={vocab.id}
                                        vocab={vocab}
                                        index={idx}
                                        onUpdate={fetchVocab}
                                        globalFlip={globalFlip}
                                      />
                                    ));
                                  })()}
                                </div>
                              </>
                            )}

                            {vocabMode !== "library" && (
                              <div className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl sm:rounded-[3rem] p-3 sm:p-8 md:p-16">
                                {(() => {
                                  const filteredWords = vocabFilter === "review"
                                    ? myVocab.filter(v => !v.nextReviewDate || new Date(v.nextReviewDate) <= new Date())
                                    : vocabFilter === "unlearned"
                                      ? myVocab.filter(v => v.isUnlearned)
                                      : myVocab;

                                  const gameWords: VocabWord[] = filteredWords.map(v => ({
                                    id: v.id,
                                    word: v.word,
                                    ipa: v.ipa || "",
                                    mean: v.definition,
                                    ex: v.example || "",
                                    exVi: v.exampleTranslation || "",
                                    syns: v.synonyms ? v.synonyms.split(',').map((s: string) => s.trim()) : [],
                                    isUnlearned: v.isUnlearned
                                  }));

                                  if (vocabMode === "scramble") return <ScrambleGame words={gameWords} onSRSUpdate={handleSRSUpdate} />;
                                  if (vocabMode === "fill") return <FillGame words={gameWords} allWords={gameWords} onSRSUpdate={handleSRSUpdate} />;
                                  if (vocabMode === "match") return <MatchGame words={gameWords} onSRSUpdate={handleSRSUpdate} />;
                                  if (vocabMode === "synonym") return <SynonymGame words={gameWords} onSRSUpdate={handleSRSUpdate} />;
                                  return null;
                                })()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-12">
                            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-16 md:p-24 text-center">
                              <div className="max-w-2xl mx-auto space-y-6">
                                <p className="text-slate-900 font-bold text-lg leading-relaxed">
                                  Hiện chưa có từ vựng nào được gắn sao để xuất hiện ở đây. <br />
                                  Bạn có thể gắn sao cho một từ khi tra từ điển.
                                </p>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                  Trong lúc học bài, hãy nhấn đúp chuột vào từ tiếng Anh hoặc bôi đen từ đó, từ điển hiện ra và bạn sẽ thấy nút gắn sao để tạo thẻ từ tự động và lưu vào Sổ tay từ vựng của bạn.
                                </p>
                                <div className="pt-4">
                                  <p className="text-blue-600 font-black italic mb-6">
                                    Hãy vô học bài, tra từ và trải nghiệm các chức năng học từ vựng qua game xịn xò này ngay
                                  </p>
                                  <button
                                    onClick={() => setActiveTab("courses")}
                                    className="inline-flex items-center gap-2 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                                  >
                                    Đến khoá học ngay <ArrowRight size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Bản hướng dẫn inline nằm ngay trên trang */}
                            <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                              <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                  <HelpCircle className="text-blue-500" size={24} />
                                  Hướng dẫn học Sổ tay thông minh
                                </h3>
                                <p className="text-slate-400 font-medium text-xs mt-1">Khám phá cơ chế ghi nhớ lặp lại ngắt quãng (SRS) để học tập hiệu quả hơn</p>
                              </div>
                              <div className="p-10">
                                <VocabGuideContent />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* --- MODAL CHI TIẾT THEO DẠNG --- */}
      {detailPart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setDetailPart(null)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black italic shadow-lg shadow-blue-200">
                  {detailPart.partNumber}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Chi tiết Part {detailPart.partNumber}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Phân tích theo từng dạng câu hỏi</p>
                </div>
              </div>
              <button
                onClick={() => setDetailPart(null)}
                className="w-10 h-10 rounded-full bg-white text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dạng bài</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Số câu đúng</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Độ chính xác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {detailPart.allCategories?.map((cat: any, i: number) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{cat.name}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                          {cat.correct} / {cat.total} câu
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className={clsx("text-sm font-black italic", cat.accuracy >= 60 ? "text-emerald-600" : "text-red-500")}>
                            {cat.accuracy}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={clsx("h-full", cat.accuracy >= 80 ? "bg-emerald-500" : cat.accuracy >= 60 ? "bg-blue-500" : "bg-red-500")} style={{ width: `${cat.accuracy}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Dữ liệu được cập nhật từ các bài làm gần nhất của bạn
              </p>
            </div>
          </div>
        </div>
      )}

      <VocabGuideModal
        isOpen={showVocabGuide}
        onClose={() => {
          setShowVocabGuide(false);
          setHasClosedVocabGuide(true);
        }}
      />

      {/* --- PLACEMENT TEST MODAL --- */}
      <PlacementTest isOpen={showPlacementTest} onClose={() => setShowPlacementTest(false)} />
      <FloatingMessenger />
    </div>
  );
}

// --- SUB-COMPONENTS ---


export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>}>
      <HomeContent />
    </Suspense>
  );
}

function TabBtn({ href, id, active, label, icon, color = "slate" }: { href: string; id: string; active: string; label: string; icon: any; color?: string }) {
  const isActive = active === id;
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3.5 rounded-xl font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
        isActive
          ? (color === "blue" ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-white text-slate-900 shadow-md ring-1 ring-slate-100")
          : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
      )}
    >
      {icon} {label}
    </Link>
  );
}

function SideTabBtn({ id, active, onClick, collapsed, icon, label }: any) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={clsx(
        "w-full flex items-center transition-all duration-300 group",
        collapsed ? "justify-center p-2.5 md:p-4 rounded-xl md:rounded-2xl" : "gap-4 p-4 rounded-2xl",
        isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      )}
    >
      <div className={clsx("shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </div>
      {!collapsed && (
        <span className="font-bold text-xs uppercase tracking-widest truncate">{label}</span>
      )}
    </button>
  );
}


function CourseIntroCard({ step, title, desc, target, color, isHot }: any) {
  const colors: any = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600"
  };
  return (
    <div className={clsx(
      "bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-500 text-center relative group",
      isHot && "ring-2 ring-emerald-500 ring-offset-8"
    )}>
      {isHot && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">Lớp tiêu điểm</div>}
      <div className={clsx("w-16 h-16 rounded-3xl flex items-center justify-center mb-8 mx-auto font-bold text-xl group-hover:scale-110 transition-transform", colors[color])}>{step}</div>
      <h3 className="text-2xl font-bold mb-4 text-slate-900 uppercase italic tracking-normal leading-none">{title}</h3>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium italic">{desc}</p>
      <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Mục tiêu đầu ra</span>
        <div className="text-emerald-600 font-bold text-sm uppercase italic tracking-tight">{target}</div>
      </div>
    </div>
  );
}

function limitMeanings(mean: string): string {
  if (!mean) return "";
  const parts = mean.split(/[;/]/).map(p => p.trim()).filter(Boolean);
  if (parts.length <= 2) return mean;
  return parts.slice(0, 2).join("; ");
}

function cleanSynonyms(syns: string): string {
  if (!syns) return "";
  return syns
    .replace(/\([^)]*\)/g, '') // Xóa phần tiếng Việt trong ngoặc ()
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string) => s)
    .slice(0, 2)
    .join(', ');
}

function DashVocabCard({ vocab, index, onUpdate, globalFlip }: any) {
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync with global flip command
  useEffect(() => {
    if (globalFlip === "front") setFlipped(false);
    if (globalFlip === "back") setFlipped(true);
  }, [globalFlip]);

  const speak = (text: string) => {
    speakVocab(text, 'us');
  };

  const toggleStarred = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await fetch('/api/user-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: vocab.word, definition: vocab.definition, action: 'delete' })
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleUnlearned = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/user-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: vocab.word, definition: vocab.definition, action: 'toggle-unlearned' })
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className={`relative h-[480px] cursor-pointer group/card ${index === 0 ? "vocab-card-first" : ""}`}
      style={{ perspective: "1000px" }}
      onClick={() => { setFlipped(!flipped); speak(vocab.word); }}
    >
      <div
        className="absolute inset-0 transition-transform duration-700 ease-in-out"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}
      >
        {/* Front */}
        <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-2 border-slate-100 p-8 flex flex-col backface-hidden group-hover/card:shadow-xl transition-all">
          <button
            onClick={toggleUnlearned}
            className={`absolute top-3 left-3 p-1.5 rounded-lg transition-all vocab-unlearned-toggle-btn ${vocab.isUnlearned ? "text-rose-500 bg-rose-50 scale-105 shadow-sm ring-1 ring-rose-100" : "text-slate-200 hover:text-rose-400 hover:bg-slate-50"}`}
          >
            <BookOpen size={16} fill={vocab.isUnlearned ? "currentColor" : "none"} />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-50 rounded-full text-[8px] text-slate-400 font-black tracking-widest border border-slate-100 shadow-sm">
            #{index + 1}
          </div>

          <button
            onClick={toggleStarred}
            className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all text-amber-400 bg-amber-50 scale-105 shadow-sm ring-1 ring-amber-100 vocab-star-toggle-btn`}
          >
            <Star size={16} fill="currentColor" />
          </button>

          <div className="mt-10 mb-2 text-left">
            <div className="text-3xl font-black text-blue-600 mb-2 flex items-center gap-3">
              {vocab.word}
              <button onClick={(e) => { e.stopPropagation(); speak(vocab.word); }} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                <Volume2 size={20} className="text-blue-400" />
              </button>
            </div>
            <div className="text-orange-400 font-bold italic text-sm mb-4">
              /{vocab.ipa?.replace(/\//g, '')}/
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 text-left scrollbar-hide">
            {vocab.example ? (
              <div 
                className="text-slate-600 text-[15px] leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: vocab.example }}
              />
            ) : (
              <div className="text-slate-600 text-[15px] leading-relaxed font-medium">---</div>
            )}
          </div>

          {vocab.synonyms && (
            <div className="mt-6 pt-4 border-t border-slate-50 text-[10px] text-teal-600 font-black uppercase tracking-[0.1em] flex items-center gap-2">
              <span className="opacity-50 italic lowercase font-bold">Hints:</span>
              <span className="bg-teal-50 px-2 py-0.5 rounded-lg">
                {cleanSynonyms(vocab.synonyms)}
              </span>
            </div>
          )}

          {/* SRS Progress Bars */}
          <div className="mt-6 flex gap-1.5 justify-center vocab-srs-bars">
            {[1, 2, 3, 4, 5].map((b) => (
              <div
                key={b}
                className={clsx(
                  "h-1.5 flex-1 rounded-full transition-all duration-700",
                  (vocab.srsBox || 1) >= b
                    ? b === 1 ? "bg-rose-500" :
                      b === 2 ? "bg-orange-500" :
                        b === 3 ? "bg-amber-500" :
                          b === 4 ? "bg-lime-500" :
                            "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    : "bg-slate-100"
                )}
              />
            ))}
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-indigo-50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-4 border-indigo-200 p-8 flex flex-col text-left"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white/80 rounded-full text-[8px] text-slate-400 font-black tracking-widest border border-blue-100/50 shadow-sm">
            #{index + 1}
          </div>

          <div className="mt-10 mb-4">
            <div className="text-3xl font-black text-blue-600 mb-2">{vocab.word}</div>
            <div className="text-red-500 font-black text-lg tracking-tight leading-tight">{limitMeanings(vocab.translation)}</div>
          </div>

          <div className="space-y-4 text-[15px] flex-1 overflow-y-auto pr-2 scrollbar-hide">
            <div className="flex flex-col gap-2">
              {vocab.example && (
                <div 
                  className="text-slate-700 leading-relaxed font-medium bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm"
                  dangerouslySetInnerHTML={{ __html: vocab.example }}
                />
              )}
              {vocab.exampleTranslation && (
                <div 
                  className="text-slate-500 italic leading-relaxed pl-4 border-l-2 border-blue-200 py-1 bg-slate-50/50 rounded-r-xl pr-3"
                  dangerouslySetInnerHTML={{ __html: vocab.exampleTranslation }}
                />
              )}
            </div>

            {/* Additional Info if available */}
            {(vocab.synonyms || vocab.antonyms || vocab.collocations || vocab.wordFamily) && (
              <div className="pt-6 space-y-6 border-t border-slate-100 mt-6 pb-4">
                {vocab.synonyms && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-teal-50 flex items-center justify-center">
                        <Link2 size={12} />
                      </div>
                      ĐỒNG NGHĨA
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vocab.synonyms
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter((s: string) => s)
                        .slice(0, 2)
                        .map((s: string, i: number) => {
                          const parts = s.split(/(\(.*?\))/);
                          return (
                            <div key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[12px] font-bold shadow-sm flex items-center gap-1.5 animate-in zoom-in-95 duration-300">
                              <span>{parts[0].trim()}</span>
                              {parts[1] && <span className="text-[10px] opacity-60 font-medium">{parts[1]}</span>}
                              <button onClick={(e) => { e.stopPropagation(); speak(parts[0].trim()); }} className="hover:text-emerald-900 ml-1 transition-colors">
                                <Volume2 size={11} />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {vocab.antonyms && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-rose-50 flex items-center justify-center">
                        <Replace size={12} />
                      </div>
                      TRÁI NGHĨA
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vocab.antonyms
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter((s: string) => s)
                        .slice(0, 2)
                        .map((s: string, i: number) => {
                          const parts = s.split(/(\(.*?\))/);
                          return (
                            <div key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-[12px] font-bold shadow-sm flex items-center gap-1.5 animate-in zoom-in-95 duration-300">
                              <span>{parts[0].trim()}</span>
                              {parts[1] && <span className="text-[10px] opacity-60 font-medium">{parts[1]}</span>}
                              <button onClick={(e) => { e.stopPropagation(); speak(parts[0].trim()); }} className="hover:text-rose-900 ml-1 transition-colors">
                                <Volume2 size={11} />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {vocab.collocations && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Layers size={12} />
                      </div>
                      CỤM TỪ ĐI KÈM
                    </div>
                    <div className="space-y-2">
                      {vocab.collocations
                        .split(',')
                        .slice(0, 3)
                        .map((s: string, i: number) => {
                          const parts = s.trim().split(/[:|-]/);
                          return (
                            <div key={i} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3 group/item hover:border-indigo-200 transition-all">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover/item:scale-150 transition-transform"></div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-black text-slate-800">{parts[0].trim()}</span>
                                {parts[1] && <span className="text-[11px] text-slate-500 font-medium italic">{parts[1].trim()}</span>}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {vocab.wordFamily && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-orange-50 flex items-center justify-center">
                        <BookOpen size={12} />
                      </div>
                      GIA ĐÌNH TỪ
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vocab.wordFamily
                        .split(',')
                        .slice(0, 4)
                        .map((s: string, i: number) => (
                          <div key={i} className="px-3 py-1.5 bg-orange-50/50 text-orange-700 rounded-xl border border-orange-100/50 text-[12px] font-bold italic">
                            {s.trim()}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SRS Progress Bars (Back) */}
          <div className="mt-auto pt-6 flex gap-1.5 justify-center">
            {[1, 2, 3, 4, 5].map((b) => (
              <div
                key={b}
                className={clsx(
                  "h-1.5 flex-1 rounded-full transition-all duration-700",
                  (vocab.srsBox || 1) >= b
                    ? b === 1 ? "bg-rose-400" :
                      b === 2 ? "bg-orange-400" :
                        b === 3 ? "bg-amber-400" :
                          b === 4 ? "bg-lime-400" :
                            "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    : "bg-white/50"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashCard({ icon, label, value, detail }: any) {
  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-50 transition-all group duration-500">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white transition-all shadow-inner">
        {icon}
      </div>
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</h4>
      <p className="text-3xl font-bold text-slate-900 mb-2 italic tracking-normal leading-none">{value}</p>
      <p className="text-xs text-slate-400 font-bold italic">{detail}</p>
    </div>
  );
}

// Định nghĩa VocabGuideModal trùng lặp ở cuối tệp đã được loại bỏ và chuyển sang component modular độc lập tại src/components/Vocab/VocabGuideModal.tsx.