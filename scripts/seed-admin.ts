import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "thietsshp@gmail.com";
  const password = "admin123";
  const hashedName = "Admin Thiết";

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      password: hashedPassword,
    },
    create: {
      email,
      name: hashedName,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("-----------------------------------------");
  console.log("✅ ĐÃ KHỞI TẠO TÀI KHOẢN ADMIN THÀNH CÔNG");
  console.log("-----------------------------------------");
  console.log(`Email: ${admin.email}`);
  console.log(`Mật khẩu: ${password}`);
  console.log("-----------------------------------------");
  console.log("Giờ bạn có thể vào Tab Dashboard để đăng nhập!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
