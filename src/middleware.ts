import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/landing(.*)",
  "/login(.*)",
  "/register(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/robots.txt",
  "/icon.png",
  "/apple-touch-icon.png",
]);

export default clerkMiddleware(async (auth, request) => {
  // Do not redirect API routes to HTML sign-in; API routes enforce their own auth with 401 JSON
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return;
  }

  // If user is accessing a protected route, verify authentication
  if (!isPublicRoute(request)) {
    try {
      const { userId } = await auth();
      if (!userId) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect_url", request.url);
        return NextResponse.redirect(signInUrl);
      }
    } catch (err) {
      console.error("Clerk edge auth verification notice:", err);
      // Gracefully redirect to sign-in on auth errors rather than failing with 500
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
