const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const fs = require("fs");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedMissing() {
  console.log("--- BẮT ĐẦU BỔ SUNG 24 TỪ CÒN THIẾU ---");
  
  try {
    const data = JSON.parse(fs.readFileSync("./TuDien/24 tu con thieu.json", "utf8"));
    console.log(`Đã đọc ${data.length} từ từ file JSON.`);

    let successCount = 0;

    for (const entry of data) {
      const word = entry.word.trim();
      
      // Chuyển đổi synonyms/antonyms từ object sang string để lưu vào các cột tương ứng nếu cần
      // Nhưng bảng Dictionary của bạn lưu toàn bộ object vào cột 'data' (JSONB)
      
      await prisma.dictionary.upsert({
        where: { word: word },
        update: {
          data: entry,
          updatedAt: new Date()
        },
        create: {
          word: word,
          data: entry
        }
      });
      
      console.log(`✅ Đã xử lý từ: ${word}`);
      successCount++;
    }

    console.log(`\n--- HOÀN THÀNH ---`);
    console.log(`Tổng cộng: Đã bổ sung/cập nhật thành công ${successCount} từ.`);

  } catch (error) {
    console.error("Lỗi khi bổ sung dữ liệu:", error);
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

seedMissing();
