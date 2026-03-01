import { NextRequest, NextResponse } from "next/server";
import { generateCommercialTerms } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    if (!items) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }
    const terms = await generateCommercialTerms(items);
    return NextResponse.json({ terms });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate terms" }, { status: 500 });
  }
}
