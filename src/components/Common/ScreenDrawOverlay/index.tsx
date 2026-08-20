/* src/components/Common/ScreenDrawOverlay/index.tsx */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pencil,
  Highlighter,
  Square,
  Circle as CircleIcon,
  Type,
  Trash2,
  X,
  GripVertical,
  MousePointer,
  Eraser,
  Hand,
  ChevronDown,
  Settings,
  Plus,
  RotateCcw,
  MessageSquare,
  ClipboardList
} from "lucide-react";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import { MarkdownTextarea } from "./MarkdownTextarea";

interface FlashIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const FlashIcon = ({ size, ...props }: FlashIconProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || 18}
    height={size || 18}
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 4V2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2" />
    <path d="M8 4h8v4H8z" />
    <path d="M16 8l-2 5v8a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-8l-2-5" />
    <line x1="6" y1="6" x2="18" y2="6" />
    <line x1="12" y1="12" x2="12" y2="12.01" />
  </svg>
);



export type DrawTool = 'pencil' | 'highlight' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'cursor' | 'hand' | 'callout';
export type DrawColor = string; // Hex color string

export interface ClonedTool {
  id: string;
  baseType: 'pencil' | 'highlight' | 'rectangle' | 'text' | 'callout';
  name: string;
  color: string;
  hotkey: string;
  textSize?: number;
  textStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic';
  textHasBorder?: boolean;
  textBorderWidth?: number;
  textBgColor?: string;
  textBgOpacity?: number;
  fontFamily?: string;
}

export const DEFAULT_HOTKEYS: Record<string, string> = {
  cursor: 'ctrl+m',
  hand: 'escape',
  pencil: 'b',
  highlight: 'h',
  flashlight: 'f',
  eraser: 'e',
  rectangle: 'r',
  circle: 'c',
  text: 't',
  callout: 'd',
  color1: 'q',
  color2: 'a',
  color3: 'z',
  color4: 'w',
  color5: 's',
  color6: 'x',
  ghostmode: 'space',
  clear: 'ctrl+backspace'
};

export const HOTKEY_NAMES: Record<string, string> = {
  cursor: 'Chuột tương tác',
  hand: 'Bàn tay (Di chuyển)',
  pencil: 'Bút chì vẽ',
  highlight: 'Bút highlight',
  flashlight: 'Đèn chiếu spotlight',
  eraser: 'Cục tẩy xóa',
  rectangle: 'Hình chữ nhật',
  circle: 'Hình tròn',
  text: 'Viết chữ nháp',
  callout: 'Ghi chú mũi tên (Callout)',
  color1: 'Ô màu 1',
  color2: 'Ô màu 2',
  color3: 'Ô màu 3',
  color4: 'Ô màu 4',
  color5: 'Ô màu 5',
  color6: 'Ô màu 6',
  ghostmode: 'Ghostmode (Xuyên thấu)',
  clear: 'Xóa sạch màn hình'
};

