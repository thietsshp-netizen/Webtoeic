
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`
      SELECT metadata->>'PicType' as pic_type, count(*) as count
      FROM "ToeicQuestionGroup" 
      WHERE "partId" IN (SELECT id FROM "ToeicPart" WHERE "partNumber" = 1) 
      GROUP BY pic_type
      ORDER BY pic_type;
    `);
    console.log("--- PART 1 DATA STATISTICS ---");
    res.rows.forEach(row => {
      console.log(`${row.pic_type || 'Unknown'}: ${row.count}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
