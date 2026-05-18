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
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 500, height: 450 });
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);


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
    const handleMouseDown = (e: MouseEvent) => {
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Calculate distance moved
      const upX = e.clientX;
      const upY = e.clientY;
      const startPos = mouseDownPos.current;
      const dist = startPos ? Math.sqrt(Math.pow(upX - startPos.x, 2) + Math.pow(upY - startPos.y, 2)) : 0;
      
      // CRITICAL: If it's a simple click (not a drag) AND not a double click (e.detail >= 2), 
      // we ignore the selection to prevent accidental lookups on blank areas.
      const isSimpleClick = dist < 5 && e.detail < 2;

      // CRITICAL: If clicking an input, textarea, or contentEditable, DO NOTHING.
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (target.closest('.dictionary-popup-container')) return;

      // Small delay to let the browser finish the selection process
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;
        
        // If it was a simple click and not a double click, clear the selection and return
        if (isSimpleClick) {
          selection.removeAllRanges();
          return;
        }

        const range = selection.getRangeAt(0);
        const rects = range.getClientRects();
        const upX = e.clientX;
        const upY = e.clientY;
        
        // CHECK: Is the mouse cursor actually over the selected text?
        // We add a tiny buffer (3px) to make it feel more natural.
        let isPointInSelection = false;
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          if (upX >= r.left - 3 && upX <= r.right + 3 &&
              upY >= r.top - 3 && upY <= r.bottom + 3) {
            isPointInSelection = true;
            break;
          }
        }

        if (!isPointInSelection) return;

        const text = selection.toString().trim();
        // Trigger lookup if text exists and is not just a single character (unless it's a known word)
        if (text && text.length >= 1) {
          const rect = range.getBoundingClientRect();
          openDictionary(text, { 
            x: rect.left + rect.width / 2, 
            y: rect.top,
            top: rect.top,
            bottom: rect.bottom
          });
        }
      }, 50);
    };

    const handleDoubleClick = (e: MouseEvent) => {
      // Double click automatically selects a word in browsers.
      // The handleMouseUp will catch the selection and trigger the lookup.
      // We keep this handler only to prevent default if needed, or we can leave it empty.
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // If we are clicking inside an input/textarea, do NOT interfere at all.
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const isInsidePopup = target.closest('.dictionary-popup-container');
      
      // Rule: If click is outside popup AND a dictionary is currently open, close it.
      // If no dictionary is open, do nothing.
      if (!isInsidePopup && selectedWord) {
        const selection = window.getSelection();
        // Only close if there's no active selection (to avoid closing while dragging)
        if (!selection || selection.isCollapsed) {
          closeDictionary();
        }
      }
    };

    // Custom event for internal searching within the popup
    const handleSearch = (e: any) => {
      if (e.detail) {
        openDictionary(e.detail);
      }
    };

    const handleClose = () => {
      closeDictionary();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('click', handleClick);
    window.addEventListener('dictionary-search', handleSearch);
    window.addEventListener('dictionary-close', handleClose);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('dictionary-search', handleSearch);
      window.removeEventListener('dictionary-close', handleClose);
    };
  }, [openDictionary]);

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
