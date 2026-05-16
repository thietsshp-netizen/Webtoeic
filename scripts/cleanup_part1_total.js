require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- BẮT ĐẦU QUY TRÌNH DỌN DẸP TỔNG LỰC PART 1 ---');

  // 1. Lấy danh sách các file cần xóa trong Storage trước khi xóa DB
  const groups = await prisma.toeicQuestionGroup.findMany({
    where: { part: { partNumber: 1 } },
    select: { audioUrl: true, imageUrl: true }
  });

  const filesToCleanup = [];
  groups.forEach(g => {
    if (g.audioUrl && g.audioUrl.includes('toeic_part1/')) {
      const path = g.audioUrl.split('lessons/')[1];
      if (path) filesToCleanup.push(path);
    }
    if (g.imageUrl && g.imageUrl.includes('toeic_part1/')) {
      const path = g.imageUrl.split('lessons/')[1];
      if (path) filesToCleanup.push(path);
    }
  });

  console.log(`Tìm thấy ${filesToCleanup.length} file trong Storage cần xóa.`);

  // 2. Xóa dữ liệu trong Database
  console.log('Đang xóa QuestionAttempt...');
  await prisma.questionAttempt.deleteMany({
    where: { question: { group: { part: { partNumber: 1 } } } }
  });

  console.log('Đang xóa ToeicQuestion...');
  await prisma.toeicQuestion.deleteMany({
    where: { group: { part: { partNumber: 1 } } }
  });

  console.log('Đang xóa ToeicQuestionGroup...');
  await prisma.toeicQuestionGroup.deleteMany({
    where: { part: { partNumber: 1 } }
  });

  console.log('Đang xóa ToeicPart...');
  await prisma.toeicPart.deleteMany({
    where: { partNumber: 1 }
  });

  console.log('Đang xóa ToeicTest rác...');
  await prisma.toeicTest.deleteMany({
    where: { title: { startsWith: 'Luyện tập Part 1' } }
  });

  // 3. Thực hiện xóa file trong Storage
  if (filesToCleanup.length > 0) {
    console.log('Đang xóa file trên Supabase Storage...');
    for (let i = 0; i < filesToCleanup.length; i += 50) {
      const chunk = filesToCleanup.slice(i, i + 50);
      const { error } = await supabase.storage.from('lessons').remove(chunk);
      if (error) console.error('Lỗi khi xóa Storage:', error);
    }
  }

  // 4. KIỂM TRA LẠI
  const finalCount = await prisma.toeicQuestionGroup.count({
    where: { part: { partNumber: 1 } }
  });

  console.log('\n--- KẾT QUẢ DỌN DẸP ---');
  console.log('Dữ liệu Part 1 còn sót lại:', finalCount);
  
  if (finalCount === 0) {
    console.log('==> CHÚC MỪNG: PART 1 ĐÃ SẠCH BÓNG 100%!');
  } else {
    console.log('==> CẢNH BÁO: VẪN CÒN DỮ LIỆU SÓT LẠI!');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('LỖI THỰC THI:', err);
  process.exit(1);
});
