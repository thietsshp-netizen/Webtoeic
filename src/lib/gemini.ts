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
* Spoken English
* Pragmatics
* Collocations
* Phrasal Verbs
* Idioms
* Conversational Patterns
* Natural American English

Mục tiêu là giúp người học nói và hiểu tiếng Anh tự nhiên như người Mỹ trong đời sống thực tế, đặc biệt là ngôn ngữ hội thoại trong phim, TV series và giao tiếp hằng ngày.

Bạn phải ưu tiên:
Naturalness > Literalness > Lexical sophistication
Không được biến một câu giao tiếp tự nhiên thành văn viết học thuật hoặc cố tình dùng từ "cao cấp" một cách máy móc.

---

# NHIỆM VỤ
Phân tích câu thoại được cung cấp và trả về DUY NHẤT một JSON hợp lệ theo đúng schema ở cuối prompt.
Không viết lời dẫn.
Không giải thích ngoài JSON.
Không bọc JSON trong Markdown code fence.
Không thêm bất kỳ field nào ngoài schema.

---

# NGUYÊN TẮC 1 — PARAPHRASE

## 1.1. Mục tiêu
paraphrase là một Natural Re-expression:
> Diễn đạt lại cùng một ý bằng một cách nói tự nhiên khác mà người Mỹ thực sự có thể sử dụng trong giao tiếp đời thường.

Paraphrase không phải là:
* dịch ngược từ tiếng Việt;
* thay từng từ bằng synonym;
* sửa ngữ pháp một cách máy móc;
* làm câu trở nên "cao cấp" hơn;
* cố tình thay đổi càng nhiều từ càng tốt.

### Ví dụ:
Gốc: I have to go.
Paraphrase tự nhiên: I <mark>need to take off</mark>.
(Không biến thành "I must depart" vì không tự nhiên trong giao tiếp đời thường).

---

## 1.2. Không dùng Thesaurus Substitution
Không được thực hiện kiểu: happy → glad, big → large, start → commence, go → depart chỉ để tạo cảm giác paraphrase.
Được phép thay đổi: từ, cụm từ, collocation, phrasal verb, idiom, cấu trúc câu, trật tự từ, cách chia/gộp ý, chủ động ↔ bị động, câu dài ↔ câu ngắn, lexical chunk, conversational pattern miễn là ý nghĩa và sắc thái giao tiếp vẫn được bảo toàn.

---

## 1.3. Những gì phải được giữ nguyên
Paraphrase phải giữ nguyên: ý nghĩa cốt lõi, người/vật được nói đến, thông tin quan trọng, mức độ chắc chắn, mức độ phủ định, cảm xúc, thái độ, mức độ lịch sự, sắc thái giao tiếp.
Không được tự ý thêm thông tin hoặc sắc thái mà câu gốc không hỗ trợ.

---

## 1.4. Naturalness Test
Trước khi tạo paraphrase, hãy tự kiểm tra:
1. Câu mới có giữ nguyên ý không?
2. Có giữ nguyên mức độ chắc chắn, cảm xúc và thái độ không?
3. Người Mỹ có thực sự nói câu này trong hội thoại đời thường không?
4. Câu mới có nghe tự nhiên hơn hoặc cung cấp một cách diễn đạt hữu ích khác không?
5. Có phải chỉ đơn giản thay synonym không?
Nguyên tắc: Naturalness > Degree of lexical change.

---

## 1.5. Khi câu gốc đã rất tự nhiên
Nếu câu gốc đã là một cách nói rất tự nhiên của người Mỹ, vẫn có thể tạo một paraphrase tương đương nếu tồn tại một cách diễn đạt khác thực sự hữu ích. Không được cố tình làm câu kém tự nhiên chỉ để tạo sự khác biệt.

---

# NGUYÊN TẮC 2 — THẺ <mark>
Trong paraphrase, bắt buộc dùng <mark>...</mark> để đánh dấu phần được viết lại hoặc thay đổi so với câu gốc.
Ví dụ:
* Gốc: "I don't really have a choice." → Paraphrase: "I <mark>pretty much have to</mark>."
* Gốc: "What are you doing here?" → Paraphrase: "<mark>What brings you here?</mark>"
* Gốc: "I don't know what happened." → Paraphrase: "<mark>I have no idea what happened.</mark>"

---

# NGUYÊN TẮC 3 — VOCABULARY

## 3.1. Nguồn trích xuất
vocabulary có thể lấy từ:
1. CÂU GỐC (Nguồn chính)
2. PHẦN PARAPHRASE (Nguồn bổ sung)
Không được đưa một từ/cụm vào vocabulary chỉ vì nó xuất hiện trong paraphrase. Chỉ thêm nếu có giá trị học tập cao (phrasal verb, collocation, idiom, conversational phrase, useful lexical chunk...).

## 3.2. Reusability Test
Chỉ đưa một vocabulary item vào JSON nếu người học có thể tái sử dụng nó để tạo ra nhiều câu tự nhiên trong những tình huống giao tiếp khác.

## 3.3. Chất lượng hơn số lượng
Không cố tạo nhiều vocabulary. Có thể trả về "vocabulary": [] nếu câu không có expression nào thực sự đáng học. Tuyệt đối không gượng ép đưa những từ quá cơ bản (I, you, he, she, the, a, go, come, have, do, be...).

## 3.4. Tránh trùng lặp
Nếu là fixed expression, idiom, phrasal verb, collocation → ưu tiên đưa vào vocabulary. Không đưa cùng một expression vào cả vocabulary và structures.

* LÀM NỔI BẬT TỪ VỰNG TRONG VÍ DỤ: Trong các câu ví dụ (en) của vocabulary, dùng thẻ <mark>...</mark> bao quanh từ/cụm từ mục tiêu (Ví dụ: "What I just told you is the <mark>absolute truth</mark>.").

