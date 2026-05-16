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

const EXCEL_PATH = join(__dirname, '../Part 3_4 - create timestamp/CacDongPart34_Timestamps_FIXED.xlsx');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

// Danh sách các dòng đặc biệt cần thay thế TOÀN BỘ Metadata JSON
const FULL_UPDATE_ROWS = [
  { book: 'ETS2022', test: '4', range: '68-70' },
  { book: 'ETS2026', test: '2', range: '62-64' },
  { book: 'ETS2026', test: '3', range: '41-43' }
];

async function updateDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log('🚀 Bắt đầu cập nhật Database Part 3/4 Final (via pg client)...');

  try {
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`Đã đọc ${rows.length} dòng từ file Excel.`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      const book = String(row.Book).trim();
      const test = String(row.Test).trim();
      const part = parseInt(row.Part);
      const range = String(row.QuestionRange).trim();
      const newJsonRaw = row.Json;

      if (!newJsonRaw) continue;

      try {
        const newJson = JSON.parse(newJsonRaw.replace(/_x000D_/g, ''));

        // Tìm Group trong Database bằng metadata
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

        if (res.rows.length === 0) {
          console.error(`❌ KHÔNG KHỚP: ${book} Test ${test} Part ${part} Range ${range}`);
          errorCount++;
          continue;
        }

        const group = res.rows[0];
        const existingMetadata = group.metadata || {};

        // Kiểm tra xem dòng này có thuộc diện FULL UPDATE không
        const isFullUpdate = FULL_UPDATE_ROWS.some(
          f => f.book === book && f.test === test && f.range === range
        );

        let finalMetadata;
        if (isFullUpdate) {
          console.log(`✨ [FULL UPDATE] ${book} Test ${test} Range ${range}`);
          finalMetadata = newJson;
        } else {
          console.log(`⌚ [Update Timestamps] ${book} Test ${test} Range ${range}`);
          finalMetadata = {
            ...existingMetadata,
            timestamps: newJson.timestamps
          };
        }

        const updateQuery = {
          text: `UPDATE "ToeicQuestionGroup" SET metadata = $1 WHERE id = $2`,
          values: [JSON.stringify(finalMetadata), group.id]
        };
        await client.query(updateQuery);
        updatedCount++;

      } catch (err) {
        console.error(`❌ Lỗi tại ${book} Test ${test} Range ${range}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n--- KẾT QUẢ CUỐI CÙNG ---');
    console.log(`Cập nhật thành công: ${updatedCount}`);
    console.log(`Thất bại: ${errorCount}`);

  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await client.end();
  }
}

updateDatabase();
