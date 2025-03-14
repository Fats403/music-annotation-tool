import {
  clerkMiddleware,
  createRouteMatcher,
  currentUser,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId, redirectToSignIn } = await auth();
    // First check if user is authenticated
    if (!userId) {
      return redirectToSignIn();
    }

    // Get whitelist from environment variable
    const whitelist = process.env.WHITELISTED_EMAILS?.split(",") || [];

    // Check if user's email is in the whitelist
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    if (!userEmail || !whitelist.includes(userEmail)) {
      return NextResponse.json(
        { error: "Forbidden: User not in whitelist" },
        { status: 403 }
      );
    }

    // User is authenticated and in whitelist, proceed
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
