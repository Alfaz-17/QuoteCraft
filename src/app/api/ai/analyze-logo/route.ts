import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeLogoColors } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userApiKey = "";

    // 1. If user is logged in, try to fetch their custom Gemini API Key from database
    if (session?.user) {
      const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { geminiApiKey: true }
        });
        if (user?.geminiApiKey) {
          userApiKey = user.geminiApiKey;
        }
      }
    }

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API Key is not configured. Please supply a key in Settings." },
        { status: 400 }
      );
    }

    const colors = await analyzeLogoColors(image, apiKey);
    return NextResponse.json(colors);
  } catch (error: any) {
    console.error("AI Logo Analysis Error:", error);
    const errMsg = error?.message || String(error);
    let friendlyMessage = "Failed to analyze logo colors.";
    
    if (
      errMsg.includes("API key not valid") || 
      errMsg.includes("API_KEY_INVALID") || 
      errMsg.includes("expired") ||
      errMsg.includes("invalid key")
    ) {
      friendlyMessage = "Your Gemini API Key is invalid or expired. Please check your key in Settings.";
    }

    return NextResponse.json({ error: friendlyMessage }, { status: 500 });
  }
}
