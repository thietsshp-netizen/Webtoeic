import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import * as XLSX from 'xlsx';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const excelPath = "/Users/thietphamvan/hoctoeic/Webtoeic/Part 7/Part 7_Enhanced.xlsx";

async function main() {
  console.log("🧹 Step 1: Cleaning up existing Part 7 data...");
  
  // Find Part 7 ID
  const part7 = await prisma.toeicPart.findFirst({ where: { partNumber: 7 } });
  if (part7) {
    const deletedGroups = await prisma.toeicQuestionGroup.deleteMany({
      where: { partId: part7.id }
    });
    console.log(`Deleted ${deletedGroups.count} old Part 7 question groups.`);
  } else {
    console.log("No Part 7 found, skipping cleanup.");
    // If no Part 7 exists, we might need to create it under a test, but usually it exists.
    // Let's assume it exists or find the first test to attach to for now, 
    // but better to link to existing parts.
  }

  console.log("\n🚀 Step 2: Seeding from Enhanced Excel...");
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Read ${data.length} rows from Excel.`);

  let count = 0;
  for (const row of data) {
    try {
      const fullJson = JSON.parse(row.Json);
      
      // Find or create Part 7 for this specific Test
      let test = await prisma.toeicTest.findFirst({
        where: { title: String(row.Test) }
      });
      if (!test) {
        test = await prisma.toeicTest.create({
          data: { title: String(row.Test), isPublished: true }
        });
      }

      let part = await prisma.toeicPart.findFirst({
        where: { testId: test.id, partNumber: 7 }
      });
      if (!part) {
        part = await prisma.toeicPart.create({
          data: { testId: test.id, partNumber: 7, title: "Part 7: Reading Comprehension" }
        });
      }

      // Parse Question Analysis for metadata
      const questionsMap = String(row.Question_Analysis).split(' | ').map(item => {
        const [noPart, typePart] = item.split(': ');
        const [type, passagePart] = typePart.split(' (');
        const passages = passagePart.replace(')', '').split(',').map(p => parseInt(p.replace('P', '')) - 1);
        return { no: parseInt(noPart), type: type.trim(), passages };
      });

      const categories = [row.P1_Category, row.P2_Category, row.P3_Category].filter(Boolean);

      // Create Group
      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: part.id,
          passageText: row.Json,
          metadata: {
            book: row.Book,
            test: row.Test,
            part: 7,
            questionRange: row.QuestionRange,
            complexity: row.Complexity.replace(' Passage', ''),
            categories: categories,
            passage_count: row.PassageCount,
            questions_map: questionsMap
          }
        }
      });

      // Create Questions
      const questions = fullJson.questions || [];
      for (const q of questions) {
        const analysis = questionsMap.find(a => a.no === q.questionNo);
        const meta = q.metadata || {};
        
        await prisma.toeicQuestion.create({
          data: {
            groupId: group.id,
            questionNo: q.questionNo,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation),
            metadata: {
              ...meta,
              type: analysis?.type || "General",
              relevant_passages: analysis?.passages || [0],
              questionText_vn: meta.explanation_vn?.vi || "",
              options_vn: meta.explanation_vn?.options_vn || {},
              evidence_sids: meta.evidence_sids || q.evidence_sids || []
            }
          }
        });
      }

      count++;
      if (count % 100 === 0) console.log(`Uploaded ${count} groups...`);

    } catch (err) {
      console.error(`Failed at row ${row.QuestionRange}:`, err);
    }
  }

  console.log(`\n✅ SUCCESS! Re-seeded ${count} Part 7 groups with enhanced metadata.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
