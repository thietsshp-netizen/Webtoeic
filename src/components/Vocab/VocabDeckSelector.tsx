"use client";

import React, { useState, useEffect } from "react";
import { Plus, Folder, FolderPlus, Trash2, Loader2, Check, X, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "@/components/UI/Toast";

interface Deck {
  id: string;
  name: string;
  count: number;
}

interface VocabDeckSelectorProps {
  word: string;
  currentDeckId: string | null | undefined;
  onSelectDeck: (deckId: string | null) => Promise<void>;
  onUnstar: () => Promise<void>;
  onClose: () => void;
  // Optional word details to auto-save if newly starred
  vocabDetails?: {
    definition: string;
    partOfSpeech?: string;
    translation?: string;
    ipa?: string;
    example?: string;
    exampleTranslation?: string;
    synonyms?: string;
    antonyms?: string;
    collocations?: string;
    wordFamily?: string;
  };
}

export default function VocabDeckSelector({
  word,
  currentDeckId,
  onSelectDeck,
  onUnstar,
  onClose,
  vocabDetails
}: VocabDeckSelectorProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);

  const handleRenameDeck = async (deckId: string, oldName: string, newName: string) => {
    if (!newName.trim() || newName.trim() === oldName) {
      setEditingDeckId(null);
      return;
    }
    setActionLoading(deckId);
    try {
      const res = await fetch("/api/vocab-decks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deckId, name: newName.trim() })
      });
      if (res.ok) {
        setEditingDeckId(null);
        await fetchDecks();
        window.dispatchEvent(new Event('vocab-updated'));
        showToast(`Đã đổi tên bộ thẻ thành "${newName.trim()}" thành công!`, "success");
      } else {
        const err = await res.json();
        alert(err.error || "Không thể đổi tên bộ thẻ");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: string, deckName: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa bộ thẻ "${deckName}"? Tất cả từ vựng trong bộ thẻ này cũng sẽ bị xóa khỏi sổ tay từ vựng của bạn!`);
    if (!confirmed) return;

    setActionLoading(deckId);
    try {
      const res = await fetch(`/api/vocab-decks?id=${deckId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchDecks();
        window.dispatchEvent(new Event('vocab-updated'));
        showToast(`Đã xóa bộ thẻ "${deckName}" thành công!`, "success");
      } else {
        const err = await res.json();
        alert(err.error || "Không thể xóa bộ thẻ");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch all user's decks
  const fetchDecks = async () => {
    try {
      const res = await fetch("/api/vocab-decks");
      if (res.ok) {
        const data = await res.json();
        setDecks(data.decks || []);
      }
    } catch (e) {
      console.error("Failed to load decks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Ignore if element is not in the main body (extension overlays, etc.)
      if (!document.body.contains(target)) {
        return;
      }

      // Check if target is related to a drawing or overlay tool
      const isDrawingOrOverlay = (el: HTMLElement | null, depth = 0): boolean => {
        if (!el || depth > 5) return false;
        const tag = el.tagName.toLowerCase();
        if (tag === 'canvas') return true;
        
        const id = el.id || '';
        const className = typeof el.className === 'string' ? el.className : '';
        const testRegex = /draw|paint|brush|pencil|screendraw|overlay|screenshot|capture/i;
        
        if (testRegex.test(id) || testRegex.test(className)) return true;
        
        return isDrawingOrOverlay(el.parentElement, depth + 1);
      };

      if (isDrawingOrOverlay(target)) {
        return;
      }

      if (containerRef.current && !containerRef.current.contains(target)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [onClose]);

  const handleSelectDeck = async (deckId: string | null) => {
    const key = deckId === null ? "uncategorized" : deckId;
    setActionLoading(key);
    try {
      await onSelectDeck(deckId);
      const deckName = deckId === null 
        ? "Bộ thẻ tổng (mặc định)" 
        : decks.find(d => d.id === deckId)?.name || "Bộ thẻ mới";
      showToast(`Đã thêm vào bộ thẻ "${deckName}" thành công!`, "success");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/vocab-decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeckName.trim() })
      });
      if (res.ok) {
        const newDeck = await res.json();
        setNewDeckName("");
        // Refresh list
        await fetchDecks();
        showToast(`Đã tạo bộ thẻ "${newDeck.name}" thành công!`, "success");
        // Automatically select the newly created deck
        await handleSelectDeck(newDeck.id);
      } else {
        const err = await res.json();
        alert(err.error || "Không thể tạo bộ thẻ");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleUnstar = async () => {
    setActionLoading("unstar");
    try {
      await onUnstar();
      showToast("Đã bỏ gắn sao từ vựng thành công!", "success");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 mt-2 w-[230px] xs:w-[260px] sm:w-72 max-w-[calc(100vw-32px)] bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 p-2.5 sm:p-4 z-[9999] text-left"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 border-b border-slate-100 gap-1">
        <div className="min-w-0 flex-1">
          <h4 className="text-[10px] sm:text-[12px] font-black text-slate-800 uppercase tracking-wider leading-tight">Thêm từ này vào sổ tay từ vựng</h4>
          <p className="text-[8.5px] sm:text-[10px] text-slate-400 font-bold leading-tight mt-0.5">Chọn bộ thẻ mặc định hoặc tạo bộ thẻ mới:</p>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 sm:p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Decks List */}
      <div className="max-h-40 sm:max-h-48 overflow-y-auto mb-2 sm:mb-3 space-y-1 pr-0.5 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-4 text-slate-400 text-[10px] sm:text-xs gap-1.5">
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-blue-500" /> Đang tải danh sách...
          </div>
        ) : (
          <>
            {/* General List Option */}
            <button
              onClick={() => handleSelectDeck(null)}
              disabled={actionLoading !== null}
              className={`w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all text-left group ${!currentDeckId
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <Folder className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${!currentDeckId ? "text-blue-500" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="truncate">Bộ thẻ tổng (mặc định)</span>
              </div>
              {actionLoading === "uncategorized" ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-blue-500 shrink-0" />
              ) : !currentDeckId ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
              ) : null}
            </button>

            {/* Custom Decks */}
            {decks.map((deck) => {
              const isActive = currentDeckId === deck.id;
              const isEditing = editingDeckId === deck.id;
              return (
                <div
                  key={deck.id}
                  className={`w-full flex items-center justify-between px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all text-left ${isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDeck(e, deck.id, deck.name)}
                      className="p-0.5 sm:p-1 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                      title="Xóa bộ thẻ này"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <Folder className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={deck.name}
                        autoFocus
                        onBlur={(e) => handleRenameDeck(deck.id, deck.name, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameDeck(deck.id, deck.name, (e.target as HTMLInputElement).value);
                          } else if (e.key === "Escape") {
                            setEditingDeckId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-white border border-blue-400 rounded px-1 text-[10px] sm:text-xs outline-none text-slate-800"
                      />
                    ) : (
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDeck(deck.id);
                          }}
                          className="truncate cursor-pointer hover:underline flex-1"
                          title="Click để chọn bộ thẻ"
                        >
                          {deck.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDeckId(deck.id);
                          }}
                          className="p-0.5 text-slate-300 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                          title="Sửa tên bộ thẻ"
                        >
                          <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    )}
                    <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 sm:py-0.5 rounded-full bg-slate-100 text-slate-400 shrink-0">
                      {deck.count}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1.5" onClick={(e) => e.stopPropagation()}>
                    {actionLoading === deck.id ? (
                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-blue-500" />
                    ) : isActive ? (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Create New Deck Form */}
      <form onSubmit={handleCreateDeck} className="flex gap-1 sm:gap-1.5 mb-2 sm:mb-3">
        <input
          type="text"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          placeholder="Tạo bộ thẻ mới..."
          disabled={creating}
          className="flex-1 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-100 focus:border-blue-400 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs outline-none transition-all placeholder:text-slate-400 text-slate-700"
        />
        <button
          type="submit"
          disabled={creating || !newDeckName.trim()}
          className="p-1.5 sm:p-2 bg-slate-900 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl transition-all flex items-center justify-center shrink-0"
          title="Tạo bộ thẻ"
        >
          {creating ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      </form>

      {/* Unstar / Delete Button */}
      <button
        onClick={handleUnstar}
        disabled={actionLoading !== null}
        className="w-full flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 hover:bg-rose-50 text-rose-500 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold border border-rose-100 hover:border-rose-200 transition-all shadow-xs"
      >
        {actionLoading === "unstar" ? (
          <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
        ) : (
          <>
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Bỏ gắn sao từ này</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
