export interface ExampleItem {
  en: string;
  ipa?: string;
  vi: string;
}

export interface ExpansionVocabItem {
  word: string;
  ipa?: string;
  meaning: string;
  synonyms?: string;
  examples: ExampleItem[];
}

export interface ExpansionStructureItem {
  pattern: string;
  meaning: string;
  examples: ExampleItem[];
}

export interface SubtitleExpansion {
  paraphrase?: string;
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
  synonyms?: string;
  paraphrase?: string;
  examples: ExampleItem[];
}

export interface ExpansionPopupParams {
  subIndex: number;
  totalSubtitles: number;
  sub: Subtitle;
  activeItemIndex: number;
  isEditMode?: boolean;
  isJsonMode?: boolean;
  isSaving?: boolean;
  addType?: 'vocabulary' | 'structure' | null;
}

export interface ExpansionPopupCallbacks {
  onSetEditMode: (isEdit: boolean, addType?: 'vocabulary' | 'structure' | null, isJsonMode?: boolean) => void;
  onDeleteItem: (subIdx: number, activeItemIdx: number) => void;
  onSaveItem: (subIdx: number, payload: any) => void;
  onSaveFullExpansionJson: (subIdx: number, expansionData: SubtitleExpansion) => void;
  onCycle: (key: string) => void;
  onSeek: (key: string) => void;
  onSelectIndex?: (index: number) => void;
}

export const getFlattenedExpansionItems = (sub?: Subtitle): FlattenedExpansionItem[] => {
  if (!sub || !sub.expansion) return [];
  const items: FlattenedExpansionItem[] = [];
  const paraphrase = sub.expansion.paraphrase || '';

  if (Array.isArray(sub.expansion.vocabulary)) {
    sub.expansion.vocabulary.forEach((v, idx) => {
      if (v && (v.word || v.meaning)) {
        items.push({
          type: 'vocabulary',
          rawIndex: idx,
          word: v.word || '',
          ipa: v.ipa || '',
          meaning: v.meaning || '',
          synonyms: v.synonyms || '',
          paraphrase,
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
          paraphrase,
          examples: Array.isArray(s.examples) ? s.examples : [],
        });
      }
    });
  }

  return items;
};

export const generateGeminiPromptForSub = (sub: Subtitle): string => {
  const subText = (sub.text || '').trim();
  const subVi = (sub.vietnamese || '').trim();
  return `Bạn là chuyên gia giảng dạy tiếng Anh giao tiếp qua phim ảnh.
Hãy phân tích câu thoại sau đây và trả về DUY NHẤT một mã JSON chuẩn (không kèm lời dẫn, không bọc markdown \`\`\`json) theo đúng cấu trúc sau:

{
  "paraphrase": "Câu viết lại câu thoại trên bằng tiếng Anh cực kỳ đơn giản, tự nhiên, dễ hiểu",
  "vocabulary": [
    {
      "word": "Từ vựng / Cụm từ hay / Slang / Idiom (hoặc để trống mảng nếu không có)",
      "meaning": "Nghĩa tiếng Việt ngắn gọn, sát nghĩa ngữ cảnh (nếu từ này có nhiều nghĩa thông dụng trong giao tiếp đời sống thì ghi: 1. Nghĩa A; 2. Nghĩa B)",
      "synonyms": "Từ/cụm đồng nghĩa nếu có (tùy chọn)",
      "examples": [
        {
          "en": "Ví dụ tiếng Anh ngắn gọn, tự nhiên trong đời sống",
          "vi": "Dịch nghĩa tiếng Việt câu ví dụ"
        }
      ]
    }
  ],
  "structures": [
    {
      "pattern": "Công thức / Cấu trúc giao tiếp hay dùng (hoặc để trống mảng nếu không có)",
      "meaning": "Ý nghĩa và ngữ cảnh sử dụng trong giao tiếp",
      "examples": [
        {
          "en": "Ví dụ tiếng Anh đơn giản, thực tế",
          "vi": "Dịch nghĩa tiếng Việt câu ví dụ"
        }
      ]
    }
  ]
}

Nguyên tắc chọn lọc chuyên sâu cho người học giao tiếp:
1. CHẤT LƯỢNG HƠN SỐ LƯỢNG: Bỏ qua các từ/thán từ quá hiển nhiên mà ai cũng biết (như wow, oh, yes, no, okay, hi, hello, please...). Chỉ chọn lọc những từ vựng, cụm từ (collocations/phrasal verbs), thành ngữ (idioms) hoặc cách diễn đạt tự nhiên của người bản xứ.
2. TRÁNH TRÙNG LẶP: Không phân tích cùng một cụm từ ở cả mục vocabulary lẫn structures (nếu là cụm cố định hãy ưu tiên đưa vào vocabulary; chỉ đưa vào structures nếu nó là công thức ngữ pháp mở rộng rõ rệt).
3. ĐA NGHĨA & VÍ DỤ: Nếu từ/cụm từ có nhiều nghĩa phổ biến ngoài đời, hãy nêu rõ và cho mỗi nghĩa 1 câu ví dụ tương ứng thật ngắn gọn, dễ nhớ (KHÔNG gượng ép tạo thêm nghĩa thứ 2 nếu từ chỉ có 1 nghĩa chính).
4. ĐẦU RA: Chỉ trả về DUY NHẤT mã JSON hợp lệ, không kèm bất kỳ văn bản giải thích nào ngoài JSON.

Câu thoại cần phân tích:
"${subText}"
${subVi ? `(Dịch nghĩa: "${subVi}")` : ''}`;
};

