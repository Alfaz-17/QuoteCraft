import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { findUserApiKey } from "@/lib/prisma";
import { analyzeLogoColors } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    let userApiKey = "";

    // 1. If user is logged in, try to fetch their custom Gemini API Key from database
    if (userId) {
      userApiKey = (await findUserApiKey(userId)) ?? "";
    }

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = userApiKey;
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
