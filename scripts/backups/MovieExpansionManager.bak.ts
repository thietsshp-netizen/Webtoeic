export interface ExampleItem {
  en: string;
  ipa?: string;
  vi: string;
}

export interface ExpansionVocabItem {
  word: string;
  ipa?: string;
  meaning: string;
  examples: ExampleItem[];
}

export interface ExpansionStructureItem {
  pattern: string;
  meaning: string;
  examples: ExampleItem[];
}

export interface SubtitleExpansion {
  vocabulary?: ExpansionVocabItem[];
  structures?: ExpansionStructureItem[];
}

export interface Subtitle {
  start: number;
  end: number;
  text: string;
  ipa?: string;
  vietnamese?: string;
  slang_and_idiom?: string;
  expansion?: SubtitleExpansion;
}

export interface FlattenedExpansionItem {
  type: 'vocabulary' | 'structure';
  rawIndex: number;
  word?: string;
  pattern?: string;
  ipa?: string;
  meaning: string;
  examples: ExampleItem[];
}

export const getFlattenedExpansionItems = (sub?: Subtitle): FlattenedExpansionItem[] => {
  if (!sub || !sub.expansion) return [];
  const items: FlattenedExpansionItem[] = [];

  if (Array.isArray(sub.expansion.vocabulary)) {
    sub.expansion.vocabulary.forEach((v, idx) => {
      if (v && (v.word || v.meaning)) {
        items.push({
          type: 'vocabulary',
          rawIndex: idx,
          word: v.word || '',
          ipa: v.ipa || '',
          meaning: v.meaning || '',
          examples: Array.isArray(v.examples) ? v.examples : [],
        });
      }
    });
  }

  if (Array.isArray(sub.expansion.structures)) {
    sub.expansion.structures.forEach((s, idx) => {
      if (s && (s.pattern || s.meaning)) {
        items.push({
          type: 'structure',
          rawIndex: idx,
          pattern: s.pattern || '',
          meaning: s.meaning || '',
          examples: Array.isArray(s.examples) ? s.examples : [],
        });
      }
    });
  }

  return items;
};

