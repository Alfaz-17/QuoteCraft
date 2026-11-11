import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse, NextFetchEvent } from "next/server";

// Public routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/landing(.*)",
  "/login(.*)",
  "/register(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/admin/login(.*)",
  "/api/webhooks(.*)",
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/robots.txt",
  "/icon.png",
  "/apple-touch-icon.png",
]);

// Protected Clerk edge middleware handler
const clerkHandler = clerkMiddleware(async (auth, request) => {
  // Do not redirect API routes to HTML sign-in; API routes enforce their own auth with 401 JSON
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return;
  }

  // If user is accessing a protected route, verify authentication
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

/**
 * Bulletproof Next.js Middleware:
 * 1. Skips static assets and internal Next.js requests.
 * 2. Checks if Clerk keys are present in the Edge environment.
 * 3. If keys are missing, gracefully redirects unauthorized visits to /sign-in without throwing 500 MIDDLEWARE_INVOCATION_FAILED.
 * 4. Catches any transient edge runtime errors and redirects safely.
 */
export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;

  // Skip static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/icon.png") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_dmlhYmxlLXRlcnJpZXItNjMuY2xlcmsuYWNjb3VudHMuZGV2JA";
  const secretKey = process.env.CLERK_SECRET_KEY;

  // If Clerk keys are missing on Edge, protect routes safely without crashing Vercel with 500
  if (!publishableKey || !secretKey) {
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Delegate to Clerk with error protection
  try {
    return await clerkHandler(request, event);
  } catch (err) {
    console.error("Clerk edge middleware error caught safely:", err);
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
