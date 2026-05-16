import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
};

// Khởi tạo Client bằng hàm (Lazy-load) để tránh crash lúc boot server
export const getSupabaseAdmin = () => {
  const { url, serviceKey } = getSupabaseConfig();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
};

export const getSupabasePublic = () => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
};
