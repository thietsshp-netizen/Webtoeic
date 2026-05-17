"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GraduationCap, BookOpen, Layout, Star, Settings, X, User, Mail, ShieldCheck, Key, Loader2, LogOut } from "lucide-react";
import { clsx } from "clsx";

export default function SiteHeader() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({ displayName: "", password: "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ type: "", text: "" });

  // Hàm tạo màu từ string (email) để mỗi user có 1 màu riêng
  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
      'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
    ];
    if (!email) return colors[0];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return "??";
  };

  const userInitials = getInitials(session?.user?.name || "", session?.user?.email || "");
  const avatarColor = getAvatarColor(session?.user?.email || "");

  // Reset modal state when opened
  useEffect(() => {
    if (showProfileModal && session?.user?.name) {
      setProfileData(prev => ({ ...prev, displayName: session.user?.name || "", password: "" }));
      setUpdateMsg({ type: "", text: "" });
    }
  }, [showProfileModal, session]);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setUpdateMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/me/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Lỗi cập nhật");

      // Update session realtime
      await update({ name: profileData.displayName });

      setUpdateMsg({ type: "success", text: "Cập nhật thành công!" });
      setProfileData(prev => ({ ...prev, password: "" }));
    } catch (e: any) {
      setUpdateMsg({ type: "error", text: e.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const isCoursesPath = pathname === "/courses";
  const isHomePath = pathname === "/";
  const activeTab = isCoursesPath ? "courses" : isHomePath ? "intro" : "";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              hoctoeic
              <span className="text-blue-600 block text-[10px] uppercase tracking-[0.3em] font-black -mt-1">E-LEARNING SYSTEM</span>
            </span>
          </Link>

          {/* Tab Navigation */}
          <div className="hidden md:flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
            <NavTab href="/" active={activeTab === "intro"} label="GIỚI THIỆU" icon={<Star size={16} />} />
            <NavTab href="/courses" active={activeTab === "courses"} label="KHÓA HỌC" icon={<BookOpen size={16} />} />
            <NavTab href="/?tab=dashboard" active={false} label="DASHBOARD" icon={<Layout size={16} />} />
          </div>

          {/* Auth Area */}
          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link href="/admin/enrollments" className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl font-black text-xs uppercase transition-all shadow-md">
                    🛠️ Quản trị
                  </Link>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-800 leading-none">
                      {session?.user?.name || session?.user?.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-1">
                      {isAdmin ? (
                        <span className="text-blue-500">Quản trị viên</span>
                      ) : (session?.user as any)?.daysLeft !== undefined ? (
                        (() => {
                          const days = (session?.user as any).daysLeft;
                          if (days > 0) return <span className="text-emerald-500">Tài khoản Pro: Còn {days} ngày</span>;
                          if (days === 0) return <span className="text-amber-500">Tài khoản Pro: Ngày cuối cùng</span>;
                          return <span className="text-rose-500">Tài khoản Pro: Đã hết hạn (-1)</span>;
                        })()
                      ) : (
                        <span className="text-emerald-500">Hội viên Pro</span>
                      )}
                    </span>
                  </div>

                  <div
                    className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center font-black text-[11px] text-white shadow-lg shadow-blue-500/20`}
                  >
                    {userInitials}
                  </div>

                  <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all active:scale-90"
                      title="Cài đặt tài khoản"
                    >
                      <Settings size={20} />
                    </button>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="p-2.5 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all active:scale-90"
                      title="Đăng xuất"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/auth/signin" className="bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl transition-all active:scale-95">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- PROFILE MODAL --- */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Cài đặt tài khoản</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Học viên: {session?.user?.email}</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-white rounded-full transition-colors border border-slate-100 shadow-sm"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {updateMsg.text && (
                <div className={`p-4 rounded-2xl text-xs font-bold border ${updateMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {updateMsg.type === 'success' ? '✅' : '⚠️'} {updateMsg.text}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Tên hiển thị trên web</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"><Star size={18} /></span>
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-blue-50/30 border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                    placeholder="Nhập tên mới..."
                    value={profileData.displayName}
                    onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Mật khẩu mới</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Key size={18} /></span>
                  <input
                    type="password"
                    placeholder="Để trống nếu không đổi"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                    value={profileData.password}
                    onChange={e => setProfileData({ ...profileData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 pb-2">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      <ShieldCheck size={18} className="group-hover:rotate-12 transition-transform" />
                      LƯU THAY ĐỔI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavTab({ href, active, label, icon }: { href: string; active: boolean; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
        active
          ? "bg-white text-slate-900 shadow-sm border border-slate-100"
          : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
      )}
    >
      {icon} {label}
    </Link>
  );
}
