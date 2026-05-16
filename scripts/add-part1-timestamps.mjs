import pg from 'pg';
import xlsx from 'xlsx';
import path from 'path';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const excelPath = path.resolve('Part 3_4 - create timestamp/Updated_Part1_Final_Fixed.xlsx');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  await client.connect();
  console.log('Connected to database.');

  console.log(`Reading Excel from: ${excelPath}`);
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  console.log(`Found ${data.length} rows in Excel.`);
  
  let updatedCount = 0;
  let notFoundCount = 0;
  let skippedCount = 0;

  for (const row of data) {
    const { Book, Test, QuestionNo, Timestamps } = row;
    
    if (!Book || !Test || !QuestionNo || !Timestamps) {
      continue;
    }

    let parsedTimestamps;
    try {
      parsedTimestamps = typeof Timestamps === 'string' ? JSON.parse(Timestamps) : Timestamps;
    } catch (e) {
      console.error(`Error parsing timestamps for ${Book} Test ${Test} Q${QuestionNo}:`, e);
      continue;
    }

    // Query finding group
    // We search by metadata -> 'Book' and 'Test' and questionNo in the questions table
    const query = `
      SELECT g.id, g.metadata
      FROM "ToeicQuestionGroup" g
      JOIN "ToeicPart" p ON g."partId" = p.id
      JOIN "ToeicQuestion" q ON q."groupId" = g.id
      WHERE p."partNumber" = 1
      AND (g.metadata->>'Book' = $1 OR g.metadata->>'book' = $1)
      AND (g.metadata->>'Test' = $2 OR g.metadata->>'test' = $2)
      AND q."questionNo" = $3
      LIMIT 1
    `;

    const res = await client.query(query, [String(Book), String(Test), Number(QuestionNo)]);

    if (res.rows.length === 0) {
      console.warn(`NOT FOUND: ${Book} Test ${Test} Q${QuestionNo}`);
      notFoundCount++;
      continue;
    }

    const group = res.rows[0];
    const currentMetadata = group.metadata || {};
    
    // Check if already has timestamps
    if (currentMetadata.timestamps && JSON.stringify(currentMetadata.timestamps) === JSON.stringify(parsedTimestamps)) {
      skippedCount++;
      continue;
    }

    const newMetadata = {
      ...currentMetadata,
      timestamps: parsedTimestamps
    };

    if (dryRun) {
      console.log(`[DRY RUN] Would update ${Book} Test ${Test} Q${QuestionNo} (Group ID: ${group.id})`);
    } else {
      await client.query('UPDATE "ToeicQuestionGroup" SET metadata = $1 WHERE id = $2', [JSON.stringify(newMetadata), group.id]);
      console.log(`UPDATED: ${Book} Test ${Test} Q${QuestionNo}`);
    }
    updatedCount++;
  }

  console.log('\n--- Result ---');
  console.log(`Total rows in Excel: ${data.length}`);
  console.log(`${dryRun ? 'Would update' : 'Updated'}: ${updatedCount}`);
  console.log(`Not found: ${notFoundCount}`);
  console.log(`Skipped (already up to date): ${skippedCount}`);

  await client.end();
}

main().catch(console.error);
