import React, { useEffect, useRef } from "react";
import styles from "./styles.module.css";

interface RichTextInputProps {
  value: string; // Markdown string e.g. "một hai ba **bốn**"
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<any>) => void;
  onBlur: () => void;
  color: string;
  fontSize: number;
  style?: React.CSSProperties;
}

export const MarkdownTextarea: React.FC<RichTextInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onBlur,
  color,
  fontSize,
  style,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Chuyển đổi Markdown thô ("một **hai**") sang định dạng HTML tương ứng ("một <b>hai</b>")
  const markdownToHtml = (md: string): string => {
    if (!md) return "";
    return md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>") // Chuyển **chữ** sang <b>chữ</b>
      .replace(/\n/g, "<br>"); // Xuống dòng
  };

  // Chuyển đổi ngược từ DOM HTML (chứa thẻ <b>) về chuỗi Markdown thô kèm ký tự **
  const htmlToMarkdown = (html: string): string => {
    let text = html;
    
    // Xử lý xuống dòng trước
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<div>/gi, "\n").replace(/<\/div>/gi, "");
    
    // Chuyển các thẻ in đậm <b> hoặc <strong> về định dạng markdown **
    text = text.replace(/<b>(.*?)<\/b>/gi, "**$1**");
    text = text.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
    
    // Giải mã thực thể HTML cơ bản để lưu trữ text thuần túy
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    return tempDiv.innerText || tempDiv.textContent || text;
  };

  // Nạp dữ liệu HTML vào khung contentEditable khi mount
  useEffect(() => {
    if (editorRef.current) {
      const html = markdownToHtml(value);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
      
      // Tự động focus và đặt con trỏ ở cuối dòng
      editorRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false); // Collapsed to end
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const markdown = htmlToMarkdown(editorRef.current.innerHTML);
      onChange(markdown);
    }
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 1. Tích hợp phím tắt Ctrl+B / Cmd+B để bôi đậm/bỏ bôi đậm văn bản đang chọn
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      document.execCommand("bold", false);
      handleInput(); // Đồng bộ trạng thái ngay lập tức
    } 
    // 2. Nhấn Enter để kết thúc soạn thảo nháp (không kèm Shift)
    else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onBlur();
    }
    // 3. Trả sự kiện khác ra ngoài index.tsx
    else {
      onKeyDown(e as any);
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className={styles.richTextInput}
      onInput={handleInput}
      onKeyDown={handleKeyDownInternal}
      onBlur={onBlur}
      style={{
        ...style,
        fontSize: `${fontSize}px`,
        color: color,
        lineHeight: 1.3,
        fontFamily: "inherit",
        boxSizing: "border-box",
        minWidth: "60px",
        outline: "none",
      }}
    />
  );
};
