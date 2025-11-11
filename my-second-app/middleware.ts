import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = ['/dashboard', '/activity'];

export function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for authentication token in cookies or headers
    // For now, we'll just let the client-side handle it
    // But we could add server-side validation here
    
    // Example of server-side check (uncomment if needed):
    /*
    const authCookie = request.cookies.get('absensi_auth');
    if (!authCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    */
  }

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
     * - public (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};