export const sanitizeExpansionJson = (rawInput: any): SubtitleExpansion => {
  let parsed: any = rawInput;
  if (typeof rawInput === 'string') {
    let cleanStr = rawInput.trim();
    const tripleTicks = String.fromCharCode(96, 96, 96);
    if (cleanStr.indexOf(tripleTicks) === 0) {
      cleanStr = cleanStr.replace(new RegExp('^' + tripleTicks + '[a-zA-Z]*\\n?'), '').replace(new RegExp('\\n?' + tripleTicks + '$'), '').trim();
    }
    parsed = JSON.parse(cleanStr);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Dữ liệu JSON không hợp lệ: Phải là một Object {} chứa các trường paraphrase, vocabulary, structures.');
  }

  const result: SubtitleExpansion = {};

  // 1. Paraphrase
  if (typeof parsed.paraphrase === 'string' && parsed.paraphrase.trim()) {
    result.paraphrase = parsed.paraphrase.trim();
  }

  // 2. Vocabulary
  if (Array.isArray(parsed.vocabulary)) {
    const vocabList: ExpansionVocabItem[] = [];
    parsed.vocabulary.forEach((item: any) => {
      if (item && (item.word || item.meaning)) {
        const examples: ExampleItem[] = [];
        if (Array.isArray(item.examples)) {
          item.examples.forEach((ex: any) => {
            if (ex && (ex.en || ex.vi)) {
              examples.push({
                en: String(ex.en || '').trim(),
                vi: String(ex.vi || '').trim(),
                ...(ex.ipa ? { ipa: String(ex.ipa).trim() } : {})
              });
            }
          });
        }
        vocabList.push({
          word: String(item.word || '').trim(),
          meaning: String(item.meaning || '').trim(),
          ...(item.synonyms ? { synonyms: String(item.synonyms).trim() } : {}),
          ...(item.ipa ? { ipa: String(item.ipa).trim() } : {}),
          examples
        });
      }
    });
    if (vocabList.length > 0) {
      result.vocabulary = vocabList;
    }
  }

  // 3. Structures
  if (Array.isArray(parsed.structures)) {
    const structList: ExpansionStructureItem[] = [];
    parsed.structures.forEach((item: any) => {
      if (item && (item.pattern || item.meaning)) {
        const examples: ExampleItem[] = [];
        if (Array.isArray(item.examples)) {
          item.examples.forEach((ex: any) => {
            if (ex && (ex.en || ex.vi)) {
              examples.push({
                en: String(ex.en || '').trim(),
                vi: String(ex.vi || '').trim(),
                ...(ex.ipa ? { ipa: String(ex.ipa).trim() } : {})
              });
            }
          });
        }
        structList.push({
          pattern: String(item.pattern || '').trim(),
          meaning: String(item.meaning || '').trim(),
          examples
        });
      }
    });
    if (structList.length > 0) {
      result.structures = structList;
    }
  }

  return result;
};

