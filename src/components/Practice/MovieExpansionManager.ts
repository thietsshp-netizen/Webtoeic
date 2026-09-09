export interface ExampleItem {
  en: string;
  ipa?: string;
  vi: string;
}

export interface ParaphraseItem {
  method?: string;
  text: string;
}

export interface SemanticFieldItem {
  expression: string;
  type?: 'synonym' | 'related phrase' | 'slang' | 'idiom' | string;
  meaning: string;
  example_en?: string;
  example_vi?: string;
}

export interface ExpansionVocabItem {
  word: string;
  ipa?: string;
  part_of_speech?: string;
  register?: string;
  meaning: string;
  synonyms?: string;
  antonyms?: string;
  examples: ExampleItem[];
  semantic_field_expansion?: SemanticFieldItem[];
}

export interface ExpansionStructureItem {
  pattern: string;
  meaning: string;
  examples: ExampleItem[];
}

export interface SubtitleExpansion {
  paraphrase?: string; // Tương thích dữ liệu cũ
  paraphrases?: ParaphraseItem[]; // Dữ liệu mới đa phương pháp
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
  part_of_speech?: string;
  register?: string;
  meaning: string;
  synonyms?: string;
  antonyms?: string;
  paraphrase?: string;
  paraphrases?: ParaphraseItem[];
  examples: ExampleItem[];
  semantic_field_expansion?: SemanticFieldItem[];
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
  const paraphrases = Array.isArray(sub.expansion.paraphrases) ? sub.expansion.paraphrases : [];

