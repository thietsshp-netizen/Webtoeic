import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-flash-latest"
];

function getModel(modelName: string = "gemini-3.6-flash") {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
}


/**
 * Phân tích và làm giàu dữ liệu TOÀN DIỆN cho MỘT CÂU HỎI TOEIC Part 5
 * (Bao gồm Phiên âm kép, Phrasal Verbs, Collocations, Vocabulary và Giải thích chi tiết)
 */
async function analyzePart5Question(questionText: string) {
  const prompt = `
    You are a World-Class TOEIC Expert and Linguist. Your task is to provide a COMPLETE and DEEP analysis for EXACTLY ONE Part 5 question. 
    NEVER omit any field. NEVER simplify the linguistic data.

    Return a SINGLE JSON object with this EXACT structure:
    1. "questionText": The sentence with '____' for the blank.
    2. "optionA" to "optionD": The text of the 4 choices.
    3. "correctAnswer": "A", "B", "C", or "D".
    4. "translation": A natural, professional Vietnamese translation of the full sentence.
    5. "explanation": {
         "options_breakdown": {
           "A": { 
             "ipa_uk": "UK Phonetic", 
             "ipa_us": "US Phonetic", 
             "meaning": "Meaning in Vietnamese", 
             "synonyms": "Synonyms (comma separated, or 'none')", 
             "antonyms": "Antonyms (comma separated, or 'none')", 
             "reason": "Very detailed Vietnamese logic why this option is correct or incorrect. Use **bold** for key grammar rules." 
           },
           "B": { "ipa_uk": "...", "ipa_us": "...", "meaning": "...", "synonyms": "...", "antonyms": "...", "reason": "..." },
           "C": { "ipa_uk": "...", "ipa_us": "...", "meaning": "...", "synonyms": "...", "antonyms": "...", "reason": "..." },
           "D": { "ipa_uk": "...", "ipa_us": "...", "meaning": "...", "synonyms": "...", "antonyms": "...", "reason": "..." }
         },
         "expansion": [
           { 
             "phrase": "Focus on: Phrasal verbs, Collocations, Prepositional phrases, or Compound nouns found in the sentence", 
             "ipa_uk": "UK Phonetic", 
             "ipa_us": "US Phonetic", 
             "meaning": "Vietnamese meaning and specific usage context in this sentence" 
           }
         ]
       }
    6. "vocabulary": Array of exactly 3-5 focus words from the sentence. Each must have:
       {
         "word": "The word",
         "ipa_uk": "UK Phonetic",
         "ipa_us": "US Phonetic",
         "meaning": "Meaning in Vietnamese",
         "examples": [
           { "en": "Example sentence in English", "vi": "Dịch nghĩa ví dụ sang tiếng Việt" }
         ],
         "synonyms": "Synonyms (at least 2 if possible)",
         "antonyms": "Antonyms (at least 2 if possible)"
       }

    STRICT REQUIREMENTS:
    - DUAL IPA: You MUST provide "ipa_uk" and "ipa_us" for EVERY word in vocabulary, EVERY phrase in expansion, and EVERY choice in options_breakdown.
    - FULL BREAKDOWN: You MUST provide IPA, Meaning, Synonyms, Antonyms, and Reason for ALL 4 options (A, B, C, and D) regardless of which one is correct.
    - LINGUISTIC FOCUS: In "expansion", strictly identify Phrasal Verbs, Collocations, or Prepositions. Do not provide simple words here; provides multi-word structures.
    - NO PLACEHOLDERS: Do not use "...", "n/a", or "null". If a field like antonyms has absolutely no entry, use the string "none".
    - VIETNAMESE LANGUAGE: All meanings, translations, and reasons must be in clear, educational Vietnamese.

    QUESTION TO ANALYZE:
    ${questionText}
  `;

  let lastError;
  for (const modelName of GEMINI_CANDIDATE_MODELS) {
    try {
      const model = getModel(modelName);
      const result = await model.generateContent(prompt);
      let responseText = result.response.text().trim();

      if (responseText.startsWith("```json")) {
        responseText = responseText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const data = JSON.parse(responseText);
      
      // Kiểm tra tính đầy đủ của dữ liệu cơ bản
      if (!data.questionText || !data.explanation?.options_breakdown) {
        throw new Error("AI returned incomplete JSON structure");
      }

      return data;
    } catch (error: any) {
      lastError = error;
      console.warn(`[Part 5 Gemini] Model ${modelName} failed:`, error?.message || error);
    }
  }
  throw lastError;
}


/**
 * Phân tích kiến thức mở rộng (Paraphrase, Vocabulary, Structures) cho một câu thoại phim/video
 */
async function generateMovieExpansionForSub(subText: string, subVi?: string) {
  const cleanText = (subText || "").trim();
  const cleanVi = (subVi || "").trim();

  if (!cleanText) {
    throw new Error("Không có nội dung câu thoại để phân tích");
  }

  const prompt = `# VAI TRÒ
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

## 1.2. Yêu cầu BẮT BUỘC cho từng câu paraphrase:
* Đảm bảo Naturalness Test: Giữ nguyên sắc thái, cảm xúc, mức độ trang trọng (register) của ngữ cảnh phim.
* QUY TẮC ĐÁNH DẤU BẮT BUỘC: Mỗi câu paraphrase trong trường "text" BẮT BUỘC PHẢI DÙNG thẻ <mark>...</mark> để bọc quanh chính xác phần từ ngữ/cụm từ/cấu trúc được thay đổi, biến đổi hoặc viết lại so với câu gốc!
  - TUYỆT ĐỐI KHÔNG được trả về câu paraphrase dạng văn bản thô không có thẻ <mark>...</mark>.
  - Ví dụ đúng: "Every time this guy simply says hi, it <mark>drives me up the wall</mark>."
  - Ví dụ đúng: "Just hearing this guy greet me <mark>makes me want to disappear</mark>."
  - Ví dụ đúng: "The dude barely says a word and <mark>I'm already losing my mind</mark>."
  - Ví dụ sai (KHÔNG ĐƯỢC): "Every time this guy simply says hi, it drives me up the wall." (SAI vì thiếu thẻ <mark>...</mark>)

---

# NGUYÊN TẮC 2 — TỪ VỰNG TRỌNG TÂM & MỞ RỘNG TRƯỜNG NGHĨA (vocabulary)

## 2.1. Tiêu chí chọn từ vựng mục tiêu (word):
* Nguồn trích xuất:
  - Ưu tiên 1 (Chính): Trích xuất từ vựng / cụm từ / phrasal verb / idiom xuất hiện trực tiếp trong CÂU GỐC (BẮT BUỘC ghi "source": "original").
  - Ưu tiên 2 (Mở rộng): Trích xuất thêm các từ vựng / cụm từ hay, hữu ích xuất hiện trong CÂU PARAPHRASE để giải thích thêm cho người học (BẮT BUỘC ghi "source": "paraphrase").
* Reusability Test: Chỉ chọn từ/cụm từ/idiom có tính ứng dụng cao, giúp người học tái sử dụng để diễn đạt trong nhiều ngữ cảnh đời thường khác nhau.
* Không chọn từ quá sơ cấp/hiển nhiên (I, you, go, have, do, be...). Nếu câu không có từ nào đáng chú ý, trả về "vocabulary": [].

## 2.2. Thông tin từ vựng:
* word: Từ / cụm từ / idiom mục tiêu.
* source: BẮT BUỘC ghi đúng 1 trong: "original" (nếu từ câu gốc) | "paraphrase" (nếu từ câu paraphrase).
* ipa: Phiên âm General American (GA) đặt trong /.../.
* part_of_speech: Chỉ chọn 1 trong: idiom | phrasal verb | phrase | verb | noun | adjective | adverb | collocation.
* register: Chỉ chọn 1 trong: casual | neutral | informal | slang | idiomatic | formal.
* meaning: Giải nghĩa tiếng Việt ngắn gọn, sát đúng ngữ cảnh câu.
* synonyms / antonyms: Cung cấp từ/cụm tương đương tự nhiên hoặc để "" nếu không có.
* examples: BẮT BUỘC cung cấp tối thiểu 1 ví dụ thực tế minh họa cách dùng trong giao tiếp đời thường. Câu tiếng Anh (en) BẮT BUỘC dùng thẻ <mark>...</mark> bao quanh từ/cụm từ mục tiêu và BẮT BUỘC có dịch nghĩa tiếng Việt (vi).

## 2.3. Mở rộng trường nghĩa (semantic_field_expansion):
* Với mỗi mục từ vựng, cung cấp từ 2 đến 3 cách nói/từ vựng liên quan trong cùng trường nghĩa/chủ đề để làm giàu vốn diễn đạt cho người học.
* type: Chọn đúng 1 trong: synonym | related phrase | slang | idiom.
* example_en: Ví dụ BẮT BUỘC NGẮN GỌN (dưới 10 từ), súc tích, phản ánh đúng văn nói và BẮT BUỘC có thẻ <mark>...</mark> bọc quanh từ mở rộng.
* example_vi: Dịch nghĩa tiếng Việt cho ví dụ ngắn.

---

# NGUYÊN TẮC 3 — CẤU TRÚC KHUNG CÂU GIAO TIẾP (structures)
* Nguồn trích xuất:
  - Trích xuất cấu trúc xuất hiện trực tiếp trong CÂU GỐC (BẮT BUỘC ghi "source": "original").
  - Nếu câu paraphrase có cấu trúc câu đặc sắc có thể trích xuất thêm (BẮT BUỘC ghi "source": "paraphrase").
* source: BẮT BUỘC ghi đúng 1 trong: "original" | "paraphrase".
* Conversational Frame: Phải là mẫu câu / sentence pattern có thể lắp ghép thành phần khác để tạo câu mới (Ví dụ: "It's not like + clause", "What if we + V...", "There's no point in + V-ing").
* Không lấy ngữ pháp ngữ văn cơ bản (S + V + O, thì hiện tại...). Nếu không có cấu trúc nào đặc sắc, trả về "structures": [].
* examples: BẮT BUỘC cung cấp tối thiểu 1 ví dụ thực tế minh họa cách dùng khung câu. BẮT BUỘC dùng thẻ <mark>...</mark> bọc quanh phần cấu trúc áp dụng trong câu ví dụ (en) và BẮT BUỘC có dịch nghĩa tiếng Việt (vi).

---

# SCHEMA JSON BẮT BUỘC
{
  "paraphrases": [
    {
      "method": "Tên phương pháp (VD: Lexical / Phrasal Re-expression | Structural Shift | Conversational Idiom...)",
      "text": "Câu diễn đạt lại BẮT BUỘC có thẻ <mark>cụm từ thay đổi</mark> (Ví dụ: It <mark>drives me up the wall</mark>.)"
    }
  ],
  "vocabulary": [
    {
      "word": "Từ / cụm từ / idiom mục tiêu",
      "source": "original | paraphrase",
      "ipa": "/.../",
      "part_of_speech": "idiom | phrasal verb | phrase | verb | noun | adjective | adverb | collocation",
      "register": "casual | neutral | informal | slang | idiomatic | formal",
      "meaning": "Nghĩa tiếng Việt ngắn gọn, sát ngữ cảnh",
      "synonyms": "Từ/cụm đồng nghĩa thay thế trực tiếp được hoặc \"\"",
      "antonyms": "Từ/cụm trái nghĩa hoặc \"\"",
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
      "pattern": "Sentence frame/pattern giao tiếp",
      "source": "original | paraphrase",
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
Câu thoại: "${cleanText}"
${cleanVi ? `Bản dịch tham khảo: "${cleanVi}"` : ""}`;




  let lastError;
  for (const modelName of GEMINI_CANDIDATE_MODELS) {
    try {
      const model = getModel(modelName);
      const result = await model.generateContent(prompt);
      let responseText = result.response.text().trim();

      if (responseText.startsWith("```json")) {
        responseText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
      } else if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
      }

      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
      }

      const data = JSON.parse(responseText);
      return data;
    } catch (error: any) {
      lastError = error;
      console.warn(`[Gemini Expansion] Model ${modelName} failed:`, error?.message || error);
    }
  }
  throw lastError;
}


/**
 * Batch processing (Duy trì để tương thích)
 */
async function processPart5Batch(questions: string[]) {
  return Promise.all(questions.map(q => analyzePart5Question(q)));
}

export { analyzePart5Question, processPart5Batch, generateMovieExpansionForSub };

