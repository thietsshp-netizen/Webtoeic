'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';

interface MeaningImageProps {
  word: string;
  definition?: string;
  example?: string;
  initialImage?: string | null;
  onImageLoaded?: (imageUrl: string) => void;
  className?: string;
}

// Client-side cache to prevent duplicate network requests across tabs/re-renders
const clientImageCache = new Map<string, string | null>();

export default function MeaningImage({
  word,
  definition = '',
  example = '',
  initialImage = null,
  onImageLoaded,
  className = '',
}: MeaningImageProps) {
  const cacheKey = `${word.toLowerCase().trim()}:::${(example || definition).toLowerCase().trim()}`;
  
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    if (initialImage) return initialImage;
    if (clientImageCache.has(cacheKey)) return clientImageCache.get(cacheKey) || null;
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialImage || clientImageCache.has(cacheKey)) return false;
    return true;
  });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoomPreview, setZoomPreview] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (initialImage) {
      setImageUrl(initialImage);
      setLoading(false);
      clientImageCache.set(cacheKey, initialImage);
      return;
    }

    if (clientImageCache.has(cacheKey)) {
      const cached = clientImageCache.get(cacheKey) || null;
      setImageUrl(cached);
      setLoading(false);
      if (cached && onImageLoaded) {
        onImageLoaded(cached);
      }
      return;
    }

    let active = true;
    setLoading(true);

    const fetchImage = async () => {
      try {
        const queryParams = new URLSearchParams({
          word: word.trim(),
          ...(example ? { example: example.trim() } : {}),
          ...(definition ? { definition: definition.trim() } : {}),
        });

        const res = await fetch(`/api/vocab-image?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Image fetch failed');
        
        const data = await res.json();
        const foundUrl = data?.image || null;

        clientImageCache.set(cacheKey, foundUrl);

        if (active && isMountedRef.current) {
          setImageUrl(foundUrl);
          setLoading(false);
          if (foundUrl && onImageLoaded) {
            onImageLoaded(foundUrl);
          }
        }
      } catch (err) {
        clientImageCache.set(cacheKey, null);
        if (active && isMountedRef.current) {
          setImageUrl(null);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      active = false;
    };
  }, [word, definition, example, initialImage, cacheKey]);

  // If loading, show a neat compact skeleton placeholder
  if (loading) {
    return (
      <div className={`w-28 h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse shrink-0 border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-1 ${className}`}>
        <ImageIcon size={18} className="animate-bounce" />
        <span className="text-[8px] font-medium">Tìm ảnh...</span>
      </div>
    );
  }

  // If no image found or error, do not render anything to avoid layout clutter
  if (!imageUrl) {
    return null;
  }

  return (
    <>
      <div 
        className={`relative group/mimg shrink-0 cursor-pointer ${className}`}
        onClick={() => setZoomPreview(true)}
        title="Nhấn để xem ảnh lớn"
      >
        <div className="w-28 h-20 sm:w-32 sm:h-22 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 shadow-sm relative group-hover/mimg:shadow-md transition-all">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
              <ImageIcon size={16} className="text-slate-300" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={word}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              clientImageCache.set(cacheKey, null);
              setImageUrl(null);
            }}
            className={`w-full h-full object-cover group-hover/mimg:scale-108 transition-all duration-300 ${
              imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />
          {/* Subtle Tag Overlay */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1 pt-2 flex items-center justify-between opacity-0 group-hover/mimg:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-white tracking-wider uppercase px-1">Ảnh minh họa</span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal on Click */}
      {zoomPreview && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setZoomPreview(false);
          }}
        >
          <div 
            className="relative max-w-lg max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">{word}</span>
              <button 
                onClick={() => setZoomPreview(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white px-2 py-0.5 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[70vh]">
              <img
                src={imageUrl}
                alt={word}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
