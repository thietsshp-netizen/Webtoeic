import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('pg');
const { Client } = pkg;
const xlsx = require('xlsx');
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXCEL_PATH = join(__dirname, '../Part 3_4 - create timestamp/CacDongPart34_Timestamps_LOI_FIXED.xlsx');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

// 11 dòng cần cập nhật s1
const TARGET_ROWS = [
  { book: 'ETS2022', test: '4', range: '44-46' },
  { book: 'ETS2022', test: '6', range: '62-64' },
  { book: 'ETS2023', test: '2', range: '77-79' },
  { book: 'ETS2023', test: '6', range: '32-34' },
  { book: 'ETS2023', test: '6', range: '44-46' },
  { book: 'ETS2023', test: '6', range: '50-52' },
  { book: 'ETS2024', test: '3', range: '35-37' },
  { book: 'ETS2024', test: '3', range: '53-55' },
  { book: 'ETS2024', test: '8', range: '53-55' },
  { book: 'ETS2024', test: '10', range: '44-46' },
  { book: 'ETS2026', test: '9', range: '68-70' }
];

async function updateS1() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log('🚀 Cập nhật mốc s1 (2.5s heuristic) cho 11 dòng...');

  try {
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    for (const target of TARGET_ROWS) {
      const row = rows.find(r => 
        String(r.Book).trim() === target.book && 
        String(r.Test).trim() === target.test && 
        String(r.QuestionRange).trim() === target.range
      );

      if (!row) continue;

      const book = target.book;
      const test = target.test;
      const part = parseInt(row.Part);
      const range = target.range;
      const newJson = JSON.parse(row.Json.replace(/_x000D_/g, ''));

      const findQuery = {
        text: `
          SELECT g.id, g.metadata
          FROM "ToeicQuestionGroup" g
          JOIN "ToeicPart" p ON g."partId" = p.id
          WHERE p."partNumber" = $1
            AND g.metadata->>'Book' = $2
            AND g.metadata->>'Test' = $3
            AND g.metadata->>'QuestionRange' = $4
        `,
        values: [part, book, test, range]
      };

      const res = await client.query(findQuery);
      if (res.rows.length > 0) {
        const group = res.rows[0];
        const existingMetadata = group.metadata || {};
        
        // Cập nhật DUY NHẤT timestamps
        const finalMetadata = {
          ...existingMetadata,
          timestamps: newJson.timestamps
        };

        const updateQuery = {
          text: `UPDATE "ToeicQuestionGroup" SET metadata = $1 WHERE id = $2`,
          values: [JSON.stringify(finalMetadata), group.id]
        };
        await client.query(updateQuery);
        console.log(`✅ Fixed s1: ${book} Test ${test} Range ${range}`);
      } else {
        console.error(`❌ KHÔNG KHỚP: ${book} Test ${test} Range ${range}`);
      }
    }

  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await client.end();
  }
}

updateS1();
