import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { geminiApiKey: true }
    });

    // If key exists, mask it for safety
    const hasKey = !!user?.geminiApiKey;
    const maskedKey = hasKey ? "••••••••••••••••" : "";

    return NextResponse.json({
      geminiApiKey: maskedKey,
      hasKey
    });
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

    // If they send masked key, do not overwrite existing key
    if (geminiApiKey === "••••••••••••••••") {
      return NextResponse.json({ message: "Settings unchanged" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        geminiApiKey: geminiApiKey || null // Clear if they send empty string
      }
    });

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save user settings" }, { status: 500 });
  }
}
