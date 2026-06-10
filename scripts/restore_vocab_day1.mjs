import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function restoreDay1() {
  try {
    // 1. Tìm thông tin VocabDay số 1 (Tuyển dụng)
    const vocabDay1 = await prisma.vocabDay.findUnique({
      where: { dayNumber: 1 }
    });

    if (!vocabDay1) {
      console.log("❌ Không tìm thấy bản ghi dữ liệu từ vựng Day 1 trong bảng VocabDay.");
      return;
    }

    // 2. Tìm một bài học từ vựng khác (ví dụ Ngày 2) để lấy đúng sectionId (chương mục)
    const siblingLesson = await prisma.lesson.findFirst({
      where: {
        title: { contains: "Ngày 2" }
      }
    });

    if (!siblingLesson) {
      console.log("❌ Không tìm thấy bài học Ngày 2 để làm mẫu cấu trúc.");
      return;
    }

    // 3. Khôi phục lại bài học Ngày 1 trong bảng Lesson
    const newLesson = await prisma.lesson.create({
      data: {
        id: "cmnn69wxi0005tqaeyuiitf01", // Tạo ID cố định đẹp
        title: "Ngày 1: Tuyển dụng",
        contentType: "VOCAB_GAME",
        sectionId: siblingLesson.sectionId, // Đặt vào đúng Section của Ngày 2
        vocabDayId: vocabDay1.id, // Liên kết với dữ liệu từ vựng Ngày 1
        order: 0, // Đứng đầu tiên trước Ngày 2 (order: 1)
        isPreview: true,
        content: ""
      }
    });

    console.log(`\n🎉 KHÔI PHỤC THÀNH CÔNG!`);
    console.log(`- Đã tạo lại bài học: "${newLesson.title}" (ID: ${newLesson.id})`);
    console.log(`- Đã xếp vào Chương (Section ID): ${newLesson.sectionId}`);
    console.log(`- Đã đặt độ ưu tiên hiển thị (Order): ${newLesson.order}`);

  } catch (error) {
    console.error("❌ Lỗi khi khôi phục bài học:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

restoreDay1();
