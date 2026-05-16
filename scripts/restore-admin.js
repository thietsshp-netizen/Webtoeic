const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'thietsshp@toeicthiet.com';
  const hashedPassword = await bcrypt.hash('123456789', 10);

  console.log('Creating admin user...');
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email,
      name: 'Mr. Thiệt',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created/updated:', user.email);

  // Khôi phục khóa học mẫu nếu cần
  console.log('Creating sample courses...');
  await prisma.course.createMany({
    data: [
      {
        title: 'Chinh Phục TOEIC 500+',
        description: 'Lộ trình cơ bản cho người mới bắt đầu.',
        isPublic: true,
      },
      {
        title: 'TOEIC Cấp Tốc 750+',
        description: 'Luyện đề thực chiến và mẹo làm bài đỉnh cao.',
        isPublic: true,
      }
    ],
    skipDuplicates: true,
  });
  console.log('Sample courses created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
