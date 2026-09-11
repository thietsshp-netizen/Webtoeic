"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Settings, Edit, Check, X, CheckCircle, ChevronLeft, ChevronRight, HelpCircle, Maximize2, Minimize2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useAdminEdit } from "@/components/Admin/AdminEditProvider";
import { useSession } from "next-auth/react";
import { showToast } from "@/components/UI/Toast";
import { 
  Subtitle, 
  SubtitleExpansion, 
  ExpansionVocabItem, 
  ExpansionStructureItem,
  ExpansionPopupCallbacks,
  FlattenedExpansionItem,
  getFlattenedExpansionItems, 
  isItemFromOriginal,
  updateMovieExpansionPopupDom,
  sanitizeExpansionJson
} from "./MovieExpansionManager";

// Pre-rendered typewriter click audio buffer for zero-CPU, leak-free mechanical sound
let cachedTypewriterBuffer: AudioBuffer | null = null;

function getTypewriterClickBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedTypewriterBuffer && cachedTypewriterBuffer.sampleRate === ctx.sampleRate) {
    return cachedTypewriterBuffer;
  }
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * 0.02); // 20ms
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 240);
    const click = Math.sin(2 * Math.PI * 2600 * t) * 0.5;
    const thud = Math.sin(2 * Math.PI * 170 * t) * 0.35;
    data[i] = (click + thud) * env * 0.2;
  }
  cachedTypewriterBuffer = buffer;
  return buffer;
}

const playTypewriterClickSound = (audioCtxRef: React.MutableRefObject<AudioContext | null>) => {
  try {
    if (typeof window === "undefined") return;
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioCtxClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const buffer = getTypewriterClickBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      try {
        source.disconnect();
      } catch {}
    };
    source.start();
  } catch (e) {}
};

interface YoutubeDictationPlayerProps {
  lessonId: string;
  videoUrl: string;
  content: string; // JSON string of Subtitle[]
  courseId?: string;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
    YT: any;
  }
}

