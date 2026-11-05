import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { findUserApiKey } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { polishItemDescription } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`ai:polish:${userId}`, 30, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const apiKey = (await findUserApiKey(userId)) || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API Key not configured. Please add your key in Settings." },
        { status: 400 }
      );
    }

    const { description } = await req.json();
    if (!description) {
      return NextResponse.json({ error: "No description provided" }, { status: 400 });
    }

    const polished = await polishItemDescription(description, apiKey);
    return NextResponse.json({ polished });
  } catch (error) {
    console.error("Polish item error:", error);
    return NextResponse.json({ error: "Failed to polish description" }, { status: 500 });
  }
}
