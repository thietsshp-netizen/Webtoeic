import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean;
  isPrompt?: boolean;
  defaultValue?: string;
}

export default function ConfirmModal({
  isOpen,
  title = "Xác nhận",
  message,
  onConfirm,
  onCancel,
  confirmText = "Đồng ý",
  cancelText = "Hủy",
  isAlert = false,
  isPrompt = false,
  defaultValue = ""
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {message}
          </p>
          
          {isPrompt && (
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-slate-700"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm(inputValue);
                if (e.key === 'Escape') onCancel();
              }}
            />
          )}

          <div className="flex gap-3 w-full">
            {!isAlert && (
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                onConfirm(isPrompt ? inputValue : undefined);
              }}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
