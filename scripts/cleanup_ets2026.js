const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deName = 'ETS2026';
  console.log(`[DỌN DẸP] Bắt đầu xóa toàn bộ dữ liệu Part 7 thuộc bộ: ${deName}...`);

  const deleted = await prisma.toeicQuestionGroup.deleteMany({
    where: {
      part: { partNumber: 7 },
      OR: [
        { metadata: { path: ['book'], equals: deName } },
        { metadata: { path: ['de'], equals: deName } }
      ]
    }
  });

  console.log(`[XONG] Đã xóa ${deleted.count} cụm câu hỏi Part 7 của ${deName}.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
