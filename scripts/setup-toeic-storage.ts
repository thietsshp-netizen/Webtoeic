const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Lỗi: Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  const BUCKET_NAME = 'toeic-media';
  
  console.log(`--- Đang kiểm tra/khởi tạo Bucket: ${BUCKET_NAME} ---`);

  try {
    // 1. Kiểm tra xem bucket đã tồn tại chưa
    const { data: buckets, error: getError } = await supabase.storage.listBuckets();
    if (getError) throw getError;

    const exists = buckets?.some((b: any) => b.name === BUCKET_NAME) ?? false;

    if (!exists) {
      console.log(`🚀 Đang tạo bucket mới: ${BUCKET_NAME}...`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Cho phép truy cập URL trực tiếp
        allowedMimeTypes: ['image/*', 'audio/*'],
        fileSizeLimit: 10485760 // 10MB
      });
      if (createError) throw createError;
      console.log(`✅ Đã tạo thành công bucket: ${BUCKET_NAME}`);
    } else {
      console.log(`ℹ️ Bucket ${BUCKET_NAME} đã tồn tại.`);
      
      // Update to make sure it is public
      const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
        public: true
      });
      if (updateError) console.warn('⚠️ Không thể update thuộc tính public của bucket:', updateError.message);
    }

    console.log('--- Cấu hình Storage hoàn tất ---');
  } catch (error: any) {
    console.error('❌ Lỗi cấu hình Storage:', error.message);
  }
}

setupStorage();
