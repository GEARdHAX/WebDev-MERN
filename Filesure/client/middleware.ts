import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth-storage');
  let isLoggedIn = false;

  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value);
      isLoggedIn = !!authData.state.userInfo?.token;
    } catch (error) {
      isLoggedIn = false;
    }
  }

  const { pathname } = request.nextUrl;

  // If user is logged in, redirect from auth pages to dashboard
  if (isLoggedIn && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not logged in, redirect from dashboard to login
  if (!isLoggedIn && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};