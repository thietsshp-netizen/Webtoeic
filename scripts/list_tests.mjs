
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findETSTest() {
  try {
    const tests = await prisma.toeicTest.findMany({
      where: { title: { contains: "ETS" } },
      select: { title: true },
      take: 50
    });
    console.log("--- DANH SÁCH BỘ ĐỀ ETS ---");
    tests.forEach(t => console.log(`- ${t.title}`));
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

findETSTest();
