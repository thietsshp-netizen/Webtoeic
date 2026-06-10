import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const backupFile = process.argv[2];
  if (!backupFile) {
    console.error("❌ Lỗi: Vui lòng truyền đường dẫn file backup.");
    console.log("Cách dùng: node scripts/restore_metadata.mjs /Users/thietphamvan/hoctoeic/Webtoeic/scratch/metadata_backup_[timestamp].json");
    process.exit(1);
  }

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Lỗi: Không tìm thấy file backup tại: ${backupFile}`);
    process.exit(1);
  }

  console.log(`⚠️ BẮT ĐẦU KHÔI PHỤC METADATA TỪ BACKUP: ${path.basename(backupFile)}`);
  
  try {
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`- Đọc thành công ${backupData.length} bản ghi backup.`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let restoredCount = 0;
      for (const item of backupData) {
        await client.query(
          'UPDATE "ToeicQuestionGroup" SET metadata = $1 WHERE id = $2',
          [JSON.stringify(item.metadata), item.id]
        );
        restoredCount++;
      }
      
      await client.query('COMMIT');
      console.log(`✅ KHÔI PHỤC THÀNH CÔNG: Đã đưa ${restoredCount} bản ghi về trạng thái cũ.`);
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Lỗi trong quá trình khôi phục:", error.message);
  } finally {
    await pool.end();
  }
}

run();
