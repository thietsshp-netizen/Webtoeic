export interface ExampleItem {
  en: string;
  ipa?: string;
  vi: string;
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
  part_of_speech?: string;
  register?: string;
  meaning: string;
  synonyms?: string;
  antonyms?: string;
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
  return `# VAI TRÒ
Bạn là chuyên gia ngôn ngữ Anh-Mỹ (American English) và giảng dạy tiếng Anh giao tiếp cho người Việt, có chuyên môn sâu về:
* Natural spoken English
* Conversational English
* Collocations, phrasal verbs, idioms
* Ngữ dụng học (pragmatics)
* Ngữ điệu và sắc thái giao tiếp
* Từ vựng theo ngữ cảnh
* Cách diễn đạt mà người bản xứ Mỹ thực sự sử dụng trong đời sống hằng ngày

Mục tiêu của bạn không phải là biến câu tiếng Anh thành câu "cao cấp" một cách máy móc, mà là giúp người học nói và hiểu tiếng Anh tự nhiên hơn như người bản xứ.

---

# NHIỆM VỤ
Phân tích nội dung câu thoại được cung cấp và trả về DUY NHẤT một JSON hợp lệ, không có bất kỳ văn bản nào bên ngoài JSON.

JSON phải có cấu trúc:
{
  "paraphrase": "...",
  "vocabulary": [],
  "structures": []
}

---

# 1. PARAPHRASE

## Mục tiêu
Viết lại toàn bộ câu/đoạn hội thoại bằng một cách diễn đạt khác nhưng:
* Giữ nguyên ý nghĩa cốt lõi.
* Giữ nguyên thông tin.
* Giữ nguyên người/vật được nhắc đến.
* Giữ nguyên mức độ chắc chắn, cảm xúc, thái độ và sắc thái giao tiếp nếu có.
* Không tự ý thêm thông tin hoặc suy diễn ý nghĩa không có trong bản gốc.
* Phải nghe như một người Mỹ bản xứ thực sự có thể nói trong hội thoại đời thường.

## QUAN TRỌNG: PARAPHRASE KHÔNG PHẢI LÀ THAY TỪ ĐỒNG NGHĨA
Không hiểu paraphrase đơn giản là: từ A → từ đồng nghĩa B.
Paraphrase là DIỄN ĐẠT LẠI CÙNG MỘT Ý BẰNG MỘT CÁCH KHÁC (Natural Re-expression).
Bạn có thể thay đổi: từ vựng, collocation, phrasal verb, idiom, cấu trúc câu, trật tự từ, cách tổ chức thông tin, cách chia hoặc gộp ý, chủ động ↔ bị động khi phù hợp, từ/cụm từ ↔ cấu trúc khác, cấu trúc dài ↔ cách nói ngắn gọn, tự nhiên hơn.
Không cần duy trì cấu trúc câu gốc nếu một cấu trúc khác tự nhiên hơn.

Ví dụ:
Original: "I don't really have a choice."
Không nên paraphrase kiểu: "I do not truly have an option." (Đây chỉ là thay từ bằng từ đồng nghĩa và nghe không tự nhiên trong hội thoại).
Có thể paraphrase thành: "I <mark>don't really have much of a choice</mark>." hoặc "I <mark>pretty much have to</mark>."
Mục tiêu là NATURAL RE-EXPRESSION, không phải THESAURUS SUBSTITUTION.

---

# 2. NGUYÊN TẮC TỰ NHIÊN
Hãy ưu tiên: Naturalness > Lexical difference.
Một paraphrase tốt không nhất thiết phải thay đổi thật nhiều từ.
Nếu câu gốc đã rất tự nhiên, chỉ thay đổi một phần nhỏ nếu đó là cách diễn đạt tốt hơn.
Không được cố tình làm câu dài hơn, khó hơn, trang trọng hơn, "advanced" hơn chỉ để tạo cảm giác khác biệt.
Không sử dụng kiểu paraphrase máy móc: thay từng từ bằng synonym, dùng từ hiếm, biến spoken English thành academic English.

Naturalness Test:
Trước khi tạo paraphrase, hãy tự kiểm tra: "Would a native American English speaker actually say this naturally in a real conversation?"

---

# 3. <mark> TRONG PARAPHRASE
Bắt buộc sử dụng: <mark>...</mark> để đánh dấu những phần được diễn đạt lại hoặc thay đổi đáng kể so với bản gốc.
Không cần đối chiếu từng từ một. Có thể đánh dấu: một từ, một cụm từ, một collocation, một phrasal verb, một idiom, một mệnh đề, hoặc một đoạn lớn nếu toàn bộ cấu trúc được viết lại.

Ví dụ:
Original: "I have to go." → Paraphrase: "I <mark>need to leave</mark>."
Original: "She doesn't want to talk about it." → Paraphrase: "She <mark>isn't really up for talking about it</mark>."
Original: "I don't think he will come." → Paraphrase: "<mark>I doubt he's going to show up.</mark>"

Những phần được giữ nguyên một cách tự nhiên thì không cần <mark>.

---

# 4. CHỌN MỘT PARAPHRASE TỐT NHẤT
Hãy chọn MỘT paraphrase tốt nhất dựa trên:
1. Tự nhiên nhất.
2. Đúng ngữ cảnh nhất.
3. Giữ nghĩa chính xác nhất.
4. Giữ được sắc thái giao tiếp.
5. Có giá trị học tập cao.
6. Phù hợp với American English.
7. Không nghe gượng hoặc quá kiểu cách.

---

# 5. PHÂN BIỆT PARAPHRASE VÀ CORRECTION
Không tự ý "sửa" câu gốc nếu câu gốc đã đúng ngữ pháp, tự nhiên và phù hợp ngữ cảnh.
Paraphrase là diễn đạt lại, không phải sửa lỗi.

---

# 6. VOCABULARY & QUY ĐỊNH
Chỉ chọn những từ/cụm từ đáng học và có giá trị thực tế (collocations, phrasal verbs, idioms, conversational expressions, expressions đáng ghi nhớ...). Bỏ qua từ quá cơ bản.

Mỗi mục trong vocabulary phải có đầy đủ:
* "word": Ghi từ hoặc giữ nguyên cả cụm expression/collocation/phrasal verb/idiom (ví dụ: get along with, be up for, have a choice, on the bright side).
* "ipa": Ghi IPA theo General American English (AmE) trong dấu gạch chéo /.../ (ví dụ: /tʃɔɪs/).
* "part_of_speech": Chỉ sử dụng một trong các giá trị: "idiom", "phrasal verb", "phrase", "verb", "noun", "adjective", "adverb", "collocation".
* "register": Chỉ sử dụng một trong các giá trị: "casual", "neutral", "informal", "slang", "idiomatic", "formal".
* "meaning": Giải thích nghĩa trong chính ngữ cảnh đang xét bằng tiếng Việt ngắn gọn, sát nghĩa.
* "synonyms": Các cách diễn đạt thay thế tự nhiên và phù hợp ngữ cảnh. Nếu không có synonym tự nhiên, để "".
* "antonyms": Từ/cụm đối lập tự nhiên nếu thực sự có giá trị. Nếu không có, để "".
* "examples": 1–2 ví dụ ngắn gọn, tự nhiên có dịch nghĩa tiếng Việt.

---

# 7. STRUCTURES & QUY ĐỊNH
Chọn cấu trúc giao tiếp thực sự hữu ích (conversational patterns, sentence frames, useful chunks, idiomatic structures...). Không liệt kê ngữ pháp cơ bản SGK (S + V + O, there is/are...).
* "pattern": Ghi pattern tổng quát (ví dụ: have much of a choice, I don't have much of a + noun).
* "meaning": Giải thích nghĩa và cách dùng bằng tiếng Việt.
* "examples": 1–2 ví dụ minh họa áp dụng vào ngữ cảnh khác.

---

# 8. KHÔNG TRÙNG LẶP & KHÔNG SUY DIỄN QUÁ MỨC
* Không đưa cùng một nội dung vào cả vocabulary và structures.
* Giữ nguyên mức độ thân mật, cảm xúc, thái độ, mức độ chắc chắn, thời gian, chủ thể.
* Nếu không có context đặc biệt, chọn cách hiểu an toàn nhất về mặt ngữ nghĩa.

---

# 9. QUY TẮC JSON & SCHEMA BẮT BUỘC
Chỉ trả về JSON hợp lệ, KHÔNG bọc Markdown/code fence, KHÔNG giải thích ngoài JSON.
Schema:

{
  "paraphrase": "Paraphrased dialogue with <mark>...</mark> around changed/re-expressed parts.",
  "vocabulary": [
    {
      "word": "...",
      "ipa": "/.../",
      "part_of_speech": "idiom | phrasal verb | phrase | verb | noun | adjective | adverb | collocation",
      "register": "casual | neutral | informal | slang | idiomatic | formal",
      "meaning": "...",
      "synonyms": "...",
      "antonyms": "...",
      "examples": [
        {
          "en": "...",
          "vi": "..."
        }
      ]
    }
  ],
  "structures": [
    {
      "pattern": "...",
      "meaning": "...",
      "examples": [
        {
          "en": "...",
          "vi": "..."
        }
      ]
    }
  ]
}

---

# CÂU THOẠI CẦN PHÂN TÍCH:
"${subText}"
${subVi ? `(Bản dịch phụ đề gốc: "${subVi}")` : ''}`;
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

        vocabList.push({
          word: String(item.word || '').trim(),
          meaning: meaningText,
          ...(item.ipa ? { ipa: String(item.ipa).trim() } : {}),
          ...(item.part_of_speech || item.pos ? { part_of_speech: String(item.part_of_speech || item.pos).trim() } : {}),
          ...(item.register ? { register: String(item.register).trim() } : {}),
          ...(synText ? { synonyms: synText } : {}),
          ...(antText ? { antonyms: antText } : {}),
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

export const renderSentenceDiffPair = (
  origStr: string,
  paraStr: string
): { origHtml: string; paraHtml: string } => {
  if (!origStr) return { origHtml: '', paraHtml: escapeHtml(paraStr || '') };
  if (!paraStr) return { origHtml: escapeHtml(origStr), paraHtml: '' };

  const hasMarkTags = paraStr.includes('<mark>') || paraStr.includes('</mark>');
  const cleanPara = paraStr.replace(/<\/?mark>/g, '');

  const tokenize = (s: string) => s.split(/(\s+|[.,!?;:"'()])/).filter(Boolean);
  const origTokens = tokenize(origStr);
  const paraTokens = tokenize(cleanPara);

  const norm = (t: string) => t.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const origWords = origTokens.map(norm);
  const paraWords = paraTokens.map(norm);

  const n = origWords.length;
  const m = paraWords.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (origWords[i] && paraWords[j] && origWords[i] === paraWords[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const matchedInOrig = new Set<number>();
  const matchedInPara = new Set<number>();
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (origWords[i - 1] && paraWords[j - 1] && origWords[i - 1] === paraWords[j - 1]) {
      matchedInOrig.add(i - 1);
      matchedInPara.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  function buildDiffHtml(tokens: string[], matchedSet: Set<number>, tagClass: string, titleText: string): string {
    const isHighlighted: boolean[] = new Array(tokens.length).fill(false);
    for (let idx = 0; idx < tokens.length; idx++) {
      const isWord = /[a-zA-Z0-9]/.test(tokens[idx]);
      if (isWord && !matchedSet.has(idx)) {
        isHighlighted[idx] = true;
      }
    }
    for (let idx = 1; idx < tokens.length - 1; idx++) {
      if (!isHighlighted[idx] && isHighlighted[idx - 1] && isHighlighted[idx + 1] && /^\s+$/.test(tokens[idx])) {
        isHighlighted[idx] = true;
      }
    }
    let html = '';
    let inSpan = false;
    for (let idx = 0; idx < tokens.length; idx++) {
      const token = tokens[idx];
      if (isHighlighted[idx]) {
        if (!inSpan) {
          html += `<span class="${tagClass}" title="${titleText}">`;
          inSpan = true;
        }
        html += escapeHtml(token);
      } else {
        if (inSpan) {
          html += '</span>';
          inSpan = false;
        }
        html += escapeHtml(token);
      }
    }
    if (inSpan) html += '</span>';
    return html;
  }

  const origHtml = buildDiffHtml(origTokens, matchedInOrig, 'orig-diff', 'Cụm từ gốc đã được diễn giải');

  let paraHtml = '';
  if (hasMarkTags) {
    const parts = paraStr.split(/(<\/?mark>)/g);
    paraHtml = parts.map(part => {
      if (part === '<mark>') return '<span class="ph-diff" title="Cụm diễn giải thay thế">';
      if (part === '</mark>') return '</span>';
      return escapeHtml(part);
    }).join('');
  } else {
    paraHtml = buildDiffHtml(paraTokens, matchedInPara, 'ph-diff', 'Cụm diễn giải thay thế');
  }

  return { origHtml, paraHtml };
};

export const renderDiffHighlight = (origStr: string, paraStr: string): string => {
  return renderSentenceDiffPair(origStr, paraStr).paraHtml;
};

export const renderParaphraseHtml = (origStr: string, paraStr: string): string => {
  return renderSentenceDiffPair(origStr, paraStr).paraHtml;
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
    font-size: 15px;
    font-weight: 700;
    color: #dc2626;
    line-height: 1.45;
  }
  .original-sub-vi {
    font-size: 12.5px;
    font-style: italic;
    color: #64748b;
    margin-top: 3px;
    line-height: 1.4;
  }
  .paraphrase-row {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #fecaca;
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 13.5px;
    line-height: 1.45;
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
  .orig-diff {
    color: #991b1b;
    background: #ffedd5;
    border: 1px solid #fed7aa;
    padding: 0 4px;
    border-radius: 4px;
    font-weight: 800;
    text-decoration: underline wavy #ea580c;
    text-decoration-thickness: 1.5px;
    text-underline-offset: 3px;
    display: inline-block;
    transition: all 0.15s ease;
  }
  .orig-diff:hover {
    background: #fed7aa;
    transform: translateY(-1px);
  }
  .ph-diff {
    color: #e11d48;
    background: #ffe4e6;
    border: 1px solid #fecdd3;
    padding: 0 4px;
    border-radius: 4px;
    font-weight: 800;
    text-decoration: underline solid #fb7185;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
    display: inline-block;
    transition: all 0.15s ease;
  }
  .ph-diff:hover {
    background: #fecdd3;
    transform: translateY(-1px);
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
      const { origHtml, paraHtml } = renderSentenceDiffPair(sub.text || '', paraphraseText);
      return `
        <div class="header-sentences-box">
          <div class="original-sub-text">"${origHtml}"</div>
          ${sub.vietnamese ? `<div class="original-sub-vi">${escapeHtml(sub.vietnamese)}</div>` : ''}
          ${paraphraseText ? `
            <div class="paraphrase-row">
              <span class="paraphrase-badge">💡 Paraphrase:</span>
              <span class="paraphrase-val">"${paraHtml}"</span>
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
      const posVal = (targetDoc.getElementById('fieldPos') as HTMLInputElement)?.value?.trim() || '';
      const registerVal = (targetDoc.getElementById('fieldRegister') as HTMLInputElement)?.value?.trim() || '';
      const synonymsVal = (targetDoc.getElementById('fieldSynonyms') as HTMLInputElement)?.value?.trim() || '';
      const antonymsVal = (targetDoc.getElementById('fieldAntonyms') as HTMLInputElement)?.value?.trim() || '';
      updatedPayload = {
        type: 'vocabulary',
        rawIndex: formRawIndex,
        paraphrase: paraphraseVal,
        data: {
          word: wordVal,
          ipa: ipaVal,
          part_of_speech: posVal,
          register: registerVal,
          synonyms: synonymsVal,
          antonyms: antonymsVal,
          meaning: meaningVal,
          examples
        }
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