const escapeHtml = (unsafe: string) => {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const generateMovieExpansionPopupHtml = (params: {
  subIndex: number;
  totalSubtitles: number;
  sub: Subtitle;
  activeItemIndex: number;
  isEditMode?: boolean;
  isSaving?: boolean;
  addType?: 'vocabulary' | 'structure' | null;
}) => {
  const { subIndex, totalSubtitles, sub, activeItemIndex, isEditMode = false, isSaving = false, addType = null } = params;
  const items = getFlattenedExpansionItems(sub);
  const totalItems = items.length;
  const currentItem: FlattenedExpansionItem | null =
    addType === 'vocabulary'
      ? { type: 'vocabulary', rawIndex: -1, word: '', ipa: '', meaning: '', examples: [{ en: '', ipa: '', vi: '' }] }
      : addType === 'structure'
      ? { type: 'structure', rawIndex: -1, pattern: '', meaning: '', examples: [{ en: '', ipa: '', vi: '' }] }
      : items[activeItemIndex] || null;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Kiến thức mở rộng - Câu ${subIndex + 1}/${totalSubtitles}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-size: 14px;
    }
    .header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 16px;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0;
    }
    .badge-q {
      font-size: 11px;
      font-weight: 800;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.03em;
    }
    .badge-nav {
      font-size: 11px;
      font-weight: 700;
      background: #ede9fe;
      color: #6d28d9;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .sub-quote {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.4;
      margin-bottom: 4px;
    }
    .sub-vi {
      font-size: 12.5px;
      color: #64748b;
      line-height: 1.4;
    }
    .scroll-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      position: relative;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      position: relative;
    }
    .card-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 3px 9px;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .badge-vocab {
      background: #f5f3ff;
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }
    .badge-structure {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .main-word {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }
    .ipa-tag {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13.5px;
      font-weight: 600;
      color: #7c3aed;
      background: #f3e8ff;
      padding: 2px 7px;
      border-radius: 5px;
    }
    .meaning-box {
      margin-top: 6px;
      font-size: 15px;
      font-weight: 600;
      color: #334155;
      line-height: 1.5;
    }
    .pattern-box {
      font-size: 16px;
      font-weight: 800;
      color: #92400e;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 8px 12px;
      border-radius: 8px;
      line-height: 1.4;
      margin-bottom: 6px;
    }
    .examples-title {
      font-size: 11.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-top: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .example-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 14px;
    }
    .example-item {
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px 14px;
      border: 1px solid #f1f5f9;
      border-left: 3px solid #6366f1;
    }
    .ex-en {
      font-weight: 700;
      color: #0f172a;
      font-size: 15px;
      line-height: 1.45;
    }
    .ex-ipa {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      color: #7c3aed;
      margin-top: 3px;
      line-height: 1.3;
    }
    .ex-vi {
      font-size: 14px;
      color: #047857;
      font-weight: 500;
      margin-top: 4px;
      line-height: 1.45;
      padding-left: 14px;
    }
    .actions-bar {
      display: flex;
      gap: 6px;
      margin-top: 14px;
      justify-content: flex-end;
    }
    .btn {
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
      user-select: none;
    }
    .btn-icon {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border-radius: 8px;
    }
    .btn-edit {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }
    .btn-edit:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn-delete {
      background: #fee2e2;
      color: #dc2626;
      border-color: #fecaca;
    }
    .btn-delete:hover {
      background: #fca5a5;
    }
    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
    .btn-cancel {
      background: #e2e8f0;
      color: #475569;
    }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }
    .empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }
    .empty-text {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }
    .empty-sub {
      font-size: 12.5px;
      color: #94a3b8;
      margin-bottom: 20px;
    }
    .empty-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    /* Edit Form Styles */
    .form-group {
      margin-bottom: 12px;
    }
    .form-label {
      display: block;
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .form-input, .form-textarea {
      width: 100%;
      font-size: 13.5px;
      padding: 7px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #0f172a;
      outline: none;
      font-family: inherit;
    }
    .form-input:focus, .form-textarea:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .form-textarea {
      resize: vertical;
      min-height: 48px;
    }
    .ex-form-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
      position: relative;
    }
    .ex-form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .ex-form-title {
      font-size: 11px;
      font-weight: 800;
      color: #64748b;
    }
    .btn-remove-ex {
      background: transparent;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
    }
    .btn-add-ex {
      width: 100%;
      background: #f1f5f9;
      border: 1px dashed #cbd5e1;
      color: #475569;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 12px;
    }
    .btn-add-ex:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    /* Subtle Bottom-Right Help Button */
    .help-btn {
      position: fixed;
      bottom: 12px;
      right: 12px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #475569;
      border: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
      transition: all 0.2s ease;
    }
    .help-btn:hover {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4f46e5;
      transform: scale(1.1);
    }
    .help-popover {
      position: fixed;
      bottom: 46px;
      right: 12px;
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 14px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      font-size: 11.5px;
      line-height: 1.6;
      width: 230px;
      z-index: 100;
      display: none;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .help-popover.active {
      display: block;
    }
    .help-key {
      display: inline-block;
      background: #334155;
      color: #38bdf8;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 700;
      margin-right: 4px;
    }
  </style>
</head>
<body>

  <!-- Fixed Header -->
  <div class="header">
    <div class="header-top">
      <span class="badge-q">CÂU ${subIndex + 1} / ${totalSubtitles}</span>
      ${totalItems > 0 && !isEditMode && !addType ? `<span class="badge-nav">Mục ${activeItemIndex + 1} / ${totalItems} (phím , .)</span>` : ''}
    </div>
  </div>

  <!-- Main Scrollable Body -->
  <div class="scroll-content" id="scrollContent">
    ${(() => {
      // 1. ADD NEW OR EDIT MODE FORM
      if (isEditMode || addType) {
        const itemType = addType || currentItem?.type || 'vocabulary';
        const isVocab = itemType === 'vocabulary';
        const wordVal = isVocab ? (currentItem?.word || '') : '';
        const patternVal = !isVocab ? (currentItem?.pattern || '') : '';
        const ipaVal = currentItem?.ipa || '';
        const meaningVal = currentItem?.meaning || '';
        const examplesList = currentItem?.examples && currentItem.examples.length > 0
          ? currentItem.examples
          : [{ en: '', ipa: '', vi: '' }];

        return `
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div class="card-badge ${isVocab ? 'badge-vocab' : 'badge-structure'}" style="margin-bottom: 0;">
                ${isVocab ? '💎 ' + (addType ? 'Thêm Từ Vựng Mới' : 'Sửa Từ Vựng') : '📐 ' + (addType ? 'Thêm Cấu Trúc Mới' : 'Sửa Cấu Trúc')}
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-edit" style="font-size: 11px; padding: 4px 8px;" data-action="add-vocab" onclick="triggerAddNew('vocabulary')">+ Thêm Từ vựng</button>
                <button type="button" class="btn btn-edit" style="font-size: 11px; padding: 4px 8px;" data-action="add-struct" onclick="triggerAddNew('structure')">+ Thêm Cấu trúc</button>
              </div>
            </div>

            <form id="editForm" onsubmit="handleSaveForm(event)">
              <input type="hidden" id="formItemType" value="${itemType}">
              <input type="hidden" id="formRawIndex" value="${currentItem?.rawIndex ?? -1}">

              ${isVocab ? `
                <div class="form-group">
                  <label class="form-label">Từ vựng / Cụm từ</label>
                  <input type="text" id="fieldWord" class="form-input" required value="${escapeHtml(wordVal)}" placeholder="Ví dụ: poach">
                </div>
                <div class="form-group">
                  <label class="form-label">Phiên âm IPA chuẩn US (tùy chọn)</label>
                  <input type="text" id="fieldIpa" class="form-input" value="${escapeHtml(ipaVal)}" placeholder="Ví dụ: /poʊtʃ/">
                </div>
              ` : `
                <div class="form-group">
                  <label class="form-label">Công thức / Cấu trúc</label>
                  <input type="text" id="fieldPattern" class="form-input" required value="${escapeHtml(patternVal)}" placeholder="Ví dụ: be in charge of + V-ing/Noun">
                </div>
              `}

              <div class="form-group">
                <label class="form-label">Giải thích nghĩa tiếng Việt</label>
                <textarea id="fieldMeaning" class="form-textarea" required placeholder="Giải thích nghĩa và ngữ cảnh sử dụng">${escapeHtml(meaningVal)}</textarea>
              </div>

              <div class="examples-title">
                <span>Danh sách câu / cụm ví dụ</span>
              </div>

              <div id="examplesContainer" class="example-list" style="margin-top: 0;">
                ${examplesList.map((ex, exIdx) => `
                  <div class="ex-form-item" data-ex-index="${exIdx}">
                    <div class="ex-form-header">
                      <span class="ex-form-title">Ví dụ ${exIdx + 1}</span>
                      <button type="button" class="btn-remove-ex" data-action="remove-example-row" onclick="removeExampleRow(this)">✕ Xóa</button>
                    </div>
                    <div style="margin-bottom: 6px;">
                      <input type="text" class="form-input ex-input-en" placeholder="Câu / cụm tiếng Anh ngắn gọn" value="${escapeHtml(ex.en || '')}">
                    </div>
                    <div>
                      <input type="text" class="form-input ex-input-vi" placeholder="Nghĩa tiếng Việt" value="${escapeHtml(ex.vi || '')}">
                    </div>
                  </div>
                `).join('')}
              </div>

              <button type="button" class="btn-add-ex" data-action="add-example-row" onclick="addExampleRow()">+ Thêm ví dụ tiếp theo</button>

              <div class="actions-bar" style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <button type="button" class="btn btn-cancel" data-action="cancel-edit" onclick="cancelEditMode()">Hủy</button>
                <button type="submit" class="btn btn-primary" id="btnSubmitSave">
                  ${isSaving ? 'Đang lưu...' : '💾 Lưu thay đổi (Ctrl+S)'}
                </button>
              </div>
            </form>
          </div>
        `;
      }

      // 2. EMPTY STATE
      if (!currentItem || totalItems === 0) {
        return `
          <div class="empty-state">
            <div class="empty-icon">💡</div>
            <div class="empty-text">Chưa có từ vựng hoặc cấu trúc mở rộng</div>
            <div class="empty-sub">Bạn có thể thêm từ vựng hay hoặc cấu trúc giao tiếp trực tiếp cho câu thoại này.</div>
            <div class="empty-actions">
              <button class="btn btn-primary" data-action="add-vocab" onclick="triggerAddNew('vocabulary')">+ Thêm từ vựng</button>
              <button class="btn btn-edit" data-action="add-struct" onclick="triggerAddNew('structure')">+ Thêm cấu trúc</button>
            </div>
          </div>
        `;
      }

      // 3. VIEW MODE CARD
      const isVocab = currentItem.type === 'vocabulary';
      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div class="card-badge ${isVocab ? 'badge-vocab' : 'badge-structure'}" style="margin-bottom: 0;">
              ${isVocab ? '💎 Từ Vựng Hay' : '📐 Cấu Trúc Giao Tiếp'}
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-icon btn-edit" data-action="edit" title="Sửa (E)" onclick="enterEditMode()">✏️</button>
              <button class="btn btn-icon btn-delete" data-action="delete" title="Xóa" onclick="handleDeleteItem()">🗑️</button>
            </div>
          </div>

          ${isVocab ? `
            <div class="main-word">
              <span>${escapeHtml(currentItem.word || '')}</span>
            </div>
            <div class="meaning-box">${escapeHtml(currentItem.meaning || '')}</div>
          ` : `
            <div class="pattern-box">${escapeHtml(currentItem.pattern || '')}</div>
            <div class="meaning-box">${escapeHtml(currentItem.meaning || '')}</div>
          `}

          ${currentItem.examples && currentItem.examples.length > 0 ? `
            <div class="example-list">
              ${currentItem.examples.map((ex, exIdx) => `
                <div class="example-item">
                  <div class="ex-en">${exIdx + 1}. ${escapeHtml(ex.en || '')}</div>
                  <div class="ex-vi">${escapeHtml(ex.vi || '')}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${totalItems > 1 ? `
            <div class="actions-bar" style="border-top: 1px dashed #e2e8f0; padding-top: 10px; margin-top: 14px; justify-content: flex-end;">
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-edit" style="padding: 4px 10px; font-size: 11px;" data-action="cycle-prev" onclick="sendCycleMessage(',')">◄ Trước (,)</button>
                <button class="btn btn-edit" style="padding: 4px 10px; font-size: 11px;" data-action="cycle-next" onclick="sendCycleMessage('.')">Sau (.) ►</button>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    })()}
  </div>

  <!-- Help Button and Popover -->
  <button class="help-btn" id="helpBtn" title="Xem phím tắt">?</button>
  <div class="help-popover" id="helpPopover">
    <div style="font-weight: 800; margin-bottom: 6px; color: #f8fafc; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
      ⌨️ PHÍM TẮT TIỆN ÍCH
    </div>
    <div><span class="help-key">,</span> / <span class="help-key">.</span> Đổi Từ vựng ↔ Cấu trúc</div>
    <div><span class="help-key">V</span> / <span class="help-key">N</span> Lùi / Tiến câu phụ đề</div>
    <div><span class="help-key">B</span> Nghe lại câu phụ đề</div>
    <div><span class="help-key">E</span> Chuyển chế độ Sửa / Xem</div>
    <div><span class="help-key">Ctrl+S</span> Lưu dữ liệu đang sửa</div>
  </div>

  <script>
    const isEditModeActive = ${isEditMode || !!addType};
    const currentSubIndex = ${subIndex};
    const activeItemIdx = ${activeItemIndex};

    function postToMain(msg) {
      if (window.__mainWindow && typeof window.__mainWindow.postMessage === 'function') {
        window.__mainWindow.postMessage(msg, '*');
      } else if (window.opener && typeof window.opener.postMessage === 'function') {
        window.opener.postMessage(msg, '*');
      } else if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
        window.parent.postMessage(msg, '*');
      }
    }

    // Toggle help tooltip
    const helpBtn = document.getElementById('helpBtn');
    const helpPopover = document.getElementById('helpPopover');
    if (helpBtn && helpPopover) {
      helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopover.classList.toggle('active');
      });
      document.addEventListener('click', () => {
        helpPopover.classList.remove('active');
      });
    }

    function sendCycleMessage(key) {
      postToMain({ type: 'MOVIE_CYCLE_EXPANSION', key: key });
    }

    function sendSeekMessage(key) {
      postToMain({ type: 'MOVIE_SEEK_SUBTITLE', key: key });
    }

    function enterEditMode() {
      postToMain({ type: 'MOVIE_EXPANSION_SET_EDIT_MODE', isEditMode: true });
    }

    function cancelEditMode() {
      postToMain({ type: 'MOVIE_EXPANSION_SET_EDIT_MODE', isEditMode: false, addType: null });
    }

    function triggerAddNew(type) {
      postToMain({ type: 'MOVIE_EXPANSION_SET_EDIT_MODE', isEditMode: true, addType: type });
    }

    function handleDeleteItem() {
      if (!confirm('Bạn có chắc muốn xóa mục kiến thức này khỏi câu thoại?')) return;
      postToMain({ 
        type: 'MOVIE_EXPANSION_DELETE_ITEM', 
        subIndex: currentSubIndex,
        activeItemIndex: activeItemIdx 
      });
    }

    function addExampleRow() {
      const container = document.getElementById('examplesContainer');
      if (!container) return;
      const count = container.querySelectorAll('.ex-form-item').length;
      const itemDiv = document.createElement('div');
      itemDiv.className = 'ex-form-item';
      itemDiv.dataset.exIndex = count;
      itemDiv.innerHTML = \`
        <div class="ex-form-header">
          <span class="ex-form-title">Ví dụ \${count + 1}</span>
          <button type="button" class="btn-remove-ex" data-action="remove-example-row" onclick="removeExampleRow(this)">✕ Xóa</button>
        </div>
        <div style="margin-bottom: 6px;">
          <input type="text" class="form-input ex-input-en" placeholder="Câu / cụm tiếng Anh ngắn gọn">
        </div>
        <div>
          <input type="text" class="form-input ex-input-vi" placeholder="Nghĩa tiếng Việt">
        </div>
      \`;
      container.appendChild(itemDiv);
    }

    function removeExampleRow(btn) {
      const item = btn.closest('.ex-form-item');
      if (item) item.remove();
    }

    function handleSaveForm(e) {
      if (e) e.preventDefault();
      const formItemType = document.getElementById('formItemType')?.value || 'vocabulary';
      const formRawIndex = parseInt(document.getElementById('formRawIndex')?.value || '-1', 10);
      const meaningVal = document.getElementById('fieldMeaning')?.value?.trim() || '';

      const examples = [];
      const exItems = document.querySelectorAll('.ex-form-item');
      exItems.forEach(el => {
        const en = el.querySelector('.ex-input-en')?.value?.trim() || '';
        const ipa = el.querySelector('.ex-input-ipa')?.value?.trim() || '';
        const vi = el.querySelector('.ex-input-vi')?.value?.trim() || '';
        if (en || vi) {
          examples.push({ en, ipa, vi });
        }
      });

      let updatedPayload = null;
      if (formItemType === 'vocabulary') {
        const wordVal = document.getElementById('fieldWord')?.value?.trim() || '';
        const ipaVal = document.getElementById('fieldIpa')?.value?.trim() || '';
        updatedPayload = {
          type: 'vocabulary',
          rawIndex: formRawIndex,
          data: { word: wordVal, ipa: ipaVal, meaning: meaningVal, examples }
        };
      } else {
        const patternVal = document.getElementById('fieldPattern')?.value?.trim() || '';
        updatedPayload = {
          type: 'structure',
          rawIndex: formRawIndex,
          data: { pattern: patternVal, meaning: meaningVal, examples }
        };
      }

      postToMain({
        type: 'MOVIE_EXPANSION_SAVE_ITEM',
        subIndex: currentSubIndex,
        payload: updatedPayload
      });
    }

    // Keyboard listener on popup
    document.addEventListener('keydown', (e) => {
      // Allow Ctrl+S / Cmd+S in form to trigger save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isEditModeActive) {
          handleSaveForm();
        }
        return;
      }

      // Check if user is typing in form inputs
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (isTyping) {
        return; // Do not intercept navigation hotkeys while typing
      }

      // E key -> Edit toggle
      if (e.key.toLowerCase() === 'e' && !isEditModeActive) {
        e.preventDefault();
        enterEditMode();
        return;
      }

      // Navigation hotkeys
      if (e.key === ',' || e.key === '.' || e.key === '[' || e.key === ']' || e.key.toLowerCase() === 'ư' || e.key.toLowerCase() === 'ơ') {
        e.preventDefault();
        sendCycleMessage(e.key);
      } else if (e.code === 'KeyV' || e.code === 'KeyN' || e.code === 'KeyB' || e.key === 'Enter') {
        e.preventDefault();
        sendSeekMessage(e.key === 'Enter' ? 'n' : e.key.toLowerCase());
      }
    });
  </script>
</body>
</html>`;
};

export interface ExpansionPopupCallbacks {
  onSetEditMode: (isEdit: boolean, addType?: 'vocabulary' | 'structure' | null) => void;
  onDeleteItem: (subIdx: number, activeItemIdx: number) => void;
  onSaveItem: (subIdx: number, payload: any) => void;
  onCycle: (key: string) => void;
  onSeek: (key: string) => void;
}

export const attachExpansionPopupHandlers = (
  targetDoc: Document,
  targetWin: any,
  subIndex: number,
  activeItemIndex: number,
  callbacks: ExpansionPopupCallbacks
) => {
  if (!targetDoc) return;

  targetWin.enterEditMode = () => callbacks.onSetEditMode(true);
  targetWin.cancelEditMode = () => callbacks.onSetEditMode(false, null);
  targetWin.triggerAddNew = (type: 'vocabulary' | 'structure') => callbacks.onSetEditMode(true, type);
  targetWin.sendCycleMessage = (key: string) => callbacks.onCycle(key);
  targetWin.sendSeekMessage = (key: string) => callbacks.onSeek(key);
  targetWin.handleDeleteItem = () => {
    const isConfirmed = typeof targetWin.confirm === 'function'
      ? targetWin.confirm('Bạn có chắc muốn xóa mục kiến thức này khỏi câu thoại?')
      : (typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm('Bạn có chắc muốn xóa mục kiến thức này khỏi câu thoại?') : true);
    if (isConfirmed) {
      callbacks.onDeleteItem(subIndex, activeItemIndex);
    }
  };

  targetWin.addExampleRow = () => {
    const container = targetDoc.getElementById('examplesContainer');
    if (!container) return;
    const count = container.querySelectorAll('.ex-form-item').length;
    const itemDiv = targetDoc.createElement('div');
    itemDiv.className = 'ex-form-item';
    itemDiv.dataset.exIndex = String(count);
    itemDiv.innerHTML = `
      <div class="ex-form-header">
        <span class="ex-form-title">Ví dụ ${count + 1}</span>
        <button type="button" class="btn-remove-ex" data-action="remove-example-row">✕ Xóa</button>
      </div>
      <div style="margin-bottom: 6px;">
        <input type="text" class="form-input ex-input-en" placeholder="Câu / cụm tiếng Anh ngắn gọn">
      </div>
      <div>
        <input type="text" class="form-input ex-input-vi" placeholder="Nghĩa tiếng Việt">
      </div>
    `;
    container.appendChild(itemDiv);
  };

  targetWin.removeExampleRow = (btn: HTMLElement) => {
    const item = btn.closest('.ex-form-item');
    if (item) item.remove();
  };

  targetWin.handleSaveForm = (e?: Event) => {
    if (e) e.preventDefault();
    const formItemType = (targetDoc.getElementById('formItemType') as HTMLInputElement)?.value || 'vocabulary';
    const formRawIndex = parseInt((targetDoc.getElementById('formRawIndex') as HTMLInputElement)?.value || '-1', 10);
    const meaningVal = (targetDoc.getElementById('fieldMeaning') as HTMLTextAreaElement)?.value?.trim() || '';

    const examples: ExampleItem[] = [];
    const exItems = targetDoc.querySelectorAll('.ex-form-item');
    exItems.forEach(el => {
      const en = (el.querySelector('.ex-input-en') as HTMLInputElement)?.value?.trim() || '';
      const vi = (el.querySelector('.ex-input-vi') as HTMLInputElement)?.value?.trim() || '';
      if (en || vi) {
        examples.push({ en, vi });
      }
    });

    let updatedPayload: any = null;
    if (formItemType === 'vocabulary') {
      const wordVal = (targetDoc.getElementById('fieldWord') as HTMLInputElement)?.value?.trim() || '';
      const ipaVal = (targetDoc.getElementById('fieldIpa') as HTMLInputElement)?.value?.trim() || '';
      updatedPayload = {
        type: 'vocabulary',
        rawIndex: formRawIndex,
        data: { word: wordVal, ipa: ipaVal, meaning: meaningVal, examples }
      };
    } else {
      const patternVal = (targetDoc.getElementById('fieldPattern') as HTMLInputElement)?.value?.trim() || '';
      updatedPayload = {
        type: 'structure',
        rawIndex: formRawIndex,
        data: { pattern: patternVal, meaning: meaningVal, examples }
      };
    }

    callbacks.onSaveItem(subIndex, updatedPayload);
  };

  // Direct click handler using event delegation
  targetDoc.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (target.closest('#helpBtn')) {
      e.stopPropagation();
      const popover = targetDoc.getElementById('helpPopover');
      if (popover) popover.classList.toggle('active');
      return;
    } else {
      const popover = targetDoc.getElementById('helpPopover');
      if (popover && !target.closest('#helpPopover')) {
        popover.classList.remove('active');
      }
    }

    const actionBtn = target.closest('[data-action]') as HTMLElement | null;
    if (!actionBtn) return;
    const action = actionBtn.getAttribute('data-action');

    if (action === 'edit') {
      e.preventDefault();
      callbacks.onSetEditMode(true);
    } else if (action === 'cancel-edit') {
      e.preventDefault();
      callbacks.onSetEditMode(false, null);
    } else if (action === 'add-vocab') {
      e.preventDefault();
      callbacks.onSetEditMode(true, 'vocabulary');
    } else if (action === 'add-struct') {
      e.preventDefault();
      callbacks.onSetEditMode(true, 'structure');
    } else if (action === 'delete') {
      e.preventDefault();
      targetWin.handleDeleteItem();
    } else if (action === 'cycle-prev') {
      e.preventDefault();
      callbacks.onCycle(',');
    } else if (action === 'cycle-next') {
      e.preventDefault();
      callbacks.onCycle('.');
    } else if (action === 'add-example-row') {
      e.preventDefault();
      targetWin.addExampleRow();
    } else if (action === 'remove-example-row') {
      e.preventDefault();
      targetWin.removeExampleRow(actionBtn);
    }
  });

  const form = targetDoc.getElementById('editForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      targetWin.handleSaveForm(e);
    });
  }

  targetDoc.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      targetWin.handleSaveForm();
      return;
    }

    const activeEl = targetDoc.activeElement as HTMLElement | null;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    if (isTyping) return;

    if (e.key.toLowerCase() === 'e') {
      e.preventDefault();
      const isFormOpen = targetDoc.getElementById('editForm') !== null;
      callbacks.onSetEditMode(!isFormOpen);
      return;
    }

    if (e.key === ',' || e.key === '.' || e.key === '[' || e.key === ']' || e.key.toLowerCase() === 'ư' || e.key.toLowerCase() === 'ơ') {
      e.preventDefault();
      callbacks.onCycle(e.key);
    } else if (e.code === 'KeyV' || e.code === 'KeyN' || e.code === 'KeyB' || e.key === 'Enter') {
      e.preventDefault();
      callbacks.onSeek(e.key === 'Enter' ? 'n' : e.key.toLowerCase());
    }
  });
};
