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
"${cleanText}"
${cleanVi ? `(Bản dịch phụ đề gốc: "${cleanVi}")` : ""}`;




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

