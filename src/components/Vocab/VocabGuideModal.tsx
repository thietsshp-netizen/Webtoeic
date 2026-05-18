"use client";

import React from "react";
import { HelpCircle, X, ChevronRight, TrendingUp, History, Layers, BookOpen, Star, Gamepad2 } from "lucide-react";
import clsx from "clsx";

interface VocabGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VocabGuideModal({ isOpen, onClose }: VocabGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <HelpCircle className="text-blue-500" />
              Hướng dẫn học Sổ tay thông minh
            </h3>
            <p className="text-slate-400 font-medium text-sm mt-1">Cơ chế ghi nhớ lặp lại ngắt quãng (SRS)</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-hide">
          <VocabGuideContent onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

export function VocabGuideContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="space-y-12">
      {/* Intro */}
      <section className="space-y-4">
        <p className="text-slate-600 font-medium leading-relaxed">
          Chào mừng bạn đến với hệ thống học từ vựng thông minh của hoctoeic. Hệ thống này không chỉ là nơi lưu trữ, mà còn là một "huấn luyện viên" giúp bạn ghi nhớ từ vựng vào trí nhớ dài hạn bằng phương pháp <strong className="text-blue-600">Lặp lại ngắt quãng (Spaced Repetition System - SRS)</strong> dựa trên quy tắc 5 Hộp Leitner.
        </p>
      </section>

      {/* Section 1 */}
      <section className="space-y-6">
        <h5 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">1</span>
          Cơ chế 5 Cấp độ Ghi nhớ (Thanh 5 vạch)
        </h5>
        <p className="text-slate-600 font-medium leading-relaxed">
          Mỗi từ vựng trong sổ tay của bạn sẽ có một thanh tiến trình gồm <strong className="text-slate-900">5 vạch</strong> phía dưới. Đây chính là thước đo độ "thấm" của từ đó vào não bộ:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
          {[
            { l: "Hộp 1", t: "Hàng ngày", d: "1 vạch Đỏ", c: "text-rose-600 bg-rose-50 border-rose-100", i: "Từ mới/Vừa quên" },
            { l: "Hộp 2", t: "Sau 2 ngày", d: "2 vạch Cam", c: "text-orange-600 bg-orange-50 border-orange-100", i: "Nhớ sơ bộ" },
            { l: "Hộp 3", t: "Sau 7 ngày", d: "3 vạch Vàng", c: "text-amber-600 bg-amber-50 border-amber-100", i: "Trí nhớ trung hạn" },
            { l: "Hộp 4", t: "Sau 14 ngày", d: "4 vạch Chanh", c: "text-lime-600 bg-lime-50 border-lime-100", i: "Trí nhớ bền vững" },
            { l: "Hộp 5", t: "Sau 30 ngày", d: "5 vạch Xanh lá", c: "text-emerald-600 bg-emerald-50 border-emerald-100", i: "Trí nhớ dài hạn" },
          ].map((item, i) => (
            <div key={i} className={clsx("p-4 rounded-[2rem] border flex flex-col items-center text-center transition-all hover:scale-[1.05] relative", item.c)}>
              <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center font-black text-xs mb-3 border border-white/50">{i + 1}</div>
              <div className="font-black text-[11px] uppercase tracking-tighter mb-1 opacity-80">{item.d}</div>
              <div className="text-sm font-black mb-1">{item.t}</div>
              <div className="text-[10px] font-bold leading-tight opacity-70">{item.i}</div>
              {i < 4 && (
                <div className="hidden md:block absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                  <ChevronRight size={14} className="opacity-30" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center font-black text-slate-800 text-sm mt-10 mb-4">
          Các hộp Leitner hiển thị trên thẻ từ như hình dưới đây:
        </div>
        <div className="bg-slate-50 rounded-[2.5rem] p-4 border border-slate-100">
          <img
            src="/guide/srs-tutorial.png"
            alt="Chỉ báo 5 vạch cấp độ ghi nhớ"
            className="w-full rounded-3xl shadow-lg border-4 border-white animate-in zoom-in duration-300"
          />
          <p className="text-center text-xs text-slate-400 font-bold mt-4 italic">Hình minh họa: Các thẻ từ với thanh 5 vạch thể hiện cấp độ ghi nhớ khác nhau.</p>
        </div>
      </section>

      {/* Section 2 */}
      <section className="space-y-6">
        <h5 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">2</span>
          Quy tắc "Thăng cấp" và "Giáng cấp" Tự động
        </h5>
        <p className="text-slate-600 font-medium leading-relaxed">
          Hệ thống sẽ tự động theo dõi kết quả của bạn thông qua các trò chơi (Xếp chữ, Điền từ, Ghép từ...):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-500">
              <TrendingUp size={20} />
            </div>
            <h6 className="font-black text-emerald-900 uppercase text-xs tracking-widest">Khi bạn trả lời ĐÚNG</h6>
            <p className="text-emerald-700 text-[13px] font-medium leading-relaxed">
              Từ vựng sẽ được thăng lên 1 cấp (thêm 1 vạch).
              <br /><br />
              <span className="text-[11px] italic font-bold">*Lưu ý: Mỗi từ chỉ được lên tối đa 1 cấp trong vòng 24 giờ.*</span>
            </p>
          </div>
          <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 space-y-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-rose-500">
              <History size={20} />
            </div>
            <h6 className="font-black text-rose-900 uppercase text-xs tracking-widest">Khi bạn trả lời SAI (hoặc xem đáp án)</h6>
            <p className="text-rose-700 text-[13px] font-medium leading-relaxed">
              Hệ thống sẽ coi như bạn đã quên từ này. Ngay lập tức, từ đó sẽ bị <strong className="text-rose-900 underline">đưa về Hộp 1 (1 vạch đỏ)</strong>, bất kể trước đó nó đang ở cấp độ nào.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="space-y-6">
        <h5 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">3</span>
          Mục "CẦN ÔN TẬP" hoạt động thế nào?
        </h5>
        <p className="text-slate-600 font-medium leading-relaxed">
          Đây là phần quan trọng nhất để tối ưu thời gian học của bạn. Một từ sẽ xuất hiện trong mục <strong className="text-slate-900">Cần ôn tập</strong> khi:
        </p>
        <div className="space-y-3">
          {[
            "Nó là từ mới chưa từng được học.",
            "Đã đến \"ngày hẹn\" ôn tập dựa theo cấp độ của nó (ví dụ: một từ ở Hộp 3 đã được học từ 7 ngày trước)."
          ].map((text, i) => (
            <div key={i} className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 text-sm">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs flex-shrink-0">{i + 1}</div>
              {text}
            </div>
          ))}
        </div>
        <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10 flex gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Layers size={20} /></div>
            <div>
              <h6 className="font-black uppercase text-xs tracking-widest mb-1 italic">Chiến thuật học hiệu quả:</h6>
              <p className="text-[13px] font-medium leading-relaxed opacity-90">Mỗi ngày, bạn chỉ cần tập trung xử lý hết số lượng từ trong tab <strong className="text-white underline text-[14px]">CẦN ÔN TẬP</strong>. Khi con số này về 0, nghĩa là bạn đã hoàn thành kế hoạch ghi nhớ của ngày hôm đó!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section className="space-y-8">
        <h5 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">4</span>
          Các nút chức năng quan trọng
        </h5>
        <div className="flex justify-center">
          <div className="bg-slate-50 rounded-[2.5rem] p-4 border border-slate-100 inline-block">
            <img
              src="/guide/Function.png"
              alt="Các nút chức năng trên thẻ từ"
              className="max-w-md w-full rounded-2xl shadow-lg border-2 border-white"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/800x200/f8fafc/3b82f6?text=Các+nút+chức+năng";
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              l: "Biểu tượng Quyển sách (Góc trái)",
              d: "Đánh dấu từ Chưa thuộc. Bạn có thể dùng nút này để lọc riêng những từ khó để luyện tập thêm trong tab 'CHƯA THUỘC'.",
              icon: <BookOpen className="text-rose-500" size={20} />
            },
            {
              l: "Biểu tượng Ngôi sao (Góc phải)",
              d: "Thể hiện từ này đang nằm trong Sổ tay của bạn. Bấm vào để bỏ lưu nếu bạn thấy không cần thiết nữa.",
              icon: <Star className="text-amber-500 fill-amber-500" size={20} />
            },
            {
              l: "Nút 'HIỆN MẶT SAU'",
              d: "Giúp bạn lật nhanh tất cả các thẻ từ để kiểm tra nghĩa và ví dụ, thay vì phải bấm vào từng thẻ.",
              icon: <Layers className="text-blue-500" size={20} />
            },
            {
              l: "Các tab Trò chơi",
              d: "Khi bấm vào các tab như Xếp chữ, Ghép từ... hệ thống sẽ chỉ lấy những từ đang hiển thị ở danh sách bên dưới để đưa vào trò chơi.",
              icon: <Gamepad2 className="text-emerald-500" size={20} />
            },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3 transition-all hover:border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shadow-inner">
                  {item.icon}
                </div>
                <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{item.l}</div>
              </div>
              <p className="text-slate-500 text-[13px] font-medium leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {onClose && (
        <div className="pt-6 pb-4 flex flex-col items-center gap-6 border-t border-slate-100">
          <p className="text-slate-900 font-black italic">Chúc bạn có những giờ phút học tập hiệu quả và sớm làm chủ kho từ vựng TOEIC!</p>
          <button
            onClick={onClose}
            className="px-16 py-6 bg-blue-600 text-white font-black rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-200 uppercase tracking-widest text-xs"
          >
            Tôi đã hiểu, bắt đầu học ngay!
          </button>
        </div>
      )}
    </div>
  );
}
