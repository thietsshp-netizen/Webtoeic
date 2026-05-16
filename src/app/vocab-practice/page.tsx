"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import VocabGamePlayer from "@/components/Vocab/VocabGamePlayer";

export default function VocabPracticePage() {
  const { data: session, status } = useSession();
  const [vocabs, setVocabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user-vocabulary")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setVocabs(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (vocabs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8">
          <Star size={48} className="text-slate-200" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4 uppercase italic">Chưa có từ vựng nào</h1>
        <p className="text-slate-500 mb-10 max-w-md">Hãy tra từ điển và gắn sao ⭐ những từ bạn muốn học để bắt đầu luyện tập tại đây.</p>
        <Link href="/?tab=dashboard" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3">
          <ArrowLeft size={18} /> Quay lại Dashboard
        </Link>
      </div>
    );
  }

  // Chuyển đổi dữ liệu sang định dạng mà VocabGamePlayer hiểu
  const mappedWords = vocabs.map((v, index) => ({
    id: index,
    word: v.word,
    ipa: v.ipa || "",
    mean: v.definition,
    ex: v.example || "",
    exVi: v.exampleTranslation || "",
    synonyms: v.synonyms || "",
    antonyms: v.antonyms || "",
    collocations: v.collocations || "",
    wordFamily: v.wordFamily || "",
    vocabDayId: v.vocabDayId,
    wordId: v.wordId,
    source: v.source,
    dbId: v.id,
    syns: v.synonyms ? v.synonyms.split(',').map((s: string) => s.trim()) : []
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nút quay lại Dashboard đặt trên cùng để dễ điều hướng */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/?tab=dashboard" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest">
            <ArrowLeft size={14} /> Quay lại Dashboard
          </Link>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Chế độ luyện tập cá nhân
          </div>
        </div>
      </div>

      <div className="flex-1">
        <VocabGamePlayer
          vocabDayId="personal-vocab"
          dayNumber={0}
          title="SỔ TAY TỪ VỰNG CỦA BẠN"
          data={mappedWords}
          userId={(session?.user as any)?.id}
        />
      </div>
    </div>
  );
}
