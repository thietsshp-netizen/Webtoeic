import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("--- Bắt đầu trích xuất Metadata cho TOEIC Library ---");

  const groups = await prisma.toeicQuestionGroup.findMany({
    include: {
      part: {
        include: {
          test: true
        }
      }
    }
  });

  console.log(`Tìm thấy ${groups.length} nhóm câu hỏi.`);
  let count = 0;

  for (const group of groups) {
    const testTitle = group.part.test.title || "";
    // Format đang là: "Luyện tập Day_1 - Part 3"
    const dayMatch = testTitle.match(/Day[_\s](\d+)/i);
    const partMatch = testTitle.match(/Part\s+(\d+)/i);

    const day = dayMatch ? parseInt(dayMatch[1]) : (group.part.test.title.includes("Day") ? 0 : null);
    const part = partMatch ? parseInt(partMatch[1]) : group.part.partNumber;

    const metadata: any = {
      day: day,
      part: part,
      hasImage: !!group.imageUrl,
      testName: testTitle,
      series: "ETS 2024" // Mặc định cho dữ liệu hiện tại
    };

    await prisma.toeicQuestionGroup.update({
      where: { id: group.id },
      data: { metadata }
    });

    count++;
    if (count % 50 === 0) console.log(`Đã cập nhật ${count}/${groups.length} nhóm...`);
  }

  console.log(`--- Xong! Đã cập nhật ${count} nhóm câu hỏi. ---`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { 
    await prisma.$disconnect();
    await pool.end();
  });
