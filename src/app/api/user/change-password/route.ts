import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";

export async function POST() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Security and password changes are securely managed via your Clerk account profile.",
  });
}
