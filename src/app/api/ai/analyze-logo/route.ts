import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { findUserApiKey } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyzeLogoColors } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`ai:logo:${userId}`, 15, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    let userApiKey = "";
    userApiKey = (await findUserApiKey(userId)) ?? "";

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API Key is missing. Please add your key in Settings." },
        { status: 400 }
      );
    }

    const colors = await analyzeLogoColors(image, apiKey);
    return NextResponse.json({ colors });
  } catch (error) {
    console.error("Analyze Logo Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze logo colors" },
      { status: 500 }
    );
  }
}
