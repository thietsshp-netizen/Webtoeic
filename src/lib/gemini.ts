import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-flash-latest",
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
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const model = getModel();
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
      console.warn(`Gemini Analysis failed (Attempt ${attempt}):`, error.message);
      if (attempt < 2) await new Promise(res => setTimeout(res, 3000));
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

export { analyzePart5Question, processPart5Batch };
