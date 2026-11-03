import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { getRecentClients } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clients = await getRecentClients(userId);
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Recent Clients Error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}
