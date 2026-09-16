'use client';

import React, { useState, useEffect } from 'react';
import { Video, ImageIcon } from 'lucide-react';

interface VocabCardImageProps {
  vocab: any;
  onOpenYouGlish?: (vocab: any) => void;
  isBack?: boolean;
  onImageResolved?: (imageUrl: string) => void;
}

const clientCardImageCache = new Map<string, string | null>();

function getInitialVocabImage(vocab: any): string | null {
  if (!vocab) return null;
  const wordLower = (vocab.word || '').toLowerCase().trim();
  const defLower = (vocab.definition || vocab.translation || '').toLowerCase().trim();
  const exLower = (vocab.example || '').toLowerCase().trim();

  // Explicit check for résumé / CV vocabulary course image in Supabase storage
  const isResumeCv = wordLower === 'résumé' || wordLower === 'resumé' || 
    (wordLower === 'resume' && (defLower.includes('sơ yếu lý lịch') || defLower.includes('cv') || exLower.includes('cover letter') || exLower.includes('cv')));

  if (isResumeCv) {
    return 'https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/Vocab_course_pics/resume_cv.webp';
  }

  const rawImg = vocab.image;
  if (rawImg) {
    if (rawImg.startsWith('http://') || rawImg.startsWith('https://') || rawImg.startsWith('/') || rawImg.startsWith('data:')) {
      return rawImg;
    }
    return `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/Vocab_course_pics/${rawImg}`;
  }

  return null;
}

export default function VocabCardImage({
  vocab,
  onOpenYouGlish,
  isBack = false,
  onImageResolved,
}: VocabCardImageProps) {
  const cacheKey = `${vocab.word?.toLowerCase().trim()}:::${(vocab.example || vocab.definition || '').toLowerCase().trim()}`;
  
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    const resolved = getInitialVocabImage(vocab);
    if (resolved) return resolved;
    if (clientCardImageCache.has(cacheKey)) return clientCardImageCache.get(cacheKey) || null;
    return null;
  });
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const resolved = getInitialVocabImage(vocab);
    if (resolved) {
      setImageUrl(resolved);
      clientCardImageCache.set(cacheKey, resolved);
      return;
    }

    if (clientCardImageCache.has(cacheKey)) {
      const cached = clientCardImageCache.get(cacheKey) || null;
      setImageUrl(cached);
      if (cached && onImageResolved) {
        onImageResolved(cached);
      }
      return;
    }

    let active = true;

    const fetchImage = async () => {
      try {
        const queryParams = new URLSearchParams({
          word: vocab.word?.trim() || '',
          ...(vocab.example ? { example: vocab.example.trim() } : {}),
          ...(vocab.definition ? { definition: vocab.definition.trim() } : {}),
        });

        const res = await fetch(`/api/vocab-image?${queryParams.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        const found = data?.image || data?.imageUrl || null;

        clientCardImageCache.set(cacheKey, found);

        if (active) {
          setImageUrl(found);
          if (found) {
            if (onImageResolved) {
              onImageResolved(found);
            }
            // Silently persist to database if this is a saved vocabulary record
            if (vocab.id || vocab.word) {
              fetch('/api/user-vocabulary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  word: vocab.word,
                  definition: vocab.definition || vocab.translation,
                  image: found,
                  action: 'save'
                })
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        clientCardImageCache.set(cacheKey, null);
      }
    };

    fetchImage();

    return () => {
      active = false;
    };
  }, [vocab.word, vocab.example, vocab.definition, vocab.image, cacheKey, onImageResolved, vocab.id, vocab.translation]);

  if (imageUrl) {
    return (
      <div className="mb-2 flex flex-col items-center flex-shrink-0 w-full">
        <div className={`max-w-full w-fit rounded-2xl overflow-hidden p-1 flex items-center justify-center mx-auto ${
          isBack 
            ? 'border border-indigo-100/80 bg-white/80 h-28 sm:h-36 shadow-sm' 
            : 'border border-slate-100 bg-slate-50/70 h-28 sm:h-36'
        }`}>
          <img
            src={imageUrl}
            alt={vocab.word}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              clientCardImageCache.set(cacheKey, null);
              setImageUrl(null);
            }}
            className={`w-auto h-full max-w-full object-contain rounded-xl transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenYouGlish?.(vocab);
          }}
          className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all border border-red-100/80 shadow-sm active:scale-95 group/btn ${
            isBack 
              ? 'bg-white/90 hover:bg-white text-red-600' 
              : 'bg-red-50 hover:bg-red-100/90 text-red-600'
          }`}
          title="Xem video người bản xứ phát âm từ này trong thực tế"
        >
          <Video size={12} className="text-red-500 group-hover/btn:scale-110 transition-transform" />
          <span>Video thực tế</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2 flex justify-center flex-shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenYouGlish?.(vocab);
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all border border-red-100/80 shadow-sm active:scale-95 ${
          isBack
            ? 'bg-white/90 hover:bg-white text-red-600'
            : 'bg-red-50 hover:bg-red-100 text-red-600'
        }`}
        title="Xem video người bản xứ phát âm từ này trong thực tế"
      >
        <Video size={12} className="text-red-500" />
        <span>Video thực tế</span>
      </button>
    </div>
  );
}
