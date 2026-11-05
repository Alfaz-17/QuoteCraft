import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
]);

const middleware = clerkMiddleware(async (auth, request) => {
  // Do not redirect API routes to HTML sign-in; API routes enforce their own auth with 401 JSON
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return;
  }

  try {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  } catch (err) {
    console.error("Auth middleware protection notice:", err);
    // If it's a public route, safely allow access rather than failing with 500
    if (isPublicRoute(request)) {
      return;
    }
    throw err;
  }
});

export default middleware;
export const proxy = middleware;

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
