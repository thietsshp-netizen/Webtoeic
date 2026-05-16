import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ partNumber: string }> }
) => {
  const { partNumber: partNumberStr } = await params;
  const partNumber = parseInt(partNumberStr);

  try {
    const filters: any = {
      picTypes: [],
      types: [],
      passageTypes: [],
      complexity: [],
      questionTypes: [],
      books: [],
      tests: []
    };

    const groups = await prisma.toeicQuestionGroup.findMany({
      where: { part: { partNumber } },
      select: { id: true, metadata: true, imageUrl: true }
    });

    const displayNormalize = (cat: string) => {
      if (!cat) return "";
      return cat.toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    filters.books = Array.from(new Set(groups.map(g => {
      const m = g.metadata as any;
      return m?.Book || m?.book;
    }).filter(Boolean))).sort();

    filters.tests = Array.from(new Set(groups.map(g => {
      const m = g.metadata as any;
      return m?.Test || m?.test;
    }).filter(Boolean))).sort((a: any, b: any) => {
      const na = parseInt(a);
      const nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });

    if (partNumber === 1) {
      filters.picTypes = Array.from(new Set(groups.map(g => (g.metadata as any)?.PicType).filter(Boolean))).sort();
    }
    else if (partNumber === 2) {
      const questions = await prisma.toeicQuestion.findMany({
        where: { group: { part: { partNumber: 2 } } },
        select: { metadata: true }
      });
      filters.types = Array.from(new Set(questions.map(q => (q.metadata as any)?.type).filter(Boolean))).sort();
    }
    else if (partNumber === 3 || partNumber === 4) {
      const graphicGroups = groups.filter(g => {
        const m = g.metadata as any || {};
        return (m.pic_id && String(m.pic_id).trim().length > 0) || 
               (m.PicID && String(m.PicID).trim().length > 0) ||
               (g.imageUrl && String(g.imageUrl).trim().length > 0) ||
               (String(m.has_graphic || "").toLowerCase().trim() === "yes");
      });
      const noGraphicGroups = groups.filter(g => {
        const m = g.metadata as any || {};
        const hasGraphic = (m.pic_id && String(m.pic_id).trim().length > 0) || 
                           (m.PicID && String(m.PicID).trim().length > 0) ||
                           (g.imageUrl && String(g.imageUrl).trim().length > 0) ||
                           (String(m.has_graphic || "").toLowerCase().trim() === "yes");
        return !hasGraphic;
      });

      const packs: string[] = [];
      for (let i = 0; i < graphicGroups.length; i += 30) {
        const end = Math.min(i + 30, graphicGroups.length);
        packs.push(`Có hình (${i + 1}-${end})`);
      }
      for (let i = 0; i < noGraphicGroups.length; i += 30) {
        const end = Math.min(i + 30, noGraphicGroups.length);
        packs.push(`Không có hình (${i + 1}-${end})`);
      }
      filters.passageTypes = packs;
    }
    else if (partNumber === 5) {
      const questions = await prisma.toeicQuestion.findMany({
        where: { group: { part: { partNumber: 5 } } },
        select: { metadata: true }
      });
      filters.types = Array.from(new Set(questions.map(q => String((q.metadata as any)?.Question_Type || "").trim()).filter(Boolean))).sort();
    }
    else if (partNumber === 6) {
      filters.passageTypes = Array.from(new Set(groups.map(g => (g.metadata as any)?.PassageType).filter(Boolean))).sort();
    }
    else if (partNumber === 7) {
      const categoriesByComplexity: Record<string, string[]> = {
        single: [],
        double: [],
        triple: []
      };

      // 1. Phân loại Đoạn Đơn (Single Passages) theo Nhóm chi tiết
      const singleGroups = groups.filter(g => {
        const m = g.metadata as any;
        const comp = String(m?.complexity || m?.Complexity || "single").toLowerCase();
        return comp === "single";
      });

      const categorizedGroups: Record<string, any[]> = {
        "Email": [],
        "Article": [],
        "Advertisement": [],
        "Letter": [],
        "Notice": [],
        "Web Page": [],
        "Information": [],
        "Announcement": [],
        "Memo": [],
        "Report": [],
        "Form": [],
        "Biểu mẫu & Lịch trình": [], // Schedule, Menu, Coupon, Flyer, Chart, Table, Checklist, etc.
        "Blog & Tương tác": [] // Blog, Forum, Chat, Review, etc.
      };

      singleGroups.forEach(g => {
        const m = g.metadata as any;
        let cat = String(m?.category || (Array.isArray(m?.categories) ? m.categories[0] : "") || "Khác").toLowerCase();
        
        if (cat.includes("email")) categorizedGroups["Email"].push(g);
        else if (cat.includes("article")) categorizedGroups["Article"].push(g);
        else if (cat.includes("advertisement")) categorizedGroups["Advertisement"].push(g);
        else if (cat.includes("letter")) categorizedGroups["Letter"].push(g);
        else if (cat.includes("notice")) categorizedGroups["Notice"].push(g);
        else if (cat.includes("web page")) categorizedGroups["Web Page"].push(g);
        else if (cat.includes("information")) categorizedGroups["Information"].push(g);
        else if (cat.includes("announcement")) categorizedGroups["Announcement"].push(g);
        else if (cat.includes("memo")) categorizedGroups["Memo"].push(g);
        else if (cat.includes("report")) categorizedGroups["Report"].push(g);
        else if (cat.includes("form")) categorizedGroups["Form"].push(g);
        else if (cat.includes("schedule") || cat.includes("menu") || cat.includes("coupon") || cat.includes("flyer") || cat.includes("chart") || cat.includes("table") || cat.includes("checklist") || cat.includes("list") || cat.includes("price")) {
          categorizedGroups["Biểu mẫu & Lịch trình"].push(g);
        } else {
          categorizedGroups["Blog & Tương tác"].push(g);
        }
      });

      Object.entries(categorizedGroups).forEach(([label, items]) => {
        if (items.length === 0) return;

        // Đặc cách các loại chỉ cần 1 nhóm nếu số lượng <= 40
        const isSingleChunk = ["Web Page", "Information", "Announcement", "Memo", "Report", "Form", "Biểu mẫu & Lịch trình", "Blog & Tương tác"].includes(label);
        
        if (isSingleChunk && items.length <= 40) {
          categoriesByComplexity.single.push(`${label} (1-${items.length})`);
          return;
        }

        for (let i = 0; i < items.length; i += 30) {
          const end = Math.min(i + 30, items.length);
          categoriesByComplexity.single.push(`${label} (${i + 1}-${end})`);
        }
      });

      // 2. Phân loại Đoạn Đôi & Ba
      const doubleGroups = groups.filter(g => {
        const comp = String((g.metadata as any)?.complexity || "").toLowerCase();
        return comp.includes("double");
      });
      const doubleGroupIds = new Set(doubleGroups.map(g => g.id));

      for (let i = 0; i < doubleGroups.length; i += 20) {
        const end = Math.min(i + 20, doubleGroups.length);
        categoriesByComplexity.double.push(`Đoạn đôi (${i + 1}-${end})`);
      }

      const tripleGroups = groups.filter(g => {
        const comp = String((g.metadata as any)?.complexity || "").toLowerCase();
        return comp.includes("triple");
      });
      const tripleGroupIds = new Set(tripleGroups.map(g => g.id));

      for (let i = 0; i < tripleGroups.length; i += 20) {
        const end = Math.min(i + 20, tripleGroups.length);
        categoriesByComplexity.triple.push(`Đoạn ba (${i + 1}-${end})`);
      }

      filters.categoriesByComplexity = categoriesByComplexity;
      filters.complexity = Object.keys(categoriesByComplexity).filter(k => categoriesByComplexity[k].length > 0);

      // 3. Phân loại Câu hỏi (Hỗ trợ Cross-Reference) - SỬ DỤNG JSON LÀM NGUỒN GỐC
      const allPart7Groups = await prisma.toeicQuestionGroup.findMany({
        where: { part: { partNumber: 7 } },
        select: { id: true, passageText: true, questions: { select: { id: true, questionNo: true } } }
      });

      const crossRefQuestions: any[] = [];
      allPart7Groups.forEach(g => {
        try {
          const parsed = JSON.parse(g.passageText || "{}");
          const jsonQs = parsed.questions || [];
          jsonQs.forEach((jq: any) => {
            const type = String(jq.type || jq.Question_Type || "").toLowerCase();
            if (type === "cross-reference") {
              // Tìm câu hỏi tương ứng trong DB để lấy ID chuẩn
              const dbQ = g.questions.find(q => String(q.questionNo) === String(jq.questionNo || jq.question_no));
              if (dbQ) {
                crossRefQuestions.push(dbQ);
              }
            }
          });
        } catch (e) { }
      });

      // Sắp xếp theo số câu để dễ nhìn
      crossRefQuestions.sort((a, b) => a.questionNo - b.questionNo);

      const crossRefChunks: string[] = [];
      for (let i = 0; i < crossRefQuestions.length; i += 30) {
        const end = Math.min(i + 30, crossRefQuestions.length);
        crossRefChunks.push(`Câu hỏi Cross-reference (${i + 1}-${end})`);
      }

      // Các dạng câu hỏi khác (Single Passages 147-171)
      const allSingleQuestions = await prisma.toeicQuestion.findMany({
        where: {
          group: { part: { partNumber: 7 } },
          questionNo: { gte: 147, lte: 171 }
        },
        select: { id: true, metadata: true, groupId: true }
      });

      const singleQTypes = Array.from(new Set(
        allSingleQuestions.map(q => {
          const qMeta = q.metadata as any;
          const type = qMeta?.type || qMeta?.Question_Type || "";
          return displayNormalize(String(type));
        }).filter(Boolean)
      )).sort();

      filters.questionTypes = [...crossRefChunks, ...singleQTypes];
    }

    return NextResponse.json({ success: true, filters });
  } catch (error) {
    console.error("Filter API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
