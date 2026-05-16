import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Thiếu URL hoặc Service Key trong .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bucketName = 'lessons';

async function cleanup() {
  console.log(`Đang quét dọn bucket '${bucketName}'...`);
  
  const { data: files, error: listError } = await supabase.storage.from(bucketName).list();
  
  if (listError) {
    console.error("Lỗi liệt kê file:", listError.message);
    return;
  }

  if (files.length === 0) {
    console.log("Bucket đã sạch!");
    return;
  }

  const fileNames = files.map(f => f.name);
  const { error: deleteError } = await supabase.storage.from(bucketName).remove(fileNames);

  if (deleteError) {
    console.error("Lỗi xóa file:", deleteError.message);
  } else {
    console.log(`Đã xóa thành công ${files.length} file:`, fileNames);
  }
}

cleanup();
