import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Danh sách các route cần kiểm tra IP và Quyền truy cập
const PROTECTED_ROUTES = ['/learn', '/courses', '/toeic'];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Bỏ qua nếu là tài nguyên tĩnh hoặc API công khai
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path === '/auth/signin'
  ) {
    return NextResponse.next();
  }

  // Kiểm tra xem route hiện tại có nằm trong vùng cần bảo vệ hay không
  const isProtected = PROTECTED_ROUTES.some(route => path.startsWith(route));

  if (isProtected) {
    // Ý tưởng cho logic khi đấu nối với Database thực tế:
    // 1. Lấy Session từ Cookie (NextAuth). Nếu chưa Login -> Redirect /auth/signin
    // 2. Lấy IP người dùng hiện tại từ req.ip hoặc req.headers.get('x-forwarded-for')
    // 3. Đẩy IP này đến 1 API (có Cache Redis hoặc Fast KV) để kiểm tra số lượng IP hiện tại.
    // 4. Nếu số lượng IP > 1 (trong khoảng 24h hoặc đang active) -> Trả về lỗi 403 Forbidden.
    
    // Tạm thời cho phép qua:
    // const ip = req.headers.get('x-forwarded-for') || req.ip;
    // console.log(`[Middleware] Checking access for IP: ${ip} on path: ${path}`);
  }

  // Thêm header security cho các Iframe
  const response = NextResponse.next();
  
  // Chặn không cho trang web khác nhúng trang của mình vào Iframe của họ (Clickjacking protection)
  // Nhưng vẫn cho phép mình nhúng trang tĩnh nội bộ
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  return response;
}

// Config để Middleware không chạy vào các static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
