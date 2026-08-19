import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

interface RichTextInputProps {
  value: string; // Markdown string e.g. "một hai ba **bốn**"
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<any>) => void;
  onBlur: () => void;
  color: string;
  fontSize: number;
  style?: React.CSSProperties;
  textStyle?: string;
  textHasBorder?: boolean;
  textBorderWidth?: number;
  textBgColor?: string;
  textBgOpacity?: number;
  fontFamily?: string;
  colorSlots?: string[]; // Thêm danh sách màu truyền từ Toolbar chính
}

export const hexToRgba = (hex: string, opacity: number): string => {
  if (!hex) return 'transparent';
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const MarkdownTextarea: React.FC<RichTextInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onBlur,
  color,
  fontSize,
  style,
  textStyle,
  textHasBorder,
  textBorderWidth,
  textBgColor,
  textBgOpacity,
  fontFamily,
  colorSlots,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectionCoords, setSelectionCoords] = useState<{ top: number; left: number } | null>(null);

  const defaultColors = ['#EF4444', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#5C4033'];
  const colorsToUse = colorSlots && colorSlots.length > 0 ? colorSlots : defaultColors;

  // Chuyển đổi ngược từ DOM HTML về chuỗi Markdown thô
  const domToMarkdown = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      let childrenText = "";
      el.childNodes.forEach(child => {
        childrenText += domToMarkdown(child);
      });
      
      if (tagName === "br") {
        return "\n";
      }
      if (
        tagName === "div" ||
        tagName === "p" ||
        tagName === "li" ||
        tagName === "tr" ||
        tagName === "h1" ||
        tagName === "h2" ||
        tagName === "h3" ||
        tagName === "h4" ||
        tagName === "h5" ||
        tagName === "h6"
      ) {
        return "\n" + childrenText;
      }
      if (tagName === "b" || tagName === "strong") {
        return `**${childrenText}**`;
      }
      if (tagName === "i" || tagName === "em") {
        return `*${childrenText}*`;
      }
      if (tagName === "u") {
        return `<u>${childrenText}</u>`;
      }
      if (tagName === "s" || tagName === "strike" || tagName === "del") {
        return `~~${childrenText}~~`;
      }
      if (tagName === "font") {
        const fontColor = el.getAttribute("color");
        if (fontColor) {
          return `<font color="${fontColor}">${childrenText}</font>`;
        }
      }
      
      // Kiểm tra inline styles đề phòng trình duyệt tự áp css thay vì thẻ
      const styleAttr = el.getAttribute("style") || "";
      let wrapped = childrenText;
      if (el.style.color) {
        wrapped = `<font color="${el.style.color}">${wrapped}</font>`;
      }
      if (styleAttr.includes("font-weight: bold") || el.style.fontWeight === "bold" || parseInt(el.style.fontWeight) >= 600) {
        wrapped = `**${wrapped}**`;
      }
      if (styleAttr.includes("font-style: italic") || el.style.fontStyle === "italic") {
        wrapped = `*${wrapped}*`;
      }
      if (styleAttr.includes("text-decoration: underline") || el.style.textDecorationLine === "underline" || el.style.textDecoration === "underline") {
        wrapped = `<u>${wrapped}</u>`;
      }
      if (styleAttr.includes("text-decoration: line-through") || el.style.textDecorationLine === "line-through" || el.style.textDecoration === "line-through") {
        wrapped = `~~${wrapped}~~`;
      }
      return wrapped;
    }
    return "";
  };

  // Chuyển đổi Markdown thô sang định dạng HTML tương ứng
  const markdownToHtml = (md: string): string => {
    if (!md) return "";
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Khôi phục thẻ <u> và </u> an toàn
    html = html
      .replace(/&lt;u&gt;/gi, "<u>")
      .replace(/&lt;\/u&gt;/gi, "</u>");

    // Khôi phục thẻ <font color="..."> và </font>
    html = html
      .replace(/&lt;font color="([^"]+)"&gt;/gi, '<font color="$1">')
      .replace(/&lt;\/font&gt;/gi, '</font>');

    // Chuyển đổi các cú pháp markdown khác sang html tag
    html = html
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\*([^*]+)\*/g, "<i>$1</i>")
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      .replace(/\n/g, "<br>");
    return html;
  };

  const htmlToMarkdown = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    let markdown = "";
    tempDiv.childNodes.forEach(child => {
      markdown += domToMarkdown(child);
    });
    
    return markdown.trimStart();
  };

  const updateSelectionTooltip = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelectionCoords(null);
      return;
    }
    
    const range = sel.getRangeAt(0);
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
      setSelectionCoords(null);
      return;
    }
    
    const rects = range.getClientRects();
    if (rects.length === 0) {
      setSelectionCoords(null);
      return;
    }
    
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    // Căn giữa ngang và cách phía trên vùng chọn 40px
    const left = rect.left - editorRect.left + (rect.width / 2);
    const top = rect.top - editorRect.top - 40;
    
    setSelectionCoords({ top, left });
  };

  // Nạp dữ liệu HTML vào khung contentEditable khi mount và thiết lập sự kiện
  useEffect(() => {
    if (editorRef.current) {
      const html = markdownToHtml(value);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
      
      editorRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    const handleSelectionChange = () => {
      updateSelectionTooltip();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const markdown = htmlToMarkdown(editorRef.current.innerHTML);
      onChange(markdown);
    }
  };

  const applyFormat = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleInput();
    // Cập nhật lại vị trí tooltip sau khi định dạng (hoặc tắt đi nếu mất chọn)
    setTimeout(updateSelectionTooltip, 10);
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMetaOrCtrl = e.ctrlKey || e.metaKey;

    // 1. Phím tắt Cmd+B / Ctrl+B
    if (isMetaOrCtrl && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyFormat("bold");
    } 
    // 2. Phím tắt Cmd+I / Ctrl+I
    else if (isMetaOrCtrl && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyFormat("italic");
    }
    // 3. Phím tắt Cmd+U / Ctrl+U
    else if (isMetaOrCtrl && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      applyFormat("underline");
    }
    // 4. Phím tắt Cmd+Shift+X / Ctrl+Shift+X
    else if (isMetaOrCtrl && e.shiftKey && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      applyFormat("strikeThrough");
    }
    // 5. Nhấn Enter không Shift: Lưu và đóng nháp
    else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      onBlur();
    }
    // 6. Chuyển tiếp các sự kiện phím khác ra ngoài
    else {
      onKeyDown(e as any);
    }
  };

  const handlePaste = () => {
    setTimeout(handleInput, 0);
  };

  const borderStyle = textHasBorder 
    ? `${textBorderWidth || 1}px solid ${color}` 
    : '1px dashed rgba(59, 130, 246, 0.6)';

  const bgStyle = textBgColor 
    ? hexToRgba(textBgColor, textBgOpacity !== undefined ? textBgOpacity : 1.0) 
    : 'transparent';

  return (
    <div
      data-text-editor-wrapper="true"
      style={{
        ...style,
        position: 'fixed',
        zIndex: 1000000003,
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 100px)',
      }}
    >
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={styles.richTextInput}
        onInput={handleInput}
        onKeyDown={handleKeyDownInternal}
        onBlur={onBlur}
        onPaste={handlePaste}
        style={{
          fontSize: `${fontSize}px`,
          color: color,
          fontWeight: textStyle === 'bold' || textStyle === 'bold-italic' ? 'bold' : '500',
          fontStyle: textStyle === 'italic' || textStyle === 'bold-italic' ? 'italic' : 'normal',
          border: borderStyle,
          backgroundColor: bgStyle,
          padding: "5px 6px",
          borderRadius: "3px",
          lineHeight: 1.2,
          fontFamily: fontFamily || "inherit",
          boxSizing: "border-box",
          minWidth: "60px",
          outline: "none",
          position: 'relative',
          zIndex: 1,
        }}
      />

      {selectionCoords && (
        <div
          className={styles.selectionTooltip}
          style={{
            position: 'absolute',
            top: `${selectionCoords.top}px`,
            left: `${selectionCoords.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          <button
            type="button"
            className={styles.tooltipBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat("bold")}
            title="In đậm (Cmd+B)"
          >
            B
          </button>
          <button
            type="button"
            className={styles.tooltipBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat("italic")}
            title="In nghiêng (Cmd+I)"
            style={{ fontStyle: 'italic' }}
          >
            I
          </button>
          <button
            type="button"
            className={styles.tooltipBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat("underline")}
            title="Gạch chân (Cmd+U)"
            style={{ textDecoration: 'underline' }}
          >
            U
          </button>
          <button
            type="button"
            className={styles.tooltipBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat("strikeThrough")}
            title="Gạch ngang (Cmd+Shift+X)"
            style={{ textDecoration: 'line-through' }}
          >
            S
          </button>

          {/* Đường ngăn cách */}
          <div className={styles.tooltipDivider} />

          {/* 6 chấm màu chọn nhanh */}
          <div className={styles.tooltipColors}>
            {colorsToUse.map((c) => (
              <div
                key={c}
                className={styles.tooltipColorDot}
                style={{ backgroundColor: c }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormat("foreColor", c)}
                title={`Đổi màu chữ thành ${c}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


