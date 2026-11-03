import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { findUserApiKey } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    let hasUserKey = false;

    // 1. Check if logged-in user has custom key in database
    if (userId) {
      const key = await findUserApiKey(userId);
      if (key) hasUserKey = true;
    }

    return NextResponse.json({ hasKey: hasUserKey });
  } catch {
    return NextResponse.json({ hasKey: false });
  }
}
