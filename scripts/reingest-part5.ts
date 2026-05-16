import { prisma } from '../src/lib/prisma';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

async function reingestPart5() {
  console.log("🚀 Bắt đầu quá trình nạp lại dữ liệu Part 5 (Kèm làm giàu từ điển)...");

  const folderPath = path.join(process.cwd(), 'Part 5', 'Part 5-tong hop');

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Thư mục không tồn tại: ${folderPath}`);
    return;
  }

  // 1. Tìm hoặc tạo Test "QUESTION_BANK_PART5"
  let test = await prisma.toeicTest.findFirst({
    where: { title: "QUESTION_BANK_PART5" }
  });

  if (!test) {
    console.log("➕ Tạo mới ToeicTest: QUESTION_BANK_PART5");
    test = await prisma.toeicTest.create({
      data: {
        title: "QUESTION_BANK_PART5",
        description: "Ngân hàng câu hỏi Part 5 tập trung.",
        isPublished: true
      }
    });
  }

  // 2. Tìm hoặc tạo Part 5
  let part5 = await prisma.toeicPart.findFirst({
    where: { testId: test.id, partNumber: 5 }
  });

  if (!part5) {
    console.log("➕ Tạo mới ToeicPart: Part 5");
    part5 = await prisma.toeicPart.create({
      data: {
        testId: test.id,
        partNumber: 5,
        title: "Part 5"
      }
    });
  } else {
    // 3. Xóa dữ liệu cũ nếu Part 5 đã tồn tại
    console.log("🧹 Đang dọn dẹp dữ liệu cũ của Part 5...");
    await prisma.toeicQuestionGroup.deleteMany({
      where: { partId: part5.id }
    });
    console.log(`✅ Đã dọn dẹp xong.`);
  }

  // 4. Đọc các file Excel
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.xlsx'));
  console.log(`📂 Tìm thấy ${files.length} file Excel. Bắt đầu xử lý...`);

  let totalQuestions = 0;
  let totalErrors = 0;

  for (const file of files) {
    console.log(`\n--- Đang xử lý file: ${file} ---`);
    const filePath = path.join(folderPath, file);
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet) as any[];

    console.log(`🔹 Tìm thấy ${rows.length} câu hỏi.`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.AI_JSON) continue;

        const ai = JSON.parse(row.AI_JSON);
        const correctAnswer = (row.Correct_Answer || ai.correctAnswer || '').toString().trim().toUpperCase();

        // Tạo Group
        const group = await prisma.toeicQuestionGroup.create({
          data: {
            partId: part5!.id,
            metadata: {
              day: row.Day,
              type: row.Question_Type,
              book: row.Book,
              test: row.Test,
              status: 'PUBLISHED'
            }
          }
        });

        // Tạo Question
        await prisma.toeicQuestion.create({
          data: {
            groupId: group.id,
            questionNo: parseInt(row.Question_No) || 0,
            questionText: ai.questionText,
            optionA: ai.optionA,
            optionB: ai.optionB,
            optionC: ai.optionC,
            optionD: ai.optionD,
            correctAnswer: correctAnswer,
            explanation: JSON.stringify(ai.explanation),
            metadata: {
              day: row.Day,
              type: row.Question_Type,
              book: row.Book,
              test: row.Test,
              translation: ai.translation,
              vocabulary: ai.vocabulary?.map((v: any) => v.word) || []
            }
          }
        });

        // --- LÀM GIÀU TỪ ĐIỂN ---

        // 1. Xử lý mục vocabulary có sẵn
        if (ai.vocabulary && Array.isArray(ai.vocabulary)) {
          for (const v of ai.vocabulary) {
            if (!v.word) continue;
            await upsertWord(v.word, {
              ipa: v.ipa || v.ipa_uk || v.ipa_us,
              ipa_uk: v.ipa_uk,
              ipa_us: v.ipa_us,
              meaning: v.meaning,
              examples: v.examples || [],
              synonyms: v.synonyms,
              antonyms: v.antonyms
            });
          }
        }

        // 2. Xử lý từ đáp án đúng (tạo ví dụ từ chính câu hỏi)
        const correctWord = ai[`option${correctAnswer}`];
        const breakdown = ai.explanation?.options_breakdown?.[correctAnswer];

        if (correctWord && breakdown) {
          // Xử lý câu ví dụ từ đề bài
          const cleanedText = ai.questionText.replace(/^\d+[\.\s]*/, '').trim(); // Bỏ "101. "
          const filledSentence = cleanedText.replace(/_{2,}|-{2,}/g, correctWord);

          const newExample = {
            en: filledSentence,
            vi: ai.translation || ""
          };

          await upsertWord(correctWord, {
            ipa: breakdown.ipa_uk || breakdown.ipa_us,
            ipa_uk: breakdown.ipa_uk,
            ipa_us: breakdown.ipa_us,
            meaning: breakdown.meaning,
            examples: [newExample],
            synonyms: breakdown.synonyms,
            antonyms: breakdown.antonyms
          });
        }

        totalQuestions++;
        if (totalQuestions % 50 === 0) {
          console.log(`✅ Đã nạp xong ${totalQuestions} câu...`);
        }

      } catch (err: any) {
        totalErrors++;
        console.error(`❌ Lỗi tại file ${file}, dòng ${i + 2}:`, err.message);
      }
    }
  }

  console.log(`\n✨ HOÀN THÀNH!`);
  console.log(`📊 Tổng số câu hỏi đã nạp: ${totalQuestions}`);
  console.log(`❌ Tổng số lỗi gặp phải: ${totalErrors}`);
}

async function upsertWord(word: string, data: any) {
  const wordClean = word.toLowerCase().trim();
  if (!wordClean) return;

  const existing = await prisma.dictionary.findUnique({
    where: { word: wordClean }
  });

  const synonyms = formatArray(data.synonyms);
  const antonyms = formatArray(data.antonyms);
  const newExamples = Array.isArray(data.examples) ? data.examples : [];

  if (existing) {
    // Trộn ví dụ, tránh trùng lặp câu tiếng Anh
    const existingExamples = (existing.examples as any[]) || [];
    const mergedExamples = [...existingExamples];

    for (const ex of newExamples) {
      if (!mergedExamples.some(e => e.en.toLowerCase() === ex.en.toLowerCase())) {
        mergedExamples.push(ex);
      }
    }

    await prisma.dictionary.update({
      where: { id: existing.id },
      data: {
        ipa: data.ipa || existing.ipa,
        ipa_uk: data.ipa_uk || existing.ipa_uk,
        ipa_us: data.ipa_us || existing.ipa_us,
        meaning: data.meaning || existing.meaning,
        examples: mergedExamples,
        synonyms: Array.from(new Set([...existing.synonyms, ...synonyms])),
        antonyms: Array.from(new Set([...existing.antonyms, ...antonyms])),
      }
    });
  } else {
    await prisma.dictionary.create({
      data: {
        word: wordClean,
        ipa: data.ipa,
        ipa_uk: data.ipa_uk,
        ipa_us: data.ipa_us,
        meaning: data.meaning,
        examples: newExamples,
        synonyms: synonyms,
        antonyms: antonyms,
      }
    });
  }
}

function formatArray(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(i => i.toString());
  if (typeof input === 'string') return input.split(',').map(s => s.trim());
  return [input.toString()];
}

reingestPart5()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
