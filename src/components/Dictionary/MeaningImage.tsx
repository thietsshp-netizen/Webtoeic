'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface MeaningImageProps {
  word: string;
  definition?: string;
  example?: string;
  initialImage?: string | null;
  onImageLoaded?: (imageUrl: string) => void;
  onImageChange?: (imageUrl: string) => void;
  className?: string;
}

// Client-side cache to prevent duplicate network requests across tabs/re-renders
const clientImageCache = new Map<string, string[]>();

export default function MeaningImage({
  word,
  definition = '',
  example = '',
  initialImage = null,
  onImageLoaded,
  onImageChange,
  className = '',
}: MeaningImageProps) {
  const cacheKey = `${word.toLowerCase().trim()}:::${(example || definition).toLowerCase().trim()}`;
  
  const [images, setImages] = useState<string[]>(() => {
    if (initialImage) return [initialImage];
    if (clientImageCache.has(cacheKey)) return clientImageCache.get(cacheKey) || [];
    return [];
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialImage || clientImageCache.has(cacheKey)) return false;
    return true;
  });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoomPreview, setZoomPreview] = useState(false);
  const isMountedRef = useRef(true);

  const activeImageUrl = images[currentIndex] || null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (initialImage) {
      setImages([initialImage]);
      setCurrentIndex(0);
      setLoading(false);
      clientImageCache.set(cacheKey, [initialImage]);
      return;
    }

    if (clientImageCache.has(cacheKey)) {
      const cached = clientImageCache.get(cacheKey) || [];
      setImages(cached);
      setCurrentIndex(0);
      setLoading(false);
      if (cached.length > 0) {
        onImageLoaded?.(cached[0]);
        onImageChange?.(cached[0]);
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
        const foundImages: string[] = Array.isArray(data?.images) && data.images.length > 0 
          ? data.images 
          : (data?.image ? [data.image] : []);

        clientImageCache.set(cacheKey, foundImages);

        if (active && isMountedRef.current) {
          setImages(foundImages);
          setCurrentIndex(0);
          setLoading(false);
          if (foundImages.length > 0) {
            onImageLoaded?.(foundImages[0]);
            onImageChange?.(foundImages[0]);
          }
        }
      } catch (err) {
        clientImageCache.set(cacheKey, []);
        if (active && isMountedRef.current) {
          setImages([]);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      active = false;
    };
  }, [word, definition, example, initialImage, cacheKey]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    const nextIdx = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIdx);
    setImgLoaded(false);
    onImageLoaded?.(images[nextIdx]);
    onImageChange?.(images[nextIdx]);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIdx);
    setImgLoaded(false);
    onImageLoaded?.(images[prevIdx]);
    onImageChange?.(images[prevIdx]);
  };

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
  if (!activeImageUrl) {
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
            src={activeImageUrl}
            alt={word}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              // Remove bad image from list if possible
              const updated = images.filter((_, idx) => idx !== currentIndex);
              setImages(updated);
              setCurrentIndex(0);
            }}
            className={`w-full h-full object-cover group-hover/mimg:scale-105 transition-all duration-300 ${
              imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />

          {/* Navigation Arrows for Multiple Images */}
          {images.length > 1 && (
            <>
              {/* Prev Button */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-md backdrop-blur-xs transition-all opacity-80 group-hover/mimg:opacity-100 hover:scale-110 z-10"
                title="Ảnh trước"
              >
                <ChevronLeft size={13} />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-md backdrop-blur-xs transition-all opacity-80 group-hover/mimg:opacity-100 hover:scale-110 z-10"
                title="Đổi sang ảnh khác"
              >
                <ChevronRight size={13} />
              </button>

              {/* Counter Badge */}
              <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md shadow-xs pointer-events-none z-10">
                {currentIndex + 1}/{images.length}
              </div>
            </>
          )}

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
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">{word}</span>
                {images.length > 1 && (
                  <span className="text-[10px] text-slate-400 font-semibold">({currentIndex + 1}/{images.length})</span>
                )}
              </div>
              <button 
                onClick={() => setZoomPreview(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white px-2 py-0.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="relative p-2 flex items-center justify-center max-h-[70vh] w-full">
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all z-20"
                    title="Ảnh trước"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all z-20"
                    title="Ảnh tiếp"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              <img
                src={activeImageUrl}
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
