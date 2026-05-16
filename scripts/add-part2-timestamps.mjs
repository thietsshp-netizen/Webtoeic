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

const EXCEL_PATH = join(__dirname, '../Part 3_4 - create timestamp/Updated_Part2_Final_Fixed.xlsx');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

async function migrate() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log(`Connecting to database... ${dryRun ? '[DRY RUN MODE]' : ''}`);

  try {
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`Read ${rows.length} rows from Excel.`);

    let updatedCount = 0;
    let notFoundCount = 0;
    let skipCount = 0;

    for (const row of rows) {
      const book = row['Book'];
      const test = row['Test'];
      const part = row['Part']; // Should be 2
      const questionNo = row['QuestionNo'];
      const jsonStr = row['Json'];

      if (!jsonStr) continue;

      let timestamps;
      try {
        const parsed = JSON.parse(jsonStr);
        timestamps = parsed.timestamps;
      } catch (e) {
        console.error(`Error parsing JSON for ${book} Test ${test} Q${questionNo}`);
        continue;
      }

      if (!timestamps) {
        console.warn(`No timestamps found in JSON for ${book} Test ${test} Q${questionNo}`);
        continue;
      }

      // Tìm Group trong Database
      // Part 2 matching logic: Book, Test, Part Number, Question Number
      const findQuery = {
        text: `
          SELECT g.id, g.metadata
          FROM "ToeicQuestionGroup" g
          JOIN "ToeicPart" p ON g."partId" = p.id
          JOIN "ToeicQuestion" q ON q."groupId" = g.id
          WHERE p."partNumber" = 2
            AND q."questionNo" = $1
            AND g.metadata->>'Book' = $2
            AND g.metadata->>'Test' = $3
        `,
        values: [questionNo.toString(), book, test.toString()]
      };

      const res = await client.query(findQuery);

      if (res.rows.length === 0) {
        console.error(`NOT FOUND: ${book} Test ${test} Q${questionNo}`);
        notFoundCount++;
        continue;
      }

      const group = res.rows[0];
      const existingMetadata = group.metadata || {};

      // Kiểm tra xem đã có timestamps chưa và có giống nhau không
      if (existingMetadata.timestamps && JSON.stringify(existingMetadata.timestamps) === JSON.stringify(timestamps)) {
        skipCount++;
        continue;
      }

      // Merge timestamps vào metadata
      const newMetadata = {
        ...existingMetadata,
        timestamps: timestamps
      };

      if (dryRun) {
        console.log(`[DRY RUN] Will update: ${book} Test ${test} Q${questionNo}`);
        updatedCount++;
      } else {
        const updateQuery = {
          text: `UPDATE "ToeicQuestionGroup" SET metadata = $1 WHERE id = $2`,
          values: [JSON.stringify(newMetadata), group.id]
        };
        await client.query(updateQuery);
        console.log(`UPDATED: ${book} Test ${test} Q${questionNo}`);
        updatedCount++;
      }
    }

    console.log('\n--- Result ---');
    console.log(`Total rows in Excel: ${rows.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Not found: ${notFoundCount}`);
    console.log(`Skipped (already up to date): ${skipCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
