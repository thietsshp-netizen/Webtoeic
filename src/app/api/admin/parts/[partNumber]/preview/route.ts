import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ partNumber: string }> }
) => {
  const { partNumber: partNumberStr } = await params;
  const partNumber = parseInt(partNumberStr);
  const body = await request.json();
  const { filters = {} } = body;

  try {
    let items: any[] = [];

    if (partNumber === 7) {
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
              const targetNorm = normalize("Cross-reference");

              jsonQs.forEach((jq: any) => {
                const possibleTypes = [
                  jq.type,
                  jq.Question_Type,
                  jq.question_type,
                  ...(Array.isArray(jq.tags) ? jq.tags : [jq.tags])
                ].filter(Boolean).map(t => normalize(String(t)));

                if (possibleTypes.some(t => t !== "" && t === targetNorm)) {
                  const qNo = jq.questionNo || jq.question_no || jq.number;
                  const dbQ = g.questions.find(q => String(q.questionNo) === String(qNo));
                  if (dbQ) {
                    targetQuestions.push({ ...dbQ, group: g });
                  }
                }
              });
            } catch (e) { }
          });
          // Sắp xếp đồng nhất
          targetQuestions.sort((a, b) => a.questionNo - b.questionNo);
        } else {
          // Câu hỏi đơn theo dạng (147-171)
          const allQ = await prisma.toeicQuestion.findMany({
            where: {
              group: { part: { partNumber: 7 } },
              questionNo: { gte: 147, lte: 171 }
            },
            include: { group: true }
          });
          targetQuestions = allQ.filter(q => {
            const qMeta = (typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata) as any;
            const targetNorm = normalize(chunk.base);
            
            // Thu thập tất cả các giá trị phân loại tiềm năng
            const possibleTypes = [
              qMeta?.type,
              qMeta?.question_type,
              qMeta?.Question_Type,
              ...(Array.isArray(qMeta?.tags) ? qMeta.tags : [qMeta?.tags])
            ].filter(Boolean).map(t => normalize(String(t)));

            // So sánh BẰNG TUYỆT ĐỐI
            return possibleTypes.some(t => t !== "" && t === targetNorm);
          });
        }

        items = targetQuestions.slice(chunk.start, chunk.end).map(q => ({
          id: q.groupId,
          targetQuestionId: q.id,
          book: (q.group.metadata as any)?.book || (q.group.metadata as any)?.Book || "Unknown",
          test: (q.group.metadata as any)?.test || (q.group.metadata as any)?.Test || 0,
          metadata: { ...q.group.metadata, ...q.metadata },
          questionRange: q.questionNo.toString(),
          previewText: q.questionText || `Câu ${q.questionNo}: ${q.metadata?.type || "General"}`
        }));
      } else {
        const allGroups = await prisma.toeicQuestionGroup.findMany({
          where: { part: { partNumber: 7 } },
          include: { questions: true }
        });

        let targetGroups = allGroups;
        if (filters.complexity) {
          const comp = filters.complexity.toLowerCase();
          targetGroups = targetGroups.filter(g => String((g.metadata as any)?.complexity || "single").toLowerCase().includes(comp));
        }

        if (filters.passageType) {
          const chunk = parseChunk(filters.passageType);
          if (chunk.base.startsWith("Hỗn hợp")) {
            const categories = chunk.base.replace("Hỗn hợp:", "").split(",").map(c => normalize(c.trim()));
            targetGroups = targetGroups.filter(g => {
              const gCat = normalize((g.metadata as any)?.category || "");
              return categories.some(c => gCat.includes(c));
            });
          } else if (chunk.base !== "Đoạn đôi" && chunk.base !== "Đoạn ba") {
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
              
              if (label === "Biểu mẫu & Lịch trình") {
                return cat.includes("schedule") || cat.includes("menu") || cat.includes("coupon") || cat.includes("flyer") || cat.includes("chart") || cat.includes("table") || cat.includes("checklist") || cat.includes("list") || cat.includes("price");
              }
              if (label === "Blog & Tương tác") {
                const isMain = cat.includes("email") || cat.includes("article") || cat.includes("advertisement") || cat.includes("letter") || cat.includes("notice") || cat.includes("web page") ||
                               cat.includes("information") || cat.includes("announcement") || cat.includes("memo") || cat.includes("report") || cat.includes("form") ||
                               cat.includes("schedule") || cat.includes("menu") || cat.includes("coupon") || cat.includes("flyer") || cat.includes("chart") || cat.includes("table") || cat.includes("checklist") || cat.includes("list") || cat.includes("price");
                return !isMain;
              }
              return normalize(cat) === normalize(label);
            });
          }
          // Lọc theo cụm (chunk) - Chế độ 30 đoạn
          const allTargetGroups = [...targetGroups];
          targetGroups = allTargetGroups.slice(chunk.start, chunk.end);
        }

        items = targetGroups.map(g => {
          const qNos = g.questions.map((q: any) => q.questionNo).sort((a: number, b: number) => a - b);
          const range = qNos.length > 1 ? `${qNos[0]} - ${qNos[qNos.length - 1]}` : (qNos[0] || "??");
          return {
            id: g.id,
            book: (g.metadata as any)?.book || (g.metadata as any)?.Book || "Unknown",
            test: (g.metadata as any)?.test || (g.metadata as any)?.Test || 0,
            metadata: g.metadata,
            questionRange: range,
            previewText: g.passageText ? g.passageText.substring(0, 100) + "..." : `Nhóm câu hỏi ${range}`
          };
        });
      }
    } else {
      if (partNumber === 2 || partNumber === 5) {
        // ... Part 2 & 5 logic ...
        const allQuestions = await prisma.toeicQuestion.findMany({
          where: { group: { part: { partNumber } } },
          include: { group: true }
        });
        items = allQuestions.filter((q: any) => {
          const qMeta = q.metadata as any;
          const gMeta = q.group.metadata as any;
          if (partNumber === 2 && filters.type) return String(qMeta?.type || "").toLowerCase() === filters.type.toLowerCase();
          if (partNumber === 5) {
            if (filters.book && String(gMeta?.Book || gMeta?.book || "").trim().toLowerCase() !== String(filters.book).trim().toLowerCase()) return false;
            if (filters.test && String(gMeta?.Test || gMeta?.test || "").trim().toString() !== String(filters.test).trim().toString()) return false;
            if (filters.type) return String(qMeta?.Question_Type || qMeta?.type || "").trim().toLowerCase() === String(filters.type).trim().toLowerCase();
          }
          return true;
        }).map(q => ({
          id: q.id,
          book: (q.group.metadata as any)?.Book || (q.group.metadata as any)?.book || "Unknown",
          test: (q.group.metadata as any)?.Test || (q.group.metadata as any)?.test || 0,
          metadata: q.metadata,
          questionText: q.questionText
        })).slice(0, 1000);
      } else {
        const allGroups = await prisma.toeicQuestionGroup.findMany({
          where: { part: { partNumber } },
          include: { questions: true }
        });

        let targetGroups = allGroups;

        if (partNumber === 1 && filters.picType) {
          targetGroups = targetGroups.filter(g => String((g.metadata as any)?.PicType || "").toLowerCase() === filters.picType.toLowerCase());
        }

        if ((partNumber === 3 || partNumber === 4)) {
          if (filters.passageType) {
            const parseChunk = (label: string) => {
              const match = String(label || "").match(/(.+) \((\d+)-(\d+)\)/);
              if (!match) return { base: label, start: 0, end: 1000 };
              return {
                base: match[1].trim(),
                start: parseInt(match[2]) - 1,
                end: parseInt(match[3])
              };
            };
            const chunk = parseChunk(filters.passageType);
            const isGraphicPack = chunk.base === "Có hình";
            
            targetGroups = targetGroups.filter(g => {
              const m = g.metadata as any || {};
              const hasGraphic = (m.pic_id && String(m.pic_id).trim().length > 0) || 
                                 (m.PicID && String(m.PicID).trim().length > 0) ||
                                 (g.imageUrl && String(g.imageUrl).trim().length > 0) ||
                                 (String(m.has_graphic || "").toLowerCase().trim() === "yes");
              return isGraphicPack ? hasGraphic : !hasGraphic;
            });
            targetGroups = targetGroups.slice(chunk.start, chunk.end);
          } else if (filters.hasGraphic) {
             targetGroups = targetGroups.filter(g => {
                const m = g.metadata as any || {};
                const hasGraphic = (m.pic_id && String(m.pic_id).trim().length > 0) || 
                                   (m.PicID && String(m.PicID).trim().length > 0) ||
                                   (g.imageUrl && String(g.imageUrl).trim().length > 0) ||
                                   (String(m.has_graphic || "").toLowerCase().trim() === "yes");
                return filters.hasGraphic === 'yes' ? hasGraphic : !hasGraphic;
             });
          }
        }

        if (partNumber === 6 && filters.passageType) {
          targetGroups = targetGroups.filter(g => String((g.metadata as any)?.PassageType || "").toLowerCase() === filters.passageType.toLowerCase());
        }

        items = targetGroups.map(g => {
          const qNos = g.questions.map((q: any) => q.questionNo).sort((a: number, b: number) => a - b);
          const range = qNos.length > 1 ? `${qNos[0]} - ${qNos[qNos.length - 1]}` : (qNos[0] || "??");
          return {
            id: g.id,
            book: (g.metadata as any)?.book || (g.metadata as any)?.Book || "Unknown",
            test: (g.metadata as any)?.test || (g.metadata as any)?.Test || 0,
            metadata: g.metadata,
            questionRange: range,
            previewText: g.passageText ? g.passageText.substring(0, 100) + "..." : `Nhóm câu hỏi ${range}`
          };
        }).slice(0, 100); // Increased slice for preview
      }
    }

    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
};
