import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  try {
    const sampleLessons = await prisma.lesson.findMany({
      where: {
        OR: [
          { title: { contains: "S01E01" } },
          { title: { contains: "S02E23" } },
          { title: { contains: "S05E01" } },
          { title: { contains: "S10E17-18" } },
        ]
      },
      select: {
        id: true,
        title: true,
        videoUrl: true,
        contentType: true,
        content: true
      }
    });

    console.log("=== KIỂM TRA MẪU CÁC BÀI HỌC VỪA CẬP NHẬT ===");
    for (const l of sampleLessons) {
      console.log(`\n📌 Bài: ${l.title}`);
      console.log(`   ID: ${l.id}`);
      console.log(`   videoUrl: ${l.videoUrl}`);
      console.log(`   contentType: ${l.contentType}`);
      console.log(`   Nội dung phụ đề/content: ${l.content ? `Đang có dữ liệu (${l.content.length} ký tự)` : 'Không có'}`);
    }
  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verify();
