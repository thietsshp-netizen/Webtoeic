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
  Plus
} from "lucide-react";
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



export type DrawTool = 'pencil' | 'highlight' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'cursor' | 'hand';
export type DrawColor = string; // Hex color string

export interface ClonedTool {
  id: string;
  baseType: 'pencil' | 'highlight' | 'rectangle' | 'text';
  name: string;
  color: string;
  hotkey: string;
  textSize?: number;
  textStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic';
  textHasBorder?: boolean;
  textBorderWidth?: number;
  textBgColor?: string;
  textBgOpacity?: number;
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
  '#FF3B30','#FF6B6B','#FF2D55','#FF375F','#D70015','#C41230','#FFCDD2','#FF8A80',
  // Cam & Đào
  '#FF9500','#FF9F0A','#FF6000','#FF8C42','#FFA07A','#FFAB40','#FF7043','#BF360C',
  // Vàng & Amber
  '#FFCC00','#FFD60A','#FFB300','#FFCA28','#F9A825','#FFF176','#FFF9C4','#FF8F00',
  // Xanh lá & Teal
  '#34C759','#30D158','#00C853','#43A047','#2E7D32','#00BFA5','#26C6DA','#1B5E20',
  // Xanh dương & Indigo
  '#007AFF','#0A84FF','#5AC8FA','#1E88E5','#1565C0','#5856D6','#3949AB','#0D47A1',
  // Tím & Nâu & Trắng/Đen
  '#AF52DE','#BF5AF2','#8E24AA','#A2845E','#6D4C41','#5C4033','#000000','#FFFFFF',
];

export interface DrawElement {
  id: string;
  type: 'pencil' | 'highlight' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'ellipse';
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
}

