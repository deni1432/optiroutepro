import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', // Protects all routes under /dashboard
  // Add any other routes here that need protection
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    // The 'auth' object passed to clerkMiddleware is the one to inspect
    // It should have the userId if the session is active
    auth.protect(); // Call protect directly on the auth object
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|static|favicon.ico|.*\\..*).*)',
    // Match all routes including the root
    '/',
  ],
};