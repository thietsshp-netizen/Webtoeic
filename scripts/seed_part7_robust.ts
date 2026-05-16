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

  const part7 = await prisma.toeicPart.findFirst({ where: { partNumber: 7 } });
  if (part7) {
    await prisma.toeicQuestionGroup.deleteMany({ where: { partId: part7.id } });
  }

  console.log("\n🚀 Step 2: Seeding from Enhanced Excel (Robust Mode)...");
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = XLSX.utils.sheet_to_json(sheet);

  const failedRows: any[] = [];
  let count = 0;

  for (const row of data) {
    try {
      if (!row.Json) throw new Error("Missing Json column");
      const fullJson = JSON.parse(row.Json);

      let test = await prisma.toeicTest.findFirst({ where: { title: String(row.Test) } });
      if (!test) {
        test = await prisma.toeicTest.create({ data: { title: String(row.Test), isPublished: true } });
      }

      let part = await prisma.toeicPart.findFirst({ where: { testId: test.id, partNumber: 7 } });
      if (!part) {
        part = await prisma.toeicPart.create({ data: { testId: test.id, partNumber: 7, title: "Part 7: Reading Comprehension" } });
      }

      const questionsMap = String(row.Question_Analysis).split(' | ').map(item => {
        const parts = item.split(': ');
        if (parts.length < 2) return null;
        const noPart = parts[0];
        const typePart = parts[1];
        const [type, passagePart] = typePart.split(' (');
        const passages = passagePart ? passagePart.replace(')', '').split(',').map(p => parseInt(p.trim().replace('P', '')) - 1) : [0];
        return { no: parseInt(noPart), type: type.trim(), passages };
      }).filter(Boolean);

      const categories = [row.P1_Category, row.P2_Category, row.P3_Category].filter(Boolean);

      const group = await prisma.toeicQuestionGroup.create({
        data: {
          partId: part.id,
          passageText: row.Json,
          metadata: {
            book: row.Book,
            test: row.Test,
            part: 7,
            questionRange: row.QuestionRange,
            complexity: row.Complexity?.replace(' Passage', '') || "Single",
            categories: categories,
            passage_count: row.PassageCount || 1,
            questions_map: questionsMap
          }
        }
      });

      const questions = fullJson.questions || [];
      for (const q of questions) {
        const analysis = questionsMap.find((a: any) => a.no === q.questionNo);
        const meta = q.metadata || {};

        await prisma.toeicQuestion.create({
          data: {
            groupId: group.id,
            questionNo: q.questionNo || 0,
            questionText: q.questionText || "",
            optionA: q.optionA || "A. (Chưa có dữ liệu)",
            optionB: q.optionB || "B. (Chưa có dữ liệu)",
            optionC: q.optionC || "C. (Chưa có dữ liệu)",
            optionD: q.optionD || "D. (Chưa có dữ liệu)",
            correctAnswer: q.correctAnswer || "A",
            explanation: typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation || {}),
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
      console.error(`Row ${row.QuestionRange} failed. Error: ${(err as Error).message}`);
      failedRows.push({ range: row.QuestionRange, error: (err as Error).message });
    }
  }

  console.log(`\n✅ COMPLETED! Successfully uploaded ${count} groups.`);
  if (failedRows.length > 0) {
    console.log(`⚠️ FAILED ROWS (${failedRows.length}):`);
    failedRows.forEach(f => console.log(`- ${f.range}: ${f.error}`));
  } else {
    console.log("✨ No errors found!");
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
