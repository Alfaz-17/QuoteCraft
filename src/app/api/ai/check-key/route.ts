import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let hasUserKey = false;

    // 1. Check if logged-in user has custom key in database
    if (session?.user) {
      const userId = (session.user as any).id;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { geminiApiKey: true }
        });
        if (user?.geminiApiKey) {
          hasUserKey = true;
        }
      }
    }

    // 2. Check if global system key exists in environment
    const hasSystemKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    return NextResponse.json({ hasKey: hasUserKey || hasSystemKey });
  } catch (error) {
    return NextResponse.json({ hasKey: false });
  }
}
