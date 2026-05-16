
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const resTotal = await pool.query(`
      SELECT count(*) as total
      FROM "ToeicQuestionGroup" 
      WHERE "partId" IN (SELECT id FROM "ToeicPart" WHERE "partNumber" = 1);
    `);
    
    const resNoPicType = await pool.query(`
      SELECT count(*) as count
      FROM "ToeicQuestionGroup" 
      WHERE "partId" IN (SELECT id FROM "ToeicPart" WHERE "partNumber" = 1)
      AND (metadata->>'PicType' IS NULL OR metadata->>'PicType' = '');
    `);

    const resMetadata = await pool.query(`
      SELECT metadata 
      FROM "ToeicQuestionGroup" 
      WHERE "partId" IN (SELECT id FROM "ToeicPart" WHERE "partNumber" = 1)
      LIMIT 1;
    `);

    console.log("Total Part 1 Groups:", resTotal.rows[0].total);
    console.log("Groups with NO PicType:", resNoPicType.rows[0].count);
    if (resMetadata.rows.length > 0) {
      console.log("Metadata sample:", JSON.stringify(resMetadata.rows[0].metadata));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
