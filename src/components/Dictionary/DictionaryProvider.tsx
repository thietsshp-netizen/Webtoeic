'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import DictionaryPopup from './DictionaryPopup';

interface DictionaryContextType {
  openDictionary: (word: string, pos?: { x: number; y: number; top: number; bottom: number }) => void;
  closeDictionary: () => void;
}

const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined);

export function DictionaryProvider({ children }: { children: React.ReactNode }) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number; top: number; bottom: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 580, height: 460 });
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const openDictionary = useCallback((word: string, pos?: { x: number; y: number; top: number; bottom: number }) => {
    // Basic cleaning to handle selection
    const cleanWord = word.trim().replace(/[.,!?;:()]/g, '');
    if (cleanWord && cleanWord.length > 1) {
      setSelectedWord(cleanWord);
      if (pos) setPosition(pos);
    }
  }, []);

  const closeDictionary = useCallback(() => {
    setSelectedWord(null);
    setPosition(null);
    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }
  }, []);

  useEffect(() => {
    // Trích xuất từ tại vị trí tọa độ (X, Y)
    const extractWordAtPoint = (x: number, y: number) => {
      let range: Range | null = null;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y);
      } else if ((document as any).caretPositionFromPoint) {
        const pos = (document as any).caretPositionFromPoint(x, y);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }

      if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
        return null;
      }

      const textNode = range.startContainer;
      const fullText = textNode.nodeValue || '';
      const offset = range.startOffset;
      if (!fullText.trim()) return null;

      let start = offset;
      let end = offset;
      while (start > 0 && /[a-zA-Z0-9'-]/.test(fullText[start - 1])) start--;
      while (end < fullText.length && /[a-zA-Z0-9'-]/.test(fullText[end])) end++;

      const clickedWord = fullText.substring(start, end).trim().replace(/^[^\w]+|[^\w]+$/g, '');
      if (clickedWord && clickedWord.length >= 2 && /[a-zA-Z]/.test(clickedWord)) {
        try {
          const wordRange = document.createRange();
          wordRange.setStart(textNode, start);
          wordRange.setEnd(textNode, end);
          const rect = wordRange.getBoundingClientRect();
          return {
            word: clickedWord,
            pos: {
              x: rect.left + rect.width / 2,
              y: rect.top,
              top: rect.top,
              bottom: rect.bottom,
            }
          };
        } catch {
          return { word: clickedWord };
        }
      }
      return null;
    };

    // Kiểm tra vùng chọn bôi đen hoặc Double Tap trên điện thoại
    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.dictionary-popup-container')
      ) {
        return;
      }

      const now = Date.now();
      const touch = e.changedTouches[0];
      const lastTap = lastTapRef.current;
      const isDoubleTap = !!(lastTap && (now - lastTap.time < 450) && Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 40);

      if (touch) {
        lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
      }

      // Đợi 50ms để trình duyệt mobile hoàn tất việc tự động bôi đen từ khi Double Tap
      setTimeout(() => {
        // 1. Kiểm tra nếu có từ/cụm từ được bôi đen (nhiều thiết bị tự bôi đen từ khi double tap)
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          const text = selection.toString().trim().replace(/[.,!?;:()]/g, '');
          if (text && text.length >= 2 && /[a-zA-Z]/.test(text)) {
            try {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                openDictionary(text, {
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                  top: rect.top,
                  bottom: rect.bottom,
                });
              } else {
                openDictionary(text);
              }
            } catch {
              openDictionary(text);
            }
            return;
          }
        }

        // 2. Nếu là thao tác Double Tap nhưng trình duyệt chưa tự bôi đen: trích xuất từ tại tọa độ điểm chạm
        if (isDoubleTap && touch) {
          const res = extractWordAtPoint(touch.clientX, touch.clientY);
          if (res) {
            openDictionary(res.word, res.pos);
            lastTapRef.current = null;
          }
        }
      }, 50);
    };

    // Xử lý trên PC: CHỈ TRA TỪ KHI DOUBLE CLICK (NHẤP ĐÚP CHUỘT). KHÔNG TRA KHI KÉO QUÉT BÔI ĐEN.
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.dictionary-popup-container')
      ) {
        return;
      }

      // 1. Kiểm tra từ được trình duyệt bôi đen khi double-click
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim().replace(/[.,!?;:()]/g, '');
        if (text && text.length >= 2 && /[a-zA-Z]/.test(text)) {
          try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              openDictionary(text, {
                x: rect.left + rect.width / 2,
                y: rect.top,
                top: rect.top,
                bottom: rect.bottom,
              });
              return;
            }
          } catch {}
          openDictionary(text);
          return;
        }
      }

      // 2. Fallback trích xuất từ tại tọa độ double click nếu trình duyệt chưa kịp chọn
      const res = extractWordAtPoint(e.clientX, e.clientY);
      if (res) {
        openDictionary(res.word, res.pos);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const isInsidePopup = target.closest('.dictionary-popup-container');
      if (!isInsidePopup && selectedWord) {
        closeDictionary();
      }
    };

    // Custom event cho việc tra từ nội bộ trong popup
    const handleSearch = (e: any) => {
      if (e.detail) {
        openDictionary(e.detail);
      }
    };

    const handleClose = () => {
      closeDictionary();
    };

    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('dblclick', handleDblClick);
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('dictionary-search', handleSearch);
    window.addEventListener('dictionary-close', handleClose);

    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('dblclick', handleDblClick);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('dictionary-search', handleSearch);
      window.removeEventListener('dictionary-close', handleClose);
    };
  }, [openDictionary, closeDictionary, selectedWord]);

  return (
    <DictionaryContext.Provider value={{ openDictionary, closeDictionary }}>
      {children}
      <AnimatePresence>
        {selectedWord && (
          <DictionaryPopup 
            word={selectedWord} 
            onClose={closeDictionary} 
            initialPosition={position || undefined}
            dimensions={dimensions}
            onResize={(d) => setDimensions(d)}
          />
        )}
      </AnimatePresence>
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (context === undefined) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return context;
}
