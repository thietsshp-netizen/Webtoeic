
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`
      SELECT metadata->>'PicType' as pic_type, transcript, "audioUrl"
      FROM "ToeicQuestionGroup" 
      WHERE metadata->>'PicType' LIKE '%hành động tay%'
      LIMIT 10;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
