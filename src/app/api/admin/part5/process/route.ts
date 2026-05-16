import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzePart5Question } from '@/lib/gemini';

// Hàm trì hoãn để lách giới hạn 15 RPM của Gemini Free
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { questions } = await request.json();

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ success: false, error: "Invalid questions data" }, { status: 400 });
    }

    // Đảm bảo có cấu trúc Test -> Part gốc
    let questionBankTest = await prisma.toeicTest.findFirst({
      where: { title: "QUESTION_BANK_PART5" }
    });

    if (!questionBankTest) {
      questionBankTest = await prisma.toeicTest.create({
        data: {
          title: "QUESTION_BANK_PART5",
          description: "Nơi lưu trữ tất cả các câu hỏi Part 5 từ Excel.",
          isPublished: false,
        }
      });
    }

    let part5 = await prisma.toeicPart.findFirst({
      where: { testId: questionBankTest.id, partNumber: 5 }
    });

    if (!part5) {
      part5 = await prisma.toeicPart.create({
        data: {
          testId: questionBankTest.id,
          partNumber: 5,
          title: "Part 5",
        }
      });
    }

    const savedQuestions = [];

    // XỬ LÝ TUẦN TỰ (Sequential)
    for (let i = 0; i < questions.length; i++) {
      const source = questions[i] as any;
      const qNo = parseInt(source.questionNo) || 0;

      // --- 1. SMART RESUME: Kiểm tra trùng lặp trước khi gọi AI ---
      const existing = await prisma.toeicQuestion.findFirst({
        where: {
          questionNo: qNo,
          group: {
            partId: part5.id,
            metadata: {
              path: ['book'],
              equals: source.book
            },
            AND: {
              metadata: {
                path: ['test'],
                equals: source.test
              }
            }
          }
        },
        include: { group: true }
      });
      
      let finalExisting = existing;
      if (existing) {
        const groupMeta = existing.group.metadata as any;
        // Kiểm tra đúng bộ tứ: Book + Test + Part (đã lọc ở trên) + QuestionNo (đã lọc ở trên)
        if (
          groupMeta.book !== source.book || 
          groupMeta.test !== source.test
        ) {
          finalExisting = null; // Khác Book hoặc Test thì là câu khác
        }
      }

      if (finalExisting) {
        const meta = finalExisting.group.metadata as any;
        // Kiểm tra sâu các tiêu chí định danh
        if (meta &&
          meta.day === source.day &&
          meta.type === source.type &&
          meta.book === source.book &&
          meta.test === source.test) {
          console.log(`[Smart Skip] Question ${qNo} (${source.day}) already exists. Skipping Gemini call.`);
          savedQuestions.push(finalExisting);
          continue;
        }
      }

      // --- 2. XỬ LÝ NỘI DUNG (Dùng Pre-analyzed hoặc gọi AI) ---
      let ai = source.preAnalyzedData;

      if (ai) {
        console.log(`[Local Sync] Question ${qNo} using pre-analyzed data from Excel.`);
      } else {
        console.log(`[Gemini Call] Analyzing Question ${qNo} via AI...`);
        ai = await analyzePart5Question(source.rawText);
      }

      if (!ai) continue;

      // --- 3. XỬ LÝ TỪ VỰNG ---
      if (ai.vocabulary && Array.isArray(ai.vocabulary)) {
        for (const v of ai.vocabulary) {
          const synonyms = Array.isArray(v.synonyms) ? v.synonyms : (v.synonyms ? v.synonyms.split(',').map((s: string) => s.trim()) : []);
          const antonyms = Array.isArray(v.antonyms) ? v.antonyms : (v.antonyms ? v.antonyms.split(',').map((a: string) => a.trim()) : []);

          await (prisma as any).dictionary.upsert({
            where: { word: v.word.toLowerCase() },
            update: {
              ipa: v.ipa,
              ipa_uk: v.ipa_uk,
              ipa_us: v.ipa_us,
              meaning: v.meaning,
              examples: v.examples,
              synonyms: synonyms,
              antonyms: antonyms,
            },
            create: {
              word: v.word.toLowerCase(),
              ipa: v.ipa,
              ipa_uk: v.ipa_uk,
              ipa_us: v.ipa_us,
              meaning: v.meaning,
              examples: v.examples,
              synonyms: synonyms,
              antonyms: antonyms,
            }
          });
        }
      }

      // --- 4. TẠO QUESTION GROUP ---
      const groupData = {
        partId: part5.id,
        metadata: {
          day: source.day,
          type: source.type,
          book: source.book,
          test: source.test,
          status: 'PUBLISHED'
        }
      };

      const group = await (prisma.toeicQuestionGroup as any).upsert({
        where: { id: finalExisting?.groupId || 'new-group' },
        update: groupData,
        create: groupData
      });

      const questionData = {
        groupId: group.id,
        questionNo: qNo,
        questionText: ai.questionText,
        optionA: ai.optionA,
        optionB: ai.optionB,
        optionC: ai.optionC,
        optionD: ai.optionD,
        correctAnswer: source.correctKey || ai.correctAnswer,
        explanation: JSON.stringify(ai.explanation),
        metadata: {
          day: source.day,
          type: source.type,
          book: source.book,
          test: source.test,
          translation: ai.translation,
          vocabulary: ai.vocabulary?.map((v: any) => v.word) || [],
          status: 'PUBLISHED'
        }
      };

      const question = await (prisma.toeicQuestion as any).upsert({
        where: { id: finalExisting?.id || 'new-question' },
        update: questionData,
        create: questionData
      });

      savedQuestions.push(question);

      // --- 6. DELAY (Chỉ khi thực sự gọi AI mới cần chờ 5.5s) ---
      if (i < questions.length - 1 && !source.preAnalyzedData) {
        console.log(`[Gemini Safe] Done ${i + 1}/${questions.length}. Waiting 5.5s for next API call...`);
        await delay(5500);
      }
    }

    return NextResponse.json({
      success: true,
      count: savedQuestions.length,
      questions: savedQuestions
    });

  } catch (error: any) {
    console.error("Part 5 Processing Error:", error);

    // Phát hiện lỗi vượt hạn mức (Quota/Spending Cap)
    const isQuotaError = error.message?.includes('429') ||
      error.message?.includes('quota') ||
      error.message?.includes('spending cap');

    const status = isQuotaError ? 429 : 500;

    return NextResponse.json({
      success: false,
      error: error.message,
      isQuotaError
    }, { status });
  }
}
