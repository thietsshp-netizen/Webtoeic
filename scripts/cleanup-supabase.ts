import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lvbdcqoagtrzvnaeeznm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YmRjcW9hZ3RyenZuYWVlem5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM4NTAzOCwiZXhwIjoyMDkwOTYxMDM4fQ.k2hshbZxEgAanCWKNsxEpw9pHQ2bsMlEvbUqmu9L38M";
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log('--- Đang bắt đầu dọn dẹp (Supabase Mode) ---');
  
  try {
    // 1. Xóa Lessons
    const { error: eLes } = await supabase
      .from('Lesson')
      .delete()
      .like('id', 'temp%');
    
    if (eLes) throw eLes;
    console.log('✅ Bài học rác đã được quét sạch.');

    // 2. Xóa Sections
    const { error: eSec } = await supabase
      .from('Section')
      .delete()
      .like('id', 'temp%');
      
    if (eSec) throw eSec;
    console.log('✅ Chương rác đã được quét sạch.');

    console.log('--- Hệ thống đã sẵn sàng cho Bài 10 ---');
  } catch (error: any) {
    console.error('❌ Lỗi dọn dẹp:', error.message || error);
  }
}

cleanup();

export {};
