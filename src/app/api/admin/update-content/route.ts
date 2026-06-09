import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { target, id, field, value, sid, lessonId } = await req.json();
    console.log(`\n🎯 [AdminEdit] CẬP NHẬT PHẪU THUẬT: ID=${id}, SID=${sid}, Field=${field}`);

    if (!target || !id || !field) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    let totalUpdates = 0;
    const syncLogs: string[] = [];
    const fieldName = field.split('.').pop(); 

    // Helper: Thay the doan van ban trong transcript String
    const replaceTranscriptSegment = (fullText: string, targetSid: string, newVal: string) => {
      const label = targetSid.toUpperCase();
      if (label === 'Q') {
        const qMatch = fullText.match(/\(Q\)\s*([^\(]*)/i);
        const firstParenIndex = fullText.indexOf('(');
        if (qMatch) {
          const qIndex = fullText.toUpperCase().indexOf('(Q)');
          const textAfterQ = fullText.substring(qIndex + 3);
          const nextLabelIndex = textAfterQ.indexOf('(');
          if (nextLabelIndex !== -1) return newVal + " " + textAfterQ.substring(nextLabelIndex);
          return newVal;
        } else if (firstParenIndex !== -1) {
          return newVal + " " + fullText.substring(firstParenIndex);
        }
        return newVal;
      }
      const regex = new RegExp(`(\\(${label}\\))\\s*([^\\(\\n]*)`, 'g');
      if (regex.test(fullText)) return fullText.replace(regex, `$1 ${newVal}`);
      return fullText + ` (${label}) ${newVal}`;
    };

    // Helper: Update JSON (Nâng cấp để xử lý câu hỏi chính không nhãn)
    const surgicalReplace = (obj: any, targetSid: string, targetSubField: string, newVal: any) => {
      if (!obj || typeof obj !== 'object') return false;
      let changed = false;

      // TRUONG HOP DAC BIET: Sua cau hoi chinh (sid=Q) trong JSON khong nhan
      if ((targetSid === 'Q' || !targetSid) && targetSubField === 'question') {
        if (typeof obj.question === 'string') { obj.question = newVal; changed = true; }
        else if (obj.question && typeof obj.question === 'object') {
          if (obj.question.en !== undefined) { obj.question.en = newVal; changed = true; }
          if (obj.question.vi !== undefined) { obj.question.vi = newVal; changed = true; }
        }
      }

      if (Array.isArray(obj)) {
        for (let item of obj) { if (surgicalReplace(item, targetSid, targetSubField, newVal)) changed = true; }
      } else {
        if (obj.label === targetSid) {
          if (targetSubField === 'why' || targetSubField === 'vietText' || targetSubField === 'vi') {
            if (obj.why !== undefined) { obj.why = newVal; changed = true; }
            if (obj.vi !== undefined) { obj.vi = newVal; changed = true; }
            if (obj.text !== undefined && typeof obj.text === 'string') { obj.text = newVal; changed = true; }
          } else if (targetSubField === 'en') {
            if (obj.en !== undefined) { obj.en = newVal; changed = true; }
            if (obj.suggested_question) { obj.suggested_question.en = newVal; changed = true; }
          }
        }
        for (let key in obj) { 
           if (key !== 'question' && typeof obj[key] === 'object' && surgicalReplace(obj[key], targetSid, targetSubField, newVal)) changed = true; 
        }
      }
      return changed;
    };

    // 1. TARGET GROUP
    if (target === "group") {
      const group = await prisma.toeicQuestionGroup.findUnique({ where: { id } });
      if (!group) return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 });
      if (field === "transcript") {
        const newTranscript = replaceTranscriptSegment(group.transcript || "", sid || "Q", value);
        await prisma.toeicQuestionGroup.update({ where: { id }, data: { transcript: newTranscript } });
        syncLogs.push(`✅ [Bảng: ToeicQuestionGroup] [Cột: transcript] Đã dọn dẹp và cập nhật.`);
        totalUpdates++;
        if (sid === "Q" || !sid) {
           await prisma.toeicQuestion.updateMany({ where: { groupId: id }, data: { questionText: value } });
           syncLogs.push(`🚀 [Bảng: ToeicQuestion] [Cột: questionText] Đã đồng bộ.`);
        }
      } else if (field === "metadata" || field === "metadata.hotspots") {
        let currentMetadata: any = {};
        if (group.metadata) {
          if (typeof group.metadata === 'string') {
            try {
              currentMetadata = JSON.parse(group.metadata);
            } catch (e) {
              console.error("Lỗi parse metadata string:", e);
            }
          } else if (typeof group.metadata === 'object') {
            currentMetadata = JSON.parse(JSON.stringify(group.metadata));
          }
        }
        
        const newHotspots = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(newHotspots)) {
          return NextResponse.json({ success: false, error: "Hotspots must be an array" }, { status: 400 });
        }
        
        currentMetadata.hotspots = newHotspots;
        await prisma.toeicQuestionGroup.update({ 
          where: { id }, 
          data: { metadata: currentMetadata } 
        });
        syncLogs.push(`✅ [Bảng: ToeicQuestionGroup] [Cột: metadata.hotspots] Đã cập nhật ${newHotspots.length} hotspots.`);
        totalUpdates++;
      }
    } 
    // 2. TARGET QUESTION
    else if (target === "question") {
      const question = await prisma.toeicQuestion.findUnique({ where: { id }, include: { group: true } });
      if (!question) return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });

      if (field === "questionText") {
        await prisma.toeicQuestion.update({ where: { id }, data: { questionText: value } });
        syncLogs.push(`✅ [Bảng: ToeicQuestion] [Cột: questionText] Đã sửa.`);
        totalUpdates++;
        if (question.group) {
          const newTranscript = replaceTranscriptSegment(question.group.transcript || "", "Q", value);
          await prisma.toeicQuestionGroup.update({ where: { id: question.group.id }, data: { transcript: newTranscript } });
          syncLogs.push(`🚀 [Bảng: ToeicQuestionGroup] [Cột: transcript] Đã đồng bộ.`);
        }
      } else {
        const columns: ("metadata" | "explanation")[] = ["metadata", "explanation"];
        for (const col of columns) {
          let raw = question[col];
          let json: any = null;
          try {
            if (typeof raw === 'string' && raw.trim().startsWith('{')) json = JSON.parse(raw);
            else if (raw && typeof raw === 'object') json = JSON.parse(JSON.stringify(raw));
          } catch (e) {}

          if (json && surgicalReplace(json, sid, fieldName, value)) {
            const final = (typeof raw === 'string') ? JSON.stringify(json) : json;
            await prisma.toeicQuestion.update({ where: { id }, data: { [col]: final } });
            syncLogs.push(`✅ [Bảng: ToeicQuestion] [ID: ${id}] [Cột: ${col}] Đã cập nhật.`);
            totalUpdates++;
          }
        }
      }
    }

    if (totalUpdates === 0) {
      return NextResponse.json({ success: false, error: "Không tìm thấy vị trí dữ liệu phù hợp." }, { status: 400 });
    }
    return NextResponse.json({ success: true, logs: syncLogs });
  } catch (error: any) {
    console.error("[AdminEdit Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
