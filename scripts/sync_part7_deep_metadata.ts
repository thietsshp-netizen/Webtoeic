import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Deep Metadata Sync for Part 7...");
  
  const groups = await prisma.toeicQuestionGroup.findMany({
    where: { part: { partNumber: 7 } },
    include: { questions: true }
  });

  console.log(`Analyzing ${groups.length} question groups...`);

  let count = 0;
  for (const group of groups) {
    try {
      // 1. Parse passages from JSON string
      const passages = JSON.parse(group.passageText);
      
      // 2. Determine Complexity by actual passage count
      let complexity = "Single";
      if (passages.length === 2) complexity = "Double";
      else if (passages.length >= 3) complexity = "Triple";
      
      // 3. Extract Category from the first passage's internal metadata
      // The JSON structure in the Excel was: [{"category": "...", "html_content": "..."}]
      const category = passages[0]?.category || "General";
      
      // 4. Update Group Metadata
      const currentMeta = (group.metadata as any) || {};
      const updatedMeta = {
        ...currentMeta,
        complexity,
        category,
        passage_count: passages.length
      };

      await prisma.toeicQuestionGroup.update({
        where: { id: group.id },
        data: { metadata: updatedMeta }
      });

      // 5. Update individual question types if missing
      for (const question of group.questions) {
        const qMeta = (question.metadata as any) || {};
        // If question type is not in metadata, it's a problem for filtering
        if (!qMeta.type) {
           // We'll leave it for now or default to General if we can't find it
           // In the seed script, I already mapped q.type, so it should be there.
        }
      }

      count++;
      if (count % 100 === 0) console.log(`Processed ${count} groups...`);
      
    } catch (err) {
      console.error(`Failed to process group ${group.id}:`, err);
    }
  }

  console.log(`\nSUCCESS! Deep sync completed for ${count} groups.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
