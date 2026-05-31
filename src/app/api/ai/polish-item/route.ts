import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { findUserApiKey } from "@/lib/prisma";
import { polishItemDescription } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
    const apiKey = (await findUserApiKey(userId)) || "";
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
