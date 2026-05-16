
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`
      SELECT "imageUrl", "audioUrl"
      FROM "ToeicQuestionGroup" 
      WHERE "partId" IN (SELECT id FROM "ToeicPart" WHERE "partNumber" = 1)
      LIMIT 1;
    `);
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
