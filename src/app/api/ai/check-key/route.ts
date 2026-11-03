import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { findUserApiKey } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let hasUserKey = false;

    // 1. Check if logged-in user has custom key in database
    if (session?.user) {
      const userId = (session.user as { id?: string }).id;
      if (userId) {
        const key = await findUserApiKey(userId);
        if (key) hasUserKey = true;
      }
    }

    return NextResponse.json({ hasKey: hasUserKey });
  } catch {
    return NextResponse.json({ hasKey: false });
  }
}
