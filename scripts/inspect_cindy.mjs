import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectSchoorl() {
  try {
    const group = await prisma.toeicQuestionGroup.findFirst({
      where: {
        passageText: {
          contains: "Schoorl"
        }
      }
    });

    if (!group) {
      console.log("❌ Không tìm thấy Schoorl");
      return;
    }

    console.log("=== GROUP ID ===", group.id);
    const p = JSON.parse(group.passageText);
    console.log("=== PASSAGE TEXT ===");
    console.log(JSON.stringify(p.english, null, 2));

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

inspectSchoorl();
