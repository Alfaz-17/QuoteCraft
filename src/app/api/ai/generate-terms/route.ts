import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { findUserApiKey } from "@/lib/prisma";
import { generateCommercialTerms } from "@/lib/ai-service";

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

    const { items } = await req.json();
    if (!items) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const terms = await generateCommercialTerms(items, apiKey);
    return NextResponse.json({ terms });
  } catch (error) {
    console.error("Generate terms error:", error);
    return NextResponse.json({ error: "Failed to generate terms" }, { status: 500 });
  }
}