const DEFAULT_COLOR_SLOTS: DrawColor[] = ['#EF4444', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#5C4033'];
const COLOR_SLOT_KEYS = ['Q', 'A', 'Z', 'W', 'S', 'X'];
const COLOR_SLOT_NAMES = ['Đỏ', 'Xanh dương', 'Tím', 'Xanh lá', 'Cam', 'Nâu đen'];

// Bảng màu preset Apple-style (48 màu, 8 cột × 6 hàng)
const PALETTE_COLORS: string[] = [
  // Đỏ & Hồng
  '#FF3B30', '#FF6B6B', '#FF2D55', '#FF375F', '#D70015', '#C41230', '#FFCDD2', '#FF8A80',
  // Cam & Đào
  '#FF9500', '#FF9F0A', '#FF6000', '#FF8C42', '#FFA07A', '#FFAB40', '#FF7043', '#BF360C',
  // Vàng & Amber
  '#FFCC00', '#FFD60A', '#FFB300', '#FFCA28', '#F9A825', '#FFF176', '#FFF9C4', '#FF8F00',
  // Xanh lá & Teal
  '#34C759', '#30D158', '#00C853', '#43A047', '#2E7D32', '#00BFA5', '#26C6DA', '#1B5E20',
  // Xanh dương & Indigo
  '#007AFF', '#0A84FF', '#5AC8FA', '#1E88E5', '#1565C0', '#5856D6', '#3949AB', '#0D47A1',
  // Tím & Nâu & Trắng/Đen
  '#AF52DE', '#BF5AF2', '#8E24AA', '#A2845E', '#6D4C41', '#5C4033', '#000000', '#FFFFFF',
];

export interface DrawElement {
  id: string;
  type: 'pencil' | 'highlight' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'ellipse' | 'callout';
  points: { x: number; y: number; pressure?: number }[];
  color: DrawColor;
  size: number;
  penStyle?: 'ballpoint' | 'fountain' | 'brush';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  rx?: number;
  ry?: number;
  text?: string;
  textStyle?: string;
  textHasBorder?: boolean;
  textBorderWidth?: number;
  textBgColor?: string;
  textBgOpacity?: number;
  anchorSelector?: string;
  containerSelector?: string;
  textHash?: string;
  textContent?: string;
  arrowX?: number;
  arrowY?: number;
  absoluteX?: number;
  absoluteY?: number;
  absoluteArrowX?: number;
  absoluteArrowY?: number;
  fontFamily?: string;
  textMaxWidth?: number;
}

interface ScreenDrawOverlayProps {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

export const getElementFont = (size: number, textStyle?: string, fontFamily?: string): string => {
  let stylePart = '500';
  if (textStyle === 'bold') stylePart = 'bold';
  else if (textStyle === 'italic') stylePart = 'italic 500';
  else if (textStyle === 'bold-italic') stylePart = 'bold italic';
  const font = fontFamily || 'sans-serif';
  return `${stylePart} ${size}px ${font}`;
};

export interface TextToken {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color?: string;
}

export const stripMarkdownTags = (line: string): string => {
  return line
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/<\/?u>/gi, "")
    .replace(/~~/g, "")
    .replace(/<font color=["'][^"']+["']>/gi, "")
    .replace(/<\/font>/gi, "");
};

export const parseMarkdownLine = (line: string): TextToken[] => {
  const tokens: TextToken[] = [];
  let currentText = "";
  
  let bold = false;
  let italic = false;
  let underline = false;
  let strikethrough = false;
  const colorStack: string[] = [];
  
  let i = 0;
  while (i < line.length) {
    if (line.startsWith("**", i)) {
      if (currentText) {
        tokens.push({ text: currentText, bold, italic, underline, strikethrough, color: colorStack[colorStack.length - 1] });
        currentText = "";
      }
      bold = !bold;
      i += 2;
      continue;
    }
    
    if (line.startsWith("~~", i)) {
      if (currentText) {
        tokens.push({ text: currentText, bold, italic, underline, strikethrough, color: colorStack[colorStack.length - 1] });
        currentText = "";
      }
      strikethrough = !strikethrough;
      i += 2;
      continue;
    }
    
    const remaining = line.slice(i);
    const fontStartMatch = remaining.match(/^<font color=["']([^"']+)["']>/i);
    if (!fontStartMatch && i === 0 && remaining.startsWith('<font')) {
      console.warn('[parseMarkdownLine] <font> không khớp regex, dạng thực tế:', JSON.stringify(remaining.slice(0, 60)));
    }
    if (fontStartMatch) {
      if (currentText) {
        tokens.push({ text: currentText, bold, italic, underline, strikethrough, color: colorStack[colorStack.length - 1] });
        currentText = "";
      }
      const matchedColor = fontStartMatch[1];
      colorStack.push(matchedColor);
      i += fontStartMatch[0].length;
      continue;
    }
    if (remaining.toLowerCase().startsWith("</font>")) {
      if (currentText) {
        tokens.push({ text: currentText, bold, italic, underline, strikethrough, color: colorStack[colorStack.length - 1] });
        currentText = "";
      }
      colorStack.pop();
      i += 7;
      continue;
    }
    
    if (remaining.toLowerCase().startsWith("<u>")) {
      if (currentText) {
        tokens.push({ text: currentText, bold, italic, underline, strikethrough, color: colorStack[colorStack.length - 1] });
        currentText = "";
      }
      underline = true;
      i += 3;
      continue;
    }
    if (remaining.toLowerCase().startsWith("</u>")) {
      if (currentText) {
        tokens.push({ text: currentText, bold, italic, underline, strikethrough, color: colorStack[colorStack.length - 1] });
        currentText = "";
      }
      underline = false;
      i += 4;
      continue;
    }
    
    if (line.startsWith("*", i)) {
      if (currentText) {
        tokens.push({ text: currentText, bold, italic, underline, strikethrough, color: colorStack[colorStack.length - 1] });
        currentText = "";
      }
      italic = !italic;
      i += 1;
      continue;
    }
    
    currentText += line[i];
    i++;
  }
  
  if (currentText) {
    tokens.push({ text: currentText, bold, italic, underline, strikethrough, color: colorStack[colorStack.length - 1] });
  }
  
  return tokens;
};

interface PointObj {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
}

export const simplifyPath = (points: PointObj[], sqTolerance = 0.36): PointObj[] => {
  if (points.length <= 2) return points;

  const sqObliqueDistance = (p: PointObj, p1: PointObj, p2: PointObj) => {
    let x = p1.x;
    let y = p1.y;
    let dx = p2.x - x;
    let dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2.x;
        y = p2.y;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
  };

  const simplifyDPStep = (
    pts: PointObj[],
    first: number,
    last: number,
    sqTol: number,
    simplified: PointObj[]
  ) => {
    let maxSqDist = sqTol;
    let index = -1;

    for (let i = first + 1; i < last; i++) {
      const sqDist = sqObliqueDistance(pts[i], pts[first], pts[last]);

      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (index !== -1) {
      if (index - first > 1) simplifyDPStep(pts, first, index, sqTol, simplified);
      simplified.push(pts[index]);
      if (last - index > 1) simplifyDPStep(pts, index, last, sqTol, simplified);
    }
  };

  const simplified: PointObj[] = [points[0]];
  simplifyDPStep(points, 0, points.length - 1, sqTolerance, simplified);
  simplified.push(points[points.length - 1]);

  return simplified;
};

export const getCalloutConnectionPoint = (
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number,
  arrowX: number,
  arrowY: number
): { x: number; y: number } => {
  const xMin = rectX;
  const xMax = rectX + rectW;
  const yMin = rectY;
  const yMax = rectY + rectH;

  const hZone = arrowX < xMin ? -1 : arrowX > xMax ? 1 : 0;
  const vZone = arrowY < yMin ? -1 : arrowY > yMax ? 1 : 0;

  // 1. Box is top-right of arrow (arrow is bottom-left of box)
  if (hZone === -1 && vZone === 1) {
    return { x: xMin, y: yMax };
  }
  // 2. Box is bottom-left of arrow (arrow is top-right of box)
  if (hZone === 1 && vZone === -1) {
    return { x: xMax, y: yMin };
  }
  // 3. Box is top-left of arrow (arrow is bottom-right of box)
  if (hZone === 1 && vZone === 1) {
    return { x: xMax, y: yMax };
  }
  // 4. Box is bottom-right of arrow (arrow is top-left of box)
  if (hZone === -1 && vZone === -1) {
    return { x: xMin, y: yMin };
  }
  // 5. Box is straight above arrow (arrow is below box)
  if (hZone === 0 && vZone === 1) {
    return { x: rectX + rectW / 2, y: yMax };
  }
  // 6. Box is straight below arrow (arrow is above box)
  if (hZone === 0 && vZone === -1) {
    return { x: rectX + rectW / 2, y: yMin };
  }
  // 7. Box is straight right of arrow (arrow is left of box)
  if (hZone === -1 && vZone === 0) {
    return { x: xMin, y: rectY + rectH / 2 };
  }
  // 8. Box is straight left of arrow (arrow is right of box)
  if (hZone === 1 && vZone === 0) {
    return { x: xMax, y: rectY + rectH / 2 };
  }

  // Fallback
  const candidates = [
    { x: xMin, y: yMin },
    { x: xMax, y: yMin },
    { x: xMin, y: yMax },
    { x: xMax, y: yMax },
    { x: rectX + rectW / 2, y: yMin },
    { x: rectX + rectW / 2, y: yMax },
    { x: xMin, y: rectY + rectH / 2 },
    { x: xMax, y: rectY + rectH / 2 }
  ];

  let bestPoint = candidates[0];
  let minDistanceSq = Infinity;
  for (const p of candidates) {
    const dSq = (p.x - arrowX) ** 2 + (p.y - arrowY) ** 2;
    if (dSq < minDistanceSq) {
      minDistanceSq = dSq;
      bestPoint = p;
    }
  }
  return bestPoint;
};

export const checkIntersection = (ex: number, ey: number, el: DrawElement, eraserRadius: number): boolean => {
  const buffer = eraserRadius + 6; // Extra buffer to make it easy to hit

  if (el.type === 'pencil' || el.type === 'highlight') {
    return el.points.some(pt => {
      const dx = pt.x - ex;
      const dy = pt.y - ey;
      return (dx * dx + dy * dy) <= buffer * buffer;
    });
  }

  if (el.type === 'rectangle') {
    if (el.x === undefined || el.y === undefined || el.width === undefined || el.height === undefined) return false;
    const xMin = Math.min(el.x, el.x + el.width);
    const xMax = Math.max(el.x, el.x + el.width);
    const yMin = Math.min(el.y, el.y + el.height);
    const yMax = Math.max(el.y, el.y + el.height);
    return ex >= xMin - buffer && ex <= xMax + buffer && ey >= yMin - buffer && ey <= yMax + buffer;
  }

  if (el.type === 'circle') {
    if (el.x === undefined || el.y === undefined || el.radius === undefined) return false;
    const dx = el.x - ex;
    const dy = el.y - ey;
    const distSq = dx * dx + dy * dy;
    return distSq <= (el.radius + buffer) * (el.radius + buffer);
  }

  if (el.type === 'ellipse') {
    if (el.x === undefined || el.y === undefined || el.rx === undefined || el.ry === undefined) return false;
    const xMin = el.x - el.rx;
    const xMax = el.x + el.rx;
    const yMin = el.y - el.ry;
    const yMax = el.y + el.ry;
    return ex >= xMin - buffer && ex <= xMax + buffer && ey >= yMin - buffer && ey <= yMax + buffer;
  }

  if (el.type === 'text' || el.type === 'callout') {
    if (el.x === undefined || el.y === undefined || !el.text) return false;
    const lines = wrapTextLines(el.text, getMaxWrapWidth(), el.size, el.textStyle, el.fontFamily);
    const linesCount = lines.length;
    let maxLineLen = 0;
    lines.forEach(l => {
      const clean = stripMarkdownTags(l);
      if (clean.length > maxLineLen) maxLineLen = clean.length;
    });
    const estWidth = maxLineLen * el.size * 0.65 + 24;
    const estHeight = el.size * linesCount * 1.3 + 24;

    const xMin = el.x - buffer;
    const xMax = el.x + estWidth + buffer;
    const yMin = el.y - buffer;
    const yMax = el.y + estHeight + buffer;

    return ex >= xMin && ex <= xMax && ey >= yMin && ey <= yMax;
  }

  return false;
};

export const erasePixelFromElements = (
  ex: number,
  ey: number,
  eraserRadius: number,
  elements: DrawElement[],
  eraserTargets: { pencil: boolean; highlight: boolean; shapes: boolean; text: boolean }
): DrawElement[] => {
  const nextElements: DrawElement[] = [];

  const pencilErasable = eraserTargets?.pencil ?? true;
  const highlightErasable = eraserTargets?.highlight ?? true;
  const shapesErasable = eraserTargets?.shapes ?? true;
  const textErasable = eraserTargets?.text ?? true;
  const buffer = eraserRadius + 5; // collision buffer

  elements.forEach(el => {
    if (el.type === 'eraser') {
      return; // Do not preserve any pixel eraser mask elements!
    }

    let isTarget = false;
    if (el.type === 'pencil') isTarget = pencilErasable;
    else if (el.type === 'highlight') isTarget = highlightErasable;
    else if (el.type === 'rectangle' || el.type === 'circle' || el.type === 'ellipse') isTarget = shapesErasable;
    else if (el.type === 'text' || el.type === 'callout') isTarget = textErasable;

    if (!isTarget) {
      nextElements.push(el);
      return;
    }

    if (el.type === 'pencil' || el.type === 'highlight') {
      // Split the stroke at the intersection point!
      const subStrokes: { x: number; y: number; pressure?: number }[][] = [];
      let currentSub: { x: number; y: number; pressure?: number }[] = [];

      el.points.forEach(pt => {
        const dx = pt.x - ex;
        const dy = pt.y - ey;
        const distSq = dx * dx + dy * dy;

        if (distSq <= buffer * buffer) {
          // This point falls within eraser radius -> cut the line here
          if (currentSub.length > 0) {
            subStrokes.push(currentSub);
            currentSub = [];
          }
        } else {
          currentSub.push(pt);
        }
      });

      if (currentSub.length > 0) {
        subStrokes.push(currentSub);
      }

      // Re-add the split strokes as new individual elements!
      subStrokes.forEach((pts, idx) => {
        if (pts.length === 0) return;
        nextElements.push({
          ...el,
          id: `${el.id}_split_${idx}_${Date.now()}`,
          points: pts
        });
      });
    } else {
      // Atom objects (shapes/text) - if they touch the eraser, delete them completely!
      const intersects = checkIntersection(ex, ey, el, eraserRadius);
      if (!intersects) {
        nextElements.push(el);
      }
    }
  });

  return nextElements;
};

// Tạo CSS selector duy nhất cho phần tử HTML
export const generateUniqueSelector = (el: HTMLElement, limitElement?: HTMLElement): string => {
  if (el.id) return `#${CSS.escape(el.id)}`;

  // Check if it already has a data-draw-id (for backwards compatibility if any)
  let drawId = el.getAttribute('data-draw-id');
  if (drawId) return `[data-draw-id="${drawId}"]`;

  // Check if it has a globally/locally unique class name
  const classes = Array.from(el.classList)
    .filter(c => c && typeof c === 'string' && !c.includes('active') && !c.includes('hover') && !c.includes('selected') && !c.includes('drawing') && !c.startsWith('draw-'))
    .map(c => CSS.escape(c));

  if (classes.length > 0) {
    const classSelector = `.${classes.join('.')}`;
    try {
      const helpers = limitElement 
        ? Array.from(limitElement.querySelectorAll(classSelector))
        : Array.from(document.querySelectorAll(classSelector));
      if (helpers.length === 1) return classSelector;
    } catch (e) { }
  }

  // Fallback: Xây dựng structural selector đi ngược lên trên
  const path: string[] = [];
  let current: HTMLElement | null = el;
  while (current && current !== document.documentElement && current !== document.body && current !== limitElement) {
    if (current.id) {
      path.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    const tagName = current.tagName.toLowerCase();
    const parentEl: HTMLElement | null = current.parentElement;
    if (parentEl) {
      const siblings = Array.from(parentEl.children);
      const index = siblings.indexOf(current);
      path.unshift(`${tagName}:nth-child(${index + 1})`);
      current = parentEl;
    } else {
      path.unshift(tagName);
      break;
    }
  }
  // Nếu đường dẫn không bắt đầu bằng ID và không bị giới hạn bởi limitElement, thêm body vào đầu đường dẫn để đảm bảo tính tuyệt đối
  if (!limitElement && path.length > 0 && !path[0].startsWith('#')) {
    path.unshift('body');
  }
  return path.join(' > ');
};

export const getMaxWrapWidth = (): number => {
  if (typeof window !== 'undefined') {
    return window.innerWidth - 40;
  }
  return 800;
};

export const wrapTextLines = (
  text: string,
  maxWidth: number,
  size: number,
  textStyle?: string,
  fontFamily?: string
): string[] => {
  if (!text) return [];
  const lines = text.split('\n');
  const resultLines: string[] = [];

  if (typeof document === 'undefined') return lines;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return lines;
  ctx.font = getElementFont(size, textStyle, fontFamily);

  for (const line of lines) {
    const cleanLine = stripMarkdownTags(line);
    if (ctx.measureText(cleanLine).width <= maxWidth) {
      resultLines.push(line);
      continue;
    }

    // Tách theo khoảng trắng trong phần text THUẦN để tránh xé đôi thẻ markdown/HTML
    // Thuật toán: 
    //   1. Tách chuỗi markdown thành các "token" (thẻ tag hoặc text thuần)
    //   2. Gom token thành từng dòng dựa trên độ rộng text thuần
    const tokenParts = line.split(/(<font color=["'][^"']*["']>|<\/font>|<u>|<\/u>|\*\*|~~|\*)/);
    // tokenParts: xen kẽ [text, tag, text, tag, ...]
    
    let currentLine = "";
    let currentClean = "";
    
    for (let ti = 0; ti < tokenParts.length; ti++) {
      const part = tokenParts[ti];
      if (!part) continue;
      
      // Kiểm tra nếu đây là một thẻ tag (không phải text thường)
      const isTag = /^(<font color=["'][^"']*["']>|<\/font>|<u>|<\/u>|\*\*|~~|\*)$/.test(part);
      
      if (isTag) {
        // Thẻ tag không chiếm độ rộng, cộng trực tiếp vào dòng hiện tại
        currentLine += part;
      } else {
        // Text thường: tách theo khoảng trắng
        const words = part.split(' ');
        for (let wi = 0; wi < words.length; wi++) {
          const word = words[wi];
          const spacer = (wi > 0 || currentClean) ? ' ' : '';
          const testClean = currentClean + spacer + word;
          
          if (ctx.measureText(testClean).width > maxWidth && currentLine) {
            // Dòng đầy → lưu dòng hiện tại và bắt đầu dòng mới
            resultLines.push(currentLine.trim());
            // Dòng mới bắt đầu bằng từ này (không cần spacer đầu dòng)
            currentLine = word;
            currentClean = word;
          } else {
            currentLine += spacer + word;
            currentClean = testClean;
          }
        }
      }
    }
    
    if (currentLine) {
      resultLines.push(currentLine.trim());
    }
  }

  return resultLines;
};


// Helper tìm phần tử neo phù hợp nhất (Bubble up) và tạo Selector
export const findBestAnchor = (
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement | null,
  container?: HTMLElement | null
): { selector: string; rect: DOMRect; priority: number } | null => {
  if (!canvas) return null;

  const originalPointerEvents = canvas.style.pointerEvents;
  canvas.style.pointerEvents = 'none';

  // Bypass the active textarea if it is on screen during the hit test
  const textarea = (
    document.querySelector('.' + styles.richTextInput) ||
    document.querySelector('[contenteditable="true"]') ||
    document.querySelector('[class*="richTextInput"]')
  ) as HTMLElement | null;
  const originalTextareaEvents = textarea ? textarea.style.pointerEvents : '';
  if (textarea) {
    textarea.style.pointerEvents = 'none';
  }

  const editorWrapper = document.querySelector('[data-text-editor-wrapper="true"]') as HTMLElement | null;
  const originalWrapperEvents = editorWrapper ? editorWrapper.style.pointerEvents : '';
  if (editorWrapper) {
    editorWrapper.style.pointerEvents = 'none';
  }

  // Quét các điểm xung quanh để tìm phần tử chữ cụ thể (như span) thay vì thẻ div bao ngoài khi người dùng vẽ lệch/vẽ gạch chân dưới chữ
  const offsets = [
    { x: 0, y: 0 },
    { x: 0, y: -6 },   // 6px lên trên
    { x: 0, y: -12 },  // 12px lên trên
    { x: 0, y: -18 },  // 18px lên trên
    { x: 0, y: -24 },  // 24px lên trên
    { x: 0, y: -30 },  // 30px lên trên
    { x: 0, y: -36 },  // 36px lên trên
    { x: 0, y: -42 },  // 42px lên trên
    { x: 0, y: -50 },  // 50px lên trên
    { x: 0, y: 6 },    // 6px xuống dưới
    { x: -10, y: 0 },  // 10px sang trái
    { x: 10, y: 0 }    // 10px sang phải
  ];

  let bestAnchorInfo: { selector: string; rect: DOMRect; priority: number } | null = null;

  for (const offset of offsets) {
    const testX = clientX + offset.x;
    const testY = clientY + offset.y;
    const el = document.elementFromPoint(testX, testY) as HTMLElement | null;
    if (!el) continue;

    const targetSelectors = [
      'span',
      'p',
      'a',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'div',
      'li',
      'td',
      'th',
      'button',
      'input',
      'textarea',
      'select',
      'img',
      'svg'
    ];

    let foundEl: HTMLElement | null = null;
    let foundPriority = 999;

    for (let i = 0; i < targetSelectors.length; i++) {
      const target = el.closest(targetSelectors[i]) as HTMLElement | null;
      if (target) {
        // Skip elements inside canvas container, toolbar or tooltip to avoid self-anchoring!
        if (target.closest('.' + styles.canvasContainer) || target.closest('[data-text-editor-wrapper="true"]') || target.closest('[class*="toolbar"]') || target.closest('[class*="tooltip"]')) {
          continue;
        }

        if (i < foundPriority) {
          foundPriority = i;
          foundEl = target;
        }
      }
    }

    if (foundEl) {
      const elRect = foundEl.getBoundingClientRect();
      const area = elRect.width * elRect.height;
      if (area > 0 && area < 1000000) {
        const uniqueSelector = generateUniqueSelector(foundEl);
        const containerSelector = container ? generateUniqueSelector(container) : undefined;
        let finalSelector = uniqueSelector;
        if (containerSelector && uniqueSelector.startsWith(containerSelector)) {
          finalSelector = uniqueSelector.replace(containerSelector + ' ', '');
        }

        if (!bestAnchorInfo || foundPriority < bestAnchorInfo.priority) {
          bestAnchorInfo = {
            selector: finalSelector,
            rect: elRect,
            priority: foundPriority
          };
        }
      }
    }

    // Nếu tìm thấy span (ưu tiên cao nhất), dừng tìm kiếm sớm
    if (bestAnchorInfo && bestAnchorInfo.priority === 0) {
      break;
    }
  }

  // GIAI ĐOẠN DỰ PHÒNG CẤP ĐỘ 2 (Fallback Level 2): Lấy chính xác phần tử nằm dưới chuột nếu tất cả quét offset thất bại
  if (!bestAnchorInfo) {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (el) {
      const isOverlayEl = el.closest('.' + styles.canvasContainer) || 
                          el.closest('[data-text-editor-wrapper="true"]') || 
                          el.closest('[class*="toolbar"]') || 
                          el.closest('[class*="tooltip"]');
      if (!isOverlayEl && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
        const elRect = el.getBoundingClientRect();
        if (elRect.width > 0 && elRect.height > 0) {
          const uniqueSelector = generateUniqueSelector(el);
          const containerSelector = container ? generateUniqueSelector(container) : undefined;
          let finalSelector = uniqueSelector;
          if (containerSelector && uniqueSelector.startsWith(containerSelector)) {
            finalSelector = uniqueSelector.replace(containerSelector + ' ', '');
          }
          bestAnchorInfo = {
            selector: finalSelector,
            rect: elRect,
            priority: 999
          };
        }
      }
    }
  }

  canvas.style.pointerEvents = originalPointerEvents;
  if (textarea) {
    textarea.style.pointerEvents = originalTextareaEvents;
  }
  if (editorWrapper) {
    editorWrapper.style.pointerEvents = originalWrapperEvents;
  }
  return bestAnchorInfo;
};

export const normalizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};

export const calculateTextHash = (text: string): string => {
  const norm = normalizeText(text);
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
};

interface SubSVGOverlayProps {
  container: HTMLElement;
  elements: DrawElement[];
  tool: DrawTool;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElements: React.Dispatch<React.SetStateAction<DrawElement[]>>;
  domUpdateKey: number;
  editingTextId: string | null;
}

const SubSVGOverlay: React.FC<SubSVGOverlayProps> = ({
  container,
  elements,
  tool,
  selectedId,
  onSelect,
  onUpdateElements,
  domUpdateKey,
  editingTextId
}) => {
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [visibleElementIds, setVisibleElementIds] = useState<Set<string>>(new Set());

  // Đồng bộ hóa tức thời các nét vẽ mới vào visibleElementIds để hiển thị ngay lập tức (trước khi Paint) mà không chờ IntersectionObserver bất đồng bộ
  React.useLayoutEffect(() => {
    setVisibleElementIds(prev => {
      let changed = false;
      const next = new Set(prev);
      elements.forEach(el => {
        if (!next.has(el.id)) {
          next.add(el.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [elements]);

  // 1. Cập nhật kích thước viewport và vị trí cuộn thực tế của container thay vì kích thước toàn trang
  useEffect(() => {
    if (!container) return;

    const handleScroll = () => {
      setScrollPos({
        left: container.scrollLeft,
        top: container.scrollTop
      });
    };

    const handleResize = () => {
      setViewportSize({
        width: container.clientWidth,
        height: container.clientHeight
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    
    // Khởi tạo giá trị ban đầu
    handleScroll();
    handleResize();

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      ro.disconnect();
    };
  }, [container]);

  // 2. Chuyển đổi tọa độ các phần tử sang hệ tương đối bên trong container cuộn
  const renderedElements = useMemo(() => {
    const cRect = container.getBoundingClientRect();
    return elements.map(el => {
      if (el.anchorSelector) {
        const isGlobal = el.anchorSelector.startsWith('body') || el.anchorSelector.startsWith('#');
        let anchor: HTMLElement | null = null;
        try {
          anchor = isGlobal
            ? (document.querySelector(el.anchorSelector) as HTMLElement | null)
            : (container.querySelector(el.anchorSelector.startsWith('>') ? ':scope ' + el.anchorSelector : ':scope > ' + el.anchorSelector) as HTMLElement | null);
        } catch (e) {
          console.warn("Render querySelector failed for selector:", el.anchorSelector, e);
        }
        if (anchor && (isGlobal ? container.contains(anchor) : true)) {
          const anchorRect = anchor.getBoundingClientRect();
          const anchorLocalX = anchorRect.left - cRect.left + container.scrollLeft;
          const anchorLocalY = anchorRect.top - cRect.top + container.scrollTop;
          
          if (el.type === 'pencil' || el.type === 'highlight' || el.type === 'eraser') {
            return {
              ...el,
              points: el.points.map(pt => ({
                ...pt,
                x: anchorLocalX + pt.x,
                y: anchorLocalY + pt.y
              }))
            };
          } else {
            return {
              ...el,
              x: anchorLocalX + (el.x || 0),
              y: anchorLocalY + (el.y || 0),
              arrowX: el.arrowX !== undefined ? anchorLocalX + el.arrowX : undefined,
              arrowY: el.arrowY !== undefined ? anchorLocalY + el.arrowY : undefined
            };
          }
        }
      }
      return el;
    }).filter(Boolean);
  }, [elements, container, domUpdateKey]);

  // 3. Virtualization bằng IntersectionObserver để ẩn các nét ngoài tầm nhìn nhằm giải phóng VRAM
  useEffect(() => {
    // Trước tiên, dọn dẹp tất cả các thuộc tính data-element-ids cũ trong container
    container.querySelectorAll('[data-element-ids]').forEach(node => {
      node.removeAttribute('data-element-ids');
    });

    const observer = new IntersectionObserver((entries) => {
      setVisibleElementIds(prev => {
        const next = new Set(prev);
        entries.forEach(entry => {
          const idsStr = entry.target.getAttribute('data-element-ids');
          if (idsStr) {
            const ids = idsStr.split(',');
            ids.forEach(id => {
              if (entry.isIntersecting) {
                next.add(id);
              } else {
                next.delete(id);
              }
            });
          }
        });
        return next;
      });
    }, {
      root: container,
      rootMargin: '100px' // Đệm thêm 100px
    });

    elements.forEach(el => {
      if (el.anchorSelector) {
        const isGlobal = el.anchorSelector.startsWith('body') || el.anchorSelector.startsWith('#');
        let anchor: HTMLElement | null = null;
        try {
          anchor = isGlobal
            ? (document.querySelector(el.anchorSelector) as HTMLElement | null)
            : (container.querySelector(el.anchorSelector.startsWith('>') ? ':scope ' + el.anchorSelector : ':scope > ' + el.anchorSelector) as HTMLElement | null);
        } catch (e) {
          console.warn("Observer querySelector failed for selector:", el.anchorSelector, e);
        }
        if (anchor && (isGlobal ? container.contains(anchor) : true)) {
          const existingIds = anchor.getAttribute('data-element-ids') || '';
          const idList = existingIds ? existingIds.split(',') : [];
          if (!idList.includes(el.id)) {
            idList.push(el.id);
            anchor.setAttribute('data-element-ids', idList.join(','));
          }
          observer.observe(anchor);
        }
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [elements, container]);

  return (
    <svg 
      className="sub-svg-overlay" 
      style={{ 
        width: viewportSize.width, 
        height: viewportSize.height,
        transform: `translate3d(${scrollPos.left}px, ${scrollPos.top}px, 0px)`
      }}
      viewBox={`${scrollPos.left} ${scrollPos.top} ${viewportSize.width} ${viewportSize.height}`}
    >
      {renderedElements.map(el => {
        if (!el) return null;
        
        // Nếu nét vẽ có neo chữ và đang nằm ngoài viewport -> ẩn đi bằng cách không render
        if (el.anchorSelector && !visibleElementIds.has(el.id)) {
          return null;
        }

        const isSelected = el.id === selectedId;
        const strokeColor = el.color;
        const fill = el.type === 'rectangle' ? el.color : 'none';
        const opacity = el.type === 'highlight' ? 0.35 : 1.0;
        
        const isInteractive = tool === 'hand';
        const pointerEvents = 'none';

        let elementMarkup = null;

        if (el.type === 'pencil' || el.type === 'highlight' || el.type === 'eraser') {
          if (el.points.length === 0) return null;
          let d = '';
          if (el.points.length === 1) {
            d = `M ${el.points[0].x} ${el.points[0].y} L ${el.points[0].x + 0.1} ${el.points[0].y + 0.1}`;
          } else {
            d = `M ${el.points[0].x} ${el.points[0].y}`;
            for (let i = 1; i < el.points.length; i++) {
              d += ` L ${el.points[i].x} ${el.points[i].y}`;
            }
          }
          
          elementMarkup = (
            <path
              d={d}
              stroke={strokeColor}
              strokeWidth={el.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={opacity}
              pointerEvents={pointerEvents}
              cursor={isInteractive ? 'pointer' : 'default'}
              onClick={(e) => {
                if (isInteractive) {
                  e.stopPropagation();
                  onSelect(el.id);
                }
              }}
              style={isSelected ? { filter: 'drop-shadow(0px 0px 4px #3B82F6)' } : undefined}
            />
          );
        }
        
        else if (el.type === 'rectangle') {
          elementMarkup = (
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              stroke={strokeColor}
              strokeWidth={el.size}
              fill={fill}
              fillOpacity={0.3}
              strokeOpacity={0.6}
              pointerEvents={pointerEvents}
              cursor={isInteractive ? 'pointer' : 'default'}
              onClick={(e) => {
                if (isInteractive) {
                  e.stopPropagation();
                  onSelect(el.id);
                }
              }}
              style={isSelected ? { filter: 'drop-shadow(0px 0px 4px #3B82F6)' } : undefined}
            />
          );
        }
        
        else if (el.type === 'circle') {
          elementMarkup = (
            <circle
              cx={el.x}
              cy={el.y}
              r={el.radius}
              stroke={strokeColor}
              strokeWidth={el.size}
              fill="none"
              pointerEvents={pointerEvents}
              cursor={isInteractive ? 'pointer' : 'default'}
              onClick={(e) => {
                if (isInteractive) {
                  e.stopPropagation();
                  onSelect(el.id);
                }
              }}
              style={isSelected ? { filter: 'drop-shadow(0px 0px 4px #3B82F6)' } : undefined}
            />
          );
        }

        else if (el.type === 'ellipse') {
          elementMarkup = (
            <ellipse
              cx={el.x}
              cy={el.y}
              rx={el.rx}
              ry={el.ry}
              stroke={strokeColor}
              strokeWidth={el.size}
              fill="none"
              pointerEvents={pointerEvents}
              cursor={isInteractive ? 'pointer' : 'default'}
              onClick={(e) => {
                if (isInteractive) {
                  e.stopPropagation();
                  onSelect(el.id);
                }
              }}
              style={isSelected ? { filter: 'drop-shadow(0px 0px 4px #3B82F6)' } : undefined}
            />
          );
        }

        else if (el.type === 'text') {
          if (el.id === editingTextId) return null;
          const lines = el.text ? wrapTextLines(el.text, getMaxWrapWidth(), el.size, el.textStyle, el.fontFamily) : [];
          const paddingX = 6;
          const paddingY = 4;
          
          let maxLineWidth = 0;
          lines.forEach(line => {
            const cleanLine = stripMarkdownTags(line);
            const w = el.size * cleanLine.length * 0.48; // Ước lượng chiều rộng chữ trong SVG
            if (w > maxLineWidth) maxLineWidth = w;
          });
          const rectX = el.x || 0;
          const rectY = el.y || 0;
          const rectW = maxLineWidth + paddingX * 2;
          const rectH = el.size * lines.length * 1.2 + paddingY * 2;

          elementMarkup = (
            <g
              pointerEvents={pointerEvents}
              cursor={isInteractive ? 'pointer' : 'default'}
              onClick={(e) => {
                if (isInteractive) {
                  e.stopPropagation();
                  onSelect(el.id);
                }
              }}
            >
              {/* Vẽ màu nền nếu có cấu hình */}
              {el.textBgColor && (
                <rect 
                  x={rectX}
                  y={rectY}
                  width={rectW}
                  height={rectH}
                  rx={4}
                  ry={4}
                  fill={el.textBgColor}
                  fillOpacity={el.textBgOpacity !== undefined ? el.textBgOpacity : 1.0}
                />
              )}
              {/* Vẽ viền nếu có cấu hình */}
              {el.textHasBorder && (
                <rect 
                  x={rectX}
                  y={rectY}
                  width={rectW}
                  height={rectH}
                  rx={4}
                  ry={4}
                  fill="none"
                  stroke={el.color}
                  strokeWidth={el.textBorderWidth || 1}
                />
              )}
              {lines.map((line, idx) => (
                <text
                  key={idx}
                  x={rectX + paddingX}
                  y={rectY + paddingY + idx * (el.size * 1.2) + el.size * 0.8}
                  fill={el.color}
                  fontSize={el.size}
                  fontFamily={el.fontFamily || "sans-serif"}
                  fontWeight="500"
                  style={isSelected ? { filter: 'drop-shadow(0px 0px 4px #3B82F6)' } : undefined}
                >
                  {parseMarkdownLine(line).map((tok, tIdx) => {
                    return (
                      <tspan
                        key={tIdx}
                        style={{
                          fontWeight: tok.bold ? "bold" : "500",
                          fontStyle: tok.italic ? "italic" : "normal",
                          textDecoration: [
                            tok.underline ? "underline" : "",
                            tok.strikethrough ? "line-through" : ""
                          ].filter(Boolean).join(" ") || "none"
                        }}
                        fill={tok.color || el.color}
                      >
                        {tok.text}
                      </tspan>
                    );
                  })}
                </text>
              ))}
            </g>
          );
        }

        else if (el.type === 'callout') {
          if (el.id === editingTextId) return null;
          const lines = el.text ? wrapTextLines(el.text, getMaxWrapWidth(), el.size, el.textStyle, el.fontFamily) : [];
          
          let maxLineWidth = 0;
          lines.forEach(line => {
            const cleanLine = stripMarkdownTags(line);
            const w = el.size * cleanLine.length * 0.48; // Ước lượng chiều rộng chữ trong SVG
            if (w > maxLineWidth) maxLineWidth = w;
          });
          const paddingX = 6;
          const paddingY = 5;
          const rectX = el.x || 0;
          const rectY = el.y || 0;
          const rectW = maxLineWidth + paddingX * 2;
          const textBlockHeight = (lines.length - 1) * el.size * 1.2 + el.size;
          const rectH = textBlockHeight + paddingY * 2;
          
          let arrowPath = '';
          let headPath = '';
          if (el.arrowX !== undefined && el.arrowY !== undefined) {
            const conn = getCalloutConnectionPoint(rectX, rectY, rectW, rectH, el.arrowX, el.arrowY);
            const startX = conn.x;
            const startY = conn.y;
            
            arrowPath = `M ${startX} ${startY} L ${el.arrowX} ${el.arrowY}`;
            
            const theta = Math.atan2(el.arrowY - startY, el.arrowX - startX);
            const headlen = 10;
            const p1x = el.arrowX - headlen * Math.cos(theta - Math.PI / 6);
            const p1y = el.arrowY - headlen * Math.sin(theta - Math.PI / 6);
            const p2x = el.arrowX - headlen * Math.cos(theta + Math.PI / 6);
            const p2y = el.arrowY - headlen * Math.sin(theta + Math.PI / 6);
            headPath = `M ${el.arrowX} ${el.arrowY} L ${p1x} ${p1y} L ${p2x} ${p2y} Z`;
          }
          
          elementMarkup = (
            <g
              pointerEvents={pointerEvents}
              cursor={isInteractive ? 'pointer' : 'default'}
              onClick={(e) => {
                if (isInteractive) {
                  e.stopPropagation();
                  onSelect(el.id);
                }
              }}
              style={isSelected ? { filter: 'drop-shadow(0px 0px 4px #3B82F6)' } : undefined}
            >
              {arrowPath && (
                <path 
                  d={arrowPath} 
                  stroke={strokeColor} 
                  strokeWidth={el.textBorderWidth || 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
              {headPath && (
                <path 
                  d={headPath} 
                  fill={strokeColor} 
                />
              )}
              <rect 
                x={rectX}
                y={rectY}
                width={rectW}
                height={rectH}
                rx={4}
                ry={4}
                fill={el.textBgColor || '#ffffff'}
                fillOpacity={el.textBgOpacity !== undefined ? el.textBgOpacity : 1.0}
                stroke={el.textHasBorder !== false ? strokeColor : 'none'}
                strokeWidth={el.textHasBorder !== false ? (el.textBorderWidth || 1.5) : 0}
              />
              {lines.map((line, idx) => (
                <text
                  key={idx}
                  x={rectX + paddingX}
                  y={rectY + paddingY + idx * (el.size * 1.2) + el.size * 0.8}
                  fill={el.color}
                  fontSize={el.size}
                  fontFamily={el.fontFamily || "sans-serif"}
                  fontWeight="500"
                >
                  {parseMarkdownLine(line).map((tok, tIdx) => {
                    return (
                      <tspan
                        key={tIdx}
                        style={{
                          fontWeight: tok.bold ? "bold" : "500",
                          fontStyle: tok.italic ? "italic" : "normal",
                          textDecoration: [
                            tok.underline ? "underline" : "",
                            tok.strikethrough ? "line-through" : ""
                          ].filter(Boolean).join(" ") || "none"
                        }}
                        fill={tok.color || el.color}
                      >
                        {tok.text}
                      </tspan>
                    );
                  })}
                </text>
              ))}
            </g>
          );
        }

        // Tạo khung chọn viền đứt nét + 4 chấm tròn phóng to co giãn nếu phần tử được chọn
        let selectionBox = null;
        if (isSelected) {
          let bx1 = 0, by1 = 0, bx2 = 0, by2 = 0;
          let showHandles = false;

          if (el.type === 'rectangle' && el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
            bx1 = Math.min(el.x, el.x + el.width) - 4;
            by1 = Math.min(el.y, el.y + el.height) - 4;
            bx2 = Math.max(el.x, el.x + el.width) + 4;
            by2 = Math.max(el.y, el.y + el.height) + 4;
            showHandles = true;
          } else if (el.type === 'circle' && el.x !== undefined && el.y !== undefined && el.radius !== undefined) {
            bx1 = el.x - el.radius - 4;
            by1 = el.y - el.radius - 4;
            bx2 = el.x + el.radius + 4;
            by2 = el.y + el.radius + 4;
            showHandles = true;
          } else if (el.type === 'ellipse' && el.x !== undefined && el.y !== undefined && el.rx !== undefined && el.ry !== undefined) {
            bx1 = el.x - el.rx - 4;
            by1 = el.y - el.ry - 4;
            bx2 = el.x + el.rx + 4;
            by2 = el.y + el.ry + 4;
            showHandles = true;
          } else if ((el.type === 'text' || el.type === 'callout') && el.x !== undefined && el.y !== undefined && el.text) {
            const lines = wrapTextLines(el.text, getMaxWrapWidth(), el.size, el.textStyle, el.fontFamily);
            let maxLineWidth = 0;
            lines.forEach(line => {
              const cleanLine = stripMarkdownTags(line);
              const w = el.size * cleanLine.length * 0.48;
              if (w > maxLineWidth) maxLineWidth = w;
            });
            const paddingX = 6;
            const paddingY = el.type === 'callout' ? 5 : 4;
            bx1 = el.x;
            by1 = el.y;
            bx2 = el.x + maxLineWidth + paddingX * 2;
            by2 = el.y + el.size * lines.length * 1.2 + paddingY * 2;
            showHandles = true;
          } else if (el.points.length > 0) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            el.points.forEach(pt => {
              minX = Math.min(minX, pt.x);
              maxX = Math.max(maxX, pt.x);
              minY = Math.min(minY, pt.y);
              maxY = Math.max(maxY, pt.y);
            });
            bx1 = minX - 4; by1 = minY - 4; bx2 = maxX + 4; by2 = maxY + 4;
            showHandles = el.type === 'pencil' || el.type === 'highlight';
          }

          if (bx2 > bx1 || by2 > by1) {
            const handles = showHandles ? [
              { x: bx1, y: by1 }, // nw
              { x: bx2, y: by1 }, // ne
              { x: bx2, y: by2 }, // se
              { x: bx1, y: by2 }, // sw
            ] : [];

            selectionBox = (
              <g key={`select-${el.id}`} pointerEvents="none" style={{ opacity: 0.8 }}>
                {/* Bounding box dashed line */}
                <rect
                  x={bx1}
                  y={by1}
                  width={bx2 - bx1}
                  height={by2 - by1}
                  stroke="#3B82F6"
                  strokeWidth={1.2}
                  strokeDasharray="4,4"
                  fill="none"
                />
                {/* 4 corner circles */}
                {handles.map((h, hIdx) => (
                  <circle
                    key={hIdx}
                    cx={h.x}
                    cy={h.y}
                    r={4.5}
                    fill="#ffffff"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                  />
                ))}
              </g>
            );
          }
        }

        return (
          <React.Fragment key={el.id}>
            {elementMarkup}
            {selectionBox}
          </React.Fragment>
        );
      })}
    </svg>
  );
};

export const ScreenDrawOverlay: React.FC<ScreenDrawOverlayProps> = ({
  isActive,
  setIsActive
}) => {
  const [tool, setToolState] = useState<DrawTool>('pencil');
  const [color, setColor] = useState<DrawColor>('#EF4444');
  const [scrollContainers, setScrollContainers] = useState<HTMLElement[]>([]);
  const [domUpdateKey, setDomUpdateKey] = useState(0);
  const copiedElementRef = useRef<DrawElement | null>(null);

  const findScrollContainer = (clientX: number, clientY: number): HTMLElement | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const originalPointerEvents = canvas.style.pointerEvents;
    canvas.style.pointerEvents = 'none';

    // Bypass the active textarea if it is on screen during the hit test
    const textarea = (
      document.querySelector('.' + styles.richTextInput) ||
      document.querySelector('[contenteditable="true"]') ||
      document.querySelector('[class*="richTextInput"]')
    ) as HTMLElement | null;
    const originalTextareaEvents = textarea ? textarea.style.pointerEvents : '';
    if (textarea) {
      textarea.style.pointerEvents = 'none';
    }

    const editorWrapper = document.querySelector('[data-text-editor-wrapper="true"]') as HTMLElement | null;
    const originalWrapperEvents = editorWrapper ? editorWrapper.style.pointerEvents : '';
    if (editorWrapper) {
      editorWrapper.style.pointerEvents = 'none';
    }

    const topElement = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    canvas.style.pointerEvents = textInput ? 'none' : 'auto';
    if (textarea) {
      textarea.style.pointerEvents = originalTextareaEvents;
    }
    if (editorWrapper) {
      editorWrapper.style.pointerEvents = originalWrapperEvents;
    }

    if (!topElement) return null;
    return topElement.closest('.webtoeic-scroll-container') as HTMLElement | null;
  };

  const setTool = (newTool: DrawTool) => {
    setToolState((prev) => {
      if (prev !== 'hand' && newTool === 'hand') {
        setLastActiveTool(prev);
      }
      return newTool;
    });
  };

  // 6 slot màu tùy chỉnh - load từ localStorage khi khởi tạo
  const [colorSlots, setColorSlots] = useState<DrawColor[]>(DEFAULT_COLOR_SLOTS);
  // State mở/đóng palette popup (null = đóng, số = chỉ số slot đang chỉnh)
  const [colorPaletteSlot, setColorPaletteSlot] = useState<number | null>(null);
  const palettePopupRef = useRef<HTMLDivElement>(null);
  const editingSlotRef = useRef<number>(-1);
  const [pencilSize, setPencilSize] = useState(2);
  const [highlightSize, setHighlightSize] = useState(16);
  const [rectangleSize, setRectangleSize] = useState(0.5);
  const [circleSize, setCircleSize] = useState(0.5);

  // Custom Pen Styles (Bút bi, Bút máy, Bút lông)
  const [penStyle, setPenStyle] = useState<'ballpoint' | 'fountain' | 'brush'>('ballpoint');
  const [showPenStyleMenu, setShowPenStyleMenu] = useState(false);
  const [eraserSize, setEraserSize] = useState(24);
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState<string>('sans-serif');
  const [lastActiveTool, setLastActiveTool] = useState<DrawTool>('pencil');

  const [eraserTargets, setEraserTargets] = useState<{
    pencil: boolean;
    highlight: boolean;
    shapes: boolean;
    text: boolean;
  }>({
    pencil: true,
    highlight: true,
    shapes: true,
    text: true
  });
  const [draftEraserTargets, setDraftEraserTargets] = useState({
    pencil: true,
    highlight: true,
    shapes: true,
    text: true
  });
  const [eraserMode, setEraserMode] = useState<'stroke' | 'pixel'>('pixel');
  const [draftEraserMode, setDraftEraserMode] = useState<'stroke' | 'pixel'>('pixel');

  // Quản lý kéo thả Toolbar và Vị trí mặc định thông minh
  const [toolbarPos, setToolbarPos] = useState({ x: 200, y: 120 }); // Giá trị khởi tạo tạm thời
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Nhận diện đường dẫn trang hiện tại
  const pathname = typeof window !== 'undefined' ? window.location.pathname : "";
  const isLearnPage = pathname?.includes("/learn/") && pathname?.includes("/lesson/");

  // Khai báo state lưu nét vẽ vector và các refs vẽ nháp chuyên biệt
  const [elements, setElements] = useState<DrawElement[]>([]);
  
  // Dynamic drawing context partitioning
  const [currentContext, setCurrentContext] = useState<string>("");
  const ignoreNextSaveRef = useRef(false);
  const prevContextRef = useRef<string>("");

  // Detect context changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detectContext = () => {
      const el = document.querySelector('[data-drawing-context]');
      const context = el ? el.getAttribute('data-drawing-context') : window.location.pathname;
      return context || "global";
    };

    setCurrentContext(detectContext());

    const interval = setInterval(() => {
      const detected = detectContext();
      if (detected !== currentContext) {
        setCurrentContext(detected);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [currentContext]);

  // Context transition handling (save prev, load new)
  useEffect(() => {
    if (!currentContext) return;

    // 1. Save elements of the previous context before switching
    const prevContext = prevContextRef.current;
    if (prevContext && prevContext !== currentContext) {
      const key = `webtoeic_canvas_elements_${prevContext}`;
      try {
        localStorage.setItem(key, JSON.stringify(elements));
      } catch (e) {
        console.error("Failed to save elements for prev context", e);
      }
    }

    // 2. Load elements of the new context
    const newKey = `webtoeic_canvas_elements_${currentContext}`;
    let loadedElements: DrawElement[] = [];
    const stored = localStorage.getItem(newKey);
    if (stored) {
      try {
        loadedElements = JSON.parse(stored);
      } catch (e) {}
    } else {
      // Migration fallback: if no context-specific drawings exist yet,
      // and the context is a pathname (e.g. not a part5- question),
      // we can try loading from the legacy key to preserve user drawings.
      if (!currentContext.startsWith('part5-')) {
        const legacy = localStorage.getItem('webtoeic_canvas_elements');
        if (legacy) {
          try {
            loadedElements = JSON.parse(legacy);
          } catch (e) {}
        }
      }
    }

    // 3. Update state
    ignoreNextSaveRef.current = true;
    setElements(loadedElements);
    setUndoStack(loadedElements.length > 0 ? [loadedElements] : []);
    setRedoStack([]);

    // Update ref
    prevContextRef.current = currentContext;
  }, [currentContext]);

  const [undoStack, setUndoStack] = useState<DrawElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawElement[][]>([]);

  const saveToUndoStack = (currentElements: DrawElement[]) => {
    setUndoStack(prev => [...prev.slice(-14), currentElements]);
    setRedoStack([]);
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGrabbingPage, setIsGrabbingPage] = useState(false);
  const isGrabbingPageRef = useRef(false);
  const scrollTargetRef = useRef<HTMLElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Ref lưu phần tử neo đang vẽ active
  const activeAnchorRef = useRef<{ selector: string; rect: DOMRect; priority: number } | null>(null);

  // Helper dịch chuyển toạ độ tương đối của DrawElement thành toạ độ tuyệt đối trên Canvas
  const getTranslatedElement = (el: DrawElement, canvasRect: DOMRect | null | undefined): DrawElement | null => {
    if (!canvasRect) return el;

    if (el.anchorSelector) {
      let domEl: Element | null = null;
      try {
        if (el.containerSelector) {
          const containerEl = document.querySelector(el.containerSelector);
          if (containerEl) {
            if (el.anchorSelector === el.containerSelector) {
              domEl = containerEl;
            } else {
              domEl = containerEl.querySelector(el.anchorSelector);
            }
          }
        }
        if (!domEl) {
          domEl = document.querySelector(el.anchorSelector);
        }
      } catch (e) {
        console.warn("Invalid selector lookup:", el.anchorSelector);
      }
      if (!domEl) {
        // Anchor không còn trong DOM → dùng tọa độ tuyệt đối thay vì bỏ qua
        return {
          ...el,
          x: el.absoluteX !== undefined ? el.absoluteX : el.x,
          y: el.absoluteY !== undefined ? el.absoluteY : el.y,
          arrowX: el.absoluteArrowX !== undefined ? el.absoluteArrowX : el.arrowX,
          arrowY: el.absoluteArrowY !== undefined ? el.arrowY : el.arrowY
        };
      }

      const rect = domEl.getBoundingClientRect();
      const dx = rect.left - canvasRect.left;
      const dy = rect.top - canvasRect.top;

      return {
        ...el,
        x: el.x !== undefined ? el.x + dx : undefined,
        y: el.y !== undefined ? el.y + dy : undefined,
        arrowX: el.arrowX !== undefined ? el.arrowX + dx : undefined,
        arrowY: el.arrowY !== undefined ? el.arrowY + dy : undefined,
        points: el.points.map(pt => ({
          ...pt,
          x: pt.x + dx,
          y: pt.y + dy
        }))
      };
    } else if (el.containerSelector) {
      let domEl: Element | null = null;
      try {
        domEl = document.querySelector(el.containerSelector);
      } catch (e) {
        console.warn("Invalid selector lookup:", el.containerSelector);
      }
      if (!domEl) {
        // Container không còn trong DOM → dùng tọa độ tuyệt đối
        return {
          ...el,
          x: el.absoluteX !== undefined ? el.absoluteX : el.x,
          y: el.absoluteY !== undefined ? el.absoluteY : el.y,
          arrowX: el.absoluteArrowX !== undefined ? el.absoluteArrowX : el.arrowX,
          arrowY: el.absoluteArrowY !== undefined ? el.arrowY : el.arrowY
        };
      }

      const rect = domEl.getBoundingClientRect();
      const dx = rect.left - canvasRect.left - domEl.scrollLeft;
      const dy = rect.top - canvasRect.top - domEl.scrollTop;

      return {
        ...el,
        x: el.x !== undefined ? el.x + dx : undefined,
        y: el.y !== undefined ? el.y + dy : undefined,
        arrowX: el.arrowX !== undefined ? el.arrowX + dx : undefined,
        arrowY: el.arrowY !== undefined ? el.arrowY + dy : undefined,
        points: el.points.map(pt => ({
          ...pt,
          x: pt.x + dx,
          y: pt.y + dy
        }))
      };
    }

    return el;
  };

  // Helper thực hiện tẩy Pixel có tính toán neo toạ độ (DOM Anchoring Aware)
  const performPixelErasing = (ex: number, ey: number, eraserRadius: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();

    // Thu thập các phần tử đã được chuyển đổi sang hệ toạ độ tuyệt đối
    const absoluteElements: DrawElement[] = [];
    const elementTranslationOffsets = new Map<string, { dx: number; dy: number }>();

    elements.forEach(el => {
      const translated = getTranslatedElement(el, canvasRect);
      if (translated) {
        absoluteElements.push(translated);
        if (el.anchorSelector) {
          const domEl = document.querySelector(el.anchorSelector);
          if (domEl) {
            const domRect = domEl.getBoundingClientRect();
            elementTranslationOffsets.set(el.id, {
              dx: domRect.left - canvasRect.left,
              dy: domRect.top - canvasRect.top
            });
          }
        }
      }
    });

    const erasedAbsoluteElements = erasePixelFromElements(ex, ey, eraserRadius, absoluteElements, eraserTargets);

    const nextElements = erasedAbsoluteElements.map(el => {
      let baseId = el.id;
      if (el.id.includes('_split_')) {
        baseId = el.id.split('_split_')[0];
      }
      const originalEl = elements.find(o => o.id === baseId);
      if (originalEl && originalEl.anchorSelector) {
        const offset = elementTranslationOffsets.get(baseId);
        if (offset) {
          return {
            ...el,
            anchorSelector: originalEl.anchorSelector,
            x: el.x !== undefined ? el.x - offset.dx : undefined,
            y: el.y !== undefined ? el.y - offset.dy : undefined,
            points: el.points.map(pt => ({
              ...pt,
              x: pt.x - offset.dx,
              y: pt.y - offset.dy
            }))
          };
        }
      }
      return el;
    });

    setElements(nextElements);
  };

  // Trạng thái vẽ nháp
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const canvasSnapshotRef = useRef<ImageData | null>(null);
  const activePointsRef = useRef<{ x: number; y: number; pressure?: number; time?: number }[]>([]);

  // Shape Recognition: các timer và trạng thái nhận dạng
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const lastMovePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasSnappedRef = useRef<boolean>(false);
  const lastWidthFactorRef = useRef<number>(1.0);
  const recognizedShapeRef = useRef<{
    type: 'rectangle' | 'circle' | 'line' | 'ellipse';
    rect?: { x: number; y: number; w: number; h: number };
    circle?: { cx: number; cy: number; radius: number };
    ellipse?: { cx: number; cy: number; rx: number; ry: number };
    line?: { start: { x: number; y: number }; end: { x: number; y: number } };
  } | null>(null);

  const [shapeRecognized, setShapeRecognized] = useState(false);  // flash animation
  const [shapePending, setShapePending] = useState(false);        // dot indicator

  // Quản lý Text input tạm thời
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [activeTextVal, setActiveTextVal] = useState("");
  const textInputValRef = useRef("");
  const isSubmittingTextRef = useRef(false);
  const [calloutArrowPos, setCalloutArrowPos] = useState<{ x: number; y: number } | null>(null);
  const [showCommentHistory, setShowCommentHistory] = useState(false);

  // Trạng thái phóng to/thu nhỏ (Resize) các hình vẽ/text ở chế độ Bàn tay
  const [resizingInfo, setResizingInfo] = useState<{
    elementId: string;
    handle: 'nw' | 'ne' | 'se' | 'sw' | 'arrow';
    startX: number;
    startY: number;
    startElX: number;
    startElY: number;
    startWidth: number;
    startHeight: number;
    startRadius: number;
    startSize: number;
    startArrowX?: number;
    startArrowY?: number;
    startAbsoluteX?: number;
    startAbsoluteY?: number;
    startAbsoluteArrowX?: number;
    startAbsoluteArrowY?: number;
    startPoints?: { x: number; y: number; pressure?: number }[];
    startBBox?: { minX: number; minY: number; maxX: number; maxY: number };
  } | null>(null);
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<'nw' | 'ne' | 'se' | 'sw' | 'arrow' | null>(null);

  // Đèn chiếu (Flashlight / Spotlight)
  const [isFlashlightActive, setIsFlashlightActive] = useState(false);
  const [flashlightSize, setFlashlightSize] = useState(100);
  const [flashlightShape, setFlashlightShape] = useState<'circle' | 'rectangle'>('circle');
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false); // Trạng thái nhấn giữ Shift tạm thời tương tác web bên dưới (Ghost mode)
  const [customHotkeys, setCustomHotkeys] = useState<Record<string, string>>(DEFAULT_HOTKEYS);
  const getToolTooltip = (toolName: string, defaultName: string) => {
    const key = customHotkeys[toolName];
    if (!key || key.trim() === '') return defaultName;
    return `${defaultName} — phím tắt: ${key.toUpperCase()}`;
  };
  const [clonedTools, setClonedTools] = useState<ClonedTool[]>([]);
  const [activeCloneId, setActiveCloneId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showClones, setShowClones] = useState(false); // Trạng thái ẩn/hiện hàng bút clone

  // Draft states for settings modal
  const [draftHotkeys, setDraftHotkeys] = useState<Record<string, string>>(DEFAULT_HOTKEYS);
  const [draftClonedTools, setDraftClonedTools] = useState<ClonedTool[]>([]);
  const [draftFontSize, setDraftFontSize] = useState(20);
  const [draftFontFamily, setDraftFontFamily] = useState<string>('sans-serif');
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'clones' | 'eraser'>('shortcuts');
  const [listeningKeyFor, setListeningKeyFor] = useState<string | null>(null);

  // Form states for creating a new clone
  const [newCloneName, setNewCloneName] = useState('');
  const [newCloneBaseType, setNewCloneBaseType] = useState<'pencil' | 'highlight' | 'rectangle' | 'text' | 'callout'>('pencil');
  const [newCloneColor, setNewCloneColor] = useState('#EF4444');
  const [newCloneHotkey, setNewCloneHotkey] = useState('');
  const [newCloneTextSize, setNewCloneTextSize] = useState<number>(20);
  const [newCloneTextStyle, setNewCloneTextStyle] = useState<'normal' | 'bold' | 'italic' | 'bold-italic'>('normal');
  const [newCloneFontFamily, setNewCloneFontFamily] = useState<string>('sans-serif');
  const [newCloneTextHasBorder, setNewCloneTextHasBorder] = useState<boolean>(false);
  const [newCloneTextBorderWidth, setNewCloneTextBorderWidth] = useState<number>(1);
  const [newCloneTextBgColor, setNewCloneTextBgColor] = useState<string>('#FFFFFF');
  const [newCloneTextBgOpacity, setNewCloneTextBgOpacity] = useState<number>(30);
  const [editingCloneId, setEditingCloneId] = useState<string | null>(null);



  // Đặt vị trí mặc định thông minh khi thay đổi trang học tập hoặc trang ngoài
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Phân tách lưu trữ vị trí kéo thả thủ công riêng biệt giữa 2 khu vực:
      // Trang học tập (learn) và các trang ngoài (global)
      const storageKey = isLearnPage ? 'webtoeic_toolbar_pos_learn' : 'webtoeic_toolbar_pos_global';
      const storedToolbarPos = localStorage.getItem(storageKey);

      if (storedToolbarPos) {
        try {
          setToolbarPos(JSON.parse(storedToolbarPos));
        } catch (e) {
          // bỏ qua
        }
      } else {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const toolbarWidth = 480; // Chiều rộng ước lượng của toolbar

        if (isLearnPage) {
          // 1. Vào khóa học: mặc định nằm ở TRÊN CÙNG, ở giữa (dưới thanh đen topbar 8px)
          setToolbarPos({
            x: Math.max(10, (width - toolbarWidth) / 2),
            y: 8
          });
        } else {
          // 2. Ngoài khóa học: mặc định nằm ở DƯỚI CÙNG, ở giữa (cách đáy màn hình 70px)
          setToolbarPos({
            x: Math.max(10, (width - toolbarWidth) / 2),
            y: Math.max(10, height - 70)
          });
        }
      }
    }
  }, [isLearnPage]);

  // Ghi nhớ tuỳ chọn vẽ viết vào localStorage (Client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedPencilSize = localStorage.getItem('webtoeic_pencil_size');
    if (storedPencilSize) setPencilSize(parseFloat(storedPencilSize));

    const storedHighlightSize = localStorage.getItem('webtoeic_highlight_size');
    if (storedHighlightSize) setHighlightSize(parseFloat(storedHighlightSize));

    const storedEraserSize = localStorage.getItem('webtoeic_eraser_size');
    if (storedEraserSize) setEraserSize(parseFloat(storedEraserSize));

    const storedFontSize = localStorage.getItem('webtoeic_font_size');
    if (storedFontSize) setFontSize(parseFloat(storedFontSize));

    const storedFontFamily = localStorage.getItem('webtoeic_font_family');
    if (storedFontFamily) setFontFamily(storedFontFamily);

    const storedRectangleSize = localStorage.getItem('webtoeic_rectangle_size');
    if (storedRectangleSize) setRectangleSize(parseFloat(storedRectangleSize));

    const storedCircleSize = localStorage.getItem('webtoeic_circle_size');
    if (storedCircleSize) setCircleSize(parseFloat(storedCircleSize));

    const storedColor = localStorage.getItem('webtoeic_draw_color');
    if (storedColor) setColor(storedColor);

    const storedEraserTargets = localStorage.getItem('webtoeic_eraser_targets');
    if (storedEraserTargets) {
      try {
        const parsed = JSON.parse(storedEraserTargets);
        if (parsed && typeof parsed === 'object') {
          setEraserTargets(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) { /* bỏ qua */ }
    }

    const storedEraserMode = localStorage.getItem('webtoeic_eraser_mode');
    if (storedEraserMode === 'stroke' || storedEraserMode === 'pixel') {
      setEraserMode(storedEraserMode);
    }

    // Load custom color slots
    const storedSlots = localStorage.getItem('webtoeic_color_slots');
    if (storedSlots) {
      try {
        const parsed = JSON.parse(storedSlots);
        if (Array.isArray(parsed) && parsed.length === 6) {
          setColorSlots(parsed);
        }
      } catch (e) { /* bỏ qua */ }
    }
  }, []);

  // Đóng palette popup khi click ra ngoài
  useEffect(() => {
    if (colorPaletteSlot === null) return;
    const handleOutside = (e: MouseEvent) => {
      if (palettePopupRef.current && !palettePopupRef.current.contains(e.target as Node)) {
        setColorPaletteSlot(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [colorPaletteSlot]);

  // Đóng menu chọn đầu bút khi click ra ngoài vùng cọ vẽ
  useEffect(() => {
    const handleGlobalPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // Tránh lỗi khi target trống hoặc không có class
      if (target && !target.closest('[class*="pencilGroup"]')) {
        setShowPenStyleMenu(false);
      }
    };
    window.addEventListener("pointerdown", handleGlobalPointer);
    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointer);
    };
  }, []);

  // Tự động lưu các tuỳ chọn kích cỡ nét
  useEffect(() => {
    localStorage.setItem('webtoeic_pencil_size', pencilSize.toString());
  }, [pencilSize]);

  useEffect(() => {
    localStorage.setItem('webtoeic_highlight_size', highlightSize.toString());
  }, [highlightSize]);

  useEffect(() => {
    localStorage.setItem('webtoeic_eraser_size', eraserSize.toString());
  }, [eraserSize]);

  useEffect(() => {
    localStorage.setItem('webtoeic_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('webtoeic_rectangle_size', rectangleSize.toString());
  }, [rectangleSize]);

  useEffect(() => {
    localStorage.setItem('webtoeic_circle_size', circleSize.toString());
  }, [circleSize]);

  // 1. Redraw canvas ngay lập tức khi phần tử thay đổi
  useEffect(() => {
    drawAllElements();
  }, [elements, selectedId, editingTextId, textInput, activeTextVal]);

  // 2. Trì hoãn lưu xuống localStorage (Debounce 800ms) để tránh nghẽn CPU
  useEffect(() => {
    if (ignoreNextSaveRef.current) {
      ignoreNextSaveRef.current = false;
      return;
    }
    if (!currentContext) return;

    const timer = setTimeout(() => {
      let tempElements = [...elements];
      let jsonStr = JSON.stringify(tempElements);

      // 1. TỐI ƯU CHỦ ĐỘNG: Nếu chuỗi JSON lớn hơn 3MB, dọn dẹp các nét vẽ Pencil/Highlight tự do cũ nhất
      const LIMIT_WARN = 3 * 1024 * 1024; // 3MB
      const LIMIT_SAFE = 2 * 1024 * 1024; // 2MB

      if (jsonStr.length > LIMIT_WARN) {
        console.warn(`[DrawOverlay] Dung lượng nét vẽ lớn (${(jsonStr.length / 1024 / 1024).toFixed(2)}MB), bắt đầu chủ động dọn dẹp...`);

        // Tìm và lọc loại bỏ dần các nét vẽ tự do (Pencil/Highlight) từ cũ nhất (đầu mảng)
        // Giữ lại các nét vẽ quan trọng như hình dạng (shapes) và chữ nháp (text)
        let pruned = false;
        while (jsonStr.length > LIMIT_SAFE && tempElements.length > 0) {
          const firstFreeHandIdx = tempElements.findIndex(el => el.type === 'pencil' || el.type === 'highlight');

          if (firstFreeHandIdx !== -1) {
            tempElements.splice(firstFreeHandIdx, 1);
            jsonStr = JSON.stringify(tempElements);
            pruned = true;
          } else {
            // Nếu không còn nét vẽ tự do nào để xóa (chỉ còn toàn chữ nháp/hình dạng cực nhẹ), dừng xóa
            break;
          }
        }

        if (pruned) {
          console.log(`[DrawOverlay] Đã chủ động dọn dẹp đưa dung lượng về ${(jsonStr.length / 1024 / 1024).toFixed(2)}MB`);
        }
      }

      // 2. LƯU VÀ FALLBACK: Thử lưu, nếu vẫn báo lỗi đầy thì loại bỏ tiếp nét vẽ cũ nhất bất kỳ
      let success = false;
      const key = `webtoeic_canvas_elements_${currentContext}`;
      while (!success && tempElements.length > 0) {
        try {
          localStorage.setItem(key, JSON.stringify(tempElements));
          success = true;
        } catch (err) {
          console.warn("[DrawOverlay] LocalStorage đầy, tiến hành loại bỏ nét vẽ cũ nhất làm fallback...");
          tempElements.shift(); // Fallback xóa phần tử đầu tiên
        }
      }

      // Nếu đã phải cắt bớt nét vẽ thì đồng bộ lại React State
      if (tempElements.length !== elements.length) {
        setElements(tempElements);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [elements]);

  useEffect(() => {
    try {
      localStorage.setItem('webtoeic_draw_color', color);
    } catch (err) { }
  }, [color]);
  // Tải cấu hình phím tắt và bút clone từ Database (hoặc LocalStorage dự phòng) khi công cụ vẽ kích hoạt
  useEffect(() => {
    if (!isActive) return;

    const loadDrawSettings = async () => {
      try {
        const res = await fetch("/api/admin/draw-settings");
        if (res.ok) {
          const data = await res.json();
          if (data.drawSettings) {
            // Hỗ trợ cả hai dạng: lồng nhau (data.drawSettings.drawSettings) hoặc phẳng (data.drawSettings)
            const settings = data.drawSettings.drawSettings || data.drawSettings;
            const { customHotkeys: dbHotkeys, clonedTools: dbCloned, eraserTargets: dbEraserTargets, eraserMode: dbEraserMode, fontFamily: dbFontFamily } = settings;
            if (dbHotkeys) {
              const merged = { ...DEFAULT_HOTKEYS, ...dbHotkeys };
              setCustomHotkeys(merged);
              localStorage.setItem('webtoeic_custom_hotkeys', JSON.stringify(merged));
            }
            if (dbCloned) {
              // Migration: callout clone cũ bị lưu thiếu textHasBorder → mặc định true
              const migratedClones = dbCloned.map((c: ClonedTool) =>
                c.baseType === 'callout' && c.textHasBorder === false
                  ? { ...c, textHasBorder: true, textBgColor: c.textBgColor || '#ffffff', textBgOpacity: c.textBgOpacity !== undefined ? c.textBgOpacity : 1.0 }
                  : c
              );
              setClonedTools(migratedClones);
              localStorage.setItem('webtoeic_cloned_tools', JSON.stringify(migratedClones));
            }
            if (dbEraserTargets) {
              setEraserTargets(dbEraserTargets);
              localStorage.setItem('webtoeic_eraser_targets', JSON.stringify(dbEraserTargets));
            }
            if (dbEraserMode) {
              setEraserMode(dbEraserMode);
              localStorage.setItem('webtoeic_eraser_mode', dbEraserMode);
            }
            if (dbFontFamily) {
              setFontFamily(dbFontFamily);
              localStorage.setItem('webtoeic_font_family', dbFontFamily);
            }
            return;
          }
        }
      } catch (err) {
        console.error("Lỗi lấy cấu hình đám mây:", err);
      }

      // Fallback nếu không có mạng / DB rỗng
      const localHotkeys = localStorage.getItem('webtoeic_custom_hotkeys');
      const localClones = localStorage.getItem('webtoeic_cloned_tools');
      const localEraserTargets = localStorage.getItem('webtoeic_eraser_targets');
      const localEraserMode = localStorage.getItem('webtoeic_eraser_mode');
      if (localHotkeys) {
        const mergedLocal = { ...DEFAULT_HOTKEYS, ...JSON.parse(localHotkeys) };
        setCustomHotkeys(mergedLocal);
      }
      if (localClones) {
        const parsedClones: ClonedTool[] = JSON.parse(localClones);
        // Migration: callout clone cũ bị lưu thiếu textHasBorder → mặc định true
        const migratedLocal = parsedClones.map(c =>
          c.baseType === 'callout' && c.textHasBorder === false
            ? { ...c, textHasBorder: true, textBgColor: c.textBgColor || '#ffffff', textBgOpacity: c.textBgOpacity !== undefined ? c.textBgOpacity : 1.0 }
            : c
        );
        setClonedTools(migratedLocal);
      }
      if (localEraserTargets) {
        try {
          setEraserTargets(JSON.parse(localEraserTargets));
        } catch (e) { }
      }
      if (localEraserMode === 'stroke' || localEraserMode === 'pixel') {
        setEraserMode(localEraserMode);
      }
    };

    loadDrawSettings();
  }, [isActive]);

  // Capture key for customized hotkey or new clone hotkey
  useEffect(() => {
    if (!listeningKeyFor) return;

    const getEventHotkeyString = (ev: KeyboardEvent): string => {
      const parts: string[] = [];
      if (ev.ctrlKey || ev.metaKey) parts.push('ctrl');
      if (ev.shiftKey && ev.key !== 'Shift') parts.push('shift');
      if (ev.altKey) parts.push('alt');

      let k = ev.key.toLowerCase();
      // IME Telex/VNI fallback using physical code
      if (k === 'process' && ev.code) {
        const code = ev.code;
        if (code.startsWith('Key')) {
          k = code.substring(3).toLowerCase();
        } else if (code.startsWith('Digit')) {
          k = code.substring(5);
        } else if (code === 'Space') {
          k = 'space';
        }
      }

      if (k !== 'control' && k !== 'meta' && k !== 'shift' && k !== 'alt') {
        if (ev.code === 'Space' || k === 'space') parts.push('space');
        else parts.push(k);
      }
      return parts.join('+');
    };

    const handleListenKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const pressed = getEventHotkeyString(e);
      if (!pressed) return;

      if (listeningKeyFor === 'newClone') {
        setNewCloneHotkey(pressed);
      } else {
        setDraftHotkeys(prev => ({
          ...prev,
          [listeningKeyFor]: pressed
        }));
      }
      setListeningKeyFor(null);
    };

    window.addEventListener('keydown', handleListenKey, true);
    return () => {
      window.removeEventListener('keydown', handleListenKey, true);
    };
  }, [listeningKeyFor]);

  const handleSaveSettings = async () => {
    if (newCloneName.trim()) {
      alert("Bạn chưa nhấn nút 'Thêm Bút' (hoặc 'Lưu Thay Đổi') để thêm/cập nhật bút clone mới vào danh sách. Vui lòng nhấn nút đó trước khi click 'Lưu cài đặt'!");
      return;
    }
    setIsSavingSettings(true);
    try {
      const payload = {
        customHotkeys: draftHotkeys,
        clonedTools: draftClonedTools,
        eraserTargets: draftEraserTargets,
        eraserMode: draftEraserMode,
        fontFamily: draftFontFamily
      };

      const res = await fetch("/api/admin/draw-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCustomHotkeys(draftHotkeys);
        setClonedTools(draftClonedTools);
        setEraserTargets(draftEraserTargets);
        setEraserMode(draftEraserMode);
        setFontSize(draftFontSize);
        setFontFamily(draftFontFamily);
        localStorage.setItem('webtoeic_custom_hotkeys', JSON.stringify(draftHotkeys));
        localStorage.setItem('webtoeic_cloned_tools', JSON.stringify(draftClonedTools));
        localStorage.setItem('webtoeic_eraser_targets', JSON.stringify(draftEraserTargets));
        localStorage.setItem('webtoeic_eraser_mode', draftEraserMode);
        localStorage.setItem('webtoeic_font_size', draftFontSize.toString());
        localStorage.setItem('webtoeic_font_family', draftFontFamily);

        const { selectedId: currentSelectedId } = stateRef.current;
        if (currentSelectedId) {
          saveToUndoStack(elements);
          setElements(prev => prev.map(el => {
            if (el.id === currentSelectedId && (el.type === 'text' || el.type === 'callout')) {
              return { ...el, fontFamily: draftFontFamily };
            }
            return el;
          }));
        }
        setShowSettings(false);
      } else {
        alert("Lưu cài đặt thất bại! Hãy chắc chắn bạn đã đăng nhập tài khoản Admin.");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi lưu cấu hình.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getCanvasCoords = (clientX: number, clientY: number, canvas: HTMLCanvasElement, rect?: DOMRect) => {
    const r = rect || canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;
    const scaleX = r.width > 0 ? (logicalWidth / r.width) : 1;
    const scaleY = r.height > 0 ? (logicalHeight / r.height) : 1;
    return {
      x: (clientX - r.left) * scaleX,
      y: (clientY - r.top) * scaleY,
      rect: r
    };
  };

  // Khởi tạo Canvas size toàn màn hình sắc nét hỗ trợ Retina
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Đặt kích thước thực tế (backing store) nhân với DPR để nét vẽ siêu sắc nét
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Đặt kích thước hiển thị CSS
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Thiết lập lại ngữ cảnh vẽ
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;
      drawAllElements();
    }
  };

  useEffect(() => {
    if (isActive) {
      if (isShiftPressed) {
        document.body.classList.remove('drawing-mode-active');
      } else {
        document.body.classList.add('drawing-mode-active');
      }

      let styleEl = document.getElementById('drawing-mode-selection-blocker');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'drawing-mode-selection-blocker';
        styleEl.innerHTML = `
          body.drawing-mode-active,
          body.drawing-mode-active *,
          body.drawing-mode-active .select-text {
            user-select: none !important;
            -webkit-user-select: none !important;
            -webkit-touch-callout: none !important;
          }
        `;
        document.head.appendChild(styleEl);
      }

      return () => {
        document.body.classList.remove('drawing-mode-active');
        const el = document.getElementById('drawing-mode-selection-blocker');
        if (el) el.remove();
      };
    }
  }, [isActive, isShiftPressed]);

  useEffect(() => {
    if (!isActive) {
      setScrollContainers([]);
      return;
    }

    const updateContainers = () => {
      const list = Array.from(document.querySelectorAll('.webtoeic-scroll-container')) as HTMLElement[];
      setScrollContainers(list);
    };

    const recoverAnchors = () => {
      const currentElements = stateRef.current.elements;
      if (!currentElements || currentElements.length === 0) return;

      let hasChanges = false;
      const nextElements = currentElements.map(el => {
        if (el.anchorSelector) {
          let found = null;
          try {
            found = document.querySelector(el.anchorSelector);
          } catch (e) {}
          if (!found && el.textContent && el.textHash) {
            let containerEl: Element | null = null;
            if (el.containerSelector) {
              try {
                containerEl = document.querySelector(el.containerSelector);
              } catch (e) {}
            }
            const root = containerEl || document;
            const candidates = Array.from(root.querySelectorAll('span, p, li, h1, h2, h3, h4, h5, h6, tr, td, div'));
            for (const cand of candidates) {
              const candText = cand.textContent || "";
              const normCandText = normalizeText(candText);
              const hash = calculateTextHash(candText);
              if (hash === el.textHash && normCandText === el.textContent) {
                const newSelector = generateUniqueSelector(cand as HTMLElement);
                hasChanges = true;
                return {
                  ...el,
                  anchorSelector: newSelector
                };
              }
            }
          }
        }
        return el;
      });

      if (hasChanges) {
        setElements(nextElements);
      }
    };

    updateContainers();

    let debounceTimer: NodeJS.Timeout | null = null;
    const debouncedUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateContainers();
        recoverAnchors();
        setDomUpdateKey(prev => prev + 1);
      }, 50);
    };

    const observer = new MutationObserver((mutations) => {
      // Bỏ qua các thay đổi DOM xảy ra bên trong khung soạn thảo văn bản, toolbar hoặc vùng vẽ để tránh nghẽn CPU khi gõ chữ
      const hasValidMutation = mutations.some(m => {
        const target = m.target as HTMLElement;
        if (target.closest && (
          target.closest('[data-text-editor-wrapper="true"]') ||
          target.closest('.' + styles.canvasContainer) ||
          target.closest('[class*="toolbar"]')
        )) {
          return false;
        }
        return true;
      });
      if (hasValidMutation) {
        debouncedUpdate();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      // Khi bảng vẽ tắt nhưng canvas read-only đang hiển thị (có callout/elements),
      // cần khởi tạo context để drawAllElements() có thể vẽ lên canvas
      setTimeout(() => initCanvas(), 50);
      return;
    }

    let ticking = false;
    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;
    let resizeTimer: NodeJS.Timeout | null = null;

    const requestRedraw = () => {
      if (isDrawingRef.current) return; // Bỏ qua yêu cầu vẽ lại từ hệ thống khi người dùng đang vẽ
      if (!ticking) {
        window.requestAnimationFrame(() => {
          drawAllElements();
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleScrollCapture = () => {
      requestRedraw();
    };

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (isMounted) initCanvas();
      }, 50);
    };

    // Delay nhỏ để DOM render xong canvas
    timer = setTimeout(() => {
      if (!isMounted) return;
      initCanvas();
      window.addEventListener("resize", handleResize);
      window.addEventListener('scroll', handleScrollCapture, { capture: true, passive: true });
      window.addEventListener('webtoeic-toggle-global-draw-state', requestRedraw);
      window.addEventListener('webtoeic-toggle-global-draw', requestRedraw);
      window.addEventListener('transitionend', requestRedraw, { capture: true, passive: true });
      window.addEventListener('animationend', requestRedraw, { capture: true, passive: true });
    }, 50);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        requestRedraw();
      });
      resizeObserver.observe(document.body);

      // Quan sát thêm các vùng chứa chính của giao diện có thể co giãn khi đóng/mở sidebar
      const mainEl = document.querySelector('main');
      if (mainEl) resizeObserver.observe(mainEl);

      const flexEl = document.querySelector('.flex-1');
      if (flexEl) resizeObserver.observe(flexEl);

      const sidebarEl = document.querySelector('[class*="sidebar"]');
      if (sidebarEl) resizeObserver.observe(sidebarEl);

      const playerEl = document.querySelector('[class*="Player"]');
      if (playerEl) resizeObserver.observe(playerEl);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('scroll', handleScrollCapture, { capture: true });
      window.removeEventListener('webtoeic-toggle-global-draw-state', requestRedraw);
      window.removeEventListener('webtoeic-toggle-global-draw', requestRedraw);
      window.removeEventListener('transitionend', requestRedraw, { capture: true });
      window.removeEventListener('animationend', requestRedraw, { capture: true });
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isActive]);

  // Vẽ lại canvas khi biến đèn chiếu hoặc layout DOM thay đổi
  useEffect(() => {
    drawAllElements();
  }, [isFlashlightActive, flashlightSize, flashlightShape, domUpdateKey]);

  // Ngăn chặn Safari trên iPad/iOS tự động nhận diện gestures cuộn/phóng to gây mất nét (pointercancel)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const preventDefaultTouch = (e: Event) => {
      if (tool !== 'cursor') {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventDefaultTouch as any, { passive: false });
    canvas.addEventListener('touchmove', preventDefaultTouch as any, { passive: false });
    canvas.addEventListener('gesturestart', preventDefaultTouch as any, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefaultTouch as any);
      canvas.removeEventListener('touchmove', preventDefaultTouch as any);
      canvas.removeEventListener('gesturestart', preventDefaultTouch as any);
    };
  }, [isActive, tool]);

  // Lắng nghe di chuyển chuột toàn màn hình cho Đèn chiếu (kể cả khi không vẽ)
  useEffect(() => {
    if (!isFlashlightActive || !isActive) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mousePosRef.current = { x, y };
      drawAllElements();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
    };
  }, [isFlashlightActive, isActive]);


  // Hàm Redraw toàn bộ đối tượng Vector vẽ trên màn hình
  const drawAllElements = () => {
    try {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;

    // Destructure all needed states from stateRef.current to avoid stale closure issues (e.g. inside pointer move listeners)
    const {
      isFlashlightActive,
      flashlightSize,
      flashlightShape,
      elements,
      selectedId,
      color,
      tool,
      pencilSize,
      highlightSize,
      eraserSize,
      penStyle,
      eraserTargets,
      eraserMode,
      textInput,
      calloutArrowPos,
    } = stateRef.current;

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      // Luôn dùng cơ chế vẽ tay góc bo thủ công để đảm bảo an toàn tuyệt đối,
      // tránh mọi lỗi ném Exception của hàm roundRect gốc trên một số trình duyệt
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // 1. Dọn dẹp canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bắt buộc reset các trạng thái đồ hoạ mặc định để tránh lỗi rò rỉ độ mờ/màu của bút dạ quang!
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    // 2. NẾU ĐANG BẬT CHẾ ĐỘ ĐÈN CHIẾU (Flashlight / Spotlight) -> Vẽ Đèn chiếu TRƯỚC TIÊN
    if (isFlashlightActive) {
      ctx.save();

      ctx.beginPath();
      // Vẽ hình chữ nhật bao phủ toàn bộ màn hình (Outer path)
      ctx.rect(0, 0, window.innerWidth, window.innerHeight);

      // Vẽ hình học đèn chiếu bên trong (Inner path) tại vị trí trỏ chuột
      const { x, y } = mousePosRef.current;
      const size = flashlightSize; // Bán kính hình tròn hoặc nửa chiều rộng hình chữ nhật

      if (flashlightShape === 'circle') {
        ctx.arc(x, y, size, 0, Math.PI * 2);
      } else {
        // Vẽ hình chữ nhật bo góc rải sáng tại tâm trỏ chuột
        const rx = size * 1.5; // Rộng hơn cao một chút để rọi sáng văn bản
        const ry = size * 0.8;
        drawRoundRect(x - rx, y - ry, rx * 2, ry * 2, 8);
      }

      // Tô màu tối phủ ngoài bằng quy tắc 'evenodd' (Outer path XOR Inner path)
      // Giúp đục lỗ sáng 100% trong veo tự nhiên, tránh được mọi lỗi GPU/Alpha Composition của trình duyệt
      ctx.fillStyle = "rgba(15, 23, 42, 0.65)"; // Màu tối mờ đẹp (Slate 900)
      ctx.fill('evenodd');

      ctx.restore();
    }

    const drawElement = (el: DrawElement) => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.size;

      const isSelected = el.id === selectedId;

      ctx.save();

      // Nếu đối tượng được chọn, tạo bóng mờ phát sáng nhẹ màu xanh dương để học viên nhận biết
      if (isSelected) {
        ctx.shadowColor = '#3B82F6';
        ctx.shadowBlur = 8;
      }

      if (el.type === 'pencil' || el.type === 'highlight') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = el.type === 'highlight' ? 0.35 : 1.0;
        ctx.lineCap = el.type === 'highlight' ? 'square' : 'round';
        ctx.lineJoin = el.type === 'highlight' ? 'miter' : 'round';

        if (el.points.length > 0) {
          if (el.points.length === 1) {
            // Dot Event: chỉ 1 điểm (tap/dot) -> vẽ hình tròn nhỏ
            ctx.beginPath();
            const dotR = (el.size / 2) * (el.points[0].pressure ?? 0.5);
            ctx.arc(el.points[0].x, el.points[0].y, Math.max(0.8, dotR), 0, 2 * Math.PI);
            ctx.fill();
          } else if (el.points.length === 2) {
            // 2 điểm sát nhau (micro-stroke) -> vẽ thẳng đơn giản
            const style = el.type === 'pencil' ? (el.penStyle || 'ballpoint') : 'ballpoint';
            const pressure = el.points[1].pressure ?? 0.5;
            let thickness = el.size;
            if (style === 'ballpoint') thickness = el.size * (0.85 + pressure * 0.15);
            else if (style === 'fountain') thickness = el.size * (0.45 + pressure * 0.95);
            else if (style === 'brush') thickness = el.size * (0.1 + pressure * 2.1);
            ctx.lineWidth = el.type === 'pencil' ? thickness : el.size;
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            ctx.lineTo(el.points[1].x, el.points[1].y);
            ctx.stroke();
          } else {
            if (el.type === 'pencil') {
              const style = el.penStyle || 'ballpoint';
              // Bezier bậc 2: vẽ mỗi segment qua điểm trung điểm làm anchor -> nét cực mượt
              for (let i = 1; i < el.points.length; i++) {
                const ptPrev = el.points[i - 1];
                const ptCurr = el.points[i];
                const pressure = ptCurr.pressure !== undefined ? ptCurr.pressure : 0.5;

                let thickness = el.size;
                if (style === 'ballpoint') {
                  thickness = el.size * (0.85 + pressure * 0.15);
                } else if (style === 'fountain') {
                  thickness = el.size * (0.45 + pressure * 0.95);
                } else if (style === 'brush') {
                  thickness = el.size * (0.1 + pressure * 2.1);
                }

                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(ptPrev.x, ptPrev.y);

                // Nếu có điểm kế tiếp, dùng midpoint làm điểm đích Bezier
                if (i < el.points.length - 1) {
                  const ptNext = el.points[i + 1];
                  const midX = (ptCurr.x + ptNext.x) / 2;
                  const midY = (ptCurr.y + ptNext.y) / 2;
                  ctx.quadraticCurveTo(ptCurr.x, ptCurr.y, midX, midY);
                } else {
                  ctx.lineTo(ptCurr.x, ptCurr.y);
                }
                ctx.stroke();
              }
            } else {
              // Highlight: Bezier nhẹ qua midpoints để tránh răng cưa góc cạnh
              ctx.lineWidth = el.size;
              ctx.beginPath();
              ctx.moveTo(el.points[0].x, el.points[0].y);
              for (let i = 1; i < el.points.length - 1; i++) {
                const midX = (el.points[i].x + el.points[i + 1].x) / 2;
                const midY = (el.points[i].y + el.points[i + 1].y) / 2;
                ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, midX, midY);
              }
              const last = el.points[el.points.length - 1];
              ctx.lineTo(last.x, last.y);
              ctx.stroke();
            }
          }
        }
      }
      else if (el.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          if (el.points.length === 1) {
            ctx.lineTo(el.points[0].x + 0.1, el.points[0].y + 0.1);
          } else {
            for (let i = 1; i < el.points.length; i++) {
              ctx.lineTo(el.points[i].x, el.points[i].y);
            }
          }
          ctx.stroke();
        }
      }
      else if (el.type === 'rectangle') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
          ctx.beginPath();
          ctx.rect(el.x, el.y, el.width, el.height);

          // Đổ màu highlight nhẹ nhàng bên trong hình chữ nhật
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = el.color;
          ctx.fill();
          ctx.restore();

          // Vẽ viền ngoài mỏng mịn thanh mảnh như GoodNotes
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = el.color;
          ctx.lineWidth = 0.5; // viền siêu mảnh 0.5px
          ctx.stroke();
          ctx.restore();
        }
      }
      else if (el.type === 'circle') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (el.x !== undefined && el.y !== undefined && el.radius !== undefined) {
          ctx.beginPath();
          ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      else if (el.type === 'ellipse') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (el.x !== undefined && el.y !== undefined && el.rx !== undefined && el.ry !== undefined) {
          ctx.beginPath();
          ctx.ellipse(el.x, el.y, el.rx, el.ry, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      else if (el.type === 'text') {
        // Nếu phần tử đang được sửa đổi thì ẩn đi trên canvas vì đã có textarea hiển thị đè lên
        if (el.id === stateRef.current.editingTextId) {
          ctx.restore();
          return;
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        // textBaseline 'top' được set ngay trước fillText để tránh bị save/restore reset

        if (el.x !== undefined && el.y !== undefined && el.text) {
          const lines = wrapTextLines(el.text, getMaxWrapWidth(), el.size, el.textStyle, el.fontFamily);
          let maxLineWidth = 0;
          ctx.save();
          lines.forEach(line => {
            const cleanLine = stripMarkdownTags(line);
            ctx.font = getElementFont(el.size, el.textStyle, el.fontFamily);
            const w = ctx.measureText(cleanLine).width;
            if (w > maxLineWidth) maxLineWidth = w;
          });
          ctx.restore();

          const linesCount = lines.length;
          const paddingX = 6;
          const paddingY = 5; // khớp với HTML editor (padding: "5px 6px")
          const rectX = el.x;
          const rectY = el.y;
          const rectW = maxLineWidth + paddingX * 2;
          const rectH = el.size * linesCount * 1.2 + paddingY * 2;

          // 1. Vẽ màu nền nếu có cấu hình
          if (el.textBgColor) {
            ctx.save();
            ctx.fillStyle = el.textBgColor;
            ctx.globalAlpha = el.textBgOpacity !== undefined ? el.textBgOpacity : 1.0;
            ctx.beginPath();
            drawRoundRect(rectX, rectY, rectW, rectH, 4);
            ctx.fill();
            ctx.restore();
          }

          // 2. Vẽ viền nếu có cấu hình
          if (el.textHasBorder) {
            ctx.save();
            ctx.strokeStyle = el.color; // sử dụng màu chữ để vẽ viền hài hoà
            ctx.lineWidth = el.textBorderWidth || 1;
            ctx.beginPath();
            drawRoundRect(rectX, rectY, rectW, rectH, 4);
            ctx.stroke();
            ctx.restore();
          }

          // 3. Vẽ chữ
          lines.forEach((line, lineIndex) => {
            const startX = el.x! + paddingX;
            const lineHeight = el.size * 1.2;
            // textBaseline='top': Y là đỉnh EM square, khớp với cách CSS render lineHeight
            const startY = el.y! + paddingY + lineIndex * lineHeight;
            let currentX = startX;

            ctx.textBaseline = 'alphabetic';
            const tokens = parseMarkdownLine(line);

            tokens.forEach(tok => {
              let tokenTextStyle = el.textStyle;
              if (tok.bold && tok.italic) {
                tokenTextStyle = "bold-italic";
              } else if (tok.bold) {
                tokenTextStyle = "bold";
              } else if (tok.italic) {
                tokenTextStyle = "italic";
              } else {
                tokenTextStyle = undefined;
              }
              
              ctx.font = getElementFont(el.size, tokenTextStyle, el.fontFamily);
              ctx.fillStyle = tok.color || el.color;
              ctx.fillText(tok.text, currentX, startY + el.size * 0.82);

              const wordWidth = ctx.measureText(tok.text).width;

              if (tok.underline) {
                ctx.save();
                ctx.strokeStyle = tok.color || el.color;
                ctx.lineWidth = Math.max(1, el.size / 15);
                ctx.beginPath();
                // underline dưới đáy chữ (baseline='top': size*0.9)
                const underlineY = startY + el.size * 0.9;
                ctx.moveTo(currentX, underlineY);
                ctx.lineTo(currentX + wordWidth, underlineY);
                ctx.stroke();
                ctx.restore();
              }

              if (tok.strikethrough) {
                ctx.save();
                ctx.strokeStyle = tok.color || el.color;
                ctx.lineWidth = Math.max(1, el.size / 15);
                ctx.beginPath();
                // strikethrough giữa chiều cao chữ (baseline='top': size*0.45)
                const strikeY = startY + el.size * 0.45;
                ctx.moveTo(currentX, strikeY);
                ctx.lineTo(currentX + wordWidth, strikeY);
                ctx.stroke();
                ctx.restore();
              }

              currentX += wordWidth;
            });
          });
        }
      }
      else if (el.type === 'callout') {
        if (el.id === stateRef.current.editingTextId) {
          ctx.restore();
          return;
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        // textBaseline 'top' được set ngay trước fillText để tránh bị save/restore reset

        if (el.x !== undefined && el.y !== undefined && el.text) {
          const lines = wrapTextLines(el.text, getMaxWrapWidth(), el.size, el.textStyle, el.fontFamily);
          let maxLineWidth = 0;
          ctx.save();
          lines.forEach(line => {
            const cleanLine = stripMarkdownTags(line);
            ctx.font = getElementFont(el.size, el.textStyle, el.fontFamily);
            const w = ctx.measureText(cleanLine).width;
            if (w > maxLineWidth) maxLineWidth = w;
          });
          ctx.restore();

          const paddingX = 6;
          const paddingY = 5; // khớp với HTML editor (padding: "5px 6px")
          const rectX = el.x;
          const rectY = el.y;
          const rectW = maxLineWidth + paddingX * 2;
          const rectH = el.size * lines.length * 1.2 + paddingY * 2;

          // 1. Draw arrow pointing to anchor (behind the box)
          if (el.arrowX !== undefined && el.arrowY !== undefined) {
            ctx.save();
            ctx.strokeStyle = el.color;
            ctx.fillStyle = el.color;
            ctx.lineWidth = el.textBorderWidth || 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const conn = getCalloutConnectionPoint(rectX, rectY, rectW, rectH, el.arrowX, el.arrowY);
            const startX = conn.x;
            const startY = conn.y;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(el.arrowX, el.arrowY);
            ctx.stroke();

            // Arrow head
            const theta = Math.atan2(el.arrowY - startY, el.arrowX - startX);
            const headlen = 10;
            ctx.beginPath();
            ctx.moveTo(el.arrowX, el.arrowY);
            ctx.lineTo(el.arrowX - headlen * Math.cos(theta - Math.PI / 6), el.arrowY - headlen * Math.sin(theta - Math.PI / 6));
            ctx.lineTo(el.arrowX - headlen * Math.cos(theta + Math.PI / 6), el.arrowY - headlen * Math.sin(theta + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // 2. Draw text box background
          const hasBg = el.textBgColor || '#ffffff';
          if (hasBg) {
            ctx.save();
            ctx.fillStyle = hasBg;
            ctx.globalAlpha = el.textBgOpacity !== undefined ? el.textBgOpacity : 1.0;
            ctx.beginPath();
            drawRoundRect(rectX, rectY, rectW, rectH, 4);
            ctx.fill();
            ctx.restore();
          }

          // 3. Draw text box border - tôn trọng cài đặt textHasBorder của người dùng
          if (el.textHasBorder !== false) {
            ctx.save();
            ctx.strokeStyle = el.color;
            ctx.lineWidth = el.textBorderWidth || 1.5;
            ctx.beginPath();
            drawRoundRect(rectX, rectY, rectW, rectH, 4);
            ctx.stroke();
            ctx.restore();
          }

          // 4. Draw text lines
          lines.forEach((line, lineIndex) => {
            const startX = el.x! + paddingX;
            const lineHeight = el.size * 1.2;
            // textBaseline='top': Y là đỉnh EM square, được set ngay trước fillText
            const startY = el.y! + paddingY + lineIndex * lineHeight;
            let currentX = startX;

            ctx.textBaseline = 'alphabetic';
            const tokens = parseMarkdownLine(line);
            tokens.forEach(tok => {
              let tokenTextStyle = el.textStyle;
              if (tok.bold && tok.italic) {
                tokenTextStyle = "bold-italic";
              } else if (tok.bold) {
                tokenTextStyle = "bold";
              } else if (tok.italic) {
                tokenTextStyle = "italic";
              } else {
                tokenTextStyle = undefined;
              }
              
              ctx.font = getElementFont(el.size, tokenTextStyle, el.fontFamily);
              ctx.fillStyle = tok.color || el.color;
              ctx.fillText(tok.text, currentX, startY + el.size * 0.82);

              const wordWidth = ctx.measureText(tok.text).width;

              if (tok.underline) {
                ctx.save();
                ctx.strokeStyle = tok.color || el.color;
                ctx.lineWidth = Math.max(1, el.size / 15);
                ctx.beginPath();
                // underline dưới đáy chữ (baseline='top': size*0.9)
                const underlineY = startY + el.size * 0.9;
                ctx.moveTo(currentX, underlineY);
                ctx.lineTo(currentX + wordWidth, underlineY);
                ctx.stroke();
                ctx.restore();
              }

              if (tok.strikethrough) {
                ctx.save();
                ctx.strokeStyle = tok.color || el.color;
                ctx.lineWidth = Math.max(1, el.size / 15);
                ctx.beginPath();
                // strikethrough giữa chiều cao chữ (baseline='top': size*0.45)
                const strikeY = startY + el.size * 0.45;
                ctx.moveTo(currentX, strikeY);
                ctx.lineTo(currentX + wordWidth, strikeY);
                ctx.stroke();
                ctx.restore();
              }

              currentX += wordWidth;
            });
          });
        }
      }

      ctx.restore();

      // Nếu đang chọn vẽ hình học/text, hiển thị thêm khung bao ngoài đứt nét màu xanh dương
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.8;

        let bx1 = 0, by1 = 0, bx2 = 0, by2 = 0; // bounding box corners

        ctx.beginPath();
        if (el.type === 'rectangle' && el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
          bx1 = Math.min(el.x, el.x + el.width) - 4;
          by1 = Math.min(el.y, el.y + el.height) - 4;
          bx2 = Math.max(el.x, el.x + el.width) + 4;
          by2 = Math.max(el.y, el.y + el.height) + 4;
          ctx.rect(bx1, by1, bx2 - bx1, by2 - by1);
        } else if (el.type === 'circle' && el.x !== undefined && el.y !== undefined && el.radius !== undefined) {
          bx1 = el.x - el.radius - 4;
          by1 = el.y - el.radius - 4;
          bx2 = el.x + el.radius + 4;
          by2 = el.y + el.radius + 4;
          ctx.arc(el.x, el.y, el.radius + 4, 0, 2 * Math.PI);
        } else if (el.type === 'ellipse' && el.x !== undefined && el.y !== undefined && el.rx !== undefined && el.ry !== undefined) {
          bx1 = el.x - el.rx - 4;
          by1 = el.y - el.ry - 4;
          bx2 = el.x + el.rx + 4;
          by2 = el.y + el.ry + 4;
          ctx.ellipse(el.x, el.y, el.rx + 4, el.ry + 4, 0, 0, 2 * Math.PI);
        } else if ((el.type === 'text' || el.type === 'callout') && el.x !== undefined && el.y !== undefined && el.text) {
          const lines = wrapTextLines(el.text, getMaxWrapWidth(), el.size, el.textStyle, el.fontFamily);
          let maxLineWidth = 0;
          ctx.save();
          lines.forEach(line => {
            // Loại bỏ dấu sao khi đo chiều rộng thực tế của chữ
            const cleanLine = stripMarkdownTags(line);
            ctx.font = getElementFont(el.size, el.textStyle, el.fontFamily);
            const w = ctx.measureText(cleanLine).width;
            if (w > maxLineWidth) maxLineWidth = w;
          });
          ctx.restore();

          const linesCount = lines.length;
          const paddingX = 6;
          const paddingY = 4;
          bx1 = el.x;
          by1 = el.y;
          bx2 = el.x + maxLineWidth + paddingX * 2;
          by2 = el.y + el.size * linesCount * 1.2 + paddingY * 2;
          ctx.rect(bx1, by1, bx2 - bx1, by2 - by1);
        } else if (el.points.length > 0) {
          // Bounding box giả lập cho nét vẽ tự do khi được chọn
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          el.points.forEach(pt => {
            minX = Math.min(minX, pt.x);
            maxX = Math.max(maxX, pt.x);
            minY = Math.min(minY, pt.y);
            maxY = Math.max(maxY, pt.y);
          });
          bx1 = minX - 4; by1 = minY - 4; bx2 = maxX + 4; by2 = maxY + 4;
          ctx.rect(bx1, by1, bx2 - bx1, by2 - by1);
        }
        ctx.stroke();
        ctx.restore();

        // Vẽ 4 nút kéo phóng to/thu nhỏ tại 4 góc bounding box (với hình học, text, bút chì, highlight)
        const canResize = el.type === 'rectangle' || el.type === 'circle' || el.type === 'ellipse' || el.type === 'text' || el.type === 'callout' || el.type === 'pencil' || el.type === 'highlight';
        if (canResize && (bx2 > bx1 || by2 > by1)) {
          const handles = [
            { x: bx1, y: by1 }, // nw
            { x: bx2, y: by1 }, // ne
            { x: bx2, y: by2 }, // se
            { x: bx1, y: by2 }, // sw
          ];
          handles.forEach(h => {
            ctx.save();
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);
            // Vòng ngoài màu xanh
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(h.x, h.y, 4.5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          });
        }
      }
    };

    // Phân loại nét vẽ dựa trên cấu hình cục tẩy chọn lọc
    const erasableElements: DrawElement[] = [];
    const eraserElements: DrawElement[] = [];
    const nonErasableElements: DrawElement[] = [];

    const pencilErasable = eraserTargets?.pencil ?? true;
    const highlightErasable = eraserTargets?.highlight ?? true;
    const shapesErasable = eraserTargets?.shapes ?? true;
    const textErasable = eraserTargets?.text ?? true;

    elements.forEach(el => {
      if (el.containerSelector) return;
      if (el.type === 'eraser') {
        eraserElements.push(el);
      } else {
        let isErasable = false;
        if (el.type === 'pencil') isErasable = pencilErasable;
        else if (el.type === 'highlight') isErasable = highlightErasable;
        else if (el.type === 'rectangle' || el.type === 'circle' || el.type === 'ellipse') isErasable = shapesErasable;
        else if (el.type === 'text' || el.type === 'callout') isErasable = textErasable;

        if (isErasable) {
          erasableElements.push(el);
        } else {
          nonErasableElements.push(el);
        }
      }
    });

    const canvasRect = canvas.getBoundingClientRect();

    // Gom nhóm toạ độ neo duy nhất để lưu vào cache
    const rectCache = new Map<string, DOMRect>();
    const containerCache = new Map<string, { rect: DOMRect; scrollLeft: number; scrollTop: number }>();
    elements.forEach(el => {
      if (el.anchorSelector) {
        const cacheKey = el.containerSelector ? `${el.containerSelector} ${el.anchorSelector}` : el.anchorSelector;
        if (!rectCache.has(cacheKey)) {
          let domEl: Element | null = null;
          try {
            if (el.containerSelector) {
              const containerEl = document.querySelector(el.containerSelector);
              if (containerEl) {
                if (el.anchorSelector === el.containerSelector) {
                  domEl = containerEl;
                } else {
                  domEl = containerEl.querySelector(el.anchorSelector);
                }
              }
            }
            if (!domEl) {
              domEl = document.querySelector(el.anchorSelector);
            }
          } catch (e) {
            console.warn("Invalid selector lookup:", el.anchorSelector);
          }
          if (domEl) {
            rectCache.set(cacheKey, domEl.getBoundingClientRect());
          }
        }
      }
      if (el.containerSelector && !containerCache.has(el.containerSelector)) {
        let domEl: Element | null = null;
        try {
          domEl = document.querySelector(el.containerSelector);
        } catch (e) {
          console.warn("Invalid selector lookup:", el.containerSelector);
        }
        if (domEl) {
          containerCache.set(el.containerSelector, {
            rect: domEl.getBoundingClientRect(),
            scrollLeft: domEl.scrollLeft,
            scrollTop: domEl.scrollTop
          });
        }
      }
    });

    const getTranslatedElementLocal = (el: DrawElement): DrawElement | null => {
      if (el.anchorSelector) {
        const cacheKey = el.containerSelector ? `${el.containerSelector} ${el.anchorSelector}` : el.anchorSelector;
        const rect = rectCache.get(cacheKey);
        if (!rect) {
          // Anchor không còn trong DOM (do scroll, trang thay đổi...) 
          // → vẽ ở tọa độ tuyệt đối (không dịch chuyển) thay vì bỏ qua hoàn toàn
          return {
            ...el,
            x: el.absoluteX !== undefined ? el.absoluteX : el.x,
            y: el.absoluteY !== undefined ? el.absoluteY : el.y,
            arrowX: el.absoluteArrowX !== undefined ? el.absoluteArrowX : el.arrowX,
            arrowY: el.absoluteArrowY !== undefined ? el.absoluteArrowY : el.arrowY
          };
        }

        const dx = rect.left - canvasRect.left;
        const dy = rect.top - canvasRect.top;

        return {
          ...el,
          x: el.x !== undefined ? el.x + dx : undefined,
          y: el.y !== undefined ? el.y + dy : undefined,
          arrowX: el.arrowX !== undefined ? el.arrowX + dx : undefined,
          arrowY: el.arrowY !== undefined ? el.arrowY + dy : undefined,
          points: el.points.map(pt => ({
            ...pt,
            x: pt.x + dx,
            y: pt.y + dy
          }))
        };
      } else if (el.containerSelector) {
        const info = containerCache.get(el.containerSelector);
        if (!info) {
          // Container không còn trong DOM → dùng tọa độ tuyệt đối
          return {
            ...el,
            x: el.absoluteX !== undefined ? el.absoluteX : el.x,
            y: el.absoluteY !== undefined ? el.absoluteY : el.y,
            arrowX: el.absoluteArrowX !== undefined ? el.absoluteArrowX : el.arrowX,
            arrowY: el.absoluteArrowY !== undefined ? el.absoluteArrowY : el.arrowY
          };
        }

        const dx = info.rect.left - canvasRect.left - info.scrollLeft;
        const dy = info.rect.top - canvasRect.top - info.scrollTop;

        return {
          ...el,
          x: el.x !== undefined ? el.x + dx : undefined,
          y: el.y !== undefined ? el.y + dy : undefined,
          arrowX: el.arrowX !== undefined ? el.arrowX + dx : undefined,
          arrowY: el.arrowY !== undefined ? el.arrowY + dy : undefined,
          points: el.points.map(pt => ({
            ...pt,
            x: pt.x + dx,
            y: pt.y + dy
          }))
        };
      }
      return el;
    };

    const drawTranslatedElement = (el: DrawElement) => {
      try {
        const translated = getTranslatedElementLocal(el);
        console.log("[Canvas Draw]", {
          id: el.id,
          type: el.type,
          text: el.text,
          anchor: el.anchorSelector,
          container: el.containerSelector,
          originalCoords: { x: el.x, y: el.y, arrowX: el.arrowX, arrowY: el.arrowY },
          translatedCoords: translated ? { x: translated.x, y: translated.y, arrowX: translated.arrowX, arrowY: translated.arrowY } : null,
          screenSize: { width: window.innerWidth, height: window.innerHeight }
        });
        if (!translated) return; // skip if anchor is missing/hidden
        drawElement(translated);
      } catch (err) {
        console.error("[Canvas Draw Error] Failed to draw element:", el, err);
      }
    };

    // 1. Vẽ toàn bộ đối tượng được phép tẩy trước
    erasableElements.forEach(drawTranslatedElement);

    // 2. Vẽ đè các nét tẩy lên (sẽ tẩy sạch các phần tử ở bước 1)
    eraserElements.forEach(drawTranslatedElement);

    // 3. Vẽ đè toàn bộ đối tượng KHÔNG được phép tẩy lên trên cùng (hoàn toàn nguyên vẹn)
    nonErasableElements.forEach(drawTranslatedElement);

    // 4. Vẽ nét vẽ nháp đang di chuột (Active Stroke) nếu đang vẽ trong chế độ Đèn chiếu
    if (isDrawingRef.current && activePointsRef.current.length > 0) {
      ctx.save();

      if (hasSnappedRef.current && recognizedShapeRef.current) {
        // Nếu đã nhận dạng và snap hình học chuẩn đẹp thành công dưới đèn chiếu
        const shape = recognizedShapeRef.current;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = tool === 'highlight' ? highlightSize : pencilSize;
        ctx.globalAlpha = tool === 'highlight' ? 0.35 : 1.0;
        ctx.lineCap = tool === 'highlight' ? 'square' : 'round';
        ctx.lineJoin = tool === 'highlight' ? 'miter' : 'round';

        ctx.beginPath();
        if (shape.type === 'rectangle' && shape.rect) {
          ctx.rect(shape.rect.x, shape.rect.y, shape.rect.w, shape.rect.h);

          ctx.save();
          ctx.globalAlpha = tool === 'highlight' ? 0.35 : 0.3; // giữ độ trong suốt mờ highlight chuẩn
          ctx.fillStyle = color;
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 0.5; // viền siêu mảnh
          ctx.stroke();
          ctx.restore();
        } else if (shape.type === 'circle' && shape.circle) {
          ctx.arc(shape.circle.cx, shape.circle.cy, shape.circle.radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (shape.type === 'ellipse' && shape.ellipse) {
          ctx.ellipse(shape.ellipse.cx, shape.ellipse.cy, shape.ellipse.rx, shape.ellipse.ry, 0, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (shape.type === 'line' && shape.line) {
          ctx.moveTo(shape.line.start.x, shape.line.start.y);
          ctx.lineTo(shape.line.end.x, shape.line.end.y);
          ctx.stroke();
        }
      } else if (tool === 'pencil') {
        // Khôi phục vẽ nhanh lineTo để tối ưu hiệu năng cọ vẽ
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = pencilSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(activePointsRef.current[0].x, activePointsRef.current[0].y);
        for (let i = 1; i < activePointsRef.current.length; i++) {
          ctx.lineTo(activePointsRef.current[i].x, activePointsRef.current[i].y);
        }
        ctx.stroke();
      } else if (tool === 'highlight') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = highlightSize;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(activePointsRef.current[0].x, activePointsRef.current[0].y);
        for (let i = 1; i < activePointsRef.current.length; i++) {
          ctx.lineTo(activePointsRef.current[i].x, activePointsRef.current[i].y);
        }
        ctx.stroke();
      } else if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = eraserSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(activePointsRef.current[0].x, activePointsRef.current[0].y);
        for (let i = 1; i < activePointsRef.current.length; i++) {
          ctx.lineTo(activePointsRef.current[i].x, activePointsRef.current[i].y);
        }
        ctx.stroke();
      } else if (tool === 'rectangle' || tool === 'circle') {
        const startPoint = activePointsRef.current[0];
        const lastPoint = activePointsRef.current[activePointsRef.current.length - 1];
        if (startPoint && lastPoint) {
          const w = lastPoint.x - startPoint.x;
          const h = lastPoint.y - startPoint.y;
          const tempEl: DrawElement = {
            id: 'temp-active-draw',
            type: tool,
            points: [],
            color: color,
            size: tool === 'circle' ? circleSize : rectangleSize,
            x: tool === 'circle' ? startPoint.x + w / 2 : startPoint.x,
            y: tool === 'circle' ? startPoint.y + h / 2 : startPoint.y,
            width: w,
            height: h,
            radius: tool === 'circle' ? Math.min(Math.abs(w), Math.abs(h)) / 2 : undefined
          };
          drawElement(tempEl);
        }
      }

      ctx.restore();
    } // Hết khối vẽ nét nháp

    // 5. Vẽ hình mũi tên và ô chữ nháp Callout ngay lập tức khi đang gõ chữ (chưa submit)
    if (textInput && calloutArrowPos) {
      const rect = canvas.getBoundingClientRect();
      const x = textInput.x + 4 - rect.left;
      const y = textInput.y + 2 - rect.top;

      const textVal = textInputValRef.current || "";
      const lines = wrapTextLines(textVal, getMaxWrapWidth(), fontSize);
      let maxLineWidth = 0;
      ctx.save();
      lines.forEach(line => {
        const cleanLine = stripMarkdownTags(line);
        ctx.font = getElementFont(fontSize);
        const w = ctx.measureText(cleanLine).width;
        if (w > maxLineWidth) maxLineWidth = w;
      });
      ctx.restore();

      const paddingX = 6;
      const paddingY = 5;
      const rectW = Math.max(80, maxLineWidth + paddingX * 2);
      const textBlockHeight = (lines.length - 1) * fontSize * 1.2 + fontSize;
      const rectH = Math.max(24, textBlockHeight + paddingY * 2);

      const activeClone = stateRef.current.clonedTools.find(c => c.id === stateRef.current.activeCloneId);
      const calloutColor = activeClone ? activeClone.color : color;
      const calloutBorderWidth = activeClone ? (activeClone.textBorderWidth || 1.5) : 1.5;
      const calloutBgColor = activeClone ? (activeClone.textBgColor || '#ffffff') : '#ffffff';
      const calloutBgOpacity = activeClone ? (activeClone.textBgOpacity !== undefined ? activeClone.textBgOpacity : 0.0) : 0.0;

      // Vẽ đường mũi tên trước
      ctx.save();
      ctx.strokeStyle = calloutColor;
      ctx.fillStyle = calloutColor;
      ctx.lineWidth = calloutBorderWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const conn = getCalloutConnectionPoint(x, y, rectW, rectH, calloutArrowPos.x, calloutArrowPos.y);
      const startX = conn.x;
      const startY = conn.y;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(calloutArrowPos.x, calloutArrowPos.y);
      ctx.stroke();

      // Đầu mũi tên
      const theta = Math.atan2(calloutArrowPos.y - startY, calloutArrowPos.x - startX);
      const headlen = 10;
      ctx.beginPath();
      ctx.moveTo(calloutArrowPos.x, calloutArrowPos.y);
      ctx.lineTo(calloutArrowPos.x - headlen * Math.cos(theta - Math.PI / 6), calloutArrowPos.y - headlen * Math.sin(theta - Math.PI / 6));
      ctx.lineTo(calloutArrowPos.x - headlen * Math.cos(theta + Math.PI / 6), calloutArrowPos.y - headlen * Math.sin(theta + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();

    }

    } catch (e) {
      console.error("drawAllElements crashed! error =", e);
    }
  };



  // Thuật toán Hit Testing tìm đối tượng gần click chuột nhất
  const findElementAtPosition = (x: number, y: number): DrawElement | null => {
    const canvas = canvasRef.current;
    const canvasRect = canvas?.getBoundingClientRect();

    // Duyệt ngược từ phần tử vẽ sau cùng lên đầu để ưu tiên chọn phần tử trên cùng
    for (let i = elements.length - 1; i >= 0; i--) {
      const originalEl = elements[i];
      const el = getTranslatedElement(originalEl, canvasRect);
      if (!el) continue;

      if (el.type === 'pencil' || el.type === 'highlight' || el.type === 'eraser') {
        for (let j = 0; j < el.points.length; j++) {
          const pt = el.points[j];
          const distance = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
          if (distance < el.size + 8) {
            return originalEl;
          }
        }
      }
      else if (el.type === 'rectangle') {
        if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
          const minX = Math.min(el.x, el.x + el.width);
          const maxX = Math.max(el.x, el.x + el.width);
          const minY = Math.min(el.y, el.y + el.height);
          const maxY = Math.max(el.y, el.y + el.height);
          if (x >= minX - 8 && x <= maxX + 8 && y >= minY - 8 && y <= maxY + 8) {
            return originalEl;
          }
        }
      }
      else if (el.type === 'circle') {
        if (el.x !== undefined && el.y !== undefined && el.radius !== undefined) {
          const distance = Math.sqrt((el.x - x) ** 2 + (el.y - y) ** 2);
          if (distance <= el.radius + 8) {
            return originalEl;
          }
        }
      }
      else if (el.type === 'ellipse') {
        if (el.x !== undefined && el.y !== undefined && el.rx !== undefined && el.ry !== undefined) {
          const normX = (x - el.x) / (el.rx + 8);
          const normY = (y - el.y) / (el.ry + 8);
          if (normX * normX + normY * normY <= 1) {
            return originalEl;
          }
        }
      }
      else if (el.type === 'text' || el.type === 'callout') {
        if (el.x !== undefined && el.y !== undefined && el.text) {
          // 1. Nhấp trúng đầu mũi tên của Callout
          if (el.type === 'callout' && tool === 'hand') {
            const arrowX = el.arrowX !== undefined ? el.arrowX : el.x;
            const arrowY = el.arrowY !== undefined ? el.arrowY : el.y;
            if (Math.abs(x - arrowX) <= 12 && Math.abs(y - arrowY) <= 12) {
              return originalEl;
            }
          }

          const lines = wrapTextLines(el.text, getMaxWrapWidth(), el.size, el.textStyle, el.fontFamily);
          let maxLineWidth = 0;
          const tempCtx = canvas?.getContext('2d');
          if (tempCtx && !originalEl.containerSelector) {
            tempCtx.save();
            lines.forEach(line => {
              const cleanLine = stripMarkdownTags(line);
              tempCtx.font = getElementFont(el.size, el.textStyle, el.fontFamily);
              const w = tempCtx.measureText(cleanLine).width;
              if (w > maxLineWidth) maxLineWidth = w;
            });
            tempCtx.restore();
          } else {
            lines.forEach(line => {
              const cleanLine = stripMarkdownTags(line);
              const w = el.size * cleanLine.length * 0.48;
              if (w > maxLineWidth) maxLineWidth = w;
            });
          }

          const paddingX = 6;
          const paddingY = el.type === 'callout' ? 5 : 4;
          const rectW = maxLineWidth + paddingX * 2;
          const rectH = el.size * lines.length * 1.2 + paddingY * 2;

          // 2. Nhấp trúng đường chỉ của mũi tên Callout (Đoạn thẳng từ cạnh hộp chữ đến đầu mũi tên)
          if (el.type === 'callout' && el.arrowX !== undefined && el.arrowY !== undefined) {
            const conn = getCalloutConnectionPoint(el.x, el.y, rectW, rectH, el.arrowX, el.arrowY);
            const px = x;
            const py = y;
            const x1 = conn.x;
            const y1 = conn.y;
            const x2 = el.arrowX;
            const y2 = el.arrowY;
            
            const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
            let dist = 999999;
            if (l2 === 0) {
              dist = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
            } else {
              let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
              t = Math.max(0, Math.min(1, t));
              dist = Math.sqrt((px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2);
            }
            
            if (dist <= 8) {
              return originalEl;
            }
          }

          // 3. Nhấp trúng khung hộp chữ nháp (Dung sai 4px)
          const hitW = el.type === 'callout' ? rectW : maxLineWidth;
          const hitH = el.type === 'callout' ? rectH : el.size * lines.length * 1.3;
          if (x >= el.x - 4 && x <= el.x + hitW + 4 && y >= el.y - 4 && y <= el.y + hitH + 4) {
            return originalEl;
          }
        }
      }
    }
    return null;
  };

  // Thuật toán kiểm tra chuột có nằm trên 4 góc kéo dãn (Resize Handle) của phần tử đang chọn hay không
  const getResizeHandleAtPosition = (x: number, y: number, originalEl: DrawElement): 'nw' | 'ne' | 'se' | 'sw' | 'arrow' | null => {
    if (!originalEl) return null;
    const canvas = canvasRef.current;
    const canvasRect = canvas?.getBoundingClientRect();
    const el = getTranslatedElement(originalEl, canvasRect);
    if (!el) return null;

    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    if (el.type === 'rectangle') {
      x1 = Math.min(el.x!, el.x! + el.width!) - 4;
      y1 = Math.min(el.y!, el.y! + el.height!) - 4;
      x2 = Math.max(el.x!, el.x! + el.width!) + 4;
      y2 = Math.max(el.y!, el.y! + el.height!) + 4;
    } else if (el.type === 'circle') {
      x1 = el.x! - el.radius! - 4;
      y1 = el.y! - el.radius! - 4;
      x2 = el.x! + el.radius! + 4;
      y2 = el.y! + el.radius! + 4;
    } else if (el.type === 'ellipse') {
      x1 = el.x! - el.rx! - 4;
      y1 = el.y! - el.ry! - 4;
      x2 = el.x! + el.rx! + 4;
      y2 = el.y! + el.ry! + 4;
    } else if (el.type === 'text' || el.type === 'callout') {
      x1 = el.x!;
      y1 = el.y!;

      const lines = wrapTextLines(el.text!, getMaxWrapWidth(), el.size, el.textStyle, el.fontFamily);
      let maxLineWidth = 0;
      const canvas = canvasRef.current;
      const tempCtx = canvas?.getContext('2d');
      if (tempCtx && !originalEl.containerSelector) {
        tempCtx.save();
        lines.forEach(line => {
          const cleanLine = stripMarkdownTags(line);
          tempCtx.font = getElementFont(el.size, el.textStyle, el.fontFamily);
          const w = tempCtx.measureText(cleanLine).width;
          if (w > maxLineWidth) maxLineWidth = w;
        });
        tempCtx.restore();
      } else {
        lines.forEach(line => {
          const cleanLine = stripMarkdownTags(line);
          const w = el.size * cleanLine.length * 0.48;
          if (w > maxLineWidth) maxLineWidth = w;
        });
      }
      const paddingX = 6;
      const paddingY = el.type === 'callout' ? 5 : 4;
      const width = maxLineWidth + paddingX * 2;
      const height = el.size * lines.length * 1.2 + paddingY * 2;

      x2 = el.x! + width;
      y2 = el.y! + height;
    } else if (el.type === 'pencil' || el.type === 'highlight') {
      if (!el.points || el.points.length === 0) return null;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      el.points.forEach(pt => {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      });
      x1 = minX - 4;
      y1 = minY - 4;
      x2 = maxX + 4;
      y2 = maxY + 4;
    } else {
      return null;
    }

    // Nếu là callout và nhấp gần đầu mũi tên
    if (originalEl.type === 'callout') {
      const arrowX = el.arrowX !== undefined ? el.arrowX : el.x!;
      const arrowY = el.arrowY !== undefined ? el.arrowY : el.y!;
      if (Math.abs(x - arrowX) <= 12 && Math.abs(y - arrowY) <= 12) {
        return 'arrow';
      }
    }

    const handleSize = 8; // Vùng sai số click node (8px)

    // Check Top-Left (nw)
    if (Math.abs(x - x1) <= handleSize && Math.abs(y - y1) <= handleSize) return 'nw';
    // Check Top-Right (ne)
    if (Math.abs(x - x2) <= handleSize && Math.abs(y - y1) <= handleSize) return 'ne';
    // Check Bottom-Right (se)
    if (Math.abs(x - x2) <= handleSize && Math.abs(y - y2) <= handleSize) return 'se';
    // Check Bottom-Left (sw)
    if (Math.abs(x - x1) <= handleSize && Math.abs(y - y2) <= handleSize) return 'sw';

    return null;
  };

  // Lưu trữ tham chiếu trạng thái mới nhất để tránh bind/unbind liên tục gây mất nhạy/trễ phím tắt trên Wacom
  const stateRef = useRef<{
    isActive: boolean;
    tool: DrawTool;
    selectedId: string | null;
    elements: DrawElement[];
    textInput: { x: number; y: number } | null;
    editingTextId: string | null;
    isGrabbingPage: boolean;
    colorSlots: DrawColor[];
    isFlashlightActive: boolean;
    flashlightSize: number;
    flashlightShape: 'circle' | 'rectangle';
    color: DrawColor;
    pencilSize: number;
    highlightSize: number;
    rectangleSize: number;
    circleSize: number;
    eraserSize: number;
    penStyle: 'ballpoint' | 'fountain' | 'brush';
    customHotkeys: Record<string, string>;
    clonedTools: ClonedTool[];
    activeCloneId: string | null;
    showSettings: boolean;
    lastActiveTool: DrawTool;
    eraserTargets: { pencil: boolean; highlight: boolean; shapes: boolean; text: boolean };
    eraserMode: 'stroke' | 'pixel';
    undoStack: DrawElement[][];
    redoStack: DrawElement[][];
    toolbarPos: { x: number; y: number };
    calloutArrowPos: { x: number; y: number } | null;
    fontFamily: string;
  }>({
    isActive,
    tool,
    selectedId,
    elements,
    undoStack: [],
    redoStack: [],
    textInput,
    editingTextId,
    isGrabbingPage,
    colorSlots,
    isFlashlightActive,
    flashlightSize,
    flashlightShape,
    color,
    pencilSize,
    highlightSize,
    rectangleSize,
    circleSize,
    eraserSize,
    penStyle,
    customHotkeys,
    clonedTools,
    activeCloneId,
    showSettings,
    lastActiveTool,
    eraserTargets: { pencil: true, highlight: true, shapes: true, text: true },
    eraserMode: 'pixel',
    toolbarPos: { x: 200, y: 120 },
    calloutArrowPos: null,
    fontFamily: 'sans-serif'
  });

  // Cập nhật đồng bộ ngay trong render body để bảo đảm stateRef.current luôn có giá trị mới nhất trước khi bất kỳ useEffect hay render nào diễn ra
  stateRef.current = {
    isActive,
    tool,
    selectedId,
    elements,
    textInput,
    editingTextId,
    isGrabbingPage,
    colorSlots,
    isFlashlightActive,
    flashlightSize,
    flashlightShape,
    color,
    pencilSize,
    highlightSize,
    rectangleSize,
    circleSize,
    eraserSize,
    penStyle,
    customHotkeys,
    clonedTools,
    activeCloneId,
    showSettings,
    lastActiveTool,
    eraserTargets,
    eraserMode,
    undoStack,
    redoStack,
    toolbarPos,
    calloutArrowPos,
    fontFamily,
  };


  // Đồng bộ màu sắc nhanh khi chọn phần tử bằng Bàn tay
  const updateColor = (newColor: DrawColor) => {
    setColor(newColor);
    setActiveCloneId(null); // Hủy kích hoạt bút clone nếu chọn màu thủ công để quay về trạng thái cọ mặc định
    const { selectedId: currentSelectedId } = stateRef.current;
    if (currentSelectedId) {
      saveToUndoStack(elements);
      setElements(prev => prev.map(el => el.id === currentSelectedId ? { ...el, color: newColor } : el));
    }
  };

  // Đồng bộ tăng/giảm size nhanh cho phần tử đang được chọn
  const updateSize = (type: 'pencil' | 'highlight' | 'eraser' | 'text' | 'rectangle' | 'circle', action: 'increase' | 'decrease') => {
    const isInc = action === 'increase';
    const { selectedId: currentSelectedId } = stateRef.current;
    if (currentSelectedId) {
      saveToUndoStack(elements);
    }
    if (type === 'pencil') {
      setPencilSize(prev => {
        const next = parseFloat((isInc ? Math.min(40, prev + 0.5) : Math.max(1, prev - 0.5)).toFixed(1));
        if (currentSelectedId) {
          setElements(elements => elements.map(el => el.id === currentSelectedId ? { ...el, size: next } : el));
        }
        return next;
      });
    } else if (type === 'highlight') {
      setHighlightSize(prev => {
        const next = parseFloat((isInc ? Math.min(60, prev + 0.5) : Math.max(4, prev - 0.5)).toFixed(1));
        if (currentSelectedId) {
          setElements(elements => elements.map(el => el.id === currentSelectedId ? { ...el, size: next } : el));
        }
        return next;
      });
    } else if (type === 'rectangle') {
      setRectangleSize(prev => {
        const next = parseFloat((isInc ? Math.min(40, prev + 0.5) : Math.max(0.5, prev - 0.5)).toFixed(1));
        if (currentSelectedId) {
          setElements(elements => elements.map(el => el.id === currentSelectedId ? { ...el, size: next } : el));
        }
        return next;
      });
    } else if (type === 'circle') {
      setCircleSize(prev => {
        const next = parseFloat((isInc ? Math.min(40, prev + 0.5) : Math.max(0.5, prev - 0.5)).toFixed(1));
        if (currentSelectedId) {
          setElements(elements => elements.map(el => el.id === currentSelectedId ? { ...el, size: next } : el));
        }
        return next;
      });
    } else if (type === 'eraser') {
      setEraserSize(prev => {
        const next = isInc ? Math.min(100, prev + 2) : Math.max(4, prev - 2);
        if (currentSelectedId) {
          setElements(elements => elements.map(el => el.id === currentSelectedId ? { ...el, size: next } : el));
        }
        return next;
      });
    } else if (type === 'text') {
      setFontSize(prev => {
        const next = isInc ? Math.min(80, prev + 1) : Math.max(10, prev - 1);
        if (currentSelectedId) {
          setElements(elements => elements.map(el => el.id === currentSelectedId ? { ...el, size: next } : el));
        }
        return next;
      });
    }
  };

  // Phím tắt bàn phím thông minh (IME-proof) - BIND DUY NHẤT 1 LẦN để đạt độ nhạy phản hồi 100%
  useEffect(() => {
    const getEventHotkeyString = (ev: KeyboardEvent): string => {
      let k = ev.key.toLowerCase();
      // IME Telex/VNI fallback using physical code
      if ((k === 'process' || ev.isComposing || k.length > 1 || !/^[a-z0-9]$/i.test(k)) && ev.code) {
        const code = ev.code;
        if (code.startsWith('Key')) {
          k = code.substring(3).toLowerCase();
        } else if (code.startsWith('Digit')) {
          k = code.substring(5);
        } else if (code === 'Space') {
          k = 'space';
        }
      }

      // Nếu chỉ nhấn phím bổ trợ đơn độc, không được xem là tổ hợp phím tắt
      if (k === 'control' || k === 'meta' || k === 'shift' || k === 'alt') {
        return '';
      }

      const parts: string[] = [];
      if (ev.ctrlKey || ev.metaKey) parts.push('ctrl');
      if (ev.shiftKey) parts.push('shift');
      if (ev.altKey) parts.push('alt');

      if (ev.code === 'Space' || k === 'space') parts.push('space');
      else parts.push(k);

      return parts.join('+');
    };

    const isTextEditableInput = (el: HTMLElement): boolean => {
      if (el.tagName === 'TEXTAREA') return true;
      if (el.isContentEditable) return true;
      if (el.tagName === 'INPUT') {
        const inputEl = el as HTMLInputElement;
        const nonTextTypes = ['radio', 'checkbox', 'button', 'submit', 'image', 'file', 'range', 'color', 'reset'];
        return !nonTextTypes.includes(inputEl.type);
      }
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tự động vẽ lại nhiều lần khi học viên bấm Ctrl+S / Ctrl+Shift+S để khớp toạ độ trong suốt 500ms hoạt họa co giãn giải thích
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        const redraw = () => {
          window.requestAnimationFrame(() => {
            drawAllElements();
          });
        };
        const intervals = [30, 80, 150, 220, 300, 380, 450, 520, 600, 750, 900, 1100];
        intervals.forEach(delay => {
          setTimeout(redraw, delay);
        });
      }

      // Nếu đang mở Modal cài đặt phím tắt, chặn hoàn toàn phím tắt toàn cục để tránh ghi đè/gõ chữ
      if (stateRef.current.showSettings) {
        return;
      }

      // 0. CHỨC NĂNG GHOST MODE: Tạm thời tắt vẽ để tương tác click/hover web bên dưới (như Figma/Photoshop)
      const pressedHotkeyCheck = getEventHotkeyString(e);
      const ghostmodeKey = stateRef.current.customHotkeys.ghostmode || 'space';
      if (pressedHotkeyCheck === ghostmodeKey.toLowerCase()) {
        const target = e.target as HTMLElement;
        const isInput = isTextEditableInput(target) || stateRef.current.textInput !== null;
        if (!isInput) {
          e.preventDefault(); // Ngăn trình duyệt cuộn trang/thao tác mặc định
          setIsShiftPressed(true); // Vẫn dùng biến isShiftPressed làm cờ Ghost Mode
        }
      }

      const { isActive: currentIsActive, tool: currentTool, selectedId: currentSelectedId, textInput: currentTextInput } = stateRef.current;
      const target = e.target as HTMLElement;

      // 1. KIỂM TRA INPUT SOẠN THẢO NHÁP ĐANG ACTIVE:
      const isInput = isTextEditableInput(target) || currentTextInput !== null; // Bảo vệ an toàn tuyệt đối khi đang mở ô gõ chữ nháp

      // Nếu đang trong ô gõ chữ, chặn toàn bộ phím tắt công cụ vẽ vẽ của window
      if (isInput) {
        // Chỉ cho phép xử lý phím Escape để đóng nhanh ô soạn thảo nháp
        if (e.key === 'Escape') {
          setTextInput(null);
        }
        return;
      }

      // Nếu bảng vẽ đang đóng, không cho phép phím tắt công cụ đơn lẻ chạy
      if (!currentIsActive) {
        return;
      }

      // Tính chuỗi phím tắt được nhấn
      const pressedHotkey = getEventHotkeyString(e);

      // A. KIỂM TRA PHÍM TẮT BÚT CLONE TRƯỚC (Để ghi đè lên các bút gốc nếu trùng phím)
      const matchedClone = pressedHotkey ? stateRef.current.clonedTools.find(
        clone => clone.hotkey && pressedHotkey === clone.hotkey.toLowerCase()
      ) : null;
      if (matchedClone) {
        e.preventDefault();
        setTool(matchedClone.baseType);
        setColor(matchedClone.color);
        setActiveCloneId(matchedClone.id);
        setSelectedId(null);
        if ((matchedClone.baseType === 'text' || matchedClone.baseType === 'callout') && matchedClone.textSize) {
          setFontSize(matchedClone.textSize);
        }
        return;
      }

      // B. DÒ TÌM PHÍM TẮT TÙY CHỈNH (Custom Hotkeys)
      const hotkeys = stateRef.current.customHotkeys;

      if (pressedHotkey && hotkeys.cursor && pressedHotkey === hotkeys.cursor) {
        e.preventDefault();
        setTool('cursor');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey && hotkeys.hand && pressedHotkey === hotkeys.hand) {
        e.preventDefault();
        if (stateRef.current.tool === 'hand') {
          // Nếu đang ở hình bàn tay mà bấm ESC (hoặc phím hotkey của hand) lần nữa,
          // thì tự động quay về công cụ trước đó (lastActiveTool)
          setTool(stateRef.current.lastActiveTool);
        } else {
          setTool('hand');
        }
        setActiveCloneId(null);
      } else if (pressedHotkey && hotkeys.pencil && pressedHotkey === hotkeys.pencil) {
        e.preventDefault();
        setTool('pencil');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey && hotkeys.highlight && pressedHotkey === hotkeys.highlight) {
        e.preventDefault();
        setTool('highlight');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey && hotkeys.flashlight && pressedHotkey === hotkeys.flashlight) {
        e.preventDefault();
        setIsFlashlightActive(prev => !prev);
      } else if (pressedHotkey && hotkeys.eraser && pressedHotkey === hotkeys.eraser) {
        e.preventDefault();
        setTool('eraser');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey && hotkeys.rectangle && pressedHotkey === hotkeys.rectangle) {
        e.preventDefault();
        setTool('rectangle');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey && hotkeys.circle && pressedHotkey === hotkeys.circle) {
        e.preventDefault();
        setTool('circle');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey && hotkeys.text && pressedHotkey === hotkeys.text) {
        e.preventDefault();
        setTool('text');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey && hotkeys.callout && pressedHotkey === hotkeys.callout) {
        e.preventDefault();
        setTool('callout');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey && hotkeys.color1 && pressedHotkey === hotkeys.color1) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[0]);
      } else if (pressedHotkey && hotkeys.color2 && pressedHotkey === hotkeys.color2) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[1]);
      } else if (pressedHotkey && hotkeys.color3 && pressedHotkey === hotkeys.color3) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[2]);
      } else if (pressedHotkey && hotkeys.color4 && pressedHotkey === hotkeys.color4) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[3]);
      } else if (pressedHotkey && hotkeys.color5 && pressedHotkey === hotkeys.color5) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[4]);
      } else if (pressedHotkey && hotkeys.color6 && pressedHotkey === hotkeys.color6) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[5]);
      } else if (pressedHotkey && hotkeys.clear && pressedHotkey === hotkeys.clear) {
        e.preventDefault();
        clearCanvas();
      }

      // Xử lý tăng giảm kích thước qua các phím chuẩn [ và ]
      else if (pressedHotkey === '[') {
        e.preventDefault();
        if (stateRef.current.isFlashlightActive) {
          setFlashlightSize(prev => Math.max(30, prev - 10));
        } else {
          const activeType = 
            currentTool === 'eraser' ? 'eraser' : 
            currentTool === 'text' ? 'text' : 
            currentTool === 'highlight' ? 'highlight' : 
            currentTool === 'rectangle' ? 'rectangle' : 
            currentTool === 'circle' ? 'circle' : 'pencil';
          updateSize(activeType, 'decrease');
        }
      } else if (pressedHotkey === ']') {
        e.preventDefault();
        if (stateRef.current.isFlashlightActive) {
          setFlashlightSize(prev => Math.min(300, prev + 10));
        } else {
          const activeType = 
            currentTool === 'eraser' ? 'eraser' : 
            currentTool === 'text' ? 'text' : 
            currentTool === 'highlight' ? 'highlight' : 
            currentTool === 'rectangle' ? 'rectangle' : 
            currentTool === 'circle' ? 'circle' : 'pencil';
          updateSize(activeType, 'increase');
        }
      }

      // Nhấn Ctrl+C / Cmd+C để Copy phần tử đang chọn
      const isCopy = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c';
      if (isCopy) {
        if (currentSelectedId) {
          e.preventDefault();
          const elToCopy = stateRef.current.elements.find(el => el.id === currentSelectedId);
          if (elToCopy) {
            copiedElementRef.current = elToCopy;
          }
        }
      }

      // Nhấn Ctrl+V / Cmd+V để Paste tạo bản sao
      const isPaste = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v';
      if (isPaste) {
        if (copiedElementRef.current) {
          e.preventDefault();
          const baseEl = copiedElementRef.current;
          const offset = 15; // Lệch 15px so với bản gốc để dễ nhận biết
          const newId = `${baseEl.id}_copy_${Date.now()}`;
          
          let pastedEl: DrawElement = {
            ...baseEl,
            id: newId,
          };
          
          if (baseEl.points && baseEl.points.length > 0) {
            pastedEl.points = baseEl.points.map(pt => ({
              ...pt,
              x: pt.x + offset,
              y: pt.y + offset
            }));
          }
          if (baseEl.x !== undefined) pastedEl.x = baseEl.x + offset;
          if (baseEl.y !== undefined) pastedEl.y = baseEl.y + offset;
          if (baseEl.arrowX !== undefined) pastedEl.arrowX = baseEl.arrowX + offset;
          if (baseEl.arrowY !== undefined) pastedEl.arrowY = baseEl.arrowY + offset;
          if (baseEl.absoluteX !== undefined) pastedEl.absoluteX = baseEl.absoluteX + offset;
          if (baseEl.absoluteY !== undefined) pastedEl.absoluteY = baseEl.absoluteY + offset;
          if (baseEl.absoluteArrowX !== undefined) pastedEl.absoluteArrowX = baseEl.absoluteArrowX + offset;
          if (baseEl.absoluteArrowY !== undefined) pastedEl.absoluteArrowY = baseEl.absoluteArrowY + offset;

          saveToUndoStack(stateRef.current.elements);
          setElements(prev => [...prev, pastedEl]);
          setSelectedId(newId);
          
          // Cập nhật ref để paste tiếp theo lệch tiếp 15px
          copiedElementRef.current = pastedEl;
        }
      }

      // Nhấn Backspace / Delete đơn lẻ để xoá duy nhất phần tử đang chọn hoặc tất cả nét vẽ của công cụ đang kích hoạt
      const isBackspaceOrDelete = (e.key === 'Backspace' || e.key === 'Delete' || e.code === 'Backspace' || e.code === 'Delete') && !e.isComposing;
      if (isBackspaceOrDelete) {
        if (!(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)) {
          if (currentSelectedId) {
            e.preventDefault();
            saveToUndoStack(stateRef.current.elements);
            setElements(prev => prev.filter(el => el.id !== currentSelectedId));
            setSelectedId(null);
          } else if (currentTool && currentTool !== 'cursor' && currentTool !== 'hand' && currentTool !== 'eraser') {
            e.preventDefault();
            saveToUndoStack(stateRef.current.elements);
            // Xóa toàn bộ phần tử thuộc loại công cụ đang kích hoạt trên toolbar
            setElements(prev => prev.filter(el => el.type !== currentTool));
          }
        }
      }

      // Nhấn Ctrl+Z / Cmd+Z để Undo
      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
      if (isUndo) {
        e.preventDefault();
        const { undoStack: currentUndoStack, redoStack: currentRedoStack } = stateRef.current;
        if (currentUndoStack.length > 0) {
          const prevState = currentUndoStack[currentUndoStack.length - 1];
          setUndoStack(prev => prev.slice(0, -1));
          setRedoStack(prev => [...prev, elements]);
          setElements(prevState);
          setSelectedId(null);
        }
        return;
      }

      // Nhấn Ctrl+Y / Cmd+Y hoặc Ctrl+Shift+Z / Cmd+Shift+Z để Redo
      const isRedo = ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z');
      if (isRedo) {
        e.preventDefault();
        const { undoStack: currentUndoStack, redoStack: currentRedoStack } = stateRef.current;
        if (currentRedoStack.length > 0) {
          const nextState = currentRedoStack[currentRedoStack.length - 1];
          setRedoStack(prev => prev.slice(0, -1));
          setUndoStack(prev => [...prev, elements]);
          setElements(nextState);
          setSelectedId(null);
        }
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const releasedHotkey = getEventHotkeyString(e);
      const ghostmodeKey = stateRef.current.customHotkeys.ghostmode || 'space';
      if (releasedHotkey === ghostmodeKey.toLowerCase()) {
        setIsShiftPressed(false);
      }
    };

    const handleBlur = () => {
      setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Xử lý kéo thả Toolbar di động
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    setIsDraggingToolbar(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: toolbarPos.x,
      posY: toolbarPos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingToolbar) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      setToolbarPos({
        x: Math.max(10, Math.min(window.innerWidth - 460, dragStartRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.posY + dy))
      });
    };

    const handleMouseUp = () => {
      setIsDraggingToolbar(false);
      if (typeof window !== 'undefined') {
        const storageKey = isLearnPage ? 'webtoeic_toolbar_pos_learn' : 'webtoeic_toolbar_pos_global';
        localStorage.setItem(storageKey, JSON.stringify(stateRef.current.toolbarPos));
      }
    };

    if (isDraggingToolbar) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingToolbar]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'cursor') return;

    if (e.pointerType === 'touch') return;

    // Ngăn chặn hành vi mặc định (chọn chữ, cử chỉ zoom/pan của Safari)
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const { x, y, rect } = getCanvasCoords(e.clientX, e.clientY, canvas);

    // Nếu nhấp vào ô chữ/callout đã tồn tại ở tool callout, không bắt đầu vẽ mới
    if (tool === 'callout') {
      const clickedElement = findElementAtPosition(x, y);
      if (clickedElement && (clickedElement.type === 'text' || clickedElement.type === 'callout')) {
        isDrawingRef.current = false;
        return;
      }
    }

    if (tool === 'text') {
      return; // Nhường hoàn toàn quyền xử lý tạo textInput cho sự kiện onClick
    }

    // Huỷ các timer nhận dạng hình nếu người dùng bắt đầu vẽ mới
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setShapePending(false);
    hasSnappedRef.current = false;
    recognizedShapeRef.current = null;
    lastMoveTimeRef.current = Date.now();
    lastMovePosRef.current = { x, y };

    // Với các tool khác mới tiến hành lấy pointer capture
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = { x, y };
    startPointRef.current = { x, y };



    if (tool === 'hand') {
      if (selectedId) {
        const selectedEl = elements.find(el => el.id === selectedId);
        if (selectedEl) {
          const handle = getResizeHandleAtPosition(x, y, selectedEl);
          if (handle) {
            saveToUndoStack(elements);
            canvas.setPointerCapture(e.pointerId);

            // Tính toán bounding box ban đầu cho bút chì / highlight
            let minX = 0, minY = 0, maxX = 0, maxY = 0;
            if ((selectedEl.type === 'pencil' || selectedEl.type === 'highlight') && selectedEl.points?.length > 0) {
              minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
              selectedEl.points.forEach(pt => {
                if (pt.x < minX) minX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y > maxY) maxY = pt.y;
              });
            }

            setResizingInfo({
              elementId: selectedEl.id,
              handle: handle,
              startX: x,
              startY: y,
              startElX: selectedEl.x || 0,
              startElY: selectedEl.y || 0,
              startWidth: selectedEl.width || 0,
              startHeight: selectedEl.height || 0,
              startRadius: selectedEl.radius || 0,
              startSize: selectedEl.size || 14,
              startArrowX: selectedEl.arrowX,
              startArrowY: selectedEl.arrowY,
              startAbsoluteX: selectedEl.absoluteX,
              startAbsoluteY: selectedEl.absoluteY,
              startAbsoluteArrowX: selectedEl.absoluteArrowX,
              startAbsoluteArrowY: selectedEl.absoluteArrowY,
              startPoints: selectedEl.points ? [...selectedEl.points.map(pt => ({ ...pt }))] : undefined,
              startBBox: (selectedEl.type === 'pencil' || selectedEl.type === 'highlight') ? { minX, minY, maxX, maxY } : undefined
            });
            return;
          }
        }
      }

      // 1. Chế độ Bàn tay: Tìm đối tượng được chọn dưới ngòi chuột
      const clickedElement = findElementAtPosition(x, y);
      if (clickedElement) {
        saveToUndoStack(elements);
        setSelectedId(clickedElement.id);
        isGrabbingPageRef.current = false;
        setIsGrabbingPage(false);
        scrollTargetRef.current = null;

        // Cho phép bắt đầu kéo thả handle ngay lập tức khi click chọn
        const handle = getResizeHandleAtPosition(x, y, clickedElement);
        if (handle) {
          setResizingInfo({
            elementId: clickedElement.id,
            handle: handle,
            startX: x,
            startY: y,
            startElX: clickedElement.x || 0,
            startElY: clickedElement.y || 0,
            startWidth: clickedElement.width || 0,
            startHeight: clickedElement.height || 0,
            startRadius: clickedElement.radius || 0,
            startSize: clickedElement.size || 14,
            startArrowX: clickedElement.arrowX,
            startArrowY: clickedElement.arrowY,
            startAbsoluteX: clickedElement.absoluteX,
            startAbsoluteY: clickedElement.absoluteY,
            startAbsoluteArrowX: clickedElement.absoluteArrowX,
            startAbsoluteArrowY: clickedElement.absoluteArrowY,
            startPoints: clickedElement.points ? [...clickedElement.points.map(pt => ({ ...pt }))] : undefined,
            startBBox: undefined
          });
          return;
        }
      } else {
        setSelectedId(null);
        isGrabbingPageRef.current = true;
        setIsGrabbingPage(true);

        // Kỹ thuật bypass Pointer-events tạm thời cực đỉnh để thực hiện hit test vùng cuộn bên dưới
        canvas.style.pointerEvents = 'none';
        const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        canvas.style.pointerEvents = textInput ? 'none' : 'auto';

        // Tìm vùng chứa (container/div) có thanh cuộn dọc gần nhất nằm dưới tọa độ chuột
        const findScrollable = (el: HTMLElement | null): HTMLElement | null => {
          if (!el) return null;

          const hasScrollableOverflow = (element: HTMLElement) => {
            const style = window.getComputedStyle(element);
            const overflowY = style.overflowY || style.overflow || '';
            const classNameStr = typeof element.className === 'string'
              ? element.className
              : (typeof element.className === 'object' && element.className !== null
                ? (element.className as any).baseVal || ''
                : '');
            const isScrollable = overflowY.includes('auto') ||
              overflowY.includes('scroll') ||
              overflowY.includes('overlay') ||
              classNameStr.includes('overflow-y-') ||
              classNameStr.includes('overflow-auto');
            return isScrollable && (element.scrollHeight - element.clientHeight > 1);
          };

          let parent = el;
          while (parent && parent !== document.documentElement && parent !== document.body) {
            if (hasScrollableOverflow(parent)) {
              return parent;
            }
            parent = parent.parentElement as HTMLElement;
          }
          return null;
        };

        const targetScroll = findScrollable(elementUnder);
        scrollTargetRef.current = targetScroll;
      }
    } else {
      saveToUndoStack(elements);
      // 2. Chế độ vẽ vẽ: Chụp snapshot canvas và khởi tạo toạ độ kèm lực nhấn ban đầu
      setSelectedId(null);
      const container = findScrollContainer(e.clientX, e.clientY);
      activeAnchorRef.current = findBestAnchor(e.clientX, e.clientY, canvas, container);

      // Nếu là Eraser, lập tức kiểm tra va chạm để xóa nét luôn khi click xuống
      const { eraserMode, eraserTargets } = stateRef.current;
      if (tool === 'eraser') {
        const eraserRadius = eraserSize / 2;
        if (eraserMode === 'stroke') {
          const toDeleteIds = new Set<string>();

          const pencilErasable = eraserTargets?.pencil ?? true;
          const highlightErasable = eraserTargets?.highlight ?? true;
          const shapesErasable = eraserTargets?.shapes ?? true;
          const textErasable = eraserTargets?.text ?? true;

          elements.forEach(el => {
            if (el.type === 'eraser') return;

            let isTarget = false;
            if (el.type === 'pencil') isTarget = pencilErasable;
            else if (el.type === 'highlight') isTarget = highlightErasable;
            else if (el.type === 'rectangle' || el.type === 'circle' || el.type === 'ellipse') isTarget = shapesErasable;
            else if (el.type === 'text' || el.type === 'callout') isTarget = textErasable;

            const translatedEl = getTranslatedElement(el, rect);
            if (translatedEl && isTarget && checkIntersection(x, y, translatedEl, eraserRadius)) {
              toDeleteIds.add(el.id);
            }
          });

          if (toDeleteIds.size > 0) {
            setElements(prev => prev.filter(el => !toDeleteIds.has(el.id)));
          }
        } else {
          // Pixel Eraser - thực hiện chia nét / xóa vật thể thật luôn với neo toạ độ
          performPixelErasing(x, y, eraserRadius);
        }
      }

      canvasSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const startPressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;
      lastWidthFactorRef.current = startPressure;
      activePointsRef.current = [{ x, y, pressure: startPressure, time: Date.now() }];

      if (tool === 'pencil' || tool === 'highlight') {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;

    if (tool !== 'cursor') {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Cache the bounding rect once at the beginning of the pointermove event to avoid layout thrashing
    const cachedRect = canvas.getBoundingClientRect();

    const nativeEvent = e.nativeEvent as any;
    let events: any[] = [nativeEvent];
    if (nativeEvent && typeof nativeEvent.getCoalescedEvents === 'function') {
      try {
        const coalesced = nativeEvent.getCoalescedEvents();
        if (coalesced && coalesced.length > 0) {
          events = Array.from(coalesced);
        }
      } catch (err) {
        console.warn("Failed to get coalesced events:", err);
      }
    }

    // Lấy toạ độ chuột hiện tại
    const lastEvent = events[events.length - 1] || nativeEvent;
    const { x, y, rect } = getCanvasCoords(lastEvent.clientX, lastEvent.clientY, canvas, cachedRect);

    // --- CHECK FOR RESIZE HANDLE HOVER ---
    if (tool === 'hand' && selectedId && !resizingInfo && !isDrawingRef.current) {
      const selectedEl = elements.find(el => el.id === selectedId);
      if (selectedEl) {
        const handle = getResizeHandleAtPosition(x, y, selectedEl);
        setHoveredResizeHandle(handle);
      } else {
        setHoveredResizeHandle(null);
      }
    } else if (tool === 'hand' && !selectedId) {
      if (hoveredResizeHandle !== null) setHoveredResizeHandle(null);
    }

    // --- ACTIVE RESIZE ACTION ---
    if (resizingInfo) {
      const { elementId, handle, startX, startY, startElX, startElY, startWidth, startHeight, startRadius, startSize, startArrowX, startArrowY, startAbsoluteX, startAbsoluteY, startAbsoluteArrowX, startAbsoluteArrowY, startPoints, startBBox } = resizingInfo;
      const dx = x - startX;
      const dy = y - startY;

      setElements(prev => prev.map(el => {
        if (el.id !== elementId) return el;

        if (el.type === 'rectangle') {
          let newWidth = startWidth;
          let newHeight = startHeight;
          let newX = startElX;
          let newY = startElY;

          if (handle === 'nw') {
            newWidth = startWidth - dx;
            newHeight = startHeight - dy;
            newX = startElX + dx;
            newY = startElY + dy;
          } else if (handle === 'ne') {
            newWidth = startWidth + dx;
            newHeight = startHeight - dy;
            newX = startElX;
            newY = startElY + dy;
          } else if (handle === 'se') {
            newWidth = startWidth + dx;
            newHeight = startHeight + dy;
            newX = startElX;
            newY = startElY;
          } else if (handle === 'sw') {
            newWidth = startWidth - dx;
            newHeight = startHeight + dy;
            newX = startElX + dx;
            newY = startElY;
          }

          if (newWidth < 10) {
            newX = el.x!; // giữ nguyên
            newWidth = 10;
          }
          if (newHeight < 10) {
            newY = el.y!; // giữ nguyên
            newHeight = 10;
          }

          return {
            ...el,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          };
        }
        else if (el.type === 'circle') {
          const translatedEl = getTranslatedElement(el, cachedRect) || el;
          const newRadius = Math.max(5, Math.sqrt((translatedEl.x! - x) ** 2 + (translatedEl.y! - y) ** 2));
          return {
            ...el,
            radius: newRadius
          };
        }
        else if (el.type === 'ellipse') {
          const translatedEl = getTranslatedElement(el, cachedRect) || el;
          const newRx = Math.max(5, Math.abs(x - translatedEl.x!));
          const newRy = Math.max(5, Math.abs(y - translatedEl.y!));
          return {
            ...el,
            rx: newRx,
            ry: newRy
          };
        }
        else if (el.type === 'text' || el.type === 'callout') {
          if (handle === 'arrow' && el.type === 'callout') {
            const finalArrowX = (startArrowX !== undefined ? startArrowX : startElX) + dx;
            const finalArrowY = (startArrowY !== undefined ? startArrowY : startElY) + dy;
            return {
              ...el,
              arrowX: finalArrowX,
              arrowY: finalArrowY,
              absoluteArrowX: startAbsoluteArrowX !== undefined ? startAbsoluteArrowX + dx : undefined,
              absoluteArrowY: startAbsoluteArrowY !== undefined ? startAbsoluteArrowY + dy : undefined
            };
          }

          const canvas = canvasRef.current;
          const canvasRect = canvas?.getBoundingClientRect();
          const translatedEl = getTranslatedElement(el, canvasRect);
          const absX = translatedEl ? (translatedEl.x ?? el.x ?? 0) : (el.x ?? 0);
          const absY = translatedEl ? (translatedEl.y ?? el.y ?? 0) : (el.y ?? 0);

          const origDiagonal = Math.sqrt((startX - absX) ** 2 + (startY - absY) ** 2);
          const currDiagonal = Math.sqrt((x - absX) ** 2 + (y - absY) ** 2);
          if (origDiagonal > 0) {
            const scale = currDiagonal / origDiagonal;
            const newSize = Math.min(120, Math.max(8, Math.round(startSize * scale)));
            return {
              ...el,
              size: newSize
            };
          }
        }
        else if (el.type === 'pencil' || el.type === 'highlight') {
          if (!startPoints || startPoints.length === 0 || !startBBox) return el;

          const { minX, minY, maxX, maxY } = startBBox;
          const startW = maxX - minX;
          const startH = maxY - minY;
          if (startW <= 0 || startH <= 0) return el;

          let anchorX = minX;
          let anchorY = minY;
          let newW = startW;
          let newH = startH;

          if (handle === 'nw') {
            anchorX = maxX;
            anchorY = maxY;
            newW = startW - dx;
            newH = startH - dy;
          } else if (handle === 'ne') {
            anchorX = minX;
            anchorY = maxY;
            newW = startW + dx;
            newH = startH - dy;
          } else if (handle === 'sw') {
            anchorX = maxX;
            anchorY = minY;
            newW = startW - dx;
            newH = startH + dy;
          } else if (handle === 'se') {
            anchorX = minX;
            anchorY = minY;
            newW = startW + dx;
            newH = startH + dy;
          }

          if (newW < 5) newW = 5;
          if (newH < 5) newH = 5;

          const scaleX = newW / startW;
          const scaleY = newH / startH;

          return {
            ...el,
            points: startPoints.map(pt => ({
              ...pt,
              x: anchorX + (pt.x - anchorX) * scaleX,
              y: anchorY + (pt.y - anchorY) * scaleY
            }))
          };
        }

        return el;
      }));
      return;
    }

    // CHẾ ĐỘ ĐÈN CHIẾU: Bỏ qua hoàn toàn vẽ trực tiếp và chụp snapshot để tránh đơ/khựng/sai lệch tọa độ
    if (stateRef.current.isFlashlightActive) {
      mousePosRef.current = { x, y };
      if (isDrawingRef.current && lastPointRef.current) {
        events.forEach((evt: any) => {
          const { x: ex, y: ey } = getCanvasCoords(evt.clientX, evt.clientY, canvas, cachedRect);

          // Lọc khoảng cách tối thiểu giữa các điểm để tránh răng cưa góc cạnh và tích tụ độ mờ (opacity accumulation)
          const lastPt = activePointsRef.current[activePointsRef.current.length - 1];
          if (lastPt) {
            const d = Math.sqrt((ex - lastPt.x) ** 2 + (ey - lastPt.y) ** 2);
            if (d < 2) return; // Bỏ qua điểm nếu di chuyển quá ngắn (< 2px)
          }

          const startPressure = evt.pressure !== undefined && evt.pressure > 0 ? evt.pressure : 0.5;
          activePointsRef.current.push({ x: ex, y: ey, pressure: startPressure, time: Date.now() });
          lastPointRef.current = { x: ex, y: ey };
        });
      }
      drawAllElements();
      return;
    }

    if (!isDrawingRef.current) return;
    if (hasSnappedRef.current) return; // Đã snap xong hình đẹp, bỏ qua nét vẽ nháp tiếp theo

    const lastPoint = lastPointRef.current;
    if (!lastPoint || !startPointRef.current) return;



    if (tool === 'hand') {
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;

      if (isGrabbingPageRef.current) {
        // Drag Page Grab Scroll logic: túm và kéo trang web mượt mà như PDF!
        // Ưu tiên cuộn phân vùng/khung cuộn cục bộ nằm ngay dưới con trỏ chuột
        const scrollTarget = scrollTargetRef.current;
        if (scrollTarget && scrollTarget.scrollHeight > scrollTarget.clientHeight) {
          scrollTarget.scrollBy({ left: -dx, top: -dy, behavior: 'auto' });
        } else {
          // Các giải pháp dự phòng toàn cục
          const mainScrollable = document.querySelector('main');
          if (mainScrollable && mainScrollable.scrollHeight > mainScrollable.clientHeight) {
            mainScrollable.scrollBy({ left: -dx, top: -dy, behavior: 'auto' });
          } else {
            document.documentElement.scrollBy({ left: -dx, top: -dy, behavior: 'auto' });
            document.body.scrollBy({ left: -dx, top: -dy, behavior: 'auto' });
          }
        }

        lastPointRef.current = { x, y };
        return;
      }

      // Logic BÀN TAY dịch chuyển toạ độ đối tượng đã chọn (Drag offset)
      if (!selectedId) return;

      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;

        if (el.type === 'pencil' || el.type === 'highlight' || el.type === 'eraser') {
          return {
            ...el,
            points: el.points.map(pt => ({ x: pt.x + dx, y: pt.y + dy }))
          };
        } else {
          return {
            ...el,
            x: el.x! + dx,
            y: el.y! + dy,
            absoluteX: el.absoluteX !== undefined ? el.absoluteX + dx : undefined,
            absoluteY: el.absoluteY !== undefined ? el.absoluteY + dy : undefined
          };
        }
      }));

      lastPointRef.current = { x, y };
    }
    else {
      // Logic vẽ vẽ trực tiếp mượt mà để đạt hiệu năng tối đa khi đang rê chuột
      events.forEach((evt: any) => {
        const { x: ex, y: ey } = getCanvasCoords(evt.clientX, evt.clientY, canvas, cachedRect);
        const pt = lastPointRef.current;

        if (pt) {
          const dist = Math.sqrt((ex - pt.x) ** 2 + (ey - pt.y) ** 2);
          if (dist < 1.0) return; // Lọc bỏ điểm vẽ quá ngắn để tránh quá tải GPU/CPU
        }

        const currentPressure = evt.pressure !== undefined && evt.pressure > 0 ? evt.pressure : 0.5;

        // Tính toán tốc độ vẽ (Speed Sensitivity) để mô phỏng nét thanh nét đậm thư pháp
        let speedFactor = 1.0;
        if (pt) {
          const dx = ex - pt.x;
          const dy = ey - pt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Vẽ chậm (khoảng cách nhỏ) -> nét dày đậm (hệ số lên đến 1.6)
          // Vẽ nhanh (khoảng cách lớn) -> nét thanh mảnh (hệ số giảm xuống 0.15)
          speedFactor = Math.max(0.15, Math.min(1.6, 1.45 - dist * 0.08));
        }

        // Kết hợp cảm ứng lực vật lý (nếu có) và tốc độ vẽ giả lập
        let targetPressure = speedFactor;
        if (currentPressure !== 0.5) {
          targetPressure = currentPressure * 0.65 + speedFactor * 0.35;
        }

        // Lọc nhiễu mượt mà tránh khự khự nét vẽ đột ngột
        const smoothedPressure = lastWidthFactorRef.current * 0.7 + targetPressure * 0.3;
        lastWidthFactorRef.current = smoothedPressure;

        activePointsRef.current.push({ x: ex, y: ey, pressure: smoothedPressure });

        if (!pt) return;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        if (tool === 'pencil') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;

          let thickness = pencilSize;
          if (penStyle === 'ballpoint') {
            thickness = pencilSize * (0.85 + smoothedPressure * 0.15);
          } else if (penStyle === 'fountain') {
            thickness = pencilSize * (0.45 + smoothedPressure * 0.95);
          } else if (penStyle === 'brush') {
            thickness = pencilSize * (0.1 + smoothedPressure * 2.1);
          }

          ctx.lineWidth = thickness;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Bezier bậc 2: dùng điểm trước làm control point, midpoint làm điểm đích
          // -> nét mượt hơn lineTo rất nhiều, đặc biệt với nét nhỏ và chữ viết
          const pts = activePointsRef.current;
          if (pts.length >= 3) {
            const prev2 = pts[pts.length - 3];
            const prev1 = pts[pts.length - 2];
            const curr = pts[pts.length - 1];
            const midX = (prev1.x + curr.x) / 2;
            const midY = (prev1.y + curr.y) / 2;
            ctx.beginPath();
            ctx.moveTo((prev2.x + prev1.x) / 2, (prev2.y + prev1.y) / 2);
            ctx.quadraticCurveTo(prev1.x, prev1.y, midX, midY);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
          }

          lastPointRef.current = { x: ex, y: ey };
        }
        else if (tool === 'eraser') {
          const { eraserMode, eraserTargets } = stateRef.current;
          if (eraserMode === 'stroke') {
            const eraserRadius = eraserSize / 2;
            const toDeleteIds = new Set<string>();

            const pencilErasable = eraserTargets?.pencil ?? true;
            const highlightErasable = eraserTargets?.highlight ?? true;
            const shapesErasable = eraserTargets?.shapes ?? true;
            const textErasable = eraserTargets?.text ?? true;

            elements.forEach(el => {
              if (el.type === 'eraser') return;

              let isTarget = false;
              if (el.type === 'pencil') isTarget = pencilErasable;
              else if (el.type === 'highlight') isTarget = highlightErasable;
              else if (el.type === 'rectangle' || el.type === 'circle' || el.type === 'ellipse') isTarget = shapesErasable;
              else if (el.type === 'text' || el.type === 'callout') isTarget = textErasable;

              const translatedEl = getTranslatedElement(el, rect);
              if (translatedEl && isTarget && checkIntersection(ex, ey, translatedEl, eraserRadius)) {
                toDeleteIds.add(el.id);
              }
            });

            if (toDeleteIds.size > 0) {
              setElements(prev => prev.filter(el => !toDeleteIds.has(el.id)));
            }
          } else {
            const eraserRadius = eraserSize / 2;
            performPixelErasing(ex, ey, eraserRadius);
          }

          lastPointRef.current = { x: ex, y: ey };
        }
      });

      const points = activePointsRef.current;
      if (points.length < 2) return;

      if (tool === 'highlight') {
        drawAllElements();
        ctx.strokeStyle = color;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = highlightSize;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      }
      else if (tool === 'rectangle' || tool === 'circle') {
        drawAllElements();
        ctx.strokeStyle = color;
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const startPoint = points[0];
        const w = x - startPoint.x;
        const h = y - startPoint.y;

        ctx.beginPath();
        if (tool === 'rectangle') {
          ctx.rect(startPoint.x, startPoint.y, w, h);

          // Tô màu nền mờ mịn highlight bên trong lúc đang vẽ rê chuột
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = color;
          ctx.fill();
          ctx.restore();

          // Vẽ nét viền ngoài cực mảnh cho hình chữ nhật đang vẽ
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 0.5; // viền mỏng 0.5px
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.globalAlpha = 1.0;
          ctx.lineWidth = pencilSize;
          const cx = startPoint.x + w / 2;
          const cy = startPoint.y + h / 2;
          const radius = Math.min(Math.abs(w), Math.abs(h)) / 2;
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      else if (tool === 'callout') {
        drawAllElements();
        const startPoint = points[0];
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;

        // Draw preview line
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw arrowhead at startPoint pointing towards startPoint
        const theta = Math.atan2(startPoint.y - y, startPoint.x - x);
        const headlen = 10;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(startPoint.x - headlen * Math.cos(theta - Math.PI / 6), startPoint.y - headlen * Math.sin(theta - Math.PI / 6));
        ctx.lineTo(startPoint.x - headlen * Math.cos(theta + Math.PI / 6), startPoint.y - headlen * Math.sin(theta + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Draw dashed bounding box preview at current mouse position
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x - 40, y - 10, 80, 20);
        ctx.restore();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Chỉ bỏ qua touch nếu không ở trạng thái đang vẽ/kéo thả, tránh nuốt sự kiện pointerup gây kẹt trạng thái vẽ
    if (e.pointerType === 'touch' && !isDrawingRef.current && !resizingInfo) return;

    console.log("handlePointerUp entered: isDrawing =", isDrawingRef.current, "tool =", tool);

    if (tool !== 'cursor') {
      e.preventDefault();
    }

    if (resizingInfo) {
      setResizingInfo(null);
      isDrawingRef.current = false; // Sửa lỗi giải phóng: Reset trạng thái kéo vẽ vẽ
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }
      return;
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // Huỷ các timer nhận dạng hình
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setShapePending(false);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (tool !== 'hand') {
      const points = activePointsRef.current;
      console.log("handlePointerUp debug: tool =", tool, "points.length =", points.length);
      if (points.length === 0) return;

      if (tool === 'callout') {
        const startPoint = points[0];
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          setSelectedId(null);
          setEditingTextId(null);
          const arrowPos = { x: startPoint.x, y: startPoint.y };
          const offsetY = 2 + (fontSize * 1.3) / 2;
          const inputPos = { x: e.clientX - 4, y: e.clientY - offsetY };
          
          console.log("handlePointerUp callout setting states: arrowPos =", arrowPos, "inputPos =", inputPos);
          setCalloutArrowPos(arrowPos);
          setTextInput(inputPos);
          textInputValRef.current = "";
          setActiveTextVal("");
          
          stateRef.current.calloutArrowPos = arrowPos;
          stateRef.current.textInput = inputPos;
        }
        activePointsRef.current = [];
        drawAllElements();
        return;
      }

      const rect = canvas?.getBoundingClientRect();
      const ex = e.clientX - (rect?.left || 0);
      const ey = e.clientY - (rect?.top || 0);

      const startPt = points[0];
      const container = rect ? findScrollContainer(startPt.x + rect.left, startPt.y + rect.top) : null;

      let activeAnchor = activeAnchorRef.current;
      if (rect && points.length > 0) {
        const sampleIndices = [
          0,
          Math.floor(points.length / 2),
          points.length - 1
        ];
        sampleIndices.forEach(idx => {
          if (idx >= 0 && idx < points.length) {
            const pt = points[idx];
            const testX = pt.x + rect.left;
            const testY = pt.y + rect.top;
            const anchor = findBestAnchor(testX, testY, canvas, container);
            if (anchor) {
              if (!activeAnchor || anchor.priority < activeAnchor.priority) {
                activeAnchor = anchor;
              }
            }
          }
        });
      }

      let dx = 0;
      let dy = 0;
      let anchorSelector: string | undefined = undefined;
      let containerSelector: string | undefined = undefined;
      let textHash: string | undefined = undefined;
      let textContent: string | undefined = undefined;

      let allPointsInside = true;
      if (container && rect) {
        const cRect = container.getBoundingClientRect();
        const padding = 24; // 24px margin buffer to accommodate drawings slightly near/outside borders
        for (const pt of points) {
          const clientX = pt.x + rect.left;
          const clientY = pt.y + rect.top;
          if (
            clientX < cRect.left - padding ||
            clientX > cRect.right + padding ||
            clientY < cRect.top - padding ||
            clientY > cRect.bottom + padding
          ) {
            allPointsInside = false;
            break;
          }
        }
      }

      if (activeAnchor && rect && allPointsInside) {
        anchorSelector = activeAnchor.selector;
        dx = activeAnchor.rect.left - rect.left;
        dy = activeAnchor.rect.top - rect.top;
        
        const anchorEl = document.querySelector(anchorSelector) as HTMLElement | null;
        if (anchorEl) {
          textContent = normalizeText(anchorEl.textContent || "");
          textHash = calculateTextHash(anchorEl.textContent || "");
        }
        
        if (container) {
          containerSelector = generateUniqueSelector(container);
        }
      } else if (container && rect && allPointsInside) {
        containerSelector = generateUniqueSelector(container);
        const cRect = container.getBoundingClientRect();
        dx = cRect.left - rect.left - container.scrollLeft;
        dy = cRect.top - rect.top - container.scrollTop;
      }

      // ── DOT EVENT HANDLER ──────────────────────────────────────────────────
      // Khi người dùng chỉ tap (không di chuyển) -> points <= 2, không có điểm
      // đủ để vẽ Bezier. Vẽ hình tròn nhỏ ngay tại điểm đó.
      if ((tool === 'pencil' || tool === 'highlight') && points.length <= 2) {
        const dotX = points[0].x;
        const dotY = points[0].y;
        const pressure = points[0].pressure ?? 0.5;
        const ctx = ctxRef.current;
        if (ctx) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = tool === 'highlight' ? 0.35 : 1.0;
          ctx.fillStyle = color;
          const baseSize = tool === 'highlight' ? highlightSize : pencilSize;
          let dotR = (baseSize / 2) * pressure;
          if (penStyle === 'brush') dotR = (baseSize / 2) * (0.1 + pressure * 2.1);
          else if (penStyle === 'fountain') dotR = (baseSize / 2) * (0.45 + pressure * 0.95);
          ctx.beginPath();
          ctx.arc(dotX, dotY, Math.max(0.8, dotR), 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        }
        const dotElement: DrawElement = {
          id: Date.now().toString(),
          type: tool,
          anchorSelector: anchorSelector,
          containerSelector: containerSelector,
          textHash: textHash,
          textContent: textContent,
          points: [{ x: dotX - dx, y: dotY - dy, pressure }],
          color: color,
          size: tool === 'highlight' ? highlightSize : pencilSize,
          penStyle: tool === 'pencil' ? penStyle : undefined,
        };
        setElements(prev => [...prev, dotElement]);
        // Reset state và thoát sớm - không xử lý tiếp
        isGrabbingPageRef.current = false;
        setIsGrabbingPage(false);
        lastPointRef.current = null;
        startPointRef.current = null;
        canvasSnapshotRef.current = null;
        hasSnappedRef.current = false;
        recognizedShapeRef.current = null;
        activePointsRef.current = [];
        return;
      }
      // ── END DOT EVENT HANDLER ──────────────────────────────────────────────

      // Thêm phần tử vừa hoàn thành vẽ vào Vector state
      let newElement: DrawElement | null = null;
      const elementId = Date.now().toString();

      if (hasSnappedRef.current && recognizedShapeRef.current) {
        // Người dùng đã vẽ và giữ bút 1s thành công -> lưu hình vẽ đẹp đã được snap
        const shape = recognizedShapeRef.current;
        if (shape.type === 'rectangle' && shape.rect) {
          newElement = {
            id: elementId,
            type: 'rectangle',
            anchorSelector: anchorSelector,
            points: [],
            color: color,
            size: tool === 'highlight' ? highlightSize : rectangleSize,
            x: shape.rect.x - dx,
            y: shape.rect.y - dy,
            width: shape.rect.w,
            height: shape.rect.h,
          };
        } else if (shape.type === 'circle' && shape.circle) {
          newElement = {
            id: elementId,
            type: 'circle',
            anchorSelector: anchorSelector,
            points: [],
            color: color,
            size: tool === 'highlight' ? highlightSize : circleSize,
            x: shape.circle.cx - dx,
            y: shape.circle.cy - dy,
            radius: shape.circle.radius,
          };
        } else if (shape.type === 'ellipse' && shape.ellipse) {
          newElement = {
            id: elementId,
            type: 'ellipse',
            anchorSelector: anchorSelector,
            points: [],
            color: color,
            size: tool === 'highlight' ? highlightSize : circleSize,
            x: shape.ellipse.cx - dx,
            y: shape.ellipse.cy - dy,
            rx: shape.ellipse.rx,
            ry: shape.ellipse.ry,
          };
        } else if (shape.type === 'line' && shape.line) {
          newElement = {
            id: elementId,
            type: 'pencil',
            anchorSelector: anchorSelector,
            points: [
              { x: shape.line.start.x - dx, y: shape.line.start.y - dy },
              { x: shape.line.end.x - dx, y: shape.line.end.y - dy }
            ],
            color: color,
            size: tool === 'highlight' ? highlightSize : pencilSize,
          };
        }
      } else {
        // Nhấc bút lên luôn mà KHÔNG giữ 1s -> lưu nét vẽ tay tự do ban đầu (không nhận dạng gì hết)
        if (tool === 'pencil' || tool === 'highlight' || tool === 'eraser') {
          if (tool === 'eraser' && stateRef.current.eraserMode === 'stroke') {
            newElement = null; // Bỏ qua không lưu nét vẽ của stroke eraser vào vector list
          } else {
            newElement = {
              id: elementId,
              type: tool,
              anchorSelector: anchorSelector,
              points: points.map(pt => ({
                ...pt,
                x: pt.x - dx,
                y: pt.y - dy
              })),
              color: color,
              size: tool === 'eraser' ? eraserSize : tool === 'highlight' ? highlightSize : pencilSize,
              penStyle: tool === 'pencil' ? penStyle : undefined
            };
          }
        }
        else if (tool === 'rectangle' || tool === 'circle') {
          const startPoint = points[0];
          const w = ex - startPoint.x;
          const h = ey - startPoint.y;

          if (tool === 'rectangle') {
            const normX = Math.min(startPoint.x, ex);
            const normY = Math.min(startPoint.y, ey);
            const normW = Math.abs(w);
            const normH = Math.abs(h);
            newElement = {
              id: elementId,
              type: 'rectangle',
              anchorSelector: anchorSelector,
              points: [],
              color: color,
              size: rectangleSize,
              x: normX - dx,
              y: normY - dy,
              width: normW,
              height: normH
            };
          } else {
            const cx = startPoint.x + w / 2;
            const cy = startPoint.y + h / 2;
            const radius = Math.min(Math.abs(w), Math.abs(h)) / 2;
            newElement = {
              id: elementId,
              type: 'circle',
              anchorSelector: anchorSelector,
              points: [],
              color: color,
              size: circleSize,
              x: cx - dx,
              y: cy - dy,
              radius: radius
            };
          }
        }
      }

      if (newElement) {
        newElement.containerSelector = containerSelector;
        newElement.textHash = textHash;
        newElement.textContent = textContent;
        setElements(prev => [...prev, newElement!]);
      }
    }

    if (tool === 'hand' && selectedId) {
      const draggedEl = elements.find(el => el.id === selectedId);
      if (draggedEl && (draggedEl.type === 'text' || draggedEl.type === 'callout') && !draggedEl.anchorSelector) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          
          let targetX = draggedEl.x ?? 0;
          let targetY = draggedEl.y ?? 0;
          if (draggedEl.type === 'callout' && draggedEl.arrowX !== undefined && draggedEl.arrowY !== undefined) {
            targetX = draggedEl.arrowX;
            targetY = draggedEl.arrowY;
          }
          
          const clientX = targetX + rect.left;
          const clientY = targetY + rect.top;
          
          const container = findScrollContainer(clientX, clientY);
          const bestAnchor = findBestAnchor(clientX, clientY, canvas, container);
          
          if (bestAnchor) {
            const anchorSelector = bestAnchor.selector;
            const dx = bestAnchor.rect.left - rect.left;
            const dy = bestAnchor.rect.top - rect.top;
            
            const anchorEl = document.querySelector(anchorSelector) as HTMLElement | null;
            const textContent = anchorEl ? normalizeText(anchorEl.textContent || "") : undefined;
            const textHash = anchorEl ? calculateTextHash(anchorEl.textContent || "") : undefined;
            const containerSelector = container ? generateUniqueSelector(container) : undefined;
            
            setElements(prev => prev.map(el => {
              if (el.id === selectedId) {
                const currentAbsX = (el.x ?? 0) + rect.left;
                const currentAbsY = (el.y ?? 0) + rect.top;
                const currentAbsArrowX = el.arrowX !== undefined ? el.arrowX + rect.left : undefined;
                const currentAbsArrowY = el.arrowY !== undefined ? el.arrowY + rect.top : undefined;
                
                const newRelX = currentAbsX - rect.left - dx;
                const newRelY = currentAbsY - rect.top - dy;
                const newRelArrowX = currentAbsArrowX !== undefined ? currentAbsArrowX - rect.left - dx : undefined;
                const newRelArrowY = currentAbsArrowY !== undefined ? currentAbsArrowY - rect.top - dy : undefined;
                
                return {
                  ...el,
                  anchorSelector,
                  containerSelector,
                  textHash,
                  textContent,
                  x: newRelX,
                  y: newRelY,
                  arrowX: newRelArrowX,
                  arrowY: newRelArrowY,
                  absoluteX: currentAbsX - rect.left,
                  absoluteY: currentAbsY - rect.top,
                  absoluteArrowX: currentAbsArrowX !== undefined ? currentAbsArrowX - rect.left : undefined,
                  absoluteArrowY: currentAbsArrowY !== undefined ? currentAbsArrowY - rect.top : undefined,
                };
              }
              return el;
            }));
          }
        }
      }
    }

    isGrabbingPageRef.current = false;
    setIsGrabbingPage(false);
    lastPointRef.current = null;
    startPointRef.current = null;
    canvasSnapshotRef.current = null;
    hasSnappedRef.current = false;
    recognizedShapeRef.current = null;
    activePointsRef.current = [];
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Chỉ hủy nét vẽ nháp đang dở dang nếu bị cancel, tránh lưu nét đứt đoạn do tì đè tay (palm rejection)
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      activePointsRef.current = [];
      drawAllElements();
    }
    if (resizingInfo) {
      setResizingInfo(null);
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setShapePending(false);

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // Hoàn thành nhập text và vẽ lưu vào Vector state
  const handleTextSubmit = (shouldSwitchToHand = false) => {
    console.log("[handleTextSubmit] called. value =", JSON.stringify(textInputValRef.current), "editingTextId =", editingTextId, "isSubmitting =", isSubmittingTextRef.current);
    if (isSubmittingTextRef.current) {
      console.log("[handleTextSubmit] ignored due to double submission lock.");
      return;
    }
    if (!textInput) {
      console.log("[handleTextSubmit] returned early because textInput is falsy.");
      setEditingTextId(null);
      return;
    }

    isSubmittingTextRef.current = true;

    const value = textInputValRef.current.trim();
    if (!value) {
      console.log("[handleTextSubmit] empty value - clearing textInput.");
      if (editingTextId) {
        // Nếu đang sửa và xoá sạch chữ, tiến hành xoá phần tử khỏi danh sách
        saveToUndoStack(elements);
        setElements(prev => prev.filter(el => el.id !== editingTextId));
      }
      setTextInput(null);
      setEditingTextId(null);
      setTimeout(() => {
        isSubmittingTextRef.current = false;
      }, 50);
      return;
    }

    saveToUndoStack(elements);
    let targetId = editingTextId;
    console.log('[handleTextSubmit] Saving text (markdown):', JSON.stringify(textInputValRef.current));

    if (editingTextId) {
      setElements(prev => prev.map(el => {
        if (el.id === editingTextId) {
          return {
            ...el,
            text: value,
          };
        }
        return el;
      }));
    } else {
      const canvas = canvasRef.current;
      if (!canvas) {
        setTimeout(() => {
          isSubmittingTextRef.current = false;
        }, 50);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      
      // Nhích tọa độ ô nhập chữ để luôn hiển thị trọn vẹn trong màn hình (tương tự như logic render style)
      let editorX = textInput.x;
      let editorY = textInput.y;
      if (typeof window !== 'undefined') {
        const margin = 20;
        editorX = Math.max(margin, Math.min(editorX, window.innerWidth - 100));
        editorY = Math.max(margin, Math.min(editorY, window.innerHeight - 100));
      }

      const x = editorX + 4 - rect.left; // Bù trừ padding-left 4px của textarea
      const y = editorY + 2 - rect.top;  // Bù trừ padding-top 2px của textarea

      let dx = 0;
      let dy = 0;
      let anchorSelector: string | undefined = undefined;
      let containerSelector: string | undefined = undefined;
      let textHash: string | undefined = undefined;
      let textContent: string | undefined = undefined;

      const activeClone = stateRef.current.clonedTools.find(c => c.id === stateRef.current.activeCloneId);
      const isCalloutClone = activeClone && activeClone.baseType === 'callout';
      const isCallout = tool === 'callout' || isCalloutClone;

      const anchorClientX = (isCallout && calloutArrowPos) ? (calloutArrowPos.x + rect.left) : editorX;
      const anchorClientY = (isCallout && calloutArrowPos) ? (calloutArrowPos.y + rect.top) : editorY;

      const container = findScrollContainer(anchorClientX, anchorClientY);

      const bestAnchor = findBestAnchor(anchorClientX, anchorClientY, canvas, container);
      if (bestAnchor) {
        anchorSelector = bestAnchor.selector;
        dx = bestAnchor.rect.left - rect.left;
        dy = bestAnchor.rect.top - rect.top;
        
        const anchorEl = document.querySelector(anchorSelector) as HTMLElement | null;
        if (anchorEl) {
          textContent = normalizeText(anchorEl.textContent || "");
          textHash = calculateTextHash(anchorEl.textContent || "");
        }
        
        if (container) {
          containerSelector = generateUniqueSelector(container);
        }
      } else if (container) {
        containerSelector = generateUniqueSelector(container);
        const cRect = container.getBoundingClientRect();
        dx = cRect.left - rect.left - container.scrollLeft;
        dy = cRect.top - rect.top - container.scrollTop;
      }

      const newId = Date.now().toString();
      targetId = newId;

      const isTextClone = activeClone && activeClone.baseType === 'text';

      const newElement: DrawElement = {
        id: newId,
        type: isCallout ? 'callout' : 'text',
        anchorSelector: anchorSelector,
        containerSelector: containerSelector,
        textHash: textHash,
        textContent: textContent,
        points: [],
        color: (isTextClone || isCalloutClone) ? activeClone.color : color,
        size: ((isTextClone || isCalloutClone) && activeClone.textSize) ? activeClone.textSize : fontSize,
        textStyle: (isTextClone || isCalloutClone) ? activeClone.textStyle : undefined,
        textHasBorder: (isTextClone || isCalloutClone) ? (activeClone.textHasBorder !== undefined ? activeClone.textHasBorder : true) : (isCallout ? true : undefined),
        textBorderWidth: (isTextClone || isCalloutClone) ? (activeClone.textBorderWidth !== undefined ? activeClone.textBorderWidth : 1.5) : (isCallout ? 1.5 : undefined),
        textBgColor: (isTextClone || isCalloutClone) ? (activeClone.textBgColor !== undefined ? activeClone.textBgColor : '#ffffff') : (isCallout ? '#ffffff' : undefined),
        textBgOpacity: (isTextClone || isCalloutClone) ? (activeClone.textBgOpacity !== undefined ? activeClone.textBgOpacity : 0.0) : (isCallout ? 0.0 : undefined),
        fontFamily: (isTextClone || isCalloutClone) ? activeClone.fontFamily : fontFamily,
        x: x - dx,
        y: y - dy,
        absoluteX: x,
        absoluteY: y,
        text: value,
        arrowX: isCallout && calloutArrowPos ? calloutArrowPos.x - dx : undefined,
        arrowY: isCallout && calloutArrowPos ? calloutArrowPos.y - dy : undefined,
        absoluteArrowX: isCallout && calloutArrowPos ? calloutArrowPos.x : undefined,
        absoluteArrowY: isCallout && calloutArrowPos ? calloutArrowPos.y : undefined
      };
      console.log("[handleTextSubmit] Adding new element:", newElement);
      setElements(prev => [...prev, newElement]);
    }

    setTextInput(null);
    setEditingTextId(null);
    setCalloutArrowPos(null);

    if (shouldSwitchToHand && targetId) {
      setTool('hand');
      setSelectedId(targetId);
    }

    setTimeout(() => {
      isSubmittingTextRef.current = false;
    }, 50);
  };

  // Xoá sạch canvas và state
  const clearCanvas = () => {
    saveToUndoStack(elements);
    setElements([]);
    setSelectedId(null);
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Khởi động lại toàn bộ công cụ vẽ (đưa về trạng thái ban đầu)
  const hardResetDrawTool = () => {
    setElements([]);
    setUndoStack([]);
    setRedoStack([]);
    if (currentContext) {
      localStorage.removeItem(`webtoeic_canvas_elements_${currentContext}`);
    } else {
      localStorage.removeItem('webtoeic_canvas_elements');
    }
    setSelectedId(null);
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // ============================================================
  // SHAPE RECOGNITION: Phát hiện và làm đẹp hình vẽ (GoodNotes style)
  // ============================================================

  /** Khoảng cách Euclid giữa 2 điểm */
  const ptDist = (a: { x: number, y: number }, b: { x: number, y: number }) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  /** Tổng chiều dài đường đi qua mảng điểm */
  const pathLength = (pts: { x: number, y: number }[]) => {
    let l = 0;
    for (let i = 1; i < pts.length; i++) l += ptDist(pts[i - 1], pts[i]);
    return l;
  };

  /** Ramer-Douglas-Peucker đơn giản hoá mảng điểm */
  const rdpSimplify = (p: { x: number, y: number }[], eps: number): { x: number, y: number }[] => {
    if (p.length <= 2) return p;
    const s = p[0], e = p[p.length - 1];
    const dx = e.x - s.x, dy = e.y - s.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    let maxD = 0, idx = 0;
    for (let i = 1; i < p.length - 1; i++) {
      const d = len === 0
        ? ptDist(p[i], s)
        : Math.abs(dy * p[i].x - dx * p[i].y + e.x * s.y - e.y * s.x) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps) {
      const left = rdpSimplify(p.slice(0, idx + 1), eps);
      const right = rdpSimplify(p.slice(idx), eps);
      return [...left.slice(0, -1), ...right];
    }
    return [s, e];
  };

  /** Phát hiện Đường thẳng */
  const shapeDetectLine = (pts: { x: number, y: number }[]) => {
    const totalLen = pathLength(pts);
    if (totalLen < 15) return null;
    const d = ptDist(pts[0], pts[pts.length - 1]);
    // Nếu độ thẳng (distance giữa đầu/cuối chia cho chiều dài đường đi) lớn hơn 88% -> là đường thẳng
    if (d / totalLen > 0.88) {
      return { start: pts[0], end: pts[pts.length - 1] };
    }
    return null;
  };

  /** Nhận dạng hình học thông minh bằng Bounding Box & Isoperimetric Quotient */
  const detectShape = (pts: { x: number; y: number }[]) => {
    const totalLen = pathLength(pts);
    if (totalLen < 20) return null;

    // 1. Nhận diện đường thẳng trước tiên
    const line = shapeDetectLine(pts);
    if (line) {
      return { type: 'line' as const, line };
    }

    // 2. Kiểm tra độ khép kín (Closure check)
    const closing = ptDist(pts[0], pts[pts.length - 1]);
    const isClosed = closing < totalLen * 0.35 || (totalLen > 100 && closing < 60);

    if (isClosed) {
      // Tìm bounding box
      let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
      for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const w = maxX - minX;
      const h = maxY - minY;
      if (w < 15 || h < 15) return null;

      // Bước 1: Loại biên các hình chữ nhật quá dài/dẹt (Aspect Ratio check)
      const aspectRatio = w / h;
      if (aspectRatio > 3.0 || aspectRatio < 0.33) {
        return { type: 'rectangle' as const, rect: { x: minX, y: minY, w, h } };
      }

      // [SỬA LỖI 1]: Tính diện tích Shoelace
      let areaSum = 0;
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        areaSum += pts[i].x * pts[j].y;
        areaSum -= pts[j].x * pts[i].y;
      }
      const area = Math.abs(areaSum) / 2;
      if (area < 100) return null;

      // [SỬA LỖI 2]: Chu vi chuẩn toán học bao gồm cả đoạn nối tắt khép kín
      const totalPerimeter = totalLen + closing;

      // Tính tỷ lệ lấp đầy hộp bao quanh
      const boxArea = w * h > 0 ? w * h : 1;
      const ratio = area / boxArea;

      // Tính chỉ số Đẳng chu Q dựa trên Chu vi đã chuẩn hóa
      const Q = (totalPerimeter * totalPerimeter) / area;

      // Hàm helper để render kết quả Tròn hoặc Elip linh hoạt
      const getCurvedShape = () => {
        const cx = minX + w / 2;
        const cy = minY + h / 2;
        // [SỬA LỖI 3]: Nếu tỷ lệ gần cân bằng (0.85 -> 1.15) thì xuất hình Tròn, ngược lại ra hình Elip
        if (aspectRatio >= 0.85 && aspectRatio <= 1.15) {
          return { type: 'circle' as const, circle: { cx, cy, radius: (w + h) / 4 } };
        } else {
          return { type: 'ellipse' as const, ellipse: { cx, cy, rx: w / 2, ry: h / 2 } };
        }
      };

      // Bước 2: Biện luận thông minh thông qua "Vùng giao thoa"
      if (Q < 15.2) {
        if (ratio < 0.82) {
          return getCurvedShape();
        } else {
          return { type: 'rectangle' as const, rect: { x: minX, y: minY, w, h } };
        }
      } else {
        if (ratio < 0.76) {
          return getCurvedShape(); // Q lớn do run tay nhưng lấp đầy thấp -> Vẫn là hình tròn/elip vẽ ẩu
        } else {
          return { type: 'rectangle' as const, rect: { x: minX, y: minY, w, h } };
        }
      }
    }

    return null;
  };

  const triggerHoldRecognition = () => {
    if (!isDrawingRef.current) return;
    if (stateRef.current.tool === 'callout') return;

    // Kiểm tra thời gian di chuyển cuối cùng để tránh trigger sai khi CPU/trình duyệt bị lag
    const timeSinceLastMove = Date.now() - lastMoveTimeRef.current;
    if (timeSinceLastMove < 800) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(triggerHoldRecognition, 800);
      return;
    }

    const points = activePointsRef.current;
    if (points.length < 5) return;

    // Check if the user is actually holding the pen still.
    // If the last 10 points are not clustered within 4px of the latest point,
    // they are still actively drawing, so we postpone shape recognition.
    const lastPt = points[points.length - 1];
    const sampleCount = Math.min(10, points.length);
    const isHoldingStill = points.slice(-sampleCount).every(pt => ptDist(pt, lastPt) < 4);
    if (!isHoldingStill) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(triggerHoldRecognition, 300);
      return;
    }

    // Clean up duplicate/near-duplicate consecutive points to ensure robust shape detection
    const cleanedPoints: { x: number; y: number }[] = [];
    for (const pt of points) {
      if (cleanedPoints.length === 0) {
        cleanedPoints.push(pt);
      } else {
        const lastClean = cleanedPoints[cleanedPoints.length - 1];
        if (ptDist(pt, lastClean) >= 0.5) {
          cleanedPoints.push(pt);
        }
      }
    }

    const shape = detectShape(cleanedPoints);
    if (shape) {
      recognizedShapeRef.current = shape;
      hasSnappedRef.current = true;
      setShapePending(false);

      // Restore snapshot & vẽ đè hình đã nhận dạng lên canvas để người dùng nhìn thấy ngay lập tức
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        drawAllElements();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = tool === 'highlight' ? highlightSize : pencilSize;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = tool === 'highlight' ? 0.35 : 1.0;
        ctx.lineCap = tool === 'highlight' ? 'square' : 'round';
        ctx.lineJoin = tool === 'highlight' ? 'miter' : 'round';

        ctx.beginPath();
        if (shape.type === 'rectangle' && shape.rect) {
          ctx.rect(shape.rect.x, shape.rect.y, shape.rect.w, shape.rect.h);

          // Tô màu nền highlight bên trong khi snap thành công
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = color;
          ctx.fill();
          ctx.restore();

          // Stroke nét viền ngoài mảnh thanh nhã
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 0.5; // viền mảnh 0.5px
          ctx.stroke();
          ctx.restore();
        } else if (shape.type === 'circle' && shape.circle) {
          ctx.arc(shape.circle.cx, shape.circle.cy, shape.circle.radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (shape.type === 'ellipse' && shape.ellipse) {
          ctx.ellipse(shape.ellipse.cx, shape.ellipse.cy, shape.ellipse.rx, shape.ellipse.ry, 0, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (shape.type === 'line' && shape.line) {
          ctx.moveTo(shape.line.start.x, shape.line.start.y);
          ctx.lineTo(shape.line.end.x, shape.line.end.y);
          ctx.stroke();
        }
      }
    } else {
      // Nếu chưa nhận diện được hình, tiếp tục hẹn giờ kiểm tra lại để không bị ngắt quãng giữa chừng
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(triggerHoldRecognition, 300);
    }
  };


  // Hàm mã hoá Base64 an toàn cho mọi chuỗi bao gồm cả ký tự UTF-8
  const btoaSafe = (str: string) => {
    try {
      return window.btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      return "";
    }
  };

  // Tính cursor string thông qua useMemo – luôn cập nhật đúng khi state thay đổi
  const cursorStyle = useMemo(() => {
    if (isShiftPressed) return 'default'; // Hiện con trỏ chuột mặc định khi đang kích hoạt Ghost Mode
    if (tool === 'cursor') return 'default';
    if (tool === 'hand') {
      if (hoveredResizeHandle === 'nw' || hoveredResizeHandle === 'se') return 'nwse-resize';
      if (hoveredResizeHandle === 'ne' || hoveredResizeHandle === 'sw') return 'nesw-resize';
      return (selectedId || isGrabbingPage) ? 'grabbing' : 'grab';
    }

    if (tool === 'eraser') {
      const size = eraserSize + 2;
      const half = size / 2;
      const radius = eraserSize / 2;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${half}" cy="${half}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.5"/><circle cx="${half}" cy="${half}" r="${radius}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="0.8"/></svg>`;
      const b64 = btoaSafe(svg);
      return `url('data:image/svg+xml;base64,${b64}') ${half} ${half}, auto`;
    }

    if (tool === 'pencil') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><polygon points="1,1 12,5 5,12" fill="${color}" stroke="#000000" stroke-width="1" stroke-linejoin="round"/><line x1="1" y1="1" x2="5" y2="5" stroke="#FFFFFF" stroke-width="0.8"/></svg>`;
      const b64 = btoaSafe(svg);
      return `url('data:image/svg+xml;base64,${b64}') 1 1, crosshair`;
    }

    if (tool === 'rectangle' || tool === 'circle') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><line x1="9" y1="2" x2="9" y2="16" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><line x1="2" y1="9" x2="16" y2="9" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="9" r="2.5" fill="none" stroke="#FFFFFF" stroke-width="1"/></svg>`;
      const b64 = btoaSafe(svg);
      return `url('data:image/svg+xml;base64,${b64}') 9 9, crosshair`;
    }

    if (tool === 'highlight') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><polygon points="1,4 5,1 12,8 8,11" fill="${color}" stroke="#000000" stroke-width="1" stroke-linejoin="round"/><line x1="1" y1="4" x2="5" y2="1" stroke="#FFFFFF" stroke-width="1.2"/></svg>`;
      const b64 = btoaSafe(svg);
      return `url('data:image/svg+xml;base64,${b64}') 3 2, crosshair`;
    }

    if (tool === 'text') return 'text';
    return 'crosshair';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, eraserSize, color, selectedId, isGrabbingPage, isShiftPressed, hoveredResizeHandle]);

  // Set cursor trực tiếp lên DOM canvas mỗi khi cursorStyle thay đổi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.setProperty('cursor', cursorStyle, 'important');
  }, [cursorStyle, isActive]);

  // Khi không active thì ẩn hoàn toàn lớp phủ vẽ nháp và các ghi chú
  if (!isActive) {
    return null;
  }

  return (
    <>
      {scrollContainers.map(container => {
        const selector = generateUniqueSelector(container);
        const containerElements = elements.filter(el => el.containerSelector === selector);
        
        return createPortal(
          <SubSVGOverlay
            key={selector}
            container={container}
            elements={containerElements}
            tool={tool}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdateElements={setElements}
            domUpdateKey={domUpdateKey}
            editingTextId={editingTextId}
          />,
          container
        );
      })}

      {/* Shape Recognition: Dot nhấp nháy khi đang đếm ngược 1 giây */}
      {shapePending && <div className={styles.shapePendingDot} title="Giữ nguyên để nhận dạng hình..." />}

      {/* 1. Lớp phủ Canvas */}
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={(e) => {
          if (tool === 'text') {
            const canvas = canvasRef.current;
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              const clickedElement = findElementAtPosition(clickX, clickY);

              if (clickedElement && clickedElement.type === 'text') {
                const translatedEl = getTranslatedElement(clickedElement, rect);
                const startX = translatedEl ? (translatedEl.x ?? clickedElement.x ?? 0) : (clickedElement.x ?? 0);
                const startY = translatedEl ? (translatedEl.y ?? clickedElement.y ?? 0) : (clickedElement.y ?? 0);

                setSelectedId(null);
                setEditingTextId(clickedElement.id);
                // Đổi toạ độ từ canvas sang client coordinate để hiển thị textarea đúng vị trí
                // Bù trừ padding (left: 4px, top: 2px) của textarea để chữ trùng khớp hoàn hảo.
                setTextInput({
                  x: startX + rect.left - 4,
                  y: startY + rect.top - 2
                });
                const loadedVal = clickedElement.text || "";
                textInputValRef.current = loadedVal;
                setActiveTextVal(loadedVal);
                return;
              }
            }

            setSelectedId(null);
            setEditingTextId(null);
            // Bù trừ padding 4px bên trái và nửa chiều cao chữ để căn giữa chiều dọc theo đúng điểm click chuột
            const offsetY = 2 + (fontSize * 1.3) / 2;
            setTextInput({ x: e.clientX - 4, y: e.clientY - offsetY });
            textInputValRef.current = "";
            setActiveTextVal("");
          }
        }}
        onDoubleClick={(e) => {
          if (tool === 'hand' || tool === 'callout') {
            const canvas = canvasRef.current;
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              const clickedElement = findElementAtPosition(clickX, clickY);

              if (clickedElement && (clickedElement.type === 'text' || clickedElement.type === 'callout')) {
                const translatedEl = getTranslatedElement(clickedElement, rect);
                const startX = translatedEl ? (translatedEl.x ?? clickedElement.x ?? 0) : (clickedElement.x ?? 0);
                const startY = translatedEl ? (translatedEl.y ?? clickedElement.y ?? 0) : (clickedElement.y ?? 0);

                setSelectedId(null);
                setEditingTextId(clickedElement.id);
                setTextInput({
                  x: startX + rect.left - 4,
                  y: startY + rect.top - 2
                });
                const loadedVal = clickedElement.text || "";
                textInputValRef.current = loadedVal;
                setActiveTextVal(loadedVal);

                if (clickedElement.type === 'callout') {
                  const dx = translatedEl ? (startX - (clickedElement.x ?? 0)) : 0;
                  const dy = translatedEl ? (startY - (clickedElement.y ?? 0)) : 0;
                  const finalArrowX = clickedElement.arrowX !== undefined ? clickedElement.arrowX + dx : startX;
                  const finalArrowY = clickedElement.arrowY !== undefined ? clickedElement.arrowY + dy : startY;
                  setCalloutArrowPos({ x: finalArrowX, y: finalArrowY });
                  stateRef.current.calloutArrowPos = { x: finalArrowX, y: finalArrowY };
                } else {
                  setCalloutArrowPos(null);
                  stateRef.current.calloutArrowPos = null;
                }
              }
            }
          }
        }}
        style={{
          cursor: cursorStyle,
          pointerEvents: (tool === 'cursor' || textInput || isShiftPressed) ? 'none' : 'auto',
          touchAction: 'none'
        }}
      />

      {textInput && (
        <MarkdownTextarea
          key={editingTextId || `new-${textInput.x}-${textInput.y}`}
          value={activeTextVal}
          color={
            editingTextId
              ? (elements.find(el => el.id === editingTextId)?.color || color)
              : (clonedTools.find(c => c.id === activeCloneId)?.color || color)
          }
          fontSize={
            editingTextId
              ? (elements.find(el => el.id === editingTextId)?.size || fontSize)
              : (clonedTools.find(c => c.id === activeCloneId)?.textSize || fontSize)
          }
          textStyle={
            editingTextId
              ? elements.find(el => el.id === editingTextId)?.textStyle
              : clonedTools.find(c => c.id === activeCloneId)?.textStyle
          }
          fontFamily={
            editingTextId
              ? elements.find(el => el.id === editingTextId)?.fontFamily
              : (clonedTools.find(c => c.id === activeCloneId)?.fontFamily || fontFamily)
          }
          textHasBorder={
            (tool === 'callout' || (editingTextId && elements.find(el => el.id === editingTextId)?.type === 'callout'))
              ? true
              : (editingTextId
                  ? elements.find(el => el.id === editingTextId)?.textHasBorder
                  : clonedTools.find(c => c.id === activeCloneId)?.textHasBorder)
          }
          textBorderWidth={
            (tool === 'callout' || (editingTextId && elements.find(el => el.id === editingTextId)?.type === 'callout'))
              ? 1.5
              : (editingTextId
                  ? elements.find(el => el.id === editingTextId)?.textBorderWidth
                  : clonedTools.find(c => c.id === activeCloneId)?.textBorderWidth)
          }
          textBgColor={
            (tool === 'callout' || (editingTextId && elements.find(el => el.id === editingTextId)?.type === 'callout'))
              ? '#ffffff'
              : (editingTextId
                  ? elements.find(el => el.id === editingTextId)?.textBgColor
                  : clonedTools.find(c => c.id === activeCloneId)?.textBgColor)
          }
          textBgOpacity={
            (tool === 'callout' || (editingTextId && elements.find(el => el.id === editingTextId)?.type === 'callout'))
              ? 1.0
              : (editingTextId
                  ? elements.find(el => el.id === editingTextId)?.textBgOpacity
                  : clonedTools.find(c => c.id === activeCloneId)?.textBgOpacity)
          }
          colorSlots={colorSlots}
          style={(() => {
            if (!textInput) return {};
            const margin = 20;
            let left = textInput.x;
            let top = textInput.y;
            if (typeof window !== 'undefined') {
              left = Math.max(margin, Math.min(left, window.innerWidth - 100));
              top = Math.max(margin, Math.min(top, window.innerHeight - 100));
            }
            return { left, top };
          })()}
          onChange={(newVal) => {
            textInputValRef.current = newVal;
            setActiveTextVal(newVal);
          }}
          onBlur={() => handleTextSubmit(false)}
          onKeyDown={(e) => {
            // Nhấn phím Enter (không kèm Shift): Lưu và kết thúc nhập
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              handleTextSubmit(false);
            }
            // Nhấn Shift+Enter: Cho phép xuống dòng bên trong textarea
            else if (e.key === 'Enter' && e.shiftKey) {
              e.stopPropagation();
              // Cho phép chèn ký tự \n bình thường
            }
            else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              handleTextSubmit(true); // Lưu chữ đã gõ và tự động chuyển sang Bàn tay để di chuyển ngay!
            }
          }}
        />
      )}

      {/* 3. Floating Toolbar (2 hàng dọc mờ mịn, icon siêu nhỏ gọn bằng 1/2) */}
      <div
        className={styles.toolbar}
        style={{
          left: `${toolbarPos.x}px`,
          top: `${toolbarPos.y}px`,
          flexDirection: 'column',
          alignItems: 'stretch',
          borderRadius: '16px',
          padding: '8px 10px',
          gap: '8px',
          width: 'fit-content'
        }}
      >
        {/* Hàng 1: Công cụ vẽ cơ bản (Các icon size=12 nhỏ gọn bằng ~1/2 cũ) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Nắm kéo di chuyển toolbar */}
          <div
            className={styles.dragHandle}
            onMouseDown={handleToolbarMouseDown}
            title="Kéo thả di chuyển thanh công cụ"
            style={{ padding: '0 2px', marginRight: '2px' }}
          >
            <GripVertical size={12} />
          </div>

          {/* Nút Chuột tương tác */}
          <button
            className={`${styles.btn} ${tool === 'cursor' ? styles.btnActive : ''}`}
            onClick={() => {
              setSelectedId(null);
              setTool('cursor');
            }}
            data-tooltip={getToolTooltip('cursor', 'Chuột tương tác')}
          >
            <MousePointer size={12} />
          </button>

          {/* Nút Bàn tay chọn & di chuyển đối tượng */}
          <button
            className={`${styles.btn} ${tool === 'hand' ? styles.btnActive : ''}`}
            onClick={() => setTool('hand')}
            data-tooltip={getToolTooltip('hand', 'Bàn tay (Di chuyển)')}
          >
            <Hand size={12} />
          </button>

          {/* Bút chì vẽ tự do kèm dropdown chọn đầu bút */}
          <div className={styles.pencilGroup}>
            <button
              className={`${styles.btn} ${tool === 'pencil' && !activeCloneId ? styles.btnActive : ''}`}
              onClick={() => {
                setSelectedId(null);
                setTool('pencil');
                setActiveCloneId(null);
              }}
              data-tooltip={getToolTooltip('pencil', `Cọ vẽ: ${penStyle === 'ballpoint' ? 'Bút bi' : penStyle === 'fountain' ? 'Bút máy' : 'Bút lông'}`)}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            >
              <Pencil size={12} />
            </button>
            <button
              className={`${styles.btn} ${tool === 'pencil' && !activeCloneId ? styles.btnActive : ''}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowPenStyleMenu(prev => !prev);
              }}
              style={{
                width: '10px',
                padding: 0,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                marginLeft: '-1px',
                borderLeft: '1px solid rgba(255,255,255,0.1)'
              }}
              title="Chọn đầu bút cọ vẽ"
            >
              <ChevronDown size={8} />
            </button>

            {/* Menu chọn đầu bút mờ mịn Glassmorphism - Tự động đổi vị trí Lên/Xuống tránh tràn viền màn hình */}
            {showPenStyleMenu && (
              <div
                className={styles.penStyleMenu}
                style={{
                  bottom: toolbarPos.y < 160 ? 'auto' : '125%',
                  top: toolbarPos.y < 160 ? '125%' : 'auto',
                }}
              >
                <div
                  className={`${styles.penStyleItem} ${penStyle === 'ballpoint' ? styles.penStyleItemActive : ''}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setPenStyle('ballpoint');
                    setShowPenStyleMenu(false);
                    setTool('pencil');
                    setActiveCloneId(null);
                  }}
                >
                  <span>✒️ Bút bi (Đều nét)</span>
                </div>
                <div
                  className={`${styles.penStyleItem} ${penStyle === 'fountain' ? styles.penStyleItemActive : ''}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setPenStyle('fountain');
                    setShowPenStyleMenu(false);
                    setTool('pencil');
                    setActiveCloneId(null);
                  }}
                >
                  <span>🖋️ Bút máy (Thanh đậm vừa)</span>
                </div>
                <div
                  className={`${styles.penStyleItem} ${penStyle === 'brush' ? styles.penStyleItemActive : ''}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setPenStyle('brush');
                    setShowPenStyleMenu(false);
                    setTool('pencil');
                    setActiveCloneId(null);
                  }}
                >
                  <span>🖌️ Bút lông (Cực nhạy lực)</span>
                </div>
              </div>
            )}
          </div>

          {/* Bút highlight */}
          <button
            className={`${styles.btn} ${tool === 'highlight' && !activeCloneId ? styles.btnActive : ''}`}
            onClick={() => {
              setSelectedId(null);
              setTool('highlight');
              setActiveCloneId(null);
            }}
            data-tooltip={getToolTooltip('highlight', 'Bút highlight')}
          >
            <Highlighter size={12} />
          </button>

          {/* Nút Đèn chiếu (Flashlight / Spotlight) */}
          <div className={styles.pencilGroup}>
            <button
              className={`${styles.btn} ${isFlashlightActive ? styles.btnActive : ''}`}
              onClick={() => {
                setIsFlashlightActive(prev => !prev);
              }}
              data-tooltip={getToolTooltip('flashlight', 'Tiêu điểm đèn chiếu')}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            >
              <FlashIcon style={{ width: '12px', height: '12px' }} />
            </button>
            <button
              className={`${styles.btn} ${isFlashlightActive ? styles.btnActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setFlashlightShape(prev => prev === 'circle' ? 'rectangle' : 'circle');
              }}
              style={{
                width: '10px',
                padding: 0,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                marginLeft: '-1px',
                borderLeft: '1px solid rgba(255,255,255,0.1)'
              }}
              title="Đổi hình dạng đèn chiếu (Tròn / Chữ nhật)"
            >
              {flashlightShape === 'circle' ? <CircleIcon size={6} /> : <Square size={6} />}
            </button>
          </div>

          {/* Cục tẩy */}
          <button
            className={`${styles.btn} ${tool === 'eraser' ? styles.btnActive : ''}`}
            onClick={() => {
              setSelectedId(null);
              setTool('eraser');
              setActiveCloneId(null);
            }}
            data-tooltip={getToolTooltip('eraser', 'Cục tẩy')}
          >
            <Eraser size={12} />
          </button>

          {/* Vẽ Rectangle */}
          <button
            className={`${styles.btn} ${tool === 'rectangle' && !activeCloneId ? styles.btnActive : ''}`}
            onClick={() => {
              setSelectedId(null);
              setTool('rectangle');
              setActiveCloneId(null);
            }}
            data-tooltip={getToolTooltip('rectangle', 'Hình chữ nhật')}
          >
            <Square size={12} />
          </button>

          {/* Vẽ Circle */}
          <button
            className={`${styles.btn} ${tool === 'circle' ? styles.btnActive : ''}`}
            onClick={() => {
              setSelectedId(null);
              setTool('circle');
              setActiveCloneId(null);
            }}
            data-tooltip={getToolTooltip('circle', 'Hình tròn')}
          >
            <CircleIcon size={12} />
          </button>

          {/* Gõ chữ */}
          <button
            className={`${styles.btn} ${tool === 'text' ? styles.btnActive : ''}`}
            onClick={() => {
              setSelectedId(null);
              setTool('text');
              setActiveCloneId(null);
            }}
            data-tooltip={getToolTooltip('text', 'Viết chữ nháp')}
          >
            <Type size={12} />
          </button>

          {/* Callout */}
          <button
            className={`${styles.btn} ${tool === 'callout' ? styles.btnActive : ''}`}
            onClick={() => {
              setSelectedId(null);
              setTool('callout');
              setActiveCloneId(null);
            }}
            data-tooltip={getToolTooltip('callout', 'Ghi chú mũi tên (Callout)')}
          >
            <MessageSquare size={12} />
          </button>

          {/* 6 chấm màu: click = chọn màu, double-click = mở bảng màu preset để đổi slot */}
          <div className={styles.colorPicker} style={{ position: 'relative', padding: '0 6px', margin: '0 2px' }}>
            {/* Palette popup Apple-style */}
            {colorPaletteSlot !== null && (
              <div
                ref={palettePopupRef}
                className={styles.colorPalettePopup}
                style={{
                  bottom: toolbarPos.y < 160 ? 'auto' : '130%',
                  top: toolbarPos.y < 160 ? '130%' : 'auto',
                }}
              >
                <div className={styles.colorPaletteTitle}>
                  Đổi màu ô {COLOR_SLOT_KEYS[colorPaletteSlot]} — chọn màu:
                </div>
                <div className={styles.colorPaletteGrid}>
                  {PALETTE_COLORS.map((c, idx) => (
                    <div
                      key={idx}
                      className={styles.colorSwatch}
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        const slot = colorPaletteSlot;
                        setColorSlots(prev => {
                          const next = [...prev];
                          next[slot] = c;
                          localStorage.setItem('webtoeic_color_slots', JSON.stringify(next));
                          return next;
                        });
                        updateColor(c);
                        setColorPaletteSlot(null);
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Hàng 1: slot 0,1,2 */}
            <div className={styles.colorRow} style={{ gap: '3px' }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`${styles.colorDot} ${color === colorSlots[i] && !activeCloneId ? styles.colorDotActive : ''}`}
                  style={{ backgroundColor: colorSlots[i] }}
                  onClick={() => updateColor(colorSlots[i])}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setColorPaletteSlot(prev => prev === i ? null : i);
                  }}
                  title={`${COLOR_SLOT_NAMES[i]} (${COLOR_SLOT_KEYS[i]}) — double-click để đổi màu`}
                />
              ))}
            </div>
            {/* Hàng 2: slot 3,4,5 */}
            <div className={styles.colorRow} style={{ gap: '3px', marginTop: '3px' }}>
              {[3, 4, 5].map(i => (
                <div
                  key={i}
                  className={`${styles.colorDot} ${color === colorSlots[i] && !activeCloneId ? styles.colorDotActive : ''}`}
                  style={{ backgroundColor: colorSlots[i] }}
                  onClick={() => updateColor(colorSlots[i])}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setColorPaletteSlot(prev => prev === i ? null : i);
                  }}
                  title={`${COLOR_SLOT_NAMES[i]} (${COLOR_SLOT_KEYS[i]}) — double-click để đổi màu`}
                />
              ))}
            </div>
          </div>

          {/* Chỉ số kích thước nét vẽ */}
          <div className={styles.sizeIndicator} title="Kích cỡ nét: Phím [ giảm, ] tăng" style={{ padding: '0 4px', fontSize: '9px' }}>
            <span>Size:</span>
            <span>
              {tool === 'eraser'
                ? `${eraserSize}px`
                : tool === 'text'
                  ? `${fontSize}px`
                  : tool === 'highlight'
                    ? `${highlightSize}px`
                    : tool === 'rectangle'
                      ? `${rectangleSize}px`
                      : tool === 'circle'
                        ? `${circleSize}px`
                        : `${pencilSize}px`}
            </span>
          </div>

          {/* Nút Clear All Thùng rác */}
          <button
            className={`${styles.btn} ${styles.btnTrash}`}
            onClick={clearCanvas}
            data-tooltip="Xóa hết (Ctrl+Backspace)"
          >
            <Trash2 size={12} />
          </button>

          {/* Nút Reset toàn bộ công cụ */}
          <button
            className={`${styles.btn} ${styles.btnTrash}`}
            style={{ color: '#38bdf8' }}
            onClick={hardResetDrawTool}
            data-tooltip="Làm mới hoàn toàn"
          >
            <RotateCcw size={12} />
          </button>

          {/* Nút Lịch sử comment */}
          <button
            className={`${styles.btn} ${showCommentHistory ? styles.btnActive : ''}`}
            onClick={() => setShowCommentHistory(prev => !prev)}
            data-tooltip="Lịch sử ghi chú & chú thích"
            style={{ color: '#fbbf24' }}
          >
            <ClipboardList size={12} />
          </button>

          {/* Nút Cài đặt Gear */}
          <button
            className={`${styles.btn} ${styles.btnGear}`}
            onClick={() => {
              setDraftHotkeys({ ...customHotkeys });
              setDraftClonedTools([...clonedTools]);
              setDraftFontSize(fontSize);
              setDraftFontFamily(fontFamily);
              setDraftEraserTargets({ ...eraserTargets });
              setDraftEraserMode(eraserMode);
              setShowSettings(true);
              setActiveTab('shortcuts');
              setListeningKeyFor(null);
              setNewCloneName('');
              setNewCloneBaseType('pencil');
              setNewCloneColor('#EF4444');
              setNewCloneHotkey('');
              setNewCloneTextSize(20);
              setNewCloneTextStyle('normal');
              setNewCloneFontFamily('sans-serif');
              setNewCloneTextHasBorder(false);
              setNewCloneTextBorderWidth(1);
              setNewCloneTextBgColor('#FFFFFF');
              setNewCloneTextBgOpacity(30);
              setEditingCloneId(null);
            }}
            data-tooltip="Cấu hình phím tắt & Bút vẽ"
          >
            <Settings size={12} />
          </button>

          {/* Nút Toggle mở/đóng hàng bút Clone (Hiện khi có bút clone) */}
          {clonedTools.length > 0 && (
            <button
              className={`${styles.btn} ${showClones ? styles.btnActive : ''}`}
              onClick={() => setShowClones(prev => !prev)}
              data-tooltip={showClones ? "Ẩn danh sách bút nhanh" : "Hiện danh sách bút nhanh"}
              style={{ color: '#38bdf8' }}
            >
              <Plus size={12} style={{ transform: showClones ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>
          )}

          {/* Nút Đóng hoàn toàn công cụ */}
          <button
            className={`${styles.btn} ${styles.btnClose}`}
            onClick={() => setIsActive(false)}
            data-tooltip="Đóng công cụ vẽ"
          >
            <X size={12} />
          </button>
        </div>

        {/* Hàng 2: Toàn bộ nút Bút Clone được xếp ở dưới để tối giản không gian (Chỉ hiện khi nhấn nút toggle) */}
        {showClones && clonedTools.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingLeft: '18px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '9px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>Bút nhanh:</span>

            {/* Cloned Pencils */}
            {clonedTools.filter(c => c.baseType === 'pencil').map(clone => (
              <button
                key={clone.id}
                className={`${styles.btnClone} ${activeCloneId === clone.id ? styles.btnCloneActive : ''}`}
                style={{ '--clone-color': clone.color } as React.CSSProperties}
                onClick={() => {
                  setSelectedId(null);
                  setTool('pencil');
                  setColor(clone.color);
                  setActiveCloneId(clone.id);
                }}
                data-tooltip={`${clone.name} (${clone.hotkey.toUpperCase()})`}
              >
                <Pencil size={10} style={{ color: clone.color }} />
                <div className={styles.cloneColorBadge} style={{ backgroundColor: clone.color }} />
              </button>
            ))}

            {/* Cloned Highlights */}
            {clonedTools.filter(c => c.baseType === 'highlight').map(clone => (
              <button
                key={clone.id}
                className={`${styles.btnClone} ${activeCloneId === clone.id ? styles.btnCloneActive : ''}`}
                style={{ '--clone-color': clone.color } as React.CSSProperties}
                onClick={() => {
                  setSelectedId(null);
                  setTool('highlight');
                  setColor(clone.color);
                  setActiveCloneId(clone.id);
                }}
                data-tooltip={`${clone.name} (${clone.hotkey.toUpperCase()})`}
              >
                <Highlighter size={10} style={{ color: clone.color }} />
                <div className={styles.cloneColorBadge} style={{ backgroundColor: clone.color }} />
              </button>
            ))}

            {/* Cloned Rectangles */}
            {clonedTools.filter(c => c.baseType === 'rectangle').map(clone => (
              <button
                key={clone.id}
                className={`${styles.btnClone} ${activeCloneId === clone.id ? styles.btnCloneActive : ''}`}
                style={{ '--clone-color': clone.color } as React.CSSProperties}
                onClick={() => {
                  setSelectedId(null);
                  setTool('rectangle');
                  setColor(clone.color);
                  setActiveCloneId(clone.id);
                }}
                data-tooltip={`${clone.name} (${clone.hotkey.toUpperCase()})`}
              >
                <Square size={10} style={{ color: clone.color }} />
                <div className={styles.cloneColorBadge} style={{ backgroundColor: clone.color }} />
              </button>
            ))}

            {/* Cloned Texts */}
            {clonedTools.filter(c => c.baseType === 'text').map(clone => (
              <button
                key={clone.id}
                className={`${styles.btnClone} ${activeCloneId === clone.id ? styles.btnCloneActive : ''}`}
                style={{ '--clone-color': clone.color } as React.CSSProperties}
                onClick={() => {
                  setSelectedId(null);
                  setTool('text');
                  setColor(clone.color);
                  setActiveCloneId(clone.id);
                  if (clone.textSize) {
                    setFontSize(clone.textSize);
                  }
                }}
                data-tooltip={`${clone.name} (${clone.hotkey.toUpperCase()})`}
              >
                <Type size={10} style={{ color: clone.color }} />
                <div className={styles.cloneColorBadge} style={{ backgroundColor: clone.color }} />
              </button>
            ))}

            {/* Cloned Callouts */}
            {clonedTools.filter(c => c.baseType === 'callout').map(clone => (
              <button
                key={clone.id}
                className={`${styles.btnClone} ${activeCloneId === clone.id ? styles.btnCloneActive : ''}`}
                style={{ '--clone-color': clone.color } as React.CSSProperties}
                onClick={() => {
                  setSelectedId(null);
                  setTool('callout');
                  setColor(clone.color);
                  setActiveCloneId(clone.id);
                  if (clone.textSize) {
                    setFontSize(clone.textSize);
                  }
                }}
                data-tooltip={`${clone.name} (${clone.hotkey.toUpperCase()})`}
              >
                <MessageSquare size={10} style={{ color: clone.color }} />
                <div className={styles.cloneColorBadge} style={{ backgroundColor: clone.color }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Settings Modal Glassmorphism (Admin-Only) */}
      {showSettings && (
        <div className={styles.settingsModalOverlay}>
          <div className={styles.settingsModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Settings size={18} style={{ color: '#38bdf8' }} />
                <span>Cấu hình công cụ vẽ màn hình (Admin)</span>
              </h3>
              <button
                className={styles.btnCloseModal}
                onClick={() => setShowSettings(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalTabs}>
              <button
                className={`${styles.modalTab} ${activeTab === 'shortcuts' ? styles.modalTabActive : ''}`}
                onClick={() => {
                  setActiveTab('shortcuts');
                  setListeningKeyFor(null);
                }}
              >
                Phím tắt công cụ
              </button>
              <button
                className={`${styles.modalTab} ${activeTab === 'clones' ? styles.modalTabActive : ''}`}
                onClick={() => {
                  setActiveTab('clones');
                  setListeningKeyFor(null);
                }}
              >
                Quản lý Bút vẽ clone
              </button>
              <button
                className={`${styles.modalTab} ${activeTab === 'eraser' ? styles.modalTabActive : ''}`}
                onClick={() => {
                  setActiveTab('eraser');
                  setListeningKeyFor(null);
                }}
              >
                Cấu hình Cục tẩy
              </button>
            </div>

            <div className={styles.modalContent}>
              {activeTab === 'shortcuts' && (
                <div className={styles.hotkeyList}>
                  {/* Cấu hình kích thước cỡ chữ nháp trực quan */}
                  <div className={styles.hotkeyItem} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <span className={styles.hotkeyLabel} style={{ fontWeight: 'bold' }}>Cỡ chữ nháp mặc định</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>Điều chỉnh kích thước chữ hiển thị trên màn hình</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min="8"
                        max="100"
                        value={draftFontSize || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            setDraftFontSize(val);
                          } else {
                            setDraftFontSize(0);
                          }
                        }}
                        onBlur={() => {
                          // Đảm bảo khi blur ra ngoài thì cỡ chữ nằm trong khoảng hợp lệ [8, 100]
                          setDraftFontSize(prev => Math.min(100, Math.max(8, prev || 14)));
                        }}
                        style={{
                          width: '72px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#38bdf8',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>
                        px
                      </span>
                    </div>
                  </div>

                  {/* Cấu hình font chữ nháp trực quan */}
                  <div className={styles.hotkeyItem} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <span className={styles.hotkeyLabel} style={{ fontWeight: 'bold' }}>Font chữ nháp mặc định</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>Chọn phông chữ hiển thị cho công cụ text và callout</span>
                    </div>
                    <select
                      value={draftFontFamily || 'sans-serif'}
                      onChange={(e) => setDraftFontFamily(e.target.value)}
                      className={styles.cloneSelect}
                      style={{ width: '160px' }}
                    >
                      <option value="sans-serif">Sans-serif (Mặc định)</option>
                      <option value="serif">Serif (Có chân)</option>
                      <option value="monospace">Monospace (Lập trình)</option>
                      <option value='"Comic Sans MS", cursive'>Comic Sans (Dễ thương)</option>
                      <option value='"Playpen Sans", cursive'>Playpen Sans (Nét vẽ tự nhiên)</option>
                      <option value='"Patrick Hand", cursive'>Patrick Hand (Viết tay gọn gàng)</option>
                      <option value='"Caveat", cursive'>Caveat (Viết tay nghệ thuật)</option>
                      <option value='"Pacifico", cursive'>Pacifico (Cursive điệu đà)</option>
                    </select>
                  </div>

                  {Object.keys(draftHotkeys).map((key) => {
                    // Trích xuất icon tương ứng để hiển thị bên cạnh nhãn phím tắt
                    const renderHotkeyIcon = () => {
                      const iconSize = 13;
                      const iconStyle = { color: 'rgba(255,255,255,0.4)', marginRight: '2px' };
                      if (key === 'cursor') return <MousePointer size={iconSize} style={iconStyle} />;
                      if (key === 'hand') return <Hand size={iconSize} style={iconStyle} />;
                      if (key === 'pencil') return <Pencil size={iconSize} style={iconStyle} />;
                      if (key === 'highlight') return <Highlighter size={iconSize} style={iconStyle} />;
                      if (key === 'flashlight') return <FlashIcon size={iconSize} style={iconStyle as any} />;
                      if (key === 'eraser') return <Eraser size={iconSize} style={iconStyle} />;
                      if (key === 'rectangle') return <Square size={iconSize} style={iconStyle} />;
                      if (key === 'circle') return <CircleIcon size={iconSize} style={iconStyle} />;
                      if (key === 'text') return <Type size={iconSize} style={iconStyle} />;
                      if (key === 'clear') return <Trash2 size={iconSize} style={{ color: 'rgba(239, 68, 68, 0.5)', marginRight: '2px' }} />;
                      if (key === 'ghostmode') return <Hand size={iconSize} style={{ color: '#38bdf8', opacity: 0.6, marginRight: '2px' }} />;
                      return null;
                    };

                    return (
                      <div key={key} className={styles.hotkeyItem}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {key.startsWith('color') && (
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: colorSlots[parseInt(key.replace('color', '')) - 1],
                                border: '1px solid rgba(255,255,255,0.2)'
                              }}
                            />
                          )}
                          {renderHotkeyIcon()}
                          <span className={styles.hotkeyLabel}>{HOTKEY_NAMES[key] || key}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            className={`${styles.hotkeyButton} ${listeningKeyFor === key ? styles.hotkeyListeningActive : ''}`}
                            onClick={() => setListeningKeyFor(key)}
                          >
                            {listeningKeyFor === key ? 'NHẤN PHÍM...' : (draftHotkeys[key] || 'KHÔNG DÙNG')}
                          </button>
                          {draftHotkeys[key] && (
                            <button
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              onClick={() => {
                                setDraftHotkeys(prev => ({
                                  ...prev,
                                  [key]: ''
                                }));
                              }}
                              title="Xóa phím tắt"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'clones' && (
                <div>
                  <div className={styles.cloneForm}>
                    <div className={styles.cloneFormRow}>
                      <input
                        type="text"
                        placeholder="Tên bút clone (vd: Bút vẽ đỏ 4px)..."
                        value={newCloneName}
                        onChange={(e) => setNewCloneName(e.target.value)}
                        className={styles.cloneInput}
                      />
                      <select
                        value={newCloneBaseType}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setNewCloneBaseType(val);
                          if (val === 'callout') {
                            setNewCloneTextHasBorder(true);
                          }
                        }}
                        className={styles.cloneSelect}
                      >
                        <option value="pencil">Bút chì gốc</option>
                        <option value="highlight">Highlight gốc</option>
                        <option value="rectangle">Hình chữ nhật</option>
                        <option value="text">Chữ viết</option>
                        <option value="callout">Callout (Chú thích mũi tên)</option>
                      </select>
                    </div>

                    {(newCloneBaseType === 'text' || newCloneBaseType === 'callout') && (
                      <>
                        <div className={styles.cloneFormRow} style={{ marginTop: '0px', gap: '8px', marginBottom: '12px' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Cỡ chữ:</span>
                            <select
                              value={newCloneTextSize}
                              onChange={(e) => setNewCloneTextSize(parseInt(e.target.value))}
                              className={styles.cloneSelect}
                              style={{ width: '100%' }}
                            >
                              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64].map(sz => (
                                <option key={sz} value={sz}>{sz}px</option>
                              ))}
                            </select>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Kiểu chữ:</span>
                            <select
                              value={newCloneTextStyle}
                              onChange={(e) => setNewCloneTextStyle(e.target.value as any)}
                              className={styles.cloneSelect}
                              style={{ width: '100%' }}
                            >
                              <option value="normal">Thường</option>
                              <option value="bold">In đậm</option>
                              <option value="italic">Nghiêng</option>
                              <option value="bold-italic">Đậm & Nghiêng</option>
                            </select>
                          </div>
                          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Phông chữ:</span>
                            <select
                              value={newCloneFontFamily}
                              onChange={(e) => setNewCloneFontFamily(e.target.value)}
                              className={styles.cloneSelect}
                              style={{ width: '100%' }}
                            >
                              <option value="sans-serif">Sans-serif</option>
                              <option value="serif">Serif</option>
                              <option value="monospace">Monospace</option>
                              <option value='"Comic Sans MS", cursive'>Comic Sans</option>
                              <option value='"Playpen Sans", cursive'>Playpen Sans</option>
                              <option value='"Patrick Hand", cursive'>Patrick Hand</option>
                              <option value='"Caveat", cursive'>Caveat</option>
                              <option value='"Pacifico", cursive'>Pacifico</option>
                            </select>
                          </div>
                        </div>

                        {/* Các cài đặt khung viền và màu nền */}
                        <div className={styles.cloneFormRow} style={{ marginTop: '0px', gap: '12px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                              <input
                                type="checkbox"
                                checked={newCloneTextHasBorder}
                                onChange={(e) => setNewCloneTextHasBorder(e.target.checked)}
                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              />
                              <span>Đóng khung viền (Border)</span>
                            </label>

                            {newCloneTextHasBorder && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '23px' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Độ dày:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={newCloneTextBorderWidth}
                                  onChange={(e) => setNewCloneTextBorderWidth(Math.max(1, parseInt(e.target.value) || 1))}
                                  className={styles.cloneSelect}
                                  style={{ width: '60px', padding: '3px 6px', textAlign: 'center' }}
                                />
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>px</span>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}>Tô màu nền:</span>
                              <input
                                type="color"
                                value={newCloneTextBgColor}
                                onChange={(e) => setNewCloneTextBgColor(e.target.value)}
                                style={{ width: '26px', height: '20px', border: '1px solid rgba(255,255,255,0.2)', padding: 0, borderRadius: '4px', cursor: 'pointer', background: 'none' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'between', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                                <span>Độ trong suốt nền:</span>
                                <span style={{ marginLeft: 'auto', color: '#38bdf8', fontWeight: 'bold' }}>{newCloneTextBgOpacity}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={newCloneTextBgOpacity}
                                onChange={(e) => setNewCloneTextBgOpacity(parseInt(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer', height: '4px' }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className={styles.cloneColorGrid}>
                      {PALETTE_COLORS.map((c) => (
                        <div
                          key={c}
                          className={`${styles.cloneColorSelectDot} ${newCloneColor === c ? styles.cloneColorSelectDotActive : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setNewCloneColor(c)}
                          title={c}
                        />
                      ))}
                      {/* Nút chọn màu custom bằng bảng màu hệ thống */}
                      <label
                        className={`${styles.cloneColorSelectDot}`}
                        style={{
                          background: 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '10px',
                          color: '#fff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}
                        title="Chọn màu tự do..."
                      >
                        +
                        <input
                          type="color"
                          value={newCloneColor}
                          onChange={(e) => setNewCloneColor(e.target.value)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    <div className={styles.cloneFormRow} style={{ gap: '10px' }}>
                      <button
                        className={`${styles.hotkeyButton} ${listeningKeyFor === 'newClone' ? styles.hotkeyListeningActive : ''}`}
                        onClick={() => setListeningKeyFor('newClone')}
                        style={{ flex: 2 }}
                      >
                        {listeningKeyFor === 'newClone'
                          ? 'NHẤN PHÍM TẮT...'
                          : newCloneHotkey
                            ? `Phím tắt: ${newCloneHotkey.toUpperCase()}`
                            : 'Gán phím tắt...'}
                      </button>

                      {editingCloneId && (
                        <button
                          className={styles.btnCancel}
                          onClick={() => {
                            setEditingCloneId(null);
                            setNewCloneName('');
                            setNewCloneHotkey('');
                            setNewCloneFontFamily('sans-serif');
                            setNewCloneTextHasBorder(false);
                            setNewCloneTextBorderWidth(1);
                            setNewCloneTextBgColor('#FFFFFF');
                            setNewCloneTextBgOpacity(30);
                          }}
                          style={{ padding: '0 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          Hủy sửa
                        </button>
                      )}

                      <button
                        className={styles.btnCreateClone}
                        style={{ flex: 3 }}
                        onClick={() => {
                          if (!newCloneName.trim()) {
                            alert("Vui lòng nhập tên bút clone");
                            return;
                          }
                          const finalName = newCloneName.trim();

                          // Chỉ check trùng phím tắt nếu người dùng có gán phím tắt
                          if (newCloneHotkey) {
                            const duplicateOriginal = Object.values(draftHotkeys).includes(newCloneHotkey);
                            const duplicateClone = draftClonedTools.some(c => c.hotkey === newCloneHotkey && c.id !== editingCloneId);
                            if (duplicateOriginal || duplicateClone) {
                              alert("Phím tắt này đã được sử dụng! Vui lòng chọn phím khác.");
                              return;
                            }
                          }

                          if (editingCloneId) {
                            // Cập nhật bút clone đã chọn
                            setDraftClonedTools(prev => prev.map(c => {
                              if (c.id === editingCloneId) {
                                return {
                                  ...c,
                                  baseType: newCloneBaseType,
                                  name: finalName,
                                  color: newCloneColor,
                                  hotkey: newCloneHotkey,
                                  textSize: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextSize : undefined,
                                  textStyle: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextStyle : undefined,
                                  fontFamily: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneFontFamily : undefined,
                                  textHasBorder: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextHasBorder : undefined,
                                  textBorderWidth: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextBorderWidth : undefined,
                                  textBgColor: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextBgColor : undefined,
                                  textBgOpacity: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? (newCloneTextBgOpacity / 100) : undefined
                                };
                              }
                              return c;
                            }));
                            setEditingCloneId(null);
                          } else {
                            // Tạo mới bút clone
                            const newClone: ClonedTool = {
                              id: Date.now().toString(),
                              baseType: newCloneBaseType,
                              name: finalName,
                              color: newCloneColor,
                              hotkey: newCloneHotkey,
                              textSize: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextSize : undefined,
                              textStyle: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextStyle : undefined,
                              fontFamily: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneFontFamily : undefined,
                              textHasBorder: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextHasBorder : undefined,
                              textBorderWidth: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextBorderWidth : undefined,
                              textBgColor: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? newCloneTextBgColor : undefined,
                              textBgOpacity: (newCloneBaseType === 'text' || newCloneBaseType === 'callout') ? (newCloneTextBgOpacity / 100) : undefined
                            };
                            setDraftClonedTools(prev => [...prev, newClone]);
                          }

                          setNewCloneName('');
                          setNewCloneHotkey('');
                          setNewCloneFontFamily('sans-serif');
                          setNewCloneTextHasBorder(false);
                          setNewCloneTextBorderWidth(1);
                          setNewCloneTextBgColor('#FFFFFF');
                          setNewCloneTextBgOpacity(30);
                        }}
                      >
                        {editingCloneId ? 'Lưu Thay Đổi' : 'Thêm Bút'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.cloneList}>
                    {draftClonedTools.length === 0 ? (
                      <div style={{ textAlign: 'center', opacity: 0.5, padding: '16px 0' }}>
                        Chưa có bút vẽ clone nào được tạo.
                      </div>
                    ) : (
                      draftClonedTools.map((clone) => (
                        <div
                          key={clone.id}
                          className={`${styles.cloneItem} ${editingCloneId === clone.id ? styles.cloneItemEditing : ''}`}
                          onClick={() => {
                            setEditingCloneId(clone.id);
                            setNewCloneName(clone.name);
                            setNewCloneBaseType(clone.baseType);
                            setNewCloneColor(clone.color);
                            setNewCloneHotkey(clone.hotkey);
                            if (clone.baseType === 'text' || clone.baseType === 'callout') {
                              setNewCloneTextSize(clone.textSize || 20);
                              setNewCloneTextStyle(clone.textStyle || 'normal');
                              setNewCloneFontFamily(clone.fontFamily || 'sans-serif');
                              setNewCloneTextHasBorder(!!clone.textHasBorder);
                              setNewCloneTextBorderWidth(clone.textBorderWidth || 1);
                              setNewCloneTextBgColor(clone.textBgColor || '#FFFFFF');
                              setNewCloneTextBgOpacity(clone.textBgOpacity !== undefined ? Math.round(clone.textBgOpacity * 100) : 30);
                            }
                          }}
                          title="Nhấp vào để sửa thông số"
                        >
                          <div className={styles.cloneItemLeft}>
                            <div className={styles.cloneItemColorDot} style={{ backgroundColor: clone.color }} />
                            <div>
                              <div className={styles.cloneItemName}>
                                {clone.name}
                                {editingCloneId === clone.id && (
                                  <span style={{ fontSize: '10px', color: '#38bdf8', marginLeft: '6px', fontStyle: 'italic', fontWeight: 'normal' }}>
                                    (Đang sửa)
                                  </span>
                                )}
                              </div>
                              <div className={styles.cloneItemMeta}>
                                {clone.baseType === 'pencil'
                                  ? 'Bút chì'
                                  : clone.baseType === 'highlight'
                                    ? 'Highlight'
                                    : clone.baseType === 'rectangle'
                                      ? 'Hình chữ nhật'
                                      : clone.baseType === 'callout'
                                        ? `Callout (${clone.textSize}px, ${clone.textStyle === 'bold' ? 'Đậm' : clone.textStyle === 'italic' ? 'Nghiêng' : clone.textStyle === 'bold-italic' ? 'Đậm & Nghiêng' : 'Thường'})`
                                        : `Chữ viết (${clone.textSize}px, ${clone.textStyle === 'bold' ? 'Đậm' : clone.textStyle === 'italic' ? 'Nghiêng' : clone.textStyle === 'bold-italic' ? 'Đậm & Nghiêng' : 'Thường'})`}
                              </div>
                            </div>
                          </div>
                          <div className={styles.cloneItemRight}>
                            <span className={styles.cloneItemHotkey}>{clone.hotkey}</span>
                            <button
                              className={styles.btnDeleteClone}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (editingCloneId === clone.id) {
                                  setEditingCloneId(null);
                                  setNewCloneName('');
                                  setNewCloneHotkey('');
                                }
                                setDraftClonedTools(prev => prev.filter(c => c.id !== clone.id));
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

              {activeTab === 'eraser' && (
                <div className={styles.hotkeyList}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <span className={styles.hotkeyLabel} style={{ fontWeight: 'bold', fontSize: '13px', color: '#38bdf8' }}>Chế độ hoạt động của tẩy</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>Chọn cách thức hoạt động khi di chuột tẩy xóa.</span>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                        <input
                          type="radio"
                          name="eraserMode"
                          value="pixel"
                          checked={draftEraserMode === 'pixel'}
                          onChange={() => setDraftEraserMode('pixel')}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>Xóa điểm như hiện tại (Pixel Eraser)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                        <input
                          type="radio"
                          name="eraserMode"
                          value="stroke"
                          checked={draftEraserMode === 'stroke'}
                          onChange={() => setDraftEraserMode('stroke')}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>Xóa toàn bộ nét 1 lần (Stroke Eraser)</span>
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    <span className={styles.hotkeyLabel} style={{ fontWeight: 'bold', fontSize: '13px', color: '#38bdf8' }}>Chọn đối tượng tẩy xóa</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>Tích chọn loại nét vẽ/comment mà cục tẩy được phép xóa. Khi không chọn, tẩy sẽ bỏ qua loại đó.</span>
                  </div>

                  <div className={styles.hotkeyItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Pencil size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      <span className={styles.hotkeyLabel}>Nét vẽ bút chì (Pencil)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftEraserTargets.pencil}
                      onChange={(e) => setDraftEraserTargets(prev => ({ ...prev, pencil: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  <div className={styles.hotkeyItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Highlighter size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      <span className={styles.hotkeyLabel}>Bút dạ quang (Highlight)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftEraserTargets.highlight}
                      onChange={(e) => setDraftEraserTargets(prev => ({ ...prev, highlight: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  <div className={styles.hotkeyItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Square size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      <span className={styles.hotkeyLabel}>Hình học (Hình vuông, hình tròn)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftEraserTargets.shapes}
                      onChange={(e) => setDraftEraserTargets(prev => ({ ...prev, shapes: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  <div className={styles.hotkeyItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Type size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      <span className={styles.hotkeyLabel}>Văn bản (Text)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftEraserTargets.text}
                      onChange={(e) => setDraftEraserTargets(prev => ({ ...prev, text: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowSettings(false)}
                disabled={isSavingSettings}
              >
                Hủy
              </button>
              <button
                className={styles.btnSave}
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
              >
                {isSavingSettings ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCommentHistory && (
        <div className={styles.historyPanel}>
          <div className={styles.historyHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={16} style={{ color: '#fbbf24' }} />
              <span style={{ fontWeight: 600 }}>Lịch sử Chú thích ({elements.filter(el => el.type === 'text' || el.type === 'callout').length})</span>
            </div>
            <button onClick={() => setShowCommentHistory(false)} className={styles.historyCloseBtn}>
              <X size={14} />
            </button>
          </div>
          <div className={styles.historyList}>
            {elements.filter(el => el.type === 'text' || el.type === 'callout').length === 0 ? (
              <div className={styles.historyEmpty}>
                Không tìm thấy ghi chú nào đang hoạt động.
              </div>
            ) : (
              elements.filter(el => el.type === 'text' || el.type === 'callout').map(el => {
                const dateStr = !isNaN(parseInt(el.id)) 
                  ? new Date(parseInt(el.id)).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : "Vừa xong";
                return (
                  <div key={el.id} className={styles.historyItem}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={styles.historyBadge} style={{ backgroundColor: el.color + '22', color: el.color }}>
                          {el.type === 'callout' ? 'Callout' : 'Text'}
                        </span>
                        <span className={styles.historyTime}>{dateStr}</span>
                      </div>
                      <div className={styles.historyText} style={{ color: el.color }}>
                        {el.text || "(Trống)"}
                      </div>
                      <div className={styles.historyCoords}>
                        Vị trí gốc: X={Math.round(el.x || 0)}, Y={Math.round(el.y || 0)}
                        {el.anchorSelector ? ` · Neo: ${el.anchorSelector}` : ''}
                      </div>
                      {(() => {
                        const canvasRect = canvasRef.current?.getBoundingClientRect();
                        const translated = getTranslatedElement(el, canvasRect);
                        let debugStatus = "";
                        if (translated) {
                          debugStatus = `X_dịch=${Math.round(translated.x || 0)}, Y_dịch=${Math.round(translated.y || 0)}`;
                          if (el.absoluteX !== undefined) {
                            debugStatus += ` (Đã định vị)`;
                          }
                        } else {
                          debugStatus = "Hỏng neo (Fallback)";
                        }
                        return (
                          <div className={styles.historyCoords} style={{ fontSize: '11px', color: '#fbbf24', marginTop: '2px', fontWeight: 500 }}>
                            DEBUG: {debugStatus} | Container: {el.containerSelector ? 'Có' : 'Không'}
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => {
                          setSelectedId(el.id);
                          setTool('hand');
                        }}
                        className={styles.historyActionBtn}
                        title="Chọn và Focus phần tử này"
                      >
                        🎯
                      </button>
                      <button 
                        onClick={() => {
                          saveToUndoStack(elements);
                          setElements(prev => prev.filter(item => item.id !== el.id));
                        }}
                        className={styles.historyActionBtn}
                        title="Xóa chú thích này"
                        style={{ color: '#EF4444' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};
