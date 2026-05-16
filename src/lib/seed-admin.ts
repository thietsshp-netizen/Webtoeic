/**
 * Script reset mật khẩu Admin
 * Chạy bằng lệnh: npx tsx src/lib/seed-admin.ts
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const ADMIN_EMAIL = 'thietsshp@gmail.com';
  const NEW_PASSWORD = 'Webtoeic2026';

  // Mã hóa mật khẩu bằng bcrypt trước khi lưu
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

  const user = await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { password: hashedPassword },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log('✅ Cập nhật mật khẩu thành công!');
  console.log('👤 Tài khoản:', user.email);
  console.log('🔑 Mật khẩu mới:', NEW_PASSWORD);
  console.log('🛡️  Role:', user.role);
}

main()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
