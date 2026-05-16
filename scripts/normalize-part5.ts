import { prisma } from '../src/lib/prisma';

async function normalizeMetadata() {
  console.log("🛠️ Bắt đầu chuẩn hóa metadata (day/type) cho Part 5...");

  const questions = await prisma.toeicQuestion.findMany({
    where: {
      group: {
        part: {
          partNumber: 5,
          test: { title: 'QUESTION_BANK_PART5' }
        }
      }
    }
  });

  let updatedCount = 0;

  for (const q of questions) {
    const originalType = q.metadata?.type || '';
    const originalDay = q.metadata?.day || '';

    // Chuẩn hóa Type: Viết hoa chữ cái đầu, các chữ sau viết thường (trừ trường hợp đặc biệt)
    let normalizedType = originalType.trim();
    if (normalizedType.toLowerCase() === 'danh từ') normalizedType = 'Danh từ';
    if (normalizedType.toLowerCase() === 'tính từ') normalizedType = 'Tính từ';
    if (normalizedType.toLowerCase() === 'trạng từ') normalizedType = 'Trạng từ';
    if (normalizedType.toLowerCase() === 'giới từ') normalizedType = 'Giới từ';
    if (normalizedType.toLowerCase() === 'liên từ') normalizedType = 'Liên từ';
    if (normalizedType.toLowerCase() === 'đại từ') normalizedType = 'Đại từ';
    if (normalizedType.toLowerCase() === 'động từ') normalizedType = 'Động từ';
    if (normalizedType.toLowerCase() === 'mệnh đề quan hệ') normalizedType = 'Mệnh đề quan hệ';
    if (normalizedType === 'Danh Từ') normalizedType = 'Danh từ'; // Trường hợp cụ thể bạn thấy

    // Chuẩn hóa Day: Tương tự
    let normalizedDay = originalDay.trim();
    // (Ngày thường đã khá chuẩn do nó có số (1), (2) đi kèm)

    if (normalizedType !== originalType || normalizedDay !== originalDay) {
      await prisma.toeicQuestion.update({
        where: { id: q.id },
        data: {
          metadata: {
            ...q.metadata,
            type: normalizedType,
            day: normalizedDay
          }
        }
      });
      updatedCount++;
    }
  }

  console.log(`✅ Đã chuẩn hóa xong ${updatedCount} câu hỏi.`);
}

normalizeMetadata().catch(console.error).finally(() => prisma.$disconnect());
