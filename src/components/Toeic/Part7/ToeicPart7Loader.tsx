import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToeicPart7Player from "./ToeicPart7Player";
import fs from 'fs';
import path from 'path';
const normalize = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, '');
const parseChunk = (label: string) => {
  const match = String(label || "").match(/(.+) \((\d+)-(\d+)\)/);
  if (!match) return { base: label, start: 0, end: 1000 };
  return {
    base: match[1].trim(),
    start: parseInt(match[2]) - 1,
    end: parseInt(match[3])
  };
};

const debugLog = (msg: string) => {
  try {
    const scratchDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir);
    const logPath = path.join(scratchDir, 'loader_debug.log');
    fs.appendFileSync(logPath, `${new Date().toISOString()} ${msg}\n`);
  } catch (e) { }
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * Loader cho Part 7: Reading Comprehension
 * CHẠY Ở SERVER (Server Component)
 * Tích hợp logic "Gói bài tập thông minh" & Gộp nhóm theo yêu cầu của giáo viên
 */
export default async function ToeicPart7LoaderV2({
  content,
  lessonId,
  courseId,
  nextLessonId,
  jumpToQ,
  videoExplanation
}: {
  content: string;
  lessonId: string;
  courseId?: string;
  nextLessonId?: string;
  jumpToQ?: string;
  videoExplanation?: any;
}) {
  console.log(`[PART7_LOADER] Executing for lesson: ${lessonId}`);
  const globalTargetedIds = new Set<string>();
  let filterGroups: any[] = [];
  let filters: any = {};

  try {
    // 1. Phân tích cấu hình bài học (Filters)
    try {
      const parsed = JSON.parse(content || "{}");
      filters = Array.isArray(parsed) ? (parsed[0]?.filters || {}) : (parsed.filters || parsed);
    } catch (e) {
      console.error("JSON Parse error in Loader:", e);
    }


    // 2. CHẾ ĐỘ CÂU HỎI (Hỗ trợ Cross-Reference & Grouping)
    if (filters.selectionMode === 'question' && filters.questionType) {
      const chunk = parseChunk(filters.questionType);
      let targetQuestions: any[] = [];

      if (chunk.base === "Câu hỏi Cross-reference") {
        const allGroups = await prisma.toeicQuestionGroup.findMany({
          where: { part: { partNumber: 7 } },
          include: { questions: true }
        });

        allGroups.forEach(g => {
          try {
            const parsed = JSON.parse(g.passageText || "{}");
            const jsonQs = parsed.questions || [];
            jsonQs.forEach((jq: any) => {
              const typeRaw = String(jq.type || jq.Question_Type || jq.question_type || jq.meta?.type || "").toLowerCase();
              const typeClean = typeRaw.replace(/[^a-z]/g, '');
              if (typeClean.includes("crossreference")) {
                const dbQ = g.questions.find(q => String(q.questionNo) === String(jq.questionNo || jq.question_no));
                if (dbQ) {
                  globalTargetedIds.add(dbQ.id);
                  globalTargetedIds.add(`qno-${dbQ.questionNo}`); // LƯỚI AN TOÀN KÉP
                  targetQuestions.push({ ...dbQ, group: g });
                }
              }
            });
          } catch (e) { }
        });
        targetQuestions.sort((a, b) => a.questionNo - b.questionNo);
      } else {
        const allQ = await prisma.toeicQuestion.findMany({
          where: {
            group: { part: { partNumber: 7 } },
            questionNo: { gte: 147, lte: 171 }
          },
          include: { group: { include: { questions: true } } }
        });

        const targetNorm = normalize(chunk.base);
        targetQuestions = allQ.filter(q => {
          const gMeta = q.group.metadata as any;
          if (filters.book && !String(gMeta?.book || gMeta?.Book || "").toLowerCase().includes(filters.book.toLowerCase())) return false;
          if (filters.test && String(gMeta?.test || gMeta?.Test || "") !== String(filters.test)) return false;

          const qMeta = (typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata) as any;
          
          // Thu thập tất cả các giá trị phân loại tiềm năng
          const possibleTypes = [
            (q as any).type,
            qMeta?.type,
            qMeta?.question_type,
            qMeta?.Question_Type,
            qMeta?.meta?.type,
            qMeta?.metadata?.type,
            ...(Array.isArray(qMeta?.tags) ? qMeta.tags : [qMeta?.tags])
          ].filter(Boolean).map(t => normalize(String(t)));

          // So sánh linh hoạt để đảm bảo khớp ngay cả khi tên hơi khác
          const isMatch = possibleTypes.some(t => {
            if (!t) return false;
            const cleanT = t.replace('cauhoi', '').replace('dangcauhoi', '');
            const cleanTarget = targetNorm.replace('cauhoi', '').replace('dangcauhoi', '');
            return cleanTarget.includes(cleanT) || cleanT.includes(cleanTarget);
          });
          
          if (isMatch) {
            globalTargetedIds.add(q.id);
            globalTargetedIds.add(`qno-${q.questionNo}`); // THÊM MẮT LƯỚI 2: SỐ CÂU
            debugLog(`[MATCH_FOUND] Q#${q.questionNo} (Group: ${q.groupId}) matches ${targetNorm}.`);
          }
          return isMatch;
        });

        debugLog(`[FILTER_RESULT] Found ${targetQuestions.length} questions for target: ${targetNorm}`);
      }

      // Slice lấy đúng chunk câu hỏi (Mỗi cụm 30 câu)
      const slicedQs = targetQuestions.slice(chunk.start, chunk.end);

      // Gộp các câu hỏi vào Group, giữ lại TOÀN BỘ câu hỏi trong group để có ID thật cho việc gắn cờ
      const groupMap = new Map<string, any>();

      slicedQs.forEach(q => {
        if (!groupMap.has(q.groupId)) {
          groupMap.set(q.groupId, {
            ...q.group
          });
        }
      });

      filterGroups = Array.from(groupMap.values());
    }
    // 3. CHẾ ĐỘ ĐOẠN VĂN
    else {
      // Lấy tất cả nhóm, lọc Part 7 trong JS
      const allGroups = await prisma.toeicQuestionGroup.findMany({
        include: {
          part: true,
          questions: { orderBy: { questionNo: 'asc' } }
        }
      });

      let targetGroups = allGroups.filter(g => {
        if (g.part?.partNumber !== 7) return false;

        const m = g.metadata as any;
        if (filters.book && !String(m?.book || m?.Book || "").toLowerCase().includes(filters.book.toLowerCase())) return false;
        if (filters.test && String(m?.test || m?.Test || "") !== String(filters.test)) return false;

        if (filters.complexity) {
          const comp = filters.complexity.toLowerCase();
          const gComp = String(m?.complexity || m?.Complexity || "single").toLowerCase();
          if (!gComp.includes(comp)) return false;
        }
        return true;
      });

      if (filters.passageType) {
        const chunk = parseChunk(filters.passageType);
        const label = chunk.base;

        targetGroups = targetGroups.filter(g => {
          const m = g.metadata as any;
          const cat = String(m?.category || (Array.isArray(m?.categories) ? m.categories[0] : "") || "khác").toLowerCase();

          if (label === "Email") return cat.includes("email");
          if (label === "Article") return cat.includes("article");
          if (label === "Advertisement") return cat.includes("advertisement");
          if (label === "Letter") return cat.includes("letter");
          if (label === "Notice") return cat.includes("notice");
          if (label === "Web Page") return cat.includes("web page");
          if (label === "Information") return cat.includes("information");
          if (label === "Announcement") return cat.includes("announcement");
          if (label === "Memo") return cat.includes("memo");
          if (label === "Report") return cat.includes("report");
          if (label === "Form") return cat.includes("form");
          if (label === "Text-message Chain") return cat.includes("text-message chain") || cat.includes("text-message") || cat.includes("text message");
          if (label === "Chat Discussion") return cat.includes("chat discussion") || cat.includes("chat");

          if (label === "Biểu mẫu & Lịch trình") {
            return cat.includes("schedule") || cat.includes("menu") || cat.includes("coupon") || cat.includes("flyer") || cat.includes("chart") || cat.includes("table") || cat.includes("checklist") || cat.includes("list") || cat.includes("price");
          }
          if (label.startsWith("Blog & Tương tác")) {
            const isMain = cat.includes("email") || cat.includes("article") || cat.includes("advertisement") || cat.includes("letter") || cat.includes("notice") || cat.includes("web page") ||
              cat.includes("information") || cat.includes("announcement") || cat.includes("memo") || cat.includes("report") || cat.includes("form") ||
              cat.includes("text-message") || cat.includes("chat") ||
              cat.includes("schedule") || cat.includes("menu") || cat.includes("coupon") || cat.includes("flyer") || cat.includes("chart") || cat.includes("table") || cat.includes("checklist") || cat.includes("list") || cat.includes("price");
            return !isMain;
          }
          return normalize(cat) === normalize(label);
        });

        // Slice theo cụm (Chế độ 30 đoạn)
        targetGroups = targetGroups.slice(chunk.start, chunk.end);
      }
      filterGroups = targetGroups;

      // Đảm bảo nhóm chứa jumpToQ luôn được bao gồm nếu nó nằm ngoài slice/filter
      if (jumpToQ) {
        const isIncluded = filterGroups.some(g => g.questions.some((q: any) => q.id === jumpToQ || String(q.questionNo) === jumpToQ));
        if (!isIncluded) {
          // Tìm trong toàn bộ allGroups (đã fetch ở trên)
          const targetGroup = allGroups.find(g => g.questions.some((q: any) => q.id === jumpToQ || String(q.questionNo) === jumpToQ));
          if (targetGroup) {
            filterGroups.push(targetGroup);
            // Sắp xếp lại theo questionNo để giữ thứ tự logic
            filterGroups.sort((a, b) => {
               const aMin = Math.min(...a.questions.map((q:any) => q.questionNo || 999));
               const bMin = Math.min(...b.questions.map((q:any) => q.questionNo || 999));
               return aMin - bMin;
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("[PART7_LOADER_ERROR]", error);
  }

  // Lấy base type để Player highlight chính xác (bỏ phần số "7. " và phần (1-30)...)
  let baseTargetType = String(filters?.questionType || "");
  baseTargetType = baseTargetType.replace(/^\d+\.\s*/, ''); // Xóa "7. " ở đầu
  if (baseTargetType.includes('(')) {
    baseTargetType = baseTargetType.split('(')[0].trim();
  }

  // 4. MAPPING ID THẬT TỪ DATABASE (Cực kỳ quan trọng để lưu Flag/Note)
  const finalData = filterGroups.map(g => {
    const dbQuestions = g.questions || [];
    const metadata = g.metadata || {};
    // Nếu g.passageText là JSON, nó có thể chứa danh sách câu hỏi riêng
    let questionsFromMeta = [];
    if (typeof g.passageText === 'string' && g.passageText.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(g.passageText);
        questionsFromMeta = parsed.questions || [];
      } catch (e) { }
    }

    const sourceQuestions = questionsFromMeta.length > 0 ? questionsFromMeta : dbQuestions;

    const mappedQuestions = sourceQuestions.map((q: any, idx: number) => {
      const qNo = q.questionNo || q.question_no || q.number;
      // Tìm ID thật trong Database dựa trên questionNo
      const dbMatch = dbQuestions.find((dq: any) => String(dq.questionNo) === String(qNo));

      if (!dbMatch) {
        debugLog(`[PART7_LOADER] ⚠️ No DB match for Q#${qNo} in group ${g.id}. DB Qs available: ${dbQuestions.map((dq: any) => dq.questionNo).join(', ')}`);
      } else {
        debugLog(`[PART7_LOADER] ✅ Matched Q#${qNo} -> DB UUID: ${dbMatch.id}`);
      }

      // Dán nhãn isTarget dựa trên Set toàn cục (Lưới an toàn kép: ID + Số câu)
      const isTarget = (dbMatch && globalTargetedIds.has(dbMatch.id)) || 
                       (q.id && globalTargetedIds.has(q.id)) ||
                       (qNo && globalTargetedIds.has(`qno-${qNo}`));

      return {
        ...q,
        dbId: dbMatch?.id,
        id: dbMatch?.id || q.id, // Ưu tiên dùng ID thật từ Database
        isTarget: !!isTarget
      };
    });

    return { ...g, questions: mappedQuestions };
  });

  // 5. Nạp tiến độ ban đầu (Flags/Notes)
  const session = await getServerSession(authOptions) as any;
  let initialProgress = {};
  if (session?.user?.id && finalData.length > 0) {
    const questionIds = finalData.flatMap(g => g.questions.map((q: any) => q.id)).filter(Boolean);
    const attempts = await prisma.questionAttempt.findMany({
      where: {
        userId: session.user.id,
        questionId: { in: questionIds }
      }
    });

    initialProgress = attempts.reduce((acc: any, curr) => {
      acc[curr.questionId] = {
        isCorrect: curr.isCorrect,
        userAnswer: curr.userAnswer,
        isFlagged: curr.isFlagged,
        flagColor: curr.flagColor,
        flagNote: curr.flagNote
      };
      return acc;
    }, {});
  }

  // 6. Render Player
  return (
    <ToeicPart7Player
      data={finalData}
      lessonId={lessonId}
      courseId={courseId}
      nextLessonId={nextLessonId}
      initialProgress={initialProgress}
      targetQuestionType={baseTargetType}
      jumpTo={jumpToQ ? { id: jumpToQ, ts: Date.now() } : undefined}
      videoExplanation={videoExplanation}
    />
  );
}
