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

const FlashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
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
  baseType: 'pencil' | 'highlight' | 'rectangle';
  name: string;
  color: string;
  hotkey: string;
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
}

interface ScreenDrawOverlayProps {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

export const ScreenDrawOverlay: React.FC<ScreenDrawOverlayProps> = ({ 
  isActive, 
  setIsActive 
}) => {
  const [tool, setTool] = useState<DrawTool>('pencil');
  const [color, setColor] = useState<DrawColor>('#EF4444');

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
  const textInputValRef = useRef("");
  const textInputRef = useRef<HTMLTextAreaElement>(null);

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

  // Draft states for settings modal
  const [draftHotkeys, setDraftHotkeys] = useState<Record<string, string>>(DEFAULT_HOTKEYS);
  const [draftClonedTools, setDraftClonedTools] = useState<ClonedTool[]>([]);
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'clones'>('shortcuts');
  const [listeningKeyFor, setListeningKeyFor] = useState<string | null>(null);

  // Form states for creating a new clone
  const [newCloneName, setNewCloneName] = useState('');
  const [newCloneBaseType, setNewCloneBaseType] = useState<'pencil' | 'highlight' | 'rectangle'>('pencil');
  const [newCloneColor, setNewCloneColor] = useState('#EF4444');
  const [newCloneHotkey, setNewCloneHotkey] = useState('');


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
  }, [elements, selectedId]);

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
            const { customHotkeys: dbHotkeys, clonedTools: dbCloned } = settings;
            if (dbHotkeys) {
              setCustomHotkeys(dbHotkeys);
              localStorage.setItem('webtoeic_custom_hotkeys', JSON.stringify(dbHotkeys));
            }
            if (dbCloned) {
              setClonedTools(dbCloned);
              localStorage.setItem('webtoeic_cloned_tools', JSON.stringify(dbCloned));
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
      if (localHotkeys) setCustomHotkeys(JSON.parse(localHotkeys));
      if (localClones) setClonedTools(JSON.parse(localClones));
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
        clonedTools: draftClonedTools
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
        localStorage.setItem('webtoeic_custom_hotkeys', JSON.stringify(draftHotkeys));
        localStorage.setItem('webtoeic_cloned_tools', JSON.stringify(draftClonedTools));
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

    // 3. Vẽ tuần tự từng đối tượng nét vẽ cũ TRÊN NỀN ĐÈN CHIẾU
    elements.forEach((el) => {
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
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.font = `bold ${el.size}px sans-serif`;
        ctx.textBaseline = 'top';

        if (el.x !== undefined && el.y !== undefined && el.text) {
          const lines = el.text.split('\n');
          lines.forEach((line, index) => {
            ctx.fillText(line, el.x! + 4, el.y! + 4 + index * (el.size * 1.2));
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
        
        ctx.beginPath();
        if (el.type === 'rectangle' && el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
          ctx.rect(el.x - 4, el.y - 4, el.width + 8, el.height + 8);
        } else if (el.type === 'circle' && el.x !== undefined && el.y !== undefined && el.radius !== undefined) {
          ctx.arc(el.x, el.y, el.radius + 4, 0, 2 * Math.PI);
        } else if (el.type === 'ellipse' && el.x !== undefined && el.y !== undefined && el.rx !== undefined && el.ry !== undefined) {
          ctx.ellipse(el.x, el.y, el.rx + 4, el.ry + 4, 0, 0, 2 * Math.PI);
        } else if (el.type === 'text' && el.x !== undefined && el.y !== undefined && el.text) {
          const linesCount = el.text.split('\n').length;
          ctx.rect(el.x - 2, el.y - 2, 164, el.size * linesCount * 1.2 + 8);
        } else if (el.points.length > 0) {
          // Bounding box giả lập cho nét vẽ tự do khi được chọn
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          el.points.forEach(pt => {
            minX = Math.min(minX, pt.x);
            maxX = Math.max(maxX, pt.x);
            minY = Math.min(minY, pt.y);
            maxY = Math.max(maxY, pt.y);
          });
          ctx.rect(minX - 4, minY - 4, (maxX - minX) + 8, (maxY - minY) + 8);
        }
        ctx.stroke();
        ctx.restore();
      }
    });

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
          const width = 160;
          const height = el.size * el.text.split('\n').length * 1.2 + 8;
          if (x >= el.x && x <= el.x + width && y >= el.y && y <= el.y + height) {
            return el;
          }
        }
      }
    }
    return null;
  };

  // Lưu trữ tham chiếu trạng thái mới nhất để tránh bind/unbind liên tục gây mất nhạy/trễ phím tắt trên Wacom
  const stateRef = useRef({
    isActive,
    tool,
    selectedId,
    elements,
    textInput,
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
  });

  // Cập nhật đồng bộ ngay trong render body để bảo đảm stateRef.current luôn có giá trị mới nhất trước khi bất kỳ useEffect hay render nào diễn ra
  stateRef.current = {
    isActive,
    tool,
    selectedId,
    elements,
    textInput,
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

      // 0. CHỨC NĂNG GHOST MODE (Shift): Tạm thời tắt vẽ để tương tác click/hover web bên dưới
      if (e.key === 'Shift') {
        const target = e.target as HTMLElement;
        const isInput = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable ||
          stateRef.current.textInput !== null;
        if (!isInput) {
          setIsShiftPressed(true);
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
        setTool('hand');
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

      // Nhấn Backspace / Delete đơn lẻ để xoá duy nhất phần tử đang chọn
      const isBackspaceOrDelete = e.key === 'Backspace' || e.key === 'Delete' || e.code === 'Backspace' || e.code === 'Delete';
      if (isBackspaceOrDelete) {
        if (currentSelectedId && !(e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          setElements(prev => prev.filter(el => el.id !== currentSelectedId));
          setSelectedId(null);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
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
          ctx.globalCompositeOperation = 'destination-out';
          ctx.globalAlpha = 1.0;
          ctx.lineWidth = eraserSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();

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
          newElement = {
            id: elementId,
            type: tool,
            points: [...points],
            color: color,
            size: tool === 'eraser' ? eraserSize : tool === 'highlight' ? highlightSize : pencilSize,
            penStyle: tool === 'pencil' ? penStyle : undefined
          };
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

  // Tự động focus vào ô nhập văn bản khi được tạo ra
  useEffect(() => {
    if (textInput && textInputRef.current) {
      // Delay siêu nhỏ để chắc chắn DOM đã render xong thẻ textarea
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 30);
    }
  }, [textInput]);

  // Hoàn thành nhập text và vẽ lưu vào Vector state
  const handleTextSubmit = () => {
    if (!textInput || !textInputValRef.current.trim()) {
      setTextInput(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = textInput.x - rect.left;
    const y = textInput.y - rect.top;

    const newElement: DrawElement = {
      id: Date.now().toString(),
      type: 'text',
      points: [],
      color: color,
      size: fontSize,
      x: x,
      y: y,
      text: textInputValRef.current
    };

    setElements(prev => [...prev, newElement]);
    setTextInput(null);
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
    if (tool === 'hand') return (selectedId || isGrabbingPage) ? 'grabbing' : 'grab';

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
      return 'crosshair';
    }

    if (tool === 'highlight') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><polygon points="1,4 5,1 12,8 8,11" fill="${color}" stroke="#000000" stroke-width="1" stroke-linejoin="round"/><line x1="1" y1="4" x2="5" y2="1" stroke="#FFFFFF" stroke-width="1.2"/></svg>`;
      const b64 = btoaSafe(svg);
      return `url('data:image/svg+xml;base64,${b64}') 3 2, crosshair`;
    }

    if (tool === 'text') return 'text';
    return 'crosshair';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, eraserSize, color, selectedId, isGrabbingPage, isShiftPressed]);

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
          if (tool === 'text') {
            setSelectedId(null);
            setTextInput({ x: e.clientX, y: e.clientY });
            textInputValRef.current = "";
          }
        }}
        style={{ 
          cursor: cursorStyle,
          pointerEvents: (tool === 'cursor' || textInput || isShiftPressed) ? 'none' : 'auto'
        }}
      />

      {/* 2. Ô nhập Text nổi */}
      {textInput && (
        <textarea
          ref={textInputRef}
          className={styles.textInput}
          style={{
            left: textInput.x,
            top: textInput.y,
            color: color,
            fontSize: `${fontSize}px`,
            minWidth: '40px',
            width: '60px',
            height: `${fontSize * 1.3}px`
          }}
          autoFocus
          rows={1}
          onChange={(e) => {
            textInputValRef.current = e.target.value;
            const target = e.target;
            
            // Tự động đo đạc co giãn kích thước theo cả 2 chiều dọc và ngang khi gõ
            target.style.width = 'auto';
            target.style.height = 'auto';
            target.style.width = `${Math.max(60, target.scrollWidth + 12)}px`;
            target.style.height = `${target.scrollHeight}px`;
          }}
          onBlur={handleTextSubmit}
          onKeyDown={(e) => {
            // Nhấn phím Enter (không kèm Shift): Lưu và kết thúc nhập
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleTextSubmit();
            }
            // Nhấn Shift+Enter: Cho phép xuống dòng bên trong textarea
            if (e.key === 'Enter' && e.shiftKey) {
              // Để trình duyệt thực hiện chèn ký tự \n mặc định
              // Cập nhật chiều cao sau khi render
              setTimeout(() => {
                const target = textInputRef.current;
                if (target) {
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }
              }, 10);
            }
            if (e.key === 'Escape') {
              setTextInput(null);
            }
          }}
        />
      )}

      {/* 3. Floating Toolbar (1 hàng ngang mờ mịn) */}
      <div 
        className={styles.toolbar}
        style={{
          left: `${toolbarPos.x}px`,
          top: `${toolbarPos.y}px`
        }}
      >
        {/* Nắm kéo di chuyển toolbar */}
        <div 
          className={styles.dragHandle} 
          onMouseDown={handleToolbarMouseDown}
          title="Kéo thả di chuyển thanh công cụ"
        >
          <GripVertical size={18} />
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
          <MousePointer size={18} />
        </button>

        {/* Nút Bàn tay chọn & di chuyển đối tượng */}
        <button
          className={`${styles.btn} ${tool === 'hand' ? styles.btnActive : ''}`}
          onClick={() => setTool('hand')}
          data-tooltip="Bàn tay: chọn & di chuyển nét vẽ — phím tắt: Esc"
        >
          <Hand size={18} />
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
            <Pencil size={18} />
          </button>
          <button
            className={`${styles.btn} ${tool === 'pencil' && !activeCloneId ? styles.btnActive : ''}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowPenStyleMenu(prev => !prev);
            }}
            style={{ 
              width: '16px', 
              padding: 0, 
              borderTopLeftRadius: 0, 
              borderBottomLeftRadius: 0,
              marginLeft: '-1px',
              borderLeft: '1px solid rgba(255,255,255,0.1)'
            }}
            title="Chọn đầu bút cọ vẽ"
          >
            <ChevronDown size={10} />
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

        {/* Các bút chì clone */}
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
            <Pencil size={12} style={{ color: clone.color }} />
            <div className={styles.cloneColorBadge} style={{ backgroundColor: clone.color }} />
          </button>
        ))}

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
          <Highlighter size={18} />
        </button>

        {/* Các highlight clone */}
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
            <Highlighter size={12} style={{ color: clone.color }} />
            <div className={styles.cloneColorBadge} style={{ backgroundColor: clone.color }} />
          </button>
        ))}

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
            <FlashIcon />
          </button>
          <button
            className={`${styles.btn} ${isFlashlightActive ? styles.btnActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setFlashlightShape(prev => prev === 'circle' ? 'rectangle' : 'circle');
            }}
            style={{ 
              width: '16px', 
              padding: 0, 
              borderTopLeftRadius: 0, 
              borderBottomLeftRadius: 0,
              marginLeft: '-1px',
              borderLeft: '1px solid rgba(255,255,255,0.1)'
            }}
            title="Đổi hình dạng đèn chiếu (Tròn / Chữ nhật)"
          >
            {flashlightShape === 'circle' ? <CircleIcon size={8} /> : <Square size={8} />}
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
          <Eraser size={18} />
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
          <Square size={18} />
        </button>

        {/* Các rectangle clone */}
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
            <Square size={12} style={{ color: clone.color }} />
            <div className={styles.cloneColorBadge} style={{ backgroundColor: clone.color }} />
          </button>
        ))}

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
          <CircleIcon size={18} />
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
          <Type size={18} />
        </button>

        {/* 6 chấm màu: click = chọn màu, double-click = mở bảng màu preset để đổi slot */}
        <div className={styles.colorPicker} style={{ position: 'relative' }}>
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
          <div className={styles.colorRow}>
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
          <div className={styles.colorRow}>
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
        <div className={styles.sizeIndicator} title="Kích cỡ nét: Phím [ giảm, ] tăng">
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
          <Trash2 size={18} />
        </button>

        {/* Nút Cài đặt Gear */}
        <button
          className={`${styles.btn} ${styles.btnGear}`}
          onClick={() => {
            setDraftHotkeys({ ...customHotkeys });
            setDraftClonedTools([...clonedTools]);
            setShowSettings(true);
            setActiveTab('shortcuts');
            setListeningKeyFor(null);
            setNewCloneName('');
            setNewCloneBaseType('pencil');
            setNewCloneColor('#EF4444');
            setNewCloneHotkey('');
          }}
          data-tooltip="Cấu hình phím tắt & Bút vẽ"
        >
          <Settings size={18} />
        </button>

        {/* Nút Đóng hoàn toàn công cụ */}
        <button
          className={`${styles.btn} ${styles.btnClose}`}
          onClick={() => setIsActive(false)}
          data-tooltip="Đóng công cụ vẽ"
        >
          <X size={18} />
        </button>
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
            </div>

            <div className={styles.modalContent}>
              {activeTab === 'shortcuts' && (
                <div className={styles.hotkeyList}>
                  {Object.keys(draftHotkeys).map((key) => (
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
                  ))}
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
                      </select>
                    </div>

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

                    <div className={styles.cloneFormRow}>
                      <button 
                        className={`${styles.hotkeyButton} ${listeningKeyFor === 'newClone' ? styles.hotkeyListeningActive : ''}`}
                        onClick={() => setListeningKeyFor('newClone')}
                        style={{ flex: 1 }}
                      >
                        {listeningKeyFor === 'newClone' 
                          ? 'NHẤN PHÍM TẮT...' 
                          : newCloneHotkey 
                            ? `Phím tắt: ${newCloneHotkey.toUpperCase()}` 
                            : 'Gán phím tắt...'}
                      </button>
                      
                      <button 
                        className={styles.btnCreateClone}
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
                          const duplicateClone = draftClonedTools.some(c => c.hotkey === newCloneHotkey);
                          if (duplicateOriginal || duplicateClone) {
                            alert("Phím tắt này đã được sử dụng! Vui lòng chọn phím khác.");
                            return;
                          }

                          const newClone: ClonedTool = {
                            id: Date.now().toString(),
                            baseType: newCloneBaseType,
                            name: newCloneName,
                            color: newCloneColor,
                            hotkey: newCloneHotkey
                          };
                          setDraftClonedTools(prev => [...prev, newClone]);
                          setNewCloneName('');
                          setNewCloneHotkey('');
                        }}
                      >
                        Thêm Bút
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
                        <div key={clone.id} className={styles.cloneItem}>
                          <div className={styles.cloneItemLeft}>
                            <div className={styles.cloneItemColorDot} style={{ backgroundColor: clone.color }} />
                            <div>
                              <div className={styles.cloneItemName}>{clone.name}</div>
                              <div className={styles.cloneItemMeta}>
                                {clone.baseType === 'pencil' ? 'Bút chì' : clone.baseType === 'highlight' ? 'Highlight' : 'Hình chữ nhật'}
                              </div>
                            </div>
                          </div>
                          <div className={styles.cloneItemRight}>
                            <span className={styles.cloneItemHotkey}>{clone.hotkey}</span>
                            <button 
                              className={styles.btnDeleteClone}
                              onClick={() => {
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
