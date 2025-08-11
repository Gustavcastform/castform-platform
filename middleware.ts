import { auth } from "./app/lib/auth"
import { NextResponse, NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('🛡️ Middleware check: ', {
    pathname: req.nextUrl.pathname,
  });

  // Get the session using Auth.js
  const session = await auth()

  console.log('🔍 Session check:', {
    hasSession: !!session,
    userEmail: session?.user?.email || 'none'
  });

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/agents',
    '/billing',
    '/calendar',
    '/calls',
    '/contacts',
    '/profile'
  ];

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !session) {
    console.log('🚫 Access denied: redirecting to landing page from', req.nextUrl.pathname);
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If user is authenticated and trying to access landing page, redirect to profile
  if (req.nextUrl.pathname === '/' && session) {
    console.log('✅ Authenticated user accessing landing page: redirecting to profile');
    return NextResponse.redirect(new URL('/profile', req.url));
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 