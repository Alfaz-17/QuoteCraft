import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { findUserApiKey, updateUserGeminiKey } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const geminiApiKey = await findUserApiKey(userId);
    const hasKey = !!geminiApiKey;
    const maskedKey = hasKey ? "••••••••••••••••" : "";

    return NextResponse.json({ geminiApiKey: maskedKey, hasKey });
  } catch {
    return NextResponse.json({ error: "Failed to load user settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { geminiApiKey } = await req.json();

    if (geminiApiKey === "••••••••••••••••") {
      return NextResponse.json({ message: "Settings unchanged" });
    }

    await updateUserGeminiKey(userId, geminiApiKey || null);
    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to save user settings" }, { status: 500 });
  }
}
