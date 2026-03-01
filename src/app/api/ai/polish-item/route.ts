import { NextRequest, NextResponse } from "next/server";
import { polishItemDescription } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();
    if (!description) {
      return NextResponse.json({ error: "No description provided" }, { status: 400 });
    }
    const polished = await polishItemDescription(description);
    return NextResponse.json({ polished });
  } catch (error) {
    return NextResponse.json({ error: "Failed to polish description" }, { status: 500 });
  }
}
