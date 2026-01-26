import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for auth token in cookies, localStorage, or Authorization header
    const authStorage = request.cookies.get('auth-storage');
    const authorizationHeader = request.headers.get('authorization');

    let isAuthenticated = false;

    // Check cookie storage (Zustand persist)
    if (authStorage) {
        try {
            const authData = JSON.parse(authStorage.value);
            isAuthenticated = authData?.state?.isAuthenticated === true;
        } catch {
            isAuthenticated = false;
        }
    }

    // Also check Authorization header
    if (!isAuthenticated && authorizationHeader) {
        isAuthenticated = authorizationHeader.startsWith('Bearer ');
    }

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    );

    // Check if it's an auth route
    const isAuthRoute = authRoutes.some(route =>
        pathname.startsWith(route)
    );

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !isAuthenticated) {
        // TODO: Enable for production - currently disabled to prevent redirect loops during development
        // For production, uncomment the line below:
        // return NextResponse.redirect(new URL('/login', request.url));
        return NextResponse.next();
    }

    // Redirect authenticated users from auth routes to dashboard
    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
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
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
    ],
};
