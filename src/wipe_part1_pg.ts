
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function wipe() {
  console.log("Starting Part 1 wipe using pg...");
  try {
    const res = await pool.query(`
      DELETE FROM "ToeicQuestionGroup" 
      WHERE "partId" IN (SELECT id FROM "ToeicPart" WHERE "partNumber" = 1);
    `);
    console.log(`Successfully deleted ${res.rowCount} Question Groups.`);
  } catch (err) {
    console.error("Wipe failed:", err);
  } finally {
    await pool.end();
  }
}

wipe();
