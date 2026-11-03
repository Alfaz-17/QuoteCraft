import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function POST() {
  return NextResponse.json({ message: "Authentication migrated to Clerk" });
}