const escapeHtml = (unsafe: string) => {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const generateMovieExpansionPopupStyles = () => `
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
  #popupRoot {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  .header {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 14px;
    flex-shrink: 0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }
  .badge-q {
    font-size: 11px;
    font-weight: 800;
    background: #f1f5f9;
    color: #475569;
    padding: 3px 8px;
    border-radius: 6px;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
  .badge-nav {
    font-size: 11px;
    font-weight: 700;
    background: #ede9fe;
    color: #6d28d9;
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }
  .btn-header {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s ease;
    white-space: nowrap;
    user-select: none;
  }
  .btn-header:hover {
    background: #e2e8f0;
    color: #0f172a;
    border-color: #94a3b8;
  }
  .btn-header-active {
    background: #4f46e5;
    color: #ffffff;
    border-color: #4f46e5;
  }
  .btn-header-active:hover {
    background: #4338ca;
    color: #ffffff;
  }
  .scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    position: relative;
  }
  .header-sentences-box {
    background: #fef2f2;
    border: 1px solid #fee2e2;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }
  .original-sub-text {
    font-size: 15px;
    font-weight: 700;
    color: #dc2626;
    line-height: 1.45;
  }
  .paraphrase-row {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed #fecaca;
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 13.5px;
    line-height: 1.4;
  }
  .paraphrase-badge {
    font-size: 10.5px;
    font-weight: 800;
    color: #15803d;
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    padding: 1px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }
  .paraphrase-val {
    font-weight: 700;
    color: #166534;
  }
  .card {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    position: relative;
  }
  .card-header-actions {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 6px;
    z-index: 2;
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
  .badge-json {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
  .main-word-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding-right: 76px;
    margin-bottom: 8px;
  }
  .main-word-text {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.3;
  }
  .pattern-badge {
    font-size: 16px;
    font-weight: 800;
    color: #92400e;
    background: #fef3c7;
    border: 1px solid #fde68a;
    padding: 4px 10px;
    border-radius: 6px;
    line-height: 1.3;
  }
  .meaning-inline {
    font-size: 14.5px;
    font-weight: 600;
    color: #334155;
    line-height: 1.4;
  }
  .synonyms-box {
    margin-top: 6px;
    font-size: 12.5px;
    color: #6d28d9;
    background: #f5f3ff;
    border: 1px solid #ede9fe;
    padding: 4px 8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
  }
  .synonyms-label {
    font-weight: 800;
    font-size: 11px;
  }
  .synonyms-text {
    font-weight: 600;
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
  /* Footer Navigation Tab Bar (Chân trang) */
  .footer-bar {
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
    padding: 6px 12px;
    flex-shrink: 0;
    box-shadow: 0 -2px 5px rgba(0,0,0,0.03);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    max-height: 72px;
    z-index: 10;
  }
  .footer-items-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    flex: 1;
    overflow-y: auto;
    max-height: 60px;
    padding: 2px 0;
  }
  .footer-nav-btns {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
  }
  .btn-footer-nav {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-size: 11px;
    font-weight: 700;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  .btn-footer-nav:hover {
    background: #e2e8f0;
    color: #0f172a;
    border-color: #94a3b8;
  }
  .footer-pill {
    cursor: pointer;
    font-size: 11.5px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 160px;
    transition: all 0.15s ease;
    user-select: none;
    line-height: 1.2;
  }
  .pill-dot {
    font-size: 8px;
    flex-shrink: 0;
  }
  .pill-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Từ / Cụm từ: màu đen */
  .pill-vocab {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #0f172a;
  }
  .pill-vocab:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }
  .pill-vocab.pill-active {
    background: #0f172a;
    border-color: #0f172a;
    color: #ffffff;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.3);
  }
  /* Cấu trúc: màu vàng */
  .pill-structure {
    background: #fef3c7;
    border: 1px solid #fde68a;
    color: #92400e;
  }
  .pill-structure:hover {
    background: #fde68a;
    border-color: #f59e0b;
  }
  .pill-structure.pill-active {
    background: #d97706;
    border-color: #b45309;
    color: #ffffff;
    box-shadow: 0 1px 4px rgba(217, 119, 6, 0.35);
  }
  .pill-structure.pill-active .pill-dot {
    color: #fef3c7;
  }
  .empty-state {
    text-align: center;
    padding: 30px 16px;
    color: #64748b;
  }
  .empty-icon {
    font-size: 32px;
    margin-bottom: 10px;
  }
  .empty-text {
    font-size: 15px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 6px;
  }
  .empty-sub {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 18px;
    line-height: 1.5;
  }
  .empty-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }
  /* JSON Mode Styles */
  .json-guidance {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
    font-size: 12px;
    color: #1e40af;
    line-height: 1.5;
  }
  .json-guidance ol {
    padding-left: 16px;
    margin-top: 4px;
  }
  .json-textarea {
    width: 100%;
    height: 230px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    outline: none;
    background: #ffffff;
    color: #0f172a;
    resize: vertical;
  }
  .json-textarea:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }
  .json-error {
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    margin-top: 8px;
    line-height: 1.4;
    display: none;
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
`;

export const renderMovieExpansionPopupContent = (params: ExpansionPopupParams): string => {
  const { subIndex, totalSubtitles, sub, activeItemIndex, isEditMode = false, isJsonMode = false, isSaving = false, addType = null } = params;
  const items = getFlattenedExpansionItems(sub);
  const totalItems = items.length;
  const currentItem: FlattenedExpansionItem | null =
    addType === 'vocabulary'
      ? { type: 'vocabulary', rawIndex: -1, word: '', ipa: '', meaning: '', synonyms: '', examples: [{ en: '', ipa: '', vi: '' }] }
      : addType === 'structure'
      ? { type: 'structure', rawIndex: -1, pattern: '', meaning: '', examples: [{ en: '', ipa: '', vi: '' }] }
      : items[activeItemIndex] || null;

  const geminiPromptText = generateGeminiPromptForSub(sub);
  const paraphraseText = sub.expansion?.paraphrase || '';

  return `
  <!-- Hidden prompt text for easy clipboard copy -->
  <textarea id="geminiPromptText" style="display: none;">${escapeHtml(geminiPromptText)}</textarea>

  <!-- Fixed Header -->
  <div class="header">
    <div class="header-top">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span class="badge-q">CÂU ${subIndex + 1} / ${totalSubtitles}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 5px;">
        <button type="button" class="btn-header" id="btnCopyPrompt" onclick="window.handleCopyPrompt && window.handleCopyPrompt()" title="Sao chép prompt câu này để gửi Gemini">📋 Copy Prompt</button>
        <button type="button" class="btn-header ${isJsonMode ? 'btn-header-active' : ''}" onclick="window.toggleJsonMode && window.toggleJsonMode()" title="Dán mã JSON trả về từ Gemini">📥 Dán JSON</button>
      </div>
    </div>
  </div>

  <!-- Main Scrollable Body -->
  <div class="scroll-content" id="scrollContent">
    ${(() => {
      // 1. JSON INGESTION MODE
      if (isJsonMode) {
        return `
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div class="card-badge badge-json" style="margin-bottom: 0;">
                📥 Nhập JSON từ Gemini
              </div>
            </div>

            <div class="json-guidance">
              <strong>Hướng dẫn 3 bước:</strong>
              <ol>
                <li>Bấm <strong>📋 Copy Prompt</strong> ở góc trên bên phải.</li>
                <li>Dán vào Gemini để sinh mã JSON chuẩn.</li>
                <li>Dùng <strong>Ctrl+V</strong> (hoặc Cmd+V) dán JSON vào ô dưới rồi bấm <strong>Lưu dữ liệu</strong>.</li>
              </ol>
            </div>

            <form id="jsonForm" onsubmit="event.preventDefault(); window.handleSaveRawJson && window.handleSaveRawJson();">
              <textarea id="rawJsonInput" class="json-textarea" placeholder='Dán mã JSON từ Gemini vào đây (Ví dụ: {"paraphrase": "...", "vocabulary": [...], "structures": [...]})'></textarea>
              <div id="jsonErrorMsg" class="json-error"></div>

              <div class="actions-bar" style="margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                <button type="button" class="btn btn-cancel" onclick="window.cancelJsonMode && window.cancelJsonMode()">Hủy</button>
                <button type="submit" class="btn btn-primary" id="btnSubmitJson">
                  ${isSaving ? 'Đang lưu...' : '💾 Lưu dữ liệu (Ctrl+S)'}
                </button>
              </div>
            </form>
          </div>
        `;
      }

      // 2. MANUAL EDIT MODE FORM
      if (isEditMode || addType) {
        const itemType = addType || currentItem?.type || 'vocabulary';
        const isVocab = itemType === 'vocabulary';
        const wordVal = isVocab ? (currentItem?.word || '') : '';
        const patternVal = !isVocab ? (currentItem?.pattern || '') : '';
        const ipaVal = currentItem?.ipa || '';
        const synonymsVal = currentItem?.synonyms || '';
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
                <button type="button" class="btn btn-edit" style="font-size: 11px; padding: 4px 8px;" onclick="window.triggerAddNew && window.triggerAddNew('vocabulary')">+ Thêm Từ vựng</button>
                <button type="button" class="btn btn-edit" style="font-size: 11px; padding: 4px 8px;" onclick="window.triggerAddNew && window.triggerAddNew('structure')">+ Thêm Cấu trúc</button>
              </div>
            </div>

            <form id="editForm" onsubmit="event.preventDefault(); window.handleSaveForm && window.handleSaveForm();">
              <input type="hidden" id="formItemType" value="${itemType}">
              <input type="hidden" id="formRawIndex" value="${currentItem?.rawIndex ?? -1}">

              <div class="form-group">
                <label class="form-label">Câu Diễn Giải Đơn Giản (Paraphrase)</label>
                <input type="text" id="fieldParaphrase" class="form-input" value="${escapeHtml(paraphraseText)}" placeholder="Ví dụ: It seems this task requires two people to complete.">
              </div>

              ${isVocab ? `
                <div class="form-group">
                  <label class="form-label">Từ vựng / Cụm từ</label>
                  <input type="text" id="fieldWord" class="form-input" required value="${escapeHtml(wordVal)}" placeholder="Ví dụ: two-person job">
                </div>
                <div class="form-group">
                  <label class="form-label">Từ / Cụm đồng nghĩa (Synonyms - tùy chọn)</label>
                  <input type="text" id="fieldSynonyms" class="form-input" value="${escapeHtml(synonymsVal)}" placeholder="Ví dụ: team effort, two-man job">
                </div>
                <div class="form-group">
                  <label class="form-label">Phiên âm IPA chuẩn US (tùy chọn)</label>
                  <input type="text" id="fieldIpa" class="form-input" value="${escapeHtml(ipaVal)}" placeholder="Ví dụ: /poʊtʃ/">
                </div>
              ` : `
                <div class="form-group">
                  <label class="form-label">Công thức / Cấu trúc</label>
                  <input type="text" id="fieldPattern" class="form-input" required value="${escapeHtml(patternVal)}" placeholder="Ví dụ: sounds like + Noun / Clause">
                </div>
              `}

              <div class="form-group">
                <label class="form-label">Giải thích nghĩa tiếng Việt</label>
                <textarea id="fieldMeaning" class="form-textarea" required placeholder="Giải thích nghĩa và ngữ cảnh sử dụng">${escapeHtml(meaningVal)}</textarea>
              </div>

              <div style="font-size: 11px; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase;">
                <span>Danh sách câu / cụm ví dụ</span>
              </div>

              <div id="examplesContainer" class="example-list" style="margin-top: 0;">
                ${examplesList.map((ex, exIdx) => `
                  <div class="ex-form-item" data-ex-index="${exIdx}">
                    <div class="ex-form-header">
                      <span class="ex-form-title">Ví dụ ${exIdx + 1}</span>
                      <button type="button" class="btn-remove-ex" onclick="window.removeExampleRow && window.removeExampleRow(this)">✕ Xóa</button>
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

              <button type="button" class="btn-add-ex" onclick="window.addExampleRow && window.addExampleRow()">+ Thêm ví dụ tiếp theo</button>

              <div class="actions-bar" style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <button type="button" class="btn btn-cancel" onclick="window.cancelEditMode && window.cancelEditMode()">Hủy</button>
                <button type="submit" class="btn btn-primary" id="btnSubmitSave">
                  ${isSaving ? 'Đang lưu...' : '💾 Lưu thay đổi (Ctrl+S)'}
                </button>
              </div>
            </form>
          </div>
        `;
      }

      // 3. EMPTY STATE
      if (!currentItem || totalItems === 0) {
        return `
          <div class="empty-state">
            <div class="empty-icon">💡</div>
            <div class="empty-text">Chưa có kiến thức mở rộng cho câu này</div>
            <div class="empty-sub">
              "${escapeHtml(sub.text || '')}"<br>
              <em style="color: #94a3b8; font-size: 12px;">${escapeHtml(sub.vietnamese || '')}</em>
            </div>
            <div class="empty-actions">
              <button type="button" class="btn btn-primary" onclick="window.handleCopyPrompt && window.handleCopyPrompt()">📋 Copy Prompt Gemini</button>
              <button type="button" class="btn btn-edit" onclick="window.toggleJsonMode && window.toggleJsonMode()">📥 Dán JSON từ Gemini</button>
              <button type="button" class="btn btn-edit" onclick="window.triggerAddNew && window.triggerAddNew('vocabulary')">+ Thêm thủ công</button>
            </div>
          </div>
        `;
      }

      // 4. VIEW MODE CARD
      const isVocab = currentItem.type === 'vocabulary';
      return `
        <div class="header-sentences-box">
          <div class="original-sub-text">"${escapeHtml(sub.text || '')}"</div>
          ${paraphraseText ? `
            <div class="paraphrase-row">
              <span class="paraphrase-badge">💡 Diễn giải:</span>
              <span class="paraphrase-val">"${escapeHtml(paraphraseText)}"</span>
            </div>
          ` : ''}
        </div>

        <div class="card">
          <div class="card-header-actions">
            <button class="btn btn-icon btn-edit" title="Sửa (E)" onclick="window.enterEditMode && window.enterEditMode()">✏️</button>
            <button class="btn btn-icon btn-delete" title="Xóa" onclick="window.handleDeleteItem && window.handleDeleteItem()">🗑️</button>
          </div>

          ${isVocab ? `
            <div class="main-word-row">
              <span class="main-word-text">${escapeHtml(currentItem.word || '')}</span>
              ${currentItem.meaning ? `
                <span class="meaning-inline">${escapeHtml(currentItem.meaning)}</span>
              ` : ''}
            </div>

            ${currentItem.synonyms ? `
              <div style="margin-top: 4px; margin-bottom: 6px;">
                <div class="synonyms-box">
                  <span class="synonyms-label">🔗 Đồng nghĩa:</span>
                  <span class="synonyms-text">${escapeHtml(currentItem.synonyms)}</span>
                </div>
              </div>
            ` : ''}
          ` : `
            <div class="main-word-row">
              <span class="pattern-badge">${escapeHtml(currentItem.pattern || '')}</span>
              ${currentItem.meaning ? `
                <span class="meaning-inline">${escapeHtml(currentItem.meaning)}</span>
              ` : ''}
            </div>
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
        </div>
      `;
    })()}
  </div>

  <!-- Footer Navigation Tab Bar (Chân trang 1-2 dòng) -->
  ${totalItems > 0 && !isEditMode && !isJsonMode && !addType ? `
    <div class="footer-bar">
      <div class="footer-items-list">
        ${items.map((it, idx) => {
          const isCurrent = idx === activeItemIndex;
          const isV = it.type === 'vocabulary';
          const label = isV ? (it.word || 'Từ vựng') : (it.pattern || 'Cấu trúc');
          return `
            <button 
              type="button" 
              class="footer-pill ${isV ? 'pill-vocab' : 'pill-structure'} ${isCurrent ? 'pill-active' : ''}" 
              onclick="window.selectItemIndex && window.selectItemIndex(${idx})"
              title="${escapeHtml(label)} - ${escapeHtml(it.meaning || '')}"
            >
              <span class="pill-dot">${isV ? '●' : '▲'}</span>
              <span class="pill-text">${escapeHtml(label)}</span>
            </button>
          `;
        }).join('')}
      </div>
      ${totalItems > 1 ? `
        <div class="footer-nav-btns">
          <button type="button" class="btn-footer-nav" title="Mục trước (,)" onclick="window.sendCycleMessage && window.sendCycleMessage(',')">◄</button>
          <button type="button" class="btn-footer-nav" title="Mục sau (.)" onclick="window.sendCycleMessage && window.sendCycleMessage('.')">►</button>
        </div>
      ` : ''}
    </div>
  ` : ''}

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
`;
};

export const generateMovieExpansionPopupHtml = (params: ExpansionPopupParams) => {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Kiến thức mở rộng - Câu ${params.subIndex + 1}/${params.totalSubtitles}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${generateMovieExpansionPopupStyles()}
  </style>
</head>
<body>
  <div id="popupRoot">
    ${renderMovieExpansionPopupContent(params)}
  </div>
</body>
</html>`;
};

