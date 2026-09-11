/* src/components/Admin/CropAreaSelectorOverlay/index.tsx */
"use client";

import React, { useState, useRef } from "react";
import { Check, X, MousePointerClick } from "lucide-react";
import styles from "./styles.module.css";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropAreaSelectorOverlayProps {
  isActive: boolean;
  onConfirm: (rect: CropRect) => void;
  onCancel: () => void;
}

export const CropAreaSelectorOverlay: React.FC<CropAreaSelectorOverlayProps> = ({
  isActive,
  onConfirm,
  onCancel,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [rect, setRect] = useState<CropRect | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!isActive) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Nếu bấm vào toolbar xác nhận
    if ((e.target as HTMLElement).closest(`.${styles.boxToolbar}`)) return;

    setIsDrawing(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setRect({
      x: e.clientX,
      y: e.clientY,
      width: 0,
      height: 0,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const startX = startPosRef.current.x;
    const startY = startPosRef.current.y;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    setRect({ x, y, width, height });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Nếu vẽ quá nhỏ (click nhầm), reset
    if (rect && (rect.width < 30 || rect.height < 30)) {
      setRect(null);
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rect && rect.width >= 30 && rect.height >= 30) {
      onConfirm(rect);
    }
  };

  return (
    <div
      className={styles.overlayContainer}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Banner hướng dẫn */}
      <div className={styles.hintBanner}>
        <MousePointerClick size={16} className="text-blue-400" />
        <span>Kéo chuột để vẽ khung vùng bạn muốn quay</span>
      </div>

      {/* Khung chữ nhật đang vẽ / đã vẽ */}
      {rect && rect.width > 5 && rect.height > 5 && (
        <div
          className={styles.selectionBox}
          style={{
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
        >
          {!isDrawing && rect.width >= 30 && rect.height >= 30 && (
            <div className={styles.boxToolbar}>
              <span className={styles.dimensionBadge}>
                {Math.round(rect.width)} × {Math.round(rect.height)} px
              </span>
              <button onClick={handleConfirm} className={styles.confirmBtn} title="Xác nhận vùng quay này">
                <Check size={14} />
                <span>Xác nhận</span>
              </button>
              <button onClick={onCancel} className={styles.cancelBtn} title="Hủy bỏ">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