interface ScreenDrawOverlayProps {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

export const getElementFont = (size: number, textStyle?: string): string => {
  let stylePart = '500';
  if (textStyle === 'bold') stylePart = 'bold';
  else if (textStyle === 'italic') stylePart = 'italic 500';
  else if (textStyle === 'bold-italic') stylePart = 'bold italic';
  return `${stylePart} ${size}px sans-serif`;
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

  if (el.type === 'text') {
    if (el.x === undefined || el.y === undefined || !el.text) return false;
    const lines = el.text.split('\n');
    const linesCount = lines.length;
    let maxLineLen = 0;
    lines.forEach(l => {
      const clean = l.replace(/\*\*/g, "");
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
    else if (el.type === 'text') isTarget = textErasable;

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

export const ScreenDrawOverlay: React.FC<ScreenDrawOverlayProps> = ({ 
  isActive, 
  setIsActive 
}) => {
  const [tool, setToolState] = useState<DrawTool>('pencil');
  const [color, setColor] = useState<DrawColor>('#EF4444');

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
  
  // Custom Pen Styles (Bút bi, Bút máy, Bút lông)
  const [penStyle, setPenStyle] = useState<'ballpoint' | 'fountain' | 'brush'>('ballpoint');
  const [showPenStyleMenu, setShowPenStyleMenu] = useState(false);
  const [eraserSize, setEraserSize] = useState(24);
  const [fontSize, setFontSize] = useState(20);
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGrabbingPage, setIsGrabbingPage] = useState(false);
  const isGrabbingPageRef = useRef(false);
  const scrollTargetRef = useRef<HTMLElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Trạng thái vẽ nháp
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const canvasSnapshotRef = useRef<ImageData | null>(null);
  const activePointsRef = useRef<{ x: number; y: number; pressure?: number }[]>([]);

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

  // Trạng thái phóng to/thu nhỏ (Resize) các hình vẽ/text ở chế độ Bàn tay
  const [resizingInfo, setResizingInfo] = useState<{
    elementId: string;
    handle: 'nw' | 'ne' | 'se' | 'sw';
    startX: number;
    startY: number;
    startElX: number;
    startElY: number;
    startWidth: number;
    startHeight: number;
    startRadius: number;
    startSize: number;
  } | null>(null);
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<'nw' | 'ne' | 'se' | 'sw' | null>(null);

  // Đèn chiếu (Flashlight / Spotlight)
  const [isFlashlightActive, setIsFlashlightActive] = useState(false);
  const [flashlightSize, setFlashlightSize] = useState(100);
  const [flashlightShape, setFlashlightShape] = useState<'circle' | 'rectangle'>('circle');
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false); // Trạng thái nhấn giữ Shift tạm thời tương tác web bên dưới (Ghost mode)
  const [customHotkeys, setCustomHotkeys] = useState<Record<string, string>>(DEFAULT_HOTKEYS);
  const [clonedTools, setClonedTools] = useState<ClonedTool[]>([]);
  const [activeCloneId, setActiveCloneId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showClones, setShowClones] = useState(false); // Trạng thái ẩn/hiện hàng bút clone

  // Draft states for settings modal
  const [draftHotkeys, setDraftHotkeys] = useState<Record<string, string>>(DEFAULT_HOTKEYS);
  const [draftClonedTools, setDraftClonedTools] = useState<ClonedTool[]>([]);
  const [draftFontSize, setDraftFontSize] = useState(20);
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'clones' | 'eraser'>('shortcuts');
  const [listeningKeyFor, setListeningKeyFor] = useState<string | null>(null);

  // Form states for creating a new clone
  const [newCloneName, setNewCloneName] = useState('');
  const [newCloneBaseType, setNewCloneBaseType] = useState<'pencil' | 'highlight' | 'rectangle' | 'text'>('pencil');
  const [newCloneColor, setNewCloneColor] = useState('#EF4444');
  const [newCloneHotkey, setNewCloneHotkey] = useState('');
  const [newCloneTextSize, setNewCloneTextSize] = useState<number>(20);
  const [newCloneTextStyle, setNewCloneTextStyle] = useState<'normal' | 'bold' | 'italic' | 'bold-italic'>('normal');
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

    const storedElements = localStorage.getItem('webtoeic_canvas_elements');
    if (storedElements) {
      try {
        setElements(JSON.parse(storedElements));
      } catch (e) {
        // bỏ qua
      }
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

  // Lưu các phần tử vẽ vector và tự động vẽ lại
  useEffect(() => {
    localStorage.setItem('webtoeic_canvas_elements', JSON.stringify(elements));
    drawAllElements();
  }, [elements, selectedId, editingTextId]);

  useEffect(() => {
    localStorage.setItem('webtoeic_draw_color', color);
  }, [color]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = isLearnPage ? 'webtoeic_toolbar_pos_learn' : 'webtoeic_toolbar_pos_global';
      localStorage.setItem(storageKey, JSON.stringify(toolbarPos));
    }
  }, [toolbarPos, isLearnPage]);
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
            const { customHotkeys: dbHotkeys, clonedTools: dbCloned, eraserTargets: dbEraserTargets, eraserMode: dbEraserMode } = settings;
            if (dbHotkeys) {
              const merged = { ...DEFAULT_HOTKEYS, ...dbHotkeys };
              setCustomHotkeys(merged);
              localStorage.setItem('webtoeic_custom_hotkeys', JSON.stringify(merged));
            }
            if (dbCloned) {
              setClonedTools(dbCloned);
              localStorage.setItem('webtoeic_cloned_tools', JSON.stringify(dbCloned));
            }
            if (dbEraserTargets) {
              setEraserTargets(dbEraserTargets);
              localStorage.setItem('webtoeic_eraser_targets', JSON.stringify(dbEraserTargets));
            }
            if (dbEraserMode) {
              setEraserMode(dbEraserMode);
              localStorage.setItem('webtoeic_eraser_mode', dbEraserMode);
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
      if (localClones) setClonedTools(JSON.parse(localClones));
      if (localEraserTargets) {
        try {
          setEraserTargets(JSON.parse(localEraserTargets));
        } catch (e) {}
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
      
      const k = ev.key.toLowerCase();
      if (k !== 'control' && k !== 'meta' && k !== 'shift' && k !== 'alt') {
        if (ev.code === 'Space') parts.push('space');
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
    setIsSavingSettings(true);
    try {
      const payload = {
        customHotkeys: draftHotkeys,
        clonedTools: draftClonedTools,
        eraserTargets: draftEraserTargets,
        eraserMode: draftEraserMode
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
        localStorage.setItem('webtoeic_custom_hotkeys', JSON.stringify(draftHotkeys));
        localStorage.setItem('webtoeic_cloned_tools', JSON.stringify(draftClonedTools));
        localStorage.setItem('webtoeic_eraser_targets', JSON.stringify(draftEraserTargets));
        localStorage.setItem('webtoeic_eraser_mode', draftEraserMode);
        localStorage.setItem('webtoeic_font_size', draftFontSize.toString());
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
    if (!isActive) return;

    // Delay nhỏ để DOM render xong canvas
    const timer = setTimeout(() => {
      initCanvas();
      window.addEventListener("resize", initCanvas);
    }, 50);

    return () => {
      window.removeEventListener("resize", initCanvas);
      clearTimeout(timer);
    };
  }, [isActive]);

  // Vẽ lại canvas khi biến đèn chiếu thay đổi
  useEffect(() => {
    drawAllElements();
  }, [isFlashlightActive, flashlightSize, flashlightShape]);

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
    } = stateRef.current;

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
        ctx.roundRect(x - rx, y - ry, rx * 2, ry * 2, 8);
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
        ctx.textBaseline = 'top';

        if (el.x !== undefined && el.y !== undefined && el.text) {
          const lines = el.text.split('\n');
          let maxLineWidth = 0;
          ctx.save();
          lines.forEach(line => {
            const cleanLine = line.replace(/\*\*/g, "");
            ctx.font = getElementFont(el.size, el.textStyle);
            const w = ctx.measureText(cleanLine).width;
            if (w > maxLineWidth) maxLineWidth = w;
          });
          ctx.restore();
          
          const linesCount = lines.length;
          const paddingX = 8;
          const paddingY = 8;
          const rectX = el.x;
          const rectY = el.y;
          const rectW = maxLineWidth + paddingX * 2;
          const rectH = el.size * linesCount * 1.3 + paddingY * 2;

          // 1. Vẽ màu nền nếu có cấu hình
          if (el.textBgColor) {
            ctx.save();
            ctx.fillStyle = el.textBgColor;
            ctx.globalAlpha = el.textBgOpacity !== undefined ? el.textBgOpacity : 1.0;
            ctx.beginPath();
            ctx.roundRect(rectX, rectY, rectW, rectH, 6);
            ctx.fill();
            ctx.restore();
          }

          // 2. Vẽ viền nếu có cấu hình
          if (el.textHasBorder) {
            ctx.save();
            ctx.strokeStyle = el.color; // sử dụng màu chữ để vẽ viền hài hoà
            ctx.lineWidth = el.textBorderWidth || 1;
            ctx.beginPath();
            ctx.roundRect(rectX, rectY, rectW, rectH, 6);
            ctx.stroke();
            ctx.restore();
          }

          // 3. Vẽ chữ nháp
          lines.forEach((line, lineIndex) => {
            const startX = el.x! + paddingX;
            const startY = el.y! + paddingY + lineIndex * (el.size * 1.3);

            // Parse markdown in đậm **text**
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            let currentX = startX;

            parts.forEach((part) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                const cleanText = part.slice(2, -2);
                ctx.font = `bold ${el.size}px sans-serif`;
                ctx.fillText(cleanText, currentX, startY);
                currentX += ctx.measureText(cleanText).width;
              } else if (part) {
                ctx.font = getElementFont(el.size, el.textStyle);
                ctx.fillText(part, currentX, startY);
                currentX += ctx.measureText(part).width;
              }
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
        } else if (el.type === 'text' && el.x !== undefined && el.y !== undefined && el.text) {
          const lines = el.text.split('\n');
          let maxLineWidth = 0;
          ctx.save();
          lines.forEach(line => {
            // Loại bỏ dấu sao khi đo chiều rộng thực tế của chữ
            const cleanLine = line.replace(/\*\*/g, "");
            ctx.font = getElementFont(el.size, el.textStyle);
            const w = ctx.measureText(cleanLine).width;
            if (w > maxLineWidth) maxLineWidth = w;
          });
          ctx.restore();
          
          const linesCount = lines.length;
          bx1 = el.x - 2;
          by1 = el.y - 2;
          bx2 = el.x + maxLineWidth + 18;
          by2 = el.y + el.size * linesCount * 1.3 + 18;
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

        // Vẽ 4 nút kéo phóng to/thu nhỏ tại 4 góc bounding box (chỉ với hình học và text)
        const canResize = el.type === 'rectangle' || el.type === 'circle' || el.type === 'ellipse' || el.type === 'text';
        if (canResize && bx1 !== 0 || by1 !== 0 || bx2 !== 0 || by2 !== 0) {
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
            ctx.roundRect(h.x - 5, h.y - 5, 10, 10, 3);
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
      if (el.type === 'eraser') {
        eraserElements.push(el);
      } else {
        let isErasable = false;
        if (el.type === 'pencil') isErasable = pencilErasable;
        else if (el.type === 'highlight') isErasable = highlightErasable;
        else if (el.type === 'rectangle' || el.type === 'circle' || el.type === 'ellipse') isErasable = shapesErasable;
        else if (el.type === 'text') isErasable = textErasable;

        if (isErasable) {
          erasableElements.push(el);
        } else {
          nonErasableElements.push(el);
        }
      }
    });

    // 1. Vẽ toàn bộ đối tượng được phép tẩy trước
    erasableElements.forEach(drawElement);

    // 2. Vẽ đè các nét tẩy lên (sẽ tẩy sạch các phần tử ở bước 1)
    eraserElements.forEach(drawElement);

    // 3. Vẽ đè toàn bộ đối tượng KHÔNG được phép tẩy lên trên cùng (hoàn toàn nguyên vẹn)
    nonErasableElements.forEach(drawElement);

    // 4. Vẽ nét vẽ nháp đang di chuột (Active Stroke) nếu đang vẽ trong chế độ Đèn chiếu
    if (isFlashlightActive && isDrawingRef.current && activePointsRef.current.length > 0) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.globalCompositeOperation = 'source-over';

      if (hasSnappedRef.current && recognizedShapeRef.current) {
        // Nếu đã nhận dạng và snap hình học chuẩn đẹp thành công dưới đèn chiếu
        const shape = recognizedShapeRef.current;
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
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = pencilSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
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
        ctx.lineWidth = pencilSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const startPoint = activePointsRef.current[0];
        const lastPoint = activePointsRef.current[activePointsRef.current.length - 1];
        const w = lastPoint.x - startPoint.x;
        const h = lastPoint.y - startPoint.y;

        ctx.beginPath();
        if (tool === 'rectangle') {
          ctx.rect(startPoint.x, startPoint.y, w, h);
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = color;
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.globalAlpha = 1.0;
          const cx = startPoint.x + w / 2;
          const cy = startPoint.y + h / 2;
          const radius = Math.min(Math.abs(w), Math.abs(h)) / 2;
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  };



  // Thuật toán Hit Testing tìm đối tượng gần click chuột nhất
  const findElementAtPosition = (x: number, y: number): DrawElement | null => {
    // Duyệt ngược từ phần tử vẽ sau cùng lên đầu để ưu tiên chọn phần tử trên cùng
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];

      if (el.type === 'pencil' || el.type === 'highlight' || el.type === 'eraser') {
        for (let j = 0; j < el.points.length; j++) {
          const pt = el.points[j];
          const distance = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
          if (distance < el.size + 8) {
            return el;
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
            return el;
          }
        }
      }
      else if (el.type === 'circle') {
        if (el.x !== undefined && el.y !== undefined && el.radius !== undefined) {
          const distance = Math.sqrt((el.x - x) ** 2 + (el.y - y) ** 2);
          if (distance <= el.radius + 8) {
            return el;
          }
        }
      }
      else if (el.type === 'ellipse') {
        if (el.x !== undefined && el.y !== undefined && el.rx !== undefined && el.ry !== undefined) {
          const normX = (x - el.x) / (el.rx + 8);
          const normY = (y - el.y) / (el.ry + 8);
          if (normX * normX + normY * normY <= 1) {
            return el;
          }
        }
      }
      else if (el.type === 'text') {
        if (el.x !== undefined && el.y !== undefined && el.text) {
          const lines = el.text.split('\n');
          let maxLineWidth = 0;
          const canvas = canvasRef.current;
          const tempCtx = canvas?.getContext('2d');
          if (tempCtx) {
            tempCtx.save();
            lines.forEach(line => {
              const cleanLine = line.replace(/\*\//g, "");
              tempCtx.font = getElementFont(el.size, el.textStyle);
              const w = tempCtx.measureText(cleanLine).width;
              if (w > maxLineWidth) maxLineWidth = w;
            });
            tempCtx.restore();
          } else {
            maxLineWidth = el.size * 0.6 * el.text.length; // Fallback
          }
          
          const width = maxLineWidth + 12;
          const height = el.size * lines.length * 1.3 + 8;
          if (x >= el.x && x <= el.x + width && y >= el.y && y <= el.y + height) {
            return el;
          }
        }
      }
    }
    return null;
  };

  // Thuật toán kiểm tra chuột có nằm trên 4 góc kéo dãn (Resize Handle) của phần tử đang chọn hay không
  const getResizeHandleAtPosition = (x: number, y: number, el: DrawElement): 'nw' | 'ne' | 'se' | 'sw' | null => {
    if (!el) return null;
    
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    if (el.type === 'rectangle') {
      x1 = Math.min(el.x!, el.x! + el.width!);
      y1 = Math.min(el.y!, el.y! + el.height!);
      x2 = Math.max(el.x!, el.x! + el.width!);
      y2 = Math.max(el.y!, el.y! + el.height!);
    } else if (el.type === 'circle') {
      x1 = el.x! - el.radius!;
      y1 = el.y! - el.radius!;
      x2 = el.x! + el.radius!;
      y2 = el.y! + el.radius!;
    } else if (el.type === 'ellipse') {
      x1 = el.x! - el.rx!;
      y1 = el.y! - el.ry!;
      x2 = el.x! + el.rx!;
      y2 = el.y! + el.ry!;
    } else if (el.type === 'text') {
      x1 = el.x!;
      y1 = el.y!;
      
      const lines = el.text!.split('\n');
      let maxLineWidth = 0;
      const canvas = canvasRef.current;
      const tempCtx = canvas?.getContext('2d');
      if (tempCtx) {
        tempCtx.save();
        lines.forEach(line => {
          const cleanLine = line.replace(/\*\*/g, "");
          tempCtx.font = getElementFont(el.size, el.textStyle);
          const w = tempCtx.measureText(cleanLine).width;
          if (w > maxLineWidth) maxLineWidth = w;
        });
        tempCtx.restore();
      } else {
        maxLineWidth = el.size * 0.6 * el.text!.length;
      }
      const width = maxLineWidth + 12;
      const height = el.size * lines.length * 1.3 + 8;
      
      x2 = el.x! + width;
      y2 = el.y! + height;
    } else {
      return null;
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
    eraserSize: number;
    penStyle: 'ballpoint' | 'fountain' | 'brush';
    customHotkeys: Record<string, string>;
    clonedTools: ClonedTool[];
    activeCloneId: string | null;
    showSettings: boolean;
    lastActiveTool: DrawTool;
    eraserTargets: { pencil: boolean; highlight: boolean; shapes: boolean; text: boolean };
    eraserMode: 'stroke' | 'pixel';
  }>({
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
    eraserSize,
    penStyle,
    customHotkeys,
    clonedTools,
    activeCloneId,
    showSettings,
    lastActiveTool,
    eraserTargets: { pencil: true, highlight: true, shapes: true, text: true },
    eraserMode: 'pixel'
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
    eraserSize,
    penStyle,
    customHotkeys,
    clonedTools,
    activeCloneId,
    showSettings,
    lastActiveTool,
    eraserTargets,
    eraserMode,
  };


  // Đồng bộ màu sắc nhanh khi chọn phần tử bằng Bàn tay
  const updateColor = (newColor: DrawColor) => {
    setColor(newColor);
    setActiveCloneId(null); // Hủy kích hoạt bút clone nếu chọn màu thủ công để quay về trạng thái cọ mặc định
    const { selectedId: currentSelectedId } = stateRef.current;
    if (currentSelectedId) {
      setElements(prev => prev.map(el => el.id === currentSelectedId ? { ...el, color: newColor } : el));
    }
  };

  // Đồng bộ tăng/giảm size nhanh cho phần tử đang được chọn
  const updateSize = (type: 'pencil' | 'highlight' | 'eraser' | 'text', action: 'increase' | 'decrease') => {
    const isInc = action === 'increase';
    const { selectedId: currentSelectedId } = stateRef.current;
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
      const parts: string[] = [];
      if (ev.ctrlKey || ev.metaKey) parts.push('ctrl');
      if (ev.shiftKey && ev.key !== 'Shift') parts.push('shift');
      if (ev.altKey) parts.push('alt');
      
      const k = ev.key.toLowerCase();
      if (k !== 'control' && k !== 'meta' && k !== 'shift' && k !== 'alt') {
        if (ev.code === 'Space') parts.push('space');
        else parts.push(k);
      }
      return parts.join('+');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Nếu đang mở Modal cài đặt phím tắt, chặn hoàn toàn phím tắt toàn cục để tránh ghi đè/gõ chữ
      if (stateRef.current.showSettings) {
        return;
      }

      // 0. CHỨC NĂNG GHOST MODE: Tạm thời tắt vẽ để tương tác click/hover web bên dưới (như Figma/Photoshop)
      const pressedHotkeyCheck = getEventHotkeyString(e);
      const ghostmodeKey = stateRef.current.customHotkeys.ghostmode || 'space';
      if (pressedHotkeyCheck === ghostmodeKey.toLowerCase()) {
        const target = e.target as HTMLElement;
        const isInput = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable ||
          stateRef.current.textInput !== null;
        if (!isInput) {
          e.preventDefault(); // Ngăn trình duyệt cuộn trang/thao tác mặc định
          setIsShiftPressed(true); // Vẫn dùng biến isShiftPressed làm cờ Ghost Mode
        }
      }

      const { isActive: currentIsActive, tool: currentTool, selectedId: currentSelectedId, textInput: currentTextInput } = stateRef.current;
      const target = e.target as HTMLElement;

      // 1. KIỂM TRA INPUT SOẠN THẢO NHÁP ĐANG ACTIVE:
      const isInput = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable ||
        currentTextInput !== null; // Bảo vệ an toàn tuyệt đối khi đang mở ô gõ chữ nháp

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
      const matchedClone = stateRef.current.clonedTools.find(
        clone => pressedHotkey === clone.hotkey.toLowerCase()
      );
      if (matchedClone) {
        e.preventDefault();
        setTool(matchedClone.baseType);
        setColor(matchedClone.color);
        setActiveCloneId(matchedClone.id);
        setSelectedId(null);
        if (matchedClone.baseType === 'text' && matchedClone.textSize) {
          setFontSize(matchedClone.textSize);
        }
        return;
      }

      // B. DÒ TÌM PHÍM TẮT TÙY CHỈNH (Custom Hotkeys)
      const hotkeys = stateRef.current.customHotkeys;

      if (pressedHotkey === hotkeys.cursor) {
        e.preventDefault();
        setTool('cursor');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey === hotkeys.hand) {
        e.preventDefault();
        if (stateRef.current.tool === 'hand') {
          // Nếu đang ở hình bàn tay mà bấm ESC (hoặc phím hotkey của hand) lần nữa,
          // thì tự động quay về công cụ trước đó (lastActiveTool)
          setTool(stateRef.current.lastActiveTool);
        } else {
          setTool('hand');
        }
        setActiveCloneId(null);
      } else if (pressedHotkey === hotkeys.pencil) {
        e.preventDefault();
        setTool('pencil');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey === hotkeys.highlight) {
        e.preventDefault();
        setTool('highlight');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey === hotkeys.flashlight) {
        e.preventDefault();
        setIsFlashlightActive(prev => !prev);
      } else if (pressedHotkey === hotkeys.eraser) {
        e.preventDefault();
        setTool('eraser');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey === hotkeys.rectangle) {
        e.preventDefault();
        setTool('rectangle');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey === hotkeys.circle) {
        e.preventDefault();
        setTool('circle');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey === hotkeys.text) {
        e.preventDefault();
        setTool('text');
        setSelectedId(null);
        setActiveCloneId(null);
      } else if (pressedHotkey === hotkeys.color1) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[0]);
      } else if (pressedHotkey === hotkeys.color2) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[1]);
      } else if (pressedHotkey === hotkeys.color3) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[2]);
      } else if (pressedHotkey === hotkeys.color4) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[3]);
      } else if (pressedHotkey === hotkeys.color5) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[4]);
      } else if (pressedHotkey === hotkeys.color6) {
        e.preventDefault();
        updateColor(stateRef.current.colorSlots[5]);
      } else if (pressedHotkey === hotkeys.clear) {
        e.preventDefault();
        clearCanvas();
      }
      
      // Xử lý tăng giảm kích thước qua các phím chuẩn [ và ]
      else if (pressedHotkey === '[') {
        e.preventDefault();
        if (stateRef.current.isFlashlightActive) {
          setFlashlightSize(prev => Math.max(30, prev - 10));
        } else {
          const activeType = currentTool === 'eraser' ? 'eraser' : currentTool === 'text' ? 'text' : currentTool === 'highlight' ? 'highlight' : 'pencil';
          updateSize(activeType, 'decrease');
        }
      } else if (pressedHotkey === ']') {
        e.preventDefault();
        if (stateRef.current.isFlashlightActive) {
          setFlashlightSize(prev => Math.min(300, prev + 10));
        } else {
          const activeType = currentTool === 'eraser' ? 'eraser' : currentTool === 'text' ? 'text' : currentTool === 'highlight' ? 'highlight' : 'pencil';
          updateSize(activeType, 'increase');
        }
      }

      // Nhấn Backspace / Delete đơn lẻ để xoá duy nhất phần tử đang chọn hoặc tất cả nét vẽ của công cụ đang kích hoạt
      const isBackspaceOrDelete = e.key === 'Backspace' || e.key === 'Delete' || e.code === 'Backspace' || e.code === 'Delete';
      if (isBackspaceOrDelete) {
        if (!(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)) {
          if (currentSelectedId) {
            e.preventDefault();
            setElements(prev => prev.filter(el => el.id !== currentSelectedId));
            setSelectedId(null);
          } else if (currentTool && currentTool !== 'cursor' && currentTool !== 'hand' && currentTool !== 'eraser') {
            e.preventDefault();
            // Xóa toàn bộ phần tử thuộc loại công cụ đang kích hoạt trên toolbar
            setElements(prev => prev.filter(el => el.type !== currentTool));
          }
        }
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

  // Vẽ mượt mà & Hit testing kéo thả di chuyển phần tử
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'cursor') return;

    if (e.pointerType === 'touch' && e.pressure === 0) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    // Bắt đầu đếm ngược nhận diện ngay từ khi nhấn bút
    if (tool === 'pencil' || tool === 'highlight') {
      holdTimerRef.current = setTimeout(triggerHoldRecognition, 1000);
      pendingTimerRef.current = setTimeout(() => {
        setShapePending(true);
      }, 200);
    }

    if (tool === 'hand') {
      if (selectedId) {
        const selectedEl = elements.find(el => el.id === selectedId);
        if (selectedEl) {
          const handle = getResizeHandleAtPosition(x, y, selectedEl);
          if (handle) {
            canvas.setPointerCapture(e.pointerId);
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
              startSize: selectedEl.size || 14
            });
            return;
          }
        }
      }

      // 1. Chế độ Bàn tay: Tìm đối tượng được chọn dưới ngòi chuột
      const clickedElement = findElementAtPosition(x, y);
      if (clickedElement) {
        setSelectedId(clickedElement.id);
        isGrabbingPageRef.current = false;
        setIsGrabbingPage(false);
        scrollTargetRef.current = null;
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
            const isScrollable = overflowY.includes('auto') || 
                                 overflowY.includes('scroll') || 
                                 overflowY.includes('overlay') || 
                                 element.className.includes('overflow-y-') ||
                                 element.className.includes('overflow-auto');
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
    } 
    else {
      // 2. Chế độ vẽ vẽ: Chụp snapshot canvas và khởi tạo toạ độ kèm lực nhấn ban đầu
      setSelectedId(null);

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
            else if (el.type === 'text') isTarget = textErasable;

            if (isTarget && checkIntersection(x, y, el, eraserRadius)) {
              toDeleteIds.add(el.id);
            }
          });

          if (toDeleteIds.size > 0) {
            setElements(prev => prev.filter(el => !toDeleteIds.has(el.id)));
          }
        } else {
          // Pixel Eraser - thực hiện chia nét / xóa vật thể thật luôn
          setElements(prev => erasePixelFromElements(x, y, eraserRadius, prev, eraserTargets));
        }
      }

      canvasSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const startPressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;
      lastWidthFactorRef.current = startPressure;
      activePointsRef.current = [{ x, y, pressure: startPressure }];

      if (tool === 'pencil' || tool === 'highlight') {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();

    const nativeEvent = e.nativeEvent as unknown as any;
    const events = nativeEvent.getCoalescedEvents ? nativeEvent.getCoalescedEvents() : [e];

    // Lấy toạ độ chuột hiện tại
    const lastEvent = events[events.length - 1];
    const x = lastEvent.clientX - rect.left;
    const y = lastEvent.clientY - rect.top;

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
      const { elementId, handle, startX, startY, startElX, startElY, startWidth, startHeight, startRadius, startSize } = resizingInfo;
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
          const newRadius = Math.max(5, Math.sqrt((el.x! - x) ** 2 + (el.y! - y) ** 2));
          return {
            ...el,
            radius: newRadius
          };
        }
        else if (el.type === 'ellipse') {
          const newRx = Math.max(5, Math.abs(x - el.x!));
          const newRy = Math.max(5, Math.abs(y - el.y!));
          return {
            ...el,
            rx: newRx,
            ry: newRy
          };
        }
        else if (el.type === 'text') {
          const origDiagonal = Math.sqrt((startX - el.x!) ** 2 + (startY - el.y!) ** 2);
          const currDiagonal = Math.sqrt((x - el.x!) ** 2 + (y - el.y!) ** 2);
          if (origDiagonal > 0) {
            const scale = currDiagonal / origDiagonal;
            const newSize = Math.min(120, Math.max(8, Math.round(startSize * scale)));
            return {
              ...el,
              size: newSize
            };
          }
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
          const ex = evt.clientX - rect.left;
          const ey = evt.clientY - rect.top;
          
          // Lọc khoảng cách tối thiểu giữa các điểm để tránh răng cưa góc cạnh và tích tụ độ mờ (opacity accumulation)
          const lastPt = activePointsRef.current[activePointsRef.current.length - 1];
          if (lastPt) {
            const d = Math.sqrt((ex - lastPt.x) ** 2 + (ey - lastPt.y) ** 2);
            if (d < 2) return; // Bỏ qua điểm nếu di chuyển quá ngắn (< 2px)
          }

          const startPressure = evt.pressure !== undefined && evt.pressure > 0 ? evt.pressure : 0.5;
          activePointsRef.current.push({ x: ex, y: ey, pressure: startPressure });
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

    const dist = ptDist({ x, y }, lastMovePosRef.current);

    if (dist > 2) {
      lastMovePosRef.current = { x, y };
      lastMoveTimeRef.current = Date.now();

      // Reset các timer đếm ngược nhận diện hình
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      // Chỉ set React state khi thực sự thay đổi để tránh kích hoạt re-render vô ích gây lag nét vẽ tự do
      setShapePending(prev => prev ? false : prev);

      if (tool === 'pencil' || tool === 'highlight') {
        holdTimerRef.current = setTimeout(triggerHoldRecognition, 1000);
        pendingTimerRef.current = setTimeout(() => {
          setShapePending(true);
        }, 200);
      }
    }

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
            y: el.y! + dy
          };
        }
      }));

      lastPointRef.current = { x, y };
    } 
    else {
      // Logic vẽ vẽ trực tiếp mượt mà để đạt hiệu năng tối đa khi đang rê chuột
      events.forEach((evt: any) => {
        const ex = evt.clientX - rect.left;
        const ey = evt.clientY - rect.top;
        const pt = lastPointRef.current;

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
            const curr  = pts[pts.length - 1];
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
              else if (el.type === 'text') isTarget = textErasable;

              if (isTarget && checkIntersection(ex, ey, el, eraserRadius)) {
                toDeleteIds.add(el.id);
              }
            });

            if (toDeleteIds.size > 0) {
              setElements(prev => prev.filter(el => !toDeleteIds.has(el.id)));
            }
          } else {
            const eraserRadius = eraserSize / 2;
            setElements(prev => erasePixelFromElements(ex, ey, eraserRadius, prev, eraserTargets));
          }

          lastPointRef.current = { x: ex, y: ey };
        }
      });

      const points = activePointsRef.current;
      if (points.length < 2) return;

      if (tool === 'highlight') {
        if (canvasSnapshotRef.current) {
          ctx.putImageData(canvasSnapshotRef.current, 0, 0);
        }
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
        if (canvasSnapshotRef.current) {
          ctx.putImageData(canvasSnapshotRef.current, 0, 0);
        }
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
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (resizingInfo) {
      setResizingInfo(null);
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
      if (points.length === 0) return;

      const rect = canvas?.getBoundingClientRect();
      const ex = e.clientX - (rect?.left || 0);
      const ey = e.clientY - (rect?.top || 0);

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
        // Lưu điểm dot vào Vector state để có thể undo/redraw
        const dotElement: DrawElement = {
          id: Date.now().toString(),
          type: tool,
          points: [{ x: dotX, y: dotY, pressure }],
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
            points: [],
            color: color,
            size: tool === 'highlight' ? highlightSize : pencilSize,
            x: shape.rect.x,
            y: shape.rect.y,
            width: shape.rect.w,
            height: shape.rect.h,
          };
        } else if (shape.type === 'circle' && shape.circle) {
          newElement = {
            id: elementId,
            type: 'circle',
            points: [],
            color: color,
            size: tool === 'highlight' ? highlightSize : pencilSize,
            x: shape.circle.cx,
            y: shape.circle.cy,
            radius: shape.circle.radius,
          };
        } else if (shape.type === 'ellipse' && shape.ellipse) {
          newElement = {
            id: elementId,
            type: 'ellipse',
            points: [],
            color: color,
            size: tool === 'highlight' ? highlightSize : pencilSize,
            x: shape.ellipse.cx,
            y: shape.ellipse.cy,
            rx: shape.ellipse.rx,
            ry: shape.ellipse.ry,
          };
        } else if (shape.type === 'line' && shape.line) {
          newElement = {
            id: elementId,
            type: 'pencil',
            points: [shape.line.start, shape.line.end],
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
              points: [...points],
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
            newElement = {
              id: elementId,
              type: 'rectangle',
              points: [],
              color: color,
              size: pencilSize,
              x: startPoint.x,
              y: startPoint.y,
              width: w,
              height: h
            };
          } else {
            const cx = startPoint.x + w / 2;
            const cy = startPoint.y + h / 2;
            const radius = Math.min(Math.abs(w), Math.abs(h)) / 2;
            newElement = {
              id: elementId,
              type: 'circle',
              points: [],
              color: color,
              size: pencilSize,
              x: cx,
              y: cy,
              radius: radius
            };
          }
        }
      }

      if (newElement) {
        setElements(prev => [...prev, newElement!]);
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



  // Hoàn thành nhập text và vẽ lưu vào Vector state
  const handleTextSubmit = (shouldSwitchToHand = false) => {
    if (!textInput) {
      setEditingTextId(null);
      return;
    }

    const value = textInputValRef.current.trim();
    if (!value) {
      if (editingTextId) {
        // Nếu đang sửa và xoá sạch chữ, tiến hành xoá phần tử khỏi danh sách
        setElements(prev => prev.filter(el => el.id !== editingTextId));
      }
      setTextInput(null);
      setEditingTextId(null);
      return;
    }

    let targetId = editingTextId;

    if (editingTextId) {
      setElements(prev => prev.map(el => {
        if (el.id === editingTextId) {
          return {
            ...el,
            text: textInputValRef.current,
          };
        }
        return el;
      }));
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = textInput.x - rect.left;
      const y = textInput.y - rect.top;

      const newId = Date.now().toString();
      targetId = newId;

      const activeClone = stateRef.current.clonedTools.find(c => c.id === stateRef.current.activeCloneId);
      const isTextClone = activeClone && activeClone.baseType === 'text';

      const newElement: DrawElement = {
        id: newId,
        type: 'text',
        points: [],
        color: isTextClone ? activeClone.color : color,
        size: (isTextClone && activeClone.textSize) ? activeClone.textSize : fontSize,
        textStyle: isTextClone ? activeClone.textStyle : undefined,
        textHasBorder: isTextClone ? activeClone.textHasBorder : undefined,
        textBorderWidth: isTextClone ? activeClone.textBorderWidth : undefined,
        textBgColor: isTextClone ? activeClone.textBgColor : undefined,
        textBgOpacity: isTextClone ? activeClone.textBgOpacity : undefined,
        x: x,
        y: y,
        text: textInputValRef.current
      };
      setElements(prev => [...prev, newElement]);
    }

    setTextInput(null);
    setEditingTextId(null);

    if (shouldSwitchToHand && targetId) {
      setTool('hand');
      setSelectedId(targetId);
    }
  };

  // Xoá sạch canvas và state
  const clearCanvas = () => {
    setElements([]);
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
  const ptDist = (a: {x:number,y:number}, b: {x:number,y:number}) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  /** Tổng chiều dài đường đi qua mảng điểm */
  const pathLength = (pts: {x:number,y:number}[]) => {
    let l = 0;
    for (let i = 1; i < pts.length; i++) l += ptDist(pts[i - 1], pts[i]);
    return l;
  };

  /** Ramer-Douglas-Peucker đơn giản hoá mảng điểm */
  const rdpSimplify = (p: {x:number,y:number}[], eps: number): {x:number,y:number}[] => {
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
      const left  = rdpSimplify(p.slice(0, idx + 1), eps);
      const right = rdpSimplify(p.slice(idx), eps);
      return [...left.slice(0, -1), ...right];
    }
    return [s, e];
  };

  /** Phát hiện Đường thẳng */
  const shapeDetectLine = (pts: {x:number, y:number}[]) => {
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

  /** Trigger nhận dạng khi giữ nguyên bút 1s */
  const triggerHoldRecognition = () => {
    if (!isDrawingRef.current) return;
    const points = activePointsRef.current;
    if (points.length < 5) return;

    const shape = detectShape(points);
    if (shape) {
      recognizedShapeRef.current = shape;
      hasSnappedRef.current = true;
      setShapePending(false);

      // Restore snapshot & vẽ đè hình đã nhận dạng lên canvas để người dùng nhìn thấy ngay lập tức
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        if (stateRef.current.isFlashlightActive) {
          drawAllElements();
        } else if (canvasSnapshotRef.current) {
          ctx.putImageData(canvasSnapshotRef.current, 0, 0);
        }
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

  if (!isActive) return null;

  return (
    <>
      {/* Shape Recognition: Dot nhấp nháy khi đang đếm ngược 1 giây */}
      {shapePending && <div className={styles.shapePendingDot} title="Giữ nguyên để nhận dạng hình..." />}

      {/* 1. Lớp phủ Canvas */}
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => {
          if (tool === 'text' || tool === 'hand') {
            const canvas = canvasRef.current;
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              const clickedElement = findElementAtPosition(clickX, clickY);
              
              if (clickedElement && clickedElement.type === 'text') {
                // Nhấp vào chữ ở chế độ Bàn tay: chỉ cho phép sửa nếu không kéo thả di chuyển vị trí.
                // Chúng ta so khớp toạ độ click hiện tại với toạ độ ban đầu của phần tử. 
                // Nếu khoảng cách lệch rất nhỏ (người dùng chỉ nhấp chuột tĩnh để sửa chứ không rê kéo đi chỗ khác) thì mới kích hoạt.
                const startX = clickedElement.x ?? 0;
                const startY = clickedElement.y ?? 0;
                const dist = Math.sqrt((clickX - startX) ** 2 + (clickY - startY) ** 2);
                
                // Cho phép sai số nhỏ (dưới 8px) đề phòng rung tay khi click/tap
                if (tool === 'text' || dist < 8) {
                  setSelectedId(null);
                  setEditingTextId(clickedElement.id);
                  // Đổi toạ độ từ canvas sang client coordinate để hiển thị textarea đúng vị trí
                  // Trừ đi 4px cho cả x và y để bù trừ (offset) phần padding: 4px của textarea, 
                  // giúp chữ trong ô gõ đè khít 100% lên chữ vẽ cũ trên canvas mà không bị lệch hay rung giật.
                  setTextInput({ 
                    x: clickedElement.x! + rect.left - 4, 
                    y: clickedElement.y! + rect.top - 4 
                  });
                  const loadedVal = clickedElement.text || "";
                  textInputValRef.current = loadedVal;
                  setActiveTextVal(loadedVal);
                  return;
                }
              }
            }

            if (tool === 'text') {
              setSelectedId(null);
              setEditingTextId(null);
              // Căn chỉnh chính xác vị trí gõ chữ vào đúng điểm click chuột
              const offsetX = 7; // padding-left + border-left
              const offsetY = 5 + (fontSize / 2); // padding-top + border-top + 1/2 cỡ chữ
              setTextInput({ x: e.clientX - offsetX, y: e.clientY - offsetY });
              textInputValRef.current = "";
              setActiveTextVal("");
            }
          }
        }}
        style={{ 
          cursor: cursorStyle,
          pointerEvents: (tool === 'cursor' || textInput || isShiftPressed) ? 'none' : 'auto'
        }}
      />

      {textInput && (
        <MarkdownTextarea
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
          textHasBorder={
            editingTextId
              ? elements.find(el => el.id === editingTextId)?.textHasBorder
              : clonedTools.find(c => c.id === activeCloneId)?.textHasBorder
          }
          textBorderWidth={
            editingTextId
              ? elements.find(el => el.id === editingTextId)?.textBorderWidth
              : clonedTools.find(c => c.id === activeCloneId)?.textBorderWidth
          }
          textBgColor={
            editingTextId
              ? elements.find(el => el.id === editingTextId)?.textBgColor
              : clonedTools.find(c => c.id === activeCloneId)?.textBgColor
          }
          textBgOpacity={
            editingTextId
              ? elements.find(el => el.id === editingTextId)?.textBgOpacity
              : clonedTools.find(c => c.id === activeCloneId)?.textBgOpacity
          }
          style={{
            left: textInput.x,
            top: textInput.y,
          }}
          onChange={(newVal) => {
            textInputValRef.current = newVal;
            setActiveTextVal(newVal);
          }}
          onBlur={() => handleTextSubmit(false)}
          onKeyDown={(e) => {
            // Nhấn phím Enter (không kèm Shift): Lưu và kết thúc nhập
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleTextSubmit(false);
            }
            // Nhấn Shift+Enter: Cho phép xuống dòng bên trong textarea
            else if (e.key === 'Enter' && e.shiftKey) {
              // Cho phép chèn ký tự \n bình thường
            }
            else if (e.key === 'Escape') {
              e.preventDefault();
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
            data-tooltip="Chuột làm bài — phím tắt: Ctrl+M"
          >
            <MousePointer size={12} />
          </button>

          {/* Nút Bàn tay chọn & di chuyển đối tượng */}
          <button
            className={`${styles.btn} ${tool === 'hand' ? styles.btnActive : ''}`}
            onClick={() => setTool('hand')}
            data-tooltip="Bàn tay: chọn & di chuyển nét vẽ — phím tắt: Esc"
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
              data-tooltip={`Cọ vẽ: ${penStyle === 'ballpoint' ? 'Bút bi' : penStyle === 'fountain' ? 'Bút máy' : 'Bút lông'} — phím tắt: B · Ctrl+Shift+B`}
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
            data-tooltip="Bút highlight — phím tắt: H · Ctrl+Shift+H"
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
              data-tooltip="Tiêu điểm đèn chiếu — phím tắt: F"
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
            data-tooltip="Cục tẩy — phím tắt: E"
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
            data-tooltip="Hình chữ nhật — phím tắt: R"
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
            data-tooltip="Hình tròn — phím tắt: C"
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
            data-tooltip="Viết chữ nháp — phím tắt: T"
          >
            <Type size={12} />
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

          {/* Nút Cài đặt Gear */}
          <button
            className={`${styles.btn} ${styles.btnGear}`}
            onClick={() => {
              setDraftHotkeys({ ...customHotkeys });
              setDraftClonedTools([...clonedTools]);
              setDraftFontSize(fontSize);
              setDraftEraserTargets({ ...eraserTargets });
              setDraftEraserMode(eraserMode);
              setShowSettings(true);
              setActiveTab('shortcuts');
              setListeningKeyFor(null);
              setNewCloneName('');
              setNewCloneBaseType('pencil');
              setNewCloneColor('#EF4444');
              setNewCloneHotkey('');
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
                        onChange={(e) => setNewCloneBaseType(e.target.value as any)}
                        className={styles.cloneSelect}
                      >
                        <option value="pencil">Bút chì gốc</option>
                        <option value="highlight">Highlight gốc</option>
                        <option value="rectangle">Hình chữ nhật</option>
                        <option value="text">Chữ viết</option>
                      </select>
                    </div>

                    {newCloneBaseType === 'text' && (
                      <>
                        <div className={styles.cloneFormRow} style={{ marginTop: '0px', gap: '10px', marginBottom: '12px' }}>
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
                              <option value="normal">Thường (500)</option>
                              <option value="bold">In đậm (Bold)</option>
                              <option value="italic">Nghiêng (Italic)</option>
                              <option value="bold-italic">Đậm & Nghiêng</option>
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
                          if (!newCloneHotkey) {
                            alert("Vui lòng gán phím tắt cho bút clone");
                            return;
                          }
                          // Tránh trùng phím tắt với phím tắt gốc
                          const duplicateOriginal = Object.values(draftHotkeys).includes(newCloneHotkey);
                          const duplicateClone = draftClonedTools.some(c => c.hotkey === newCloneHotkey && c.id !== editingCloneId);
                          if (duplicateOriginal || duplicateClone) {
                            alert("Phím tắt này đã được sử dụng! Vui lòng chọn phím khác.");
                            return;
                          }

                          if (editingCloneId) {
                            // Cập nhật bút clone đã chọn
                            setDraftClonedTools(prev => prev.map(c => {
                              if (c.id === editingCloneId) {
                                return {
                                  ...c,
                                  baseType: newCloneBaseType,
                                  name: newCloneName,
                                  color: newCloneColor,
                                  hotkey: newCloneHotkey,
                                  textSize: newCloneBaseType === 'text' ? newCloneTextSize : undefined,
                                  textStyle: newCloneBaseType === 'text' ? newCloneTextStyle : undefined,
                                  textHasBorder: newCloneBaseType === 'text' ? newCloneTextHasBorder : undefined,
                                  textBorderWidth: newCloneBaseType === 'text' ? newCloneTextBorderWidth : undefined,
                                  textBgColor: newCloneBaseType === 'text' ? newCloneTextBgColor : undefined,
                                  textBgOpacity: newCloneBaseType === 'text' ? (newCloneTextBgOpacity / 100) : undefined
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
                              name: newCloneName,
                              color: newCloneColor,
                              hotkey: newCloneHotkey,
                              textSize: newCloneBaseType === 'text' ? newCloneTextSize : undefined,
                              textStyle: newCloneBaseType === 'text' ? newCloneTextStyle : undefined,
                              textHasBorder: newCloneBaseType === 'text' ? newCloneTextHasBorder : undefined,
                              textBorderWidth: newCloneBaseType === 'text' ? newCloneTextBorderWidth : undefined,
                              textBgColor: newCloneBaseType === 'text' ? newCloneTextBgColor : undefined,
                              textBgOpacity: newCloneBaseType === 'text' ? (newCloneTextBgOpacity / 100) : undefined
                            };
                            setDraftClonedTools(prev => [...prev, newClone]);
                          }
                          
                          setNewCloneName('');
                          setNewCloneHotkey('');
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
                            if (clone.baseType === 'text') {
                              setNewCloneTextSize(clone.textSize || 20);
                              setNewCloneTextStyle(clone.textStyle || 'normal');
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
                                      : `Chữ viết (${clone.textSize}px, ${
                                          clone.textStyle === 'bold' ? 'Đậm' : clone.textStyle === 'italic' ? 'Nghiêng' : clone.textStyle === 'bold-italic' ? 'Đậm & Nghiêng' : 'Thường'
                                        })`}
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
    </>
  );
};