  if (Array.isArray(sub.expansion.vocabulary)) {
    sub.expansion.vocabulary.forEach((v: any, idx) => {
      if (v && (v.word || v.meaning || v.meaning_vi)) {
        let synVal = '';
        if (Array.isArray(v.synonyms)) {
          synVal = v.synonyms.map((s: any) => String(s).trim()).filter(Boolean).join(', ');
        } else if (v.synonyms) {
          synVal = String(v.synonyms).trim();
        }

        let antVal = '';
        if (Array.isArray(v.antonyms)) {
          antVal = v.antonyms.map((s: any) => String(s).trim()).filter(Boolean).join(', ');
        } else if (v.antonyms) {
          antVal = String(v.antonyms).trim();
        }

        const semanticFields: SemanticFieldItem[] = [];
        if (Array.isArray(v.semantic_field_expansion)) {
          v.semantic_field_expansion.forEach((sf: any) => {
            if (sf && (sf.expression || sf.meaning)) {
              semanticFields.push({
                expression: String(sf.expression || '').trim(),
                type: String(sf.type || 'related phrase').trim(),
                meaning: String(sf.meaning || '').trim(),
                example_en: String(sf.example_en || sf.example || '').trim(),
                example_vi: String(sf.example_vi || '').trim()
              });
            }
          });
        }

        items.push({
          type: 'vocabulary',
          rawIndex: idx,
          word: String(v.word || '').trim(),
          ipa: String(v.ipa || v.ipa_us || v.ipa_uk || '').trim(),
          part_of_speech: String(v.part_of_speech || v.pos || '').trim(),
          register: String(v.register || '').trim(),
          meaning: String(v.meaning || v.meaning_vi || '').trim(),
          synonyms: synVal,
          antonyms: antVal,
          paraphrase,
          paraphrases,
          examples: Array.isArray(v.examples) ? v.examples : [],
          semantic_field_expansion: semanticFields.length > 0 ? semanticFields : undefined
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
          paraphrases,
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
  return `# VAI TRÒ
Bạn là chuyên gia ngôn ngữ Anh-Mỹ (American English) và giảng dạy tiếng Anh giao tiếp thực tế cho người Việt, chuyên sâu về:
* Spoken English & Pragmatics
* Collocations, Phrasal Verbs, Slang & Idioms
* Conversational Patterns & Semantic Fields
* Natural American English Re-expression

Mục tiêu: Giúp người học nói và hiểu tiếng Anh tự nhiên như người Mỹ bản xứ trong giao tiếp đời thường, phim ảnh và TV series.

Ưu tiên tuyệt đối: Naturalness > Literalness > Lexical sophistication.
Không biến câu thoại tự nhiên thành văn viết học thuật hay cố tình nhồi nhét từ vựng gượng gạo.

---

# NHIỆM VỤ
Phân tích câu thoại được cung cấp và trả về DUY NHẤT một JSON hợp lệ theo đúng schema ở cuối prompt.
* Không viết lời dẫn hay kết luận.
* Không giải thích bất kỳ điều gì ngoài JSON.
* Không bọc JSON trong Markdown code block (\`\`\`json ... \`\`\`) nếu có thể, chỉ trả về chuỗi JSON thuần túy.
* Tuyệt đối không thêm trường (field) nào nằm ngoài schema.

---

# NGUYÊN TẮC 1 — PARAPHRASE ĐA PHƯƠNG PHÁP (paraphrases)
Cung cấp từ 2 đến 3 cách diễn đạt lại (Natural Re-expressions) khác nhau cho câu gốc, phản ánh các góc nhìn ngôn ngữ thực tế của người Mỹ bản xứ.

## 1.1. Các phương pháp paraphrase gợi ý áp dụng:
* Lexical / Phrasal Re-expression: Thay thế bằng cụm từ tự nhiên, phrasal verb hoặc collocation tương đương.
* Structural Shift: Thay đổi cấu trúc câu (chuyển đổi chủ ngữ, dùng mệnh đề danh ngữ, đảo trật tự ý, v.v.) nhưng giữ nguyên ngữ nghĩa.
* Conversational Idiomatic Chunk: Sử dụng idiom, tiếng lóng nhẹ (mild slang), hoặc câu cửa miệng phổ biến trong đời sống.

## 1.2. Yêu cầu cho từng câu paraphrase:
* Đảm bảo Naturalness Test: Giữ nguyên sắc thái, cảm xúc, mức độ trang trọng (register) của ngữ cảnh phim.
* Sử dụng thẻ <mark>...</mark> để đánh dấu chính xác phần từ ngữ/cấu trúc được thay đổi hoặc viết lại so với câu gốc.

---

# NGUYÊN TẮC 2 — TỪ VỰNG TRỌNG TÂM & MỞ RỘNG TRƯỜNG NGHĨA (vocabulary)

## 2.1. Tiêu chí chọn từ vựng mục tiêu (word):
* Nguồn: Ưu tiên từ CÂU GỐC, sau đó đến các CÂU PARAPHRASE có giá trị học tập cao.
* Reusability Test: Chỉ chọn từ/cụm từ/idiom có tính ứng dụng cao, giúp người học tái sử dụng để diễn đạt trong nhiều ngữ cảnh đời thường khác nhau.
* Không chọn từ quá sơ cấp/hiển nhiên (I, you, go, have, do, be...). Nếu câu không có từ nào đáng chú ý, trả về "vocabulary": [].

## 2.2. Thông tin từ vựng:
* ipa: Phiên âm General American (GA) đặt trong /.../.
* part_of_speech: Chỉ chọn 1 trong: idiom | phrasal verb | phrase | verb | noun | adjective | adverb | collocation.
* register: Chỉ chọn 1 trong: casual | neutral | informal | slang | idiomatic | formal.
* meaning: Giải nghĩa tiếng Việt ngắn gọn, sát đúng ngữ cảnh câu.
* synonyms / antonyms: Cung cấp từ/cụm tương đương tự nhiên hoặc để "" nếu không có.
* examples: Tối thiểu 1-2 ví dụ thực tế. BẮT BUỘC dùng thẻ <mark>...</mark> bao quanh từ/cụm từ mục tiêu trong câu tiếng Anh (en).

## 2.3. Mở rộng trường nghĩa (semantic_field_expansion):
* Với mỗi mục từ vựng, cung cấp từ 2 đến 3 cách nói/từ vựng liên quan trong cùng trường nghĩa/chủ đề để làm giàu vốn diễn đạt cho người học.
* type: Chọn đúng 1 trong: synonym | related phrase | slang | idiom.
* example_en: Ví dụ BẮT BUỘC NGẮN GỌN (dưới 10 từ), súc tích, phản ánh đúng văn nói và BẮT BUỘC có thẻ <mark>...</mark> bọc quanh từ mở rộng.
* example_vi: Dịch nghĩa tiếng Việt cho ví dụ ngắn.

---

# NGUYÊN TẮC 3 — CẤU TRÚC KHUNG CÂU GIAO TIẾP (structures)
* Nguồn: CHỈ trích xuất cấu trúc từ CÂU GỐC.
* Conversational Frame: Phải là mẫu câu / sentence pattern có thể lắp ghép thành phần khác để tạo câu mới (Ví dụ: "It's not like + clause", "What if we + V...", "There's no point in + V-ing").
* Không lấy ngữ pháp ngữ văn cơ bản (S + V + O, thì thì hiện tại...). Nếu không có cấu trúc nào đặc sắc, trả về "structures": [].
* Ví dụ: BẮT BUỘC dùng thẻ <mark>...</mark> bọc quanh phần cấu trúc áp dụng trong câu ví dụ (en).

---

# SCHEMA JSON BẮT BUỘC
{
  "paraphrases": [
    {
      "method": "Tên phương pháp (VD: Lexical / Phrasal Re-expression | Structural Shift | Conversational Idiom...)",
      "text": "Câu diễn đạt lại tự nhiên có chứa <mark>...</mark> ở phần thay đổi"
    }
  ],
  "vocabulary": [
    {
      "word": "Từ / cụm từ / idiom mục tiêu",
      "ipa": "/.../",
      "part_of_speech": "idiom | phrasal verb | phrase | verb | noun | adjective | adverb | collocation",
      "register": "casual | neutral | informal | slang | idiomatic | formal",
      "meaning": "Nghĩa tiếng Việt ngắn gọn, sát ngữ cảnh",
      "synonyms": "Từ/cụm đồng nghĩa thay thế trực tiếp được hoặc \\"\\"",
      "antonyms": "Từ/cụm trái nghĩa hoặc \\"\\"",
      "examples": [
        {
          "en": "Câu ví dụ tiếng Anh có dùng <mark>...</mark> bọc từ/cụm từ mục tiêu",
          "vi": "Dịch nghĩa tiếng Việt"
        }
      ],
      "semantic_field_expansion": [
        {
          "expression": "Từ/cụm từ/slang/idiom mở rộng cùng trường nghĩa",
          "type": "synonym | related phrase | slang | idiom",
          "meaning": "Nghĩa tiếng Việt",
          "example_en": "Ví dụ cực ngắn dưới 10 từ có <mark>...</mark>",
          "example_vi": "Dịch nghĩa tiếng Việt"
        }
      ]
    }
  ],
  "structures": [
    {
      "pattern": "Sentence frame/pattern giao tiếp chỉ lấy từ câu gốc",
      "meaning": "Cách sử dụng thực tế trong câu",
      "examples": [
        {
          "en": "Ví dụ tiếng Anh có <mark>...</mark> bọc quanh khung cấu trúc",
          "vi": "Dịch nghĩa tiếng Việt"
        }
      ]
    }
  ]
}

---

# DỮ LIỆU ĐẦU VÀO
Câu thoại: "${subText}"
${subVi ? `Bản dịch tham khảo: "${subVi}"` : ''}`;
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
    throw new Error('Dữ liệu JSON không hợp lệ: Phải là một Object {} chứa các trường paraphrases, vocabulary, structures.');
  }

  const result: SubtitleExpansion = {};

  // 1. Paraphrases (hỗ trợ mảng mới hoặc chuỗi đơn cũ)
  if (Array.isArray(parsed.paraphrases)) {
    const pList: ParaphraseItem[] = [];
    parsed.paraphrases.forEach((p: any) => {
      if (typeof p === 'string' && p.trim()) {
        pList.push({ text: p.trim() });
      } else if (p && typeof p === 'object' && p.text) {
        pList.push({
          method: p.method ? String(p.method).trim() : undefined,
          text: String(p.text).trim()
        });
      }
    });
    if (pList.length > 0) {
      result.paraphrases = pList;
    }
  } else if (typeof parsed.paraphrase === 'string' && parsed.paraphrase.trim()) {
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
        const meaningText = String(item.meaning || item.meaning_vi || '').trim();
        let synText = '';
        if (Array.isArray(item.synonyms)) {
          synText = item.synonyms.map((s: any) => String(s).trim()).filter(Boolean).join(', ');
        } else if (item.synonyms) {
          synText = String(item.synonyms).trim();
        }

        let antText = '';
        if (Array.isArray(item.antonyms)) {
          antText = item.antonyms.map((s: any) => String(s).trim()).filter(Boolean).join(', ');
        } else if (item.antonyms) {
          antText = String(item.antonyms).trim();
        }

        const semanticFields: SemanticFieldItem[] = [];
        if (Array.isArray(item.semantic_field_expansion)) {
          item.semantic_field_expansion.forEach((sf: any) => {
            if (sf && (sf.expression || sf.meaning)) {
              semanticFields.push({
                expression: String(sf.expression || '').trim(),
                type: String(sf.type || 'related phrase').trim(),
                meaning: String(sf.meaning || '').trim(),
                example_en: String(sf.example_en || sf.example || '').trim(),
                example_vi: String(sf.example_vi || '').trim()
              });
            }
          });
        }

        vocabList.push({
          word: String(item.word || '').trim(),
          meaning: meaningText,
          ...(item.ipa ? { ipa: String(item.ipa).trim() } : {}),
          ...(item.part_of_speech || item.pos ? { part_of_speech: String(item.part_of_speech || item.pos).trim() } : {}),
          ...(item.register ? { register: String(item.register).trim() } : {}),
          ...(synText ? { synonyms: synText } : {}),
          ...(antText ? { antonyms: antText } : {}),
          examples,
          ...(semanticFields.length > 0 ? { semantic_field_expansion: semanticFields } : {})
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
      const patternText = String(item.pattern || item.structure || '').trim();
      const meaningText = String(item.meaning || item.meaning_vi || item.explanation || item.explanation_vi || '').trim();
      if (patternText || meaningText) {
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
          pattern: patternText,
          meaning: meaningText,
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

export const renderMarkupText = (text: string): string => {
  if (!text) return '';
  // Chuyển đổi cả **bold** thành <mark> nếu có markdown bold
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<mark>$1</mark>');
  if (!processed.includes('<mark>') && !processed.includes('</mark>')) {
    return escapeHtml(processed);
  }
  const parts = processed.split(/(<\/?mark>)/g);
  return parts.map(part => {
    if (part === '<mark>') return '<mark class="ex-mark">';
    if (part === '</mark>') return '</mark>';
    return escapeHtml(part);
  }).join('');
};

export const renderParaphraseHtml = (paraStr: string): string => {
  if (!paraStr) return '';
  const parts = paraStr.split(/(<\/?mark>)/g);
  return parts.map(part => {
    if (part === '<mark>') return '<span class="ph-diff" title="Cụm diễn giải thay thế">';
    if (part === '</mark>') return '</span>';
    return escapeHtml(part);
  }).join('');
};

export const renderSentenceDiffPair = (
  origStr: string,
  paraStr: string
): { origHtml: string; paraHtml: string } => {
  return {
    origHtml: escapeHtml(origStr || ''),
    paraHtml: renderParaphraseHtml(paraStr || '')
  };
};

export const renderDiffHighlight = (origStr: string, paraStr: string): string => {
  return renderParaphraseHtml(paraStr || '');
};

export const getShortMethodLabel = (method?: string, index?: number): string => {
  if (!method || !method.trim()) {
    return index !== undefined ? `Cách ${index + 1}` : 'Paraphrase';
  }
  const m = method.trim();
  const lower = m.toLowerCase();
  if (lower.includes('idiom') || lower.includes('chunk') || lower.includes('slang') || lower.includes('conversational')) return 'Idiomatic';
  if (lower.includes('lexic') || lower.includes('synonym') || lower.includes('re-expression')) return 'Lexical';
  if (lower.includes('structur') || lower.includes('shift') || lower.includes('clause') || lower.includes('grammar')) return 'Structural';
  if (lower.includes('collocat')) return 'Collocation';
  if (lower.includes('phrasal') || lower.includes('phrase')) return 'Phrasal';
  if (m.length <= 14) return m;
  return m.split('/')[0].split('-')[0].trim();
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
  .btn-header-ai {
    background: #4f46e5;
    color: #ffffff;
    border-color: #4f46e5;
  }
  .btn-header-ai:hover {
    background: #4338ca;
    color: #ffffff;
    border-color: #4338ca;
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
    font-size: 15.5px;
    font-weight: 700;
    color: #dc2626;
    line-height: 1.45;
    text-align: center;
  }
  .original-sub-vi {
    font-size: 13px;
    font-style: italic;
    color: #64748b;
    margin-top: 4px;
    line-height: 1.4;
    text-align: center;
  }
  .paraphrase-table {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed #fecaca;
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
  }
  .paraphrase-line {
    font-size: 13.5px;
    line-height: 1.5;
    color: #1e293b;
    display: block;
  }
  .paraphrase-badge {
    font-size: 10px;
    font-weight: 800;
    color: #047857;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    padding: 1px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    display: inline-block;
    vertical-align: 1px;
    margin-right: 6px;
  }
  .paraphrase-val {
    font-size: 13.5px;
    font-weight: 600;
    color: #1e293b;
    display: inline;
  }
  .orig-diff {
    color: #ea580c;
    font-weight: 800;
    display: inline;
  }
  .ph-diff {
    color: #e11d48;
    font-weight: 800;
    display: inline;
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
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 10px;
    padding-right: 76px;
    margin-bottom: 6px;
  }
  .main-word-text {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.3;
  }
  .word-ipa {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13.5px;
    font-weight: 600;
    color: #6366f1;
    background: #eef2ff;
    padding: 2px 7px;
    border-radius: 5px;
    border: 1px solid #e0e7ff;
  }
  .badge-pos {
    font-size: 11px;
    font-weight: 700;
    color: #0369a1;
    background: #e0f2fe;
    border: 1px solid #bae6fd;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: lowercase;
  }
  .badge-register {
    font-size: 11px;
    font-weight: 700;
    color: #7c3aed;
    background: #f3e8ff;
    border: 1px solid #e9d5ff;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: lowercase;
  }
  .meaning-block {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
    line-height: 1.5;
    margin-top: 4px;
    margin-bottom: 6px;
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
  .syn-ant-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
    margin-bottom: 6px;
  }
  .synonyms-box {
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
  .antonyms-box {
    font-size: 12.5px;
    color: #be123c;
    background: #fff1f2;
    border: 1px solid #ffe4e6;
    padding: 4px 8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
  }
  .antonyms-label {
    font-weight: 800;
    font-size: 11px;
  }
  .antonyms-text {
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
  .ex-mark, mark.ex-mark, mark {
    background: transparent;
    color: #e11d48;
    font-weight: 800;
    padding: 0;
    border: none;
    border-radius: 0;
    display: inline;
  }
  .ex-vi {
    font-size: 14px;
    color: #047857;
    font-weight: 500;
    margin-top: 4px;
    line-height: 1.45;
    padding-left: 14px;
  }
  /* Semantic Field Expansion */
  .semantic-field-box {
    margin-top: 14px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .semantic-field-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    color: #166534;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .semantic-items-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .semantic-item {
    background: #ffffff;
    border: 1px solid #dcfce7;
    border-radius: 6px;
    padding: 8px 10px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }
  .semantic-item-top {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 13.5px;
  }
  .semantic-type-tag {
    font-size: 10px;
    font-weight: 800;
    padding: 1px 5px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }
  .tag-slang {
    background: #f3e8ff;
    color: #7e22ce;
    border: 1px solid #e9d5ff;
  }
  .tag-idiom {
    background: #ffedd5;
    color: #c2410c;
    border: 1px solid #fed7aa;
  }
  .tag-synonym {
    background: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
  }
  .tag-related {
    background: #ccfbf1;
    color: #0f766e;
    border: 1px solid #99f6e4;
  }
  .semantic-expr {
    font-weight: 800;
    color: #0f172a;
  }
  .semantic-meaning {
    color: #475569;
    font-weight: 500;
  }
  .semantic-example {
    margin-top: 4px;
    padding-left: 6px;
    border-left: 2px solid #86efac;
  }
  .semantic-ex-en {
    font-size: 12.5px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.4;
  }
  .semantic-ex-vi {
    font-size: 12px;
    color: #15803d;
    font-style: italic;
    margin-top: 1px;
    line-height: 1.35;
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
  .btn-ai {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
  }
  .btn-ai:hover {
    background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
    box-shadow: 0 4px 6px rgba(79, 70, 229, 0.35);
  }
  .btn:disabled, .btn-header:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
  .btn-cancel {
    background: #e2e8f0;
    color: #475569;
  }
  /* Footer Navigation Tab Bar (Chân trang) */
  .footer-bar {
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
    padding: 6px 48px 6px 12px;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    text-align: center;
  }
  .empty-sentence-box {
    background: #fef2f2;
    border: 1px solid #fee2e2;
    border-radius: 14px;
    padding: 20px 24px;
    width: 100%;
    max-width: 680px;
    margin-bottom: 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  .empty-sub-en {
    font-size: 19px;
    font-weight: 800;
    color: #dc2626;
    line-height: 1.5;
    word-break: break-word;
  }
  .empty-sub-vi {
    font-size: 15px;
    font-weight: 500;
    color: #64748b;
    margin-top: 8px;
    line-height: 1.5;
    font-style: italic;
    word-break: break-word;
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
  /* Semantic Field Form Styles */
  .sf-form-item {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 8px;
    position: relative;
  }
  .sf-form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .sf-form-title {
    font-size: 11px;
    font-weight: 800;
    color: #166534;
  }
  .btn-add-sf {
    width: 100%;
    background: #ecfdf5;
    border: 1px dashed #6ee7b7;
    color: #047857;
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 700;
    font-size: 12px;
    margin-bottom: 12px;
    transition: all 0.15s ease;
  }
  .btn-add-sf:hover {
    background: #d1fae5;
    color: #065f46;
  }
  .form-sublabel {
    display: block;
    font-size: 10.5px;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 3px;
  }
  .para-form-item {
    background: #fff1f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 6px 8px;
    margin-bottom: 6px;
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
        <button type="button" class="btn-header btn-header-ai" id="btnSendGemini" onclick="window.handleSendGemini && window.handleSendGemini()" title="Gửi trực tiếp câu này sang Gemini AI để tự động tạo và lưu kiến thức mở rộng">⚡ Gửi Gemini</button>
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
        const posVal = currentItem?.part_of_speech || '';
        const registerVal = currentItem?.register || '';
        const synonymsVal = currentItem?.synonyms || '';
        const antonymsVal = currentItem?.antonyms || '';
        const meaningVal = currentItem?.meaning || '';
        const examplesList = currentItem?.examples && currentItem.examples.length > 0
          ? currentItem.examples
          : [{ en: '', ipa: '', vi: '' }];

        const semanticFieldList = isVocab && Array.isArray(currentItem?.semantic_field_expansion)
          ? currentItem.semantic_field_expansion
          : [];

        const paraphraseList: ParaphraseItem[] =
          Array.isArray(sub.expansion?.paraphrases) && sub.expansion.paraphrases.length > 0
            ? sub.expansion.paraphrases
            : sub.expansion?.paraphrase
            ? [{ text: sub.expansion.paraphrase }]
            : [];

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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label class="form-label" style="margin-bottom: 0;">Câu Diễn Giải Đa Phương Pháp (Paraphrase)</label>
                </div>
                <div id="paraphrasesContainer" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px;">
                  ${(paraphraseList.length > 0 ? paraphraseList : [{ method: '', text: paraphraseText }]).map((p, pIdx) => `
                    <div class="para-form-item" data-para-index="${pIdx}" style="display: flex; gap: 6px; align-items: center;">
                      <input type="text" class="form-input para-input-method" style="width: 140px; flex-shrink: 0;" placeholder="Phương pháp (VD: Idiomatic)" value="${escapeHtml(p.method || '')}">
                      <input type="text" class="form-input para-input-text" style="flex: 1;" placeholder="Câu diễn giải tiếng Anh" value="${escapeHtml(p.text || '')}">
                      <button type="button" class="btn-remove-ex" onclick="window.removeParaphraseRow && window.removeParaphraseRow(this)">✕</button>
                    </div>
                  `).join('')}
                </div>
                <button type="button" class="btn-add-ex" style="margin-bottom: 6px; padding: 4px;" onclick="window.addParaphraseRow && window.addParaphraseRow()">+ Thêm cách diễn giải (Paraphrase)</button>
              </div>

              ${isVocab ? `
                <div class="form-group">
                  <label class="form-label">Từ vựng / Cụm từ</label>
                  <input type="text" id="fieldWord" class="form-input" required value="${escapeHtml(wordVal)}" placeholder="Ví dụ: two-person job">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                  <div class="form-group">
                    <label class="form-label">Phiên âm IPA</label>
                    <input type="text" id="fieldIpa" class="form-input" value="${escapeHtml(ipaVal)}" placeholder="Ví dụ: /poʊtʃ/">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Loại từ (Part of Speech)</label>
                    <input type="text" id="fieldPos" class="form-input" value="${escapeHtml(posVal)}" placeholder="Ví dụ: idiom, phrase">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Sắc thái (Register)</label>
                    <input type="text" id="fieldRegister" class="form-input" value="${escapeHtml(registerVal)}" placeholder="Ví dụ: casual, informal">
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <div class="form-group">
                    <label class="form-label">Từ/cụm đồng nghĩa (Synonyms)</label>
                    <input type="text" id="fieldSynonyms" class="form-input" value="${escapeHtml(synonymsVal)}" placeholder="Ví dụ: stay positive, count blessings">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Từ/cụm trái nghĩa (Antonyms)</label>
                    <input type="text" id="fieldAntonyms" class="form-input" value="${escapeHtml(antonymsVal)}" placeholder="Ví dụ: look on the dark side">
                  </div>
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

              ${isVocab ? `
                <div style="font-size: 11px; font-weight: 800; color: #166534; margin: 16px 0 6px 0; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                  <span>🌐 Mở rộng cách diễn đạt liên quan (Semantic Field)</span>
                </div>

                <div id="semanticFieldsContainer" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
                  ${semanticFieldList.map((sf, sfIdx) => `
                    <div class="sf-form-item" data-sf-index="${sfIdx}">
                      <div class="sf-form-header">
                        <span class="sf-form-title">Mục ${sfIdx + 1}</span>
                        <button type="button" class="btn-remove-ex" onclick="window.removeSemanticFieldRow && window.removeSemanticFieldRow(this)">✕ Xóa</button>
                      </div>
                      <div style="display: grid; grid-template-columns: 150px 1fr; gap: 8px; margin-bottom: 6px;">
                        <div>
                          <label class="form-sublabel">Phân loại (Type)</label>
                          <select class="form-input sf-input-type" style="padding: 5px 8px;">
                            <option value="slang" ${sf.type === 'slang' ? 'selected' : ''}>Slang (Tiếng lóng)</option>
                            <option value="idiom" ${sf.type === 'idiom' ? 'selected' : ''}>Idiom (Thành ngữ)</option>
                            <option value="related phrase" ${(!sf.type || sf.type === 'related phrase') ? 'selected' : ''}>Related phrase (Cụm liên quan)</option>
                            <option value="synonym" ${sf.type === 'synonym' ? 'selected' : ''}>Synonym (Từ đồng nghĩa)</option>
                          </select>
                        </div>
                        <div>
                          <label class="form-sublabel">Từ / Cụm từ (Expression)</label>
                          <input type="text" class="form-input sf-input-expr" placeholder="Ví dụ: mojo, get back out there" value="${escapeHtml(sf.expression || '')}">
                        </div>
                      </div>
                      <div style="margin-bottom: 6px;">
                        <label class="form-sublabel">Nghĩa tiếng Việt</label>
                        <input type="text" class="form-input sf-input-meaning" placeholder="Giải thích nghĩa súc tích" value="${escapeHtml(sf.meaning || '')}">
                      </div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                          <label class="form-sublabel">Ví dụ tiếng Anh (&lt;mark&gt;...&lt;/mark&gt;)</label>
                          <input type="text" class="form-input sf-input-ex-en" placeholder="Ví dụ: He lost his <mark>mojo</mark>." value="${escapeHtml(sf.example_en || '')}">
                        </div>
                        <div>
                          <label class="form-sublabel">Dịch ví dụ tiếng Việt</label>
                          <input type="text" class="form-input sf-input-ex-vi" placeholder="Ví dụ: Anh ta mất hết sức quyến rũ rồi." value="${escapeHtml(sf.example_vi || '')}">
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>

                <button type="button" class="btn-add-sf" onclick="window.addSemanticFieldRow && window.addSemanticFieldRow()">+ Thêm cách diễn đạt liên quan</button>
              ` : ''}

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
            <div class="empty-sentence-box">
              <div class="empty-sub-en">"${escapeHtml(sub.text || '')}"</div>
              ${sub.vietnamese ? `<div class="empty-sub-vi">${escapeHtml(sub.vietnamese)}</div>` : ''}
            </div>
            <div class="empty-actions">
              <button type="button" class="btn btn-ai" id="btnEmptySendGemini" onclick="window.handleSendGemini && window.handleSendGemini()">⚡ Gửi Gemini</button>
              <button type="button" class="btn btn-primary" onclick="window.handleCopyPrompt && window.handleCopyPrompt()">📋 Copy Prompt Gemini</button>
              <button type="button" class="btn btn-edit" onclick="window.toggleJsonMode && window.toggleJsonMode()">📥 Dán JSON từ Gemini</button>
              <button type="button" class="btn btn-edit" onclick="window.triggerAddNew && window.triggerAddNew('vocabulary')">+ Thêm thủ công</button>
            </div>
          </div>
        `;
      }

      // 4. VIEW MODE CARD
      const isVocab = currentItem.type === 'vocabulary';
      const paraphraseList: ParaphraseItem[] =
        Array.isArray(sub.expansion?.paraphrases) && sub.expansion.paraphrases.length > 0
          ? sub.expansion.paraphrases
          : sub.expansion?.paraphrase
          ? [{ text: sub.expansion.paraphrase }]
          : [];

      return `
        <div class="header-sentences-box">
          <div class="original-sub-text">"${escapeHtml(sub.text || '')}"</div>
          ${sub.vietnamese ? `<div class="original-sub-vi">${escapeHtml(sub.vietnamese)}</div>` : ''}
          ${paraphraseList.length > 0 ? `
            <div class="paraphrase-table">
              ${paraphraseList.map((pItem, pIdx) => {
                const pMethod = getShortMethodLabel(pItem.method, pIdx);
                const pHtml = renderParaphraseHtml(pItem.text || '');
                return `
                  <div class="paraphrase-line">
                    <span class="paraphrase-badge">${escapeHtml(pMethod)}</span>
                    <span class="paraphrase-val">"${pHtml}"</span>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>


        <div class="card">
          <div class="card-header-actions">
            <button class="btn btn-icon btn-edit" title="Chỉnh sửa" onclick="window.enterEditMode && window.enterEditMode()">✏️</button>
            <button class="btn btn-icon btn-delete" title="Xóa" onclick="window.handleDeleteItem && window.handleDeleteItem()">🗑️</button>
          </div>

          ${isVocab ? `
            <div class="main-word-row">
              <span class="main-word-text">${escapeHtml(currentItem.word || '')}</span>
              ${currentItem.ipa ? `<span class="word-ipa">${escapeHtml(currentItem.ipa)}</span>` : ''}
              ${currentItem.part_of_speech ? `<span class="badge-pos">${escapeHtml(currentItem.part_of_speech)}</span>` : ''}
              ${currentItem.register ? `<span class="badge-register">${escapeHtml(currentItem.register)}</span>` : ''}
            </div>

            ${currentItem.meaning ? `
              <div class="meaning-block">${escapeHtml(currentItem.meaning)}</div>
            ` : ''}

            <div class="syn-ant-row">
              ${currentItem.synonyms ? `
                <div class="synonyms-box">
                  <span class="synonyms-label">🔗 Đồng nghĩa:</span>
                  <span class="synonyms-text">${escapeHtml(currentItem.synonyms)}</span>
                </div>
              ` : ''}
              ${currentItem.antonyms ? `
                <div class="antonyms-box">
                  <span class="antonyms-label">⚡ Trái nghĩa:</span>
                  <span class="antonyms-text">${escapeHtml(currentItem.antonyms)}</span>
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="main-word-row">
              <span class="pattern-badge">${escapeHtml(currentItem.pattern || '')}</span>
            </div>

            ${currentItem.meaning ? `
              <div class="meaning-block">${escapeHtml(currentItem.meaning)}</div>
            ` : ''}
          `}


          ${currentItem.examples && currentItem.examples.length > 0 ? `
            <div class="example-list">
              ${currentItem.examples.map((ex, exIdx) => `
                <div class="example-item">
                  <div class="ex-en">${exIdx + 1}. ${renderMarkupText(ex.en || '')}</div>
                  <div class="ex-vi">${escapeHtml(ex.vi || '')}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${currentItem.semantic_field_expansion && currentItem.semantic_field_expansion.length > 0 ? `
            <div class="semantic-field-box">
              <div class="semantic-field-header">
                <span class="semantic-header-icon">🌐</span>
                <span class="semantic-header-title">Mở rộng cách diễn đạt liên quan (Semantic Field)</span>
              </div>
              <div class="semantic-items-list">
                ${currentItem.semantic_field_expansion.map(sf => {
                  const typeLower = (sf.type || 'related phrase').toLowerCase();
                  const typeClass = typeLower.includes('slang') ? 'tag-slang' : typeLower.includes('idiom') ? 'tag-idiom' : typeLower.includes('synonym') ? 'tag-synonym' : 'tag-related';
                  return `
                    <div class="semantic-item">
                      <div class="semantic-item-top">
                        <span class="semantic-type-tag ${typeClass}">${escapeHtml(sf.type || 'related')}</span>
                        <span class="semantic-expr">${escapeHtml(sf.expression || '')}</span>
                        ${sf.meaning ? `<span class="semantic-meaning">— ${escapeHtml(sf.meaning)}</span>` : ''}
                      </div>
                      ${sf.example_en ? `
                        <div class="semantic-example">
                          <div class="semantic-ex-en">💬 ${renderMarkupText(sf.example_en)}</div>
                          ${sf.example_vi ? `<div class="semantic-ex-vi">${escapeHtml(sf.example_vi)}</div>` : ''}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
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
    <div><span class="help-key">\`</span> Dừng / Phát video</div>
    <div><span class="help-key">,</span> / <span class="help-key">.</span> Đổi Từ vựng ↔ Cấu trúc</div>
    <div><span class="help-key">V</span> / <span class="help-key">N</span> Lùi / Tiến câu phụ đề</div>
    <div><span class="help-key">B</span> Nghe lại câu phụ đề</div>
    <div><span class="help-key">L</span> Bật / Tắt lặp vô hạn câu</div>
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

  const { sub, subIndex, totalSubtitles, activeItemIndex } = params;

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

        // IMPORTANT: Do NOT intercept if Cmd, Ctrl, or Alt is held (allows Cmd+V, Cmd+C, Cmd+A, macOS Shortcuts, etc.)
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        // Navigation hotkeys (only without modifiers)
        if (e.key === ',' || e.key === '.' || e.key === '[' || e.key === ']' || e.key.toLowerCase() === 'ư' || e.key.toLowerCase() === 'ơ') {
          e.preventDefault();
          if (typeof targetWin.sendCycleMessage === 'function') {
            targetWin.sendCycleMessage(e.key);
          }
        } else if (e.code === 'KeyV' || e.code === 'KeyN' || e.code === 'KeyB' || e.code === 'KeyL' || e.key.toLowerCase() === 'l' || e.key === 'Enter' || e.code === 'Backquote' || e.key === '`') {
          e.preventDefault();
          if (typeof targetWin.sendSeekMessage === 'function') {
            if (e.code === 'Backquote' || e.key === '`') {
              targetWin.sendSeekMessage('`');
            } else if (e.code === 'KeyL' || e.key.toLowerCase() === 'l') {
              targetWin.sendSeekMessage('l');
            } else {
              targetWin.sendSeekMessage(e.key === 'Enter' ? 'n' : e.key.toLowerCase());
            }
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

  targetWin.handleSendGemini = async () => {
    const subText = (sub.text || '').trim();
    const subVi = (sub.vietnamese || '').trim();

    if (!subText) {
      if (typeof targetWin.alert === 'function') {
        targetWin.alert('Không có nội dung câu thoại để gửi Gemini!');
      }
      return;
    }

    const btnHeader = targetDoc.getElementById('btnSendGemini') as HTMLButtonElement | null;
    const btnEmpty = targetDoc.getElementById('btnEmptySendGemini') as HTMLButtonElement | null;

    const setButtonsLoading = (loading: boolean) => {
      if (btnHeader) {
        btnHeader.disabled = loading;
        btnHeader.innerHTML = loading ? '⏳ Đang phân tích...' : '⚡ Gửi Gemini';
      }
      if (btnEmpty) {
        btnEmpty.disabled = loading;
        btnEmpty.innerHTML = loading ? '⏳ Đang phân tích...' : '⚡ Gửi Gemini';
      }
    };

    setButtonsLoading(true);


    try {
      const res = await fetch('/api/admin/expansion/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: subText, vietnamese: subVi })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Có lỗi xảy ra khi gọi Gemini API');
      }

      const sanitized = sanitizeExpansionJson(data.data);
      callbacks.onSaveFullExpansionJson(subIndex, sanitized);
    } catch (err: any) {
      console.error('Lỗi khi gửi Gemini:', err);
      const errMsg = err?.message || 'Có lỗi xảy ra khi phân tích bằng Gemini.';
      if (typeof targetWin.alert === 'function') {
        targetWin.alert(`❌ ${errMsg}`);
      } else if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(`❌ ${errMsg}`);
      }
      setButtonsLoading(false);
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

  targetWin.addSemanticFieldRow = () => {
    const container = targetDoc.getElementById('semanticFieldsContainer');
    if (!container) return;
    const count = container.querySelectorAll('.sf-form-item').length;
    const itemDiv = targetDoc.createElement('div');
    itemDiv.className = 'sf-form-item';
    itemDiv.dataset.sfIndex = String(count);
    itemDiv.innerHTML = '<div class="sf-form-header">' +
      '<span class="sf-form-title">Mục ' + (count + 1) + '</span>' +
      '<button type="button" class="btn-remove-ex" onclick="window.removeSemanticFieldRow && window.removeSemanticFieldRow(this)">✕ Xóa</button>' +
      '</div>' +
      '<div style="display: grid; grid-template-columns: 150px 1fr; gap: 8px; margin-bottom: 6px;">' +
      '<div>' +
      '<label class="form-sublabel">Phân loại (Type)</label>' +
      '<select class="form-input sf-input-type" style="padding: 5px 8px;">' +
      '<option value="slang">Slang (Tiếng lóng)</option>' +
      '<option value="idiom">Idiom (Thành ngữ)</option>' +
      '<option value="related phrase" selected>Related phrase (Cụm liên quan)</option>' +
      '<option value="synonym">Synonym (Từ đồng nghĩa)</option>' +
      '</select>' +
      '</div>' +
      '<div>' +
      '<label class="form-sublabel">Từ / Cụm từ (Expression)</label>' +
      '<input type="text" class="form-input sf-input-expr" placeholder="Ví dụ: mojo, get back out there">' +
      '</div>' +
      '</div>' +
      '<div style="margin-bottom: 6px;">' +
      '<label class="form-sublabel">Nghĩa tiếng Việt</label>' +
      '<input type="text" class="form-input sf-input-meaning" placeholder="Giải thích nghĩa súc tích">' +
      '</div>' +
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">' +
      '<div>' +
      '<label class="form-sublabel">Ví dụ tiếng Anh (&lt;mark&gt;...&lt;/mark&gt;)</label>' +
      '<input type="text" class="form-input sf-input-ex-en" placeholder="Ví dụ: He lost his &lt;mark&gt;mojo&lt;/mark&gt;.">' +
      '</div>' +
      '<div>' +
      '<label class="form-sublabel">Dịch ví dụ tiếng Việt</label>' +
      '<input type="text" class="form-input sf-input-ex-vi" placeholder="Ví dụ: Anh ta mất hết sức quyến rũ rồi.">' +
      '</div>' +
      '</div>';
    container.appendChild(itemDiv);
  };

  targetWin.removeSemanticFieldRow = (btn: HTMLElement) => {
    const item = btn.closest('.sf-form-item');
    if (item) item.remove();
  };

  targetWin.addParaphraseRow = () => {
    const container = targetDoc.getElementById('paraphrasesContainer');
    if (!container) return;
    const count = container.querySelectorAll('.para-form-item').length;
    const itemDiv = targetDoc.createElement('div');
    itemDiv.className = 'para-form-item';
    itemDiv.dataset.paraIndex = String(count);
    itemDiv.style.display = 'flex';
    itemDiv.style.gap = '6px';
    itemDiv.style.alignItems = 'center';
    itemDiv.innerHTML = '<input type="text" class="form-input para-input-method" style="width: 140px; flex-shrink: 0;" placeholder="Phương pháp (VD: Idiomatic)">' +
      '<input type="text" class="form-input para-input-text" style="flex: 1;" placeholder="Câu diễn giải tiếng Anh">' +
      '<button type="button" class="btn-remove-ex" onclick="window.removeParaphraseRow && window.removeParaphraseRow(this)">✕</button>';
    container.appendChild(itemDiv);
  };

  targetWin.removeParaphraseRow = (btn: HTMLElement) => {
    const item = btn.closest('.para-form-item');
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

    // Paraphrases
    const paraItems = targetDoc.querySelectorAll('.para-form-item');
    const paraphrases: ParaphraseItem[] = [];
    paraItems.forEach(el => {
      const method = (el.querySelector('.para-input-method') as HTMLInputElement)?.value?.trim() || '';
      const text = (el.querySelector('.para-input-text') as HTMLInputElement)?.value?.trim() || '';
      if (text) {
        paraphrases.push({ method: method || undefined, text });
      }
    });
    const legacyParaphraseInput = targetDoc.getElementById('fieldParaphrase') as HTMLInputElement | null;
    const paraphraseVal = paraphrases.length > 0
      ? paraphrases[0].text
      : (legacyParaphraseInput ? legacyParaphraseInput.value.trim() : '');

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
      const posVal = (targetDoc.getElementById('fieldPos') as HTMLInputElement)?.value?.trim() || '';
      const registerVal = (targetDoc.getElementById('fieldRegister') as HTMLInputElement)?.value?.trim() || '';
      const synonymsVal = (targetDoc.getElementById('fieldSynonyms') as HTMLInputElement)?.value?.trim() || '';
      const antonymsVal = (targetDoc.getElementById('fieldAntonyms') as HTMLInputElement)?.value?.trim() || '';

      const sfItems = targetDoc.querySelectorAll('.sf-form-item');
      const semantic_field_expansion: SemanticFieldItem[] = [];
      sfItems.forEach(el => {
        const type = (el.querySelector('.sf-input-type') as HTMLSelectElement | HTMLInputElement)?.value?.trim() || 'related phrase';
        const expression = (el.querySelector('.sf-input-expr') as HTMLInputElement)?.value?.trim() || '';
        const meaning = (el.querySelector('.sf-input-meaning') as HTMLInputElement)?.value?.trim() || '';
        const example_en = (el.querySelector('.sf-input-ex-en') as HTMLInputElement)?.value?.trim() || '';
        const example_vi = (el.querySelector('.sf-input-ex-vi') as HTMLInputElement)?.value?.trim() || '';
        if (expression || meaning) {
          semantic_field_expansion.push({ type, expression, meaning, example_en, example_vi });
        }
      });

      updatedPayload = {
        type: 'vocabulary',
        rawIndex: formRawIndex,
        paraphrase: paraphraseVal,
        paraphrases: paraphrases.length > 0 ? paraphrases : undefined,
        data: {
          word: wordVal,
          ipa: ipaVal,
          part_of_speech: posVal,
          register: registerVal,
          synonyms: synonymsVal,
          antonyms: antonymsVal,
          meaning: meaningVal,
          examples,
          semantic_field_expansion: semantic_field_expansion.length > 0 ? semantic_field_expansion : undefined
        }
      };
    } else {
      const patternVal = (targetDoc.getElementById('fieldPattern') as HTMLInputElement)?.value?.trim() || '';
      updatedPayload = {
        type: 'structure',
        rawIndex: formRawIndex,
        paraphrase: paraphraseVal,
        paraphrases: paraphrases.length > 0 ? paraphrases : undefined,
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
