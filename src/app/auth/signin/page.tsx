"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "Email này không được phép đăng nhập theo cách này.",
  CredentialsSignin:     "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.",
  SessionRequired:       "Bạn cần đăng nhập để tiếp tục.",
  Default:               "Đã xảy ra lỗi, vui lòng thử lại sau.",
};

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const urlError = searchParams.get("error") ?? "";
  const [error, setError] = useState(ERROR_MESSAGES[urlError] ?? (urlError ? ERROR_MESSAGES.Default : ""));

  const rawCallback = searchParams.get("callbackUrl") || "";
  const callbackUrl = rawCallback.includes("error=") ? "/?tab=dashboard" : rawCallback || "/?tab=dashboard";

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.Default);
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("Đã xảy ra lỗi hệ thống, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[100px] opacity-70"></div>
        <div className="absolute top-[60%] -right-[10%] w-[30%] h-[40%] rounded-full bg-indigo-100 blur-[80px] opacity-60"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 hover:rotate-6 transition-transform">
          <GraduationCap className="text-white" size={32} />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900 uppercase italic">
          BẮT ĐẦU HỌC NGAY
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          Đăng nhập để tiếp tục hành trình chinh phục TOEIC
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-[3rem] sm:px-12 border border-white">
          
          {/* Google Sign In - NEW */}
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex justify-center items-center gap-3 py-4 px-4 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-[0.98] group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
              />
              <path
                fill="#34A853"
                d="M16.04 18.013c-1.09.585-2.346.903-3.66.903a7.07 7.07 0 0 1-6.717-4.887l-4.04 3.114C3.553 21.1 7.495 24 12 24c3.055 0 5.783-1.01 7.803-2.733l-3.762-3.254Z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.84-.075-1.65-.214-2.434H12v4.604h6.442a5.504 5.504 0 0 1-2.39 3.61l3.762 3.254c2.201-2.032 3.678-5.023 3.678-8.761Z"
              />
              <path
                fill="#FBBC05"
                d="M5.663 14.03a7.062 7.062 0 0 1 0-4.06L1.637 6.855a11.824 11.824 0 0 0 0 10.29l4.026-3.115Z"
              />
            </svg>
            <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Đăng nhập bằng Google</span>
          </button>

          <div className="my-8 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hoặc dùng Email</span>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          {/* Thông báo học thử */}
          <div className="mb-8 p-5 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
            <ShieldCheck className="text-emerald-500 mx-auto mb-3" size={28} />
            <p className="text-xs font-bold text-emerald-700 leading-relaxed">
              Dùng tài khoản <span className="font-black uppercase">Google</span> để nhận ngay 
              <br />
              <span className="text-emerald-600 font-black text-lg">7 NGÀY HỌC THỬ MIỄN PHÍ</span>
              <br />
              <span className="text-slate-500 font-medium mt-2 block italic text-[10px]">
                * Học viên đã có tài khoản VIP vui lòng đăng nhập phía dưới
              </span>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleCredentialsLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold text-center border border-red-100">
                {error}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium bg-slate-50/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-[2rem] shadow-xl shadow-blue-100 text-sm font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"} <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
              ← Quay lại trang chủ
            </Link>
          </div>

          <div className="mt-8 text-center text-xs font-medium text-slate-400 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Bảo mật an toàn bởi hoctoeic PRO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Đang tải...</div>}>
      <SignInForm />
    </Suspense>
  );
}