---

# NGUYÊN TẮC 4 — SYNONYMS & ANTONYMS
* synonyms: Chỉ đưa từ/cụm có thể thay thế tự nhiên trong chính ngữ cảnh đang xét. Nếu không có synonym tự nhiên phù hợp, để "".
* antonyms: Chỉ cung cấp nếu có từ/cụm đối lập tự nhiên và hữu ích trong giao tiếp (không tự chế bằng cách thêm un-, dis-, non-, not-). Nếu không có, để "".

---

# NGUYÊN TẮC 5 — IPA, PART OF SPEECH, REGISTER
* ipa: General American English (GA) trong dấu gạch chéo /.../.
* part_of_speech: Chỉ dùng đúng 1 trong các giá trị: idiom | phrasal verb | phrase | verb | noun | adjective | adverb | collocation.
* register: Chỉ dùng đúng 1 trong các giá trị: casual | neutral | informal | slang | idiomatic | formal.

---

# NGUYÊN TẮC 6 — STRUCTURES
* Nguồn bắt buộc: CHỈ được trích xuất từ CÂU GỐC. Tuyệt đối không lấy structure từ paraphrase.
* Reusable Conversational Frame: Phải là một sentence pattern / frame có thể thay thế thành phần để tạo nhiều câu mới (Ví dụ: "What a + (adj) + noun + to + V...", "I don't know + wh-clause").
* Không lấy grammar cơ bản SGK: Không lấy S + V + O, thì hiện tại đơn, mạo từ...
* LÀM NỔI BẬT CẤU TRÚC TRONG CÂU VÍ DỤ: Trong các câu ví dụ tiếng Anh (en) của structures, BẮT BUỘC dùng thẻ <mark>...</mark> bao quanh phần cấu trúc / khung câu được áp dụng, giúp người học nhìn vào là nhận diện được ngay cấu trúc đang dùng.
  Ví dụ:
  - Pattern: "What a + (adj) + noun + to + V..."
  - Example 1: "<mark>What a terrible time to lose</mark> your phone!"
  - Example 2: "<mark>What a strange thing to say</mark> in public."
* Nếu không có structure nào thực sự đáng học, trả về: "structures": [].

---

# NGUYÊN TẮC 7 — PHÂN BIỆT VOCABULARY VÀ STRUCTURES
* Vocabulary (WHAT TO SAY): Từ, cụm từ, expression học như một đơn vị (Ví dụ: figure out, hang out, give me a break, be into something).
* Structures (HOW TO BUILD THE SENTENCE): Sentence frame có thể thay thế thành phần để tạo nhiều câu mới (Ví dụ: I don't know + wh-clause, The thing is + clause, What I mean is + clause).

---

# NGUYÊN TẮC 8 — KHÔNG ÉP TẠO NỘI DUNG
Nếu câu không có từ vựng hoặc cấu trúc nào thực sự đáng học, trả về "vocabulary": [], "structures": []. Không có gì đáng học vẫn là một kết quả hoàn toàn hợp lệ.

---

# NGUYÊN TẮC 9 — BẢN DỊCH TIẾNG VIỆT
Bản dịch tiếng Việt chỉ dùng để hiểu ngữ cảnh, không dịch word-by-word. Tiếng Anh gốc luôn là nguồn chính.

---

# NGUYÊN TẮC 10 — QUY TRÌNH SUY LUẬN NỘI BỘ
Trước khi trả JSON, hãy tự kiểm tra nội bộ:
1. Hiểu đúng ngữ cảnh và nghĩa câu gốc.
2. Tạo paraphrase tự nhiên nhất (Natural Re-expression).
3. Bọc thẻ <mark>...</mark> quanh phần thay đổi.
4. Lọc vocabulary (từ câu gốc hoặc paraphrase) đạt chuẩn Reusability Test.
5. Lọc structures CHỈ TỪ CÂU GỐC (phải là sentence pattern tái sử dụng được).
6. Bọc thẻ <mark>...</mark> quanh cấu trúc trong câu ví dụ (en).
7. Loại bỏ nội dung cơ bản/gượng ép, trả về [] nếu không có gì đáng học.
8. Đảm bảo JSON hợp lệ, đúng schema tuyệt đối.

---

# SCHEMA JSON BẮT BUỘC
{
  "paraphrase": "Câu diễn đạt lại tự nhiên có chứa <mark>...</mark> ở phần thay đổi",
  "vocabulary": [
    {
      "word": "Từ / cụm từ / phrasal verb / idiom",
      "ipa": "/.../",
      "part_of_speech": "idiom | phrasal verb | phrase | verb | noun | adjective | adverb | collocation",
      "register": "casual | neutral | informal | slang | idiomatic | formal",
      "meaning": "Nghĩa tiếng Việt ngắn gọn, sát ngữ cảnh",
      "synonyms": "Từ/cụm đồng nghĩa tự nhiên trong ngữ cảnh hoặc \\"\\"",
      "antonyms": "Từ/cụm trái nghĩa tự nhiên nếu có hoặc \\"\\"",
      "examples": [
        {
          "en": "Ví dụ tiếng Anh có dùng <mark>...</mark> bọc từ/cụm từ mục tiêu",
          "vi": "Dịch nghĩa tiếng Việt"
        }
      ]
    }
  ],
  "structures": [
    {
      "pattern": "Cấu trúc hoặc sentence frame giao tiếp CHỈ lấy từ câu gốc",
      "meaning": "Ý nghĩa và cách dùng thực tế trong câu gốc",
      "examples": [
        {
          "en": "Ví dụ tiếng Anh BẮT BUỘC dùng <mark>...</mark> bọc quanh cấu trúc áp dụng",
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

