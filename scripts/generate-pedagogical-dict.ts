import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

const VOCAB_PATH = "/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/final_found_vocab.txt";
const OUTPUT_PATH = "/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/pedagogical_dictionary.jsonl";

const SYSTEM_PROMPT = `Bạn là một chuyên gia biên soạn giáo trình TOEIC và từ điển Anh-Việt chuyên ngành Kinh tế/Văn phòng.
Nhiệm vụ của bạn là tạo dữ liệu từ điển cho danh sách các từ vựng sau.

YÊU CẦU QUAN TRỌNG:
1. Ngữ cảnh: Ưu tiên tối đa các nghĩa, ví dụ liên quan đến môi trường Văn phòng, Công việc, Kinh doanh, Hợp đồng, Giao tiếp công sở (TOEIC context).
2. Cấu trúc JSON: Phải trả về một MẢNG các đối tượng JSON, mỗi đối tượng cho một từ theo đúng cấu trúc sau:
{
  "word": "từ",
  "meanings": [
    {
      "definition": "Nghĩa tiếng Việt ngắn gọn",
      "ipa": "phiên âm chuẩn",
      "example": "Câu ví dụ tiếng Anh (ngữ cảnh văn phòng)",
      "translation": "Dịch câu ví dụ sang tiếng Việt",
      "synonyms": ["từ đồng nghĩa 1", "từ đồng nghĩa 2"],
      "antonyms": [{"word": "từ trái nghĩa", "meaning": "nghĩa của nó"}]
    }
  ],
  "word_family": [{"word": "từ liên quan (loại từ)", "meaning": "nghĩa"}],
  "common_structures": [{"structure": "cấu trúc hay gặp", "meaning": "nghĩa/cách dùng"}]
}
3. Trả về DUY NHẤT mã JSON, không kèm văn bản giải thích.`;

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateBatch(words: string[]) {
    const prompt = `Danh sách từ: ${words.join(", ")}`;
    
    try {
        const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
        const response = await result.response;
        let text = response.text();
        
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating batch:", error);
        return null;
    }
}

async function main() {
    console.log("🚀 Bắt đầu chạy thử nghiệm 5 từ đầu tiên...");
    
    const allWords = fs.readFileSync(VOCAB_PATH, "utf-8")
        .split("\n")
        .map(w => w.trim())
        .filter(w => w.length > 0);
    
    const testWords = allWords.slice(0, 5);
    console.log(`Words: ${testWords.join(", ")}`);
    
    const results = await generateBatch(testWords);
    
    if (results && Array.isArray(results)) {
        for (const item of results) {
            fs.appendFileSync(OUTPUT_PATH, JSON.stringify(item) + "\n");
            console.log(`✅ Đã tạo xong từ: ${item.word}`);
        }
        console.log(`\n✨ XONG! Kết quả đã lưu vào: ${OUTPUT_PATH}`);
    } else {
        console.log("❌ Thất bại khi tạo dữ liệu. Đang thử lại sau 30 giây...");
        await delay(30000);
        // Retry logic could be added here for the full script
    }
}

main().catch(console.error);
