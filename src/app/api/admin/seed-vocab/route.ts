import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const DAY_TITLES: Record<number, string> = {
  1: "Tuyển dụng", 2: "Phép tắc - Quy định", 3: "Công việc văn phòng (1)",
  4: "Công việc văn phòng (2)", 5: "Công việc văn phòng (3)", 6: "Thời gian rảnh - Cộng đồng",
  7: "Marketing (1)", 8: "Marketing (2)", 9: "Kinh tế", 10: "Mua sắm",
  11: "Phát triển sản phẩm", 12: "Sản xuất", 13: "Dịch vụ khách hàng",
  14: "Du lịch - Sân bay", 15: "Hợp đồng", 16: "Giao dịch",
  17: "Thương mại - Vận chuyển", 18: "Nơi lưu trú - Nhà hàng", 19: "Doanh thu",
  20: "Thi đua trong công ty", 21: "Xu hướng của doanh nghiệp", 22: "Hội họp",
  23: "Phúc lợi của nhân viên", 24: "Luân chuyển nhân sự", 25: "Giao thông",
  26: "Ngân hàng", 27: "Đầu tư", 28: "Tòa nhà - Nhà", 29: "Môi trường", 30: "Sức khỏe"
};

export async function GET() {
  console.log("🚀 [SEED] Bắt đầu quá trình nạp dữ liệu từ vựng...");
  try {
    const vocabDir = path.join(process.cwd(), "ToeicVocab");
    if (!fs.existsSync(vocabDir)) {
      console.error("❌ [SEED] Không tìm thấy thư mục:", vocabDir);
      return NextResponse.json({ error: "Thư mục ToeicVocab không tồn tại tại " + vocabDir }, { status: 404 });
    }

    const files = fs.readdirSync(vocabDir).filter((f) => f.endsWith(".txt"));
    console.log(`📂 [SEED] Tìm thấy ${files.length} file dữ liệu.`);
    const results: string[] = [];

    for (const file of files.sort()) {
      const m = file.match(/Day (\d+)/);
      if (!m) continue;
      const dayNumber = parseInt(m[1]);
      const title = DAY_TITLES[dayNumber] || `Day ${dayNumber}`;
      const content = fs.readFileSync(path.join(vocabDir, file), "utf8");

      const startIdx = content.indexOf("[");
      const endIdx = content.lastIndexOf("]");
      if (startIdx === -1 || endIdx === -1) {
        console.warn(`⚠️ [SEED] Không tìm thấy mảng dữ liệu trong ${file}`);
        results.push(`⚠️ Skip ${file}: no array found`);
        continue;
      }

      let data: any[];
      try {
        // eslint-disable-next-line no-new-func
        data = new Function(`return ${content.substring(startIdx, endIdx + 1)}`)();
      } catch (err: any) {
        console.error(`❌ [SEED] Lỗi parse file ${file}:`, err.message);
        results.push(`❌ Parse error ${file}: ${err.message}`);
        continue;
      }

      console.log(`⏳ [SEED] Đang lưu Ngày ${dayNumber}: ${title} (${data.length} từ)...`);
      await prisma.vocabDay.upsert({
        where: { dayNumber },
        update: { title, data: JSON.stringify(data) },
        create: { dayNumber, title, data: JSON.stringify(data) },
      });

      const resStr = `✅ Day ${dayNumber}: ${title} (${data.length} words)`;
      console.log(resStr);
      results.push(resStr);
    }

    console.log("✨ [SEED] Hoàn tất nạp dữ liệu từ vựng!");
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("💥 [SEED] Lỗi nghiêm trọng:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
