import { clerkMiddleware, createRouteMatcher, clerkClient as getClerkClientInstance } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', // Protects all routes under /dashboard
  '/api/create-checkout-session(.*)', // User needs to be logged in to create session
  '/api/geocode(.*)', // Protect these APIs too
  '/api/optimize-route(.*)',
  // Add any other routes here that need basic auth protection
]);

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/', // Landing page
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stripe-webhooks(.*)', // Stripe webhook needs to be public but secured separately
  '/api/create-stripe-customer(.*)', // Assuming this might be called via webhook or client-side post-signup
  // Add other public API routes or pages if needed
]);

export default clerkMiddleware(async (auth, req) => {
  // Special handling for Stripe webhooks - bypass Clerk completely
  if (req.nextUrl.pathname.startsWith('/api/stripe-webhooks')) {
    return NextResponse.next();
  }

  // If it's a public route, do nothing (allow access)
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // If it's not public and not protected (e.g., some other random route),
  // this middleware doesn't need to do anything specific beyond Clerk's default handling.
  // However, if it IS a protected route and the user is not logged in, protect it.
  if (isProtectedRoute(req)) {
    // auth.protect() handles redirecting unauthenticated users for protected routes
    auth.protect();

    // If we reach here, the user IS authenticated for the protected route.
    // Now, check specifically for the dashboard route and subscription status.
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const { userId } = await auth(); // Await the auth() promise
      if (userId) {
        try {
          // Check for the subscription status in public metadata
          const clerkClient = await getClerkClientInstance(); // Await the client instance
          const user = await clerkClient.users.getUser(userId);
          const hasSubscription = user.publicMetadata?.hasActiveSubscription === true;
          console.log(`[MIDDLEWARE] Dashboard access: userId: ${userId}, hasSubscription: ${hasSubscription}`);

          if (!hasSubscription) {
            // If no active subscription, redirect to pricing page
            console.log('[MIDDLEWARE] No active subscription, redirecting to /pricing (test)');
            const pricingUrl = new URL('/pricing', req.url); // Changed to /pricing
            return NextResponse.redirect(pricingUrl);
          }
          // If user has subscription, allow access to dashboard (fall through to NextResponse.next())
          console.log('[MIDDLEWARE] Active subscription found, allowing access to dashboard.');

        } catch (error: any) { // Add :any to type error for accessing message
          console.error("[MIDDLEWARE] Error fetching user metadata in middleware. Error message:", error.message, "Full error:", error);
          // Fallback: Redirect to home if user fetch fails
          const homeUrl = new URL('/', req.url);
          return NextResponse.redirect(homeUrl);
        }
      } else {
         // Should not happen if auth.protect() worked, but as a safeguard:
         console.log('[MIDDLEWARE] No userId found after auth.protect() for /dashboard, redirecting to /sign-in');
         const signInUrl = new URL('/sign-in', req.url);
         return NextResponse.redirect(signInUrl);
      }
    }
  }

  // Allow the request to proceed if it's public,
  // or if it's protected & authenticated (and passed the dashboard subscription check if applicable)
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|static|favicon.ico|.*\\..*).*)',
    // Match all routes including the root
    '/',
  ],
};