import dotenv from "dotenv";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const HEADER_KEYWORDS = ['To:', 'From:', 'Subject:', 'Date:', 'Subject :'];
const GREETING_KEYWORDS = ['Dear', 'Hi', 'Hello'];
const SIGNOFF_KEYWORDS = ['Sincerely', 'Best regards', 'Regards', 'Best,', 'Best'];

async function main() {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("--- Migrating Part 6 to Standards (Adding 'type' field) ---");

  const groups = await prisma.toeicQuestionGroup.findMany({
    where: { part: { partNumber: 6 } }
  });

  console.log(`Analyzing ${groups.length} groups...`);

  let updatedCount = 0;

  for (const group of groups) {
    if (!group.passageText) continue;

    try {
      const p = JSON.parse(group.passageText);
      let needsUpdate = false;

      const processArray = (arr: any[]) => {
        if (!arr) return;
        arr.forEach((s, idx) => {
          if (s.type) return; // Đã có type rồi thì bỏ qua

          const text = (s.text || "").trim();
          const cleanText = text.replace(/<[^>]*>/g, '').trim();

          if (HEADER_KEYWORDS.some(k => cleanText.startsWith(k))) {
            s.type = 'header';
            needsUpdate = true;
          } else if (GREETING_KEYWORDS.some(k => cleanText.startsWith(k))) {
            s.type = 'greeting';
            needsUpdate = true;
          } else if (SIGNOFF_KEYWORDS.some(k => cleanText.startsWith(k))) {
            s.type = 'signoff';
            needsUpdate = true;
          } else if (idx >= arr.length - 2 && cleanText.length < 50) {
            // Dòng tên/chức danh ở cuối bài
            s.type = 'signature';
            needsUpdate = true;
          } else {
            s.type = 'body';
            needsUpdate = true;
          }
        });
      };

      processArray(p.english);
      processArray(p.vietnamese);

      if (needsUpdate) {
        await prisma.toeicQuestionGroup.update({
          where: { id: group.id },
          data: { passageText: JSON.stringify(p) }
        });
        updatedCount++;
      }
    } catch (e) {
      console.error(`Error processing group ${group.id}:`, e);
    }
  }

  console.log(`Migration finished. Standardized ${updatedCount} groups.`);
  await prisma.$disconnect();
}

main().catch(console.error);