const renderFormattedNote = (noteText: string, fontSize: number) => {
  if (!noteText) return null;
  
  // Split by *, newlines, or numbered list indicators (e.g., "2. ", "3. ")
  const parts = noteText
    .split(/(?:\*|\r?\n|\s*\d+\.\s+)/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <p 
      style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
      className="mt-1 leading-relaxed text-slate-600"
    >
      {parts.map((part, pIdx) => {
        // Case 1: Category: 'Phrase' (meaning) or Category: 'Phrase' meaning
        // Example: "Collocation: 'stuffed animals' (thú nhồi bông)"
        // Transforms to: "stuffed animals (collocation): thú nhồi bông"
        const categoryQuotedRegex = /^([A-Za-z0-9\/\s\-]+)\s*:\s*['"](.*?)['"](?=\s*(?::|\(|\s+nghĩa\s+là|\s+là|$))\s*(.*)$/;
        const catMatch = part.match(categoryQuotedRegex);
        
        if (catMatch) {
          const category = catMatch[1].trim();
          const phrase = catMatch[2].trim();
          const rest = catMatch[3].trim();
          
          // Clean up surrounding parentheses from the translation if present (e.g. "(thú nhồi bông)" -> "thú nhồi bông")
          let cleanRest = rest;
          if (cleanRest.startsWith("(") && cleanRest.endsWith(")")) {
            cleanRest = cleanRest.substring(1, cleanRest.length - 1).trim();
          }
          // Strip trailing period if present
          if (cleanRest.endsWith(".")) {
            cleanRest = cleanRest.substring(0, cleanRest.length - 1).trim();
          }
          
          return (
            <span key={pIdx} className="inline-flex items-center flex-wrap mr-2.5 mb-0.5">
              <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded text-[11px] mr-1">
                {phrase}
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1 rounded mr-1">
                {category}
              </span>
              <span className="text-slate-700 font-medium">
                {cleanRest}
              </span>
            </span>
          );
        }

        // Case 2: Standard Term: Definition or Term (Category): Definition
        const splitIdx = part.indexOf(":");
        if (splitIdx === -1) {
          return (
            <span key={pIdx} className="mr-2 inline-block">
              {part}
            </span>
          );
        }

        const rawTerm = part.substring(0, splitIdx).trim();
        const definition = part.substring(splitIdx + 1).trim();
        
        // Remove surrounding single/double quotes if present
        let cleanTerm = rawTerm;
        if ((cleanTerm.startsWith("'") && cleanTerm.endsWith("'")) || (cleanTerm.startsWith('"') && cleanTerm.endsWith('"'))) {
          cleanTerm = cleanTerm.substring(1, cleanTerm.length - 1);
        }

        return (
          <span key={pIdx} className="inline-block mr-3">
            <span className="font-bold text-slate-400 text-[10px] mr-1">
              {pIdx + 1}.
            </span>
            <span className="font-extrabold text-purple-600">
              {cleanTerm}
            </span>
            <span className="text-slate-400 font-bold mr-1.5">:</span>
            <span className="text-amber-700 font-medium">
              {definition}
            </span>
          </span>
        );
      })}
    </p>
  );
};

const formatAutoStudyIpa = (rawIpa?: string): string => {
  if (!rawIpa) return "";
  const cleaned = rawIpa.trim().replace(/^\/+|\/+$/g, "").replace(/^\[+|\]+$/g, "").trim();
  return cleaned ? ` [${cleaned}]` : "";
};

const getAutoStudyItemText = (it: FlattenedExpansionItem): string => {
  const isVocab = it.type === "vocabulary";
  if (isVocab) {
    const w = it.word || "";
    const ipa = formatAutoStudyIpa(it.ipa);
    const m = it.meaning || "";
    let sfText = "";
    if (it.semantic_field_expansion && it.semantic_field_expansion.length > 0) {
      sfText = " Mở rộng:" + it.semantic_field_expansion.map(sf => {
        const t = sf.type ? ` [${sf.type}]` : "";
        const expr = sf.expression ? ` ${sf.expression}` : "";
        const mean = sf.meaning ? ` — ${sf.meaning}` : "";
        const rawExEn = sf.example_en ? sf.example_en.replace(/<[^>]*>/g, '').trim() : "";
        const rawExVi = sf.example_vi ? sf.example_vi.trim() : "";
        const exEn = rawExEn ? ` ${rawExEn}` : "";
        const exVi = rawExVi ? ` (${rawExVi})` : "";
        return `${t}${expr}${mean}${exEn}${exVi}`;
      }).join("");
    } else {
      const syn = it.synonyms ? ` Đồng nghĩa: ${it.synonyms}` : (it.antonyms ? ` Trái nghĩa: ${it.antonyms}` : "");
      const primaryEx = it.examples && it.examples.length > 0 ? it.examples[0] : null;
      const rawExEn = primaryEx?.en ? primaryEx.en.replace(/<[^>]*>/g, '').trim() : "";
      const rawExVi = primaryEx?.vi ? primaryEx.vi.trim() : "";
      const exEn = rawExEn ? ` ${rawExEn}` : "";
      const exVi = rawExVi ? ` (${rawExVi})` : "";
      sfText = syn + exEn + exVi;
    }
    return w + ipa + m + sfText;
  } else {
    // Structure: Giữ nguyên
    const p = it.pattern || "";
    const ipa = formatAutoStudyIpa(it.ipa);
    const m = it.meaning || "";
    const syn = it.synonyms ? ` Đồng nghĩa: ${it.synonyms}` : (it.antonyms ? ` Trái nghĩa: ${it.antonyms}` : "");
    const primaryEx = it.examples && it.examples.length > 0 ? it.examples[0] : null;
    const rawExEn = primaryEx?.en ? primaryEx.en.replace(/<[^>]*>/g, '').trim() : "";
    const rawExVi = primaryEx?.vi ? primaryEx.vi.trim() : "";
    const exEn = rawExEn ? ` ${rawExEn}` : "";
    const exVi = rawExVi ? ` (${rawExVi})` : "";
    return p + ipa + m + syn + exEn + exVi;
  }
};

// Bảng từ điển các biến thể động từ thông dụng & bất quy tắc (Irregular Verbs & Common Verb Inflections)
const VERB_STEMS_MAP: Record<string, string[]> = {
  move: ["move", "moves", "moved", "moving"],
  pack: ["pack", "packs", "packed", "packing"],
  pick: ["pick", "picks", "picked", "picking"],
  clean: ["clean", "cleans", "cleaned", "cleaning"],
  pass: ["pass", "passes", "passed", "passing"],
  carry: ["carry", "carries", "carried", "carrying"],
  tear: ["tear", "tears", "tore", "torn", "tearing"],
  show: ["show", "shows", "showed", "shown", "showing"],
  fill: ["fill", "fills", "filled", "filling"],
  call: ["call", "calls", "called", "calling"],
  point: ["point", "points", "pointed", "pointing"],
  shut: ["shut", "shuts", "shutting"],
  lock: ["lock", "locks", "locked", "locking"],
  kick: ["kick", "kicks", "kicked", "kicking"],
  cheer: ["cheer", "cheers", "cheered", "cheering"],
  figure: ["figure", "figures", "figured", "figuring"],
  wake: ["wake", "wakes", "woke", "woken", "waking"],
  dress: ["dress", "dresses", "dressed", "dressing"],
  cross: ["cross", "crosses", "crossed", "crossing"],
  cut: ["cut", "cuts", "cutting"],
  burn: ["burn", "burns", "burned", "burnt", "burning"],
  hand: ["hand", "hands", "handed", "handing"],
  let: ["let", "lets", "letting"],
  pay: ["pay", "pays", "paid", "paying"],
  check: ["check", "checks", "checked", "checking"],
  drop: ["drop", "drops", "dropped", "dropping"],
  pull: ["pull", "pulls", "pulled", "pulling"],
  push: ["push", "pushes", "pushed", "pushing"],
  step: ["step", "steps", "stepped", "stepping"],
  grow: ["grow", "grows", "grew", "grown", "growing"],
  go: ["go", "goes", "went", "gone", "going"],
  take: ["take", "takes", "took", "taken", "taking"],
  get: ["get", "gets", "got", "gotten", "getting"],
  make: ["make", "makes", "made", "making"],
  have: ["have", "has", "had", "having"],
  see: ["see", "sees", "saw", "seen", "seeing"],
  know: ["know", "knows", "knew", "known", "knowing"],
  say: ["say", "says", "said", "saying"],
  come: ["come", "comes", "came", "coming"],
  give: ["give", "gives", "gave", "given", "giving"],
  keep: ["keep", "keeps", "kept", "keeping"],
  feel: ["feel", "feels", "felt", "feeling"],
  leave: ["leave", "leaves", "left", "leaving"],
  find: ["find", "finds", "found", "finding"],
  think: ["think", "thinks", "thought", "thinking"],
  tell: ["tell", "tells", "told", "telling"],
  lose: ["lose", "loses", "lost", "losing"],
  put: ["put", "puts", "putting"],
  run: ["run", "runs", "ran", "running"],
  bring: ["bring", "brings", "brought", "bringing"],
  buy: ["buy", "buys", "bought", "buying"],
  catch: ["catch", "catches", "caught", "catching"],
  fall: ["fall", "falls", "fell", "fallen", "falling"],
  hear: ["hear", "hears", "heard", "hearing"],
  hold: ["hold", "holds", "held", "holding"],
  lead: ["lead", "leads", "led", "leading"],
  meet: ["meet", "meets", "met", "meeting"],
  read: ["read", "reads", "reading"],
  set: ["set", "sets", "setting"],
  sit: ["sit", "sits", "sat", "sitting"],
  speak: ["speak", "speaks", "spoke", "spoken", "speaking"],
  stand: ["stand", "stands", "stood", "standing"],
  understand: ["understand", "understands", "understood", "understanding"],
  win: ["win", "wins", "won", "winning"],
  write: ["write", "writes", "wrote", "written", "writing"],
  kill: ["kill", "kills", "killed", "killing"],
  die: ["die", "dies", "died", "dying"],
  drive: ["drive", "drives", "drove", "driven", "driving"],
  hang: ["hang", "hangs", "hung", "hanging"],
  blow: ["blow", "blows", "blew", "blown", "blowing"],
  break: ["break", "breaks", "broke", "broken", "breaking"],
  hit: ["hit", "hits", "hitting"],
  throw: ["throw", "throws", "threw", "thrown", "throwing"],
  turn: ["turn", "turns", "turned", "turning"],
  walk: ["walk", "walks", "walked", "walking"],
  work: ["work", "works", "worked", "working"],
  look: ["look", "looks", "looked", "looking"],
  watch: ["watch", "watches", "watched", "watching"]
};

// Helper: Xây dựng Regex pattern cho 1 từ đơn (xử lý chia thì, đuôi e, gấp đôi phụ âm, bất quy tắc)
const buildWordRegexPattern = (w: string): string => {
  const clean = w.toLowerCase().replace(/[^a-z0-9']/g, '');
  if (!clean) return "";

  // 1. Placeholder pronouns / object placeholders
  if (["someone", "somebody", "sb", "one's", "oneself", "myself", "yourself", "himself", "herself", "themselves", "ourselves"].includes(clean)) {
    return `(?:someone|somebody|sb|myself|yourself|himself|herself|themselves|ourselves|me|you|him|her|them|us|one's|my|your|his|their|our|\\w+(?:'s)?)`;
  }
  if (["something", "sth"].includes(clean)) {
    return `(?:something|sth|it|this|that|\\w+)`;
  }

  // 2. Irregular & common verb stems
  for (const [, forms] of Object.entries(VERB_STEMS_MAP)) {
    if (forms.includes(clean)) {
      return `(?:${forms.join("|")})`;
    }
  }

  // 3. Verbs ending in -e (move -> move, moves, moved, moving; hope, store, save...)
  if (clean.endsWith('e') && clean.length >= 3) {
    const stem = clean.slice(0, -1);
    return `(?:${clean}|${clean}s|${clean}d|${stem}ing)`;
  }

  // 4. Verbs ending in consonant doubling (stop -> stopped, stopping; drop, plan, run, hit...)
  if (clean.length >= 3 && /[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/i.test(clean) && !/[wxy]$/i.test(clean)) {
    const lastChar = clean.slice(-1);
    return `(?:${clean}|${clean}s|${clean}es|${clean}ed|${clean}${lastChar}ed|${clean}ing|${clean}${lastChar}ing)`;
  }

  // 5. Regular verb / noun inflection (-s, -es, -ed, -ing)
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (clean.length > 3) {
    const base = clean.replace(/(?:ing|ed|es|s)$/, '');
    if (base.length >= 3) {
      return `(?:${escaped}|${base}(?:ing|ed|es|s|d)?)`;
    }
  }

  return escaped;
};

// Helper: Xây dựng Regex thông minh cho cụm từ liền kề
const buildFlexiblePhraseRegex = (phrase: string): RegExp => {
  const words = phrase.trim().split(/\s+/);
  const regexParts = words.map(w => buildWordRegexPattern(w)).filter(Boolean);

  if (regexParts.length === 0) {
    const fallbackEscaped = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${fallbackEscaped}\\b`, 'gi');
  }

  return new RegExp(`\\b${regexParts.join("[\\s\\-\\–',]+")}\\b`, 'gi');
};

const renderHighlightedSubtitle = (
  rawText: string,
  vocabItems: FlattenedExpansionItem[],
  activeItemIdx: number,
  isAutoStudyActive: boolean,
  isReplaying: boolean,
  isLightMode: boolean = false
): React.ReactNode => {
  if (!isAutoStudyActive || !vocabItems || vocabItems.length === 0 || !rawText) {
    return rawText;
  }

  // Find occurrences of each vocabItem in rawText
  interface MatchInterval {
    start: number;
    end: number;
    itemIdx: number;
    item: FlattenedExpansionItem;
  }

  const intervals: MatchInterval[] = [];

  vocabItems.forEach((it, itIdx) => {
    // 0. Ưu tiên 1 (Tuyệt đối chính xác 100%): Dùng matched_text nguyên văn do Gemini gắn cờ trực tiếp
    const exactMatchedText = (it.matched_text || "").trim();
    if (exactMatchedText) {
      // Nếu matched_text chứa dấu phân tách cụm rời (ví dụ: "moved ... out", "moved / out", "moved ~ out")
      const splitParts = exactMatchedText.split(/\s*(?:\.\.\.|\.\.|\/|~)\s*/).filter(Boolean);
      if (splitParts.length > 1) {
        let allMatched = true;
        const tempIntervals: MatchInterval[] = [];
        let searchFrom = 0;
        for (const part of splitParts) {
          const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regexPart = new RegExp(`\\b${escapedPart}\\b`, 'gi');
          const sliceText = rawText.slice(searchFrom);
          const matchPart = regexPart.exec(sliceText);
          if (matchPart) {
            const partStart = searchFrom + matchPart.index;
            const partEnd = partStart + matchPart[0].length;
            tempIntervals.push({
              start: partStart,
              end: partEnd,
              itemIdx: itIdx,
              item: it
            });
            searchFrom = partEnd;
          } else {
            allMatched = false;
            break;
          }
        }
        if (allMatched && tempIntervals.length > 0) {
          intervals.push(...tempIntervals);
          return;
        }
      }

      try {
        const escaped = exactMatchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        let match = regex.exec(rawText);
        if (!match) {
          regex = new RegExp(escaped, 'gi');
          match = regex.exec(rawText);
        }
        if (match) {
          intervals.push({
            start: match.index,
            end: match.index + match[0].length,
            itemIdx: itIdx,
            item: it
          });
          return;
        }
      } catch {
        // ignore and fallback
      }
    }

    const word = (it.word || it.pattern || "").trim();
    if (!word) return;

    // 1. Khớp thông minh nguyên cụm liền kề (Contiguous matching with irregular & inflections)
    try {
      const smartRegex = buildFlexiblePhraseRegex(word);
      const match = smartRegex.exec(rawText);
      if (match) {
        intervals.push({
          start: match.index,
          end: match.index + match[0].length,
          itemIdx: itIdx,
          item: it
        });
        return;
      }
    } catch {
      // ignore regex error and try fallback
    }

    // 2. Khớp cụm động từ tách rời (Separable Phrasal Verbs, e.g. "move out" -> "moved her stuff out", "pick up" -> "picked it up")
    try {
      const words = word.split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        const firstPattern = buildWordRegexPattern(words[0]);
        const lastPattern = buildWordRegexPattern(words[words.length - 1]);
        if (firstPattern && lastPattern) {
          // Cho phép cách nhau từ 1 đến 4 từ ở giữa (tân ngữ/đại từ: "her stuff", "it", "the box", "me", etc.)
          const separableRegex = new RegExp(`\\b(${firstPattern})\\b(\\s+(?:[\\w'’\\-]+\\s+){0,4}?)\\b(${lastPattern})\\b`, 'i');
          const sepMatch = separableRegex.exec(rawText);
          if (sepMatch) {
            const firstStart = sepMatch.index;
            const firstEnd = firstStart + sepMatch[1].length;
            const secondStart = firstStart + sepMatch[1].length + sepMatch[2].length;
            const secondEnd = secondStart + sepMatch[3].length;

            intervals.push({
              start: firstStart,
              end: firstEnd,
              itemIdx: itIdx,
              item: it
            });
            intervals.push({
              start: secondStart,
              end: secondEnd,
              itemIdx: itIdx,
              item: it
            });
            return;
          }
        }
      }
    } catch {
      // ignore and fallback
    }

    // 3. Fallback: Khớp nguyên văn case-insensitive có word boundary
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    let match = regex.exec(rawText);

    // 4. Fallback: Khớp chuỗi con không cần word boundary
    if (!match) {
      regex = new RegExp(escaped, 'gi');
      match = regex.exec(rawText);
    }

    if (match) {
      intervals.push({
        start: match.index,
        end: match.index + match[0].length,
        itemIdx: itIdx,
        item: it
      });
    }
  });

  if (intervals.length === 0) {
    return rawText;
  }

  // Sort intervals by start position
  intervals.sort((a, b) => a.start - b.start);

  // Filter overlapping intervals
  const nonOverlapping: MatchInterval[] = [];
  let lastEnd = 0;
  for (const interval of intervals) {
    if (interval.start >= lastEnd) {
      nonOverlapping.push(interval);
      lastEnd = interval.end;
    }
  }

  // Build segments
  const nodes: React.ReactNode[] = [];
  let currIdx = 0;

  nonOverlapping.forEach((interval, idx) => {
    if (interval.start > currIdx) {
      nodes.push(
        <span key={`text-${idx}`}>{rawText.slice(currIdx, interval.start)}</span>
      );
    }

    const matchedText = rawText.slice(interval.start, interval.end);
    const isActive = isReplaying || interval.itemIdx === activeItemIdx;
    const badgeNumber = interval.itemIdx + 1;

    if (isLightMode) {
      nodes.push(
        <span
          key={`match-${idx}`}
          className={`inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md transition-all duration-300 align-baseline ${
            isActive
              ? "bg-amber-100 border border-amber-400 text-amber-900 font-extrabold shadow-sm animate-pulse"
              : "bg-amber-50 border border-amber-300 text-amber-900 font-bold"
          }`}
        >
          <span
            className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-black shrink-0 select-none ${
              isActive ? "bg-amber-500 text-white" : "bg-amber-600 text-white"
            }`}
          >
            {badgeNumber}
          </span>
          <span>{matchedText}</span>
        </span>
      );
    } else {
      nodes.push(
        <span
          key={`match-${idx}`}
          className={`inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-lg transition-all duration-300 align-baseline ${
            isActive
              ? "bg-amber-400/30 border-2 border-amber-300 text-amber-200 font-extrabold shadow-[0_0_16px_rgba(251,191,36,0.85)] animate-pulse"
              : "bg-amber-950/60 border border-amber-400/50 text-amber-200 font-bold"
          }`}
        >
          <span
            className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black shrink-0 select-none shadow-xs ${
              isActive ? "bg-amber-400 text-slate-950 font-black" : "bg-amber-500 text-white font-bold"
            }`}
          >
            {badgeNumber}
          </span>
          <span className={isActive ? "text-amber-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" : "text-amber-200"}>
            {matchedText}
          </span>
        </span>
      );
    }

    currIdx = interval.end;
  });

  if (currIdx < rawText.length) {
    nodes.push(
      <span key="text-tail">{rawText.slice(currIdx)}</span>
    );
  }

  return nodes;
};

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const renderAutoStudyOverlayContent = (
  items: FlattenedExpansionItem[],
  revealedChars: number,
  isTyping: boolean,
  loopsLeft: number,
  totalLoops: number,
  phase: "idle" | "showing" | "typing" | "replaying",
  opacity: number = 85,
  isPaused: boolean = false,
  displayMode: "typewriter" | "instant" = "typewriter",
  borderWidth: number = 2,
  borderColor: string = "#ffffff",
  borderOpacity: number = 70,
  isLoopingSub: boolean = false
) => {
  // Chỉ lấy các mục từ vựng/cụm từ/slang/idiom (bỏ hoàn toàn cấu trúc theo yêu cầu)
  const vocabItems = items.filter(it => it.type === "vocabulary");
  if (vocabItems.length === 0) return null;

  const userOpacity = typeof opacity === "number" ? opacity : 85;
  const bgAlpha = Math.min(1, Math.max(0, userOpacity / 100));
  
  // Tắt hoàn toàn blur khi opacity <= 30% để nhìn xuyên thấu video 100% không bị mờ nhòe
  const blurPx = userOpacity <= 30 ? 0 : userOpacity <= 60 ? 2 : 4;

  const finalBorderWidth = typeof borderWidth === "number" ? borderWidth : 2;
  const finalBorderOpacity = typeof borderOpacity === "number" ? Math.min(1, Math.max(0, borderOpacity / 100)) : 0.7;
  const isBorderVisible = finalBorderWidth > 0 && finalBorderOpacity > 0;
  const finalBorderColor = hexToRgba(borderColor || "#ffffff", finalBorderOpacity);

  const cardBgStyle: React.CSSProperties = {
    backgroundColor: userOpacity <= 5 ? 'transparent' : `rgba(10, 28, 52, ${bgAlpha * 0.85})`,
    backdropFilter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
    WebkitBackdropFilter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
    boxShadow: userOpacity <= 30 ? '0 2px 8px rgba(0,0,0,0.25)' : `0 8px 24px rgba(0,0,0,${bgAlpha * 0.5})`,
    borderWidth: isBorderVisible ? `${finalBorderWidth}px` : '0px',
    borderStyle: isBorderVisible ? 'solid' : 'none',
    borderColor: isBorderVisible ? finalBorderColor : 'transparent',
  };

  const renderSectionItems = (
    sectionItems: FlattenedExpansionItem[],
    sectionRevealedChars: number,
    sectionIsTyping: boolean,
    itemNumberOffset: number = 0
  ) => {
    let charOffset = 0;
    return sectionItems.map((item, itIdx) => {
      const itemNumber = itemNumberOffset + itIdx + 1;
      const isVocab = item.type === "vocabulary";
      const titleText = (isVocab ? item.word : item.pattern) || "";
      const ipaText = formatAutoStudyIpa(item.ipa);
      const meaningText = item.meaning || "";

      // Title slice
      const titleStart = charOffset;
      const titleEnd = titleStart + titleText.length;
      const visibleTitle = titleText.slice(0, Math.max(0, sectionRevealedChars - titleStart));
      const isTypingTitle = sectionIsTyping && sectionRevealedChars >= titleStart && sectionRevealedChars < titleEnd;
      charOffset = titleEnd;

      // IPA slice
      const ipaStart = charOffset;
      const ipaEnd = ipaStart + ipaText.length;
      const visibleIpa = ipaText.slice(0, Math.max(0, sectionRevealedChars - ipaStart));
      const isTypingIpa = sectionIsTyping && sectionRevealedChars >= ipaStart && sectionRevealedChars < ipaEnd;
      charOffset = ipaEnd;

      const showBadges = !sectionIsTyping || sectionRevealedChars >= ipaEnd;

      // Meaning slice
      const meaningStart = charOffset;
      const meaningEnd = meaningStart + meaningText.length;
      const visibleMeaning = meaningText.slice(0, Math.max(0, sectionRevealedChars - meaningStart));
      const isTypingMeaning = sectionIsTyping && sectionRevealedChars >= meaningStart && sectionRevealedChars < meaningEnd;
      charOffset = meaningEnd;

      let sfRenderData: {
        hasHeader: boolean;
        visibleHeader: string;
        isTypingHeader: boolean;
        items: Array<{
          type: string;
          showTypeBadge: boolean;
          visibleExpr: string;
          isTypingExpr: boolean;
          visibleMean: string;
          isTypingMean: boolean;
          visibleExEn: string;
          isTypingExEn: boolean;
          visibleExVi: string;
          isTypingExVi: boolean;
        }>;
      } | null = null;

      let fallbackData: {
        visibleSyn: string;
        isTypingSyn: boolean;
        visibleExEn: string;
        isTypingExEn: boolean;
        visibleExVi: string;
        isTypingExVi: boolean;
      } | null = null;

      if (isVocab && item.semantic_field_expansion && item.semantic_field_expansion.length > 0) {
        const headerText = " Mở rộng:";
        const headerStart = charOffset;
        const headerEnd = headerStart + headerText.length;
        const visibleHeader = headerText.slice(0, Math.max(0, sectionRevealedChars - headerStart));
        const isTypingHeader = sectionIsTyping && sectionRevealedChars >= headerStart && sectionRevealedChars < headerEnd;
        charOffset = headerEnd;

        const sfItems = item.semantic_field_expansion.map(sf => {
          const typeText = sf.type ? ` [${sf.type}]` : "";
          const exprText = sf.expression ? ` ${sf.expression}` : "";
          const meanText = sf.meaning ? ` — ${sf.meaning}` : "";
          const rawExEn = sf.example_en ? sf.example_en.replace(/<[^>]*>/g, '').trim() : "";
          const rawExVi = sf.example_vi ? sf.example_vi.trim() : "";
          const exEnText = rawExEn ? ` ${rawExEn}` : "";
          const exViText = rawExVi ? ` (${rawExVi})` : "";

          // Type slice
          const tStart = charOffset;
          const tEnd = tStart + typeText.length;
          const showTypeBadge = !sectionIsTyping || sectionRevealedChars >= tEnd;
          charOffset = tEnd;

          // Expr slice
          const exprStart = charOffset;
          const exprEnd = exprStart + exprText.length;
          const visibleExpr = exprText.slice(0, Math.max(0, sectionRevealedChars - exprStart));
          const isTypingExpr = sectionIsTyping && sectionRevealedChars >= exprStart && sectionRevealedChars < exprEnd;
          charOffset = exprEnd;

          // Meaning slice
          const meanStart = charOffset;
          const meanEnd = meanStart + meanText.length;
          const visibleMean = meanText.slice(0, Math.max(0, sectionRevealedChars - meanStart));
          const isTypingMean = sectionIsTyping && sectionRevealedChars >= meanStart && sectionRevealedChars < meanEnd;
          charOffset = meanEnd;

          // Example EN slice
          const exEnStart = charOffset;
          const exEnEnd = exEnStart + exEnText.length;
          const visibleExEn = exEnText.slice(0, Math.max(0, sectionRevealedChars - exEnStart));
          const isTypingExEn = sectionIsTyping && sectionRevealedChars >= exEnStart && sectionRevealedChars < exEnEnd;
          charOffset = exEnEnd;

          // Example VI slice
          const exViStart = charOffset;
          const exViEnd = exViStart + exViText.length;
          const visibleExVi = exViText.slice(0, Math.max(0, sectionRevealedChars - exViStart));
          const isTypingExVi = sectionIsTyping && sectionRevealedChars >= exViStart && sectionRevealedChars < exViEnd;
          charOffset = exViEnd;

          return {
            type: sf.type || "related",
            showTypeBadge,
            visibleExpr,
            isTypingExpr,
            visibleMean,
            isTypingMean,
            visibleExEn,
            isTypingExEn,
            visibleExVi,
            isTypingExVi,
          };
        });

        sfRenderData = {
          hasHeader: true,
          visibleHeader,
          isTypingHeader,
          items: sfItems,
        };
      } else {
        // Fallback for legacy vocab or standard structure
        const synText = item.synonyms ? ` Đồng nghĩa: ${item.synonyms}` : (item.antonyms ? ` Trái nghĩa: ${item.antonyms}` : "");
        const primaryEx = item.examples && item.examples.length > 0 ? item.examples[0] : null;
        const rawExEn = primaryEx?.en ? primaryEx.en.replace(/<[^>]*>/g, '').trim() : "";
        const rawExVi = primaryEx?.vi ? primaryEx.vi.trim() : "";
        const exEnText = rawExEn ? ` ${rawExEn}` : "";
        const exViText = rawExVi ? ` (${rawExVi})` : "";

        // Synonyms slice
        const synStart = charOffset;
        const synEnd = synStart + synText.length;
        const visibleSyn = synText.slice(0, Math.max(0, sectionRevealedChars - synStart));
        const isTypingSyn = sectionIsTyping && sectionRevealedChars >= synStart && sectionRevealedChars < synEnd;
        charOffset = synEnd;

        // Example EN slice
        const exEnStart = charOffset;
        const exEnEnd = exEnStart + exEnText.length;
        const visibleExEn = exEnText.slice(0, Math.max(0, sectionRevealedChars - exEnStart));
        const isTypingExEn = sectionIsTyping && sectionRevealedChars >= exEnStart && sectionRevealedChars < exEnEnd;
        charOffset = exEnEnd;

        // Example VI slice
        const exViStart = charOffset;
        const exViEnd = exViStart + exViText.length;
        const visibleExVi = exViText.slice(0, Math.max(0, sectionRevealedChars - exViStart));
        const isTypingExVi = sectionIsTyping && sectionRevealedChars >= exViStart && sectionRevealedChars < exViEnd;
        charOffset = exViEnd;

        fallbackData = {
          visibleSyn,
          isTypingSyn,
          visibleExEn,
          isTypingExEn,
          visibleExVi,
          isTypingExVi,
        };
      }

      return (
        <div key={itIdx} className={`space-y-1 ${itIdx > 0 ? "pt-1.5 border-t border-white/10" : ""}`}>
          {/* Row 1: Word/Pattern (White, font-extrabold) + Item Number Badge + IPA + Badges */}
          <div className="flex flex-wrap items-baseline gap-1 sm:gap-1.5">
            <span className="inline-flex items-center justify-center w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-white text-[10px] sm:text-[11px] font-black shrink-0 shadow-sm mr-0.5">
              {itemNumber}
            </span>
            <span className="text-[15px] sm:text-base md:text-[17px] font-extrabold tracking-wide drop-shadow-md text-white">
              {visibleTitle}
              {isTypingTitle && <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse align-middle bg-white" />}
            </span>

            {visibleIpa && (
              <span className="text-xs sm:text-[13px] font-mono font-medium text-violet-300 drop-shadow-xs">
                {visibleIpa}
                {isTypingIpa && <span className="inline-block w-1 h-3.5 bg-violet-300 ml-0.5 animate-pulse align-middle" />}
              </span>
            )}

            {showBadges && (
              <div className="inline-flex items-center gap-1 ml-0.5">
                {item.part_of_speech && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-400/40 text-emerald-300 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider">
                    {item.part_of_speech}
                  </span>
                )}
                {item.register && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-400/40 text-purple-300 font-bold text-[9px] sm:text-[10px] tracking-wider">
                    {item.register}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Row 2: Vietnamese Meaning (White) */}
          {(visibleMeaning || isTypingMeaning) && (
            <div className="text-[13px] sm:text-sm font-semibold text-white leading-snug drop-shadow-sm flex items-start gap-1">
              <span className="text-emerald-400 shrink-0 select-none text-xs">👉</span>
              <span>
                {visibleMeaning}
                {isTypingMeaning && <span className="inline-block w-1.5 h-3.5 bg-white ml-0.5 animate-pulse align-middle" />}
              </span>
            </div>
          )}

          {/* Row 3 (Mở rộng): Semantic Field Expansion for Vocab */}
          {sfRenderData && (sfRenderData.visibleHeader || sfRenderData.isTypingHeader || sfRenderData.items.some(it => it.visibleExpr)) && (
            <div className="pt-1 border-t border-white/10 space-y-0.5">
              <div className="text-[11px] sm:text-xs font-bold text-amber-300 flex items-center gap-1">
                <span>🌐</span>
                <span>{sfRenderData.visibleHeader.trim() || "Mở rộng:"}</span>
                {sfRenderData.isTypingHeader && <span className="inline-block w-1.5 h-3 bg-amber-300 ml-0.5 animate-pulse align-middle" />}
              </div>
              <div className="space-y-0.5 pl-1 sm:pl-1.5">
                {sfRenderData.items.map((sfItem, sfIdx) => {
                  if (!sfItem.visibleExpr && !sfItem.isTypingExpr && !sfItem.visibleMean && sectionIsTyping) return null;
                  const typeLower = (sfItem.type || "").toLowerCase();
                  const badgeClass = typeLower.includes("slang")
                    ? "bg-orange-950/80 border-orange-400/50 text-orange-300"
                    : typeLower.includes("idiom")
                    ? "bg-purple-950/80 border-purple-400/50 text-purple-300"
                    : typeLower.includes("synonym")
                    ? "bg-emerald-950/80 border-emerald-400/50 text-emerald-300"
                    : "bg-sky-950/80 border-sky-400/50 text-sky-300";

                  return (
                    <div key={sfIdx} className="space-y-0.5">
                      <div className="flex flex-wrap items-baseline gap-1">
                        {sfItem.showTypeBadge && sfItem.type && (
                          <span className={`px-1.5 py-0.5 rounded border font-bold text-[9px] sm:text-[10px] uppercase tracking-wider shrink-0 ${badgeClass}`}>
                            {sfItem.type}
                          </span>
                        )}
                        <span className="font-bold text-amber-200 text-[13px] sm:text-sm">
                          {sfItem.visibleExpr}
                          {sfItem.isTypingExpr && <span className="inline-block w-1 h-3.5 bg-amber-300 ml-0.5 animate-pulse align-middle" />}
                        </span>
                        {(sfItem.visibleMean || sfItem.isTypingMean) && (
                          <span className="text-slate-200 text-xs sm:text-[13px] font-medium">
                            {sfItem.visibleMean}
                            {sfItem.isTypingMean && <span className="inline-block w-1 h-3 bg-slate-300 ml-0.5 animate-pulse align-middle" />}
                          </span>
                        )}
                      </div>
                      {/* Example in semantic field if present */}
                      {(sfItem.visibleExEn || sfItem.isTypingExEn || sfItem.visibleExVi || sfItem.isTypingExVi) && (
                        <div className="text-[11px] sm:text-xs leading-tight pl-2.5 pt-0.5 space-y-0.5">
                          {(sfItem.visibleExEn || sfItem.isTypingExEn) && (
                            <div className="flex items-start gap-1 font-mono text-cyan-200">
                              <span className="text-cyan-400 shrink-0 select-none text-[11px]">💬</span>
                              <span className="italic">
                                {sfItem.visibleExEn}
                                {sfItem.isTypingExEn && <span className="inline-block w-1 h-3 bg-cyan-300 ml-0.5 animate-pulse align-middle" />}
                              </span>
                            </div>
                          )}
                          {(sfItem.visibleExVi || sfItem.isTypingExVi) && (
                            <div className="text-slate-300/90 pl-4 text-[10px] sm:text-[11px]">
                              <span>
                                {sfItem.visibleExVi}
                                {sfItem.isTypingExVi && <span className="inline-block w-1 h-2.5 bg-slate-300 ml-0.5 animate-pulse align-middle" />}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fallback or Structure: Synonyms / Antonyms & Example Sentence */}
          {fallbackData && (
            <>
              {(fallbackData.visibleSyn || fallbackData.isTypingSyn) && (
                <div className="text-[11.5px] sm:text-[12.5px] font-medium text-amber-200/90 leading-snug pl-3">
                  <span className="inline-flex items-center gap-1">
                    <span>🔗</span>
                    <span>{fallbackData.visibleSyn}</span>
                    {fallbackData.isTypingSyn && <span className="inline-block w-1 h-3 bg-amber-300 ml-0.5 animate-pulse align-middle" />}
                  </span>
                </div>
              )}

              {(fallbackData.visibleExEn || fallbackData.isTypingExEn || fallbackData.visibleExVi || fallbackData.isTypingExVi) && (
                <div className="text-[11px] sm:text-xs leading-tight pl-2.5 pt-0.5 border-t border-white/5 space-y-0.5">
                  {(fallbackData.visibleExEn || fallbackData.isTypingExEn) && (
                    <div className="flex items-start gap-1 font-mono text-cyan-200">
                      <span className="text-cyan-400 shrink-0 select-none text-[11px]">💬</span>
                      <span className="italic">
                        {fallbackData.visibleExEn}
                        {fallbackData.isTypingExEn && <span className="inline-block w-1 h-3 bg-cyan-300 ml-0.5 animate-pulse align-middle" />}
                      </span>
                    </div>
                  )}
                  {(fallbackData.visibleExVi || fallbackData.isTypingExVi) && (
                    <div className="text-slate-300/90 pl-4 text-[10px] sm:text-[11px]">
                      <span>
                        {fallbackData.visibleExVi}
                        {fallbackData.isTypingExVi && <span className="inline-block w-1 h-2.5 bg-slate-300 ml-0.5 animate-pulse align-middle" />}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      );
    });
  };

  const renderHeaderBar = (title: string, icon: string, sectionIsTyping: boolean) => (
    <div className="flex items-center justify-between border-b border-white/15 pb-0.5 mb-1">
      <div className="flex items-center gap-1">
        <span className="text-xs sm:text-[13px]">{icon}</span>
        <span className="text-[10px] sm:text-[11px] md:text-xs font-extrabold uppercase tracking-wider text-emerald-300">
          {title}
        </span>
      </div>
      {isLoopingSub ? (
        <span className="text-[9.5px] sm:text-[10.5px] font-bold text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 animate-pulse shadow-sm">
          <span>🔁</span> Lặp vô hạn (Phím L)
        </span>
      ) : phase === "replaying" ? (
        <span className="text-[9.5px] sm:text-[10.5px] font-bold text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 animate-pulse shadow-sm">
          <span>🔁</span> Phát lại: {totalLoops - loopsLeft + 1}/{totalLoops}
        </span>
      ) : isPaused ? (
        <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 bg-amber-900/60 px-1.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 shadow-sm">
          <span>⏸️</span> Tạm dừng
        </span>
      ) : (
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1 shadow-sm">
          <span>⚡</span> TOEIC MR. THIỆT
        </span>
      )}
    </div>
  );

  // Layout 1: Chỉ có 1 từ/cụm từ -> Hiển thị 1 khung gọn gàng nằm ở bên TRÁI
  if (vocabItems.length === 1) {
    return (
      <div className={`w-full max-h-full flex justify-start pointer-events-auto transition-all duration-500 px-1 sm:px-2 ${
        displayMode === "instant" 
          ? "animate-auto-study-slide" 
          : "animate-fade-in"
      }`}>
        <div 
          className="w-full md:w-[44%] lg:w-[41%] rounded-xl p-2 sm:p-2.5 transition-all flex flex-col justify-start max-h-full relative shadow-lg"
          style={cardBgStyle}
        >
          {renderHeaderBar("TỪ VỰNG ①", "💎", isTyping)}
          <div className="space-y-1.5">
            {renderSectionItems(vocabItems, revealedChars, isTyping, 0)}
          </div>
        </div>
      </div>
    );
  }

  // Layout 2: Có từ 2 từ/cụm từ trở lên -> Chia đều ra 2 cột (Cột 1 gõ trước, Cột 2 gõ sau)
  const splitIdx = Math.ceil(vocabItems.length / 2);
  const col1Items = vocabItems.slice(0, splitIdx);
  const col2Items = vocabItems.slice(splitIdx);

  const col1Length = col1Items.map(getAutoStudyItemText).join("").length;
  const col1Revealed = Math.min(revealedChars, col1Length);
  const col2Revealed = Math.max(0, revealedChars - col1Length);

  const isCol1Typing = isTyping && revealedChars < col1Length;
  const isCol2Typing = isTyping && revealedChars >= col1Length;
  const isCol2Started = phase === "replaying" || col2Revealed > 0;

  // Khi Cột 2 chưa bắt đầu gõ (chỉ áp dụng ở typewriter mode khi chưa tới lượt cột 2)
  if (displayMode !== "instant" && !isCol2Started) {
    return (
      <div className="w-full max-h-full flex justify-start pointer-events-auto transition-all duration-300 animate-fade-in px-1 sm:px-2">
        <div 
          className="w-full md:w-[44%] lg:w-[41%] rounded-xl p-2 sm:p-2.5 transition-all flex flex-col justify-start max-h-full relative shadow-lg"
          style={cardBgStyle}
        >
          {renderHeaderBar("TỪ VỰNG ①", "💎", isCol1Typing)}
          <div className="space-y-1.5">
            {renderSectionItems(col1Items, col1Revealed, isCol1Typing, 0)}
          </div>
        </div>
      </div>
    );
  }

  // Khi Cột 2 bắt đầu gõ (hoặc khi phát lại / hoặc ở chế độ instant) -> Mở rộng thành 2 cột thu gọn nằm ở 2 bên mép, để hở khoảng trống ở giữa
  return (
    <div className={`w-full max-h-full flex flex-col md:flex-row justify-between items-start gap-3 md:gap-6 lg:gap-10 pointer-events-auto transition-all duration-500 px-1 sm:px-2 ${
      displayMode === "instant" ? "animate-auto-study-slide" : ""
    }`}>
      {/* Cột Trái: Từ Vựng Phần 1 (Thu nhỏ, nằm ép sang trái) */}
      <div 
        className="w-full md:w-[44%] lg:w-[41%] rounded-xl p-2 sm:p-2.5 transition-all flex flex-col justify-start max-h-full relative shadow-lg"
        style={cardBgStyle}
      >
        {renderHeaderBar("TỪ VỰNG ①", "💎", isCol1Typing)}
        <div className="space-y-1.5">
          {renderSectionItems(col1Items, col1Revealed, isCol1Typing, 0)}
        </div>
      </div>

      {/* Cột Phải: Từ Vựng Phần 2 (Thu nhỏ, nằm ép sang phải) */}
      <div 
        className="w-full md:w-[44%] lg:w-[41%] rounded-xl p-2 sm:p-2.5 transition-all flex flex-col justify-start max-h-full relative shadow-lg"
        style={cardBgStyle}
      >
        {renderHeaderBar("TỪ VỰNG ②", "💎", isCol2Typing)}
        <div className="space-y-1.5">
          {renderSectionItems(col2Items, col2Revealed, isCol2Typing, col1Items.length)}
        </div>
      </div>
    </div>
  );
};

export default function YoutubeDictationPlayer({ lessonId, videoUrl, content, courseId }: YoutubeDictationPlayerProps) {
  const { data: session } = useSession();
  const { isAdminMode, canEdit } = useAdminEdit();
  const isTeacherOrAdmin = Boolean(session?.user && ((session.user as any).role === "ADMIN" || (session.user as any).role === "TEACHER"));
  const hasExpansionAccess = Boolean(isAdminMode || canEdit || isTeacherOrAdmin);

  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [mode, setMode] = useState<"listen" | "dictation">("listen");
  const [showIpa, setShowIpa] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [showSubOnVideo, setShowSubOnVideo] = useState<boolean>(true);
  const [hideVietsub, setHideVietsub] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const [leftWidth, setLeftWidth] = useState<number>(60); // 60% left (video), 40% right (subtitles)
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoopingCurrentSub, setIsLoopingCurrentSub] = useState<boolean>(false);
  
  // Mobile / Tablet Optimization States
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showMobileOptions, setShowMobileOptions] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Gesture support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    // Detect horizontal swipe (min 50px diff, and mostly horizontal)
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swipe Left -> Next
        if (currentIndex < subtitles.length - 1) {
          playSubtitleRow(currentIndex + 1);
        }
      } else {
        // Swipe Right -> Prev
        if (currentIndex > 0) {
          playSubtitleRow(currentIndex - 1);
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleDoubleTap = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) return;

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      playSubtitleRow(currentIndex);
      e.preventDefault();
    }
    lastTapRef.current = now;
  };

  const videoContainerRef = useRef<HTMLDivElement>(null);

  // State for dictation input
  const [dictationInput, setDictationInput] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // States for live editing
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<{ text: string; ipa: string; vietnamese: string; slang_and_idiom: string; start: string; end: string }>({ text: "", ipa: "", vietnamese: "", slang_and_idiom: "", start: "", end: "" });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const [playerReady, setPlayerReady] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dictationTextareaRef = useRef<HTMLTextAreaElement>(null);
  const activeSubRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const hasRestoredRef = useRef<boolean>(false);

  // Refs for keydown hotkeys
  const editingIndexRef = useRef<number | null>(null);
  editingIndexRef.current = editingIndex;
  const isSavingEditRef = useRef<boolean>(false);
  isSavingEditRef.current = isSavingEdit;
  const saveLiveEditRef = useRef<((idx: number) => Promise<void>) | null>(null);

  // States & Refs for Movie Expansion Popup
  const [selectedExpansionIndex, setSelectedExpansionIndex] = useState<number>(0);
  const [isExpansionEditMode, setIsExpansionEditMode] = useState<boolean>(false);
  const [expansionAddType, setExpansionAddType] = useState<'vocabulary' | 'structure' | null>(null);
  const [isSavingExpansion, setIsSavingExpansion] = useState<boolean>(false);

  const [isExpansionJsonMode, setIsExpansionJsonMode] = useState<boolean>(false);

  // Auto-Study Vocab Mode States
  const [isAutoStudyMode, setIsAutoStudyMode] = useState<boolean>(false);
  const [autoStudyDisplayMode, setAutoStudyDisplayMode] = useState<"typewriter" | "instant">("typewriter");
  const [autoStudySound, setAutoStudySound] = useState<boolean>(true);
  const [autoStudyLoops, setAutoStudyLoops] = useState<number>(2);
  const [autoStudySpeed, setAutoStudySpeed] = useState<number>(40);
  const [autoStudyOpacity, setAutoStudyOpacity] = useState<number>(85);
  const [autoStudyBorderWidth, setAutoStudyBorderWidth] = useState<number>(2);
  const [autoStudyBorderColor, setAutoStudyBorderColor] = useState<string>("#ffffff");
  const [autoStudyBorderOpacity, setAutoStudyBorderOpacity] = useState<number>(70);

  useEffect(() => {
    try {
      const mode = localStorage.getItem("webtoeic_auto_study_mode");
      if (mode !== null) setIsAutoStudyMode(mode === "true");

      const dispMode = localStorage.getItem("webtoeic_auto_study_display_mode");
      if (dispMode === "typewriter" || dispMode === "instant") setAutoStudyDisplayMode(dispMode);

      const sound = localStorage.getItem("webtoeic_auto_study_sound");
      if (sound !== null) setAutoStudySound(sound !== "false");

      const loops = localStorage.getItem("webtoeic_auto_study_loops");
      if (loops !== null) {
        const val = parseInt(loops, 10);
        if (!isNaN(val) && val >= 0 && val <= 10) setAutoStudyLoops(val);
      }

      const speed = localStorage.getItem("webtoeic_auto_study_speed");
      if (speed !== null) {
        const val = parseInt(speed, 10);
        if (!isNaN(val) && val >= 10) setAutoStudySpeed(val);
      }

      const opacity = localStorage.getItem("webtoeic_auto_study_opacity");
      if (opacity !== null) {
        const val = parseInt(opacity, 10);
        if (!isNaN(val) && val >= 20 && val <= 100) setAutoStudyOpacity(val);
      }

      const bWidth = localStorage.getItem("webtoeic_auto_study_border_width");
      if (bWidth !== null) {
        const val = parseInt(bWidth, 10);
        if (!isNaN(val) && val >= 0 && val <= 5) setAutoStudyBorderWidth(val);
      }

      const bColor = localStorage.getItem("webtoeic_auto_study_border_color");
      if (bColor) setAutoStudyBorderColor(bColor);

      const bOpacity = localStorage.getItem("webtoeic_auto_study_border_opacity");
      if (bOpacity !== null) {
        const val = parseInt(bOpacity, 10);
        if (!isNaN(val) && val >= 0 && val <= 100) setAutoStudyBorderOpacity(val);
      }
    } catch (e) {}
  }, []);
  const [showAutoStudySettings, setShowAutoStudySettings] = useState<boolean>(false);
  const [autoStudyPhase, setAutoStudyPhase] = useState<"idle" | "showing" | "typing" | "replaying">("idle");
  const [autoStudyItems, setAutoStudyItems] = useState<FlattenedExpansionItem[]>([]);
  const [autoStudyTypedChars, setAutoStudyTypedChars] = useState<number>(0);
  const [autoStudyLoopRemaining, setAutoStudyLoopRemaining] = useState<number>(2);

  const currentActiveAutoStudyItemIdx = (() => {
    if (autoStudyPhase === "replaying" || autoStudyPhase === "showing" || autoStudyDisplayMode === "instant") return -1;
    if (autoStudyItems.length <= 1) return 0;
    let count = 0;
    for (let i = 0; i < autoStudyItems.length; i++) {
      const len = getAutoStudyItemText(autoStudyItems[i]).length;
      if (autoStudyTypedChars < count + len) {
        return i;
      }
      count += len;
    }
    return autoStudyItems.length - 1;
  })();

  const [isAutoStudyPaused, setIsAutoStudyPaused] = useState<boolean>(false);
  const isAutoStudyPausedRef = useRef<boolean>(false);
  isAutoStudyPausedRef.current = isAutoStudyPaused;

  const isProgrammaticPauseRef = useRef<boolean>(false);
  const autoStudyFullStreamTextRef = useRef<string>("");
  const autoStudyCharCountRef = useRef<number>(0);
  const autoStudyTargetIdxRef = useRef<number>(-1);

  const hasTriggeredAutoStudyRef = useRef<number>(-1);
  const autoStudyTimerRef = useRef<any>(null);
  const autoStudyTimeoutRef = useRef<any>(null);
  const autoStudyLoopRemainingRef = useRef<number>(2);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const isAutoStudyModeRef = useRef<boolean>(isAutoStudyMode);
  isAutoStudyModeRef.current = isAutoStudyMode;
  const autoStudyDisplayModeRef = useRef<"typewriter" | "instant">(autoStudyDisplayMode);
  autoStudyDisplayModeRef.current = autoStudyDisplayMode;
  const autoStudyPhaseRef = useRef<"idle" | "showing" | "typing" | "replaying">(autoStudyPhase);
  autoStudyPhaseRef.current = autoStudyPhase;
  const autoStudySoundRef = useRef<boolean>(autoStudySound);
  autoStudySoundRef.current = autoStudySound;
  const autoStudyLoopsRef = useRef<number>(autoStudyLoops);
  autoStudyLoopsRef.current = autoStudyLoops;
  const autoStudySpeedRef = useRef<number>(autoStudySpeed);
  autoStudySpeedRef.current = autoStudySpeed;
  const isLoopingCurrentSubRef = useRef<boolean>(isLoopingCurrentSub);
  isLoopingCurrentSubRef.current = isLoopingCurrentSub;

  const clearAutoStudyTimers = () => {
    if (autoStudyTimerRef.current) {
      clearInterval(autoStudyTimerRef.current);
      cancelAnimationFrame(autoStudyTimerRef.current);
      autoStudyTimerRef.current = null;
    }
    if (autoStudyTimeoutRef.current) {
      clearTimeout(autoStudyTimeoutRef.current);
      autoStudyTimeoutRef.current = null;
    }
  };

  const stopAutoStudy = () => {
    clearAutoStudyTimers();
    setIsAutoStudyPaused(false);
    isAutoStudyPausedRef.current = false;
    setAutoStudyPhase("idle");
    autoStudyPhaseRef.current = "idle";
    setAutoStudyItems([]);
    setAutoStudyTypedChars(0);
    autoStudyCharCountRef.current = 0;
  };

  const pauseAutoStudyTyping = () => {
    clearAutoStudyTimers();
    setIsAutoStudyPaused(true);
    isAutoStudyPausedRef.current = true;
  };

  const startAutoStudyReplay = (targetIdx: number, totalLoops: number) => {
    const currentSub = subtitlesRef.current.length > 0 ? subtitlesRef.current[targetIdx] : subtitles[targetIdx];
    if (!currentSub) {
      stopAutoStudy();
      return;
    }

    autoStudyLoopRemainingRef.current = totalLoops;
    setAutoStudyLoopRemaining(totalLoops);
    setAutoStudyPhase("replaying");
    autoStudyPhaseRef.current = "replaying";

    lastSeekTimeRef.current = Date.now();
    if (isDirectVideo) {
      if (videoRef.current) {
        videoRef.current.currentTime = currentSub.start;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(currentSub.start, true);
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const startAutoStudyInstant = (targetIdx: number, items: FlattenedExpansionItem[]) => {
    clearAutoStudyTimers();

    autoStudyTargetIdxRef.current = targetIdx;
    setIsAutoStudyPaused(false);
    isAutoStudyPausedRef.current = false;

    const vocabItems = items.filter(it => it.type === "vocabulary");
    if (vocabItems.length === 0) return;

    const fullStreamText = vocabItems.map(getAutoStudyItemText).join("");
    autoStudyFullStreamTextRef.current = fullStreamText;

    setAutoStudyPhase("showing");
    autoStudyPhaseRef.current = "showing";
    setAutoStudyItems(vocabItems);
    setAutoStudyTypedChars(fullStreamText.length);
    autoStudyCharCountRef.current = fullStreamText.length;
  };

  const runAutoStudyTypingLoop = (startChar: number, totalLen: number, targetIdx: number) => {
    clearAutoStudyTimers();

    let charCount = startChar;
    const speed = autoStudySpeedRef.current || 40;
    const fullStreamText = autoStudyFullStreamTextRef.current;
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const tick = (currentTime: number) => {
      if (isAutoStudyPausedRef.current) {
        lastTime = currentTime;
        autoStudyTimerRef.current = requestAnimationFrame(tick);
        return;
      }

      const delta = currentTime - lastTime;
      lastTime = currentTime;
      accumulatedTime += delta;

      const charsToAdvance = Math.floor(accumulatedTime / speed);
      if (charsToAdvance > 0) {
        accumulatedTime -= charsToAdvance * speed;
        // Giới hạn bước nhảy tối đa 3 ký tự/frame để hiệu ứng luôn mượt dù hệ thống tải nặng
        const step = Math.min(charsToAdvance, 3);
        const nextCount = Math.min(totalLen, charCount + step);

        if (nextCount > charCount) {
          if (autoStudySoundRef.current) {
            playTypewriterClickSound(audioCtxRef);
          }
          charCount = nextCount;
          autoStudyCharCountRef.current = charCount;
          setAutoStudyTypedChars(charCount);
        }

        if (charCount >= totalLen) {
          clearAutoStudyTimers();

          // Wait 1.2s for reading then start replay loops
          autoStudyTimeoutRef.current = setTimeout(() => {
            if (isAutoStudyPausedRef.current) {
              return;
            }
            const isInfiniteLoop = isLoopingCurrentSubRef.current;
            const totalLoops = isInfiniteLoop ? 999999 : autoStudyLoopsRef.current;
            if (isInfiniteLoop || totalLoops > 0) {
              startAutoStudyReplay(targetIdx, totalLoops);
            } else {
              stopAutoStudy();
              if (isDirectVideo) {
                if (videoRef.current) videoRef.current.play().catch(() => {});
              } else {
                if (playerRef.current && typeof playerRef.current.playVideo === "function") playerRef.current.playVideo();
              }
            }
          }, 1200);
          return;
        }
      }

      autoStudyTimerRef.current = requestAnimationFrame(tick);
    };

    autoStudyTimerRef.current = requestAnimationFrame(tick);
  };

  const resumeAutoStudyTyping = () => {
    setIsAutoStudyPaused(false);
    isAutoStudyPausedRef.current = false;
    const targetIdx = autoStudyTargetIdxRef.current;

    const fullText = autoStudyFullStreamTextRef.current;
    const currentChars = autoStudyCharCountRef.current;
    if (currentChars < fullText.length) {
      runAutoStudyTypingLoop(currentChars, fullText.length, targetIdx);
    } else {
      const isInfiniteLoop = isLoopingCurrentSubRef.current;
      const totalLoops = isInfiniteLoop ? 999999 : autoStudyLoopsRef.current;
      if (isInfiniteLoop || totalLoops > 0) {
        startAutoStudyReplay(targetIdx, totalLoops);
      } else {
        stopAutoStudy();
      }
    }
  };

  const startAutoStudyTypewriter = (targetIdx: number, items: FlattenedExpansionItem[]) => {
    clearAutoStudyTimers();

    autoStudyTargetIdxRef.current = targetIdx;
    setIsAutoStudyPaused(false);
    isAutoStudyPausedRef.current = false;

    // Pause video programmatically
    isProgrammaticPauseRef.current = true;
    if (isDirectVideo) {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      }
    }
    setTimeout(() => {
      isProgrammaticPauseRef.current = false;
    }, 300);

    const vocabItems = items.filter(it => it.type === "vocabulary");
    if (vocabItems.length === 0) {
      return;
    }

    const fullStreamText = vocabItems.map(getAutoStudyItemText).join("");
    autoStudyFullStreamTextRef.current = fullStreamText;
    const totalLen = fullStreamText.length;

    setAutoStudyPhase("typing");
    autoStudyPhaseRef.current = "typing";
    setAutoStudyItems(vocabItems);
    setAutoStudyTypedChars(0);
    autoStudyCharCountRef.current = 0;

    runAutoStudyTypingLoop(0, totalLen, targetIdx);
  };

  // Close Auto-Study dropdown on click outside
  useEffect(() => {
    if (!showAutoStudySettings) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".auto-study-dropdown-container")) {
        setShowAutoStudySettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAutoStudySettings]);

  // Clean up auto study timers on unmount
  useEffect(() => {
    return () => {
      clearAutoStudyTimers();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const subtitlesRef = useRef<Subtitle[]>(subtitles);
  subtitlesRef.current = subtitles;
  const currentIndexRef = useRef<number>(currentIndex);
  currentIndexRef.current = currentIndex;
  const selectedExpansionIndexRef = useRef<number>(selectedExpansionIndex);
  selectedExpansionIndexRef.current = selectedExpansionIndex;
  const playSubtitleRowRef = useRef<(index: number) => void>(() => {});
  const togglePlayRef = useRef<() => void>(() => {});

  const popupRef = useRef<Window | null>(null);
  const pipWindowRef = useRef<any>(null);
  const lastExpansionHotkeyTime = useRef<number>(0);

  const updateExpansionPopup = async (
    subIdx: number,
    targetItemIdx: number = 0,
    isEdit: boolean = false,
    addType: 'vocabulary' | 'structure' | null = null,
    isJsonMode: boolean = false
  ) => {
    if (!hasExpansionAccess) return;
    const currentSubs = subtitlesRef.current.length > 0 ? subtitlesRef.current : subtitles;
    const sub = currentSubs[subIdx];
    if (!sub) return;

    const items = getFlattenedExpansionItems(sub);
    let activeIdx = targetItemIdx;
    if (items.length > 0) {
      if (activeIdx < 0) activeIdx = items.length - 1;
      if (activeIdx >= items.length) activeIdx = 0;
    } else {
      activeIdx = 0;
    }
    setSelectedExpansionIndex(activeIdx);
    selectedExpansionIndexRef.current = activeIdx;
    setIsExpansionEditMode(isEdit);
    setIsExpansionJsonMode(isJsonMode);
    setExpansionAddType(addType);

    const popupParams = {
      subIndex: subIdx,
      totalSubtitles: currentSubs.length,
      sub,
      activeItemIndex: activeIdx,
      isEditMode: isEdit,
      isJsonMode: isJsonMode,
      isSaving: isSavingExpansion,
      addType
    };

    const callbacks: ExpansionPopupCallbacks = {
      onSetEditMode: (editMode, type, jsonMode) => {
        updateExpansionPopup(subIdx, activeIdx, editMode, type || null, jsonMode || false);
      },
      onDeleteItem: async (targetSubIdx, activeItemIdx) => {
        const latestSubs = subtitlesRef.current.length > 0 ? subtitlesRef.current : subtitles;
        const targetSub = latestSubs[targetSubIdx];
        if (!targetSub || !targetSub.expansion) return;

        const currentItems = getFlattenedExpansionItems(targetSub);
        const itemToDelete = currentItems[activeItemIdx];
        if (!itemToDelete) return;

        const updatedExpansion: SubtitleExpansion = {
          paraphrase: targetSub.expansion.paraphrase,
          paraphrases: targetSub.expansion.paraphrases,
          vocabulary: [...(targetSub.expansion.vocabulary || [])],
          structures: [...(targetSub.expansion.structures || [])]
        };

        if (itemToDelete.type === 'vocabulary') {
          updatedExpansion.vocabulary?.splice(itemToDelete.rawIndex, 1);
        } else {
          updatedExpansion.structures?.splice(itemToDelete.rawIndex, 1);
        }

        const updatedSubtitles = latestSubs.map((s, idx) => {
          if (idx === targetSubIdx) {
            return {
              ...s,
              expansion: updatedExpansion
            };
          }
          return { ...s };
        });

        setSubtitles(updatedSubtitles);
        subtitlesRef.current = updatedSubtitles;

        try {
          const res = await fetch(`/api/lessons/${lessonId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: JSON.stringify(updatedSubtitles) })
          });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          showToast("Đã xóa mục thành công!", "success");
          const remainingItems = getFlattenedExpansionItems(updatedSubtitles[targetSubIdx]);
          const nextActiveIdx = Math.max(0, Math.min(activeItemIdx, remainingItems.length - 1));
          updateExpansionPopup(targetSubIdx, nextActiveIdx, false, null, false);
        } catch (err) {
          showToast("Lỗi khi xóa mục!", "error");
        }
      },
      onSaveItem: async (targetSubIdx, payload) => {
        if (!payload || !payload.data) return;
        setIsSavingExpansion(true);
        const latestSubs = subtitlesRef.current.length > 0 ? subtitlesRef.current : subtitles;
        const targetSub = latestSubs[targetSubIdx];
        if (!targetSub) {
          setIsSavingExpansion(false);
          return;
        }

        const updatedExpansion: SubtitleExpansion = {
          paraphrase: payload.paraphrase !== undefined ? payload.paraphrase : targetSub.expansion?.paraphrase,
          paraphrases: payload.paraphrases !== undefined ? payload.paraphrases : targetSub.expansion?.paraphrases,
          vocabulary: [...(targetSub.expansion?.vocabulary || [])],
          structures: [...(targetSub.expansion?.structures || [])]
        };

        if (payload.type === 'vocabulary') {
          const existingVocab = (payload.rawIndex >= 0 && updatedExpansion.vocabulary) ? updatedExpansion.vocabulary[payload.rawIndex] : null;
          const vocabData: ExpansionVocabItem = {
            word: payload.data.word || '',
            ipa: payload.data.ipa || '',
            part_of_speech: payload.data.part_of_speech || existingVocab?.part_of_speech || '',
            register: payload.data.register || existingVocab?.register || '',
            synonyms: payload.data.synonyms || '',
            antonyms: payload.data.antonyms || existingVocab?.antonyms || '',
            meaning: payload.data.meaning || '',
            examples: payload.data.examples || [],
            semantic_field_expansion: payload.data.semantic_field_expansion
          };
          if (payload.rawIndex >= 0 && updatedExpansion.vocabulary && updatedExpansion.vocabulary[payload.rawIndex]) {
            updatedExpansion.vocabulary[payload.rawIndex] = vocabData;
          } else {
            if (!updatedExpansion.vocabulary) updatedExpansion.vocabulary = [];
            updatedExpansion.vocabulary.push(vocabData);
          }
        } else {
          const structData: ExpansionStructureItem = {
            pattern: payload.data.pattern || '',
            meaning: payload.data.meaning || '',
            examples: payload.data.examples || []
          };
          if (payload.rawIndex >= 0 && updatedExpansion.structures && updatedExpansion.structures[payload.rawIndex]) {
            updatedExpansion.structures[payload.rawIndex] = structData;
          } else {
            if (!updatedExpansion.structures) updatedExpansion.structures = [];
            updatedExpansion.structures.push(structData);
          }
        }

        const updatedSubtitles = latestSubs.map((s, idx) => {
          if (idx === targetSubIdx) {
            return {
              ...s,
              expansion: updatedExpansion
            };
          }
          return { ...s };
        });

        setSubtitles(updatedSubtitles);
        subtitlesRef.current = updatedSubtitles;

        try {
          const res = await fetch(`/api/lessons/${lessonId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: JSON.stringify(updatedSubtitles) })
          });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          showToast("Đã lưu kiến thức mở rộng thành công!", "success");
          const allItems = getFlattenedExpansionItems(updatedSubtitles[targetSubIdx]);
          const targetIdx = payload.rawIndex >= 0 ? activeIdx : Math.max(0, allItems.length - 1);
          updateExpansionPopup(targetSubIdx, targetIdx, false, null, false);
        } catch (err) {
          showToast("Lỗi khi lưu kiến thức mở rộng!", "error");
        } finally {
          setIsSavingExpansion(false);
        }
      },
      onSaveFullExpansionJson: async (targetSubIdx, expansionData) => {
        setIsSavingExpansion(true);
        const latestSubs = subtitlesRef.current.length > 0 ? subtitlesRef.current : subtitles;
        const targetSub = latestSubs[targetSubIdx];
        if (!targetSub) {
          setIsSavingExpansion(false);
          return;
        }

        // Deep clone to ensure 100% integrity of all other items & other properties
        const updatedSubtitles = latestSubs.map((s, idx) => {
          if (idx === targetSubIdx) {
            return {
              ...s,
              expansion: expansionData
            };
          }
          return { ...s };
        });

        setSubtitles(updatedSubtitles);
        subtitlesRef.current = updatedSubtitles;

        try {
          const res = await fetch(`/api/lessons/${lessonId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: JSON.stringify(updatedSubtitles) })
          });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          showToast("Đã lưu JSON từ Gemini thành công!", "success");
          updateExpansionPopup(targetSubIdx, 0, false, null, false);
        } catch (err) {
          console.error("Lỗi khi lưu JSON:", err);
          showToast("Lỗi khi lưu dữ liệu mở rộng!", "error");
        } finally {
          setIsSavingExpansion(false);
        }
      },
      onCycle: (key: string) => {
        const now = Date.now();
        if (now - lastExpansionHotkeyTime.current < 40) return;
        lastExpansionHotkeyTime.current = now;

        const latestSubs = subtitlesRef.current.length > 0 ? subtitlesRef.current : subtitles;
        const currentSub = latestSubs[currentIndexRef.current];
        if (!currentSub) return;
        const allItems = getFlattenedExpansionItems(currentSub);
        if (allItems.length > 0) {
          const isNext = key === '.' || key === ']' || key.toLowerCase() === 'ơ';
          const currentSelected = selectedExpansionIndexRef.current;
          const nextIdx = isNext 
            ? (currentSelected + 1) % allItems.length 
            : (currentSelected - 1 + allItems.length) % allItems.length;
          updateExpansionPopup(currentIndexRef.current, nextIdx, false, null, false);
        }
      },
      onSeek: (key: string) => {
        const curr = currentIndexRef.current;
        if (key === 'v') {
          playSubtitleRowRef.current(curr - 1);
        } else if (key === 'n') {
          playSubtitleRowRef.current(curr + 1);
        } else if (key === 'b') {
          playSubtitleRowRef.current(curr);
        } else if (key === 'l') {
          setIsLoopingCurrentSub(prev => !prev);
        } else if (key === '`' || key === 'Backquote') {
          togglePlayRef.current();
        }
      },
      onSelectIndex: (targetIdx: number) => {
        updateExpansionPopup(currentIndexRef.current, targetIdx, false, null, false);
      }
    };

    const width = 460;
    const height = 600;

    // 1. Dùng Document Picture-in-Picture (PiP) nếu được hỗ trợ để luôn nổi trên cùng
    const hasPiP = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
    if (hasPiP) {
      try {
        let pipWindow = pipWindowRef.current;
        const isClosed = !pipWindow || pipWindow.closed;
        if (isClosed) {
          // @ts-ignore
          pipWindow = await window.documentPictureInPicture.requestWindow({ width, height });
          pipWindowRef.current = pipWindow;

          try {
            const leftPos = window.screenLeft || window.screenX || 0;
            const topPos = (window.screenTop || window.screenY || 0) + (window.outerHeight || window.innerHeight || 800) - height;
            pipWindow.moveTo(leftPos, topPos);
          } catch (e) {}
        }

        updateMovieExpansionPopupDom(pipWindow.document, pipWindow, popupParams, callbacks);
        return;
      } catch (e) {
        console.warn("Document PiP error or fallback:", e);
      }
    }

    // 2. Fallback sang window.open tiêu chuẩn
    if (popupRef.current && !popupRef.current.closed) {
      updateMovieExpansionPopupDom(popupRef.current.document, popupRef.current, popupParams, callbacks);
      try { popupRef.current.focus(); } catch (e) {}
      return;
    }

    const left = window.screenLeft || window.screenX || 0;
    const top = (window.screenTop || window.screenY || 0) + (window.outerHeight || window.innerHeight || 800) - height;

    const popup = window.open(
      'about:blank',
      'MovieVocabExpansion',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popupRef.current = popup;
      updateMovieExpansionPopupDom(popup.document, popup, popupParams, callbacks);
      try { popup.focus(); } catch (e) {}
    } else {
      alert("Trình duyệt đã chặn cửa sổ Pop-up. Vui lòng nhấn vào biểu tượng ổ khóa/pop-up trên thanh địa chỉ trình duyệt và chọn 'Cho phép (Allow)' để mở cửa sổ từ vựng!");
    }
  };

  // Tự động đóng popup khi unmount
  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  // Tự động cập nhật nội dung popup khi chuyển câu thoại hoặc dữ liệu phụ đề thay đổi (nếu popup đang mở)
  useEffect(() => {
    const isPopupActive = (popupRef.current && !popupRef.current.closed) || (pipWindowRef.current && !pipWindowRef.current.closed);
    if (isPopupActive && hasExpansionAccess) {
      updateExpansionPopup(currentIndex, 0, false, null, false);
    }
  }, [currentIndex, hasExpansionAccess, subtitles]);

  // Lắng nghe sự kiện gửi từ cửa sổ Popup
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;

      // 1. Chuyển đổi giữa các item từ vựng / cấu trúc trong câu hiện tại bằng phím , .
      if (e.data.type === 'MOVIE_CYCLE_EXPANSION') {
        lastExpansionHotkeyTime.current = Date.now();
        const currentSub = subtitles[currentIndex];
        if (!currentSub) return;
        const items = getFlattenedExpansionItems(currentSub);
        if (items.length > 0) {
          const isNext = e.data.key === '.' || e.data.key === ']' || e.data.key?.toLowerCase() === 'ơ';
          const nextIdx = isNext 
            ? (selectedExpansionIndex + 1) % items.length 
            : (selectedExpansionIndex - 1 + items.length) % items.length;
          updateExpansionPopup(currentIndex, nextIdx, false, null, false);
        }
      }

      // 2. Chuyển câu phụ đề hoặc nghe lại (V, N, B)
      else if (e.data.type === 'MOVIE_SEEK_SUBTITLE') {
        const key = e.data.key;
        if (key === 'v') {
          playSubtitleRow(currentIndex - 1);
        } else if (key === 'n') {
          playSubtitleRow(currentIndex + 1);
        } else if (key === 'b') {
          playSubtitleRow(currentIndex);
        }
      }

      // 3. Đổi chế độ Sửa / Thêm mới / Dán JSON
      else if (e.data.type === 'MOVIE_EXPANSION_SET_EDIT_MODE') {
        updateExpansionPopup(currentIndex, selectedExpansionIndex, e.data.isEditMode, e.data.addType || null, e.data.isJsonMode || false);
      }

      // 4. Xóa một mục từ vựng / cấu trúc
      else if (e.data.type === 'MOVIE_EXPANSION_DELETE_ITEM') {
        const subIdx = e.data.subIndex;
        const activeItemIdx = e.data.activeItemIndex;
        const targetSub = subtitles[subIdx];
        if (!targetSub || !targetSub.expansion) return;

        const items = getFlattenedExpansionItems(targetSub);
        const itemToDelete = items[activeItemIdx];
        if (!itemToDelete) return;

        const updatedExpansion: SubtitleExpansion = {
          paraphrase: targetSub.expansion.paraphrase,
          paraphrases: targetSub.expansion.paraphrases,
          vocabulary: [...(targetSub.expansion.vocabulary || [])],
          structures: [...(targetSub.expansion.structures || [])]
        };

        if (itemToDelete.type === 'vocabulary') {
          updatedExpansion.vocabulary?.splice(itemToDelete.rawIndex, 1);
        } else {
          updatedExpansion.structures?.splice(itemToDelete.rawIndex, 1);
        }

        const updatedSubtitles = subtitles.map((s, idx) => {
          if (idx === subIdx) {
            return {
              ...s,
              expansion: updatedExpansion
            };
          }
          return { ...s };
        });

        setSubtitles(updatedSubtitles);
        subtitlesRef.current = updatedSubtitles;

        try {
          const res = await fetch(`/api/lessons/${lessonId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: JSON.stringify(updatedSubtitles) })
          });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          showToast("Đã xóa mục thành công!", "success");
          const remainingItems = getFlattenedExpansionItems(updatedSubtitles[subIdx]);
          const nextActiveIdx = Math.max(0, Math.min(activeItemIdx, remainingItems.length - 1));
          updateExpansionPopup(subIdx, nextActiveIdx, false, null, false);
        } catch (err) {
          showToast("Lỗi khi xóa mục!", "error");
        }
      }

      // 5. Lưu JSON đầy đủ do Gemini sinh ra
      else if (e.data.type === 'MOVIE_EXPANSION_SAVE_FULL_JSON') {
        const subIdx = e.data.subIndex;
        const payload = e.data.payload;
        if (subIdx !== undefined && payload) {
          try {
            const sanitized = sanitizeExpansionJson(payload);
            const targetSub = subtitles[subIdx];
            if (!targetSub) return;

            const updatedSubtitles = subtitles.map((s, idx) => {
              if (idx === subIdx) {
                return {
                  ...s,
                  expansion: sanitized
                };
              }
              return { ...s };
            });

            setSubtitles(updatedSubtitles);
            subtitlesRef.current = updatedSubtitles;

            const res = await fetch(`/api/lessons/${lessonId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: JSON.stringify(updatedSubtitles) })
            });

            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            showToast("Đã lưu JSON từ Gemini thành công!", "success");
            updateExpansionPopup(subIdx, 0, false, null, false);
          } catch (err: any) {
            console.error("Lỗi khi lưu JSON:", err);
            showToast("Lỗi khi lưu dữ liệu mở rộng: " + (err.message || ""), "error");
          }
        }
      }

      // 6. Lưu mục từ vựng / cấu trúc đang sửa thủ công
      else if (e.data.type === 'MOVIE_EXPANSION_SAVE_ITEM') {
        const subIdx = e.data.subIndex;
        const payload = e.data.payload;
        if (!payload || !payload.data) return;

        const targetSub = subtitles[subIdx];
        if (!targetSub) return;

        const updatedExpansion: SubtitleExpansion = {
          paraphrase: payload.paraphrase !== undefined ? payload.paraphrase : targetSub.expansion?.paraphrase,
          paraphrases: targetSub.expansion?.paraphrases,
          vocabulary: [...(targetSub.expansion?.vocabulary || [])],
          structures: [...(targetSub.expansion?.structures || [])]
        };

        if (payload.type === 'vocabulary') {
          const existingVocab = (payload.rawIndex >= 0 && updatedExpansion.vocabulary) ? updatedExpansion.vocabulary[payload.rawIndex] : null;
          const vocabData: ExpansionVocabItem = {
            word: payload.data.word || '',
            ipa: payload.data.ipa || '',
            part_of_speech: payload.data.part_of_speech || existingVocab?.part_of_speech || '',
            register: payload.data.register || existingVocab?.register || '',
            synonyms: payload.data.synonyms || '',
            antonyms: payload.data.antonyms || existingVocab?.antonyms || '',
            meaning: payload.data.meaning || '',
            examples: payload.data.examples || [],
            semantic_field_expansion: payload.data.semantic_field_expansion || existingVocab?.semantic_field_expansion
          };
          if (payload.rawIndex >= 0 && updatedExpansion.vocabulary && updatedExpansion.vocabulary[payload.rawIndex]) {
            updatedExpansion.vocabulary[payload.rawIndex] = vocabData;
          } else {
            if (!updatedExpansion.vocabulary) updatedExpansion.vocabulary = [];
            updatedExpansion.vocabulary.push(vocabData);
          }
        } else {
          const structData: ExpansionStructureItem = {
            pattern: payload.data.pattern || '',
            meaning: payload.data.meaning || '',
            examples: payload.data.examples || []
          };
          if (payload.rawIndex >= 0 && updatedExpansion.structures && updatedExpansion.structures[payload.rawIndex]) {
            updatedExpansion.structures[payload.rawIndex] = structData;
          } else {
            if (!updatedExpansion.structures) updatedExpansion.structures = [];
            updatedExpansion.structures.push(structData);
          }
        }

        const updatedSubtitles = subtitles.map((s, idx) => {
          if (idx === subIdx) {
            return {
              ...s,
              expansion: updatedExpansion
            };
          }
          return { ...s };
        });

        setSubtitles(updatedSubtitles);
        subtitlesRef.current = updatedSubtitles;

        try {
          const res = await fetch(`/api/lessons/${lessonId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: JSON.stringify(updatedSubtitles) })
          });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          showToast("Đã lưu kiến thức mở rộng thành công!", "success");
          const allItems = getFlattenedExpansionItems(updatedSubtitles[subIdx]);
          const targetIdx = payload.rawIndex >= 0 ? selectedExpansionIndex : allItems.length - 1;
          updateExpansionPopup(subIdx, targetIdx, false, null, false);
        } catch (err) {
          showToast("Lỗi khi lưu kiến thức mở rộng!", "error");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentIndex, selectedExpansionIndex, subtitles, isAdminMode, lessonId]);

  // --- Detect video type ---
  const isDirectVideo = !!(videoUrl && !videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be"));

  // Convert Google Drive view link to direct stream link
  const getDirectVideoUrl = (url: string): string => {
    if (!url) return "";
    // Google Drive: https://drive.google.com/file/d/FILE_ID/view
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (driveMatch) {
      return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    return url; // Return as-is for Supabase, Cloudflare R2, etc.
  };
  const directVideoUrl = getDirectVideoUrl(videoUrl);

  // Handle fullscreen change events (e.g. user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === videoContainerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch((err) => {
        console.error("Lỗi khi mở toàn màn hình:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // If mouse buttons is 0 (mouse released outside window), stop resizing immediately
      if (e.buttons === 0) {
        setIsResizing(false);
        return;
      }
      if (!isResizing || !outerContainerRef.current) return;
      const rect = outerContainerRef.current.getBoundingClientRect();
      const newWidthPx = e.clientX - rect.left;
      const newWidthPercent = (newWidthPx / rect.width) * 100;
      
      if (newWidthPercent >= 35 && newWidthPercent <= 80) {
        setLeftWidth(newWidthPercent);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Extract YouTube Video ID
  const getYouTubeId = (url: string) => {
    let videoId = "";
    try {
      if (url.includes("embed/")) videoId = url.split("embed/")[1]?.split("?")[0];
      else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0];
      else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } catch (e) {}
    return videoId;
  };
  const videoId = getYouTubeId(videoUrl);

  // Parse Subtitles JSON
  useEffect(() => {
    try {
      const parsed = JSON.parse(content || "[]");
      if (Array.isArray(parsed)) {
        setSubtitles(parsed);
      }
    } catch (e) {
      console.error("Failed to parse subtitles JSON:", e);
    }
  }, [content]);

  // Load YouTube Player API and Initialize Player
  useEffect(() => {
    if (!videoId) return;

    // Load API Script if not loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout;

    const setupPlayer = () => {
      if (!isMounted) return;
      const element = document.getElementById("youtube-dictation-iframe");
      if (!element) return;

      try {
        if (window.YT && window.YT.Player) {
          playerRef.current = new window.YT.Player("youtube-dictation-iframe", {
            playerVars: {
              controls: 1,
              cc_load_policy: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              enablejsapi: 1,
              origin: window.location.origin
            },
            events: {
              onReady: () => {
                if (!isMounted) return;
                setPlayerReady(true);
                try {
                  if (playerRef.current && typeof playerRef.current.unloadModule === "function") {
                    playerRef.current.unloadModule("captions");
                    playerRef.current.unloadModule("cc");
                  }
                } catch (e) {}
              },
              onStateChange: (event: any) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  if (autoStudyPhaseRef.current === "typing" && isAutoStudyPausedRef.current) {
                    resumeAutoStudyTyping();
                  }
                  try {
                    if (playerRef.current && typeof playerRef.current.unloadModule === "function") {
                      playerRef.current.unloadModule("captions");
                      playerRef.current.unloadModule("cc");
                    }
                  } catch (e) {}
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                  if (autoStudyPhaseRef.current === "typing" && !isProgrammaticPauseRef.current && !isAutoStudyPausedRef.current) {
                    pauseAutoStudyTyping();
                  }
                }
              },
            },
          });
        }
      } catch (err) {
        console.error("Error binding YT Player:", err);
      }
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const checkAndInit = () => {
      if (window.YT && window.YT.Player && typeof window.YT.Player === "function") {
        setupPlayer();
      } else {
        pollInterval = setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();

    return () => {
      isMounted = false;
      if (pollInterval) clearTimeout(pollInterval);
      window.onYouTubeIframeAPIReady = undefined;
      setPlayerReady(false);
    };
  }, [videoId]);

  // Disable native subtitles (softsubs) in direct video files to avoid overlap with React overlay
  useEffect(() => {
    if (!isDirectVideo) return;
    const disableTracks = () => {
      if (videoRef.current) {
        const tracks = videoRef.current.textTracks;
        for (let i = 0; i < tracks.length; i++) {
          tracks[i].mode = "disabled";
        }
      }
    };
    
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener("loadedmetadata", disableTracks);
      disableTracks();
    }
    return () => {
      if (videoEl) {
        videoEl.removeEventListener("loadedmetadata", disableTracks);
      }
    };
  }, [videoUrl, isDirectVideo]);

  // Restore progress: works for both YouTube and HTML5 video
  useEffect(() => {
    if (subtitles.length === 0 || hasRestoredRef.current) return;

    if (isDirectVideo) {
      // For direct video: restore when video element is mounted and can seek
      hasRestoredRef.current = true;
      const saved = localStorage.getItem(`youtube-dictation-progress-${lessonId}`);
      if (saved) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < subtitles.length) {
          setCurrentIndex(idx);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = subtitles[idx].start;
            }
          }, 400);
        }
      }
      setPlayerReady(true);
      return;
    }

    // For YouTube: wait for playerReady
    if (playerReady && playerRef.current && typeof playerRef.current.seekTo === "function") {
      hasRestoredRef.current = true;
      const saved = localStorage.getItem(`youtube-dictation-progress-${lessonId}`);
      if (saved) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < subtitles.length) {
          setCurrentIndex(idx);
          setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.seekTo === "function") {
              playerRef.current.seekTo(subtitles[idx].start, true);
              playerRef.current.pauseVideo();
            }
          }, 600);
        }
      }
    } else if (playerReady && subtitles.length > 0 && !hasRestoredRef.current) {
      hasRestoredRef.current = true;
    }
  }, [playerReady, subtitles, lessonId, isDirectVideo]);

  // Save progress to localStorage when index changes
  useEffect(() => {
    if (subtitles.length > 0 && hasRestoredRef.current) {
      localStorage.setItem(`youtube-dictation-progress-${lessonId}`, currentIndex.toString());
    }
  }, [currentIndex, subtitles, lessonId]);

  // Poll current time from YouTube Player API (YouTube mode only)
  useEffect(() => {
    if (isDirectVideo) return; // HTML5 video uses onTimeUpdate events instead
    const interval = setInterval(() => {
      // Skip automatic time tracking for 1.2 seconds after manual seek to allow YouTube player to stabilize
      if (Date.now() - lastSeekTimeRef.current < 1200) return;

      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);

          if (typeof playerRef.current.getDuration === "function") {
            const dur = playerRef.current.getDuration();
            if (dur && dur !== duration) {
              setDuration(dur);
            }
          }

          // Auto-Study Vocab check (Mode 1: Typewriter at end / Mode 2: Slide-in after 1s)
          if (isAutoStudyModeRef.current && mode === "listen" && subtitles.length > 0) {
            const currentSub = subtitles[currentIndex];
            if (currentSub && currentSub.expansion) {
              const allItems = getFlattenedExpansionItems(currentSub);
              const originalExpItems = allItems.filter(it => isItemFromOriginal(it, currentSub.text) && it.type === "vocabulary");
              if (originalExpItems.length > 0) {
                const displayMode = autoStudyDisplayModeRef.current;
                if (displayMode === "instant") {
                  // Mode 2: Trượt vào sau khi sub đã chạy được 1s (hoặc 40% sub nếu sub ngắn)
                  const subDuration = currentSub.end - currentSub.start;
                  const triggerTime = currentSub.start + Math.min(1.0, Math.max(0.1, subDuration * 0.4));
                  if (autoStudyPhaseRef.current === "idle" && time >= triggerTime && hasTriggeredAutoStudyRef.current !== currentIndex) {
                    hasTriggeredAutoStudyRef.current = currentIndex;
                    startAutoStudyInstant(currentIndex, originalExpItems);
                  } else if (autoStudyPhaseRef.current === "showing" && time >= (currentSub.end + 0.15)) {
                    if (isLoopingCurrentSubRef.current || autoStudyLoopsRef.current > 0) {
                      startAutoStudyReplay(currentIndex, isLoopingCurrentSubRef.current ? 999999 : autoStudyLoopsRef.current);
                    } else {
                      stopAutoStudy();
                    }
                    return;
                  }
                } else {
                  // Mode 1: Đánh chữ (Typewriter) tại cuối sub
                  if (autoStudyPhaseRef.current === "idle" && time >= (currentSub.end + 0.15) && hasTriggeredAutoStudyRef.current !== currentIndex) {
                    hasTriggeredAutoStudyRef.current = currentIndex;
                    startAutoStudyTypewriter(currentIndex, originalExpItems);
                    return;
                  }
                }
              }
            }
          }

          // Auto-Study Replaying Loops Handling
          if (autoStudyPhaseRef.current === "replaying" && subtitles.length > 0) {
            const currentSub = subtitles[currentIndex];
            if (currentSub && time >= (currentSub.end + 0.15)) {
              if (isLoopingCurrentSubRef.current) {
                // Infinite loop mode: keep replaying the current sub continuously
                lastSeekTimeRef.current = Date.now();
                if (playerRef.current && typeof playerRef.current.seekTo === "function") {
                  playerRef.current.seekTo(currentSub.start, true);
                  playerRef.current.playVideo();
                  setIsPlaying(true);
                }
                return;
              }

              if (autoStudyLoopRemainingRef.current > 1) {
                autoStudyLoopRemainingRef.current -= 1;
                setAutoStudyLoopRemaining(autoStudyLoopRemainingRef.current);
                lastSeekTimeRef.current = Date.now();
                if (playerRef.current && typeof playerRef.current.seekTo === "function") {
                  playerRef.current.seekTo(currentSub.start, true);
                  playerRef.current.playVideo();
                  setIsPlaying(true);
                }
              } else {
                stopAutoStudy();
                if (currentIndex < subtitles.length - 1) {
                  playSubtitleRow(currentIndex + 1);
                }
              }
              return;
            }
          }

          // Auto-looping in dictation mode OR when isLoopingCurrentSub is active
          if ((isLoopingCurrentSub || mode === "dictation") && subtitles.length > 0) {
            const currentSub = subtitles[currentIndex];
            const loopEndThreshold = (currentSub?.end || 0) + 0.15;
            if (currentSub && time >= loopEndThreshold) {
              lastSeekTimeRef.current = Date.now();
              playerRef.current.seekTo(currentSub.start, true);
            }
          }

          // Find and update active subtitle based on time (only in listening mode when NOT looping and NOT in auto-study)
          if (mode === "listen" && !isLoopingCurrentSub && autoStudyPhaseRef.current === "idle" && subtitles.length > 0) {
            // Scan backwards to find the latest matching subtitle (prioritizes newer segments when times overlap)
            let foundIndex = -1;
            for (let i = subtitles.length - 1; i >= 0; i--) {
              const sub = subtitles[i];
              if (time >= sub.start && time <= sub.end) {
                foundIndex = i;
                break;
              }
            }
            if (foundIndex !== -1 && foundIndex !== currentIndex) {
              setCurrentIndex(foundIndex);
            }
          }
        } catch (e) {}
      }
    }, 250);

    return () => clearInterval(interval);
  }, [subtitles, currentIndex, mode, isLoopingCurrentSub, isDirectVideo]);

  // Scroll active subtitle row steadily inside container
  useEffect(() => {
    if (activeSubRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeSubRef.current;
      
      const containerHeight = container.clientHeight;
      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;
      
      const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth"
      });
    }
  }, [currentIndex]);

  // Reset dictation status when active sentence changes
  useEffect(() => {
    setDictationInput("");
    setIsCompleted(false);
  }, [currentIndex]);

  // Dictation logic: Check input against target text
  const targetText = subtitles[currentIndex]?.text || "";
  useEffect(() => {
    if (mode !== "dictation" || isCompleted || !targetText) return;

    let match = true;
    let hasLetters = false;
    
    // We clean punctuation differences if needed, but here we do character-by-character check
    for (let i = 0; i < targetText.length; i++) {
      const c = targetText[i];
      if (/[a-zA-Z0-9]/.test(c)) {
        hasLetters = true;
        if (!dictationInput[i] || dictationInput[i].toLowerCase() !== c.toLowerCase()) {
          match = false;
          break;
        }
      }
    }

    if (match && hasLetters && dictationInput.length > 0) {
      setIsCompleted(true);
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
      const successAudio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
      successAudio.play().catch(() => {});
    }
  }, [dictationInput, targetText, isCompleted, mode]);

  // Handle seeking & playing a specific subtitle row
  const playSubtitleRow = (index: number) => {
    if (index < 0 || index >= subtitles.length) return;
    if (autoStudyPhaseRef.current !== "idle" || index !== currentIndexRef.current) {
      stopAutoStudy();
      hasTriggeredAutoStudyRef.current = -1;
    }
    lastSeekTimeRef.current = Date.now();
    setCurrentIndex(index);
    const sub = subtitles[index];
    if (isDirectVideo) {
      if (videoRef.current) {
        videoRef.current.currentTime = sub.start;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(sub.start, true);
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }

    if (mode === "dictation") {
      setTimeout(() => {
        dictationTextareaRef.current?.focus();
      }, 50);
    }
  };
  playSubtitleRowRef.current = playSubtitleRow;

  // Play/Pause video (both modes)
  const togglePlay = () => {
    if (autoStudyPhaseRef.current === "typing") {
      if (isAutoStudyPausedRef.current) {
        resumeAutoStudyTyping();
      } else {
        pauseAutoStudyTyping();
      }
      return;
    }

    if (isDirectVideo) {
      if (!videoRef.current) return;
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      if (!playerRef.current) return;
      if (isPlaying) {
        if (typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
        setIsPlaying(false);
      } else {
        if (typeof playerRef.current.playVideo === "function") {
          playerRef.current.playVideo();
        }
        setIsPlaying(true);
      }
    }
  };
  togglePlayRef.current = togglePlay;

  // Change Playback Speed (both modes)
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (isDirectVideo) {
      if (videoRef.current) videoRef.current.playbackRate = speed;
    } else {
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
        playerRef.current.setPlaybackRate(speed);
      }
    }
  };

  // Hotkeys handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save subtitle shortcut: Cmd+S / Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (editingIndexRef.current !== null && !isSavingEditRef.current) {
          e.preventDefault();
          saveLiveEditRef.current?.(editingIndexRef.current);
          return;
        }
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const target = e.target as HTMLElement | null;

      // Check if user is typing in the drawing overlay text editor
      const isDrawingTyping = 
        (activeEl && (
          activeEl.isContentEditable ||
          (typeof activeEl.closest === "function" && activeEl.closest("[contenteditable]") !== null) ||
          (typeof activeEl.closest === "function" && activeEl.closest("[class*=\"richTextInput\"]") !== null)
        )) ||
        (target && (
          target.isContentEditable ||
          (typeof target.closest === "function" && target.closest("[contenteditable]") !== null) ||
          (typeof target.closest === "function" && target.closest("[class*=\"richTextInput\"]") !== null)
        ));

      if (isDrawingTyping) {
        return; // Bypass all movie player hotkeys completely while typing a drawing comment
      }

      const isTyping = 
        (activeEl?.tagName === "INPUT" && 
         (activeEl as HTMLInputElement).type !== "checkbox" && 
         (activeEl as HTMLInputElement).type !== "radio") || 
        activeEl?.tagName === "TEXTAREA";
      
      // Shortcuts without modifiers when NOT typing
      if (!isTyping) {
        // IMPORTANT: Do NOT intercept if Cmd or Ctrl is pressed (allows Cmd+V, Cmd+C, Cmd+A, macOS Shortcuts, etc.)
        if (!e.metaKey && !e.ctrlKey) {
          if (e.code === "KeyN" || e.key === "Enter") {
            e.preventDefault();
            playSubtitleRow(currentIndex + 1);
          } else if (e.code === "KeyV") {
            e.preventDefault();
            playSubtitleRow(currentIndex - 1);
          } else if (e.code === "KeyB") {
            e.preventDefault();
            playSubtitleRow(currentIndex);
          } else if (e.code === "KeyL" || e.key.toLowerCase() === "l") {
            e.preventDefault();
            setIsLoopingCurrentSub(prev => !prev);
          } else if (e.code === "Backquote") {
            e.preventDefault();
            togglePlay();
          } else if (hasExpansionAccess && (
            e.key === ',' || e.key === '.' ||
            e.key === '[' || e.key.toLowerCase() === 'ư' ||
            e.key === ']' || e.key.toLowerCase() === 'ơ'
          )) {
            e.preventDefault();
            const now = Date.now();
            if (now - lastExpansionHotkeyTime.current < 40) return;
            lastExpansionHotkeyTime.current = now;

            const currentSub = subtitles[currentIndex];
            if (currentSub) {
              const items = getFlattenedExpansionItems(currentSub);
              if (items.length > 0) {
                const isNext = e.key === '.' || e.key === ']' || e.key.toLowerCase() === 'ơ';
                const nextIdx = isNext 
                  ? (selectedExpansionIndexRef.current + 1) % items.length 
                  : (selectedExpansionIndexRef.current - 1 + items.length) % items.length;
                updateExpansionPopup(currentIndex, nextIdx, false, null, false);
              } else {
                updateExpansionPopup(currentIndex, 0, false, null, false);
              }
            }
          }
        }
      } 
      // Shortcuts when user is typing in the box (e.g. dictation mode)
      else if (isTyping) {
        if (e.code === "Backquote" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          togglePlay();
        } else if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          playSubtitleRow(currentIndex + 1);
        } else if (e.altKey) {
          if (e.code === "KeyN") {
            e.preventDefault();
            playSubtitleRow(currentIndex + 1);
          } else if (e.code === "KeyV") {
            e.preventDefault();
            playSubtitleRow(currentIndex - 1);
          } else if (e.code === "KeyB") {
            e.preventDefault();
            playSubtitleRow(currentIndex);
          } else if (e.code === "KeyL" || e.key.toLowerCase() === "l") {
            e.preventDefault();
            setIsLoopingCurrentSub(prev => !prev);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, subtitles, isPlaying, mode, hasExpansionAccess, selectedExpansionIndex, isLoopingCurrentSub]);

  // Live Inline Editing Handlers
  const startEdit = (idx: number, sub: Subtitle) => {
    setEditingIndex(idx);
    setEditFields({
      text: sub.text,
      ipa: sub.ipa || "",
      vietnamese: sub.vietnamese || "",
      slang_and_idiom: sub.slang_and_idiom || "",
      start: formatTimeDetailed(sub.start),
      end: formatTimeDetailed(sub.end),
    });
  };

  const parseTimeToSeconds = (str: string | number): number => {
    if (str === undefined || str === null) return 0;
    if (typeof str === 'number') return str;
    const cleanStr = str.trim();
    if (!cleanStr.includes(':')) {
      return parseFloat(cleanStr) || 0;
    }
    const parts = cleanStr.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      const secs = parseFloat(parts[2]) || 0;
      return hours * 3600 + mins * 60 + secs;
    }
    return parseFloat(cleanStr) || 0;
  };

  const saveLiveEdit = async (idx: number) => {
    setIsSavingEdit(true);
    try {
      const updatedSubtitles = [...subtitles];
      updatedSubtitles[idx] = {
        ...updatedSubtitles[idx],
        text: editFields.text,
        ipa: editFields.ipa,
        vietnamese: editFields.vietnamese,
        slang_and_idiom: editFields.slang_and_idiom,
        start: parseTimeToSeconds(editFields.start),
        end: parseTimeToSeconds(editFields.end),
        expansion: subtitles[idx]?.expansion,
      };

      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: JSON.stringify(updatedSubtitles),
        }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      setSubtitles(updatedSubtitles);
      subtitlesRef.current = updatedSubtitles;
      if (popupRef.current && !popupRef.current.closed) {
        updateExpansionPopup(idx, selectedExpansionIndexRef.current, false, null, false);
      }
      setEditingIndex(null);
      showToast("Đã cập nhật phụ đề thành công!", "success");

    } catch (e) {
      showToast("Lỗi khi cập nhật phụ đề!", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  saveLiveEditRef.current = saveLiveEdit;

  const adjustEditTime = (field: 'start' | 'end', offset: number) => {
    const currentVal = parseTimeToSeconds(editFields[field]);
    const newVal = Math.max(0, parseFloat((currentVal + offset).toFixed(2)));
    setEditFields((prev: any) => ({
      ...prev,
      [field]: formatTimeDetailed(newVal)
    }));
  };

  const shiftAllSubtitles = async (offset: number) => {
    if (subtitles.length === 0) return;
    const confirmMsg = `Bạn có chắc muốn dịch chuyển TOÀN BỘ phụ đề ${offset > 0 ? "muộn hơn" : "sớm hơn"} ${Math.abs(offset)} giây?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const updatedSubtitles = subtitles.map(sub => ({
        ...sub,
        start: Math.max(0, parseFloat((sub.start + offset).toFixed(2))),
        end: Math.max(0, parseFloat((sub.end + offset).toFixed(2))),
      }));

      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: JSON.stringify(updatedSubtitles),
        }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      setSubtitles(updatedSubtitles);
      showToast(`Đã dịch chuyển toàn bộ phụ đề ${offset > 0 ? "muộn hơn" : "sớm hơn"} ${Math.abs(offset)}s!`, "success");
    } catch (e) {
      showToast("Lỗi khi dịch chuyển phụ đề!", "error");
    }
  };

  const formatTime = (secs: number) => {
    if (typeof secs !== 'number' || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimeDetailed = (secs: number) => {
    if (typeof secs !== 'number' || isNaN(secs)) return '00:00.00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const ms = (secs % 1).toFixed(2).substring(2);
    
    const hStr = h > 0 ? `${h}:` : '';
    const mStr = h > 0 ? m.toString().padStart(2, '0') : m.toString();
    const sStr = s.toString().padStart(2, '0');
    
    return `${hStr}${mStr}:${sStr}.${ms}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (isDirectVideo) {
      if (videoRef.current) {
        videoRef.current.currentTime = val;
      }
    } else {
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        lastSeekTimeRef.current = Date.now();
        playerRef.current.seekTo(val, true);
      }
    }
  };

  return (
    <div ref={outerContainerRef} className="flex flex-col w-full bg-slate-50 pb-12">
      {/* TOP: Video Player (Centered, takes full-width with a max-width limit) */}
      <div className="w-full flex justify-center bg-slate-900 shadow-inner p-2 md:p-4 shrink-0">
        <div 
          id="youtube-dictation-video-container"
          ref={videoContainerRef}
          tabIndex={-1}
          onMouseLeave={() => videoContainerRef.current?.focus()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchStartCapture={handleDoubleTap}
          className={`w-full bg-black relative flex items-center justify-center group/video transition-all outline-none ${
            isFullscreen 
              ? "max-w-none h-full rounded-none border-0 shadow-none" 
              : "max-w-5xl aspect-video rounded-none border-2 md:border-4 border-black shadow-2xl"
          }`}
        >
          {isDirectVideo ? (
            <video
              ref={videoRef}
              src={directVideoUrl}
              className="w-full h-full object-contain bg-black cursor-pointer"
              onClick={togglePlay}
              onError={(e) => {
                const vid = e.currentTarget;
                const errCode = vid.error?.code;
                const errMsg = vid.error?.message || "Unknown error";
                const codeMap: Record<number, string> = {
                  1: "MEDIA_ERR_ABORTED - Người dùng hủy tải",
                  2: "MEDIA_ERR_NETWORK - Lỗi mạng khi tải video",
                  3: "MEDIA_ERR_DECODE - Lỗi giải mã (codec không hỗ trợ?)",
                  4: "MEDIA_ERR_SRC_NOT_SUPPORTED - URL không hợp lệ hoặc bị chặn CORS",
                };
                const desc = errCode ? codeMap[errCode] : "Lỗi không xác định";
                console.error("[Video Error]", errCode, errMsg, directVideoUrl);
                alert(`❌ Lỗi tải video:\n${desc}\n\nURL: ${directVideoUrl}\n\nKiểm tra:\n• Bucket Supabase đã đặt Public chưa?\n• URL có dạng .../object/public/... không?\n• Có CORS Policy cho domain này chưa?`);
              }}
              onTimeUpdate={() => {
                if (!videoRef.current) return;
                const time = videoRef.current.currentTime;
                setCurrentTime(time);

                // Aggressively disable native text tracks
                const tracks = videoRef.current.textTracks;
                for (let i = 0; i < tracks.length; i++) {
                  tracks[i].mode = "disabled";
                }

                // Auto-Study Vocab check (Mode 1: Typewriter at end / Mode 2: Slide-in after 1s)
                if (isAutoStudyModeRef.current && mode === "listen" && subtitles.length > 0) {
                  const currentSub = subtitles[currentIndex];
                  if (currentSub && currentSub.expansion) {
                    const allItems = getFlattenedExpansionItems(currentSub);
                    const originalExpItems = allItems.filter(it => isItemFromOriginal(it, currentSub.text) && it.type === "vocabulary");
                    if (originalExpItems.length > 0) {
                      const displayMode = autoStudyDisplayModeRef.current;
                      if (displayMode === "instant") {
                        // Mode 2: Trượt vào sau khi sub đã chạy được 1s (hoặc 40% sub nếu sub ngắn)
                        const subDuration = currentSub.end - currentSub.start;
                        const triggerTime = currentSub.start + Math.min(1.0, Math.max(0.1, subDuration * 0.4));
                        if (autoStudyPhaseRef.current === "idle" && time >= triggerTime && hasTriggeredAutoStudyRef.current !== currentIndex) {
                          hasTriggeredAutoStudyRef.current = currentIndex;
                          startAutoStudyInstant(currentIndex, originalExpItems);
                        } else if (autoStudyPhaseRef.current === "showing" && time >= (currentSub.end + 0.15)) {
                          if (isLoopingCurrentSubRef.current || autoStudyLoopsRef.current > 0) {
                            startAutoStudyReplay(currentIndex, isLoopingCurrentSubRef.current ? 999999 : autoStudyLoopsRef.current);
                          } else {
                            stopAutoStudy();
                          }
                          return;
                        }
                      } else {
                        // Mode 1: Đánh chữ (Typewriter) tại cuối sub
                        if (autoStudyPhaseRef.current === "idle" && time >= (currentSub.end + 0.15) && hasTriggeredAutoStudyRef.current !== currentIndex) {
                          hasTriggeredAutoStudyRef.current = currentIndex;
                          startAutoStudyTypewriter(currentIndex, originalExpItems);
                          return;
                        }
                      }
                    }
                  }
                }

                // Auto-Study Replaying Loops Handling
                if (autoStudyPhaseRef.current === "replaying" && subtitles.length > 0) {
                  const currentSub = subtitles[currentIndex];
                  if (currentSub && time >= (currentSub.end + 0.15)) {
                    if (isLoopingCurrentSubRef.current) {
                      // Infinite loop mode: keep replaying the current sub continuously
                      lastSeekTimeRef.current = Date.now();
                      if (videoRef.current) {
                        videoRef.current.currentTime = currentSub.start;
                        videoRef.current.play().catch(() => {});
                        setIsPlaying(true);
                      }
                      return;
                    }

                    if (autoStudyLoopRemainingRef.current > 1) {
                      autoStudyLoopRemainingRef.current -= 1;
                      setAutoStudyLoopRemaining(autoStudyLoopRemainingRef.current);
                      lastSeekTimeRef.current = Date.now();
                      if (videoRef.current) {
                        videoRef.current.currentTime = currentSub.start;
                        videoRef.current.play().catch(() => {});
                        setIsPlaying(true);
                      }
                    } else {
                      stopAutoStudy();
                      if (currentIndex < subtitles.length - 1) {
                        playSubtitleRow(currentIndex + 1);
                      }
                    }
                    return;
                  }
                }

                // Auto-looping in dictation mode OR when isLoopingCurrentSub is active
                if ((isLoopingCurrentSub || mode === "dictation") && subtitles.length > 0) {
                  const currentSub = subtitles[currentIndex];
                  const loopEndThreshold = (currentSub?.end || 0) + 0.15;
                  if (currentSub && time >= loopEndThreshold) {
                    videoRef.current.currentTime = currentSub.start;
                    videoRef.current.play().catch(() => {});
                  }
                }

                // Find and update active subtitle based on time (only in listen mode when NOT looping and NOT in auto-study)
                if (mode === "listen" && !isLoopingCurrentSub && autoStudyPhaseRef.current === "idle" && subtitles.length > 0) {
                  let foundIndex = -1;
                  for (let i = subtitles.length - 1; i >= 0; i--) {
                    const sub = subtitles[i];
                    if (time >= sub.start && time <= sub.end) {
                      foundIndex = i;
                      break;
                    }
                  }
                  if (foundIndex !== -1 && foundIndex !== currentIndex) {
                    setCurrentIndex(foundIndex);
                  }
                }
              }}
              onDurationChange={() => {
                if (videoRef.current) setDuration(videoRef.current.duration);
              }}
              onPlay={() => {
                setIsPlaying(true);
                if (autoStudyPhaseRef.current === "typing" && isAutoStudyPausedRef.current) {
                  resumeAutoStudyTyping();
                }
                // Disable native text tracks on play
                if (videoRef.current) {
                  const tracks = videoRef.current.textTracks;
                  for (let i = 0; i < tracks.length; i++) {
                    tracks[i].mode = "disabled";
                  }
                }
              }}
              onPause={() => {
                setIsPlaying(false);
                if (autoStudyPhaseRef.current === "typing" && !isProgrammaticPauseRef.current && !isAutoStudyPausedRef.current) {
                  pauseAutoStudyTyping();
                }
              }}
              controls={false}
              playsInline
              preload="metadata"
            />
          ) : videoId ? (
            <iframe
              id="youtube-dictation-iframe"
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&version=3&rel=0&controls=1&cc_load_policy=0&iv_load_policy=3&modestbranding=1&playsinline=1`}
              className="w-full h-full border-none"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-bold text-xs md:text-sm">
              Chưa có video URL hợp lệ
            </div>
          )}

          {/* Minimalist Video Timestamp & Percentage Badge (Góc trái bên dưới) */}
          {duration > 0 && (
            <div className="absolute bottom-2 left-2 z-30 pointer-events-none select-none px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 text-[11px] sm:text-xs font-mono font-medium text-white/90 flex items-center gap-1 shadow-md">
              <span>
                {(() => {
                  const fmt = (sec: number) => {
                    if (isNaN(sec) || sec < 0) return "0:00";
                    const h = Math.floor(sec / 3600);
                    const m = Math.floor((sec % 3600) / 60);
                    const s = Math.floor(sec % 60);
                    if (h > 0) {
                      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
                    }
                    return `${m}:${s.toString().padStart(2, "0")}`;
                  };
                  const pct = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
                  return `${fmt(currentTime)}/${fmt(duration)} (${pct}%)`;
                })()}
              </span>
            </div>
          )}

          {/* Custom Fullscreen Toggle Button */}
          {videoUrl && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-2 right-2 md:top-4 md:right-4 z-30 p-2 rounded-lg md:rounded-xl bg-black/60 hover:bg-black/85 text-white/80 hover:text-white border border-white/10 hover:border-white/20 transition-all hover:scale-105 opacity-0 group-hover/video:opacity-100 focus:opacity-100 shadow-md backdrop-blur-sm pointer-events-auto"
              title={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}

          {/* Auto-Study Vocab Top Overlay */}
          {isAutoStudyMode && autoStudyPhase !== "idle" && autoStudyItems.length > 0 && (
            <div 
              key={`auto-study-overlay-container-${autoStudyTargetIdxRef.current}`}
              className="absolute top-2 sm:top-3 md:top-4 left-2 right-2 sm:left-3 sm:right-3 bottom-14 sm:bottom-16 md:bottom-20 z-50 pointer-events-none flex justify-start items-start overflow-hidden"
            >
              {renderAutoStudyOverlayContent(
                autoStudyItems,
                autoStudyPhase === 'replaying' ? 999999 : autoStudyTypedChars,
                autoStudyPhase === 'typing',
                autoStudyLoopRemaining,
                autoStudyLoops,
                autoStudyPhase,
                autoStudyOpacity,
                isAutoStudyPaused,
                autoStudyDisplayMode,
                autoStudyBorderWidth,
                autoStudyBorderColor,
                autoStudyBorderOpacity,
                isLoopingCurrentSub
              )}
            </div>
          )}

          {/* Subtitle Overlay đè lên video */}
          {showSubOnVideo && mode === "listen" && subtitles[currentIndex] && (
            <div className="absolute bottom-2 sm:bottom-5 md:bottom-10 left-0 right-0 pointer-events-none flex flex-col items-center justify-center px-2 md:px-4 text-center z-50 select-none">
              <div className="bg-black/60 px-3 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl max-w-[90%] md:max-w-[85%] shadow-lg">
                <p 
                  style={{ 
                    fontSize: `${(isFullscreen ? fontSize * 1.4 : fontSize + 1) * (isMobile ? 0.7 : 1)}px`,
                    color: '#ffffff'
                  }} 
                  className="font-extrabold leading-normal drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] md:drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] text-white"
                >
                  {renderHighlightedSubtitle(
                    subtitles[currentIndex].text,
                    autoStudyItems,
                    currentActiveAutoStudyItemIdx,
                    isAutoStudyMode && autoStudyPhase !== "idle",
                    autoStudyPhase === "replaying"
                  )}
                </p>
                {showIpa && subtitles[currentIndex].ipa && (
                  <p 
                    style={{ fontSize: `${(isFullscreen ? (fontSize - 1) * 1.4 : fontSize - 2) * (isMobile ? 0.7 : 1)}px` }} 
                    className="text-indigo-300 font-mono font-semibold mt-0.5"
                  >
                    {subtitles[currentIndex].ipa}
                  </p>
                )}
                {subtitles[currentIndex].vietnamese && !hideVietsub && (
                  <p 
                    style={{ fontSize: `${(isFullscreen ? (fontSize - 1) * 1.4 : fontSize - 2) * (isMobile ? 0.7 : 1)}px` }} 
                    className="text-slate-200 mt-0.5 md:mt-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-medium"
                  >
                    {subtitles[currentIndex].vietnamese}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: Workspace (Centered, matching video width) */}
      <div className="w-full max-w-5xl mx-auto p-2 md:p-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[380px] md:h-[500px] relative">
          {/* Shared Header (Mode Switcher, Checkboxes, Font Controls, Tooltip) */}
          <div className="bg-slate-50 border-b text-xs font-black text-slate-400 tracking-wider uppercase shrink-0 rounded-t-2xl md:rounded-t-3xl flex flex-wrap md:flex-nowrap items-center justify-between p-2 md:p-2.5 gap-2 select-none z-30">
            {/* Row 1: Mode & Speed (and Settings Toggle on mobile) */}
            <div className="flex items-center justify-between md:justify-start gap-2 shrink-0">
              {/* Mode switch */}
              <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-250 shrink-0">
                <button
                  onClick={(e) => {
                    setMode("listen");
                    e.currentTarget.blur();
                  }}
                  className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded text-[10px] font-black transition-all flex items-center gap-1 ${
                    mode === "listen" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="🔊 Luyện Nghe & Đọc Dịch"
                >
                  <Volume2 size={11} />
                  <span>Nghe</span>
                </button>
                <button
                  onClick={() => {
                    setMode("dictation");
                    setTimeout(() => dictationTextareaRef.current?.focus(), 100);
                  }}
                  className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded text-[10px] font-black transition-all flex items-center gap-1 ${
                    mode === "dictation" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="✏️ Nghe Chép Chính Tả"
                >
                  <Edit size={11} />
                  <span>Chính tả</span>
                </button>
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1 normal-case shrink-0">
                <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-250">
                  {[0.5, 0.7, 1, 1.2].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={(e) => {
                        handleSpeedChange(speed);
                        e.currentTarget.blur();
                      }}
                      className={`px-1.5 py-0.5 md:px-2 rounded text-[9px] md:text-[10px] font-black transition-all ${
                        playbackRate === speed
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Toggle button on Mobile */}
              <button
                type="button"
                onClick={() => setShowMobileOptions(!showMobileOptions)}
                className={`md:hidden p-1 rounded-lg border transition-all ${
                  showMobileOptions 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-605" 
                    : "bg-white border-slate-200 text-slate-500"
                }`}
                title="Tùy chọn hiển thị"
              >
                <Settings size={14} />
              </button>
            </div>

            {/* Row 2: Checkboxes, Font Sizing, Timing Shift, Tooltip */}
            <div className={`${showMobileOptions ? "flex" : "hidden"} md:flex items-center justify-between md:justify-end gap-1.5 md:gap-2.5 w-full md:w-auto border-t border-slate-200/60 md:border-t-0 pt-2 md:pt-0 shrink-0`}>
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                {/* Show options */}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <label className="flex items-center gap-0.5 cursor-pointer font-bold text-slate-500 hover:text-indigo-600 transition-colors normal-case text-[10px] md:text-xs" title="Bật/tắt hiển thị phiên âm IPA">
                    <input
                      type="checkbox"
                      checked={showIpa}
                      onChange={(e) => {
                        setShowIpa(e.target.checked);
                        e.target.blur();
                      }}
                      className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3 md:w-3.5 md:h-3.5 h-3"
                    />
                    <span>IPA</span>
                  </label>
                  <label className="flex items-center gap-0.5 cursor-pointer font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-1.5 md:pl-2 normal-case text-[10px] md:text-xs" title="Bật/tắt hiển thị giải nghĩa slang/idiom">
                    <input
                      type="checkbox"
                      checked={showNotes}
                      onChange={(e) => {
                        setShowNotes(e.target.checked);
                        e.target.blur();
                      }}
                      className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3 md:w-3.5 md:h-3.5 h-3"
                    />
                    <span>Note</span>
                  </label>
                  <label className="flex items-center gap-0.5 cursor-pointer font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-1.5 md:pl-2 normal-case text-[10px] md:text-xs" title="Bật/tắt phụ đề trên khung video">
                    <input
                      type="checkbox"
                      checked={showSubOnVideo}
                      onChange={(e) => {
                        setShowSubOnVideo(e.target.checked);
                        e.target.blur();
                      }}
                      className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3 md:w-3.5 md:h-3.5 h-3"
                    />
                    <span>Sub</span>
                  </label>
                  <label className="flex items-center gap-0.5 cursor-pointer font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-1.5 md:pl-2 normal-case text-[10px] md:text-xs" title="Tích chọn để ẩn phụ đề Tiếng Việt">
                    <input
                      type="checkbox"
                      checked={hideVietsub}
                      onChange={(e) => {
                        setHideVietsub(e.target.checked);
                        e.target.blur();
                      }}
                      className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3 md:w-3.5 md:h-3.5 h-3"
                    />
                    <span>Vietsub</span>
                  </label>
                </div>

                {/* FontSize */}
                <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 md:pl-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      setFontSize(prev => Math.max(12, prev - 2));
                      e.currentTarget.blur();
                    }}
                    className="w-5 h-5 md:w-5.5 md:h-5.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-[9px] flex items-center justify-center transition-all active:scale-95"
                    title="Giảm cỡ chữ"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      setFontSize(prev => Math.min(24, prev + 2));
                      e.currentTarget.blur();
                    }}
                    className="w-5 h-5 md:w-5.5 md:h-5.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-[9px] flex items-center justify-center transition-all active:scale-95"
                    title="Tăng cỡ chữ"
                  >
                    A+
                  </button>
                </div>

                {/* Timing shifter */}
                {mode === "listen" && (
                  <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 md:pl-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        shiftAllSubtitles(-0.25);
                        e.currentTarget.blur();
                      }}
                      className="px-1 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[9px] transition-all active:scale-95"
                      title="Toàn bộ sub xuất hiện sớm hơn 0.25s"
                    >
                      -0.25s
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        shiftAllSubtitles(0.25);
                        e.currentTarget.blur();
                      }}
                      className="px-1 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-[9px] transition-all active:scale-95"
                      title="Toàn bộ sub xuất hiện muộn hơn 0.25s"
                    >
                      +0.25s
                    </button>
                  </div>
                )}

                {/* Loop Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    setIsLoopingCurrentSub(prev => !prev);
                    e.currentTarget.blur();
                  }}
                  className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center font-bold text-xs md:text-sm transition-all active:scale-95 shadow-xs shrink-0 border ${
                    isLoopingCurrentSub 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm animate-pulse ring-2 ring-indigo-200' 
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="Lặp vô hạn câu (Phím tắt: L)"
                >
                  <span>🔁</span>
                </button>

                {/* Auto-Study Vocab Mode Toggle & Dropdown */}
                <div className="relative auto-study-dropdown-container">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAutoStudySettings(prev => !prev);
                    }}
                    className={`h-6 md:h-7 px-1.5 md:px-2 rounded-lg flex items-center gap-1 font-bold text-[10px] md:text-xs transition-all active:scale-95 shadow-xs shrink-0 border ${
                      isAutoStudyMode 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200' 
                        : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title="Chế độ Tự học từ vựng (Nhấp để mở menu cài đặt)"
                  >
                    <span>🧠</span>
                    <span className="hidden sm:inline font-bold">
                      Tự học
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAutoStudyMode ? 'bg-emerald-200 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[8px] opacity-70">▼</span>
                  </button>

                  {showAutoStudySettings && (
                    <div 
                      className="absolute top-full right-0 mt-2 w-80 max-h-[82vh] overflow-y-auto no-scrollbar p-3.5 bg-white text-slate-800 text-xs rounded-2xl shadow-2xl border border-slate-200 z-[100] normal-case animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span>🧠</span>
                          <span>Chế độ Tự học từ vựng</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAutoStudySettings(false)}
                          className="text-slate-400 hover:text-slate-600 font-bold p-0.5"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Toggle Mode */}
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <div>
                          <div className="font-bold text-slate-700">Tự động dừng & học từ</div>
                          <div className="text-[10px] text-slate-500">Dừng ở cuối sub có từ vựng</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = !isAutoStudyMode;
                            setIsAutoStudyMode(nextVal);
                            localStorage.setItem("webtoeic_auto_study_mode", String(nextVal));
                            if (!nextVal) stopAutoStudy();
                          }}
                          className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 flex items-center ${
                            isAutoStudyMode ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <div 
                            className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                              isAutoStudyMode ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Mode Selection (Typewriter vs Instant) */}
                      <div className="py-2 border-b border-slate-100">
                        <div className="font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                          <span>Kiểu xuất hiện từ vựng</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAutoStudyDisplayMode("typewriter");
                              localStorage.setItem("webtoeic_auto_study_display_mode", "typewriter");
                            }}
                            className={`p-2 rounded-xl text-left border transition-all ${
                              autoStudyDisplayMode === "typewriter"
                                ? 'bg-indigo-50/90 border-indigo-600 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <div className="font-extrabold text-[11px] flex items-center gap-1">
                              <span>⌨️</span> Đánh chữ
                            </div>
                            <div className="text-[9.5px] opacity-75 leading-tight mt-0.5">
                              Dừng cuối sub & gõ từng chữ
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAutoStudyDisplayMode("instant");
                              localStorage.setItem("webtoeic_auto_study_display_mode", "instant");
                            }}
                            className={`p-2 rounded-xl text-left border transition-all ${
                              autoStudyDisplayMode === "instant"
                                ? 'bg-indigo-50/90 border-indigo-600 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <div className="font-extrabold text-[11px] flex items-center gap-1">
                              <span>⚡</span> Trượt vào
                            </div>
                            <div className="text-[9.5px] opacity-75 leading-tight mt-0.5">
                              Hiện sau 1s (video vẫn chạy)
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Mode 1 specific settings: Typewriter Sound & Speed */}
                      {autoStudyDisplayMode === "typewriter" && (
                        <>
                          {/* Toggle Key Sound */}
                          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                            <div>
                              <div className="font-bold text-slate-700">Âm thanh gõ phím</div>
                              <div className="text-[10px] text-slate-500">Tiếng phím cơ khi gõ chữ</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = !autoStudySound;
                                setAutoStudySound(nextVal);
                                localStorage.setItem("webtoeic_auto_study_sound", String(nextVal));
                              }}
                              className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 flex items-center ${
                                autoStudySound ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <div 
                                className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                                  autoStudySound ? 'translate-x-4.5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Typing Speed */}
                          <div className="py-2 border-b border-slate-100">
                            <div className="font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                              <span>Tốc độ gõ chữ</span>
                              <span className="text-slate-500 font-medium">
                                {autoStudySpeed <= 20 ? 'Nhanh' : autoStudySpeed <= 35 ? 'Vừa' : 'Chậm'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { label: 'Nhanh', ms: 20 },
                                { label: 'Vừa', ms: 35 },
                                { label: 'Chậm', ms: 50 },
                              ].map((item) => (
                                <button
                                  key={item.ms}
                                  type="button"
                                  onClick={() => {
                                    setAutoStudySpeed(item.ms);
                                    localStorage.setItem("webtoeic_auto_study_speed", String(item.ms));
                                  }}
                                  className={`py-1 rounded-lg font-bold text-[11px] border transition-all ${
                                    autoStudySpeed === item.ms
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Mode 2 hint */}
                      {autoStudyDisplayMode === "instant" && (
                        <div className="py-2 border-b border-slate-100">
                          <div className="text-[10px] text-indigo-700 bg-indigo-50/80 p-2 rounded-xl border border-indigo-100 leading-relaxed">
                            💡 Sau khi sub chạy được 1s, khung từ vựng sẽ trượt vào mượt mà trong lúc video vẫn đang phát.
                          </div>
                        </div>
                      )}

                      {/* Loop Count Settings (Shared for both Mode 1 & Mode 2: 0, 1, 2, 3, 4, 5) */}
                      <div className="py-2 border-b border-slate-100">
                        <div className="font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                          <span>Số lần lặp lại câu</span>
                          <span className="text-indigo-600 font-extrabold">{autoStudyLoops === 0 ? "Không lặp (0)" : `${autoStudyLoops} lần`}</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {[0, 1, 2, 3, 4, 5].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => {
                                setAutoStudyLoops(count);
                                localStorage.setItem("webtoeic_auto_study_loops", String(count));
                              }}
                              className={`py-1 rounded-lg font-bold text-[11px] border transition-all ${
                                autoStudyLoops === count
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                        <div className="text-[9.5px] text-slate-400 mt-1">
                          {autoStudyLoops === 0 ? "0: Phát qua một lần duy nhất rồi sang câu tiếp" : `Lặp lại dòng sub ${autoStudyLoops} lần`}
                        </div>
                      </div>

                      {/* Border Settings (Độ dày, Độ mờ & Màu sắc khung viền) */}
                      <div className="py-2 border-b border-slate-100">
                        <div className="font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                          <span>Khung viền từ vựng</span>
                          <span className="text-indigo-600 font-extrabold">
                            {autoStudyBorderWidth === 0 ? "Không viền" : `${autoStudyBorderWidth}px (${autoStudyBorderOpacity}%)`}
                          </span>
                        </div>

                        {/* Độ dày viền: 0 (Không), 1px, 2px, 3px */}
                        <div className="mb-2">
                          <div className="text-[10px] text-slate-500 mb-1 font-semibold">Độ dày viền:</div>
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { label: 'Không viền', val: 0 },
                              { label: '1px Mảnh', val: 1 },
                              { label: '2px Vừa', val: 2 },
                              { label: '3px Đậm', val: 3 },
                            ].map((item) => (
                              <button
                                key={item.val}
                                type="button"
                                onClick={() => {
                                  setAutoStudyBorderWidth(item.val);
                                  localStorage.setItem("webtoeic_auto_study_border_width", String(item.val));
                                }}
                                className={`py-1 px-0.5 rounded-lg font-bold text-[10px] text-center border transition-all ${
                                  autoStudyBorderWidth === item.val
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Chỉ hiển thị độ mờ & màu sắc khi có viền */}
                        {autoStudyBorderWidth > 0 && (
                          <>
                            {/* Độ đậm / mờ viền (Border Opacity) */}
                            <div className="mb-2">
                              <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1 font-semibold">
                                <span>Độ đậm / mờ viền:</span>
                                <span className="text-indigo-600 font-bold">{autoStudyBorderOpacity}%</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={autoStudyBorderOpacity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setAutoStudyBorderOpacity(val);
                                  localStorage.setItem("webtoeic_auto_study_border_opacity", String(val));
                                }}
                                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                              />
                              <div className="grid grid-cols-4 gap-1 mt-1">
                                {[30, 50, 75, 100].map((percent) => (
                                  <button
                                    key={percent}
                                    type="button"
                                    onClick={() => {
                                      setAutoStudyBorderOpacity(percent);
                                      localStorage.setItem("webtoeic_auto_study_border_opacity", String(percent));
                                    }}
                                    className={`py-0.5 rounded font-bold text-[9.5px] border transition-all ${
                                      autoStudyBorderOpacity === percent
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {percent}%
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Màu sắc viền (Border Color) */}
                            <div>
                              <div className="text-[10px] text-slate-500 mb-1.5 font-semibold flex items-center justify-between">
                                <span>Màu sắc viền:</span>
                                <div className="flex items-center gap-1">
                                  <span 
                                    className="inline-block w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs"
                                    style={{ backgroundColor: autoStudyBorderColor }}
                                  />
                                  <span className="font-mono text-[9px] text-slate-600">{autoStudyBorderColor.toUpperCase()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {[
                                  { label: 'Trắng', hex: '#ffffff' },
                                  { label: 'Vàng', hex: '#f59e0b' },
                                  { label: 'Xanh lục', hex: '#10b981' },
                                  { label: 'Xanh lam', hex: '#3b82f6' },
                                  { label: 'Tím', hex: '#a855f7' },
                                  { label: 'Hồng', hex: '#f43f5e' },
                                  { label: 'Xám', hex: '#64748b' },
                                ].map((c) => (
                                  <button
                                    key={c.hex}
                                    type="button"
                                    onClick={() => {
                                      setAutoStudyBorderColor(c.hex);
                                      localStorage.setItem("webtoeic_auto_study_border_color", c.hex);
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 shadow-xs ${
                                      autoStudyBorderColor.toLowerCase() === c.hex.toLowerCase()
                                        ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110 border-indigo-600'
                                        : 'border-slate-300 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.label}
                                  >
                                    {autoStudyBorderColor.toLowerCase() === c.hex.toLowerCase() && (
                                      <span className={`text-[10px] font-bold ${c.hex === '#ffffff' ? 'text-slate-900' : 'text-white'}`}>
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                ))}

                                {/* Custom Color Picker */}
                                <label 
                                  className="w-6 h-6 rounded-full border border-slate-300 bg-gradient-to-tr from-rose-400 via-emerald-400 to-sky-400 cursor-pointer flex items-center justify-center hover:scale-105 transition-all shadow-xs relative"
                                  title="Chọn màu khác"
                                >
                                  <input
                                    type="color"
                                    value={autoStudyBorderColor}
                                    onChange={(e) => {
                                      const hex = e.target.value;
                                      setAutoStudyBorderColor(hex);
                                      localStorage.setItem("webtoeic_auto_study_border_color", hex);
                                    }}
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                  />
                                  <span className="text-[8px] font-black text-white drop-shadow-sm pointer-events-none">+</span>
                                </label>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Opacity Control (Độ đục nền khung) */}
                      <div className="pt-2">
                        <div className="font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                          <span>Độ đục nền khung chữ</span>
                          <span className="text-indigo-600 font-extrabold">{autoStudyOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={autoStudyOpacity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setAutoStudyOpacity(val);
                            localStorage.setItem("webtoeic_auto_study_opacity", String(val));
                          }}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <div className="grid grid-cols-4 gap-1 mt-1.5">
                          {[20, 40, 70, 100].map((percent) => (
                            <button
                              key={percent}
                              type="button"
                              onClick={() => {
                                setAutoStudyOpacity(percent);
                                localStorage.setItem("webtoeic_auto_study_opacity", String(percent));
                              }}
                              className={`py-0.5 rounded font-bold text-[10px] border transition-all ${
                                autoStudyOpacity === percent
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {percent}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vocabulary / Structure Expansion Popup Button (Admin / Teacher) */}
                {hasExpansionAccess && (
                  <button
                    type="button"
                    onClick={() => updateExpansionPopup(currentIndex, selectedExpansionIndex)}
                    className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs md:text-sm transition-all active:scale-95 shadow-xs ml-1 shrink-0"
                    title="Từ vựng/Cấu trúc ( , . )"
                  >
                    <span>📚</span>
                  </button>
                )}

                {/* Help Circle Tooltip */}
                <div className="relative group border-l border-slate-200 pl-1.5 md:pl-2">
                  <button 
                    type="button" 
                    className="flex items-center justify-center w-5 h-5 md:w-5.5 md:h-5.5 text-slate-400 hover:text-indigo-650 transition-colors bg-white rounded border border-slate-200 shadow-sm"
                    title="Hướng dẫn phím tắt"
                  >
                    <HelpCircle size={11} />
                  </button>
                  
                  <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pointer-events-none normal-case">
                    <p className="font-bold mb-2 text-indigo-300">Mẹo học nhanh bằng phím tắt:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-350">
                      <li>Nhấn phím <strong className="text-white">n</strong> để sang câu tiếp.</li>
                      <li>Nhấn phím <strong className="text-white">v</strong> để lùi lại câu trước.</li>
                      <li>Nhấn phím <strong className="text-white">b</strong> để nghe lại câu hiện tại.</li>
                      <li>Nhấn phím <strong className="text-indigo-300">l</strong> để Lặp vô hạn / Hủy lặp câu hiện tại.</li>
                      <li>Nhấn phím <strong className="text-white">~</strong> để Tạm dừng/Phát.</li>
                      <li>Nhấn phím <strong className="text-amber-300">,</strong> hoặc <strong className="text-amber-300">.</strong> để mở/duyệt Từ vựng & Cấu trúc.</li>
                      <li><em className="text-slate-400">Gõ chính tả:</em> Alt + (n, v, b, l, ~).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional content */}
          {mode === "listen" ? (
            <div 
              ref={containerRef} 
              onClick={() => videoContainerRef.current?.focus()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchStartCapture={handleDoubleTap}
              className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin relative webtoeic-scroll-container"
            >
              {subtitles.map((sub, idx) => {
                const isActive = currentIndex === idx;
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={idx}
                    ref={isActive ? activeSubRef : null}
                    onClick={() => !isEditing && playSubtitleRow(idx)}
                    className={`p-2.5 px-3.5 rounded-2xl border transition-all cursor-pointer group ${
                      isActive
                        ? isLoopingCurrentSub
                          ? "bg-indigo-50/90 border-indigo-300 shadow-md ring-2 ring-indigo-400"
                          : "bg-red-50/80 border-red-200 shadow-md ring-1 ring-red-300"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-12 gap-x-3 gap-y-2">
                          {/* Row 1: Start Time, End Time, IPA */}
                          <div className="col-span-6 md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Thời gian bắt đầu</label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={editFields.start}
                                onChange={(e) => setEditFields({ ...editFields, start: e.target.value })}
                                className="flex-1 p-1.5 px-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-700 min-w-0"
                                placeholder="Ví dụ: 8:27.67"
                              />
                              <div className="flex flex-col gap-0.5 justify-center shrink-0">
                                <button type="button" onClick={() => adjustEditTime('start', 0.25)} className="px-1 py-0.5 text-[8px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-655" title="Tăng 0.25s">+</button>
                                <button type="button" onClick={() => adjustEditTime('start', -0.25)} className="px-1 py-0.5 text-[8px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-655" title="Giảm 0.25s">-</button>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-6 md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Thời gian kết thúc</label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={editFields.end}
                                onChange={(e) => setEditFields({ ...editFields, end: e.target.value })}
                                className="flex-1 p-1.5 px-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-700 min-w-0"
                                placeholder="Ví dụ: 8:30.80"
                              />
                              <div className="flex flex-col gap-0.5 justify-center shrink-0">
                                <button type="button" onClick={() => adjustEditTime('end', 0.25)} className="px-1 py-0.5 text-[8px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-655" title="Tăng 0.25s">+</button>
                                <button type="button" onClick={() => adjustEditTime('end', -0.25)} className="px-1 py-0.5 text-[8px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-655" title="Giảm 0.25s">-</button>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Phiên âm IPA</label>
                            <input
                              type="text"
                              value={editFields.ipa}
                              onChange={(e) => setEditFields({ ...editFields, ipa: e.target.value })}
                              className="w-full p-1.5 px-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-indigo-600"
                            />
                          </div>

                          {/* Row 2: English Text, Vietnamese Text */}
                          <div className="col-span-12 md:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Text tiếng Anh</label>
                            <textarea
                              value={editFields.text}
                              onChange={(e) => setEditFields({ ...editFields, text: e.target.value })}
                              rows={1.5}
                              className="w-full p-1.5 px-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-slate-800 resize-y min-h-[38px]"
                            />
                          </div>

                          <div className="col-span-12 md:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Dịch tiếng Việt</label>
                            <textarea
                              value={editFields.vietnamese}
                              onChange={(e) => setEditFields({ ...editFields, vietnamese: e.target.value })}
                              rows={1.5}
                              className="w-full p-1.5 px-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-600 resize-y min-h-[38px]"
                            />
                          </div>

                          {/* Row 3: Slang & Idiom, Actions */}
                          <div className="col-span-12 md:col-span-9 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Giải thích Slang & Idiom</label>
                            <textarea
                              value={editFields.slang_and_idiom}
                              onChange={(e) => setEditFields({ ...editFields, slang_and_idiom: e.target.value })}
                              rows={1.5}
                              className="w-full p-1.5 px-2.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-amber-700 font-medium resize-y min-h-[38px]"
                              placeholder="Ví dụ: * 'phrase': giải thích"
                            />
                          </div>

                          <div className="col-span-12 md:col-span-3 flex items-end justify-end gap-2 pb-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingIndex(null)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => saveLiveEdit(idx)}
                              disabled={isSavingEdit}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-100"
                            >
                              {isSavingEdit ? "Lưu..." : <><Check size={12} /> Lưu</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5 relative">
                        {/* Time tag */}
                        <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span>{formatTimeDetailed(sub.start)} - {formatTimeDetailed(sub.end)}</span>
                            {isActive && isLoopingCurrentSub && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-sans text-[8px] font-black uppercase tracking-wider animate-pulse shadow-sm">
                                <span>🔁 LẶP CÂU</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasExpansionAccess && sub.expansion && ((sub.expansion.vocabulary?.length || 0) + (sub.expansion.structures?.length || 0) > 0) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateExpansionPopup(idx, 0);
                                }}
                                className="text-[9px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5"
                                title="Xem từ vựng & cấu trúc mở rộng của câu này"
                              >
                                <span>📚</span>
                                <span>{(sub.expansion.vocabulary?.length || 0) + (sub.expansion.structures?.length || 0)}</span>
                              </button>
                            )}
                            {isAdminMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(idx, sub);
                                }}
                                className="text-slate-400 hover:text-indigo-650 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100"
                                title="Sửa nhanh phụ đề dòng này"
                              >
                                <Edit size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p 
                          style={{ fontSize: `${fontSize}px` }}
                          className={`font-bold leading-snug ${isActive ? "text-indigo-600 font-black" : "text-slate-800"}`}
                        >
                          {isActive && isAutoStudyMode && autoStudyPhase !== "idle"
                            ? renderHighlightedSubtitle(
                                sub.text,
                                autoStudyItems,
                                currentActiveAutoStudyItemIdx,
                                true,
                                autoStudyPhase === "replaying",
                                true
                              )
                            : sub.text}
                        </p>
                        {sub.ipa && showIpa && (
                          <p 
                            style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                            className="font-mono text-indigo-650/80 font-semibold"
                          >
                            {sub.ipa}
                          </p>
                        )}
                        {sub.vietnamese && !hideVietsub && (
                          <p 
                            style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                            className={`font-medium leading-snug ${isActive ? "text-indigo-600/90 font-semibold" : "text-slate-500"}`}
                          >
                            {sub.vietnamese}
                          </p>
                        )}
                        {sub.slang_and_idiom && showNotes && renderFormattedNote(sub.slang_and_idiom, fontSize)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 p-3 md:p-5 flex flex-col justify-between gap-3 md:gap-4 min-h-0 overflow-y-auto">
              {/* Target Sentence Display Layer & Typing Area */}
              <div className="space-y-3 md:space-y-4 flex-1 flex flex-col justify-center">
                <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 space-y-2 md:space-y-3 relative overflow-hidden">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
                    <span>Câu thứ {currentIndex + 1} / {subtitles.length}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer select-none font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                        <input
                          type="checkbox"
                          checked={showIpa}
                          onChange={(e) => setShowIpa(e.target.checked)}
                          className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3 md:w-3.5 h-3 md:h-3.5"
                        />
                        <span>IPA</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer select-none font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-2.5 md:pl-3">
                        <input
                          type="checkbox"
                          checked={showNotes}
                          onChange={(e) => setShowNotes(e.target.checked)}
                          className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3 md:w-3.5 h-3 md:h-3.5"
                        />
                        <span>slang/idiom</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer select-none font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-2.5 md:pl-3" title="Tích chọn để ẩn phụ đề Tiếng Việt">
                        <input
                          type="checkbox"
                          checked={hideVietsub}
                          onChange={(e) => setHideVietsub(e.target.checked)}
                          className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer w-3 md:w-3.5 h-3 md:h-3.5"
                        />
                        <span>Vietsub</span>
                      </label>
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-2.5 md:pl-3 normal-case">
                        <button
                          type="button"
                          onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-[9px] md:text-[10px] flex items-center justify-center transition-all active:scale-95"
                          title="Giảm cỡ chữ"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-[9px] md:text-[10px] flex items-center justify-center transition-all active:scale-95"
                          title="Tăng cỡ chữ"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hints (IPA & Vietnamese) */}
                  {subtitles[currentIndex]?.ipa && showIpa && (
                    <p 
                      style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                      className="font-mono text-indigo-650 font-semibold text-[11px] md:text-xs"
                    >
                      {subtitles[currentIndex]?.ipa}
                    </p>
                  )}
                  {subtitles[currentIndex]?.vietnamese && !hideVietsub && (
                    <p 
                      style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}
                      className="text-slate-605 leading-relaxed font-semibold italic text-[11px] md:text-xs"
                    >
                      {subtitles[currentIndex]?.vietnamese}
                    </p>
                  )}
                  {subtitles[currentIndex]?.slang_and_idiom && showNotes && renderFormattedNote(subtitles[currentIndex]?.slang_and_idiom, fontSize)}
                </div>

                {/* Dictation Match View */}
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchStartCapture={handleDoubleTap}
                  className="relative w-full min-h-[80px] md:min-h-[100px] bg-slate-50 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-200 flex items-start"
                >
                  {/* Visual Matching Layer */}
                  <div 
                    style={{ fontSize: `${(fontSize + 1) * (isMobile ? 0.85 : 1)}px`, width: "calc(100% - 40px)" }}
                    className="absolute inset-3 md:inset-5 z-20 pointer-events-none break-words whitespace-pre-wrap select-text text-slate-300 font-mono font-bold leading-relaxed tracking-[0.02em] m-0 p-0 border-0"
                  >
                    {targetText.split("").map((char, i) => {
                      const typed = dictationInput[i];
                      const isAlphaNumeric = /[a-zA-Z0-9]/.test(char);
                      if (!isAlphaNumeric) return <span key={i} className="text-slate-400">{char}</span>;
                      if (!typed) return <span key={i} className="text-slate-350 mx-[1.5px]">_</span>;
                      const isCorrect = typed.toLowerCase() === char.toLowerCase();
                      return (
                        <span
                          key={i}
                          className={`${isCorrect ? "text-emerald-600" : "text-red-500 bg-red-105"} transition-colors`}
                        >
                          {typed}
                        </span>
                      );
                    })}
                  </div>

                  {/* Secret textarea to capture keyboard focus */}
                  <textarea
                    ref={dictationTextareaRef}
                    value={dictationInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= targetText.length) setDictationInput(val);
                    }}
                    style={{ WebkitTextFillColor: "transparent", color: "transparent", caretColor: "#3b82f6", fontSize: `${(fontSize + 1) * (isMobile ? 0.85 : 1)}px` }}
                    className="w-full h-full bg-transparent outline-none resize-none absolute inset-3 md:inset-5 z-10 m-0 p-0 border-0 font-mono font-bold leading-relaxed tracking-[0.02em] pointer-events-auto overflow-hidden"
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    placeholder={isCompleted ? "" : "Hãy nhấn vào đây và gõ..."}
                  />
                  
                  {isCompleted && (
                    <div className="absolute right-3 bottom-3 md:right-4 md:bottom-4 z-30 text-emerald-600 flex items-center gap-1 md:gap-1.5 font-bold text-[10px] md:text-xs bg-emerald-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-emerald-200 shadow-sm animate-bounce">
                      <CheckCircle className="w-3.5 h-3.5" /> Chính xác!
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-2 md:gap-3 pt-3 md:pt-4 border-t shrink-0">
                <button
                  onClick={() => playSubtitleRow(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="flex-1 py-2 px-3 md:py-3 md:px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl md:rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs"
                >
                  <ChevronLeft size={14} /> <span className="hidden xs:inline">Quay Lại (Alt+v)</span><span className="xs:hidden">Quay Lại</span>
                </button>
                <button
                  onClick={() => playSubtitleRow(currentIndex + 1)}
                  disabled={currentIndex === subtitles.length - 1}
                  className="flex-1 py-2 px-3 md:py-3 md:px-4 bg-indigo-600 hover:bg-indigo-755 text-white font-bold rounded-xl md:rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs shadow-md shadow-indigo-100"
                >
                  <span className="hidden xs:inline">Tiếp Theo (Enter)</span><span className="xs:hidden">Tiếp Theo</span> <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