/**
 * Ultra-fast, zero-freeze DOM updater for the Expansion Popup window.
 * Instead of rebuilding the document or thrashing stylesheets on every keypress/cycle,
 * it updates only the innerHTML of #popupRoot in under 1ms.
 */
export const updateMovieExpansionPopupDom = (
  targetDoc: Document,
  targetWin: any,
  params: ExpansionPopupParams,
  callbacks: ExpansionPopupCallbacks
) => {
  if (!targetDoc || !targetWin) return;

  const { subIndex, totalSubtitles, activeItemIndex } = params;

  // 1. Update Title
  targetDoc.title = `Kiến thức mở rộng - Câu ${subIndex + 1}/${totalSubtitles}`;

  // 2. Check if popupRoot exists; if not, initialize container and styles once
  let rootEl = targetDoc.getElementById('popupRoot');
  if (!rootEl) {
    if (!targetDoc.getElementById('popupExpansionStyles')) {
      const styleEl = targetDoc.createElement('style');
      styleEl.id = 'popupExpansionStyles';
      styleEl.textContent = generateMovieExpansionPopupStyles();
      targetDoc.head.appendChild(styleEl);
    }
    targetDoc.body.innerHTML = '<div id="popupRoot"></div>';
    rootEl = targetDoc.getElementById('popupRoot');

    // Attach listeners to targetWin exactly ONCE
    if (!targetWin.__hasExpansionGlobalListeners) {
      targetWin.__hasExpansionGlobalListeners = true;

      targetWin.addEventListener('click', (e: MouseEvent) => {
        const helpBtn = targetDoc.getElementById('helpBtn');
        const helpPopover = targetDoc.getElementById('helpPopover');
        if (!helpBtn || !helpPopover) return;

        if (e.target && (e.target === helpBtn || helpBtn.contains(e.target as Node))) {
          e.stopPropagation();
          helpPopover.classList.toggle('active');
        } else if (!helpPopover.contains(e.target as Node)) {
          helpPopover.classList.remove('active');
        }
      });

      targetWin.addEventListener('keydown', (e: KeyboardEvent) => {
        // Ctrl+S / Cmd+S in form to trigger save
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
          e.preventDefault();
          if (targetDoc.getElementById('jsonForm')) {
            if (typeof targetWin.handleSaveRawJson === 'function') targetWin.handleSaveRawJson();
          } else if (targetDoc.getElementById('editForm')) {
            if (typeof targetWin.handleSaveForm === 'function') targetWin.handleSaveForm();
          }
          return;
        }

        // Check if user is typing in form inputs
        const activeEl = targetDoc.activeElement;
        const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (isTyping) return;

        // E key -> Edit toggle
        if (e.key.toLowerCase() === 'e') {
          e.preventDefault();
          const isFormOpen = targetDoc.getElementById('editForm') !== null || targetDoc.getElementById('jsonForm') !== null;
          if (isFormOpen) {
            if (typeof targetWin.cancelEditMode === 'function') targetWin.cancelEditMode();
          } else {
            if (typeof targetWin.enterEditMode === 'function') targetWin.enterEditMode();
          }
          return;
        }

        // Navigation hotkeys
        if (e.key === ',' || e.key === '.' || e.key === '[' || e.key === ']' || e.key.toLowerCase() === 'ư' || e.key.toLowerCase() === 'ơ') {
          e.preventDefault();
          if (typeof targetWin.sendCycleMessage === 'function') {
            targetWin.sendCycleMessage(e.key);
          }
        } else if (e.code === 'KeyV' || e.code === 'KeyN' || e.code === 'KeyB' || e.key === 'Enter') {
          e.preventDefault();
          if (typeof targetWin.sendSeekMessage === 'function') {
            targetWin.sendSeekMessage(e.key === 'Enter' ? 'n' : e.key.toLowerCase());
          }
        }
      });
    }
  }

  // 3. Render content directly into popupRoot (instant < 1ms update)
  if (rootEl) {
    rootEl.innerHTML = renderMovieExpansionPopupContent(params);
  }

  // 4. Update function references on targetWin for button clicks
  targetWin.enterEditMode = () => callbacks.onSetEditMode(true, null, false);
  targetWin.cancelEditMode = () => callbacks.onSetEditMode(false, null, false);
  targetWin.toggleJsonMode = () => {
    const isJsonCurrent = targetDoc.getElementById('jsonForm') !== null;
    callbacks.onSetEditMode(false, null, !isJsonCurrent);
  };
  targetWin.cancelJsonMode = () => callbacks.onSetEditMode(false, null, false);
  targetWin.triggerAddNew = (type: 'vocabulary' | 'structure') => callbacks.onSetEditMode(true, type, false);
  targetWin.sendCycleMessage = (key: string) => callbacks.onCycle(key);
  targetWin.sendSeekMessage = (key: string) => callbacks.onSeek(key);
  targetWin.selectItemIndex = (idx: number) => {
    if (typeof callbacks.onSelectIndex === 'function') {
      callbacks.onSelectIndex(idx);
    } else {
      callbacks.onSetEditMode(false, null, false);
    }
  };

  targetWin.handleDeleteItem = () => {
    const isConfirmed = typeof targetWin.confirm === 'function'
      ? targetWin.confirm('Bạn có chắc muốn xóa mục kiến thức này khỏi câu thoại?')
      : (typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm('Bạn có chắc muốn xóa mục kiến thức này khỏi câu thoại?') : true);
    if (isConfirmed) {
      callbacks.onDeleteItem(subIndex, activeItemIndex);
    }
  };

  targetWin.handleCopyPrompt = () => {
    const promptEl = targetDoc.getElementById('geminiPromptText') as HTMLTextAreaElement | null;
    const textToCopy = promptEl ? promptEl.value : '';
    if (!textToCopy) return;

    const showFeedback = () => {
      const btn = targetDoc.getElementById('btnCopyPrompt');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Đã copy!';
        btn.style.borderColor = '#10b981';
        btn.style.color = '#059669';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
      }
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(textToCopy).then(showFeedback).catch(() => {
        fallbackCopyInDoc(targetDoc, textToCopy, showFeedback);
      });
    } else {
      fallbackCopyInDoc(targetDoc, textToCopy, showFeedback);
    }
  };

  targetWin.addExampleRow = () => {
    const container = targetDoc.getElementById('examplesContainer');
    if (!container) return;
    const count = container.querySelectorAll('.ex-form-item').length;
    const itemDiv = targetDoc.createElement('div');
    itemDiv.className = 'ex-form-item';
    itemDiv.dataset.exIndex = String(count);
    itemDiv.innerHTML = '<div class="ex-form-header">' +
      '<span class="ex-form-title">Ví dụ ' + (count + 1) + '</span>' +
      '<button type="button" class="btn-remove-ex" onclick="window.removeExampleRow && window.removeExampleRow(this)">✕ Xóa</button>' +
      '</div>' +
      '<div style="margin-bottom: 6px;">' +
      '<input type="text" class="form-input ex-input-en" placeholder="Câu / cụm tiếng Anh ngắn gọn">' +
      '</div>' +
      '<div>' +
      '<input type="text" class="form-input ex-input-vi" placeholder="Nghĩa tiếng Việt">' +
      '</div>';
    container.appendChild(itemDiv);
  };

  targetWin.removeExampleRow = (btn: HTMLElement) => {
    const item = btn.closest('.ex-form-item');
    if (item) item.remove();
  };

  targetWin.handleSaveRawJson = () => {
    const rawInput = (targetDoc.getElementById('rawJsonInput') as HTMLTextAreaElement)?.value?.trim() || '';
    const errorDiv = targetDoc.getElementById('jsonErrorMsg');

    if (!rawInput) {
      if (errorDiv) {
        errorDiv.textContent = 'Vui lòng dán mã JSON từ Gemini vào ô trên!';
        errorDiv.style.display = 'block';
      }
      return;
    }

    try {
      const sanitized = sanitizeExpansionJson(rawInput);
      if (errorDiv) errorDiv.style.display = 'none';
      callbacks.onSaveFullExpansionJson(subIndex, sanitized);
    } catch (err: any) {
      if (errorDiv) {
        errorDiv.textContent = 'Lỗi cú pháp JSON: ' + (err.message || 'Vui lòng kiểm tra lại');
        errorDiv.style.display = 'block';
      }
    }
  };

  targetWin.handleSaveForm = () => {
    const formItemType = (targetDoc.getElementById('formItemType') as HTMLInputElement)?.value || 'vocabulary';
    const formRawIndex = parseInt((targetDoc.getElementById('formRawIndex') as HTMLInputElement)?.value || '-1', 10);
    const meaningVal = (targetDoc.getElementById('fieldMeaning') as HTMLTextAreaElement)?.value?.trim() || '';
    const paraphraseVal = (targetDoc.getElementById('fieldParaphrase') as HTMLInputElement)?.value?.trim() || '';

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
      const synonymsVal = (targetDoc.getElementById('fieldSynonyms') as HTMLInputElement)?.value?.trim() || '';
      updatedPayload = {
        type: 'vocabulary',
        rawIndex: formRawIndex,
        paraphrase: paraphraseVal,
        data: { word: wordVal, ipa: ipaVal, synonyms: synonymsVal, meaning: meaningVal, examples }
      };
    } else {
      const patternVal = (targetDoc.getElementById('fieldPattern') as HTMLInputElement)?.value?.trim() || '';
      updatedPayload = {
        type: 'structure',
        rawIndex: formRawIndex,
        paraphrase: paraphraseVal,
        data: { pattern: patternVal, meaning: meaningVal, examples }
      };
    }

    callbacks.onSaveItem(subIndex, updatedPayload);
  };
};

function fallbackCopyInDoc(targetDoc: Document, text: string, cb?: () => void) {
  const ta = targetDoc.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.opacity = '0';
  targetDoc.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    targetDoc.execCommand('copy');
    if (cb) cb();
  } catch (e) {}
  targetDoc.body.removeChild(ta);
}
