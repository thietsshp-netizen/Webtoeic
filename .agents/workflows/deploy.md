---
description: Deploy hoctoeic lên production (hoctoeic.com)
---

## Checklist Deploy hoctoeic.com

### 1. Cập nhật biến môi trường trên server/hosting

Các biến sau phải được cấu hình đúng trên môi trường production (Vercel, VPS, v.v.):

```env
# URL chính thức của app (QUAN TRỌNG - ảnh hưởng link email + OAuth)
NEXTAUTH_URL="https://hoctoeic.com"

# Database production (nếu khác local)
DATABASE_URL="..."
DIRECT_URL="..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://lvbdcqoagtrzvnaeeznm.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# NextAuth
NEXTAUTH_SECRET="WebToeicSieuCapVip2026"

# Google OAuth (nếu vẫn dùng)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Gmail gửi email thông báo
GMAIL_USER="thietsshp@toeicthiet.com"
GMAIL_APP_PASSWORD="gwxn pdhp xnqv jura"
ADMIN_EMAIL="thietsshp@toeicthiet.com"

# Prisma
PRISMA_CLIENT_ENGINE_TYPE="binary"
```

### 2. Cập nhật Google OAuth callback URL

Vào [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth Client:
- Thêm `https://hoctoeic.com` vào **Authorized JavaScript origins**
- Thêm `https://hoctoeic.com/api/auth/callback/google` vào **Authorized redirect URIs**

### 3. Build & Deploy

```bash
npm run build
```

Kiểm tra không có lỗi build trước khi deploy.

### 4. Chạy Prisma migrate (nếu schema có thay đổi)

```bash
npx prisma migrate deploy
```

### 5. Kiểm tra sau khi deploy

- [ ] Truy cập https://hoctoeic.com — trang chủ hiển thị đúng
- [ ] Bấm "Đăng nhập" → trang login hiện ra
- [ ] Admin đăng nhập được
- [ ] Tạo tài khoản học viên mới → email chào mừng gửi đến học viên
- [ ] Học viên đăng nhập → vào Dashboard được
- [ ] Học viên đổi mật khẩu → admin nhận email thông báo
- [ ] Xóa học viên → họ bị logout ngay lập tức
