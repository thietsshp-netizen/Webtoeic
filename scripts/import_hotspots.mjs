import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const JSON_PATH = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 1/PicDetail.json';
const BACKUP_DIR = '/Users/thietphamvan/hoctoeic/Webtoeic/scratch';

async function run() {
  const dryRun = process.env.DRY_RUN === 'true';
  console.log(`==================================================`);
  console.log(dryRun ? '🚀 KHỞI CHẠY CHẾ ĐỘ: DRY-RUN (KIỂM THỬ KHÔNG GHI)' : '🔥 KHỞI CHẠY CHẾ ĐỘ: CẬP NHẬT THẬT VÀO DATABASE');
  console.log(`==================================================`);

  try {
    // 1. Đọc và parse dữ liệu JSON từ file PicDetail.json
    if (!fs.existsSync(JSON_PATH)) {
      throw new Error(`Không tìm thấy file JSON tại đường dẫn: ${JSON_PATH}`);
    }
    const jsonContent = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`[1] Đọc thành công ${jsonContent.length} ảnh từ file JSON.`);

    // 2. Lấy dữ liệu hiện tại từ Database
    console.log('[2] Đang truy vấn dữ liệu từ Database...');
    const dbRes = await pool.query(`
      SELECT qg.id, qg."imageUrl", qg.metadata 
      FROM "ToeicQuestionGroup" qg
      JOIN "ToeicPart" p ON qg."partId" = p.id
      WHERE p."partNumber" = 1
    `);
    const dbGroups = dbRes.rows;
    console.log(`    Tìm thấy ${dbGroups.length} nhóm câu hỏi Part 1 trên Database.`);

    // 3. Thực hiện so khớp kiểm tra tính toàn vẹn 100% trước khi làm bất kỳ việc gì khác
    console.log('[3] Bắt đầu so khớp dữ liệu...');
    let matchCount = 0;
    const updateTasks = [];

    for (const item of jsonContent) {
      const foundGroup = dbGroups.find(g => g.imageUrl && g.imageUrl.endsWith('/' + item.image_name));
      if (foundGroup) {
        matchCount++;
        updateTasks.push({
          groupId: foundGroup.id,
          imageUrl: foundGroup.imageUrl,
          oldMetadata: foundGroup.metadata || {},
          newHotspots: item.hotspots
        });
      } else {
        console.warn(`    ⚠️ CẢNH BÁO: Không tìm thấy ảnh "${item.image_name}" trên Database!`);
      }
    }

    console.log(`    Kết quả so khớp: Khớp thành công ${matchCount}/${jsonContent.length} ảnh.`);

    // RÀNG BUỘC TOÀN VẸN: Nếu không khớp 100% tuyệt đối thì dừng chương trình
    if (matchCount !== jsonContent.length || matchCount !== dbGroups.length) {
      throw new Error(`RÀNG BUỘC THẤT BẠI: Số lượng ảnh không khớp hoàn hảo (Khớp: ${matchCount}, JSON: ${jsonContent.length}, DB: ${dbGroups.length}). Dừng toàn bộ chương trình để bảo vệ dữ liệu.`);
    }
    console.log('    ✅ So khớp hoàn hảo 100%. Tiếp tục bước tiếp theo.');

    // 4. Tạo file backup dữ liệu metadata cũ để đề phòng rủi ro
    console.log('[4] Đang tạo file backup dữ liệu cũ...');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const timestamp = Date.now();
    const backupPath = path.join(BACKUP_DIR, `metadata_backup_${timestamp}.json`);
    
    // Lưu các bản ghi metadata cũ dạng danh sách
    const backupData = dbGroups.map(g => ({
      id: g.id,
      imageUrl: g.imageUrl,
      metadata: g.metadata
    }));
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`    ✅ Đã lưu file backup an toàn tại: ${backupPath}`);

    // 5. Tiến hành cập nhật
    if (dryRun) {
      console.log('\n[5] [DRY-RUN] Kiểm tra thử một bản ghi cập nhật mẫu:');
      const sample = updateTasks[0];
      const mergedMetadata = {
        ...sample.oldMetadata,
        hotspots: sample.newHotspots
      };
      console.log(`    - ID Nhóm: ${sample.groupId}`);
      console.log(`    - Đường dẫn ảnh: ${sample.imageUrl}`);
      console.log(`    - Metadata cũ:`, JSON.stringify(sample.oldMetadata));
      console.log(`    - Metadata mới sau khi gộp hotspots:`, JSON.stringify(mergedMetadata));
      console.log(`\n==================================================`);
      console.log('✅ DRY-RUN THÀNH CÔNG: Dữ liệu hoàn toàn an toàn và sẵn sàng import thật.');
      console.log(`==================================================`);
    } else {
      console.log('[5] Bắt đầu ghi dữ liệu vào Database...');
      
      // Chạy toàn bộ tiến trình cập nhật trong 1 transaction duy nhất để đảm bảo tính toàn vẹn
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        let updatedCount = 0;
        for (const task of updateTasks) {
          const mergedMetadata = {
            ...task.oldMetadata,
            hotspots: task.newHotspots
          };
          
          await client.query(
            'UPDATE "ToeicQuestionGroup" SET metadata = $1 WHERE id = $2',
            [JSON.stringify(mergedMetadata), task.groupId]
          );
          updatedCount++;
        }
        
        await client.query('COMMIT');
        console.log(`\n==================================================`);
        console.log(`✅ CẬP NHẬT THÀNH CÔNG: Đã import hotspots cho ${updatedCount} câu hỏi.`);
        console.log(`==================================================`);
      } catch (transactionError) {
        await client.query('ROLLBACK');
        throw transactionError;
      } finally {
        client.release();
      }
    }

  } catch (error) {
    console.error(`\n❌ LỖI HỆ THỐNG:`, error.message);
    console.log('❌ Tiến trình đã bị dừng. Không có bất kỳ thay đổi nào được thực hiện trên Database.');
  } finally {
    await pool.end();
  }
}

run();
