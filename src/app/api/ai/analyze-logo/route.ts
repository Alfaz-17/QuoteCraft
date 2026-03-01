import { NextRequest, NextResponse } from "next/server";
import { analyzeLogoColors } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    const colors = await analyzeLogoColors(image);
    return NextResponse.json(colors);
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze logo" }, { status: 500 });
  }
}
