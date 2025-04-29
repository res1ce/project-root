import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Публичные пути, доступные без аутентификации
const publicPaths = ['/', '/login', '/api/auth/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем, является ли текущий путь публичным
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith('/images/') || pathname.startsWith('/_next/')
  );

  // Получаем токен из cookies
  const token = request.cookies.get('token')?.value;

  // Если путь не публичный и нет токена, перенаправляем на страницу входа
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Если пользователь уже вошел и пытается получить доступ к странице входа,
  // перенаправляем его на дашборд
  if (pathname === '/login' && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Определяем пути, для которых будет применяться middleware
export const config = {
  matcher: ['/((?!api/auth/login|_next/static|_next/image|images|favicon.ico).*)'],
}; 