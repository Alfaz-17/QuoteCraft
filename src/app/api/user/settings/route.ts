import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { findUserApiKey, updateUserGeminiKey } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const geminiApiKey = await findUserApiKey(userId);
    const hasKey = !!geminiApiKey;
    const maskedKey = hasKey ? "••••••••••••••••" : "";

    return NextResponse.json({ geminiApiKey: maskedKey, hasKey });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load user settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
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
